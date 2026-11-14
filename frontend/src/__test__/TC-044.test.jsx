// TC-044: Lesson loading failure
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Tests lesson completion failure via useLesson, not lesson-query rendering; the catalog's broader loading-error UI remains uncovered.
import React from "react"
import { test, expect, vi } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { request, toast } from "./support/services.js"
import { wrapper } from "./support/ui.jsx"
import { useLesson } from "@/hooks/useLesson.js"

test("TC-044: Lesson loading failure", async (context) => {
  request.mockRejectedValueOnce(new Error("Unavailable"))
  const { result } = renderHook(() => useLesson())
  await act(async () => {
    await expect(result.current.completeLesson(7)).rejects.toThrow(
      "Unavailable"
    )
  })
  expect(result.current.loading).toBe(false)
  expect(toast.error).toHaveBeenCalledWith("Failed to complete lesson")
  expect(toast.success).not.toHaveBeenCalled()
}, 15000)
