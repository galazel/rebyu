/** @vitest-environment node */
// TC-047: Ineligible learner
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Native JUnit test; all generated fixture overlays are written under frontend/.native-test-output.
import { test } from "vitest"
import { nativeEnabled, runJavaTests } from "./support/native.js"

test("TC-047: Ineligible learner", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires Java/Maven dependencies. Run npm run test:native to execute; not a frontend pass."
    )
    return
  }
  await runJavaTests("AssessmentAttemptServiceTest#catalogCase", {
    source: "assessment/service/AssessmentAttemptServiceTest.java",
    append:
      "assertThrows(com.capstone.rebyu.common.BusinessRuleException.InvalidAssessmentSubmissionException.class,\n () -> service.startAttempt(1L, null, null, null, null));\nverify(attemptRepository, never()).save(any());",
  })
}, 240000)
