package com.capstone.rebyu.user.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
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
public class LearnerDto {
    private Long learnerId;

    @NotNull
    private Long userId;

    @NotBlank
    @Size(max = 50)
    private String username;

    @NotBlank
    @Size(max = 50)
    private String firstName;

    @NotBlank
    @Size(max = 50)
    private String lastName;

    private String avatarKey;

    private String email;
    private String status;
    private LocalDateTime joinedAt;
    private String institutionName;
    private String learnerType;
    private Integer certificationCount = 0;
    private Double progressPercentage = 0.0;
}