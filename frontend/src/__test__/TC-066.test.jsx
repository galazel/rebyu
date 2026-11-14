/** @vitest-environment node */
// TC-066: Arena retake selection
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Verifies arena problem-set preservation in configuration; a full retake-path assertion remains additional coverage.
import { test } from "vitest"
import { nativeEnabled, runJavaTests } from "./support/native.js"

test("TC-066: Arena retake selection", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires Java/Maven dependencies; run npm run test:native. Not a frontend pass."
    )
    return
  }
  await runJavaTests(
    "ChallengeArenaConfigTest#problemsKeepTheirNodeAndPoints",
    null
  )
}, 240000)
