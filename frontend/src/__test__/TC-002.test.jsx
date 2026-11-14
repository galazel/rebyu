// TC-002: Required fields
import { test, expect } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import {
  registration,
  fillRegistration,
  submitRegistration,
  mocks,
} from "./support/registration.jsx"
import { deferred } from "./support/ui.jsx"

test("TC-002: Required fields", async (context) => {
  registration()
  for (const label of ["Email", "Password", "Confirm password"]) {
    fillRegistration({ [label]: "" })
    submitRegistration()
    expect(mocks.register).not.toHaveBeenCalled()
    expect(screen.getByLabelText(label, { exact: true })).toBeInvalid()
  }
}, 15000)
