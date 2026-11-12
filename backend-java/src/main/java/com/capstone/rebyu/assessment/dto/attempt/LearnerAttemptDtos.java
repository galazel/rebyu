package com.capstone.rebyu.assessment.dto.attempt;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

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
            BigDecimal points,
            List<DiagramAttemptDtos.RubricCriterionDto> rubric,
            String stage,
            AdaptiveAnswerKeyDto answerKey,
            // MULTIPLE_ANSWER only: how many choices the learner must tick ("Select 2 choices").
            Integer selectCount,
            // PROGRAMMING only: the language the problem is written for, so the editor opens on it.
            String programmingLanguage
    ) {
        public LearnerAttemptQuestionDto withAnswerKey(AdaptiveAnswerKeyDto key) {
            return new LearnerAttemptQuestionDto(attemptQuestionId, displayOrder, questionType, criticalThinkingType,
                    question, questionImageKey, choices, starterCode, diagramType, instructions, subQuestions, points,
                    rubric, stage, key, selectCount, programmingLanguage);
        }
    }

    public record AdaptiveAnswerKeyDto(
            Long correctChoiceId,
            String correctChoiceText,
            List<String> acceptedAnswers,
            String explanation,
            List<Long> correctChoiceIds,
            // Every option's own explanation, so instant marking can say why a pick is wrong.
            Map<Long, String> choiceExplanations
    ) {
    }

    public record AssessmentAttemptStartRequestDto(
            @NotNull Long learnerId,
            String idempotencyKey,
            Integer questionIndex,
            Long matchId
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
            AdaptiveProgressDto adaptive,
            int focusViolations,
            int maxFocusViolations
    ) {
    }


    public record AdaptiveProgressDto(
            int answered,
            int total,
            int mainTotal,
            int finalRoundTotal,
            String stage,
            Long currentAttemptQuestionId,
            Long queuedAttemptQuestionId
    ) {
    }

    public record AdaptiveVerdictDto(
            Boolean isCorrect,
            BigDecimal credit,
            Long correctChoiceId,
            String correctChoiceText,
            String acceptedAnswer,
            String explanation,
            String feedback,
            List<SubQuestionAnswerReviewDto> subQuestionAnswers,
            List<Long> correctChoiceIds,
            String wrongChoiceExplanation
    ) {
    }

    public record AdaptiveAnswerRequestDto(
            @NotNull Long learnerId,
            @NotNull AttemptAnswerDraftDto answer
    ) {
    }

    public record AdaptiveAnswersRequestDto(
            @NotNull Long learnerId,
            @NotNull @jakarta.validation.constraints.Size(min = 1, max = 100) List<AttemptAnswerDraftDto> answers
    ) {
    }

    public record AdaptiveAnswersResponseDto(
            Map<Long, AdaptiveVerdictDto> verdicts,
            AdaptiveProgressDto progress,
            LearnerAttemptQuestionDto next,
            List<LearnerAttemptQuestionDto> queued,
            boolean enteringFinalRound,
            boolean completed
    ) {
    }

    public record AdaptiveAnswerResponseDto(
            AdaptiveVerdictDto verdict,
            AdaptiveProgressDto progress,
            LearnerAttemptQuestionDto next,
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

    /** Why the attempt paused: TAB_HIDDEN or WINDOW_BLUR. Optional. */
    public record PauseAttemptRequestDto(
            String reason,
            Long attemptQuestionId
    ) {
    }

    /** One suspicious action the browser blocked (copy, paste, shortcut, ...). */
    public record IntegrityEventDto(
            String type,
            String detail,
            Long attemptQuestionId
    ) {
    }

    public record ReportIntegrityEventsRequestDto(
            List<IntegrityEventDto> events
    ) {
    }

    /** The attempt clock after a pause or resume: the client re-anchors its countdown on expiresAt. */
    public record AttemptClockDto(
            OffsetDateTime expiresAt,
            boolean paused,
            int focusViolations,
            int maxFocusViolations,
            boolean forfeited
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

    public record DiagramElementReviewDto(
            String kind,
            String expectedDescription,
            boolean matched,
            String matchQuality,
            String learnerDescription,
            String reason,
            BigDecimal earnedPoints,
            BigDecimal maxPoints,
            // The diagram type's own name for this part ("Actors", "«include»", "Decisions");
            // null for answers graded before categories existed.
            String category,
            // Rule -> met, for the rules this part was held to (name, shape, kind, direction...).
            Map<String, Boolean> checks
    ) {
        public DiagramElementReviewDto(
                String kind, String expectedDescription, boolean matched, String matchQuality,
                String learnerDescription, String reason, BigDecimal earnedPoints, BigDecimal maxPoints) {
            this(kind, expectedDescription, matched, matchQuality, learnerDescription, reason,
                    earnedPoints, maxPoints, null, null);
        }
    }

    public record AttemptAnswerReviewDto(
            Long attemptQuestionId,
            Integer displayOrder,
            String questionType,
            String question,
            Boolean isCorrect,
            boolean pendingManualEvaluation,
            BigDecimal credit,
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
            // PROGRAMMING only, and only once answers are released.
            String expectedOutput,
            String programOutput,
            String programError,
            String difficultyLevel,
            String questionImageKey,
            List<ReviewChoiceImageDto> choiceImages,
            // Why each option the learner picked is wrong, from that option's own explanation.
            String wrongChoiceExplanation
    ) {
    }

    public record ReviewChoiceImageDto(
            Long choiceId,
            String imageKey
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
            BigDecimal percentage,
            Boolean passed,
            BigDecimal passingScore,
            Integer correctCount,
            Integer incorrectCount,
            Integer pendingCount,
            Integer unansweredCount,
            ProficiencyDto proficiency,
            BigDecimal totalPoints,
            BigDecimal earnedPoints,
            List<AttemptAnswerReviewDto> answers,
            List<LessonPerformanceDto> lessonBreakdown,
            Long certificationId,
            boolean gradingPending,
            boolean forfeited,
            int focusViolations,
            Map<String, Long> integrityEventCounts,
            // CHALLENGE attempts only: how the percentage was built.
            ChallengeScoreDto challengeScore
    ) {
    }

    public record ChallengeScoreDto(
            String arenaId,
            String formula,
            BigDecimal percentage,
            List<ScoreComponentDto> components,
            List<ChallengeItemScoreDto> items,
            // Diagram arenas: each notation rule and how many of the parts it applies to met it.
            List<ScoreCheckDto> checks
    ) {
        public ChallengeScoreDto(String arenaId, String formula, BigDecimal percentage,
                                 List<ScoreComponentDto> components, List<ChallengeItemScoreDto> items) {
            this(arenaId, formula, percentage, components, items, List.of());
        }
    }

    /** One rule a diagram is held to -- names, shapes, relationship types -- and how many parts met it. */
    public record ScoreCheckDto(String key, String label, int met, int total) {
    }

    /** One part of a challenge score: its weight, what was achieved on it, and what it added. */
    public record ScoreComponentDto(
            String key,
            String label,
            Integer weightPercent,
            Integer achievedPercent,
            BigDecimal points,
            String detail
    ) {
    }

    public record ChallengeItemScoreDto(
            Integer order,
            String title,
            BigDecimal earned,
            BigDecimal max,
            Boolean correct,
            String feedback
    ) {
    }

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
