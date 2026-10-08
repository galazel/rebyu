package com.capstone.rebyu.assessment.dto.attempt;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

public final class ProgrammingAttemptDtos {

    private ProgrammingAttemptDtos() {
    }

    public record ProgrammingRunRequestDto(
            @NotNull Long learnerId,
            String code,
            String language
    ) {
    }

    public record LearnerTestCaseDto(
            int index,
            String label,
            boolean sample,
            String input,
            String status,
            String expectedOutput,
            String actualOutput
    ) {
    }

    public record ExecutionResultDto(
            Long executionId,
            String mode,
            String status,
            String message,
            String language,
            Integer passedTests,
            Integer totalTests,
            LocalDateTime createdAt,
            List<LearnerTestCaseDto> tests,
            String stdout,
            String stderr
    ) {
    }

    public record ExecutionHistoryItemDto(
            Long executionId,
            String mode,
            String language,
            String status,
            Integer passedTests,
            Integer totalTests,
            LocalDateTime createdAt
    ) {
    }
}
