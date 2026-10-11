package com.capstone.rebyu.diagram.dto;

import java.math.BigDecimal;

/**
 * {@code diagramType} picks the notation rules -- ERD, UML_CLASS, USE_CASE,
 * SEQUENCE_DIAGRAM, ACTIVITY_DIAGRAM, FLOWCHART, UML_COMPONENT, or an alias of one.
 * Null grades by structure alone. {@code questionText} (with the instructions) decides
 * which of the reference's attributes the question actually asks for; null treats them
 * all as required.
 */
public record DiagramGradingRequestDto(
        String referenceXml,
        String learnerXml,
        BigDecimal maxPoints,
        String diagramType,
        String questionText
) {
    public DiagramGradingRequestDto(String referenceXml, String learnerXml, BigDecimal maxPoints) {
        this(referenceXml, learnerXml, maxPoints, null, null);
    }

    public DiagramGradingRequestDto(String referenceXml, String learnerXml, BigDecimal maxPoints, String diagramType) {
        this(referenceXml, learnerXml, maxPoints, diagramType, null);
    }
}
