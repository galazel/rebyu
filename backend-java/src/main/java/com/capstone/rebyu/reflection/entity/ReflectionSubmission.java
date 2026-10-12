package com.capstone.rebyu.reflection.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** One graded attempt at a reflection. Attempts are unlimited; the best one counts. */
@Entity
@Table(name = "reflection_submissions",
        indexes = @Index(name = "ix_reflection_submissions_learner", columnList = "reflection_id, learner_id"))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReflectionSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "submission_id")
    private Long submissionId;

    @Column(name = "reflection_id", nullable = false)
    private Long reflectionId;

    @Column(name = "learner_id", nullable = false)
    private Long learnerId;

    @Column(name = "answer", nullable = false, columnDefinition = "text")
    private String answer;

    @Column(name = "score_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal scorePercent;

    @Column(name = "passed", nullable = false)
    private Boolean passed;

    @Column(name = "feedback", columnDefinition = "text")
    private String feedback;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "grades", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private List<CriterionGrade> grades = new ArrayList<>();

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    public record CriterionGrade(int index, BigDecimal earnedPoints, BigDecimal maxPoints, String feedback) {}
}
