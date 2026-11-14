// TC-154: Learner transfer
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Client transfer payload only. Persistence, authorization and absence of duplicate membership require native controller/repository coverage.
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
import { wrapper, deferred } from "./support/ui.jsx"
import { request, toast } from "./support/services.js"
import { moveLearnerToSection } from "@/services/institutionService.js"

test("TC-154: Learner transfer", async (context) => {
  request.mockResolvedValue({ departmentLearnerId: 7, sectionId: 3 })
  await expect(moveLearnerToSection(1, 7, 3)).resolves.toEqual({
    departmentLearnerId: 7,
    sectionId: 3,
  })
  expect(request).toHaveBeenCalledWith("departments/1/sections/assignees/7", {
    method: "PATCH",
    data: { sectionId: 3 },
  })
}, 15000)
