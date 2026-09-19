package com.capstone.rebyu.adaptive.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Bayesian Knowledge Tracing state: the probability this learner knows this
 * lesson's skill, as the in-session engine last left it. The analytics
 * service keeps its own mastery record from the same evidence; this one is
 * what the next assessment seeds itself from without a network call.
 */
@Entity
@Table(
        name = "learner_skill_states",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_learner_skill_lesson", columnNames = {"learner_id", "lesson_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearnerSkillState {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long learnerSkillStateId;

    @Column(name = "learner_id", nullable = false)
    private Long learnerId;

    @Column(name = "lesson_id", nullable = false)
    private Long lessonId;

    @Column(name = "p_known", nullable = false)
    private double pKnown;

    @Column(name = "evidence_count", nullable = false)
    private int evidenceCount;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
