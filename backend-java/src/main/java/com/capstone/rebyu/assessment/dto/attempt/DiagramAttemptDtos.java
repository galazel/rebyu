package com.capstone.rebyu.assessment.dto.attempt;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public final class DiagramAttemptDtos {

    private DiagramAttemptDtos() {
    }

    public record DiagramCheckRequestDto(
            @NotNull Long learnerId,
            String diagramData,
            String diagramType
    ) {
    }

    public record RubricCriterionDto(
            String name,
            BigDecimal maxPoints,
            BigDecimal awardedPoints,
            String feedback,
            String status
    ) {
    }

    public record DiagramCheckResultDto(
            String status,
            String message,
            List<RubricCriterionDto> rubric
    ) {
    }
}
