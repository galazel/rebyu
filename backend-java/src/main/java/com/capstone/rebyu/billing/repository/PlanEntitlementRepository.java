package com.capstone.rebyu.billing.repository;

import com.capstone.rebyu.billing.entity.PlanEntitlement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlanEntitlementRepository extends JpaRepository<PlanEntitlement, Long> {
    List<PlanEntitlement> findBySubscriptionPlan_SubscriptionPlanId(Long subscriptionPlanId);

    Optional<PlanEntitlement> findBySubscriptionPlan_SubscriptionPlanIdAndEntitlementCode(
            Long subscriptionPlanId, String entitlementCode);
}
