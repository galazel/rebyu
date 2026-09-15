package com.capstone.rebyu.assessment.dto.attempt;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Learner-safe programming Run/Check DTOs. Never carry expected outputs for
 * hidden test cases, and never carry a fabricated score.
 */
public final class ProgrammingAttemptDtos {

    private ProgrammingAttemptDtos() {
    }

    public record ProgrammingRunRequestDto(
            @NotNull Long learnerId,
            String code,
            String language
    ) {
    }

    /**
     * One test case as the learner may see it. `input` is null for hidden cases,
     * and so are `expectedOutput` and `actualOutput`: only a sample test shows
     * what it expected and what the learner's program printed for it.
     */
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
            /* What the program printed (first test with output), and any
               compile or runtime error text, verbatim -- the output panel shows
               these rather than only the "n / m passed" summary in `message`. */
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
