package com.capstone.rebyu.billing.entity;

import com.capstone.rebyu.user.entity.Learner;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** A learner's personal (B2C) subscription to an individual plan. */
@Entity
@Table(name = "learner_subscriptions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearnerSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long learnerSubscriptionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learner_id", nullable = false)
    private Learner learner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_plan_id", nullable = false)
    private SubscriptionPlan subscriptionPlan;

    @Column(length = 30)
    private String provider;

    @Column(name = "provider_customer_id", length = 100)
    private String providerCustomerId;

    @Column(name = "provider_subscription_id", length = 100)
    private String providerSubscriptionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BillingStatus status = BillingStatus.PENDING;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "current_period_start")
    private LocalDateTime currentPeriodStart;

    @Column(name = "current_period_end")
    private LocalDateTime currentPeriodEnd;

    @Column(name = "cancel_at_period_end", nullable = false)
    private boolean cancelAtPeriodEnd = false;

    @Column(name = "canceled_at")
    private LocalDateTime canceledAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    /*
     * The admin review step. PayMongo runs in test mode, so a "paid" checkout is
     * not money: a paid subscription waits in PENDING until an admin approves it
     * (ACTIVE, period starts then) or rejects it (CANCELED, with a note).
     */
    @Column(name = "amount_paid", precision = 12, scale = 2)
    private java.math.BigDecimal amountPaid;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "reviewed_by_user_id")
    private Long reviewedByUserId;

    @Column(name = "review_note", length = 500)
    private String reviewNote;

    /* A rejected payment is sent back. The refund id is PayMongo's; null on a
       rejection means the refund could not be made and must be done by hand. */
    @Column(name = "refund_id", length = 100)
    private String refundId;

    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /** Paid through checkout and waiting for an admin to approve it. */
    public boolean isAwaitingApproval() {
        return status == BillingStatus.PENDING && paidAt != null;
    }

    /** Active only while its status grants access AND the period has not lapsed. */
    public boolean isCurrentlyActive() {
        if (!status.grantsAccess()) {
            return false;
        }
        return currentPeriodEnd == null || currentPeriodEnd.isAfter(LocalDateTime.now());
    }
}
