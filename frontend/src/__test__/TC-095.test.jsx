// TC-095: Library save
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Client save contract; page cache/render update is not covered.
import React from "react"
import { test, expect, vi } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { request, toast } from "./support/services.js"
import { wrapper } from "./support/ui.jsx"
import { addLibraryItem } from "@/services/learnerToolsService.js"

test("TC-095: Library save", async (context) => {
  const payload = {
    title: "Recall cards",
    type: "flashcards",
    content: { cards: [] },
  }
  const saved = { id: 7, ...payload }
  request.mockResolvedValue(saved)
  expect(await addLibraryItem(payload)).toEqual(saved)
  expect(request).toHaveBeenCalledWith("learner-tools/library", {
    method: "POST",
    data: payload,
  })
}, 15000)
