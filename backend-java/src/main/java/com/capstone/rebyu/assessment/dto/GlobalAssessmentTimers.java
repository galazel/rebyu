package com.capstone.rebyu.assessment.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record GlobalAssessmentTimers(
        @NotNull @Min(1) Integer lessonQuizMinutes,
        @NotNull @Min(1) Integer middleExamMinutes,
        @NotNull @Min(1) Integer majorExamMinutes
) {}
