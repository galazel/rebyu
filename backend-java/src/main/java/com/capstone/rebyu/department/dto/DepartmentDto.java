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

    private Long institutionId;

    @NotNull
    private Long institutionCertId;

    private Long certificationId;

    @NotBlank
    @Size(max = 150)
    private String departmentName;

    @Size(max = 500)
    private String departmentDescription;

    @NotNull
    @Min(1)
    private Integer totalSlots;

    private Integer usedSlots;

    private Long createdBy;

    private LocalDateTime createdAt;

    private Department.Status status = Department.Status.active;
}
