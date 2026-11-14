/** @vitest-environment node */
// TC-064: Submission side effects
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Native JUnit assertions; generated fixture overlays remain inside frontend.
import { test } from "vitest"
import { nativeEnabled, runJavaTests } from "./support/native.js"

test("TC-064: Submission side effects", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires Java/Maven dependencies; run npm run test:native. Not executed by frontend tests."
    )
    return
  }
  await runJavaTests("AssessmentAttemptServiceTest#catalogCase", {
    source: "assessment/service/AssessmentAttemptServiceTest.java",
    append:
      "submitScoresMcqServerSideAndIsIdempotent();\nverify(bktOutboxService,times(1)).enqueueForAttempt(any(),any(),any());\nverify(achievementAwardService,times(1)).evaluate(2L);",
  })
}, 240000)
