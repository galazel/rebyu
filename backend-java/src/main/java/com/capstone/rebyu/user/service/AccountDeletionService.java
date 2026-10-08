package com.capstone.rebyu.user.service;

import com.capstone.rebyu.auth.service.CognitoAdminService;
import com.capstone.rebyu.certification.service.S3StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccountDeletionService {

    private static final int MAX_DEPTH = 8;

    private static final Set<String> ATTRIBUTION_COLUMNS = Set.of(
            "created_by", "invited_by", "assigned_by",
            "reviewed_by_user_id", "uploaded_by_user_id", "verified_by_user_id");

    private final JdbcTemplate jdbc;
    private final S3StorageService s3StorageService;
    private final CognitoAdminService cognitoAdminService;
    private final com.capstone.rebyu.bkt.client.BktClient bktClient;

    @Transactional
    public void deleteLearner(Long learnerId) {
        Long userId = jdbc.query("SELECT user_id FROM learners WHERE learner_id = ?",
                rs -> rs.next() ? rs.getObject(1, Long.class) : null, learnerId);
        erase(userId, List.of(learnerId));
    }

    @Transactional
    public void deleteUser(Long userId) {
        List<Long> learnerIds = jdbc.queryForList(
                "SELECT learner_id FROM learners WHERE user_id = ?", Long.class, userId);
        erase(userId, learnerIds);
    }

    private void erase(Long userId, List<Long> learnerIds) {
        List<String> fileKeys = new ArrayList<>();
        for (Long learnerId : learnerIds) {
            fileKeys.addAll(attachmentKeysOf(learnerId));
        }
        String cognitoSub = userId == null ? null : jdbc.query(
                "SELECT cognito_sub FROM users WHERE user_id = ?",
                rs -> rs.next() ? rs.getString(1) : null, userId);

        if (!learnerIds.isEmpty()) {
            String ids = learnerIds.stream().map(String::valueOf).collect(Collectors.joining(","));
            deleteDescendants("learners",
                    "SELECT learner_id FROM learners WHERE learner_id IN (" + ids + ")", 0);
            jdbc.update("DELETE FROM learners WHERE learner_id IN (" + ids + ")");
        }

        if (userId != null) {
            deleteDescendants("users", "SELECT user_id FROM users WHERE user_id = " + userId, 0);
            jdbc.update("DELETE FROM users WHERE user_id = ?", userId);
        }

        for (Long learnerId : learnerIds) {
            try {
                bktClient.purgeLearnerState(learnerId);
            } catch (Exception ex) {
                log.error("Learner {} deleted, but their BKT mastery could not be purged. "
                        + "It will be inherited by the next learner issued this id.", learnerId, ex);
            }
        }

        for (String key : fileKeys) {
            try {
                s3StorageService.deleteFile(key);
            } catch (Exception ex) {
                log.warn("Account {} deleted, but stored file {} could not be removed: {}",
                        userId, key, ex.getMessage());
            }
        }
        if (cognitoSub != null && !cognitoSub.isBlank()) {
            cognitoAdminService.deleteAccount(cognitoSub);
        }
        log.info("Deleted user {} (learner ids {}, {} stored files, cognito sub {})",
                userId, learnerIds, fileKeys.size(), cognitoSub == null ? "none" : "removed");
    }

    private List<String> attachmentKeysOf(Long learnerId) {
        List<String> keys = new ArrayList<>(jdbc.queryForList(
                "SELECT attachment_key FROM community_posts "
                        + "WHERE author_learner_id = ? AND attachment_key IS NOT NULL",
                String.class, learnerId));
        keys.addAll(jdbc.queryForList(
                "SELECT resource_url FROM learner_library_items "
                        + "WHERE learner_id = ? AND item_type = 'file' "
                        + "AND resource_url IS NOT NULL AND resource_url NOT LIKE '/%'",
                String.class, learnerId));
        return keys;
    }

    private void deleteDescendants(String parentTable, String parentKeysSql, int depth) {
        if (depth >= MAX_DEPTH) {
            log.warn("Stopped cascading below {} at depth {}", parentTable, depth);
            return;
        }
        for (Map<String, Object> fk : childForeignKeys(parentTable)) {
            String childTable = (String) fk.get("child_table");
            String childColumn = (String) fk.get("child_column");
            String parentColumn = (String) fk.get("parent_column");

            String matchingRows = "\"" + childColumn + "\" IN (SELECT \"" + parentColumn
                    + "\" FROM (" + parentKeysSql + ") AS parent_keys)";

            if (ATTRIBUTION_COLUMNS.contains(childColumn) && isNullable(childTable, childColumn)) {
                int cleared = jdbc.update("UPDATE \"" + childTable + "\" SET \"" + childColumn
                        + "\" = NULL WHERE " + matchingRows);
                if (cleared > 0) {
                    log.debug("Cleared {} attribution(s) in {}.{}", cleared, childTable, childColumn);
                }
                continue;
            }

            if (!childTable.equals(parentTable)) {
                String childKeys = singleColumnPrimaryKey(childTable)
                        .map(pk -> "SELECT \"" + pk + "\" FROM \"" + childTable + "\" WHERE " + matchingRows)
                        .orElse(null);
                if (childKeys != null) {
                    deleteDescendants(childTable, childKeys, depth + 1);
                }
            }

            int removed = jdbc.update("DELETE FROM \"" + childTable + "\" WHERE " + matchingRows);
            if (removed > 0) {
                log.debug("Removed {} row(s) from {}", removed, childTable);
            }
        }
    }

    private List<Map<String, Object>> childForeignKeys(String parentTable) {
        return jdbc.queryForList("""
                SELECT c.conrelid::regclass::text AS child_table,
                       child_att.attname          AS child_column,
                       parent_att.attname         AS parent_column
                FROM pg_constraint c
                JOIN pg_attribute child_att
                  ON child_att.attrelid = c.conrelid AND child_att.attnum = c.conkey[1]
                JOIN pg_attribute parent_att
                  ON parent_att.attrelid = c.confrelid AND parent_att.attnum = c.confkey[1]
                WHERE c.contype = 'f'
                  AND c.confrelid = ?::regclass
                  AND array_length(c.conkey, 1) = 1
                """, parentTable);
    }

    private boolean isNullable(String table, String column) {
        Boolean notNull = jdbc.queryForObject("""
                SELECT attnotnull FROM pg_attribute
                WHERE attrelid = ?::regclass AND attname = ? AND attnum > 0
                """, Boolean.class, table, column);
        return Boolean.FALSE.equals(notNull);
    }

    private Optional<String> singleColumnPrimaryKey(String table) {
        List<String> columns = jdbc.queryForList("""
                SELECT att.attname
                FROM pg_constraint c
                JOIN pg_attribute att ON att.attrelid = c.conrelid AND att.attnum = ANY(c.conkey)
                WHERE c.contype = 'p' AND c.conrelid = ?::regclass
                """, String.class, table);
        return columns.size() == 1 ? Optional.of(columns.get(0)) : Optional.empty();
    }
}
