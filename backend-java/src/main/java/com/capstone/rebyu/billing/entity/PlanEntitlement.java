package com.capstone.rebyu.billing.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One entitlement a plan grants. A feature flag when only `enabled` matters; a
 * capacity limit when `limitValue` is set (e.g. SEAT_LIMIT = 75).
 */
@Entity
@Table(name = "plan_entitlements",
        uniqueConstraints = @UniqueConstraint(columnNames = {"subscription_plan_id", "entitlement_code"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanEntitlement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long planEntitlementId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_plan_id", nullable = false)
    private SubscriptionPlan subscriptionPlan;

    @Column(name = "entitlement_code", nullable = false, length = 60)
    private String entitlementCode;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "limit_value")
    private Integer limitValue;
}
