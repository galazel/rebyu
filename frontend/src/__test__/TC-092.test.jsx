/** @vitest-environment node */
// TC-092: Practice analytics isolation
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Delegates to existing production-service JUnit assertions; execution is opt-in and is not a frontend mock test.
import { test } from "vitest"
import { nativeEnabled, runJavaTests } from "./support/native.js"

test("TC-092: Practice analytics isolation", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires the Java unit-test toolchain; enable with npm run test:native. Not executed by the frontend run."
    )
    return
  }
  await runJavaTests(
    "ProgressAnalyticsAssessmentCountTest#excludesAPracticeDeckThatBelongsToOneLearner+excludesAPracticeDeckByItsTargetScope+excludesAPracticeDeckByItsExamType"
  )
}, 240000)
