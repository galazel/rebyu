// TC-026: Explicit authorization
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect, vi } from "vitest"
import { mocks } from "./support/api.js"
import { deferred } from "./support/ui.jsx"

test("TC-026: Explicit authorization", async (context) => {
  const { base, apiMessage } = await import("@/services/base.js")
  mocks.request.mockResolvedValue({ data: {} })
  await base("items", { headers: { Authorization: "Bearer explicit" } })
  expect(mocks.request).toHaveBeenCalledWith(
    expect.objectContaining({ headers: { Authorization: "Bearer explicit" } })
  )
  expect(mocks.session).not.toHaveBeenCalled()
}, 15000)
