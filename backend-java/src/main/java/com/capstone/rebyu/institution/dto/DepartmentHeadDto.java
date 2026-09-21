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

    // Read-only, denormalized from the member's user account so the org portal can
    // label members/authorities without fetching the global users list.
    private String email;

    // Captured at invite time so members/authorities can be shown by name
    // rather than just an email address. Null for pre-existing members.
    private String firstName;
    private String lastName;

    @NotNull
    private DepartmentHead.HeadRole headRole;

    private boolean isPrimaryContact = false;

    @NotNull
    private LocalDateTime joinedAt;
}
