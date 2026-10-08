package com.capstone.rebyu.execution.dto;

import java.util.List;

public record CodeExecutionResultDto(
        String status,
        String output,
        String error,
        Long executionTimeMs,
        Long memoryKb,
        Integer passedTests,
        Integer totalTests,
        List<TestCaseResultDto> testResults
) {
    public record TestCaseResultDto(
            int index,
            boolean sample,
            boolean passed,
            String status,
            String actualOutput
    ) {}
}
