// TC-034: Request option forwarding
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect, vi } from "vitest"
import { mocks } from "./support/api.js"
import { deferred } from "./support/ui.jsx"

test("TC-034: Request option forwarding", async (context) => {
  const { base, apiMessage } = await import("@/services/base.js")
  mocks.session.mockResolvedValue({ data: { session: null } })
  mocks.request.mockResolvedValue({ data: {} })
  const progress = vi.fn()
  await base("files", {
    method: "POST",
    responseType: "blob",
    timeout: 1500,
    onUploadProgress: progress,
  })
  expect(mocks.request).toHaveBeenCalledWith(
    expect.objectContaining({
      method: "POST",
      responseType: "blob",
      timeout: 1500,
      onUploadProgress: progress,
    })
  )
}, 15000)
