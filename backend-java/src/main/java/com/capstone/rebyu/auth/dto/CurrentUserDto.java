package com.capstone.rebyu.auth.dto;

public record CurrentUserDto(
        Long userId,
        String email,
        String role,
        Long learnerId,
        Long institutionId,
        String departmentHeadRole,
        String firstName,
        String lastName,
        String displayName,
        String avatarKey
) {
    public Long getLearnerId() {
        return learnerId;
    }
}
