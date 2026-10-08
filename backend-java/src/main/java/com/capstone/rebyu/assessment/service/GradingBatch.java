package com.capstone.rebyu.assessment.service;

import com.capstone.rebyu.aigateway.dto.AnswerGradingResultDto;
import com.capstone.rebyu.diagram.dto.DiagramGradingResultDto;
import com.capstone.rebyu.execution.dto.CodeExecutionResultDto;

import java.util.Map;

public record GradingBatch(
        Map<Long, AnswerGradingResultDto> aiResults,
        Map<Long, CodeExecutionResultDto> codeResults,
        Map<Long, DiagramGradingResultDto> diagramResults) {

    public static GradingBatch empty() {
        return new GradingBatch(Map.of(), Map.of(), Map.of());
    }
}
