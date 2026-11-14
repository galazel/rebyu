/** @vitest-environment node */
// TC-124: Mastery event idempotency
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Existing in-memory API/database integration test, not a pure unit test; retained under its catalog ID with the level correction.
import { test } from "vitest"
import { nativeEnabled, runPythonTests } from "./support/native.js"

test("TC-124: Mastery event idempotency", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires pytest and backend development dependencies; run npm run test:native."
    )
    return
  }
  await runPythonTests([
    "tests/test_mastery_api.py::test_mastery_event_is_processed_and_idempotent",
  ])
}, 240000)
