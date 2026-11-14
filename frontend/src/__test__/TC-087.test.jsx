// TC-087: Study plan error
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { request, toast } from "./support/services.js"
import { wrapper } from "./support/ui.jsx"
import { useStudyPlan } from "@/hooks/useStudyPlan.js"

test("TC-087: Study plan error", async (context) => {
  request.mockRejectedValue(new Error("Offline"))
  const { result } = renderHook(() => useStudyPlan())
  await act(async () => {
    await expect(result.current.generatePlan("Review")).rejects.toThrow(
      "Offline"
    )
  })
  expect(result.current.loading).toBe(false)
  expect(result.current.plans).toEqual([])
  expect(toast.error).toHaveBeenCalledWith("Failed to generate plan")
}, 15000)
