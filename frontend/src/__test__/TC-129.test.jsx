/** @vitest-environment node */
// TC-129: Invalid curriculum
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Delegates to existing Python assertions with mocked provider dependencies; execution is opt-in.
import { test } from "vitest"
import { nativeEnabled, runPythonTests } from "./support/native.js"

test("TC-129: Invalid curriculum", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires pytest and the Python backend development dependencies; enable with npm run test:native. Not executed by the frontend run."
    )
    return
  }
  await runPythonTests([
    "tests/test_curriculum_schema.py::test_a_curriculum_with_no_lessons_anywhere_is_rejected_for_resampling",
  ])
}, 240000)
