// TC-198: Dashboard layout failure
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

test("TC-198: Dashboard layout failure", async (context) => {
  request.mockRejectedValue(new Error("Offline"))
  const { result } = renderHook(() => useDashboardLayout("learner"), {
    wrapper,
  })
  await waitFor(() => expect(result.current.tileLayout).toHaveLength(1))
  act(() => result.current.handleLayoutChange([{ i: "score", x: 1, y: 0 }]))
  await waitFor(() => expect(toast.error).toHaveBeenCalled())
  await waitFor(() =>
    expect(result.current.tileLayout).toEqual([{ i: "old", x: 0, y: 0 }])
  )
}, 15000)
