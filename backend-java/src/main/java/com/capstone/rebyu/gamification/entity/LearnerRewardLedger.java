package com.capstone.rebyu.gamification.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(
        name = "learner_reward_ledger",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_learner_reward_source_currency",
                columnNames = {"learner_id", "source_key", "currency"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearnerRewardLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reward_ledger_id")
    private Long rewardLedgerId;

    @Column(name = "learner_id", nullable = false)
    private Long learnerId;

    @Column(nullable = false, length = 16)
    private String currency;

    @Column(nullable = false)
    private int amount;

    @Column(nullable = false, length = 48)
    private String reason;

    @Column(name = "source_key", nullable = false, length = 180)
    private String sourceKey;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
