/** @vitest-environment node */
// TC-058: Programming timeout
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Native JUnit assertions; generated fixture overlays remain inside frontend.
import { test } from "vitest"
import { nativeEnabled, runJavaTests } from "./support/native.js"

test("TC-058: Programming timeout", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires Java/Maven dependencies; run npm run test:native. Not executed by frontend tests."
    )
    return
  }
  await runJavaTests("AssessmentAttemptServiceTest#catalogCase", {
    source: "assessment/service/AssessmentAttemptServiceTest.java",
    append:
      'stubActiveEnrollment();\nvar rerun = new CodeExecutionResultDto("TIME_LIMIT_EXCEEDED","",null,11L,2048L,0,2,List.of());\nvar answer = submitProgrammingWithStoredVerdict("stale-hash","print(\'changed\')",rerun);\nassertEquals(0,new BigDecimal("0").compareTo(answer.getCredit()));\nassertEquals(false,answer.getIsCorrect());\n\nassertTrue(answer.getExecutionResult().contains("TIME_LIMIT_EXCEEDED"));\nverify(codeExecutionService,atLeastOnce()).execute(any());',
  })
}, 240000)
