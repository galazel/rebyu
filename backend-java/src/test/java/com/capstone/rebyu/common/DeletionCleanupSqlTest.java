package com.capstone.rebyu.common;

import com.capstone.rebyu.auth.service.CognitoAdminService;
import com.capstone.rebyu.bkt.client.BktClient;
import com.capstone.rebyu.certification.service.S3StorageService;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import org.springframework.transaction.support.TransactionTemplate;

import java.nio.charset.StandardCharsets;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class DeletionCleanupSqlTest {
    @Test void migrationQueueRollbackAndRetryWorkTogether() throws Exception {
        try (var ds = new SingleConnectionDataSource("jdbc:h2:mem:cleanup_" + UUID.randomUUID()
                + ";MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE", "sa", "", true)) {
        var jdbc = new JdbcTemplate(ds);
        var tx = new TransactionTemplate(new DataSourceTransactionManager(ds));
        var storage = mock(S3StorageService.class);
        var bkt = mock(BktClient.class);
        var auth = mock(CognitoAdminService.class);
        var service = new DeletionCleanupService(jdbc, storage, bkt, auth);
        try (var in = new ClassPathResource("db/migration/V81__durable_deletion_cleanup.sql").getInputStream()) {
            for (String sql : new String(in.readAllBytes(), StandardCharsets.UTF_8).split(";")) {
                if (!sql.isBlank()) jdbc.execute(sql);
            }
        }
        tx.executeWithoutResult(status -> {
            service.identity("rolled-back");
            status.setRollbackOnly();
        });
        assertFalse(service.identityPending("rolled-back"));
        tx.executeWithoutResult(status -> {
            service.identity("subject");
            service.identity("subject"); // idempotent enqueue
            service.file("private/file.pdf");
            service.learner(42L);
        });
        verifyNoInteractions(storage, bkt, auth);
        assertEquals(3, jdbc.queryForObject("SELECT count(*) FROM deletion_cleanup_tasks", Integer.class));
        assertTrue(service.identityPending("subject"));
        doThrow(new IllegalStateException("temporary outage")).when(auth).deleteAccount("subject");
        tx.executeWithoutResult(status -> service.retryPending());
        verify(storage).deleteFile("private/file.pdf");
        verify(bkt).purgeLearnerState(42L);
        assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM deletion_cleanup_tasks", Integer.class));
        assertEquals(1, jdbc.queryForObject("SELECT attempts FROM deletion_cleanup_tasks", Integer.class));
        assertTrue(service.identityPending("subject"));
        doNothing().when(auth).deleteAccount("subject");
        jdbc.update("UPDATE deletion_cleanup_tasks SET last_attempt_at = ?",
                java.sql.Timestamp.from(java.time.Instant.now().minusSeconds(60)));
        tx.executeWithoutResult(status -> service.retryPending());
        assertFalse(service.identityPending("subject"));
        assertEquals(0, jdbc.queryForObject("SELECT count(*) FROM deletion_cleanup_tasks", Integer.class));
        }
    }
}
