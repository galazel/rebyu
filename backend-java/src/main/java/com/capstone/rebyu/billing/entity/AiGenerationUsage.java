package com.capstone.rebyu.billing.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** One study aid the AI tutor generated for a learner; counted against the daily cap. */
@Entity
@Table(name = "ai_generation_usage",
        indexes = @Index(name = "idx_ai_generation_usage_learner_day", columnList = "learner_id, usage_date"))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiGenerationUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long aiGenerationUsageId;

    @Column(name = "learner_id", nullable = false)
    private Long learnerId;

    /** quiz | flashcard */
    @Column(name = "kind", nullable = false, length = 20)
    private String kind;

    @Column(name = "usage_date", nullable = false)
    private LocalDate usageDate;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
