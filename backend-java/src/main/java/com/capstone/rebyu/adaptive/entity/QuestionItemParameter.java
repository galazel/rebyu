package com.capstone.rebyu.adaptive.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * A question's item response theory parameters: how well it separates strong
 * from weak learners (discrimination), where on the ability scale it sits
 * (difficulty), and how often it is got right by luck (guessing).
 *
 * <p>Starts ONLINE, seeded from the authored difficulty label and nudged after
 * every response; becomes CALIBRATED once the batch job has fitted it from
 * enough real responses.
 */
@Entity
@Table(name = "question_item_parameters")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionItemParameter {

    public static final String SOURCE_ONLINE = "ONLINE";
    public static final String SOURCE_CALIBRATED = "CALIBRATED";

    @Id
    @Column(name = "question_id")
    private Long questionId;

    @Column(name = "discrimination", nullable = false)
    private double discrimination;

    @Column(name = "difficulty", nullable = false)
    private double difficulty;

    @Column(name = "guessing", nullable = false)
    private double guessing;

    @Column(name = "response_count", nullable = false)
    private int responseCount;

    @Column(name = "source", nullable = false, length = 12)
    private String source;

    @Column(name = "calibrated_at")
    private LocalDateTime calibratedAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
