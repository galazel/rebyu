// TC-029: GET account isolation
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect, vi } from "vitest"
import { mocks } from "./support/api.js"
import { deferred } from "./support/ui.jsx"

test("TC-029: GET account isolation", async (context) => {
  const { base, apiMessage } = await import("@/services/base.js")
  const pending = deferred()
  mocks.request.mockReturnValue(pending.promise)
  const a = base("items", { headers: { Authorization: "Bearer a" } })
  const b = base("items", { headers: { Authorization: "Bearer b" } })
  expect(mocks.request).toHaveBeenCalledTimes(2)
  pending.resolve({ data: { ok: true } })
  await Promise.all([a, b])
}, 15000)
