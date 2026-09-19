package com.capstone.rebyu.billing.service;

import com.capstone.rebyu.billing.dto.EntitlementDtos.AccessSource;
import com.capstone.rebyu.billing.dto.EntitlementDtos.LearnerEntitlementsDto;
import com.capstone.rebyu.billing.dto.EntitlementDtos.LearnerSubscriptionDto;
import com.capstone.rebyu.billing.entitlement.Entitlements;
import com.capstone.rebyu.billing.entitlement.PremiumAccessRequiredException;
import com.capstone.rebyu.billing.entity.InstitutionalLicense;
import com.capstone.rebyu.billing.entity.LearnerSubscription;
import com.capstone.rebyu.billing.entity.PlanEntitlement;
import com.capstone.rebyu.billing.repository.LearnerSubscriptionRepository;
import com.capstone.rebyu.billing.repository.PlanEntitlementRepository;
import com.capstone.rebyu.enrollment.entity.InstitutionCertificationLearner;
import com.capstone.rebyu.enrollment.repository.InstitutionCertificationLearnerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

/**
 * Centralized learner (B2C) entitlement authority. Missing subscription = Free.
 * Combines personal Pro with institution-sponsored coverage. The caller passes
 * a learnerId already resolved from the authenticated identity — never a raw
 * client value used as proof of identity.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LearnerEntitlementService {

    /** Always granted to any authenticated learner. */
    private static final Set<String> FREE_FEATURES = Set.of(
            Entitlements.CERTIFICATION_BROWSING,
            Entitlements.LESSON_ACCESS,
            Entitlements.BASIC_LEARNING,
            Entitlements.BASIC_COMPLETION_TRACKING);

    private static final Set<String> SPONSORED_LEARNER_FEATURES = Set.of(
            Entitlements.QUIZ_RETAKES,
            Entitlements.MOCK_EXAM_ACCESS,
            Entitlements.AI_TUTOR,
            Entitlements.COMMUNITY_FULL_ACCESS,
            Entitlements.MISTAKE_BANK,
            Entitlements.CHALLENGES_ACCESS,
            Entitlements.WORLD_CUP_ACCESS);

    private final LearnerSubscriptionRepository learnerSubscriptionRepository;
    private final PlanEntitlementRepository planEntitlementRepository;
    private final InstitutionCertificationLearnerRepository institutionCertLearnerRepository;
    private final InstitutionalEntitlementService institutionalEntitlementService;
    private final com.capstone.rebyu.billing.repository.AiGenerationUsageRepository aiGenerationUsageRepository;

    @Transactional(readOnly = true)
    public Optional<LearnerSubscription> getCurrentLearnerSubscription(Long learnerId) {
        return learnerSubscriptionRepository.findFirstByLearner_LearnerIdOrderByCreatedAtDesc(learnerId);
    }

    @Transactional(readOnly = true)
    public LearnerSubscriptionDto getSubscriptionView(Long learnerId) {
        LearnerSubscription subscription = getCurrentLearnerSubscription(learnerId).orElse(null);
        if (subscription == null) {
            return null;
        }
        var plan = subscription.getSubscriptionPlan();
        return new LearnerSubscriptionDto(
                subscription.getLearnerSubscriptionId(),
                learnerId,
                plan.getPlanCode(),
                plan.getPlanName(),
                plan.getAmount(),
                plan.getCurrency(),
                plan.getBillingInterval().name(),
                subscription.getStatus().name(),
                subscription.getCurrentPeriodStart(),
                subscription.getCurrentPeriodEnd(),
                subscription.isCancelAtPeriodEnd(),
                subscription.getCanceledAt(),
                subscription.isAwaitingApproval(),
                subscription.getReviewNote());
    }

    @Transactional(readOnly = true)
    public boolean hasActiveProSubscription(Long learnerId) {
        return getCurrentLearnerSubscription(learnerId)
                .filter(LearnerSubscription::isCurrentlyActive)
                .filter(subscription -> !subscription.getSubscriptionPlan().isFree())
                .isPresent();
    }

    @Transactional(readOnly = true)
    public LearnerEntitlementsDto getEffectiveEntitlements(Long learnerId, Long certificationId) {
        Set<String> features = new HashSet<>(FREE_FEATURES);

        LearnerSubscription subscription = getCurrentLearnerSubscription(learnerId).orElse(null);
        boolean proActive = subscription != null
                && subscription.isCurrentlyActive()
                && !subscription.getSubscriptionPlan().isFree();
        if (proActive) {
            features.addAll(planFeatures(subscription.getSubscriptionPlan().getSubscriptionPlanId()));
        }

        Set<String> institutionalFeatures = institutionalCoverage(learnerId, certificationId);
        boolean institutionalActive = !institutionalFeatures.isEmpty();
        features.addAll(institutionalFeatures);
        // A sponsored learner studies on the institution's licence: everything
        // that separates Free from Pro comes with it, whatever else the licence
        // plan lists.
        if (institutionalActive) {
            features.addAll(SPONSORED_LEARNER_FEATURES);
        }

        AccessSource source;
        if (proActive && institutionalActive) {
            source = AccessSource.BOTH;
        } else if (proActive) {
            source = AccessSource.PERSONAL_PRO;
        } else if (institutionalActive) {
            source = AccessSource.INSTITUTIONAL_LICENSE;
        } else {
            source = AccessSource.FREE;
        }

        return new LearnerEntitlementsDto(
                learnerId,
                source,
                proActive,
                institutionalActive,
                features,
                subscription == null ? "FREE" : subscription.getSubscriptionPlan().getPlanCode(),
                subscription == null ? null : subscription.getStatus().name(),
                subscription == null ? null : subscription.getCurrentPeriodEnd(),
                subscription != null && subscription.isCancelAtPeriodEnd(),
                subscription != null && subscription.isAwaitingApproval(),
                (int) aiGenerationUsageRepository.countByLearnerIdAndUsageDate(
                        learnerId, AiGenerationQuotaService.today()),
                features.contains(Entitlements.AI_TUTOR) ? dailyGenerationLimit(learnerId, subscription) : 0);
    }

    /** Tutor generations allowed per day: the Pro plan's limit row, else the default. */
    @Transactional(readOnly = true)
    public int dailyGenerationLimit(Long learnerId) {
        return dailyGenerationLimit(learnerId, getCurrentLearnerSubscription(learnerId).orElse(null));
    }

    private int dailyGenerationLimit(Long learnerId, LearnerSubscription subscription) {
        if (subscription != null && subscription.isCurrentlyActive()) {
            Integer limit = planEntitlementRepository
                    .findBySubscriptionPlan_SubscriptionPlanIdAndEntitlementCode(
                            subscription.getSubscriptionPlan().getSubscriptionPlanId(),
                            Entitlements.AI_TUTOR_DAILY_GENERATIONS)
                    .filter(PlanEntitlement::isEnabled)
                    .map(PlanEntitlement::getLimitValue)
                    .orElse(null);
            if (limit != null && limit > 0) {
                return limit;
            }
        }
        return Entitlements.DEFAULT_DAILY_AI_GENERATIONS;
    }

    /** Whether the learner holds any paid access at all (personal Pro or a sponsor's licence). */
    @Transactional(readOnly = true)
    public boolean isPro(Long learnerId) {
        return getEffectiveEntitlements(learnerId, null).accessSource() != AccessSource.FREE;
    }

    @Transactional(readOnly = true)
    public boolean hasLearnerEntitlement(Long learnerId, String feature, Long certificationId) {
        if (FREE_FEATURES.contains(feature)) {
            return true;
        }
        return getEffectiveEntitlements(learnerId, certificationId).features().contains(feature);
    }

    @Transactional(readOnly = true)
    public void requireLearnerEntitlement(Long learnerId, String feature, Long certificationId) {
        if (!hasLearnerEntitlement(learnerId, feature, certificationId)) {
            throw new PremiumAccessRequiredException(feature);
        }
    }

    // ----- internals -----

    /**
     * Institution-sponsored features for this learner. Coverage requires an
     * active org-cert-learner assignment whose institution holds an active
     * license; when a certification is given, the assignment must match it.
     */
    private Set<String> institutionalCoverage(Long learnerId, Long certificationId) {
        Set<String> features = new HashSet<>();
        for (InstitutionCertificationLearner assignment :
                institutionCertLearnerRepository.findByLearner_LearnerIdAndStatus(
                        learnerId, InstitutionCertificationLearner.Status.active)) {
            var institutionCert = assignment.getInstitutionCert();
            if (institutionCert == null || institutionCert.getInstitution() == null) {
                continue;
            }
            if (certificationId != null
                    && (institutionCert.getCertification() == null
                    || !Objects.equals(institutionCert.getCertification().getCertificationId(), certificationId))) {
                continue;
            }
            Optional<InstitutionalLicense> license = institutionalEntitlementService
                    .getActiveLicense(institutionCert.getInstitution().getInstitutionId());
            if (license.isPresent()) {
                features.addAll(institutionalEntitlementService
                        .getInstitutionalEntitlements(institutionCert.getInstitution().getInstitutionId())
                        .keySet());
            }
        }
        return features;
    }

    private Set<String> planFeatures(Long subscriptionPlanId) {
        Set<String> codes = new HashSet<>();
        for (PlanEntitlement entitlement :
                planEntitlementRepository.findBySubscriptionPlan_SubscriptionPlanId(subscriptionPlanId)) {
            if (entitlement.isEnabled()) {
                codes.add(entitlement.getEntitlementCode());
            }
        }
        return codes;
    }
}
