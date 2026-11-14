// TC-032: API message selection
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect, vi } from "vitest"
import { mocks } from "./support/api.js"
import { deferred } from "./support/ui.jsx"

test("TC-032: API message selection", async (context) => {
  const { base, apiMessage } = await import("@/services/base.js")
  expect(
    apiMessage(
      { response: { data: { message: "Server message" } } },
      "Fallback"
    )
  ).toBe("Server message")
  for (const message of [undefined, null, "", "   ", 42])
    expect(apiMessage({ response: { data: { message } } }, "Fallback")).toBe(
      "Fallback"
    )
}, 15000)
