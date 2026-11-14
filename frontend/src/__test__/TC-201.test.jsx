// TC-201: Admin save failure
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Uses the shared administrative reference editor to verify failed-save input retention; certification/question editor variants need additional fixtures.
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
import { DetailedReferenceList } from "@/pages/admin/reference-detailed-list.jsx"

test("TC-201: Admin save failure", async (context) => {
  request.mockImplementation((endpoint, options) =>
    options?.method === "POST"
      ? Promise.reject(new Error("Save failed"))
      : Promise.resolve([])
  )
  render(
    <DetailedReferenceList
      kind="PROGRAM"
      title="Programs"
      description="Programs"
      fields={[{ key: "label", label: "Name", max: 150 }]}
    />,
    { wrapper }
  )
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Information Technology" },
  })
  fireEvent.submit(screen.getByLabelText("Name").closest("form"))
  await waitFor(() => expect(toast.error).toHaveBeenCalled())
  expect(screen.getByLabelText("Name")).toHaveValue("Information Technology")
  expect(toast.success).not.toHaveBeenCalled()
}, 15000)
