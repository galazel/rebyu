// TC-097: Mistake reviewed state
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Client request isolation; mistake-bank component state is not covered.
import React from "react"
import { test, expect, vi } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { request, toast } from "./support/services.js"
import { wrapper } from "./support/ui.jsx"
import { setMistakeReviewed } from "@/services/learnerToolsService.js"

test("TC-097: Mistake reviewed state", async (context) => {
  request.mockResolvedValue({ reviewed: true })
  await expect(setMistakeReviewed(7, true)).resolves.toEqual({ reviewed: true })
  expect(request).toHaveBeenCalledWith("learner-tools/mistakes/7/reviewed", {
    method: "PUT",
    data: { reviewed: true },
  })
}, 15000)
