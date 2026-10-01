package com.capstone.rebyu.assessment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

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

    @OneToMany(mappedBy = "programmingQuestionConfig", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProgrammingTestCase> testCases = new ArrayList<>();
}
