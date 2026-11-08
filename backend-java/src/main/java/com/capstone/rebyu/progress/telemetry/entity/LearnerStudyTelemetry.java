package com.capstone.rebyu.progress.telemetry.entity;

import com.capstone.rebyu.certification.entity.Lesson;
import com.capstone.rebyu.user.entity.Learner;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "learner_study_telemetry")
@Data
public class LearnerStudyTelemetry {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "learner_study_telemetry_id") private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "learner_id", nullable = false) private Learner learner;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "lesson_id", nullable = false) private Lesson lesson;
    @Column(name = "event_type", nullable = false, length = 32) private String eventType;
    @Column(name = "duration_seconds", nullable = false) private int durationSeconds;
    @Column(name = "scroll_velocity") private Integer scrollVelocity;
    @Column(name = "correct_count") private Integer correctCount;
    @Column(name = "question_count") private Integer questionCount;
    @Column(name = "occurred_at", nullable = false) private LocalDateTime occurredAt;
}
