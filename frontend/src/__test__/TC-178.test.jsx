/** @vitest-environment node */
// TC-178: Empty arena lock
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Native JUnit test; all generated fixture overlays are written under frontend/.native-test-output.
import { test } from "vitest"
import { nativeEnabled, runJavaTests } from "./support/native.js"

test("TC-178: Empty arena lock", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires Java/Maven dependencies. Run npm run test:native to execute; not a frontend pass."
    )
    return
  }
  await runJavaTests("ChallengeArenaConfigTest#catalogCase", {
    source: "challenge/service/ChallengeArenaConfigTest.java",
    append:
      'assertFalse(arenas.status("codestrike").configured());\nassertEquals(0, arenas.status("codestrike").problemCount());',
  })
}, 240000)
