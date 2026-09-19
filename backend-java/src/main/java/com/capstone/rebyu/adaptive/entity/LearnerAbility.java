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
 * A learner's estimated ability (theta) within one scope -- one row per
 * certification. Carried from one assessment to the next, so a retake starts
 * where the last attempt left the learner rather than from nothing.
 */
@Entity
@Table(
        name = "learner_abilities",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_learner_ability_scope", columnNames = {"learner_id", "scope_key"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearnerAbility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long learnerAbilityId;

    @Column(name = "learner_id", nullable = false)
    private Long learnerId;

    /** e.g. {@code CERT:14}. */
    @Column(name = "scope_key", nullable = false, length = 40)
    private String scopeKey;

    @Column(name = "theta", nullable = false)
    private double theta;

    @Column(name = "standard_error", nullable = false)
    private double standardError;

    @Column(name = "response_count", nullable = false)
    private int responseCount;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
