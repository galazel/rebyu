package com.capstone.rebyu.enrollment.service;

import com.capstone.rebyu.enrollment.entity.LearnerOrder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * DEV/TEST-ONLY payment verifier. No real payment provider is integrated in
 * this codebase, so this clearly labeled simulation accepts references that
 * embed the order number issued by the backend ("SIM-{orderNumber}"). Replace
 * with a real provider implementation before production use.
 */
@Slf4j
@Component
public class DevSimulatedPaymentVerifier implements PaymentVerificationService {

    /**
     * Off unless explicitly enabled. Enrollment is free today (the order price
     * is zero, so verification is never reached), but this bean is active in
     * every environment: left accepting "SIM-{orderNumber}", the day a
     * certification gets a price anyone could enroll in it without paying.
     */
    @Value("${rebyu.payments.simulated:false}")
    private boolean enabled;

    @Override
    public boolean verify(LearnerOrder order, String paymentReference) {
        if (!enabled) {
            log.warn("Simulated payment verification is disabled; refusing order {}", order.getOrderId());
            return false;
        }
        boolean valid = paymentReference != null
                && paymentReference.equals("SIM-" + order.getOrderNumber());
        if (!valid) {
            log.warn("Simulated payment verification failed for order {}", order.getOrderId());
        }
        return valid;
    }

    @Override
    public String providerName() {
        return "DEV_SIMULATED";
    }
}
