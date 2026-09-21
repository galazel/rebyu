package com.capstone.rebyu.enrollment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * What a learner has earned on one certification: its badge and a
 * certificate of completion, both granted by passing the mock exam. One row
 * per learner and certification; the timestamps record which has been
 * granted, so a retake never awards the same thing twice.
 */
@Entity
@Table(name = "learner_certification_awards",
        uniqueConstraints = @UniqueConstraint(name = "ux_learner_certification_award",
                columnNames = {"learner_id", "certification_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearnerCertificationAward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "award_id")
    private Long awardId;

    @Column(name = "learner_id", nullable = false)
    private Long learnerId;

    @Column(name = "certification_id", nullable = false)
    private Long certificationId;

    @Column(name = "assessment_attempt_id")
    private Long assessmentAttemptId;

    @Column(name = "score_percentage", precision = 5, scale = 2)
    private BigDecimal scorePercentage;

    @Column(name = "badge_awarded_at")
    private LocalDateTime badgeAwardedAt;

    @Column(name = "certificate_number", length = 40, unique = true)
    private String certificateNumber;

    @Column(name = "certificate_awarded_at")
    private LocalDateTime certificateAwardedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
