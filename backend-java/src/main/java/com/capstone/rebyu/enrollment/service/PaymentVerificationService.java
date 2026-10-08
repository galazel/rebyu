package com.capstone.rebyu.enrollment.service;

import com.capstone.rebyu.enrollment.entity.LearnerOrder;

public interface PaymentVerificationService {

    boolean verify(LearnerOrder order, String paymentReference);

    String providerName();
}
