package com.capstone.rebyu.billing.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public final class EntitlementDtos {

    private EntitlementDtos() {
    }

    public enum AccessSource {
        FREE, PERSONAL_PRO, INSTITUTIONAL_LICENSE, BOTH
    }

    public record LearnerEntitlementsDto(
            Long learnerId,
            AccessSource accessSource,
            boolean personalProActive,
            boolean institutionalActive,
            Set<String> features,
            String personalPlanCode,
            String personalStatus,
            LocalDateTime currentPeriodEnd,
            boolean cancelAtPeriodEnd,
            boolean awaitingApproval,
            int aiGenerationsUsedToday,
            int aiGenerationDailyLimit
    ) {
    }

    public record LearnerSubscriptionDto(
            Long learnerSubscriptionId,
            Long learnerId,
            String planCode,
            String planName,
            BigDecimal amount,
            String currency,
            String billingInterval,
            String status,
            LocalDateTime currentPeriodStart,
            LocalDateTime currentPeriodEnd,
            boolean cancelAtPeriodEnd,
            LocalDateTime canceledAt,
            boolean awaitingApproval,
            String reviewNote,
            boolean refunded
    ) {
    }

    public record PlanEntitlementDto(
            String entitlementCode,
            boolean enabled,
            Integer limitValue
    ) {
    }

    public record SubscriptionPlanDto(
            Long subscriptionPlanId,
            String planCode,
            String planName,
            String customerType,
            String description,
            String billingInterval,
            BigDecimal amount,
            String currency,
            boolean isFree,
            boolean isCustomPricing,
            String status,
            List<PlanEntitlementDto> entitlements
    ) {
    }

    public record UsageMetricDto(
            String code,
            int used,
            Integer limit
    ) {
    }

    public record InstitutionalLicenseDto(
            Long institutionalLicenseId,
            Long institutionId,
            String planCode,
            String planName,
            String billingInterval,
            String contractNumber,
            String licenseStatus,
            LocalDateTime currentPeriodStart,
            LocalDateTime currentPeriodEnd,
            boolean cancelAtPeriodEnd,
            Set<String> features,
            List<UsageMetricDto> usage
    ) {
    }
}
