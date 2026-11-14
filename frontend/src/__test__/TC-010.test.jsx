// TC-010: Unrecognized partnership reference (negative test)
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import {
  registration,
  fillRegistration,
  submitRegistration,
  mocks,
} from "./support/registration.jsx"

test("TC-010: Unrecognized partnership reference", async () => {
  registration("institution")
  const message = "No partnership request has that reference number."
  mocks.lookup.mockRejectedValueOnce({ response: { data: { message } } })

  fireEvent.change(screen.getByLabelText("Partnership reference number"), {
    target: { value: "PR-ZZZZZZZZ" },
  })

  expect(await screen.findByText(message)).toBeInTheDocument()
  expect(mocks.lookup).toHaveBeenCalledWith("PR-ZZZZZZZZ")
  expect(screen.queryByText("School")).not.toBeInTheDocument()
  expect(screen.queryByText("school@example.test")).not.toBeInTheDocument()

  fillRegistration()
  submitRegistration()

  await waitFor(() => expect(mocks.register).not.toHaveBeenCalled())
  expect(mocks.navigate).not.toHaveBeenCalled()
})
