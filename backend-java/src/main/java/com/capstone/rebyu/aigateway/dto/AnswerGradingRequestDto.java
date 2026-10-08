package com.capstone.rebyu.aigateway.dto;

import java.math.BigDecimal;
import java.util.List;

public record AnswerGradingRequestDto(
        String questionText,
        BigDecimal maxPoints,
        String rubricGuidance,
        List<RubricCriterionDto> rubricCriteria,
        String learnerAnswer,
        List<SubQuestionGradingRequestDto> subQuestions
) {
    public record RubricCriterionDto(String name, BigDecimal maxPoints) {}

    public record SubQuestionGradingRequestDto(
            Long subQuestionId,
            String questionText,
            BigDecimal maxPoints,
            String rubricGuidance,
            List<RubricCriterionDto> rubricCriteria,
            String learnerAnswer
    ) {}
}
