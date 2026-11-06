package com.capstone.rebyu.aigateway.common;

import lombok.Getter;

import java.time.Instant;

/** Every AI tutor feature is locked for this learner until {@link #getLockedUntil()}. */
@Getter
public class TutorLockedException extends RuntimeException {

    public static final String CODE = "TUTOR_LOCKED";

    private final Instant lockedUntil;

    public TutorLockedException(Instant lockedUntil) {
        super("Your AI tutor access is paused because of repeated unsafe messages.");
        this.lockedUntil = lockedUntil;
    }
}
