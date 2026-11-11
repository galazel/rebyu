package com.capstone.rebyu.assessment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * One suspicious thing a learner did during a certification assessment: leaving the tab or
 * window, trying to copy, cut or paste, opening the context menu, pressing a blocked
 * shortcut or Print Screen. The server adds RESUMED (with the time away) and FORFEITED.
 * Kept per attempt as the record an instructor or admin reviews for cheating.
 */
@Entity
@Table(
        name = "assessment_integrity_events",
        indexes = {
                @Index(name = "ix_integrity_event_attempt", columnList = "assessment_attempt_id"),
                @Index(name = "ix_integrity_event_learner", columnList = "learner_id")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessmentIntegrityEvent {

    public enum Type {
        TAB_HIDDEN,
        WINDOW_BLUR,
        RESUMED,
        COPY,
        CUT,
        PASTE,
        DROP,
        CONTEXT_MENU,
        SHORTCUT,
        PRINT_SCREEN,
        FORFEITED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long integrityEventId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_attempt_id", nullable = false)
    private AssessmentAttempt attempt;

    @Column(name = "learner_id", nullable = false)
    private Long learnerId;

    @Column(name = "exam_id")
    private Long examId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 20)
    private Type eventType;

    /** Short context: the shortcut pressed, or the question the learner was on. */
    @Column(name = "detail", length = 120)
    private String detail;

    /** For RESUMED: how long the learner was away, in seconds. */
    @Column(name = "away_seconds")
    private Integer awaySeconds;

    /** Running count of exits at the time of the event (TAB_HIDDEN / WINDOW_BLUR / FORFEITED). */
    @Column(name = "violation_number")
    private Integer violationNumber;

    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;
}
