package com.capstone.rebyu.billing.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "subscription_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlan {

    public enum CustomerType {
        INDIVIDUAL, INSTITUTION
    }

    public enum BillingInterval {
        NONE, MONTHLY, QUARTERLY, SEMI_ANNUAL, ANNUAL, CUSTOM
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long subscriptionPlanId;

    @Column(name = "plan_code", nullable = false, unique = true, length = 50)
    private String planCode;

    @Column(name = "plan_name", nullable = false, length = 150)
    private String planName;

    @Enumerated(EnumType.STRING)
    @Column(name = "customer_type", nullable = false, length = 20)
    private CustomerType customerType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_interval", nullable = false, length = 20)
    private BillingInterval billingInterval = BillingInterval.NONE;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(nullable = false, length = 3)
    private String currency = "PHP";

    @Column(name = "is_free", nullable = false)
    private boolean isFree = false;

    @Column(name = "is_custom_pricing", nullable = false)
    private boolean isCustomPricing = false;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "subscriptionPlan", fetch = FetchType.LAZY)
    private List<PlanEntitlement> entitlements = new ArrayList<>();
}
