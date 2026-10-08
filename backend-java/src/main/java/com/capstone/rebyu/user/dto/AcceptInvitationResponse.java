package com.capstone.rebyu.user.dto;

public record AcceptInvitationResponse(
        String message,
        Long certificationId,
        String certificationTitle,
        Long enrollmentId
) {
}
