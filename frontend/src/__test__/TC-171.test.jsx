/** @vitest-environment node */
// TC-171: Repeated conversion
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Delegates to existing production-service JUnit assertions; execution is opt-in and is not a frontend mock test.
import { test } from "vitest"
import { nativeEnabled, runJavaTests } from "./support/native.js"

test("TC-171: Repeated conversion", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires the Java unit-test toolchain; enable with npm run test:native. Not executed by the frontend run."
    )
    return
  }
  await runJavaTests(
    "RewardServiceTest#convertCoinsToAiCredits_duplicateIdempotencyKey_returnsUnconverted"
  )
}, 240000)
