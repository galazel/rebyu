package com.capstone.rebyu.assessment.dto;

import java.math.BigDecimal;

/**
 * A question eligible for an assessment's scope, with its curriculum source
 * path so the picker can show e.g. "Major → Middle → Lesson". Sub-questions are
 * excluded (they travel with their parent).
 */
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
