package com.capstone.rebyu.institution.dto;

import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InstitutionCertificateDto {
    private Long institutionCertId;

    @NotNull
    private Long institutionId;

    @NotNull
    private Long certificationId;

    @NotNull
    @Min(0)
    private Integer totalSlots;

    @Min(0)
    private Integer usedSlots = 0;

    private Integer remainingSlots;

    @NotNull
    private LocalDate accessStartDate;

    @NotNull
    private LocalDate accessExpiryDate;

    private InstitutionCertificate.Status status = InstitutionCertificate.Status.active;
}
