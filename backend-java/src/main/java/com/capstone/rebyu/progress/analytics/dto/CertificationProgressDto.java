package com.capstone.rebyu.progress.analytics.dto;

public record CertificationProgressDto(
        Long certificationId,
        int completedLessons,
        int totalLessons,
        int passedAssessments,
        int totalAssessments
) {}
