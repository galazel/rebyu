/** @vitest-environment node */
// TC-056: Programming success
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Native JUnit assertions; generated fixture overlays remain inside frontend.
import { test } from "vitest"
import { nativeEnabled, runJavaTests } from "./support/native.js"

test("TC-056: Programming success", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires Java/Maven dependencies; run npm run test:native. Not executed by frontend tests."
    )
    return
  }
  await runJavaTests("AssessmentAttemptServiceTest#catalogCase", {
    source: "assessment/service/AssessmentAttemptServiceTest.java",
    append:
      'stubActiveEnrollment();\nvar rerun = new CodeExecutionResultDto("COMPLETED","",null,11L,2048L,2,2,List.of());\nvar answer = submitProgrammingWithStoredVerdict("stale-hash","print(\'changed\')",rerun);\nassertEquals(0,new BigDecimal("1").compareTo(answer.getCredit()));\nassertEquals(true,answer.getIsCorrect());\n\n\nverify(codeExecutionService,atLeastOnce()).execute(any());',
  })
}, 240000)
