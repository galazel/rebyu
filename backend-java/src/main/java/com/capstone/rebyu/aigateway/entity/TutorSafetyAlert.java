package com.capstone.rebyu.aigateway.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Something a learner wrote to the AI tutor that staff must know about: a sign they may be at
 * risk (SELF_HARM, ABUSE), a threat to hurt others (THREAT), or an attempt to get other people's
 * accounts or data (DATA_PROBE). Raised by {@code TutorSafetyAlertService}; reviewed by the
 * learner's department head or an admin.
 */
@Entity
@Table(
        name = "tutor_safety_alerts",
        indexes = {
                @Index(name = "ix_safety_alert_learner", columnList = "learner_id"),
                @Index(name = "ix_safety_alert_status", columnList = "status")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TutorSafetyAlert {

    public enum Kind { SELF_HARM, ABUSE, THREAT, DATA_PROBE }

    public enum Status { OPEN, REVIEWED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long safetyAlertId;

    @Column(name = "learner_id", nullable = false)
    private Long learnerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Kind kind;

    /** Where it was written: chat, dialogue or live. */
    @Column(length = 20)
    private String surface;

    /** What the learner wrote, as written (first 500 characters), for the reviewer's context. */
    @Column(name = "message_excerpt", length = 500)
    private String messageExcerpt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.OPEN;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "reviewed_by_user_id")
    private Long reviewedByUserId;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "review_note", length = 500)
    private String reviewNote;
}
