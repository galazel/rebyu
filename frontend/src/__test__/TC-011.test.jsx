// TC-011: Department code format
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import {
  registration,
  fillRegistration,
  submitRegistration,
  mocks,
} from "./support/registration.jsx"
import { deferred } from "./support/ui.jsx"

test("TC-011: Department code format", async (context) => {
  registration("department")
  const input = screen.getByPlaceholderText(/DH-/)
  fireEvent.change(input, { target: { value: "DH-12" } })
  expect(mocks.department).not.toHaveBeenCalled()
  fireEvent.change(input, { target: { value: "DH-ABCDEFG1" } })
  await waitFor(() =>
    expect(mocks.department).toHaveBeenCalledWith("DH-ABCDEFG1")
  )
}, 15000)
