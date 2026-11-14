// TC-007: Duplicate email handling
import { test, expect } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import {
  registration,
  fillRegistration,
  submitRegistration,
  mocks,
} from "./support/registration.jsx"
import { deferred } from "./support/ui.jsx"

test("TC-007: Duplicate email handling", async (context) => {
  registration()
  mocks.register.mockRejectedValueOnce(
    new Error("This email may already be registered.")
  )
  fillRegistration()
  submitRegistration()
  expect(await screen.findByText(/already be registered/)).toBeInTheDocument()
  expect(screen.getByRole("button", { name: /Create account/i })).toBeEnabled()
  expect(mocks.navigate).not.toHaveBeenCalled()
}, 15000)
