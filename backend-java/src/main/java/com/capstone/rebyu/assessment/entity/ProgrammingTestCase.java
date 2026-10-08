package com.capstone.rebyu.assessment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "programming_test_cases")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProgrammingTestCase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long programmingTestCaseId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "programming_question_config_id", nullable = false)
    private ProgrammingQuestionConfig programmingQuestionConfig;

    @Column(name = "input_data", nullable = false, columnDefinition = "TEXT")
    private String inputData;

    @Column(name = "expected_output", nullable = false, columnDefinition = "TEXT")
    private String expectedOutput;

    @Column(name = "is_sample", nullable = false)
    private boolean isSample = false;
}
