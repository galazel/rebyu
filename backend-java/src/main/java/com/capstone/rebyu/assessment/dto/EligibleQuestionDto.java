package com.capstone.rebyu.assessment.dto;

import java.math.BigDecimal;

public record EligibleQuestionDto(
        Long questionId,
        String questionType,
        String difficultyLevel,
        String questionText,
        Long lessonId,
        String lessonTitle,
        String middleTitle,
        String majorTitle
) {
}
