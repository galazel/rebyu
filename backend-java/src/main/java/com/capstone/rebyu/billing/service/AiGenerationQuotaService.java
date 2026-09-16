package com.capstone.rebyu.billing.service;

import com.capstone.rebyu.billing.entitlement.Entitlements;
import com.capstone.rebyu.billing.entitlement.PremiumAccessRequiredException;
import com.capstone.rebyu.billing.entity.AiGenerationUsage;
import com.capstone.rebyu.billing.repository.AiGenerationUsageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * The AI tutor's daily generation allowance.
 *
 * <p>Free has no tutor at all. Pro may generate up to its plan's
 * AI_TUTOR_DAILY_GENERATIONS (10 unless an admin changes the row) quizzes or
 * flashcard sets a day. The day is Manila's, since that is where the learners
 * are; a generation is only counted once it succeeds.
 */
@Service
@RequiredArgsConstructor
public class AiGenerationQuotaService {

    public static final ZoneId LEARNER_ZONE = ZoneId.of("Asia/Manila");

    private final AiGenerationUsageRepository usage;
    private final LearnerEntitlementService entitlements;

    public static LocalDate today() {
        return LocalDate.now(LEARNER_ZONE);
    }

    @Transactional(readOnly = true)
    public int usedToday(Long learnerId) {
        return (int) usage.countByLearnerIdAndUsageDate(learnerId, today());
    }

    /** Throws unless the learner has the tutor and at least one generation left today. */
    @Transactional(readOnly = true)
    public void requireAvailable(Long learnerId) {
        entitlements.requireLearnerEntitlement(learnerId, Entitlements.AI_TUTOR, null);
        int limit = entitlements.dailyGenerationLimit(learnerId);
        if (usedToday(learnerId) >= limit) {
            throw new DailyGenerationLimitException(limit);
        }
    }

    @Transactional
    public void record(Long learnerId, String kind) {
        usage.save(AiGenerationUsage.builder()
                .learnerId(learnerId)
                .kind(kind)
                .usageDate(today())
                .createdAt(LocalDateTime.now())
                .build());
    }

    /** A 429-style refusal; rendered by the premium handler as a structured 403. */
    public static class DailyGenerationLimitException extends PremiumAccessRequiredException {
        private final int limit;

        public DailyGenerationLimitException(int limit) {
            super(Entitlements.AI_TUTOR_DAILY_GENERATIONS);
            this.limit = limit;
        }

        @Override
        public String getMessage() {
            return "You have used all " + limit + " tutor generations for today. They reset at midnight.";
        }

        @Override
        public String getCode() {
            return "DAILY_LIMIT_REACHED";
        }
    }
}
