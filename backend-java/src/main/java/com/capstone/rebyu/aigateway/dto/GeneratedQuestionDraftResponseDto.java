package com.capstone.rebyu.aigateway.dto;

import java.util.List;

public record GeneratedQuestionDraftResponseDto(
        List<GeneratedQuestionDraftDto> questions,
        GenerationAnalysisDto analysis,
        List<String> warnings
) {

    public record GenerationAnalysisDto(
            Long certificationId,
            QuestionGenerationSourceMode sourceMode,
            Integer requestedTarget,
            Integer generatedCount,
            Integer knowledgeChunksUsed,
            Integer uploadedFilesUsed
    ) {
    }
}
