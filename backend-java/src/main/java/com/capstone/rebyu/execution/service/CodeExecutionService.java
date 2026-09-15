package com.capstone.rebyu.execution.service;

import com.capstone.rebyu.execution.client.Judge0Client;
import com.capstone.rebyu.execution.client.Judge0ServiceException;
import com.capstone.rebyu.execution.config.Judge0Properties;
import com.capstone.rebyu.execution.dto.CodeExecutionRequestDto;
import com.capstone.rebyu.execution.dto.CodeExecutionRequestDto.TestCaseInputDto;
import com.capstone.rebyu.execution.dto.CodeExecutionResultDto;
import com.capstone.rebyu.execution.dto.CodeExecutionResultDto.TestCaseResultDto;
import com.capstone.rebyu.execution.dto.Judge0SubmissionRequestDto;
import com.capstone.rebyu.execution.dto.Judge0SubmissionResultDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Deterministic, non-AI programming grader: runs a learner's code through
 * Judge0 for each test case and compares stdout to the expected output
 * exactly (trailing-whitespace tolerant). Never invents a result — Judge0
 * failures/unavailability surface as status UNAVAILABLE.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CodeExecutionService {

    // Stable Judge0 CE language ids for the languages this project offers.
    private static final Map<String, Integer> LANGUAGE_IDS = Map.of(
            "C", 50,
            "C++", 54,
            "JAVA", 62,
            "JAVASCRIPT", 63,
            "PYTHON", 71,
            "C#", 51,
            "SQL", 82
    );

    private static final int STATUS_COMPILATION_ERROR = 6;
    private static final int STATUS_TIME_LIMIT_EXCEEDED = 5;
    private static final int STATUS_ACCEPTED_THRESHOLD = 4; // >=4 means Judge0 itself flagged an issue

    private final Judge0Client judge0Client;
    private final Judge0Properties properties;

    public CodeExecutionResultDto execute(CodeExecutionRequestDto request) {
        Integer languageId = resolveLanguageId(request.language());
        if (languageId == null) {
            return new CodeExecutionResultDto(
                    "UNSUPPORTED_LANGUAGE",
                    null,
                    "\"" + request.language() + "\" cannot be executed automatically.",
                    null, null, null, null, List.of());
        }
        if (!properties.isEnabled()) {
            return unavailable("Code execution is temporarily disabled.");
        }

        List<TestCaseInputDto> testCases = request.testCases() == null || request.testCases().isEmpty()
                ? List.of(new TestCaseInputDto(1, true, "", null))
                : request.testCases();

        List<Judge0SubmissionRequestDto> submissions = new ArrayList<>();
        for (TestCaseInputDto testCase : testCases) {
            submissions.add(new Judge0SubmissionRequestDto(
                    encode(sourceFor(request.language(), request.sourceCode(), testCase)),
                    languageId,
                    encode(testCase.inputData()),
                    properties.getCpuTimeLimitSeconds(),
                    properties.getMemoryLimitKb()));
        }

        List<Judge0SubmissionResultDto> results;
        try {
            results = judge0Client.submitBatch(submissions);
        } catch (Judge0ServiceException e) {
            log.warn("Judge0 execution failed: {}", e.getMessage());
            return unavailable("Code execution is temporarily unavailable. Please try again shortly.");
        }
        if (results.size() != testCases.size()) {
            log.warn("Judge0 returned {} result(s) for {} submitted test case(s)",
                    results.size(), testCases.size());
            return unavailable("Code execution returned an unexpected response. Please try again.");
        }

        return aggregate(testCases, results, request.testCases() == null || request.testCases().isEmpty());
    }

    private CodeExecutionResultDto aggregate(
            List<TestCaseInputDto> testCases,
            List<Judge0SubmissionResultDto> results,
            boolean syntheticSingleRun) {

        List<TestCaseResultDto> testResults = new ArrayList<>();
        int passed = 0;
        long maxTimeMs = 0;
        long maxMemoryKb = 0;
        String firstCompileError = null;
        String firstRuntimeError = null;
        String firstOutput = null;

        for (int i = 0; i < testCases.size(); i++) {
            TestCaseInputDto testCase = testCases.get(i);
            Judge0SubmissionResultDto result = results.get(i);
            int statusId = result.status() == null ? -1 : result.status().id();
            String stdout = decode(result.stdout());
            String compileOutput = decode(result.compileOutput());
            String stderr = decode(result.stderr());
            String message = decode(result.message());

            if (firstOutput == null && stdout != null && !stdout.isBlank()) {
                firstOutput = stdout;
            }

            long timeMs = parseSecondsToMillis(result.time());
            maxTimeMs = Math.max(maxTimeMs, timeMs);
            if (result.memory() != null) {
                maxMemoryKb = Math.max(maxMemoryKb, result.memory());
            }

            if (statusId == STATUS_COMPILATION_ERROR) {
                if (firstCompileError == null) {
                    firstCompileError = compileOutput != null && !compileOutput.isBlank()
                            ? compileOutput : "Compilation failed.";
                }
                testResults.add(new TestCaseResultDto(
                        testCase.index(), testCase.sample(), false, "COMPILE_ERROR", null));
                continue;
            }

            if (statusId == STATUS_TIME_LIMIT_EXCEEDED) {
                testResults.add(new TestCaseResultDto(
                        testCase.index(), testCase.sample(), false, "TIME_LIMIT_EXCEEDED", null));
                continue;
            }

            if (statusId >= STATUS_ACCEPTED_THRESHOLD) {
                // Runtime error, internal error, or exec-format error.
                if (firstRuntimeError == null) {
                    firstRuntimeError = firstNonBlank(stderr, message,
                            result.status() == null ? "Runtime error." : result.status().description());
                }
                testResults.add(new TestCaseResultDto(
                        testCase.index(), testCase.sample(), false, "RUNTIME_ERROR", null));
                continue;
            }

            // statusId 1-3: queued/processing/accepted — with wait=true this is
            // always a completed run by the time we read it, so compare stdout.
            boolean testPassed = testCase.expectedOutput() == null
                    || stripTrailingWhitespace(stdout).equals(stripTrailingWhitespace(testCase.expectedOutput()));
            if (testPassed) passed++;
            testResults.add(new TestCaseResultDto(
                    testCase.index(), testCase.sample(), testPassed,
                    testPassed ? "PASSED" : "FAILED", stdout));
        }

        if (firstCompileError != null) {
            return new CodeExecutionResultDto(
                    "COMPILE_ERROR", null, firstCompileError,
                    maxTimeMs, maxMemoryKb, 0, testCases.size(), testResults);
        }

        Integer totalTests = syntheticSingleRun ? null : testCases.size();
        Integer passedTests = syntheticSingleRun ? null : passed;
        return new CodeExecutionResultDto(
                "COMPLETED",
                firstOutput,
                firstRuntimeError,
                maxTimeMs,
                maxMemoryKb,
                passedTests,
                totalTests,
                syntheticSingleRun ? List.of() : testResults);
    }

    /**
     * Python test cases are usually code, not stdin data.
     *
     * <p>Generated test cases are written as calls against the learner's code --
     * {@code process_payment(100, {...})}, or a few statements ending in
     * {@code print(acct.withdraw(120))} -- and they were being piped to the
     * program as stdin. The program never read them, printed its own demo, and
     * every submission failed every test however correct it was.
     *
     * <p>When a graded Python test's input parses as Python and contains a call,
     * it is run as a test harness instead: the learner's code is loaded with its
     * own prints silenced, then the test code runs in the same namespace. A test
     * that is a single expression has its value printed (as the Python REPL
     * would, via {@code print}); a block of statements prints for itself.
     * Anything else -- plain data like {@code "2 3"} -- is still fed to stdin
     * and the learner's program runs as written. Run (no expected output) is
     * never wrapped, so it always shows what the learner's program prints.
     */
    private String sourceFor(String language, String sourceCode, TestCaseInputDto testCase) {
        if (testCase.expectedOutput() == null || language == null
                || !"PYTHON".equals(language.trim().toUpperCase(Locale.ROOT))) {
            return sourceCode;
        }
        String encoded = Base64.getEncoder().encodeToString(
                (sourceCode == null ? "" : sourceCode).getBytes(StandardCharsets.UTF_8));
        return PYTHON_TEST_HARNESS.replace("__LEARNER_SOURCE__", encoded);
    }

    private static final String PYTHON_TEST_HARNESS = """
            import ast, base64, contextlib, io, sys
            _rebyu_source = base64.b64decode("__LEARNER_SOURCE__").decode("utf-8")
            _rebyu_data = sys.stdin.read()

            def _rebyu_test_tree(text):
                try:
                    tree = ast.parse(text.strip())
                except SyntaxError:
                    return None
                return tree if any(isinstance(node, ast.Call) for node in ast.walk(tree)) else None

            _rebyu_tree = _rebyu_test_tree(_rebyu_data)
            if _rebyu_tree is None:
                sys.stdin = io.StringIO(_rebyu_data)
                exec(compile(_rebyu_source, "main.py", "exec"), {"__name__": "__main__"})
            else:
                _rebyu_ns = {"__name__": "solution"}
                with contextlib.redirect_stdout(io.StringIO()):
                    exec(compile(_rebyu_source, "main.py", "exec"), _rebyu_ns)
                _rebyu_body = _rebyu_tree.body
                if _rebyu_body and isinstance(_rebyu_body[-1], ast.Expr):
                    # Like the Python prompt: the statements run, and the value of
                    # a final bare expression is printed.
                    exec(compile(ast.Module(body=_rebyu_body[:-1], type_ignores=[]), "test.py", "exec"), _rebyu_ns)
                    _rebyu_value = eval(compile(ast.Expression(_rebyu_body[-1].value), "test.py", "eval"), _rebyu_ns)
                    if _rebyu_value is not None:
                        print(_rebyu_value)
                else:
                    exec(compile(_rebyu_tree, "test.py", "exec"), _rebyu_ns)
            """;

    private CodeExecutionResultDto unavailable(String message) {
        return new CodeExecutionResultDto(
                "UNAVAILABLE", null, message, null, null, null, null, List.of());
    }

    private Integer resolveLanguageId(String language) {
        if (language == null) return null;
        return LANGUAGE_IDS.get(language.trim().toUpperCase(Locale.ROOT));
    }

    private String encode(String value) {
        if (value == null) value = "";
        return Base64.getEncoder().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private String decode(String base64) {
        if (base64 == null || base64.isBlank()) return null;
        try {
            return new String(Base64.getDecoder().decode(base64), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            return base64;
        }
    }

    private String stripTrailingWhitespace(String value) {
        if (value == null) return "";
        return value.replace("\r\n", "\n").replaceAll("\\s+$", "");
    }

    private long parseSecondsToMillis(String seconds) {
        if (seconds == null || seconds.isBlank()) return 0;
        try {
            return Math.round(Double.parseDouble(seconds) * 1000);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) return value;
        }
        return "An error occurred while running the code.";
    }
}
