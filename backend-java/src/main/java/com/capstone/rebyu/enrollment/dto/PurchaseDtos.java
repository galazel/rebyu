package com.capstone.rebyu.enrollment.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public final class PurchaseDtos {

    private PurchaseDtos() {
    }

    public record PurchaseRequestDto(
            @NotNull Long learnerId,
            String idempotencyKey
    ) {
    }

    public record ConfirmPaymentRequestDto(
            @NotNull Long learnerId,
            @NotNull String paymentReference
    ) {
    }

    public record PurchaseTransactionDto(
            Long transactionId,
            String transactionReference,
            Long learnerId,
            Long certificationId,
            BigDecimal amount,
            String status,
            String transactionType,
            LocalDateTime createdAt,
            LocalDateTime paidAt,
            Long enrollmentId,
            boolean requiresPayment
    ) {
    }

    public record LearnerEnrollmentDto(
            Long enrollmentId,
            Long learnerId,
            Long certificationId,
            String certificationTitle,
            String status,
            LocalDateTime enrolledAt,
            LocalDateTime diagnosticCompletedAt,
            Long diagnosticAttemptId
    ) {
    }
}
