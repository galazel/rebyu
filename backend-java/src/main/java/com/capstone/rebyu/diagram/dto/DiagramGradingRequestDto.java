package com.capstone.rebyu.diagram.dto;

import java.math.BigDecimal;

public record DiagramGradingRequestDto(
        String referenceXml,
        String learnerXml,
        BigDecimal maxPoints
) {}
