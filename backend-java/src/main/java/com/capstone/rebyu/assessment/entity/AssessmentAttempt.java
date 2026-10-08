package com.capstone.rebyu.assessment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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

    @Column(precision = 5, scale = 2)
    private BigDecimal percentage;

    private Boolean passed;

    @Column(name = "item_count")
    private Integer itemCount;

    @Column(name = "answered_count")
    private Integer answeredCount;

    @Column(name = "correct_count")
    private Integer correctCount;

    @Column(name = "total_points", precision = 8, scale = 2)
    private BigDecimal totalPoints;

    @Column(name = "earned_points", precision = 8, scale = 2)
    private BigDecimal earnedPoints;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "current_question_id")
    private Long currentQuestionId;

    @Column(name = "idempotency_key", length = 100)
    private String idempotencyKey;

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

    @Column(name = "bank_cycle")
    private Integer bankCycle;

    @Column(name = "final_round_count")
    private Integer finalRoundCount;

    @Column(name = "phase", length = 10)
    private String phase;

    @Builder.Default
    @Column(name = "grading_pending", columnDefinition = "boolean not null default false")
    private boolean gradingPending = false;

    @Column(name = "adaptive_state_json", columnDefinition = "TEXT")
    private String adaptiveStateJson;

    @Version
    @Column(name = "version")
    private Long version;
}
