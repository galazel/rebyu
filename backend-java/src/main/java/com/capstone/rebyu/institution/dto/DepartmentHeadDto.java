package com.capstone.rebyu.institution.dto;

import com.capstone.rebyu.institution.entity.DepartmentHead;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentHeadDto {
    private Long departmentHeadId;

    @NotNull
    private Long institutionId;

    @NotNull
    private Long userId;

    private String email;

    private String firstName;
    private String lastName;

    @NotNull
    private DepartmentHead.HeadRole headRole;

    private boolean isPrimaryContact = false;

    @NotNull
    private LocalDateTime joinedAt;
}
