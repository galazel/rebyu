package com.capstone.rebyu.department.dto;

import com.capstone.rebyu.department.entity.Department;
import jakarta.validation.constraints.Min;
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
public class DepartmentDto {
    private Long departmentId;

    // Always overwritten server-side from the caller's JWT (see
    // DepartmentController.create), so must stay nullable -- the client
    // never supplies it.
    private Long institutionId;

    @NotNull
    private Long institutionCertId;

    /** Read-only certification behind the group's institution allocation. */
    private Long certificationId;

    @NotBlank
    @Size(max = 150)
    private String departmentName;

    @Size(max = 500)
    private String departmentDescription;

    @NotNull
    @Min(1)
    private Integer totalSlots;

    // Read-only: how many of totalSlots are already reserved by this group's
    // own pending/accepted invitations.
    private Integer usedSlots;

    // Same as institutionId: always overwritten server-side, must stay nullable.
    private Long createdBy;

    private LocalDateTime createdAt;

    private Department.Status status = Department.Status.active;
}
