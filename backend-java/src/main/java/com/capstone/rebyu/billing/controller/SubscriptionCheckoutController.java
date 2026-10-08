package com.capstone.rebyu.billing.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.billing.client.PayMongoClient;
import com.capstone.rebyu.billing.entity.LearnerSubscription;
import com.capstone.rebyu.billing.entity.SubscriptionPlan;
import com.capstone.rebyu.billing.repository.SubscriptionPlanRepository;
import com.capstone.rebyu.billing.service.PaymentWebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/subscription")
@RequiredArgsConstructor
public class SubscriptionCheckoutController {

    private final PayMongoClient payMongoClient;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final PaymentWebhookService paymentWebhookService;
    private final com.capstone.rebyu.billing.repository.LearnerSubscriptionRepository learnerSubscriptionRepository;
    private final CognitoAuthService auth;

    @PostMapping("/checkout/{planId}")
    public ResponseEntity<?> initiateCheckout(
            @PathVariable Long planId,
            @AuthenticationPrincipal Jwt jwt) {

        if (jwt == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }

        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (user.learnerId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Learner account required"));
        }

        SubscriptionPlan plan = subscriptionPlanRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));

        if (plan.isFree()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only premium plans can be purchased"));
        }
        if (!payMongoClient.isEnabled()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", payMongoClient.disabledReason(), "message", payMongoClient.disabledReason()));
        }

        var current = learnerSubscriptionRepository.findFirstByLearner_LearnerIdOrderByCreatedAtDesc(user.learnerId());
        if (current.isPresent() && current.get().isAwaitingApproval()) {
            String message = "Your Pro payment is already waiting for an admin to approve it.";
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", message, "message", message));
        }
        if (current.isPresent() && current.get().isCurrentlyActive() && !current.get().getSubscriptionPlan().isFree()) {
            String message = "You already have REBYU Pro.";
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", message, "message", message));
        }

        String checkoutUrl = payMongoClient.createHostedCheckout(
                user.learnerId(),
                planId,
                plan.getPlanCode(),
                plan.getAmount().multiply(java.math.BigDecimal.valueOf(100)).longValue(),
                plan.getPlanName()
        );

        if (checkoutUrl == null) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create checkout"));
        }

        log.info("Checkout initiated for learner={}, plan={}", user.learnerId(), planId);
        String sessionId = payMongoClient.lastSessionFor(user.learnerId());
        return ResponseEntity.ok(sessionId == null
                ? Map.of("checkout_url", checkoutUrl)
                : Map.of("checkout_url", checkoutUrl, "session_id", sessionId));
    }

    @GetMapping("/verify-latest")
    public ResponseEntity<?> verifyLatest(
            @RequestParam(required = false) String sessionId,
            @AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        String id = sessionId != null && sessionId.startsWith("cs_") ? sessionId
                : user.learnerId() == null ? null : payMongoClient.lastSessionFor(user.learnerId());
        if (id == null) {
            var latest = user.learnerId() == null ? java.util.Optional.<com.capstone.rebyu.billing.entity.LearnerSubscription>empty()
                    : learnerSubscriptionRepository.findFirstByLearner_LearnerIdOrderByCreatedAtDesc(user.learnerId());
            if (latest.isPresent() && latest.get().isAwaitingApproval()) {
                return ResponseEntity.ok(Map.of("status", "awaiting_approval",
                        "message", "Payment received. An admin will approve your Pro access shortly."));
            }
            return ResponseEntity.ok(Map.of("status", "pending",
                    "message", "We could not find your checkout. If you paid, open the subscription page in a minute."));
        }
        return verifyPayment(id, jwt);
    }

    @GetMapping("/verify/{sessionId}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> verifyPayment(
            @PathVariable String sessionId,
            @AuthenticationPrincipal Jwt jwt) {

        if (jwt == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (user.learnerId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Learner account required"));
        }

        Map<String, Object> session = payMongoClient.getCheckoutSession(sessionId);
        if (session == null) {
            return ResponseEntity.ok(Map.of("status", "pending", "message", "Payment still processing"));
        }
        Map<String, Object> attributes = (Map<String, Object>) session.get("attributes");
        if (attributes == null || !"paid".equalsIgnoreCase(String.valueOf(attributes.get("payment_status")))) {
            return ResponseEntity.ok(Map.of("status", "pending", "message", "Payment still processing"));
        }

        Map<String, Object> metadata = (Map<String, Object>) attributes.get("metadata");
        Long metadataLearnerId = metadata != null && metadata.get("learnerId") != null
                ? Long.valueOf(String.valueOf(metadata.get("learnerId"))) : null;
        Long metadataPlanId = metadata != null && metadata.get("planId") != null
                ? Long.valueOf(String.valueOf(metadata.get("planId"))) : null;

        if (metadataLearnerId == null || metadataPlanId == null || !metadataLearnerId.equals(user.learnerId())) {
            log.warn("Checkout session {} metadata does not match caller learnerId={}", sessionId, user.learnerId());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "This checkout session does not belong to you"));
        }

        LearnerSubscription subscription =
                paymentWebhookService.activateFromCheckoutSession(metadataLearnerId, metadataPlanId, sessionId);
        log.info("Payment verified for learner={}, session={}", user.learnerId(), sessionId);
        return ResponseEntity.ok(Map.of(
                "status", subscription.isAwaitingApproval() ? "awaiting_approval" : "success",
                "message", subscription.isAwaitingApproval()
                        ? "Payment received. An admin will approve your Pro access shortly."
                        : "Payment successful",
                "subscriptionStatus", subscription.getStatus().name(),
                "currentPeriodEnd", String.valueOf(subscription.getCurrentPeriodEnd())
        ));
    }

    @PostMapping("/cancel")
    public ResponseEntity<?> cancelSubscription(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (user.learnerId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Learner account required"));
        }
        try {
            LearnerSubscription subscription = paymentWebhookService.cancelAtPeriodEnd(user.learnerId());
            return ResponseEntity.ok(Map.of(
                    "status", "canceled",
                    "accessUntil", String.valueOf(subscription.getCurrentPeriodEnd())
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/plans")
    public ResponseEntity<?> getPlans() {
        var plans = subscriptionPlanRepository.findAll();
        return ResponseEntity.ok(plans);
    }
}
