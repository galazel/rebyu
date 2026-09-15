package com.capstone.rebyu.execution;

import com.capstone.rebyu.execution.client.Judge0Client;
import com.capstone.rebyu.execution.config.Judge0ClientConfig;
import com.capstone.rebyu.execution.config.Judge0Properties;
import com.capstone.rebyu.execution.dto.CodeExecutionRequestDto;
import com.capstone.rebyu.execution.dto.CodeExecutionRequestDto.TestCaseInputDto;
import com.capstone.rebyu.execution.dto.CodeExecutionResultDto;
import com.capstone.rebyu.execution.service.CodeExecutionService;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Runs real programs through the configured Judge0 (the public ce.judge0.com by
 * default). Opt-in, because it needs the network:
 *
 * <pre>JUDGE0_LIVE=true ./mvnw test -Dtest=Judge0LiveIT</pre>
 *
 * It exists because the unit tests mock Judge0Client, and the client had been
 * reading the batch endpoint's token list as if it were results -- every mocked
 * test passed while no program was ever actually judged.
 */
@EnabledIfEnvironmentVariable(named = "JUDGE0_LIVE", matches = "true")
class Judge0LiveIT {

    private static CodeExecutionService service;

    @BeforeAll
    static void setUp() {
        Judge0Properties properties = new Judge0Properties();
        String baseUrl = System.getenv("JUDGE0_BASE_URL");
        if (baseUrl != null && !baseUrl.isBlank()) properties.setBaseUrl(baseUrl);
        Judge0Client client = new Judge0Client(new Judge0ClientConfig().judge0WebClient(properties), properties);
        service = new CodeExecutionService(client, properties);
    }

    private static final String DOUBLE_IT = "print(int(input()) * 2)";

    @Test
    void correctProgramPassesEveryTest() {
        CodeExecutionResultDto result = service.execute(new CodeExecutionRequestDto("Python", DOUBLE_IT, List.of(
                new TestCaseInputDto(1, true, "21", "42"),
                new TestCaseInputDto(2, false, "5", "10"),
                new TestCaseInputDto(3, false, "0", "0"))));

        assertEquals("COMPLETED", result.status(), () -> "message: " + result.error());
        assertEquals(3, result.totalTests());
        assertEquals(3, result.passedTests());
    }

    @Test
    void wrongOutputFailsOnlyTheTestsItGetsWrong() {
        CodeExecutionResultDto result = service.execute(new CodeExecutionRequestDto("Python", DOUBLE_IT, List.of(
                new TestCaseInputDto(1, true, "21", "42"),
                new TestCaseInputDto(2, false, "5", "11"))));

        assertEquals("COMPLETED", result.status(), () -> "message: " + result.error());
        assertEquals(1, result.passedTests());
        assertEquals("FAILED", result.testResults().get(1).status());
    }

    private static final String BANK_ACCOUNT = """
            class BankAccount:
                def __init__(self, initial_balance=0):
                    self.__balance = initial_balance
                def deposit(self, amount):
                    if amount <= 0:
                        return False
                    self.__balance += amount
                    return True
                def withdraw(self, amount):
                    if amount <= 0 or amount > self.__balance:
                        return False
                    self.__balance -= amount
                    return True

            account = BankAccount(100)
            print("demo output that the tests must ignore")
            """;

    @Test
    void pythonTestCasesWrittenAsCodeRunAgainstTheLearnersCode() {
        CodeExecutionResultDto result = service.execute(new CodeExecutionRequestDto("Python", BANK_ACCOUNT, List.of(
                new TestCaseInputDto(1, true, "acct = BankAccount(100)\nacct.deposit(50)\nprint(acct.withdraw(120))", "True"),
                new TestCaseInputDto(2, false, "acct = BankAccount(100)\nprint(acct.withdraw(150))", "False"),
                new TestCaseInputDto(3, false,
                        "acct = BankAccount()\nacct.deposit(200)\nacct.withdraw(50)\nprint(acct.withdraw(200))", "False"))));

        assertEquals("COMPLETED", result.status(), () -> "error: " + result.error());
        assertEquals(3, result.passedTests(), () -> "results: " + result.testResults());
    }

    @Test
    void pythonExpressionTestCasePrintsTheReturnedValue() {
        String code = "def label(x):\n    return {'n': x, 'ok': x > 0}\n\nprint('demo')\n";
        CodeExecutionResultDto result = service.execute(new CodeExecutionRequestDto("Python", code, List.of(
                new TestCaseInputDto(1, true, "label(5)", "{'n': 5, 'ok': True}"))));

        assertEquals(1, result.passedTests(), () -> "results: " + result.testResults());
    }

    @Test
    void javaCompileErrorIsReported() {
        CodeExecutionResultDto result = service.execute(new CodeExecutionRequestDto("Java",
                "public class Main { public static void main(String[] a) { System.out.println(1) } }",
                List.of(new TestCaseInputDto(1, true, "", "1"))));

        assertEquals("COMPILE_ERROR", result.status());
    }
}
