// TC-005: Password minimum boundary
import { test, expect } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import {
  registration,
  fillRegistration,
  submitRegistration,
  mocks,
} from "./support/registration.jsx"
import { deferred } from "./support/ui.jsx"

test("TC-005: Password minimum boundary", async (context) => {
  registration()
  fillRegistration()
  submitRegistration()
  await waitFor(() => expect(mocks.register).toHaveBeenCalledTimes(1))
}, 15000)
