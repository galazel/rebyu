/** @vitest-environment node */
// TC-141: Nonquota provider error
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Delegates to existing Python assertions with mocked provider dependencies; execution is opt-in.
import { test } from "vitest"
import { nativeEnabled, runPythonTests } from "./support/native.js"

test("TC-141: Nonquota provider error", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires pytest and the Python backend development dependencies; enable with npm run test:native. Not executed by the frontend run."
    )
    return
  }
  await runPythonTests([
    "tests/test_quota_fallback.py::test_non_quota_errors_propagate_without_burning_the_chain",
  ])
}, 240000)
