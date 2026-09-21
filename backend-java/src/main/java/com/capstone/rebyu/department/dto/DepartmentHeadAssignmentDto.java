package com.capstone.rebyu.department.dto;

import com.capstone.rebyu.department.entity.DepartmentHeadAssignment;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentHeadAssignmentDto {
    private Long departmentHeadAssignmentId;

    @NotNull
    private Long departmentId;

    @NotNull
    private Long userId;

    // Always overwritten server-side from the caller's JWT (see
    // DepartmentHeadAssignmentController.create), so must stay nullable --
    // the client never supplies it.
    private Long assignedBy;

    private LocalDateTime assignedAt;

    private DepartmentHeadAssignment.Status status = DepartmentHeadAssignment.Status.active;

    private LocalDateTime removedAt;
}
