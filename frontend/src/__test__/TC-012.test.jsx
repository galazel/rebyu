// TC-012: Registration failure recovery
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

test("TC-012: Registration failure recovery", async (context) => {
  registration()
  mocks.register.mockRejectedValueOnce(new Error("Temporary failure"))
  fillRegistration()
  submitRegistration()
  expect(await screen.findByText("Temporary failure")).toBeInTheDocument()
  expect(screen.getByRole("button", { name: /Create account/i })).toBeEnabled()
  fillRegistration({ Email: "retry@example.test" })
  submitRegistration()
  await waitFor(() =>
    expect(mocks.navigate).toHaveBeenCalledWith("/verify-email", {
      state: { email: "retry@example.test" },
    })
  )
}, 15000)
