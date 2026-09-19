package com.capstone.rebyu.enrollment.dto;

import com.capstone.rebyu.enrollment.entity.InstitutionCertificationLearner;
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
public class InstitutionCertificationLearnerDto {
    private Long institutionCertLearnerId;

    @NotNull
    private Long institutionCertId;

    @NotNull
    private Long learnerId;

    @NotNull
    private LocalDateTime assignedAt;

    @DecimalMin("0.0")
    @DecimalMax("100.0")
    private BigDecimal progressPercentage = BigDecimal.ZERO;

    private LocalDateTime completedAt;

    private InstitutionCertificationLearner.Status status = InstitutionCertificationLearner.Status.active;
}
