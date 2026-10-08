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
        name = "assessment_attempt_questions",
        indexes = {
                @Index(name = "ix_attempt_question_attempt", columnList = "assessment_attempt_id"),
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

    @Column(name = "question_data_snapshot", columnDefinition = "TEXT")
    private String questionDataSnapshot;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @Column(precision = 5, scale = 2)
    private BigDecimal points;

    @Column(name = "lesson_id")
    private Long lessonId;

    @Column(name = "flagged", nullable = false)
    private boolean flagged = false;

    @Column(name = "skipped", nullable = false)
    private boolean skipped = false;

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

    @Column(name = "stage", length = 10)
    private String stage;
}
