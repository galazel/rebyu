// TC-025: Bearer token injection
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect, vi } from "vitest"
import { mocks } from "./support/api.js"
import { deferred } from "./support/ui.jsx"

test("TC-025: Bearer token injection", async (context) => {
  const { base, apiMessage } = await import("@/services/base.js")
  mocks.session.mockResolvedValue({
    data: { session: { access_token: "test-token" } },
  })
  mocks.request.mockResolvedValue({ data: { ok: true } })
  await base("items")
  expect(mocks.request).toHaveBeenCalledWith(
    expect.objectContaining({ headers: { Authorization: "Bearer test-token" } })
  )
}, 15000)
