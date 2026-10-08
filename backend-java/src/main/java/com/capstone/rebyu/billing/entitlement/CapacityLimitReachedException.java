package com.capstone.rebyu.billing.entitlement;

import lombok.Getter;

@Getter
public class CapacityLimitReachedException extends RuntimeException {

    private final String code;
    private final int limit;
    private final int used;

    public CapacityLimitReachedException(String code, int limit, int used, String message) {
        super(message);
        this.code = code;
        this.limit = limit;
        this.used = used;
    }
}
