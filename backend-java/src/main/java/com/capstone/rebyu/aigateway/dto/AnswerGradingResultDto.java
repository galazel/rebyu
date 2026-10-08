package com.capstone.rebyu.aigateway.dto;

import java.math.BigDecimal;
import java.util.List;

public record AnswerGradingResultDto(
        BigDecimal earnedPoints,
        String feedback,
        List<SubAnswerGradeDto> subScores
) {
    public record SubAnswerGradeDto(
            Long subQuestionId,
            BigDecimal earnedPoints,
            String feedback
    ) {}
}
