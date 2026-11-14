/** @vitest-environment node */
// TC-125: Cross-certification isolation
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Delegates to existing production-service JUnit assertions; execution is opt-in and is not a frontend mock test.
import { test } from "vitest"
import { nativeEnabled, runJavaTests } from "./support/native.js"

test("TC-125: Cross-certification isolation", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires the Java unit-test toolchain; enable with npm run test:native. Not executed by the frontend run."
    )
    return
  }
  await runJavaTests(
    "ProgressAnalyticsServiceTest#differentCertificationId_returnsIsolatedDataPerCertification"
  )
}, 240000)
