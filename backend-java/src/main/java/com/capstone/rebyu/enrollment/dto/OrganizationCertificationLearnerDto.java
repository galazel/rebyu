package com.capstone.rebyu.enrollment.dto;

import com.capstone.rebyu.enrollment.entity.OrganizationCertificationLearner;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationCertificationLearnerDto {
    private Long orgCertLearnerId;

    @NotNull
    private Long orgCertId;

    @NotNull
    private Long learnerId;

    @NotNull
    private LocalDateTime assignedAt;

    @DecimalMin("0.0")
    @DecimalMax("100.0")
    private BigDecimal progressPercentage = BigDecimal.ZERO;

    private LocalDateTime completedAt;

    private OrganizationCertificationLearner.Status status = OrganizationCertificationLearner.Status.active;
}
