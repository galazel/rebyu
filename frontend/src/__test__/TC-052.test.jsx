/** @vitest-environment node */
// TC-052: Accepted short answer
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Native JUnit test; all generated fixture overlays are written under frontend/.native-test-output.
import { test } from "vitest"
import { nativeEnabled, runJavaTests } from "./support/native.js"

test("TC-052: Accepted short answer", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires Java/Maven dependencies. Run npm run test:native to execute; not a frontend pass."
    )
    return
  }
  await runJavaTests("AssessmentAttemptServiceTest#catalogCase", {
    source: "assessment/service/AssessmentAttemptServiceTest.java",
    append:
      'TextQuestionConfig config = new TextQuestionConfig();\nconfig.setCorrectAnswer("CPU");\nconfig.setAcceptedVariations("Central Processing Unit");\nBoolean matches = org.springframework.test.util.ReflectionTestUtils.invokeMethod(AssessmentAttemptService.class, "matchesTextAnswer", "Central Processing Unit", config);\nassertEquals(true, matches);',
  })
}, 240000)
