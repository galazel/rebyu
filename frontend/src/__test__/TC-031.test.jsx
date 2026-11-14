// TC-031: Failed GET cleanup
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect, vi } from "vitest"
import { mocks } from "./support/api.js"
import { deferred } from "./support/ui.jsx"

test("TC-031: Failed GET cleanup", async (context) => {
  const { base, apiMessage } = await import("@/services/base.js")
  mocks.session.mockResolvedValue({ data: { session: null } })
  mocks.request
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce({ data: { ok: true } })
  await expect(base("retry")).rejects.toThrow("offline")
  await expect(base("retry")).resolves.toEqual({ ok: true })
  expect(mocks.request).toHaveBeenCalledTimes(2)
}, 15000)
