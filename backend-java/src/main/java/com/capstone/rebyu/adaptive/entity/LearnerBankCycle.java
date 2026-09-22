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
 * Which pass over a certification's bank this learner is on.
 *
 * <p>A learner's sessions draw questions they have not met in the current
 * cycle. When what is left cannot fill a paper -- the bank is used up and
 * no top-up has landed -- the cycle rolls over: everything counts as fresh
 * again and, within the new cycle, nothing repeats until it too is used up.
 * Every attempt records the cycle it drew from.
 */
@Entity
@Table(
        name = "learner_bank_cycles",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_learner_bank_cycle", columnNames = {"learner_id", "certification_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearnerBankCycle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "learner_bank_cycle_id")
    private Long learnerBankCycleId;

    @Column(name = "learner_id", nullable = false)
    private Long learnerId;

    @Column(name = "certification_id", nullable = false)
    private Long certificationId;

    /** 1 for the first pass over the bank, and one more each time it rolls over. */
    @Column(name = "cycle_no", nullable = false)
    private int cycleNo;

    /** Questions served at or after this moment count as seen in this cycle. */
    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;
}
