package com.capstone.rebyu.assessment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "programming_question_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProgrammingQuestionConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long programmingQuestionConfigId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "starter_code", columnDefinition = "TEXT")
    private String starterCode;

    @Column(name = "language")
    private String language;

    /**
     * What a correct program prints. The learner's program runs once with no input and its stdout
     * is compared with this (trailing whitespace ignored). Replaced the per-question test cases.
     */
    @Column(name = "expected_output", columnDefinition = "TEXT")
    private String expectedOutput;
}
