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
            List<ProgrammingAttemptDtos.LearnerTestCaseDto> testCases,
            List<DiagramAttemptDtos.RubricCriterionDto> rubric,
            String stage,
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
            AdaptiveProgressDto adaptive
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
            List<SubQuestionAnswerReviewDto> subQuestionAnswers
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
            BigDecimal maxPoints
    ) {
    }

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
            List<ProgrammingTestReviewDto> programmingTests,
            String programOutput,
            String programError,
            String difficultyLevel,
            String questionImageKey,
            List<ReviewChoiceImageDto> choiceImages
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
            boolean gradingPending
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
