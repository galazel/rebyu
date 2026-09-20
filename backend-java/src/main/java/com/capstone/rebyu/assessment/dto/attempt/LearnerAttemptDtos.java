package com.capstone.rebyu.assessment.dto.attempt;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

/**
 * Learner-safe attempt DTOs. Nothing in this file may ever carry a correct
 * answer, correct-choice flag, rubric, reference diagram, or authoring note
 * before submission.
 */
public final class LearnerAttemptDtos {

    private LearnerAttemptDtos() {
    }

    public record LearnerAssessmentDto(
            Long assessmentId,
            String title,
            String assessmentType,
            String description,
            String instructions,
            Integer durationMinutes,
            Integer totalItems,
            BigDecimal passingScore,
            Boolean canStart,
            String lockReason
    ) {
    }

    public record LearnerChoiceDto(
            Long choiceId,
            String choiceText,
            String imageKey
    ) {
    }

    public record LearnerSubQuestionDto(
            Long subQuestionId,
            String questionText
    ) {
    }

    public record LearnerAttemptQuestionDto(
            Long attemptQuestionId,
            Integer displayOrder,
            String questionType,
            String criticalThinkingType,
            String question,
            String questionImageKey,
            List<LearnerChoiceDto> choices,
            String starterCode,
            String diagramType,
            String instructions,
            List<LearnerSubQuestionDto> subQuestions,
            /** The item's weight on an institution paper; null on official assessments. */
            BigDecimal points,
            List<ProgrammingAttemptDtos.LearnerTestCaseDto> testCases,
            List<DiagramAttemptDtos.RubricCriterionDto> rubric,
            /** MAIN or FINAL on an adaptive attempt; null on a fixed paper. */
            String stage,
            /** Present on adaptive main-round items so the client can mark the answer the instant it is given. */
            AdaptiveAnswerKeyDto answerKey
    ) {
        public LearnerAttemptQuestionDto withAnswerKey(AdaptiveAnswerKeyDto key) {
            return new LearnerAttemptQuestionDto(attemptQuestionId, displayOrder, questionType, criticalThinkingType,
                    question, questionImageKey, choices, starterCode, diagramType, instructions, subQuestions, points,
                    testCases, rubric, stage, key);
        }
    }

    public record AdaptiveAnswerKeyDto(
            Long correctChoiceId,
            String correctChoiceText,
            List<String> acceptedAnswers,
            String explanation
    ) {
    }

    public record AssessmentAttemptStartRequestDto(
            @NotNull Long learnerId,
            String idempotencyKey
    ) {
    }

    public record AssessmentAttemptStartResponseDto(
            Long assessmentAttemptId,
            Long assessmentId,
            String assessmentTitle,
            String assessmentType,
            Integer attemptNumber,
            OffsetDateTime startedAt,
            OffsetDateTime expiresAt,
            boolean resumed,
            List<LearnerAttemptQuestionDto> questions,
            Map<Long, AttemptAnswerDraftDto> savedAnswers,
            Long currentAttemptQuestionId,
            List<Long> flaggedAttemptQuestionIds,
            List<Long> skippedAttemptQuestionIds,
            /** Null for a fixed-paper attempt. For an adaptive one, `questions` holds only the items served so far. */
            AdaptiveProgressDto adaptive
    ) {
    }

    // ------------------------------------------------------------------
    // Adaptive (IRT + BKT) session
    // ------------------------------------------------------------------

    public record AdaptiveProgressDto(
            int answered,
            int total,
            int mainTotal,
            int finalRoundTotal,
            /** MAIN, FINAL or DONE. */
            String stage,
            Long currentAttemptQuestionId,
            /** The item already served behind the current one, so the learner never waits between questions. */
            Long queuedAttemptQuestionId
    ) {
    }

    /**
     * The marking of one main-round item, returned the moment it is answered.
     * Null for a final-round item, which is marked with the whole paper at submit.
     */
    public record AdaptiveVerdictDto(
            Boolean isCorrect,
            /** Share of the item earned, 0..1; partial credit from the AI, diagram and code graders. */
            BigDecimal credit,
            Long correctChoiceId,
            String correctChoiceText,
            String acceptedAnswer,
            String explanation,
            String feedback,
            List<SubQuestionAnswerReviewDto> subQuestionAnswers
    ) {
    }

    public record AdaptiveAnswerRequestDto(
            @NotNull Long learnerId,
            @NotNull AttemptAnswerDraftDto answer
    ) {
    }

    /** Several answers at once, in the order the learner gave them. */
    public record AdaptiveAnswersRequestDto(
            @NotNull Long learnerId,
            @NotNull @jakarta.validation.constraints.Size(min = 1, max = 100) List<AttemptAnswerDraftDto> answers
    ) {
    }

    public record AdaptiveAnswersResponseDto(
            /** Verdict per attempt-question id; a final-round item has none. */
            Map<Long, AdaptiveVerdictDto> verdicts,
            AdaptiveProgressDto progress,
            /** The item now being asked; null once the session is complete. */
            LearnerAttemptQuestionDto next,
            /** Items newly served behind `next`. */
            List<LearnerAttemptQuestionDto> queued,
            boolean enteringFinalRound,
            boolean completed
    ) {
    }

    public record AdaptiveAnswerResponseDto(
            AdaptiveVerdictDto verdict,
            AdaptiveProgressDto progress,
            /** The next item to show; null once the session is complete. */
            LearnerAttemptQuestionDto next,
            /** The items behind `next`, served ahead so the client holds them in reserve. */
            List<LearnerAttemptQuestionDto> queued,
            boolean enteringFinalRound,
            boolean completed
    ) {
    }

    public record FlagRequestDto(
            @NotNull Long learnerId,
            boolean flagged
    ) {
    }

    public record SkipRequestDto(
            @NotNull Long learnerId,
            boolean skipped
    ) {
    }

    public record CurrentItemRequestDto(
            @NotNull Long learnerId,
            @NotNull Long attemptQuestionId
    ) {
    }

    public record AttemptAnswerDraftDto(
            Long attemptQuestionId,
            String learnerAnswer,
            Long selectedChoiceId,
            String submittedCode,
            String programmingLanguage,
            String diagramSubmissionData
    ) {
    }

    public record AutosaveAnswersRequestDto(
            @NotNull Long learnerId,
            List<AttemptAnswerDraftDto> answers
    ) {
    }

    public record SubmitAssessmentAttemptRequestDto(
            @NotNull Long learnerId,
            List<AttemptAnswerDraftDto> answers
    ) {
    }

    public record SubQuestionAnswerReviewDto(
            Long subQuestionId,
            String questionText,
            String learnerAnswer,
            BigDecimal earnedPoints,
            BigDecimal maxPoints,
            String feedback
    ) {
    }

    /**
     * One required diagram element (node or relationship) compared against
     * what the learner actually drew — so a learner can see exactly which
     * required parts were found or missing, not just a final score. Gated
     * by the exam's release-answers setting, same as the MCQ answer key.
     */
    public record DiagramElementReviewDto(
            String kind,                 // NODE | EDGE
            String expectedDescription,
            boolean matched,
            String matchQuality,         // STRONG | PARTIAL | WEAK | NONE
            String learnerDescription,   // what the learner drew that matched; null when missing
            String reason,               // why it scored what it did: wrong direction, missing key, ...
            BigDecimal earnedPoints,
            BigDecimal maxPoints
    ) {
    }

    /**
     * One programming test case as it went for this learner.
     *
     * <p>A code item was reviewed as a score and a listing of the learner's own
     * code, which says nothing about which cases it failed or how -- the one
     * thing that makes a wrong program fixable. This is that breakdown.
     *
     * <p>This is the review after submission, so every case -- hidden ones
     * included -- carries its {@code input} and the program's
     * {@code actualOutput}: the attempt is over, and a learner told only that
     * "Hidden 2 failed" cannot learn anything from it. {@code expectedOutput} is
     * the answer key and stays gated behind the exam's release-answers setting.
     */
    public record ProgrammingTestReviewDto(
            int index,
            String label,
            boolean sample,
            boolean passed,
            String status,
            String input,
            String expectedOutput,
            String actualOutput
    ) {
    }

    public record AttemptAnswerReviewDto(
            Long attemptQuestionId,
            Integer displayOrder,
            String questionType,
            String question,
            Boolean isCorrect,
            boolean pendingManualEvaluation,
            /** Share of the item earned, 0..1. */
            BigDecimal credit,
            /** The item's weight on an institution paper; null on official assessments. */
            BigDecimal points,
            String learnerAnswer,
            Long selectedChoiceId,
            String selectedChoiceText,
            String correctChoiceText,
            String explanation,
            String submittedCode,
            String programmingLanguage,
            boolean diagramSubmitted,
            String feedback,
            List<SubQuestionAnswerReviewDto> subQuestionAnswers,
            List<DiagramElementReviewDto> diagramElements,
            List<ProgrammingTestReviewDto> programmingTests,
            /* What the submitted program printed when it was graded, and its
               compile or runtime error, for the result screen. Drawn from sample
               cases only, by the same rule as ProgrammingTestReviewDto: output
               produced from a hidden input describes that input. */
            String programOutput,
            String programError
    ) {
    }

    public record LessonPerformanceDto(
            Long lessonId,
            String lessonTitle,
            Integer itemCount,
            Integer correctCount,
            BigDecimal percentage,
            Integer pendingCount
    ) {
    }

    /**
     * What an adaptive attempt measured: ability on the IRT scale, and that
     * ability translated onto 0..100 with its tier -- {@code ((theta + 3) / 6) * 100},
     * Novice below 25, Developing to 49, Proficient to 74, Advanced from 75.
     */
    public record ProficiencyDto(
            BigDecimal rating,
            String label,
            BigDecimal theta,
            BigDecimal standardError
    ) {
    }

    public record AssessmentAttemptResultDto(
            Long assessmentAttemptId,
            Long assessmentId,
            String assessmentTitle,
            String assessmentType,
            Integer attemptNumber,
            LocalDateTime submittedAt,
            Integer durationSeconds,
            /** The Real Score: right answers as a share of the items served. */
            BigDecimal percentage,
            Boolean passed,
            BigDecimal passingScore,
            Integer correctCount,
            Integer incorrectCount,
            Integer pendingCount,
            Integer unansweredCount,
            /** The headline of an adaptive attempt; null on a fixed paper. */
            ProficiencyDto proficiency,
            /** Weighted totals of an institution paper; null when items all count the same. */
            BigDecimal totalPoints,
            BigDecimal earnedPoints,
            List<AttemptAnswerReviewDto> answers,
            List<LessonPerformanceDto> lessonBreakdown,
            Long certificationId,
            /** True while code/diagram/written answers are still being marked in the background. */
            boolean gradingPending
    ) {
    }

    /**
     * One row of an assessment's attempt history — every retake, never
     * overwritten. Used to list/compare all of a learner's attempts on one
     * assessment before opening a specific one for full review.
     */
    public record AttemptSummaryDto(
            Long assessmentAttemptId,
            Long assessmentId,
            String assessmentTitle,
            Integer attemptNumber,
            String status,
            LocalDateTime startedAt,
            LocalDateTime submittedAt,
            Integer durationSeconds,
            BigDecimal percentage,
            Boolean passed,
            Integer correctCount,
            Integer answeredCount,
            Integer itemCount,
            ProficiencyDto proficiency,
            BigDecimal totalPoints,
            BigDecimal earnedPoints
    ) {
    }
}
