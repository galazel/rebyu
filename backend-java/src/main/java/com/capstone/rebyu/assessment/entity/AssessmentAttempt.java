package com.capstone.rebyu.assessment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * One learner attempt of a published exam. Questions are snapshotted at start
 * (learner-safe, no answer keys) and answers are scored server-side on submit.
 */
@Entity
@Table(
        name = "assessment_attempts",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_attempt_exam_learner_no",
                        columnNames = {"exam_id", "learner_id", "attempt_number"}
                ),
                @UniqueConstraint(
                        name = "uq_attempt_idempotency_key",
                        columnNames = {"idempotency_key"}
                )
        },
        /* uq_attempt_exam_learner_no leads with exam_id, so it cannot serve the
           learner-first reads: the attempt history list, the diagnostic gate,
           and every analytics rollup all filter on learner_id alone or on
           (learner_id, status). */
        indexes = {
                @Index(name = "ix_attempt_learner", columnList = "learner_id"),
                @Index(name = "ix_attempt_learner_status", columnList = "learner_id, status")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessmentAttempt {

    public enum Status {
        IN_PROGRESS, SUBMITTED, EXPIRED, CANCELLED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long assessmentAttemptId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @Column(name = "learner_id", nullable = false)
    private Long learnerId;

    /** learner_certifications id backing this attempt, when one exists. */
    @Column(name = "enrollment_id")
    private Long enrollmentId;

    @Column(name = "attempt_number", nullable = false)
    private Integer attemptNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    /** Percentage 0-100 across all snapshot points; pending items score 0. */
    @Column(precision = 5, scale = 2)
    private BigDecimal percentage;

    private Boolean passed;

    /** Items served on this attempt, and how many of them were answered and answered right. */
    @Column(name = "item_count")
    private Integer itemCount;

    @Column(name = "answered_count")
    private Integer answeredCount;

    @Column(name = "correct_count")
    private Integer correctCount;

    /**
     * Weighted totals of an institution paper whose questions carry points.
     * Null on an official assessment, which is scored by count.
     */
    @Column(name = "total_points", precision = 8, scale = 2)
    private BigDecimal totalPoints;

    @Column(name = "earned_points", precision = 8, scale = 2)
    private BigDecimal earnedPoints;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    /** attempt_question id of the item the learner last viewed, for resume. */
    @Column(name = "current_question_id")
    private Long currentQuestionId;

    @Column(name = "idempotency_key", length = 100)
    private String idempotencyKey;

    /*
     * Adaptive (IRT + BKT) session. Questions are served one at a time from
     * the scope's bank, so the paper is built as it is answered. The default
     * lives in the column definition: ddl-auto adds columns to a populated
     * table, and a bare NOT NULL there is a failed ALTER on the live database.
     */
    @Builder.Default
    @Column(name = "adaptive", columnDefinition = "boolean not null default false")
    private boolean adaptive = false;

    @Column(name = "theta_start")
    private Double thetaStart;

    @Column(name = "theta_current")
    private Double thetaCurrent;

    @Column(name = "theta_se")
    private Double thetaSe;

    @Column(name = "target_question_count")
    private Integer targetQuestionCount;

    /** The pass over the certification's bank this session drew from (see LearnerBankCycle). */
    @Column(name = "bank_cycle")
    private Integer bankCycle;

    @Column(name = "final_round_count")
    private Integer finalRoundCount;

    /** MAIN, FINAL or DONE for an adaptive attempt; null otherwise. */
    @Column(name = "phase", length = 10)
    private String phase;

    /**
     * True while the slow-marked items of a submitted adaptive attempt (code,
     * diagram, written) are still with the graders in the background. The
     * result is provisional until this clears.
     */
    @Builder.Default
    @Column(name = "grading_pending", columnDefinition = "boolean not null default false")
    private boolean gradingPending = false;

    /** The engine's whole in-session state (see AdaptiveSessionState), JSON. */
    @Column(name = "adaptive_state_json", columnDefinition = "TEXT")
    private String adaptiveStateJson;

    @Version
    @Column(name = "version")
    private Long version;
}
