package com.capstone.rebyu.common;

import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Deletes rows together with everything that depends on them.
 *
 * <p>Almost every foreign key in this schema is NO ACTION, so a plain {@code DELETE} of a row
 * that anything references fails. This walks the dependents instead: every foreign key that
 * points at the table (read once from the catalog, so new tables are covered without code
 * changes), recursively, deepest first, plus the "soft" references in {@link #SOFT_REFERENCES} --
 * id columns with no foreign key (e.g. {@code assessment_attempts.learner_id}) that a
 * foreign-key walk alone cannot see.
 *
 * <p>Two kinds of reference are cleared instead of deleted, when the column allows NULL:
 * attribution ({@code created_by} and friends -- deleting an admin must not delete what they
 * made) and the {@link #DETACH_COLUMNS} links from an independent record to something it merely
 * points at (an enrollment to the order line that paid for it, a post to a shared library item).
 *
 * <p>Each level fetches the matching child ids once and stops on an empty branch, and the
 * schema map is cached, so a delete costs roughly one query per table that actually holds
 * related rows -- not one per possible path (at ~56 ms a round trip, that difference is minutes).
 *
 * <p>Runs on the caller's transaction, so a failure anywhere rolls the whole delete back.
 * Callers holding JPA entities for these rows must flush before and clear after.
 */
@Slf4j
@Service
public class CascadeDeleteService {

    private static final int MAX_DEPTH = 16;
    private static final int CHUNK = 10_000;

    static final Set<String> ATTRIBUTION_COLUMNS = Set.of(
            "created_by", "invited_by", "assigned_by",
            "reviewed_by_user_id", "uploaded_by_user_id", "verified_by_user_id");

    /** Links from an independent record to something it only points at: cleared, never cascaded. */
    static final Set<String> DETACH_COLUMNS = Set.of("order_detail_id", "shared_library_item_id");

    /** parent table -> id columns elsewhere that reference it WITHOUT a foreign key. */
    static final Map<String, List<SoftReference>> SOFT_REFERENCES = Map.of(
            "learners", List.of(
                    new SoftReference("assessment_attempts", "learner_id"),
                    new SoftReference("ai_generation_usage", "learner_id"),
                    new SoftReference("learner_activity_progress", "learner_id"),
                    new SoftReference("learner_bank_cycles", "learner_id"),
                    new SoftReference("learner_reward_ledger", "learner_id"),
                    new SoftReference("learner_reward_balances", "learner_id"),
                    new SoftReference("bkt_event_outbox", "learner_id"),
                    new SoftReference("learner_skill_states", "learner_id"),
                    new SoftReference("lesson_dialogue_completions", "learner_id"),
                    new SoftReference("lesson_dialogue_sessions", "learner_id"),
                    new SoftReference("reflection_submissions", "learner_id"),
                    new SoftReference("tutor_safety_alerts", "learner_id"),
                    new SoftReference("tutor_conduct", "learner_id"),
                    new SoftReference("world_cup_queue", "learner_id"),
                    new SoftReference("institution_learner_records", "learner_id")),
            "lessons", List.of(
                    new SoftReference("lesson_images", "lesson_id"),
                    new SoftReference("lesson_videos", "lesson_id"),
                    new SoftReference("lesson_dialogue_sessions", "lesson_id"),
                    new SoftReference("lesson_dialogue_completions", "lesson_id"),
                    new SoftReference("learner_skill_states", "lesson_id"),
                    new SoftReference("learner_review_items", "lesson_id"),
                    new SoftReference("live_teaching_sessions", "lesson_id")),
            "learner_library_items", List.of(
                    new SoftReference("learner_activity_progress", "library_item_id")),
            "institutions", List.of(
                    new SoftReference("institution_certificate_archives", "institution_id"),
                    new SoftReference("institution_learner_records", "institution_id")),
            "users", List.of(
                    new SoftReference("user_activity_days", "user_id"),
                    new SoftReference("live_teaching_sessions", "user_id")),
            "certifications", List.of(
                    new SoftReference("learner_bank_cycles", "certification_id"),
                    new SoftReference("certification_exam_sections", "certification_id"),
                    new SoftReference("world_cup_queue", "certification_id"),
                    new SoftReference("world_cup_brackets", "certification_id"),
                    new SoftReference("world_cup_editions", "certification_id"),
                    new SoftReference("institution_certificate_archives", "certification_id"),
                    new SoftReference("institution_learner_records", "certification_id"),
                    new SoftReference("generation_requests", "certification_id"),
                    new SoftReference("knowledge_documents", "certification_id"),
                    new SoftReference("learner_notes", "certification_id"),
                    new SoftReference("study_plan", "certification_id"),
                    new SoftReference("learner_review_items", "certification_id")));

    record SoftReference(String table, String column) {
    }

    private record Reference(String childTable, String childColumn, String parentColumn) {
    }

    /** The parts of the catalog the walk needs, loaded once. */
    private record Schema(Map<String, List<Reference>> referencesTo,
                          Map<String, String> primaryKey,
                          Set<String> nullableColumns,
                          Set<String> tables) {
    }

    private final JdbcTemplate jdbc;
    private final NamedParameterJdbcTemplate named;
    private volatile Schema schema;

    /* Deleting a learner, enrollment, invitation or department frees seats. Lazy: the
       ledger lives in a feature package and must not create a construction cycle. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private com.capstone.rebyu.institution.service.SeatLedgerService seats;

    private static final Set<String> SEAT_TABLES = Set.of(
            "users", "learners", "institution_certification_learners", "learner_invitations",
            "department_learners", "departments", "institution_certificates", "institutions");

    private void recountSeatsIfNeeded(Map<String, Integer> removed) {
        if (seats != null && removed.keySet().stream().anyMatch(SEAT_TABLES::contains)) {
            seats.recountAfterCommit();
        }
    }

    public CascadeDeleteService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
        this.named = new NamedParameterJdbcTemplate(jdbc);
    }

    /** Deletes the rows and all their dependents. Returns rows removed per table (for logs/tests). */
    @Transactional
    public Map<String, Integer> delete(String table, String keyColumn, Collection<Long> ids) {
        Map<String, Integer> removed = new LinkedHashMap<>();
        List<Object> keys = existing(table, keyColumn, ids);
        if (keys.isEmpty()) return removed;
        deleteDescendants(table, keyColumn, keys, 0, removed);
        int count = deleteWhereIn(table, keyColumn, keys);
        removed.merge(table, count, Integer::sum);
        log.info("Cascade-deleted {} {} row(s) {}: {}", count, table, ids, removed);
        recountSeatsIfNeeded(removed);
        return removed;
    }

    @Transactional
    public Map<String, Integer> delete(String table, String keyColumn, Long id) {
        return delete(table, keyColumn, List.of(id));
    }

    /** Deletes only what depends on the rows, leaving the rows themselves (for callers that delete them via JPA). */
    @Transactional
    public Map<String, Integer> deleteDependents(String table, String keyColumn, Collection<Long> ids) {
        Map<String, Integer> removed = new LinkedHashMap<>();
        List<Object> keys = existing(table, keyColumn, ids);
        if (!keys.isEmpty()) deleteDescendants(table, keyColumn, keys, 0, removed);
        if (!keys.isEmpty()) {
            // The caller deletes the rows themselves next, so count them as removed here.
            removed.putIfAbsent(table, 0);
            recountSeatsIfNeeded(removed);
        }
        return removed;
    }

    /** How many rows reference the given row directly, by foreign key: for "in use" refusals. */
    public long countReferences(String table, Long id) {
        long total = 0;
        for (Reference ref : schema().referencesTo().getOrDefault(table, List.of())) {
            Long n = jdbc.queryForObject("SELECT count(*) FROM " + ref.childTable()
                    + " WHERE " + q(ref.childColumn()) + " = ?", Long.class, id);
            total += n == null ? 0 : n;
        }
        return total;
    }

    /** Forget the cached catalog (after a schema change while running). */
    public void refreshSchema() {
        schema = null;
    }

    // ---- the walk ------------------------------------------------------------------------------

    private void deleteDescendants(String parentTable, String parentKey, List<Object> parentKeys, int depth,
                                   Map<String, Integer> removed) {
        if (depth >= MAX_DEPTH) {
            throw new IllegalStateException("Cascade below " + parentTable + " is deeper than " + MAX_DEPTH);
        }
        Schema s = schema();
        List<Reference> references = new ArrayList<>(s.referencesTo().getOrDefault(parentTable, List.of()));
        for (SoftReference soft : SOFT_REFERENCES.getOrDefault(parentTable, List.of())) {
            if (s.tables().contains(soft.table())) {
                references.add(new Reference(soft.table(), soft.column(), parentKey));
            }
        }

        for (Reference ref : references) {
            String childTable = ref.childTable();
            List<Object> parentValues = ref.parentColumn().equals(parentKey)
                    ? parentKeys
                    : selectWhereIn(parentTable, ref.parentColumn(), parentKey, parentKeys);
            if (parentValues.isEmpty()) continue;

            boolean self = childTable.equals(parentTable);
            boolean detach = ATTRIBUTION_COLUMNS.contains(ref.childColumn()) || DETACH_COLUMNS.contains(ref.childColumn());
            if (detach && s.nullableColumns().contains(childTable + "." + ref.childColumn())) {
                int cleared = 0;
                for (List<Object> chunk : chunks(parentValues)) {
                    cleared += named.update("UPDATE " + childTable + " SET " + q(ref.childColumn()) + " = NULL WHERE "
                            + q(ref.childColumn()) + " IN (:v)", new MapSqlParameterSource("v", chunk));
                }
                if (cleared > 0) removed.merge(childTable + " (detached)", cleared, Integer::sum);
                continue;
            }

            String childKey = s.primaryKey().get(childTable);
            if (childKey == null) {
                // No single-column key to walk further (a join table): it has no dependents of its own.
                int count = deleteWhereIn(childTable, ref.childColumn(), parentValues);
                if (count > 0) removed.merge(childTable, count, Integer::sum);
                continue;
            }
            List<Object> childKeys = selectWhereIn(childTable, childKey, ref.childColumn(), parentValues);
            if (self) {
                // A self-reference (a sub-question under a question, a reply under a comment): the
                // children are other rows of the same table; the parents themselves are excluded.
                Set<Object> parents = new HashSet<>(parentKeys);
                childKeys.removeIf(parents::contains);
            }
            if (childKeys.isEmpty()) continue;
            deleteDescendants(childTable, childKey, childKeys, depth + 1, removed);
            int count = deleteWhereIn(childTable, childKey, childKeys);
            if (count > 0) removed.merge(childTable, count, Integer::sum);
        }
    }

    private List<Object> existing(String table, String keyColumn, Collection<Long> ids) {
        if (ids == null || ids.isEmpty()) return new ArrayList<>();
        return selectWhereIn(table, keyColumn, keyColumn, new ArrayList<>(ids));
    }

    private List<Object> selectWhereIn(String table, String selectColumn, String whereColumn, List<Object> values) {
        List<Object> found = new ArrayList<>();
        for (List<Object> chunk : chunks(values)) {
            found.addAll(named.queryForList("SELECT " + q(selectColumn) + " FROM " + table + " WHERE "
                    + q(whereColumn) + " IN (:v)", new MapSqlParameterSource("v", chunk), Object.class));
        }
        found.removeIf(java.util.Objects::isNull);
        return found;
    }

    private int deleteWhereIn(String table, String column, List<Object> values) {
        int count = 0;
        for (List<Object> chunk : chunks(values)) {
            count += named.update("DELETE FROM " + table + " WHERE " + q(column) + " IN (:v)",
                    new MapSqlParameterSource("v", chunk));
        }
        return count;
    }

    private static List<List<Object>> chunks(List<Object> values) {
        List<List<Object>> out = new ArrayList<>();
        for (int i = 0; i < values.size(); i += CHUNK) {
            out.add(values.subList(i, Math.min(values.size(), i + CHUNK)));
        }
        return out;
    }

    private static String q(String identifier) {
        return "\"" + identifier + "\"";
    }

    // ---- the catalog, once -----------------------------------------------------------------------

    private Schema schema() {
        Schema current = schema;
        if (current != null) return current;
        synchronized (this) {
            if (schema == null) schema = loadSchema();
            return schema;
        }
    }

    private Schema loadSchema() {
        Map<String, List<Reference>> referencesTo = new HashMap<>();
        // ON DELETE CASCADE / SET NULL keys (confdeltype c / n) are left to Postgres.
        jdbc.query("""
                SELECT c.confrelid::regclass::text AS parent_table,
                       c.conrelid::regclass::text  AS child_table,
                       child_att.attname           AS child_column,
                       parent_att.attname          AS parent_column
                FROM pg_constraint c
                JOIN pg_attribute child_att  ON child_att.attrelid = c.conrelid  AND child_att.attnum = c.conkey[1]
                JOIN pg_attribute parent_att ON parent_att.attrelid = c.confrelid AND parent_att.attnum = c.confkey[1]
                WHERE c.contype = 'f' AND array_length(c.conkey, 1) = 1 AND c.confdeltype IN ('a', 'r')
                """, rs -> {
            referencesTo.computeIfAbsent(rs.getString("parent_table"), k -> new ArrayList<>())
                    .add(new Reference(rs.getString("child_table"), rs.getString("child_column"),
                            rs.getString("parent_column")));
        });

        Map<String, List<String>> pkColumns = new HashMap<>();
        jdbc.query("""
                SELECT c.conrelid::regclass::text AS table_name, att.attname
                FROM pg_constraint c
                JOIN pg_attribute att ON att.attrelid = c.conrelid AND att.attnum = ANY(c.conkey)
                WHERE c.contype = 'p'
                """, rs -> {
            pkColumns.computeIfAbsent(rs.getString("table_name"), k -> new ArrayList<>()).add(rs.getString("attname"));
        });
        Map<String, String> primaryKey = new HashMap<>();
        pkColumns.forEach((table, cols) -> {
            if (cols.size() == 1) primaryKey.put(table, cols.get(0));
        });

        Set<String> nullable = new HashSet<>();
        Set<String> tables = new HashSet<>();
        jdbc.query("""
                SELECT cl.oid::regclass::text AS table_name, a.attname, a.attnotnull
                FROM pg_class cl
                JOIN pg_namespace n ON n.oid = cl.relnamespace
                JOIN pg_attribute a ON a.attrelid = cl.oid AND a.attnum > 0 AND NOT a.attisdropped
                WHERE cl.relkind = 'r' AND n.nspname NOT IN ('pg_catalog', 'information_schema')
                """, rs -> {
            String table = rs.getString("table_name");
            tables.add(table);
            if (!rs.getBoolean("attnotnull")) nullable.add(table + "." + rs.getString("attname"));
        });
        log.info("Cascade delete: loaded {} referenced tables, {} keyed tables", referencesTo.size(), primaryKey.size());
        return new Schema(referencesTo, primaryKey, nullable, tables);
    }
}
