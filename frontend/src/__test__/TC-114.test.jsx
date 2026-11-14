/** @vitest-environment node */
// TC-114: Learning-game validation
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Delegates to existing Python assertions with mocked provider dependencies; execution is opt-in.
import { test } from "vitest"
import { nativeEnabled, runPythonTests } from "./support/native.js"

test("TC-114: Learning-game validation", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires pytest and the Python backend development dependencies; enable with npm run test:native. Not executed by the frontend run."
    )
    return
  }
  await runPythonTests([
    "tests/test_tutor_widgets.py::test_quiz_widget_rejects_less_than_ten_valid_questions",
  ])
}, 240000)
