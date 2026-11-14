/** @vitest-environment node */
// TC-130: Lesson schema
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Delegates to existing Python assertions with mocked provider dependencies; execution is opt-in.
import { test } from "vitest"
import { nativeEnabled, runPythonTests } from "./support/native.js"

test("TC-130: Lesson schema", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires pytest and the Python backend development dependencies; enable with npm run test:native. Not executed by the frontend run."
    )
    return
  }
  await runPythonTests([
    "tests/test_lesson_schema.py::test_valid_lesson_is_accepted",
    "tests/test_lesson_schema.py::test_missing_introduction_is_rejected",
    "tests/test_lesson_schema.py::test_empty_content_is_rejected",
  ])
}, 240000)
