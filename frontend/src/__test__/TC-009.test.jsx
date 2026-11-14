// TC-009: Institution reference lookup
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

test("TC-009: Institution reference lookup", async (context) => {
  registration("institution")
  fireEvent.change(screen.getByLabelText("Partnership reference number"), {
    target: { value: "PR-ABCDEFG1" },
  })
  expect(await screen.findByText("School")).toBeInTheDocument()
  expect(mocks.lookup).toHaveBeenCalledWith("PR-ABCDEFG1")
}, 15000)
