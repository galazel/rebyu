package com.capstone.rebyu.auth.service;

import com.capstone.rebyu.user.entity.User;
import com.capstone.rebyu.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Optional;
import java.util.Set;

/**
 * One email holds one REBYU account, and that account has one role. An email already
 * registered as a learner cannot also become an institution or a department head (and
 * the reverse): the sign-in would land in whichever role the account holds, and the
 * other role's data would be lost or unreachable.
 *
 * Allowed role moves, by the role wanted:
 *  - INSTITUTION:     no account yet, or already an institution account.
 *  - DEPARTMENT_HEAD: no account yet, a department head, or an institution owner
 *                     (an owner may head its own school's departments; which school
 *                     is checked by SchoolMembershipGuard).
 *  - LEARNER:         no account yet, or already a learner.
 */
@Component
@RequiredArgsConstructor
public class AccountRoleGuard {

    private final UserRepository users;

    /** The role of the account registered under this email, if there is one. */
    @Transactional(readOnly = true)
    public Optional<String> existingRole(String email) {
        if (email == null || email.isBlank()) return Optional.empty();
        return users.findByEmailIgnoreCase(email.trim())
                .map(AccountRoleGuard::roleOf);
    }

    /** The existing role when it cannot become {@code wanted}; empty when the email is free for it. */
    @Transactional(readOnly = true)
    public Optional<String> conflictingRole(String email, String wanted) {
        return existingRole(email).filter(role -> !compatible(role, wanted));
    }

    /** Throws when the email already has an account whose role cannot become {@code wanted}. */
    public void requireFreeFor(String email, String wanted) {
        conflictingRole(email, wanted).ifPresent(role -> {
            throw new IllegalArgumentException(message(role, wanted));
        });
    }

    /**
     * For a signed-in account claiming a role (institution setup, department head code).
     * A brand-new sign-up is provisioned as LEARNER until it claims its role, so a LEARNER
     * account may claim only the role it signed up for ({@code declaredAccountType}, from
     * the sign-up's metadata). An account that signed up as a learner keeps that role.
     */
    public void requireCanClaim(User user, String declaredAccountType, String wanted) {
        String role = roleOf(user);
        if (CognitoAuthService.LEARNER_USER_TYPE.equals(role)
                && !CognitoAuthService.LEARNER_USER_TYPE.equals(wanted)) {
            if (signupTypeFor(wanted).equalsIgnoreCase(declaredAccountType == null ? "" : declaredAccountType.trim())) {
                return;
            }
            throw new IllegalArgumentException(message(role, wanted));
        }
        if (!compatible(role, wanted)) {
            throw new IllegalArgumentException(message(role, wanted));
        }
    }

    public static String roleOf(User user) {
        return user.getUserType() == null || user.getUserType().getUserTypeText() == null
                ? CognitoAuthService.LEARNER_USER_TYPE
                : user.getUserType().getUserTypeText().trim().toUpperCase(Locale.ROOT);
    }

    private static boolean compatible(String existing, String wanted) {
        if (existing.equals(wanted)) return true;
        return CognitoAuthService.DEPARTMENT_HEAD_USER_TYPE.equals(wanted)
                && CognitoAuthService.INSTITUTION_USER_TYPE.equals(existing);
    }

    private static final Set<String> STAFF = Set.of(
            CognitoAuthService.INSTITUTION_USER_TYPE, CognitoAuthService.DEPARTMENT_HEAD_USER_TYPE);

    private static String signupTypeFor(String wanted) {
        return CognitoAuthService.INSTITUTION_USER_TYPE.equals(wanted) ? "institution" : "department";
    }

    public static String label(String role) {
        return switch (role) {
            case CognitoAuthService.LEARNER_USER_TYPE -> "a learner";
            case CognitoAuthService.INSTITUTION_USER_TYPE -> "an institution";
            case CognitoAuthService.DEPARTMENT_HEAD_USER_TYPE -> "a department head";
            case "ADMIN" -> "an administrator";
            default -> "another";
        };
    }

    private static String message(String existing, String wanted) {
        String who = STAFF.contains(wanted) || CognitoAuthService.LEARNER_USER_TYPE.equals(wanted)
                ? label(wanted) : "this kind of";
        return "This email already has " + label(existing) + " account on REBYU. One email can hold only one "
                + "account, so use a different email for " + who + " account.";
    }
}
