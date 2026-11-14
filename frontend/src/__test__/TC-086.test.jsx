// TC-086: Study plan response
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { request, toast } from "./support/services.js"
import { wrapper } from "./support/ui.jsx"
import { useStudyPlan } from "@/hooks/useStudyPlan.js"

test("TC-086: Study plan response", async (context) => {
  const plan = { id: 7, certifications: [1, 2] }
  request.mockResolvedValue(plan)
  const { result } = renderHook(() => useStudyPlan())
  await act(() => result.current.generatePlan({ certifications: [1, 2] }))
  expect(result.current.plans).toEqual([plan])
  expect(result.current.loading).toBe(false)
  expect(request).toHaveBeenCalledWith("study-plans/generate", {
    method: "POST",
    data: { goal: { certifications: [1, 2] } },
  })
}, 15000)
