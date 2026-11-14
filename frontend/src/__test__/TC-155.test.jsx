// TC-155: Institution dashboard aggregation
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Covers frontend institution data derivation, not backend dashboard aggregate calculations.
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

test("TC-155: Institution dashboard aggregation", async (context) => {
  request.mockResolvedValue({
    learners: [{ learnerId: 7, firstName: "Ivan" }],
    institutionCerts: [{ institutionCertId: 2, certificationId: 1 }],
    assignments: [],
    groupMemberships: [],
  })
  const { result } = renderHook(() => useInstitutionData(9), { wrapper })
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.learnerById.get(7).firstName).toBe("Ivan")
  expect(result.current.institutionCertById.get(2).certificationId).toBe(1)
  expect(result.current.certificationById.get(1).title).toBe("Networking")
}, 15000)
