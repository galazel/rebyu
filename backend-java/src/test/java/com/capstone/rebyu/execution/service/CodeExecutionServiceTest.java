package com.capstone.rebyu.execution.service;

import com.capstone.rebyu.execution.client.Judge0Client;
import com.capstone.rebyu.execution.client.Judge0ServiceException;
import com.capstone.rebyu.execution.config.Judge0Properties;
import com.capstone.rebyu.execution.dto.CodeExecutionRequestDto;
import com.capstone.rebyu.execution.dto.CodeExecutionRequestDto.TestCaseInputDto;
import com.capstone.rebyu.execution.dto.CodeExecutionResultDto;
import com.capstone.rebyu.execution.dto.Judge0SubmissionResultDto;
import com.capstone.rebyu.execution.dto.Judge0SubmissionResultDto.Judge0StatusDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CodeExecutionServiceTest {

    @Mock private Judge0Client judge0Client;

    private Judge0Properties properties;
    private CodeExecutionService service;

    @BeforeEach
    void setUp() {
        properties = new Judge0Properties();
        service = new CodeExecutionService(judge0Client, properties);
    }

    private static String b64(String value) {
        return Base64.getEncoder().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private static Judge0SubmissionResultDto accepted(String stdout, String time, int memory) {
        return new Judge0SubmissionResultDto(
                b64(stdout), null, null, null, new Judge0StatusDto(3, "Accepted"), time, memory);
    }

    @Test
    void unsupportedLanguageNeverCallsJudge0() {
        CodeExecutionResultDto result = service.execute(new CodeExecutionRequestDto(
                "Pseudocode", "print 1", List.of(new TestCaseInputDto(1, true, "", "1"))));

        assertEquals("UNSUPPORTED_LANGUAGE", result.status());
    }

    @Test
    void comparesStdoutIgnoringTrailingWhitespaceOnly() {
        when(judge0Client.submitBatch(anyList())).thenReturn(List.of(
                accepted("5\n", "0.01", 3200),
                accepted(" 6", "0.02", 3300)));

        CodeExecutionResultDto result = service.execute(new CodeExecutionRequestDto(
                "Python", "print(sum(map(int, input().split())))", List.of(
                        new TestCaseInputDto(1, true, "2 3", "5"),
                        new TestCaseInputDto(2, false, "2 4", "6"))));

        assertEquals("COMPLETED", result.status());
        assertEquals(1, result.passedTests());
        assertEquals(2, result.totalTests());
        assertTrue(result.testResults().get(0).passed());
        assertFalse(result.testResults().get(1).passed());
    }

    @Test
    void compileErrorShortCircuitsToCompileErrorStatusWithZeroCredit() {
        Judge0SubmissionResultDto compileFailure = new Judge0SubmissionResultDto(
                null, null, b64("syntax error at line 1"), null,
                new Judge0StatusDto(6, "Compilation Error"), null, null);
        when(judge0Client.submitBatch(anyList())).thenReturn(List.of(compileFailure, compileFailure));

        CodeExecutionResultDto result = service.execute(new CodeExecutionRequestDto(
                "Java", "this does not compile", List.of(
                        new TestCaseInputDto(1, true, "", "x"),
                        new TestCaseInputDto(2, false, "", "y"))));

        assertEquals("COMPILE_ERROR", result.status());
        assertEquals(0, result.passedTests());
        assertTrue(result.error().contains("syntax error"));
    }

    @Test
    void judge0FailureReportsUnavailableNeverFabricatesAResult() {
        when(judge0Client.submitBatch(anyList()))
                .thenThrow(new Judge0ServiceException("network error"));

        CodeExecutionResultDto result = service.execute(new CodeExecutionRequestDto(
                "Python", "print(1)", List.of(new TestCaseInputDto(1, true, "", "1"))));

        assertEquals("UNAVAILABLE", result.status());
        assertNull(result.passedTests());
        assertNull(result.totalTests());
    }

    @Test
    void disabledIntegrationNeverCallsJudge0() {
        properties.setEnabled(false);
        CodeExecutionResultDto result = service.execute(new CodeExecutionRequestDto(
                "Python", "print(1)", List.of(new TestCaseInputDto(1, true, "", "1"))));

        assertEquals("UNAVAILABLE", result.status());
    }
}
