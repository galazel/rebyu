package com.capstone.rebyu.institution.dto;

import com.capstone.rebyu.institution.entity.DepartmentHead;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentHeadInviteRequestDto {

    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    @NotBlank
    @Email
    private String email;

    private DepartmentHead.HeadRole headRole = DepartmentHead.HeadRole.manager;
}
