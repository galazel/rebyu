package com.capstone.rebyu.diagram.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record DiagramGradingResultDto(
        String status,
        BigDecimal earnedPoints,
        BigDecimal maxPoints,
        String feedback,
        List<ElementResultDto> elementResults,
        Boolean coversEveryPart
) {
    public DiagramGradingResultDto(
            String status, BigDecimal earnedPoints, BigDecimal maxPoints,
            String feedback, List<ElementResultDto> elementResults) {
        this(status, earnedPoints, maxPoints, feedback, elementResults, null);
    }

    /**
     * One required part of the model answer and how the learner's diagram did on it.
     * {@code category} names it in the diagram type's own terms -- "Actors", "«include»",
     * "Inheritance", "Decisions", "Messages". {@code checks} records each rule it was held
     * to (see DiagramGradingService.CHECK_*): drawn at all, its name, its shape, the
     * relationship's kind, direction, label and multiplicity, message order, placement
     * inside a system boundary -- true when met, false when not; absent when not applicable.
     */
    public record ElementResultDto(
            String kind,
            String expectedDescription,
            boolean matched,
            String matchQuality,
            String learnerDescription,
            String reason,
            BigDecimal earnedPoints,
            BigDecimal maxPoints,
            String category,
            Map<String, Boolean> checks
    ) {
        public ElementResultDto(
                String kind, String expectedDescription, boolean matched, String matchQuality,
                String learnerDescription, String reason, BigDecimal earnedPoints, BigDecimal maxPoints) {
            this(kind, expectedDescription, matched, matchQuality, learnerDescription, reason,
                    earnedPoints, maxPoints, null, null);
        }
    }
}
