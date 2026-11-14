/** @vitest-environment node */
// TC-139: Redelivered generation
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Existing isolated registry/database test; verifies run identity reuse, not message-broker redelivery end to end.
import { test } from "vitest"
import { nativeEnabled, runPythonTests } from "./support/native.js"

test("TC-139: Redelivered generation", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires pytest and backend development dependencies; run npm run test:native."
    )
    return
  }
  await runPythonTests([
    "tests/test_workflow_registry.py::test_start_run_twice_for_same_thread_opens_an_attempt_instead_of_duplicating",
  ])
}, 240000)
