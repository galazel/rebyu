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

    @Column(name = "cycle_no", nullable = false)
    private int cycleNo;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;
}
