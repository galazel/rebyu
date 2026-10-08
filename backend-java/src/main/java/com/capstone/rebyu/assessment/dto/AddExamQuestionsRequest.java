package com.capstone.rebyu.assessment.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record AddExamQuestionsRequest(
        @NotEmpty @Valid List<Item> questions
) {
    public record Item(
            @NotNull Long questionId,
            @DecimalMin(value = "0.0", inclusive = false) BigDecimal points,
            Integer displayOrder
    ) {
    }
}
