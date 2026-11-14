// TC-194: Upload success
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Actual hook useFileUpload is a local selection/validation hook, not a server upload hook. This tests uploadLibraryFile; server-upload loading UI is not covered.
import React from "react"
import { test, expect, vi } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { request, toast } from "./support/services.js"
import { wrapper } from "./support/ui.jsx"
import { uploadLibraryFile } from "@/services/learnerToolsService.js"

test("TC-194: Upload success", async (context) => {
  const file = new File(["example"], "notes.txt", { type: "text/plain" })
  request.mockResolvedValue({ resourceUrl: "fixture/notes.txt" })
  await expect(uploadLibraryFile(file)).resolves.toEqual({
    resourceUrl: "fixture/notes.txt",
  })
  const [endpoint, options] = request.mock.calls[0]
  expect(endpoint).toBe("learner-tools/library/upload")
  expect(options.method).toBe("POST")
  expect(options.data.get("file")).toBe(file)
}, 15000)
