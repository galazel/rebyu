package com.capstone.rebyu.billing.config;

import com.capstone.rebyu.billing.entitlement.Entitlements;
import com.capstone.rebyu.billing.entity.PlanEntitlement;
import com.capstone.rebyu.billing.entity.SubscriptionPlan;
import com.capstone.rebyu.billing.repository.PlanEntitlementRepository;
import com.capstone.rebyu.billing.repository.SubscriptionPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Makes sure the two learner plans exist: Free and Pro.
 *
 * <p>Flyway never runs in this project, so the plan rows the billing code was
 * written against were never there -- the subscription page had nothing to
 * show and checkout had nothing to buy. Idempotent: an existing plan keeps its
 * price and name (an admin may have changed them); only missing plans and
 * missing entitlement rows are added.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class IndividualPlanSeeder {

    public static final String FREE_PLAN = "FREE";
    public static final String PRO_PLAN = "PRO_MONTHLY";

    private static final List<String> FREE_FEATURES = List.of(
            Entitlements.CERTIFICATION_BROWSING,
            Entitlements.LESSON_ACCESS,
            Entitlements.BASIC_LEARNING,
            Entitlements.BASIC_COMPLETION_TRACKING);

    /** Code -> limit (null for a plain feature flag). */
    private static final Map<String, Integer> PRO_FEATURES = new LinkedHashMap<>();

    static {
        FREE_FEATURES.forEach(code -> PRO_FEATURES.put(code, null));
        for (String code : List.of(
                Entitlements.QUIZ_RETAKES,
                Entitlements.MOCK_EXAM_ACCESS,
                Entitlements.AI_TUTOR,
                Entitlements.COMMUNITY_FULL_ACCESS,
                Entitlements.MISTAKE_BANK,
                Entitlements.CHALLENGES_ACCESS,
                Entitlements.WORLD_CUP_ACCESS,
                Entitlements.DETAILED_PROGRESS,
                Entitlements.PROGRESS_ANALYTICS,
                Entitlements.MASTERY_ANALYTICS,
                Entitlements.WEAKNESS_ANALYSIS,
                Entitlements.PERSONALIZED_STUDY_PLAN,
                Entitlements.READINESS_ANALYSIS,
                Entitlements.ADVANCED_RECOMMENDATIONS)) {
            PRO_FEATURES.put(code, null);
        }
        PRO_FEATURES.put(Entitlements.AI_TUTOR_DAILY_GENERATIONS, Entitlements.DEFAULT_DAILY_AI_GENERATIONS);
    }

    private final SubscriptionPlanRepository plans;
    private final PlanEntitlementRepository entitlements;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seed() {
        try {
            SubscriptionPlan free = ensurePlan(FREE_PLAN, "Free",
                    "Every lesson in every certification, and one sitting of each quiz and exam.",
                    SubscriptionPlan.BillingInterval.NONE, BigDecimal.ZERO, true, 0);
            SubscriptionPlan pro = ensurePlan(PRO_PLAN, "REBYU Pro",
                    "Retakes, mock exams, the AI tutor, the full community, the mistake bank and every challenge.",
                    SubscriptionPlan.BillingInterval.MONTHLY, new BigDecimal("199.00"), false, 1);
            FREE_FEATURES.forEach(code -> ensureEntitlement(free, code, null));
            PRO_FEATURES.forEach((code, limit) -> ensureEntitlement(pro, code, limit));
        } catch (RuntimeException ex) {
            // Never block startup over seed data.
            log.error("Could not seed the learner plans", ex);
        }
    }

    private SubscriptionPlan ensurePlan(String code, String name, String description,
                                        SubscriptionPlan.BillingInterval interval, BigDecimal amount,
                                        boolean isFree, int order) {
        return plans.findByPlanCode(code).orElseGet(() -> {
            LocalDateTime now = LocalDateTime.now();
            log.info("Seeding subscription plan {}", code);
            return plans.save(SubscriptionPlan.builder()
                    .planCode(code)
                    .planName(name)
                    .description(description)
                    .customerType(SubscriptionPlan.CustomerType.INDIVIDUAL)
                    .billingInterval(interval)
                    .amount(amount)
                    .currency("PHP")
                    .isFree(isFree)
                    .isCustomPricing(false)
                    .status("ACTIVE")
                    .displayOrder(order)
                    .createdAt(now)
                    .updatedAt(now)
                    .build());
        });
    }

    private void ensureEntitlement(SubscriptionPlan plan, String code, Integer limit) {
        if (entitlements.findBySubscriptionPlan_SubscriptionPlanIdAndEntitlementCode(
                plan.getSubscriptionPlanId(), code).isPresent()) {
            return;
        }
        entitlements.save(PlanEntitlement.builder()
                .subscriptionPlan(plan)
                .entitlementCode(code)
                .enabled(true)
                .limitValue(limit)
                .build());
    }
}
