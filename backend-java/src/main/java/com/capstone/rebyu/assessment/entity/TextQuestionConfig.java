package com.capstone.rebyu.assessment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "text_question_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TextQuestionConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long textQuestionConfigId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "correct_answer", nullable = false, columnDefinition = "TEXT")
    private String correctAnswer;

    @Column(name = "checking_method", nullable = false, length = 30)
    private String checkingMethod = "EXACT_MATCH";

    @Column(name = "accepted_variations", columnDefinition = "TEXT")
    private String acceptedVariations;
}
