// TC-200: Empty dashboard
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Covers the dashboard data hook's empty response, not the complete dashboard page rendering.
import React from "react"
import { test, expect, vi } from "vitest"
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  renderHook,
} from "@testing-library/react"
import { request, toast } from "./support/services.js"
import { wrapper, deferred } from "./support/ui.jsx"
vi.mock("@/services/institutionService.js", () => ({
  getInstitutionPortalOverview: () => request(),
}))
vi.mock("@/services/certificationService", () => ({
  getAllCertifications: async () => [
    { certificationId: 1, title: "Networking" },
  ],
}))
import { useInstitutionData } from "@/hooks/use-institution-data.js"

test("TC-200: Empty dashboard", async (context) => {
  request.mockResolvedValue({})
  const { result } = renderHook(() => useInstitutionData(9), { wrapper })
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.institutionCerts).toEqual([])
  expect(result.current.learnerById.size).toBe(0)
  expect(result.current.assignments).toEqual([])
}, 15000)
