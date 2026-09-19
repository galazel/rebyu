package com.capstone.rebyu.billing.service;

import com.capstone.rebyu.billing.client.PayMongoClient;
import com.capstone.rebyu.billing.entity.BillingStatus;
import com.capstone.rebyu.billing.entity.LearnerSubscription;
import com.capstone.rebyu.billing.entity.SubscriptionPlan;
import com.capstone.rebyu.billing.repository.LearnerSubscriptionRepository;
import com.capstone.rebyu.billing.repository.SubscriptionPlanRepository;
import com.capstone.rebyu.notification.service.NotificationService;
import com.capstone.rebyu.user.entity.Learner;
import com.capstone.rebyu.user.repository.LearnerRepository;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PaymentWebhookService {

    private final LearnerSubscriptionRepository learnerSubscriptionRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final InvoiceEmailService invoiceEmails;
    private final LearnerRepository learnerRepository;
    private final NotificationService notifications;
    private final PayMongoClient payMongo;

    /**
     * Activate (or idempotently re-confirm) a subscription from a completed
     * PayMongo Hosted Checkout Session. This is the one path both the
     * frontend's post-redirect verify call AND the webhook delivery funnel
     * into, so whichever arrives first does the work and the second is a
     * no-op -- there is no dependency on webhook delivery actually reaching
     * this server (which, in local/test-mode dev, it usually can't).
     *
     * <p>{@code providerReference} is the checkout session id: stable, unique
     * per attempt, and already used as the idempotency key.
     */
    public LearnerSubscription activateFromCheckoutSession(
            Long learnerId, Long planId, String providerReference) {
        Optional<LearnerSubscription> existing =
                learnerSubscriptionRepository.findByProviderSubscriptionId(providerReference);
        if (existing.isPresent()) {
            log.info("Checkout session {} already activated a subscription; skipping duplicate.", providerReference);
            return existing.get();
        }

        SubscriptionPlan plan = subscriptionPlanRepository.findById(planId)
                .orElseThrow(() -> new EntityNotFoundException("Subscription plan not found: " + planId));

        LocalDateTime now = LocalDateTime.now();

        // Paid, but not yet Pro: PayMongo is in test mode, so an admin approves
        // every subscription before it grants anything. The period starts on
        // approval, not here, so the wait does not eat into the paid month.
        LearnerSubscription subscription = LearnerSubscription.builder()
                .learner(Learner.builder().learnerId(learnerId).build())
                .subscriptionPlan(plan)
                .provider("PAYMONGO")
                .providerSubscriptionId(providerReference)
                .status(BillingStatus.PENDING)
                .amountPaid(plan.getAmount())
                .paidAt(now)
                .createdAt(now)
                .updatedAt(now)
                .build();

        LearnerSubscription saved = learnerSubscriptionRepository.save(subscription);
        // Only a newly recorded payment gets an invoice; the duplicate delivery
        // (return page + webhook) returned above without reaching here.
        invoiceEmails.sendInvoiceAfterCommit(saved);
        log.info("Checkout paid for learner={} plan={} session={}; awaiting admin approval",
                learnerId, planId, providerReference);
        return saved;
    }

    /** Admin approval: the subscription becomes Pro from this moment. */
    public LearnerSubscription approve(Long subscriptionId, Long adminUserId) {
        LearnerSubscription subscription = requireAwaitingApproval(subscriptionId);
        LocalDateTime now = LocalDateTime.now();
        subscription.setStatus(BillingStatus.ACTIVE);
        subscription.setStartedAt(now);
        subscription.setCurrentPeriodStart(now);
        subscription.setCurrentPeriodEnd(computePeriodEnd(now, subscription.getSubscriptionPlan().getBillingInterval()));
        subscription.setReviewedAt(now);
        subscription.setReviewedByUserId(adminUserId);
        subscription.setReviewNote(null);
        subscription.setUpdatedAt(now);
        log.info("Subscription {} approved by user {}", subscriptionId, adminUserId);
        LearnerSubscription saved = learnerSubscriptionRepository.save(subscription);
        invoiceEmails.sendActivationAfterCommit(saved);
        notifyLearner(saved, "Your Pro subscription is approved",
                "Pro is active now. Retakes, mock exams, the AI tutor and every challenge are unlocked.");
        return saved;
    }

    /** Admin rejection: nothing is granted, and the learner sees the note. */
    public LearnerSubscription reject(Long subscriptionId, Long adminUserId, String note) {
        LearnerSubscription subscription = requireAwaitingApproval(subscriptionId);
        LocalDateTime now = LocalDateTime.now();
        subscription.setStatus(BillingStatus.CANCELED);
        subscription.setCanceledAt(now);
        subscription.setEndedAt(now);
        subscription.setReviewedAt(now);
        subscription.setReviewedByUserId(adminUserId);
        subscription.setReviewNote(note == null || note.isBlank() ? null : note.trim());
        subscription.setUpdatedAt(now);
        log.info("Subscription {} rejected by user {}", subscriptionId, adminUserId);

        // Nothing was granted, so the money goes back: the payment behind the
        // checkout session is refunded in full through PayMongo.
        refund(subscription, "REBYU subscription rejected: " + (subscription.getReviewNote() == null ? "not approved" : subscription.getReviewNote()));

        LearnerSubscription saved = learnerSubscriptionRepository.save(subscription);
        // The learner hears about it the same two ways an approval reaches
        // them: an email, and the bell in the portal.
        invoiceEmails.sendRejectionAfterCommit(saved);
        String reason = saved.getReviewNote();
        String refundLine = saved.getRefundId() != null ? " Your payment has been refunded." : "";
        notifyLearner(saved, "Your Pro subscription was not approved",
                (reason == null ? "Pro has not been switched on." : "Reason: " + reason) + refundLine);
        return saved;
    }

    private void refund(LearnerSubscription subscription, String notes) {
        if (subscription.getRefundId() != null || subscription.getAmountPaid() == null) return;
        String paymentId = payMongo.paymentIdForSession(subscription.getProviderSubscriptionId());
        long cents = subscription.getAmountPaid().movePointRight(2).longValue();
        String refundId = paymentId == null ? null : payMongo.refundPayment(paymentId, cents, notes);
        if (refundId == null) {
            log.error("Subscription {} was rejected but its payment ({}) could not be refunded; refund it by hand in PayMongo.",
                    subscription.getLearnerSubscriptionId(), subscription.getProviderSubscriptionId());
            return;
        }
        subscription.setRefundId(refundId);
        subscription.setRefundedAt(LocalDateTime.now());
    }

    /**
     * Run daily: settles every Pro subscription whose paid period has lapsed.
     * One the learner cancelled simply ends. One they kept is renewed for
     * another period, the way a card on file would be charged -- in test mode
     * PayMongo's hosted checkout keeps no card, so the renewal is recorded
     * and invoiced without a real charge.
     */
    @org.springframework.scheduling.annotation.Scheduled(cron = "0 15 0 * * *", zone = "Asia/Manila")
    public void settleLapsedPeriods() {
        LocalDateTime now = LocalDateTime.now();
        for (LearnerSubscription s : learnerSubscriptionRepository.findByStatusAndCurrentPeriodEndBefore(BillingStatus.ACTIVE, now)) {
            if (s.isCancelAtPeriodEnd()) {
                s.setStatus(BillingStatus.EXPIRED);
                s.setEndedAt(s.getCurrentPeriodEnd());
                s.setUpdatedAt(now);
                learnerSubscriptionRepository.save(s);
                notifyLearner(s, "Your Pro subscription has ended",
                        "Your paid period is over and renewal was cancelled. You are back on the free plan.");
                log.info("Subscription {} ended after its cancelled period", s.getLearnerSubscriptionId());
                continue;
            }
            LocalDateTime start = s.getCurrentPeriodEnd();
            LocalDateTime end = computePeriodEnd(start, s.getSubscriptionPlan().getBillingInterval());
            if (end == null) continue;
            s.setCurrentPeriodStart(start);
            s.setCurrentPeriodEnd(end);
            s.setAmountPaid(s.getSubscriptionPlan().getAmount());
            s.setPaidAt(now);
            s.setUpdatedAt(now);
            LearnerSubscription saved = learnerSubscriptionRepository.save(s);
            invoiceEmails.sendRenewalAfterCommit(saved);
            notifyLearner(saved, "Your Pro subscription renewed",
                    "Another period was charged (test mode) and Pro continues. Cancel renewal any time from your plan.");
            log.info("Subscription {} auto-renewed until {}", s.getLearnerSubscriptionId(), end);
        }
    }

    /* Resolved inside the transaction: the subscription only holds a learner id. */
    private void notifyLearner(LearnerSubscription subscription, String title, String body) {
        Long learnerId = subscription.getLearner() == null ? null : subscription.getLearner().getLearnerId();
        if (learnerId == null) return;
        learnerRepository.findById(learnerId)
                .map(Learner::getUser)
                .ifPresent(user -> notifications.notify(user, title, body, "/learner/subscription"));
    }

    /** Ends a Pro subscription at once (admin), e.g. to reset a test account. */
    public LearnerSubscription revoke(Long subscriptionId, Long adminUserId) {
        LearnerSubscription subscription = learnerSubscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new EntityNotFoundException("Subscription not found: " + subscriptionId));
        if (!subscription.isCurrentlyActive()) {
            throw new IllegalStateException("Only an active subscription can be revoked.");
        }
        LocalDateTime now = LocalDateTime.now();
        subscription.setStatus(BillingStatus.CANCELED);
        subscription.setCanceledAt(now);
        subscription.setEndedAt(now);
        subscription.setCurrentPeriodEnd(now);
        subscription.setReviewedByUserId(adminUserId);
        subscription.setUpdatedAt(now);
        return learnerSubscriptionRepository.save(subscription);
    }

    private LearnerSubscription requireAwaitingApproval(Long subscriptionId) {
        LearnerSubscription subscription = learnerSubscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new EntityNotFoundException("Subscription not found: " + subscriptionId));
        if (!subscription.isAwaitingApproval()) {
            throw new IllegalStateException("This subscription is not waiting for approval.");
        }
        return subscription;
    }

    /** Cancel-at-period-end: access continues until the paid period lapses. */
    public LearnerSubscription cancelAtPeriodEnd(Long learnerId) {
        LearnerSubscription subscription = learnerSubscriptionRepository
                .findFirstByLearner_LearnerIdOrderByCreatedAtDesc(learnerId)
                .orElseThrow(() -> new EntityNotFoundException("No subscription found for learner: " + learnerId));
        if (!subscription.isCurrentlyActive()) {
            throw new IllegalStateException("This subscription is not currently active.");
        }
        subscription.setCancelAtPeriodEnd(true);
        subscription.setCanceledAt(LocalDateTime.now());
        subscription.setUpdatedAt(LocalDateTime.now());
        return learnerSubscriptionRepository.save(subscription);
    }

    private LocalDateTime computePeriodEnd(LocalDateTime start, SubscriptionPlan.BillingInterval interval) {
        if (interval == null) {
            return null;
        }
        return switch (interval) {
            case MONTHLY -> start.plusMonths(1);
            case QUARTERLY -> start.plusMonths(3);
            case SEMI_ANNUAL -> start.plusMonths(6);
            case ANNUAL -> start.plusYears(1);
            // NONE (free) and CUSTOM (institution-negotiated) have no fixed
            // renewal cadence enforced here.
            case NONE, CUSTOM -> null;
        };
    }

    /**
     * checkout_session.payment.paid: the real PayMongo event for the Hosted
     * Checkout Sessions flow this app actually uses. sessionData is the
     * checkout session object nested under the event (data.attributes.data).
     */
    public void handleCheckoutSessionPaymentPaid(JsonNode sessionData) {
        String sessionId = sessionData.path("id").asText();
        JsonNode metadata = sessionData.path("attributes").path("metadata");
        Long learnerId = metadata.path("learnerId").asLong(0);
        Long planId = metadata.path("planId").asLong(0);

        if (sessionId.isBlank() || learnerId <= 0 || planId <= 0) {
            log.warn("checkout_session.payment.paid missing id/metadata; sessionId={} learnerId={} planId={}",
                    sessionId, learnerId, planId);
            return;
        }
        activateFromCheckoutSession(learnerId, planId, sessionId);
    }

    /**
     * A one-time checkout charge failed. There is no subscription to update
     * yet at this point (activation only happens on success), so this is
     * purely observability for now -- surfaced here instead of silently
     * dropped like before.
     */
    public void handleChargeFailed(JsonNode chargeData) {
        String chargeId = chargeData.path("id").asText();
        JsonNode metadata = chargeData.path("attributes").path("metadata");
        Long learnerId = metadata.path("learnerId").asLong(0);
        log.warn("PayMongo charge failed: chargeId={} learnerId={}", chargeId, learnerId);
    }

    /**
     * Legacy charge.updated/charge.succeeded handling, kept for PayMongo
     * event shapes that carry a flat charge object with metadata directly on
     * data.attributes (as opposed to the nested checkout-session shape).
     */
    public void handleChargeUpdated(JsonNode chargeData) {
        String chargeId = chargeData.path("id").asText();
        String status = chargeData.path("attributes").path("status").asText();
        log.info("Processing charge update: {} status={}", chargeId, status);
        if ("succeeded".equals(status)) {
            JsonNode metadata = chargeData.path("attributes").path("metadata");
            Long learnerId = metadata.path("learnerId").asLong(0);
            Long planId = metadata.path("planId").asLong(0);
            if (learnerId > 0 && planId > 0) {
                activateFromCheckoutSession(learnerId, planId, chargeId);
            }
        }
    }

    /** subscription.updated: kept for forward-compatibility if a real recurring PayMongo Subscription is ever created. */
    public void handleSubscriptionUpdated(JsonNode subscriptionData) {
        String payMongoSubId = subscriptionData.path("id").asText();
        String status = subscriptionData.path("attributes").path("status").asText();
        String currentPeriodEnd = subscriptionData.path("attributes").path("current_period_end").asText();

        log.info("Processing subscription update: {} status={}", payMongoSubId, status);

        learnerSubscriptionRepository.findByProviderSubscriptionId(payMongoSubId).ifPresent(subscription -> {
            subscription.setStatus(mapPayMongoStatus(status));
            if ("active".equals(status)) {
                subscription.setCurrentPeriodStart(LocalDateTime.now());
                subscription.setCurrentPeriodEnd(parseDateTime(currentPeriodEnd));
            }
            subscription.setUpdatedAt(LocalDateTime.now());
            learnerSubscriptionRepository.save(subscription);
        });
    }

    public void handleSubscriptionPaymentSuccessful(JsonNode paymentData) {
        String payMongoSubId = paymentData.path("attributes").path("subscription_id").asText();
        log.info("Subscription payment successful: {}", payMongoSubId);
        learnerSubscriptionRepository.findByProviderSubscriptionId(payMongoSubId).ifPresent(subscription -> {
            subscription.setStatus(BillingStatus.ACTIVE);
            subscription.setUpdatedAt(LocalDateTime.now());
            learnerSubscriptionRepository.save(subscription);
        });
    }

    public void handleSubscriptionPaymentFailed(JsonNode paymentData) {
        String payMongoSubId = paymentData.path("attributes").path("subscription_id").asText();
        log.warn("Subscription payment failed: {}", payMongoSubId);
        learnerSubscriptionRepository.findByProviderSubscriptionId(payMongoSubId).ifPresent(subscription -> {
            subscription.setStatus(BillingStatus.PAYMENT_FAILED);
            subscription.setUpdatedAt(LocalDateTime.now());
            learnerSubscriptionRepository.save(subscription);
        });
    }

    private BillingStatus mapPayMongoStatus(String payMongoStatus) {
        return switch (payMongoStatus) {
            case "active" -> BillingStatus.ACTIVE;
            case "canceled" -> BillingStatus.CANCELED;
            case "trialing" -> BillingStatus.TRIALING;
            case "incomplete" -> BillingStatus.PENDING;
            case "incomplete_expired" -> BillingStatus.EXPIRED;
            default -> BillingStatus.PENDING;
        };
    }

    private LocalDateTime parseDateTime(String dateString) {
        if (dateString == null || dateString.isBlank()) return null;
        try {
            ZonedDateTime zdt = ZonedDateTime.parse(dateString);
            return zdt.toLocalDateTime();
        } catch (Exception e) {
            log.warn("Failed to parse date: {}", dateString);
            return null;
        }
    }
}
