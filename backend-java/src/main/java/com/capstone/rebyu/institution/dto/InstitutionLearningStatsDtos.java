package com.capstone.rebyu.institution.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Learning statistics for one institution: a roster-wide rollup plus a row per
 * member.
 *
 * Every figure is derived from the institution's own assignments, attempts and
 * completed lessons -- nothing here is sampled or projected. A member with no
 * activity yet reports nulls for the score fields rather than zeros, because
 * "has not been graded" is not the same fact as "scored zero" and the dashboard
 * must not draw them the same way.
 */
public final class InstitutionLearningStatsDtos {

    private InstitutionLearningStatsDtos() {
    }

    public record MemberLearningStatsDto(
            Long learnerId,
            String name,
            String username,
            /** Assignment rows for this member, active or otherwise. */
            int assignedCertifications,
            int activeCertifications,
            int completedCertifications,
            /** Mean of this member's assignment progress, 0-100. */
            BigDecimal averageProgress,
            long lessonsCompleted,
            long gradedAttempts,
            long passedAttempts,
            Integer passRate,
            Integer averageScore,
            LocalDateTime lastActivityAt) {}

    public record LearningStatsSummaryDto(
            int members,
            /** Members with at least one graded attempt or finished lesson. */
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

    /**
     * One certification the institution has bought seats on, and how the
     * learners put on it are actually doing.
     *
     * <p>The dashboard could say how many lessons a department had and how
     * many seats were used, but not how many people were sitting a given
     * certification or how many of them had passed it -- which is the question
     * a department is asked about its own programmes.
     *
     * <p>{@code passed} counts awarded credentials rather than assignments
     * marked complete. The award is written when a learner passes the
     * certification's mock exam and is the same record their badge and
     * certificate come from, so the number here and the certificate in their
     * hand cannot disagree; an assignment's status is an administrative flag
     * that someone can set.
     */
    public record CertificationStatsDto(
            Long certificationId,
            String title,
            int seatsTotal,
            int seatsUsed,
            /** Learners assigned to it and not revoked. */
            int enrolled,
            int passed,
            /** Enrolled, has made a start, has not passed yet. */
            int inProgress,
            int notStarted,
            /** Mean assignment progress across the enrolled, 0-100; null with nobody on it. */
            BigDecimal averageProgress,
            /** Share of the enrolled who have passed, 0-100; null with nobody on it. */
            Integer passRate) {}

    public record InstitutionLearningStatsDto(
            LearningStatsSummaryDto summary,
            List<MemberLearningStatsDto> members,
            List<CertificationStatsDto> certifications) {}
}
