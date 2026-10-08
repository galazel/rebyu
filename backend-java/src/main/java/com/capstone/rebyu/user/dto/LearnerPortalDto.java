package com.capstone.rebyu.user.dto;

import com.capstone.rebyu.assessment.dto.ExamResultDto;
import com.capstone.rebyu.enrollment.dto.LearnerCertificationDto;
import com.capstone.rebyu.enrollment.dto.InstitutionCertificationLearnerDto;
import com.capstone.rebyu.institution.dto.InstitutionCertificateDto;
import com.capstone.rebyu.progress.analytics.dto.CertificationProgressDto;
import com.capstone.rebyu.progress.dto.LearnerAchievementViewDto;
import com.capstone.rebyu.progress.dto.LearnerCompletedLessonDto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record LearnerPortalDto(
        LearnerDto learner,
        UserDto user,
        List<LearnerCertificationDto> learnerCertifications,
        List<LearnerCompletedLessonDto> completedLessons,
        List<ExamResultDto> examResults,
        List<InstitutionCertificationLearnerDto> institutionCertLearners,
        List<InstitutionCertificateDto> institutionCertificates,
        List<LearnerAchievementViewDto> achievements,
        Long totalXp,
        BigDecimal coinBalance,
        Long aiCreditsRemaining,
        Map<Long, Integer> masteryByMasteryByCertification,
        List<CertificationProgressDto> certificationProgress
) {
    public LearnerPortalDto(
            LearnerDto learner,
            UserDto user,
            List<LearnerCertificationDto> learnerCertifications,
            List<LearnerCompletedLessonDto> completedLessons,
                List<ExamResultDto> examResults,
            List<InstitutionCertificationLearnerDto> institutionCertLearners,
            List<InstitutionCertificateDto> institutionCertificates) {
        this(learner, user, learnerCertifications, completedLessons,
             examResults, institutionCertLearners, institutionCertificates, List.of(), 0L, BigDecimal.ZERO, 0L,
             Map.of(), List.of());
    }
}
