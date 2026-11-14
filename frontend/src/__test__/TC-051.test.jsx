/** @vitest-environment node */
// TC-051: Incorrect multiple choice
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Native JUnit test; all generated fixture overlays are written under frontend/.native-test-output.
import { test } from "vitest"
import { nativeEnabled, runJavaTests } from "./support/native.js"

test("TC-051: Incorrect multiple choice", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires Java/Maven dependencies. Run npm run test:native to execute; not a frontend pass."
    )
    return
  }
  await runJavaTests(
    "AssessmentAttemptServiceTest#submitScoresMcqServerSideAndIsIdempotent",
    {
      source: "assessment/service/AssessmentAttemptServiceTest.java",
      replace: [
        [
          "new AttemptAnswerDraftDto(1L, null, 1000L, null, null, null)",
          "new AttemptAnswerDraftDto(1L, null, 1001L, null, null, null)",
        ],
        [
          'new BigDecimal("100.00").compareTo(result.percentage())',
          "BigDecimal.ZERO.compareTo(result.percentage())",
        ],
        ["assertTrue(result.passed());", "assertFalse(result.passed());"],
        [
          "assertEquals(1, result.correctCount());",
          "assertEquals(0, result.correctCount());",
        ],
      ],
    }
  )
}, 240000)
