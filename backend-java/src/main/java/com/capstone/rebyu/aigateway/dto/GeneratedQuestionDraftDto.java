package com.capstone.rebyu.aigateway.dto;

import java.util.List;

public record GeneratedQuestionDraftDto(
        GeneratedQuestionType questionType,
        Long suggestedLessonId,
        String suggestedLessonTitle,
        String question,
        GeneratedQuestionDifficulty difficulty,
        List<GeneratedChoiceDto> choices,
        Integer correctChoiceIndex,
        String correctAnswer,
        GeneratedCheckingMethod checkingMethod,
        String rubricBasedAnswer,
        String starterCode,
        String programmingLanguage,
        String expectedOutput,
        GeneratedDiagramType diagramType,
        String instructions,
        String authoringNotes,
        String imageKey,
        List<String> acceptedVariations,
        List<GeneratedSubQuestionDraftDto> subQuestions
) {
    public record GeneratedSubQuestionDraftDto(
            String question,
            String expectedAnswer,
            java.math.BigDecimal points
    ) {
    }

    public GeneratedQuestionDraftDto(
            GeneratedQuestionType questionType,
            Long suggestedLessonId,
            String suggestedLessonTitle,
            String question,
            GeneratedQuestionDifficulty difficulty,
            List<GeneratedChoiceDto> choices,
            Integer correctChoiceIndex,
            String correctAnswer,
            GeneratedCheckingMethod checkingMethod,
            String rubricBasedAnswer,
            String starterCode,
            String programmingLanguage,
            String expectedOutput,
            GeneratedDiagramType diagramType,
            String instructions,
            String authoringNotes,
            String imageKey,
            List<String> acceptedVariations
    ) {
        this(questionType, suggestedLessonId, suggestedLessonTitle, question,
                difficulty, choices, correctChoiceIndex, correctAnswer,
                checkingMethod, rubricBasedAnswer, starterCode, programmingLanguage,
                expectedOutput, diagramType, instructions, authoringNotes, imageKey,
                acceptedVariations, List.of());
    }

    public GeneratedQuestionDraftDto(
            GeneratedQuestionType questionType,
            Long suggestedLessonId,
            String suggestedLessonTitle,
            String question,
            GeneratedQuestionDifficulty difficulty,
            List<GeneratedChoiceDto> choices,
            Integer correctChoiceIndex,
            String correctAnswer,
            GeneratedCheckingMethod checkingMethod,
            String rubricBasedAnswer,
            String starterCode,
            String expectedOutput,
            GeneratedDiagramType diagramType,
            String instructions,
            String authoringNotes
    ) {
        this(questionType, suggestedLessonId, suggestedLessonTitle, question,
                difficulty, choices, correctChoiceIndex, correctAnswer,
                checkingMethod, rubricBasedAnswer, starterCode, null, expectedOutput,
                diagramType, instructions, authoringNotes, null, null, List.of());
    }
}
