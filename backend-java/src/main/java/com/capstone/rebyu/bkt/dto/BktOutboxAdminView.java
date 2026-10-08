package com.capstone.rebyu.bkt.dto;

import com.capstone.rebyu.bkt.entity.BktEventOutbox;

import java.time.LocalDateTime;

public record BktOutboxAdminView(
        Long id,
        String eventId,
        String batchId,
        Long learnerId,
        Long certificationId,
        Long examId,
        Long examResultId,
        Integer attemptNo,
        String status,
        int retryCount,
        LocalDateTime nextRetryAt,
        String lastError,
        LocalDateTime createdAt,
        LocalDateTime processedAt
) {
    public static BktOutboxAdminView from(BktEventOutbox row) {
        return new BktOutboxAdminView(
                row.getId(),
                row.getEventId(),
                row.getBatchId(),
                row.getLearnerId(),
                row.getCertificationId(),
                row.getExamId(),
                row.getExamResultId(),
                row.getAttemptNo(),
                row.getStatus().name(),
                row.getRetryCount(),
                row.getNextRetryAt(),
                row.getLastError(),
                row.getCreatedAt(),
                row.getProcessedAt());
    }
}
