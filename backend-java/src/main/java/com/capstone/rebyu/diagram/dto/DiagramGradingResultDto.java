package com.capstone.rebyu.diagram.dto;

import java.math.BigDecimal;
import java.util.List;

public record DiagramGradingResultDto(
        String status,
        BigDecimal earnedPoints,
        BigDecimal maxPoints,
        String feedback,
        List<ElementResultDto> elementResults
) {
    public record ElementResultDto(
            String kind,
            String expectedDescription,
            boolean matched,
            String matchQuality,
            String learnerDescription,
            String reason,
            BigDecimal earnedPoints,
            BigDecimal maxPoints
    ) {}
}
