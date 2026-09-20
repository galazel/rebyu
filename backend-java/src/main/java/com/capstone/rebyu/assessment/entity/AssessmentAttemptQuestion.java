package com.capstone.rebyu.assessment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Learner-visible snapshot of one question at attempt start. The snapshot JSON
 * never contains answer keys, rubrics, or reference diagram data.
 */
@Entity
@Table(
        name = "assessment_attempt_questions",
        /* Postgres does not index a foreign key column just because it is one,
           and `ddl-auto: update` only creates what is declared here. Every read
           of a paper -- start, resume, submit, result, analytics -- filters on
           assessment_attempt_id, so without this each of them is a sequential
           scan of every attempt question ever recorded. */
        indexes = {
                @Index(name = "ix_attempt_question_attempt", columnList = "assessment_attempt_id"),
                /* The adaptive engine asks "which of these questions has this
                   learner met before" on every start; that is a scan over the
                   source question id without this. */
                @Index(name = "ix_attempt_question_source", columnList = "source_question_id")
        })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessmentAttemptQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long attemptQuestionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_attempt_id", nullable = false)
    private AssessmentAttempt attempt;

    @Column(name = "source_question_id", nullable = false)
    private Long sourceQuestionId;

    @Column(name = "question_type", nullable = false, length = 30)
    private String questionType;

    @Column(name = "question_text_snapshot", nullable = false, columnDefinition = "TEXT")
    private String questionTextSnapshot;

    /** Learner-safe JSON: choices without correct flags, starter code, etc. */
    @Column(name = "question_data_snapshot", columnDefinition = "TEXT")
    private String questionDataSnapshot;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    /** The question's weight on this paper, snapshotted from ExamQuestion; null means one. */
    @Column(precision = 5, scale = 2)
    private BigDecimal points;

    @Column(name = "lesson_id")
    private Long lessonId;

    /** Learner marked this item for review. */
    @Column(name = "flagged", nullable = false)
    private boolean flagged = false;

    /** Learner intentionally moved past this item without answering. */
    @Column(name = "skipped", nullable = false)
    private boolean skipped = false;

    /* Adaptive session audit: the ability estimate the item was chosen at and
       the one it left behind, how informative it was, and why the engine
       picked it (JSON: lesson, tier, pKnown, candidates considered). Null on
       fixed-paper attempts. */
    @Column(name = "theta_before")
    private Double thetaBefore;

    @Column(name = "theta_after")
    private Double thetaAfter;

    @Column(name = "item_information")
    private Double itemInformation;

    @Column(name = "selection_reason", columnDefinition = "TEXT")
    private String selectionReason;

    @Column(name = "served_at")
    private LocalDateTime servedAt;

    /** MAIN or FINAL for an adaptive attempt; null otherwise. */
    @Column(name = "stage", length = 10)
    private String stage;
}
