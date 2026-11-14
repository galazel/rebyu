// TC-003: Password length
import { test, expect } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import {
  registration,
  fillRegistration,
  submitRegistration,
  mocks,
} from "./support/registration.jsx"
import { deferred } from "./support/ui.jsx"

test("TC-003: Password length", async (context) => {
  registration()
  fillRegistration({ Password: "Abcd1!x", "Confirm password": "Abcd1!x" })
  submitRegistration()
  expect(mocks.register).not.toHaveBeenCalled()
  expect(screen.getByLabelText("Password", { exact: true })).toBeInvalid()
}, 15000)
