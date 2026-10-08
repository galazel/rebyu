package com.capstone.rebyu.enrollment.service;

import com.capstone.rebyu.enrollment.entity.LearnerOrder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class DevSimulatedPaymentVerifier implements PaymentVerificationService {

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
