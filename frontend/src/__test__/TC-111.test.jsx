/** @vitest-environment node */
// TC-111: Grounded context
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Delegates to existing Python assertions with mocked provider dependencies; execution is opt-in.
import { test } from "vitest"
import { nativeEnabled, runPythonTests } from "./support/native.js"

test("TC-111: Grounded context", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires pytest and the Python backend development dependencies; enable with npm run test:native. Not executed by the frontend run."
    )
    return
  }
  await runPythonTests([
    "tests/test_rag.py::test_retrieve_returns_scoped_results",
    "tests/test_rag.py::test_format_context_includes_provenance_and_respects_budget",
  ])
}, 240000)
