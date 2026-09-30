package com.capstone.rebyu.billing.service;

import com.capstone.rebyu.billing.dto.EntitlementDtos.PlanEntitlementDto;
import com.capstone.rebyu.billing.dto.EntitlementDtos.SubscriptionPlanDto;
import com.capstone.rebyu.billing.entity.PlanEntitlement;
import com.capstone.rebyu.billing.entity.SubscriptionPlan;
import com.capstone.rebyu.billing.repository.PlanEntitlementRepository;
import com.capstone.rebyu.billing.repository.SubscriptionPlanRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SubscriptionPlanService {

    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final PlanEntitlementRepository planEntitlementRepository;

    @Transactional(readOnly = true)
    public List<SubscriptionPlanDto> getPlans(SubscriptionPlan.CustomerType customerType) {
        return subscriptionPlanRepository
                .findByCustomerTypeAndStatusOrderByDisplayOrderAsc(customerType, "ACTIVE")
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SubscriptionPlanDto> getAllPlans() {
        return subscriptionPlanRepository.findAllByOrderByDisplayOrderAsc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public SubscriptionPlanDto getPlan(Long id) {
        return toDto(subscriptionPlanRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Plan not found: " + id)));
    }

    @Transactional
    public SubscriptionPlanDto updatePlan(Long id, String planName, String description,
                                          BigDecimal amount, String billingInterval,
                                          String status, Integer displayOrder,
                                          Boolean isCustomPricing) {
        SubscriptionPlan plan = subscriptionPlanRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Plan not found: " + id));

        if (planName != null) plan.setPlanName(planName);
        if (description != null) plan.setDescription(description);
        if (amount != null) {
            plan.setAmount(amount);
            plan.setFree(amount.compareTo(BigDecimal.ZERO) == 0);
        }
        if (billingInterval != null) plan.setBillingInterval(
                SubscriptionPlan.BillingInterval.valueOf(billingInterval));
        if (status != null) plan.setStatus(status);
        if (displayOrder != null) plan.setDisplayOrder(displayOrder);
        if (isCustomPricing != null) plan.setCustomPricing(isCustomPricing);
        plan.setUpdatedAt(LocalDateTime.now());

        return toDto(subscriptionPlanRepository.save(plan));
    }

    @Transactional
    public SubscriptionPlanDto createPlan(String planCode, String planName, String customerType,
                                          String description, BigDecimal amount,
                                          String billingInterval, String currency,
                                          Integer displayOrder) {
        if (subscriptionPlanRepository.findByPlanCode(planCode).isPresent()) {
            throw new IllegalArgumentException("Plan code already exists: " + planCode);
        }
        LocalDateTime now = LocalDateTime.now();
        SubscriptionPlan plan = SubscriptionPlan.builder()
                .planCode(planCode)
                .planName(planName)
                .customerType(SubscriptionPlan.CustomerType.valueOf(customerType))
                .description(description)
                .amount(amount != null ? amount : BigDecimal.ZERO)
                .billingInterval(billingInterval != null
                        ? SubscriptionPlan.BillingInterval.valueOf(billingInterval)
                        : SubscriptionPlan.BillingInterval.NONE)
                .currency(currency != null ? currency : "PHP")
                .isFree(amount == null || amount.compareTo(BigDecimal.ZERO) == 0)
                .displayOrder(displayOrder != null ? displayOrder : 0)
                .status("ACTIVE")
                .createdAt(now)
                .updatedAt(now)
                .build();
        return toDto(subscriptionPlanRepository.save(plan));
    }

    @Transactional
    public SubscriptionPlanDto updateEntitlements(Long planId, List<PlanEntitlementDto> entitlements) {
        SubscriptionPlan plan = subscriptionPlanRepository.findById(planId)
                .orElseThrow(() -> new EntityNotFoundException("Plan not found: " + planId));

        for (PlanEntitlementDto dto : entitlements) {
            PlanEntitlement existing = planEntitlementRepository
                    .findBySubscriptionPlan_SubscriptionPlanIdAndEntitlementCode(planId, dto.entitlementCode())
                    .orElse(null);

            if (existing != null) {
                existing.setEnabled(dto.enabled());
                existing.setLimitValue(dto.limitValue());
                planEntitlementRepository.save(existing);
            } else {
                planEntitlementRepository.save(PlanEntitlement.builder()
                        .subscriptionPlan(plan)
                        .entitlementCode(dto.entitlementCode())
                        .enabled(dto.enabled())
                        .limitValue(dto.limitValue())
                        .build());
            }
        }

        plan.setUpdatedAt(LocalDateTime.now());
        subscriptionPlanRepository.save(plan);
        return toDto(plan);
    }

    @Transactional
    public void deleteEntitlement(Long planId, String entitlementCode) {
        PlanEntitlement ent = planEntitlementRepository
                .findBySubscriptionPlan_SubscriptionPlanIdAndEntitlementCode(planId, entitlementCode)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Entitlement " + entitlementCode + " not found on plan " + planId));
        planEntitlementRepository.delete(ent);
    }

    private SubscriptionPlanDto toDto(SubscriptionPlan plan) {
        List<PlanEntitlementDto> entitlements = planEntitlementRepository
                .findBySubscriptionPlan_SubscriptionPlanId(plan.getSubscriptionPlanId())
                .stream()
                .map(entitlement -> new PlanEntitlementDto(
                        entitlement.getEntitlementCode(),
                        entitlement.isEnabled(),
                        entitlement.getLimitValue()))
                .toList();
        return new SubscriptionPlanDto(
                plan.getSubscriptionPlanId(),
                plan.getPlanCode(),
                plan.getPlanName(),
                plan.getCustomerType().name(),
                plan.getDescription(),
                plan.getBillingInterval().name(),
                plan.getAmount(),
                plan.getCurrency(),
                plan.isFree(),
                plan.isCustomPricing(),
                plan.getStatus(),
                entitlements);
    }
}
