package com.capstone.rebyu.common;

import com.capstone.rebyu.auth.service.CognitoAdminService;
import com.capstone.rebyu.bkt.client.BktClient;
import com.capstone.rebyu.certification.service.S3StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** External deletion runs only after commit; failed jobs remain durable and retry. */
@Service
@RequiredArgsConstructor
@Slf4j
public class DeletionCleanupService {
    private final JdbcTemplate jdbc;
    private final S3StorageService storage;
    private final BktClient bkt;
    private final CognitoAdminService auth;

    public void file(String key) { enqueue("FILE", key); }
    public void learner(Long id) { enqueue("BKT", id.toString()); }
    public void identity(String subject) { enqueue("AUTH", subject); }

    private void enqueue(String kind, String target) {
        if (target == null || target.isBlank()) return;
        // Must join the deleting transaction: never publish a cleanup job for a rollback.
        if (!org.springframework.transaction.support.TransactionSynchronizationManager.isActualTransactionActive()) {
            throw new IllegalStateException("Deletion cleanup must be queued inside a transaction");
        }
        jdbc.update("INSERT INTO deletion_cleanup_tasks (kind, target) VALUES (?, ?) "
                + "ON CONFLICT DO NOTHING", kind, target);
    }

    public boolean identityPending(String subject) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM deletion_cleanup_tasks WHERE kind = 'AUTH' AND target = ?)",
                Boolean.class, subject));
    }

    @Scheduled(fixedDelayString = "${app.deletion-cleanup.retry-ms:30000}")
    @Transactional
    public void retryPending() { processBatch(); }

    private void processBatch() {
        var tasks = jdbc.queryForList("SELECT cleanup_id, kind, target FROM deletion_cleanup_tasks "
                + "WHERE last_attempt_at IS NULL OR last_attempt_at < ? "
                + "ORDER BY cleanup_id LIMIT 20 FOR UPDATE SKIP LOCKED",
                java.sql.Timestamp.from(java.time.Instant.now().minusSeconds(30)));
        for (var task : tasks) {
            long id = ((Number) task.get("cleanup_id")).longValue();
            String kind = (String) task.get("kind");
            String target = (String) task.get("target");
            try {
                switch (kind) {
                    case "FILE" -> storage.deleteFile(target);
                    case "BKT" -> bkt.purgeLearnerState(Long.valueOf(target));
                    case "AUTH" -> auth.deleteAccount(target);
                    default -> throw new IllegalStateException("Unknown cleanup kind: " + kind);
                }
            } catch (RuntimeException error) {
                jdbc.update("UPDATE deletion_cleanup_tasks SET attempts = attempts + 1, "
                        + "last_attempt_at = CURRENT_TIMESTAMP WHERE cleanup_id = ?", id);
                log.warn("Deletion cleanup {} ({}) failed; it will retry", id, kind, error);
                continue;
            }
            jdbc.update("DELETE FROM deletion_cleanup_tasks WHERE cleanup_id = ?", id);
        }
    }
}
