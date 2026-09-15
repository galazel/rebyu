package com.capstone.rebyu.bkt.repository;

import com.capstone.rebyu.bkt.entity.BktEventOutbox;
import com.capstone.rebyu.bkt.entity.BktOutboxStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Outbox persistence with a safe multi-instance claim path.
 *
 * <p>{@link #claimPending} uses PostgreSQL {@code FOR UPDATE SKIP LOCKED} so
 * concurrent dispatchers on different backend instances never claim the same
 * row. Callers must run it inside a transaction and flip the returned rows to
 * {@code PROCESSING} before committing.
 */
public interface BktEventOutboxRepository extends JpaRepository<BktEventOutbox, Long> {

    boolean existsByEventId(String eventId);

    /** Event ids already enqueued for one batch, read in one query instead of one per question. */
    @Query("SELECT o.eventId FROM BktEventOutbox o WHERE o.batchId = :batchId")
    List<String> findEventIdsByBatchId(@Param("batchId") String batchId);

    List<BktEventOutbox> findByExamResultIdAndAttemptNo(Long examResultId, Integer attemptNo);

    long countByStatus(BktOutboxStatus status);

    List<BktEventOutbox> findByStatusOrderByCreatedAtDesc(BktOutboxStatus status, Pageable pageable);

    /**
     * Claim up to {@code limit} deliverable rows: PENDING and past their backoff
     * window, oldest first. Rows are locked with SKIP LOCKED so parallel workers
     * get disjoint batches.
     */
    @Query(value = """
            SELECT * FROM bkt_event_outbox
            WHERE status = 'PENDING'
              AND (next_retry_at IS NULL OR next_retry_at <= :now)
            ORDER BY created_at ASC
            LIMIT :limit
            FOR UPDATE SKIP LOCKED
            """, nativeQuery = true)
    List<BktEventOutbox> claimPending(@Param("now") LocalDateTime now, @Param("limit") int limit);

    /** Reconciliation: rows that permanently failed and need admin attention. */
    @Query(value = "SELECT * FROM bkt_event_outbox WHERE status = 'DEAD_LETTER' ORDER BY created_at ASC LIMIT :limit",
            nativeQuery = true)
    List<BktEventOutbox> findDeadLetter(@Param("limit") int limit);
}
