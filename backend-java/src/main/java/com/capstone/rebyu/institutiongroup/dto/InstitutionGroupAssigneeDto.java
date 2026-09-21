package com.capstone.rebyu.institutiongroup.dto;

import com.capstone.rebyu.institutiongroup.entity.InstitutionGroupAssignee;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InstitutionGroupAssigneeDto {
    private Long institutionGroupAssigneeId;

    @NotNull
    private Long institutionGroupId;

    @NotNull
    private Long institutionCertLearnerId;

    // Read-only, denormalized from the referenced institution_cert_learner so the
    // authority UI can display and cross-check the learner without extra calls.
    private Long institutionCertId;
    private Long learnerId;

    // Always overwritten server-side from the caller's JWT (see
    // InstitutionGroupAssigneeController.create), so must stay nullable --
    // the client never supplies it.
    private Long assignedBy;

    private LocalDateTime assignedAt;

    private InstitutionGroupAssignee.Status status = InstitutionGroupAssignee.Status.active;

    // Peer-leader distinction within the group; defaults to a regular member.
    private InstitutionGroupAssignee.Role role = InstitutionGroupAssignee.Role.member;

    private LocalDateTime removedAt;

    private Long sectionId;
    private String sectionName;
}
