// TC-197: Dashboard layout save
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { request, toast } from "./support/services.js"
import { wrapper } from "./support/ui.jsx"
vi.mock("@/services/dashboardLayoutService.js", () => ({
  getBoardLayout: vi.fn(async () => ({ tiles: [{ i: "old", x: 0, y: 0 }] })),
  saveBoardLayout: (...args) => request(...args),
}))
import { useDashboardLayout } from "@/hooks/use-dashboard-layout.js"

test("TC-197: Dashboard layout save", async (context) => {
  request.mockResolvedValue({ tiles: [{ i: "score", x: 1, y: 0 }] })
  const { result } = renderHook(() => useDashboardLayout("learner"), {
    wrapper,
  })
  await waitFor(() => expect(result.current.tileLayout).toHaveLength(1))
  act(() => result.current.handleLayoutChange([{ i: "score", x: 1, y: 0 }]))
  await waitFor(() => expect(request).toHaveBeenCalled())
  expect(request).toHaveBeenCalledWith("learner", [{ i: "score", x: 1, y: 0 }])
  await waitFor(() =>
    expect(result.current.tileLayout).toEqual([{ i: "score", x: 1, y: 0 }])
  )
}, 15000)
