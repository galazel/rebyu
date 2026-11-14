/** @vitest-environment node */
// TC-090: Practice scoring
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Delegates to existing production-service JUnit assertions; execution is opt-in and is not a frontend mock test.
import { test } from "vitest"
import { nativeEnabled, runJavaTests } from "./support/native.js"

test("TC-090: Practice scoring", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires the Java unit-test toolchain; enable with npm run test:native. Not executed by the frontend run."
    )
    return
  }
  await runJavaTests(
    "StudyPracticeServiceTest#completeAttempt_allCorrect_scoresFullMarksAndAwardsReward+completeAttempt_halfCorrect_scoresFiftyPercent"
  )
}, 240000)
