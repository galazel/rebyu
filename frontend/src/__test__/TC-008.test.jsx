// TC-008: Institution reference format
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

test("TC-008: Institution reference format", async (context) => {
  registration("institution")
  fireEvent.change(screen.getByLabelText("Partnership reference number"), {
    target: { value: "bad-ref" },
  })
  expect(mocks.lookup).not.toHaveBeenCalled()
}, 15000)
