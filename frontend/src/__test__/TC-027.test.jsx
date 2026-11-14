// TC-027: No session token
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect, vi } from "vitest"
import { mocks } from "./support/api.js"
import { deferred } from "./support/ui.jsx"

test("TC-027: No session token", async (context) => {
  const { base, apiMessage } = await import("@/services/base.js")
  mocks.session.mockResolvedValue({ data: { session: null } })
  mocks.request.mockResolvedValue({ data: {} })
  await base("items")
  expect(mocks.request.mock.calls[0][0].headers).not.toHaveProperty(
    "Authorization"
  )
}, 15000)
