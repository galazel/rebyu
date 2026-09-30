package com.capstone.rebyu.billing.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.billing.dto.EntitlementDtos.PlanEntitlementDto;
import com.capstone.rebyu.billing.dto.EntitlementDtos.SubscriptionPlanDto;
import com.capstone.rebyu.billing.service.InstitutionInvoiceService;
import com.capstone.rebyu.billing.service.SubscriptionPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/pricing")
@RequiredArgsConstructor
public class AdminPricingController {

    private final SubscriptionPlanService planService;
    private final CognitoAuthService auth;

    // ── Plans ────────────────────────────────────────────────────────────

    public record UpdatePlanRequest(
            String planName,
            String description,
            BigDecimal amount,
            String billingInterval,
            String status,
            Integer displayOrder,
            Boolean isCustomPricing
    ) {}

    public record CreatePlanRequest(
            String planCode,
            String planName,
            String customerType,
            String description,
            BigDecimal amount,
            String billingInterval,
            String currency,
            Integer displayOrder
    ) {}

    public record UpdateEntitlementsRequest(
            List<PlanEntitlementDto> entitlements
    ) {}

    public record UpdatePartnershipPricingRequest(
            BigDecimal pricePerSlot
    ) {}

    @GetMapping("/plans")
    public List<SubscriptionPlanDto> listPlans(@AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return planService.getAllPlans();
    }

    @GetMapping("/plans/{id}")
    public SubscriptionPlanDto getPlan(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        requireAdmin(jwt);
        return planService.getPlan(id);
    }

    @PostMapping("/plans")
    public SubscriptionPlanDto createPlan(@AuthenticationPrincipal Jwt jwt,
                                          @RequestBody CreatePlanRequest request) {
        requireAdmin(jwt);
        return planService.createPlan(
                request.planCode(), request.planName(), request.customerType(),
                request.description(), request.amount(), request.billingInterval(),
                request.currency(), request.displayOrder());
    }

    @PutMapping("/plans/{id}")
    public SubscriptionPlanDto updatePlan(@AuthenticationPrincipal Jwt jwt,
                                          @PathVariable Long id,
                                          @RequestBody UpdatePlanRequest request) {
        requireAdmin(jwt);
        return planService.updatePlan(id,
                request.planName(), request.description(), request.amount(),
                request.billingInterval(), request.status(), request.displayOrder(),
                request.isCustomPricing());
    }

    // ── Entitlements ─────────────────────────────────────────────────────

    @PutMapping("/plans/{id}/entitlements")
    public SubscriptionPlanDto updateEntitlements(@AuthenticationPrincipal Jwt jwt,
                                                   @PathVariable Long id,
                                                   @RequestBody UpdateEntitlementsRequest request) {
        requireAdmin(jwt);
        return planService.updateEntitlements(id, request.entitlements());
    }

    @DeleteMapping("/plans/{planId}/entitlements/{code}")
    public void deleteEntitlement(@AuthenticationPrincipal Jwt jwt,
                                   @PathVariable Long planId,
                                   @PathVariable String code) {
        requireAdmin(jwt);
        planService.deleteEntitlement(planId, code);
    }

    // ── Partnership pricing ──────────────────────────────────────────────

    @GetMapping("/partnership")
    public Map<String, Object> getPartnershipPricing(@AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return Map.of(
                "pricePerSlot", InstitutionInvoiceService.getPricePerSlot(),
                "currency", InstitutionInvoiceService.CURRENCY);
    }

    @PutMapping("/partnership")
    public Map<String, Object> updatePartnershipPricing(@AuthenticationPrincipal Jwt jwt,
                                                         @RequestBody UpdatePartnershipPricingRequest request) {
        requireAdmin(jwt);
        InstitutionInvoiceService.setPricePerSlot(request.pricePerSlot());
        return Map.of(
                "pricePerSlot", InstitutionInvoiceService.getPricePerSlot(),
                "currency", InstitutionInvoiceService.CURRENCY);
    }

    // ── Auth ─────────────────────────────────────────────────────────────

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
