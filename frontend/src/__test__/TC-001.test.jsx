// TC-001: Signup validation
import { test, expect } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import {
  registration,
  fillRegistration,
  submitRegistration,
  mocks,
} from "./support/registration.jsx"
import { deferred } from "./support/ui.jsx"

test("TC-001: Signup validation", async (context) => {
  registration()
  fillRegistration()
  submitRegistration()
  await waitFor(() =>
    expect(mocks.register).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "ivan@example.test",
        password: "Abcdef1!",
      })
    )
  )
  await waitFor(() =>
    expect(mocks.navigate).toHaveBeenCalledWith("/verify-email", {
      state: { email: "ivan@example.test" },
    })
  )
}, 15000)
