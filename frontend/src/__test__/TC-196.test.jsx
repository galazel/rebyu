// TC-196: Upload cleanup
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { request, toast } from "./support/services.js"
import { wrapper } from "./support/ui.jsx"
import { useFileUpload } from "@/hooks/use-file-upload.ts"

test("TC-196: Upload cleanup", async (context) => {
  const create = vi.fn(() => "blob:preview")
  const revoke = vi.fn()
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL = create
      static revokeObjectURL = revoke
    }
  )
  const { result, unmount } = renderHook(() => useFileUpload())
  act(() =>
    result.current[1].addFiles([
      new File(["image"], "test.png", { type: "image/png" }),
    ])
  )
  expect(result.current[0].files).toHaveLength(1)
  unmount()
  expect(revoke).toHaveBeenCalledWith("blob:preview")
  vi.unstubAllGlobals()
}, 15000)
