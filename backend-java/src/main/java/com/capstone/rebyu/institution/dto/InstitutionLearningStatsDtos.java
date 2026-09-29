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
            Integer passRate,
            /* Completion says how much of a programme a cohort has worked
               through; these say how well. A department can be most of the way
               through a certification and averaging 40% on its papers, and
               only one of those two numbers is a warning. Null until somebody
               has sat one of its assessments. */
            Integer averageScore,
            long gradedAttempts,
            /** Share of attempts on this programme's papers that passed, 0-100. */
            Integer attemptPassRate) {}

    /**
     * A topic the cohort gets wrong, and how widely.
     *
     * <p>A department can see that its average score is 30% without being able
     * to see what the 70% is. This is the difference between knowing there is
     * a problem and knowing what to teach again.
     */
    public record TopicDifficultyDto(
            Long lessonId,
            String lessonTitle,
            String categoryTitle,
            /** Share answered correctly, 0-100. */
            int accuracy,
            long answered,
            /** Distinct learners who have answered here, so one person's bad run is not a cohort problem. */
            long learners) {}

    /**
     * One assessment's record across the roster.
     *
     * <p>A paper nearly everybody fails is either the hardest point in the
     * course or a badly built exam. Both are worth knowing and neither shows
     * up in a single overall pass rate.
     */
    public record AssessmentOutcomeDto(
            Long examId,
            String title,
            String examType,
            long attempts,
            long learners,
            /** Share of attempts that passed, 0-100. */
            int passRate,
            Integer averageScore) {}

    public record InstitutionLearningStatsDto(
            LearningStatsSummaryDto summary,
            List<MemberLearningStatsDto> members,
            List<CertificationStatsDto> certifications,
            List<TopicDifficultyDto> hardestTopics,
            List<AssessmentOutcomeDto> hardestAssessments) {}
}
