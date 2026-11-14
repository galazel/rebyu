// TC-033: Tutor lock response
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect, vi } from "vitest"
import { mocks } from "./support/api.js"
import { deferred } from "./support/ui.jsx"

test("TC-033: Tutor lock response", async (context) => {
  const { base, apiMessage } = await import("@/services/base.js")
  mocks.session.mockResolvedValue({ data: { session: null } })
  const listener = vi.fn()
  window.addEventListener("rebyu:tutor-conduct", listener)
  const error = {
    response: {
      status: 423,
      data: { code: "TUTOR_LOCKED", lockedUntil: "2099-01-01T00:00:00Z" },
    },
  }
  mocks.request.mockRejectedValue(error)
  await expect(base("locked", { method: "POST" })).rejects.toBe(error)
  expect(listener.mock.calls[0][0].detail).toEqual({
    lockedUntil: "2099-01-01T00:00:00Z",
  })
  window.removeEventListener("rebyu:tutor-conduct", listener)
}, 15000)
