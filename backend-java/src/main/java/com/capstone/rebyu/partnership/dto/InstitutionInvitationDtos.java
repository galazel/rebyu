package com.capstone.rebyu.partnership.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

/** DTOs for Transaction Three: institution learner invitations. */
public final class InstitutionInvitationDtos {

    private InstitutionInvitationDtos() {
    }

    /** Institution certification access + live slot counts. */
    public record CertificationAccessDto(
            Long institutionCertId,
            Long certificationId,
            String certificationTitle,
            String status,
            Integer totalSlots,
            Integer usedSlots,
            Integer remainingSlots
    ) {
    }

    // institutionId/invitedByUserId are always overwritten server-side from the
    // caller's JWT (see InstitutionInvitationController.send) before this reaches
    // the service, so they must stay nullable here -- the client never supplies
    // them. Invitations are sent by a group's leader, not the institution at
    // large, so the group (and the certification/slots it belongs to) is
    // derived from departmentId rather than an org-cert-wide picker.
    /** One invited learner: email required, first/last name optional (NetAcad-style). */
    public record InvitedLearner(
            @Size(max = 100) String firstName,
            @Size(max = 100) String lastName,
            @NotBlank @Email @Size(max = 254) String email
    ) {
    }

    public record SendInvitationsRequest(
            Long institutionId,
            Long invitedByUserId,
            @NotNull Long departmentId,
            @NotEmpty List<@Valid InvitedLearner> learners,
            /* Optional: the section (within the group) the learners join on acceptance. */
            Long sectionId
    ) {
    }

    public record InvitationDto(
            Long invitationId,
            Long institutionCertId,
            Long certificationId,
            String certificationTitle,
            Long departmentId,
            String departmentName,
            String email,
            String firstName,
            String lastName,
            String status,
            LocalDateTime sentAt,
            LocalDateTime expiresAt,
            Long sectionId,
            String sectionName
    ) {
    }

    public record SendInvitationsResponse(
            Integer created,
            List<String> skipped,
            List<InvitationDto> invitations
    ) {
    }
}
