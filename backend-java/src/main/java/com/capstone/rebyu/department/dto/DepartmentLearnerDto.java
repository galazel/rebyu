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

    private Long institutionCertId;
    private Long learnerId;

    private Long assignedBy;

    private LocalDateTime assignedAt;

    private DepartmentLearner.Status status = DepartmentLearner.Status.active;

    private DepartmentLearner.Role role = DepartmentLearner.Role.member;

    private LocalDateTime removedAt;

    private Long sectionId;
    private String sectionName;
}
