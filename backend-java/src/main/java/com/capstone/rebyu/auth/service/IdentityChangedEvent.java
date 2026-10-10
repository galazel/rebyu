package com.capstone.rebyu.auth.service;

/**
 * A user's role, account status or linked profile changed, so the identity
 * {@link CognitoAuthService} caches for them is stale and must be resolved again.
 */
public record IdentityChangedEvent(String cognitoSub) {
}
