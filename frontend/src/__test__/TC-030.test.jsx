// TC-030: Mutation requests
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect, vi } from "vitest"
import { mocks } from "./support/api.js"
import { deferred } from "./support/ui.jsx"

test("TC-030: Mutation requests", async (context) => {
  const { base, apiMessage } = await import("@/services/base.js")
  mocks.session.mockResolvedValue({ data: { session: null } })
  mocks.request.mockResolvedValue({ data: {} })
  await Promise.all([
    base("items", { method: "POST" }),
    base("items", { method: "POST" }),
  ])
  expect(mocks.request).toHaveBeenCalledTimes(2)
}, 15000)
