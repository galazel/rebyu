package com.capstone.rebyu.notification.dto;

import com.capstone.rebyu.notification.entity.LearnerInvitation;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LearnerInvitationDto {
    private Long invitationId;

    @NotNull
    private Long institutionCertId;

    private Long learnerId;

    @NotBlank
    @Email
    @Size(max = 254)
    private String email;

    @NotBlank
    @Size(max = 255)
    private String tokenHash;

    @NotNull
    private LocalDateTime sentAt;

    @NotNull
    private LocalDateTime expiresAt;

    private LocalDateTime acceptedAt;

    @NotNull
    private LearnerInvitation.Status status = LearnerInvitation.Status.PENDING;
}
