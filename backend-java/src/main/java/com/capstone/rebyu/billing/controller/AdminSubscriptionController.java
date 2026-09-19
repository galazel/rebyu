package com.capstone.rebyu.billing.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.billing.entity.LearnerSubscription;
import com.capstone.rebyu.billing.repository.LearnerSubscriptionRepository;
import com.capstone.rebyu.billing.service.PaymentWebhookService;
import com.capstone.rebyu.user.entity.Learner;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * The admin's review queue for Pro.
 *
 * <p>Checkout runs against PayMongo's test mode, so a "paid" session is not
 * money and does not grant Pro on its own. It lands here as PENDING, and an
 * admin approves (Pro starts now) or rejects it.
 */
@RestController
@RequestMapping("/api/admin/subscriptions")
@RequiredArgsConstructor
public class AdminSubscriptionController {

    private final LearnerSubscriptionRepository subscriptions;
    private final PaymentWebhookService billing;
    private final CognitoAuthService auth;

    public record SubscriptionRow(
            Long learnerSubscriptionId,
            Long learnerId,
            String learnerName,
            String email,
            String planCode,
            String planName,
            BigDecimal amount,
            String currency,
            String status,
            boolean awaitingApproval,
            boolean active,
            String checkoutReference,
            LocalDateTime paidAt,
            LocalDateTime reviewedAt,
            LocalDateTime currentPeriodStart,
            LocalDateTime currentPeriodEnd,
            String reviewNote,
            String refundId,
            LocalDateTime refundedAt,
            LocalDateTime createdAt) {
    }

    public record ReviewRequest(String note) {
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<SubscriptionRow> list(@AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return subscriptions.findAllByOrderByCreatedAtDesc().stream().map(AdminSubscriptionController::row).toList();
    }

    @PostMapping("/{id}/approve")
    @Transactional
    public SubscriptionRow approve(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return row(billing.approve(id, requireAdmin(jwt).userId()));
    }

    @PostMapping("/{id}/reject")
    @Transactional
    public SubscriptionRow reject(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                  @RequestBody(required = false) ReviewRequest request) {
        return row(billing.reject(id, requireAdmin(jwt).userId(), request == null ? null : request.note()));
    }

    @PostMapping("/{id}/revoke")
    @Transactional
    public SubscriptionRow revoke(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return row(billing.revoke(id, requireAdmin(jwt).userId()));
    }

    private static SubscriptionRow row(LearnerSubscription s) {
        Learner learner = s.getLearner();
        String name = learner == null ? null
                : ((learner.getFirstName() == null ? "" : learner.getFirstName()) + " "
                + (learner.getLastName() == null ? "" : learner.getLastName())).trim();
        if (learner != null && (name == null || name.isEmpty())) {
            name = learner.getUsername();
        }
        var plan = s.getSubscriptionPlan();
        return new SubscriptionRow(
                s.getLearnerSubscriptionId(),
                learner == null ? null : learner.getLearnerId(),
                name,
                learner == null || learner.getUser() == null ? null : learner.getUser().getEmail(),
                plan == null ? null : plan.getPlanCode(),
                plan == null ? null : plan.getPlanName(),
                s.getAmountPaid() != null ? s.getAmountPaid() : plan == null ? null : plan.getAmount(),
                plan == null ? "PHP" : plan.getCurrency(),
                s.getStatus().name(),
                s.isAwaitingApproval(),
                s.isCurrentlyActive(),
                s.getProviderSubscriptionId(),
                s.getPaidAt(),
                s.getReviewedAt(),
                s.getCurrentPeriodStart(),
                s.getCurrentPeriodEnd(),
                s.getReviewNote(),
                s.getRefundId(),
                s.getRefundedAt(),
                s.getCreatedAt());
    }

    private CurrentUserDto requireAdmin(Jwt jwt) {
        if (jwt == null) {
            throw new IllegalArgumentException("Authentication is required");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (!"ADMIN".equalsIgnoreCase(user.role())) {
            throw new IllegalArgumentException("Admin access is required");
        }
        return user;
    }
}
