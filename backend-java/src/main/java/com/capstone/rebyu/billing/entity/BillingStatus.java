package com.capstone.rebyu.billing.entity;

public enum BillingStatus {
    PENDING, TRIALING, ACTIVE, PAST_DUE, SUSPENDED, CANCELED, EXPIRED, PAYMENT_FAILED;

    public boolean grantsAccess() {
        return this == ACTIVE || this == TRIALING;
    }
}
