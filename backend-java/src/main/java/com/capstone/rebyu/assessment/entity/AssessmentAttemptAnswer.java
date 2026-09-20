package com.capstone.rebyu.assessment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A learner's answer to one attempt question. Correctness and points are set
 * only by server-side scoring; learner-supplied values are never trusted.
 */
@Entity
@Table(
        name = "assessment_attempt_answers",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_attempt_answer_question",
                columnNames = {"assessment_attempt_id", "attempt_question_id"}
        )
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessmentAttemptAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long attemptAnswerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_attempt_id", nullable = false)
    private AssessmentAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_question_id", nullable = false)
    private AssessmentAttemptQuestion attemptQuestion;

    /** Free-text answer (short answer, descriptive, sub-question JSON). */
    @Column(name = "learner_answer", columnDefinition = "TEXT")
    private String learnerAnswer;

    @Column(name = "selected_choice_id")
    private Long selectedChoiceId;

    @Column(name = "submitted_code", columnDefinition = "TEXT")
    private String submittedCode;

    @Column(name = "programming_language", length = 30)
    private String programmingLanguage;

    @Column(name = "diagram_submission_data", columnDefinition = "TEXT")
    private String diagramSubmissionData;

    /** Null until scored; stays null for pending manual evaluation. */
    @Column(name = "is_correct")
    private Boolean isCorrect;

    /**
     * The share of this item the answer earned, 0..1. Right answers earn 1,
     * wrong ones 0; the AI, diagram and code graders award a fraction. Every
     * item is worth the same one observation -- there are no per-question
     * points -- so this is a grading outcome, not a weight. Null until
     * scored.
     */
    @Column(name = "credit", precision = 5, scale = 4)
    private BigDecimal credit;

    @Column(name = "pending_manual_evaluation", nullable = false)
    private boolean pendingManualEvaluation = false;

    /** AI grading feedback for descriptive/critical-thinking answers (learner-safe). */
    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;

    /** JSON array of per-sub-question AI scores for critical-thinking answers. */
    @Column(name = "sub_answer_scores", columnDefinition = "TEXT")
    private String subAnswerScores;

    /**
     * JSON Judge0 execution payload for programming answers: code hash, mode,
     * status, output, error, execution time/memory, and per-test results.
     * Overwritten by every Run/Check and cleared whenever the submitted code
     * changes without a fresh run (see upsertAnswers).
     */
    @Column(name = "execution_result", columnDefinition = "TEXT")
    private String executionResult;

    /** JSON per-element (node/edge) breakdown from DiagramGradingService. */
    @Column(name = "diagram_grading_result", columnDefinition = "TEXT")
    private String diagramGradingResult;

    @Column(name = "answered_at")
    private LocalDateTime answeredAt;

    @Column(name = "last_saved_at")
    private LocalDateTime lastSavedAt;
}
