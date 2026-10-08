package com.capstone.rebyu.aigateway.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiQuestionGenerationRequest {
    private Long certificationId;

    private Map<String, Integer> questionCounts;

    private String additionalInstructions;

    private QuestionGenerationSourceMode sourceMode;

    private Integer targetQuestionCount;
}
