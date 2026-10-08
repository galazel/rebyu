package com.capstone.rebyu.billing.entitlement;

import lombok.Getter;

@Getter
public class PremiumAccessRequiredException extends RuntimeException {

    private final String code = "PREMIUM_ACCESS_REQUIRED";
    private final String feature;
    private final String eligiblePlan;

    public PremiumAccessRequiredException(String feature) {
        super("This feature requires REBYU Pro or an eligible institutional license.");
        this.feature = feature;
        this.eligiblePlan = "PRO_MONTHLY";
    }

    public PremiumAccessRequiredException(String feature, boolean personalProOnly) {
        super(personalProOnly
                ? "This feature requires an active personal REBYU Pro subscription."
                : "This feature requires REBYU Pro or an eligible institutional license.");
        this.feature = feature;
        this.eligiblePlan = "PRO_MONTHLY";
    }
}
