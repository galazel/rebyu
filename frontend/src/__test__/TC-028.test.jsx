// TC-028: Concurrent GET deduplication
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect, vi } from "vitest"
import { mocks } from "./support/api.js"
import { deferred } from "./support/ui.jsx"

test("TC-028: Concurrent GET deduplication", async (context) => {
  const { base, apiMessage } = await import("@/services/base.js")
  mocks.session.mockResolvedValue({
    data: { session: { access_token: "same" } },
  })
  const pending = deferred()
  mocks.request.mockReturnValue(pending.promise)
  const first = base("items")
  const second = base("items")
  await vi.waitFor(() => expect(mocks.request).toHaveBeenCalledTimes(1))
  pending.resolve({ data: { ok: true } })
  expect(await first).toEqual({ ok: true })
  expect(await second).toEqual({ ok: true })
}, 15000)
