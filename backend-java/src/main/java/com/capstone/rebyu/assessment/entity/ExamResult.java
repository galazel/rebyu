package com.capstone.rebyu.assessment.entity;


import com.capstone.rebyu.user.entity.Learner;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "exam_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamResult {
    @EmbeddedId
    private ExamResultId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learner_id")
    @MapsId("learnerId")
    private Learner learner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id")
    @MapsId("examId")
    private Exam exam;

    @Column(name = "taken_at", nullable = false)
    private LocalDateTime takenAt;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal score;

    @Column(name = "duration_seconds", nullable = false)
    private Integer durationSeconds;

    @Column(name = "is_passed", nullable = false)
    private boolean isPassed;

    @Column(name = "rating", precision = 5, scale = 2)
    private BigDecimal rating;
}
