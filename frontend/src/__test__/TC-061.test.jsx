/** @vitest-environment node */
// TC-061: Malformed diagram
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Native JUnit test; all generated fixture overlays are written under frontend/.native-test-output.
import { test } from "vitest"
import { nativeEnabled, runJavaTests } from "./support/native.js"

test("TC-061: Malformed diagram", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires Java/Maven dependencies. Run npm run test:native to execute; not a frontend pass."
    )
    return
  }
  await runJavaTests(
    "DiagramGraphExtractorTest#malformedXmlThrowsRatherThanReturningGarbage",
    null
  )
}, 240000)
