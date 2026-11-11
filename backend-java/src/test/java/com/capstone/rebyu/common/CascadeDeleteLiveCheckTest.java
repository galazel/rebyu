package com.capstone.rebyu.common;

import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Runs the real {@link CascadeDeleteService} against the real database, on the real row with the
 * most dependents of each kind, and ROLLS BACK. Nothing is ever committed.
 *
 * <p>Off by default: runs only when CASCADE_CHECK_DB_URL / _USER / _PASSWORD are set, so a plain
 * {@code mvnw test} never touches a database. No Spring context, so no schedulers start.
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class CascadeDeleteLiveCheckTest {

    private JdbcTemplate jdbc;
    private TransactionTemplate tx;
    private CascadeDeleteService cascade;

    @BeforeAll
    void connect() {
        String url = System.getenv("CASCADE_CHECK_DB_URL");
        Assumptions.assumeTrue(url != null && !url.isBlank(), "CASCADE_CHECK_DB_URL not set: live check skipped");
        DriverManagerDataSource ds = new DriverManagerDataSource(url,
                System.getenv("CASCADE_CHECK_DB_USER"), System.getenv("CASCADE_CHECK_DB_PASSWORD"));
        jdbc = new JdbcTemplate(ds);
        tx = new TransactionTemplate(new DataSourceTransactionManager(ds));
        cascade = new CascadeDeleteService(jdbc);
    }

    @ParameterizedTest(name = "{0}")
    @CsvSource({
            "exams,                              exam_id",
            "achievements,                       achievement_id",
            "institutions,                       institution_id",
            "partnership_requests,               request_id",
            "learner_orders,                     order_id",
            "learner_order_details,              order_detail_id",
            "institution_certification_learners, institution_cert_learner_id",
            "learner_library_items,              library_item_id",
            "lessons,                            lesson_id",
            "middle_categories,                  middle_category_id",
            "major_categories,                   major_category_id",
            "certifications,                     certification_id",
            "questions,                          question_id",
            "learners,                           learner_id",
            "community_posts,                    post_id",
    })
    void deletesTheRowWithTheMostDependentsAndLeavesNothingPointingAtIt(String table, String key) {
        Long id = rowWithMostDependents(table, key);
        Assumptions.assumeTrue(id != null, table + " is empty");

        tx.executeWithoutResult(status -> {
            try {
                Map<String, Integer> removed = cascade.delete(table, key, id);
                System.out.printf("%-36s id=%-6d removed %s%n", table, id, removed);
                assertEquals(1, removed.get(table), table + " row itself must be deleted");
                assertEquals(0L, jdbc.queryForObject(
                        "SELECT count(*) FROM " + table + " WHERE " + key + " = ?", Long.class, id));
                for (Map<String, Object> fk : foreignKeysInto(table)) {
                    Long left = jdbc.queryForObject("SELECT count(*) FROM " + fk.get("child_table")
                            + " WHERE " + fk.get("child_column") + " = ?", Long.class, id);
                    assertEquals(0L, left, fk.get("child_table") + "." + fk.get("child_column") + " still references it");
                }
                for (CascadeDeleteService.SoftReference soft
                        : CascadeDeleteService.SOFT_REFERENCES.getOrDefault(table, List.of())) {
                    Boolean exists = jdbc.queryForObject("SELECT to_regclass(?) IS NOT NULL", Boolean.class, soft.table());
                    if (!Boolean.TRUE.equals(exists)) continue;
                    Long left = jdbc.queryForObject("SELECT count(*) FROM " + soft.table()
                            + " WHERE " + soft.column() + " = ?", Long.class, id);
                    assertEquals(0L, left, soft.table() + "." + soft.column() + " (no FK) still references it");
                }
            } finally {
                status.setRollbackOnly();
            }
        });
        // Rolled back: the row is still there.
        assertTrue(jdbc.queryForObject("SELECT count(*) FROM " + table + " WHERE " + key + " = ?", Long.class, id) == 1L,
                "rollback must restore " + table + " " + id);
    }

    private Long rowWithMostDependents(String table, String key) {
        List<Map<String, Object>> fks = foreignKeysInto(table);
        // Only detached links point at some tables (order lines, library items): rank by key then.
        String related = fks.isEmpty() ? "p." + key : String.join(" + ", fks.stream().map(fk ->
                "(SELECT count(*) FROM " + fk.get("child_table") + " x WHERE x." + fk.get("child_column")
                        + " = p." + key + ")").toList());
        List<Long> ids = jdbc.queryForList("SELECT p." + key + " FROM " + table + " p ORDER BY " + related
                + " DESC, p." + key + " LIMIT 1", Long.class);
        return ids.isEmpty() ? null : ids.get(0);
    }

    private List<Map<String, Object>> foreignKeysInto(String table) {
        return jdbc.queryForList("""
                SELECT c.conrelid::regclass::text AS child_table, a.attname AS child_column
                FROM pg_constraint c JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
                WHERE c.contype = 'f' AND c.confrelid = ?::regclass AND array_length(c.conkey, 1) = 1
                  AND c.confdeltype IN ('a', 'r') AND a.attname NOT IN
                    ('created_by','invited_by','assigned_by','reviewed_by_user_id','uploaded_by_user_id',
                     'verified_by_user_id','order_detail_id','shared_library_item_id')
                """, table);
    }
}
