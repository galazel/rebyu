// TC-157: Announcement save failure
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Client error propagation only; announcement editor error rendering and local list retention need a component fixture.
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
import { createDepartmentAnnouncement } from "@/services/institutionService.js"

test("TC-157: Announcement save failure", async (context) => {
  request.mockRejectedValue(new Error("Announcement save failed"))
  const payload = { title: "Exam schedule", body: "Friday", pinned: false }
  await expect(createDepartmentAnnouncement(1, payload)).rejects.toThrow(
    "Announcement save failed"
  )
  expect(request).toHaveBeenCalledWith("departments/1/announcements", {
    method: "POST",
    data: payload,
  })
}, 15000)
