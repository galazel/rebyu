package com.capstone.rebyu.bkt.repository;

import com.capstone.rebyu.bkt.entity.BktEventOutbox;
import com.capstone.rebyu.bkt.entity.BktOutboxStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface BktEventOutboxRepository extends JpaRepository<BktEventOutbox, Long> {

    boolean existsByEventId(String eventId);

    @Query("SELECT o.eventId FROM BktEventOutbox o WHERE o.batchId = :batchId")
    List<String> findEventIdsByBatchId(@Param("batchId") String batchId);

    List<BktEventOutbox> findByExamResultIdAndAttemptNo(Long examResultId, Integer attemptNo);

    long countByStatus(BktOutboxStatus status);

    List<BktEventOutbox> findByStatusOrderByCreatedAtDesc(BktOutboxStatus status, Pageable pageable);

    @Query(value = """
            SELECT * FROM bkt_event_outbox
            WHERE status = 'PENDING'
              AND (next_retry_at IS NULL OR next_retry_at <= :now)
            ORDER BY created_at ASC
            LIMIT :limit
            FOR UPDATE SKIP LOCKED
            """, nativeQuery = true)
    List<BktEventOutbox> claimPending(@Param("now") LocalDateTime now, @Param("limit") int limit);

    @Query(value = "SELECT * FROM bkt_event_outbox WHERE status = 'DEAD_LETTER' ORDER BY created_at ASC LIMIT :limit",
            nativeQuery = true)
    List<BktEventOutbox> findDeadLetter(@Param("limit") int limit);
}
