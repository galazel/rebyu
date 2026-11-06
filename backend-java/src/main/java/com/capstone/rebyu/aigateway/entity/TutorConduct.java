package com.capstone.rebyu.aigateway.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * A learner's AI-tutor conduct record: strikes for severe messages (security attacks,
 * threats, sexual content, hate, drugs, jailbreaks). Strike 1 is a warning, strike 2 the
 * final warning, strike 3 locks every AI tutor feature for seven hours.
 */
@Entity
@Table(name = "tutor_conduct")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TutorConduct {

    @Id
    @Column(name = "learner_id")
    private Long learnerId;

    /** Strikes in the current window; reset after a lockout is served or a quiet week. */
    @Column(name = "strikes", nullable = false)
    private int strikes;

    /** Every strike ever, for staff review. */
    @Column(name = "total_strikes", nullable = false)
    private int totalStrikes;

    @Column(name = "lockouts", nullable = false)
    private int lockouts;

    @Column(name = "last_reason", length = 40)
    private String lastReason;

    @Column(name = "last_strike_at")
    private Instant lastStrikeAt;

    @Column(name = "locked_until")
    private Instant lockedUntil;
}
