package com.capstone.rebyu.institution.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class InstitutionLearningStatsDtos {

    private InstitutionLearningStatsDtos() {
    }

    public record MemberLearningStatsDto(
            Long learnerId,
            String name,
            String username,
            int assignedCertifications,
            int activeCertifications,
            int completedCertifications,
            BigDecimal averageProgress,
            long lessonsCompleted,
            long gradedAttempts,
            long passedAttempts,
            Integer passRate,
            Integer averageScore,
            LocalDateTime lastActivityAt) {}

    public record LearningStatsSummaryDto(
            int members,
            int activeMembers,
            int membersNotStarted,
            BigDecimal averageProgress,
            long lessonsCompleted,
            long gradedAttempts,
            Integer passRate,
            Integer averageScore,
            int seatsTotal,
            int seatsUsed) {}

    public record DepartmentProgressDto(
            Long departmentId,
            String departmentName,
            long learners,
            BigDecimal averageProgress,
            long completedLearners) {}

    public record CertificationStatsDto(
            Long certificationId,
            String title,
            int seatsTotal,
            int seatsUsed,
            int enrolled,
            int passed,
            int inProgress,
            int notStarted,
            BigDecimal averageProgress,
            Integer passRate,
            Integer averageScore,
            long gradedAttempts,
            Integer attemptPassRate) {}

    public record TopicDifficultyDto(
            Long lessonId,
            String lessonTitle,
            String categoryTitle,
            Long certificationId,
            String certificationTitle,
            int accuracy,
            long answered,
            long learners) {}

    public record AssessmentOutcomeDto(
            Long examId,
            String title,
            String examType,
            long attempts,
            long learners,
            int passRate,
            Integer averageScore,
            Integer passingScore,
            long passedAttempts) {}

    public record CertificationAssessmentsDto(
            Long certificationId,
            String certificationTitle,
            List<AssessmentOutcomeDto> assessments) {}

    public record CertificationTopicsDto(
            Long certificationId,
            String certificationTitle,
            List<TopicDifficultyDto> topics) {}

    public record InstitutionLearningStatsDto(
            LearningStatsSummaryDto summary,
            List<MemberLearningStatsDto> members,
            List<CertificationStatsDto> certifications,
            List<CertificationTopicsDto> hardestTopics,
            List<CertificationAssessmentsDto> hardestAssessments) {}
}
