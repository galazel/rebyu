package com.capstone.rebyu.department.dto;

import com.capstone.rebyu.department.entity.DepartmentLearner;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentLearnerDto {
    private Long departmentLearnerId;

    @NotNull
    private Long departmentId;

    @NotNull
    private Long institutionCertLearnerId;

    // Read-only, denormalized from the referenced institution_cert_learner so the
    // authority UI can display and cross-check the learner without extra calls.
    private Long institutionCertId;
    private Long learnerId;

    // Always overwritten server-side from the caller's JWT (see
    // DepartmentLearnerController.create), so must stay nullable --
    // the client never supplies it.
    private Long assignedBy;

    private LocalDateTime assignedAt;

    private DepartmentLearner.Status status = DepartmentLearner.Status.active;

    // Peer-leader distinction within the group; defaults to a regular member.
    private DepartmentLearner.Role role = DepartmentLearner.Role.member;

    private LocalDateTime removedAt;

    private Long sectionId;
    private String sectionName;
}
