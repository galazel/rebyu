package com.capstone.rebyu.billing.service;

import com.capstone.rebyu.billing.entitlement.Entitlements;
import com.capstone.rebyu.billing.repository.LearnerSubscriptionRepository;
import com.capstone.rebyu.billing.repository.PlanEntitlementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EntitlementService {

    private final LearnerSubscriptionRepository learnerSubscriptionRepository;
    private final PlanEntitlementRepository planEntitlementRepository;

    public boolean hasAccess(Long learnerId, String entitlementCode) {
        List<com.capstone.rebyu.billing.entity.LearnerSubscription> subs =
                learnerSubscriptionRepository.findByLearner_LearnerId(learnerId);

        for (var sub : subs) {
            if (!sub.isCurrentlyActive()) continue;

            var entitlements = planEntitlementRepository
                    .findBySubscriptionPlan_SubscriptionPlanIdAndEntitlementCode(
                            sub.getSubscriptionPlan().getSubscriptionPlanId(),
                            entitlementCode);

            if (entitlements.isPresent() && entitlements.get().isEnabled()) {
                return true;
            }
        }

        return false;
    }

    public Integer getLimitValue(Long learnerId, String entitlementCode) {
        List<com.capstone.rebyu.billing.entity.LearnerSubscription> subs =
                learnerSubscriptionRepository.findByLearner_LearnerId(learnerId);

        for (var sub : subs) {
            if (!sub.isCurrentlyActive()) continue;

            var entitlements = planEntitlementRepository
                    .findBySubscriptionPlan_SubscriptionPlanIdAndEntitlementCode(
                            sub.getSubscriptionPlan().getSubscriptionPlanId(),
                            entitlementCode);

            if (entitlements.isPresent() && entitlements.get().getLimitValue() != null) {
                return entitlements.get().getLimitValue();
            }
        }

        return null;
    }

    public boolean isProSubscriber(Long learnerId) {
        return hasAccess(learnerId, Entitlements.DETAILED_PROGRESS);
    }
}
