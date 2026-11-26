package com.capstone.rebyu.assessment.dto;

import jakarta.validation.constraints.Min;

public record AssessmentDurationsRequest(
        @Min(1) Integer diagnosticMinutes,
        @Min(1) Integer lessonQuizMinutes,
        @Min(1) Integer middleExamMinutes,
        @Min(1) Integer majorExamMinutes
) {}
