package com.capstone.rebyu.assessment.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

/**
 * Adds questions to an assessment in order, optionally weighted (an
 * institution member's own paper). The backend validates scope, duplicates,
 * and already-assigned questions.
 */
public record AddExamQuestionsRequest(
        @NotEmpty @Valid List<Item> questions
) {
    public record Item(
            @NotNull Long questionId,
            /** Optional weight on this assessment (institution papers); null counts as one. */
            @DecimalMin(value = "0.0", inclusive = false) BigDecimal points,
            Integer displayOrder
    ) {
    }
}
