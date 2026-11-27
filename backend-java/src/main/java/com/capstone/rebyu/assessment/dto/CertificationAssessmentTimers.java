package com.capstone.rebyu.assessment.dto;

import jakarta.validation.constraints.Min;

public record CertificationAssessmentTimers(
        @Min(1) Integer diagnosticMinutes,
        @Min(1) Integer mockExamMinutes
) {}
