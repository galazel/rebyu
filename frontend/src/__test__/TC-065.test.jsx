/** @vitest-environment node */
// TC-065: Adaptive retake selection
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Native service unit-test assertions; opt-in Java execution.
import { test } from "vitest"
import { nativeEnabled, runJavaTests } from "./support/native.js"

test("TC-065: Adaptive retake selection", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires Java/Maven dependencies; run npm run test:native. Not a frontend pass."
    )
    return
  }
  await runJavaTests(
    "AdaptiveFocusPlanTest#weakLessonsShareHalfThePaperAndTheRestSplitByBank+withNoWeakLessonTheWeakestIsTheFocus",
    null
  )
}, 240000)
