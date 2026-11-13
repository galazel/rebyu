package com.capstone.rebyu.common;

import com.capstone.rebyu.auth.service.CognitoAdminService;
import com.capstone.rebyu.bkt.client.BktClient;
import com.capstone.rebyu.certification.service.S3StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class DeletionCleanupServiceTest {
    private JdbcTemplate jdbc;
    private S3StorageService storage;
    private BktClient bkt;
    private CognitoAdminService auth;
    private DeletionCleanupService service;

    @BeforeEach void setup() {
        jdbc = mock(JdbcTemplate.class);
        storage = mock(S3StorageService.class);
        bkt = mock(BktClient.class);
        auth = mock(CognitoAdminService.class);
        service = new DeletionCleanupService(jdbc, storage, bkt, auth);
    }

    @Test void enqueueRequiresTransactionAndDoesNotContactProviders() {
        assertThrows(IllegalStateException.class, () -> service.identity("subject"));
        verifyNoInteractions(jdbc, storage, bkt, auth);
        TransactionSynchronizationManager.setActualTransactionActive(true);
        try {
            service.identity("subject");
            service.file("avatars/one.png");
            service.learner(5L);
        } finally { TransactionSynchronizationManager.clear(); }
        verify(jdbc).update(contains("ON CONFLICT"), eq("AUTH"), eq("subject"));
        verify(jdbc).update(contains("ON CONFLICT"), eq("FILE"), eq("avatars/one.png"));
        verify(jdbc).update(contains("ON CONFLICT"), eq("BKT"), eq("5"));
        verifyNoInteractions(storage, bkt, auth);
    }

    @Test void successfulJobsAreRemovedButFailedJobsAreRetainedForRetry() {
        when(jdbc.queryForList(anyString(), any(java.sql.Timestamp.class))).thenReturn(List.of(
                Map.of("cleanup_id", 1L, "kind", "FILE", "target", "private/file.pdf"),
                Map.of("cleanup_id", 2L, "kind", "BKT", "target", "5"),
                Map.of("cleanup_id", 3L, "kind", "AUTH", "target", "subject")));
        doThrow(new IllegalStateException("provider unavailable")).when(auth).deleteAccount("subject");
        service.retryPending();
        verify(storage).deleteFile("private/file.pdf");
        verify(bkt).purgeLearnerState(5L);
        verify(jdbc).update(startsWith("DELETE FROM deletion_cleanup_tasks"), eq(1L));
        verify(jdbc).update(startsWith("DELETE FROM deletion_cleanup_tasks"), eq(2L));
        verify(jdbc, never()).update(startsWith("DELETE FROM deletion_cleanup_tasks"), eq(3L));
        verify(jdbc).update(startsWith("UPDATE deletion_cleanup_tasks SET attempts"), eq(3L));
        // A later worker invocation succeeds and clears the pending identity block.
        doNothing().when(auth).deleteAccount("subject");
        when(jdbc.queryForList(anyString(), any(java.sql.Timestamp.class))).thenReturn(List.of(Map.of("cleanup_id", 3L, "kind", "AUTH", "target", "subject")));
        service.retryPending();
        verify(jdbc).update(startsWith("DELETE FROM deletion_cleanup_tasks"), eq(3L));
    }
}
