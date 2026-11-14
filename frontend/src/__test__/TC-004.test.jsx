// TC-004: Password composition
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

test("TC-004: Password composition", async (context) => {
  registration()
  for (const password of ["abcdef1!", "ABCDEF1!", "Abcdefg!", "Abcdef12"]) {
    fillRegistration({ Password: password, "Confirm password": password })
    submitRegistration()
    expect(mocks.register).not.toHaveBeenCalled()
    expect(screen.getByLabelText("Password", { exact: true })).toBeInvalid()
  }
}, 15000)
