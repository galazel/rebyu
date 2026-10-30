package com.capstone.rebyu.learningtools.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * Where a learner is in one tutor game or activity (answers, moves, the last
 * score), so it is the same when they come back on any device. Keyed by the
 * frontend's progress key (`rebyu:tutor-progress:v1:<scope>:<index>:<hash>`).
 */
@Entity
@Table(
        name = "learner_activity_progress",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_activity_progress_learner_key", columnNames = {"learner_id", "progress_key"}),
        indexes = @Index(name = "ix_activity_progress_learner_key", columnList = "learner_id, progress_key"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearnerActivityProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "progress_id")
    private Long progressId;

    @Column(name = "learner_id", nullable = false)
    private Long learnerId;

    @Column(name = "progress_key", nullable = false, length = 255)
    private String progressKey;

    /** The game's saved fields as JSON, exactly as the page wrote them. */
    @Column(name = "state", nullable = false, columnDefinition = "TEXT")
    private String state;

    /** The last finished round's score, when the game has one. */
    @Column(name = "score_right")
    private Integer scoreRight;

    @Column(name = "score_total")
    private Integer scoreTotal;

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private OffsetDateTime updatedAt = OffsetDateTime.now();
}
