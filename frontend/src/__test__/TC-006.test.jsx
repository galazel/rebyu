// TC-006: Password confirmation
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

test("TC-006: Password confirmation", async (context) => {
  registration()
  fillRegistration({ "Confirm password": "Different1!" })
  submitRegistration()
  expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument()
  expect(mocks.register).not.toHaveBeenCalled()
}, 15000)
