package com.capstone.rebyu.certification.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * The real certification exam's format, one row per certification: what the
 * mock exam imitates. Written by the Python generation run (from the planner's
 * research, or a lookup when the planner found no item count) and by the
 * certification backfill scripts.
 */
@Entity
@Table(name = "certification_exam_formats")
@Getter
@Setter
@NoArgsConstructor
public class CertificationExamFormat {

    @Id
    @Column(name = "certification_id")
    private Long certificationId;

    @Column(name = "total_items")
    private Integer totalItems;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "passing_score", precision = 5, scale = 2)
    private BigDecimal passingScore;

    @Column(name = "question_types", length = 200)
    private String questionTypes;

    @Column(name = "coverage", columnDefinition = "TEXT")
    private String coverage;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "source", length = 1000)
    private String source;

    /** PLANNER, LOOKUP or MANUAL: how the numbers were found. */
    @Column(name = "origin", length = 20)
    private String origin;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
