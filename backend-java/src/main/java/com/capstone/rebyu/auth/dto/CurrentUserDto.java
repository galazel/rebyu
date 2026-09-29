package com.capstone.rebyu.auth.dto;

// Learner-safe view of the authenticated REBYU account. Never carries tokens,
// password hashes, or raw Cognito payloads.
public record CurrentUserDto(
        Long userId,
        String email,
        String role,
        Long learnerId,
        // Present when the account belongs to an institution, so the frontend
        // scopes the institution portal to that institution.
        Long institutionId,
        // "owner" | "manager" | "staff" -- present only alongside institutionId.
        // The frontend uses this to tell the org owner's dashboard apart from a
        // group leader's (owner sees billing/org settings/partnership/member
        // management; a leader sees only their own assigned groups/learners).
        String departmentHeadRole,
        String firstName,
        String lastName,
        String displayName,
        // Object key of the learner's profile picture, or null when they have
        // not uploaded one and their initials stand in. Carried on identity
        // rather than fetched per page so every place that draws the person --
        // the nav, the account page, a post -- draws the same one.
        String avatarKey
) {
    // Bean-style alias for learnerId() -- controllers across the codebase call
    // this form; records only auto-generate the canonical accessor.
    public Long getLearnerId() {
        return learnerId;
    }
}
