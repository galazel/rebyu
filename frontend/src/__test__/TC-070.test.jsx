// TC-070: Submit pending state
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  renderHook,
} from "@testing-library/react"
import { wrapper, deferred } from "./support/ui.jsx"
import { request, toast } from "./support/services.js"
import { renderAttempt, assessment } from "./support/attempt.jsx"

test("TC-070: Submit pending state", async (context) => {
  const pending = deferred()
  assessment.submit.mockReturnValue(pending.promise)
  await renderAttempt()
  fireEvent.click(await screen.findByRole("button", { name: "Finish test" }))
  expect(await screen.findByText("Grading pending")).toBeInTheDocument()
  expect(
    screen.queryByRole("button", { name: "Finish test" })
  ).not.toBeInTheDocument()
  expect(assessment.submit).toHaveBeenCalledTimes(1)
  pending.reject(new Error("Rejected for cleanup"))
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Finish test" })
    ).toBeInTheDocument()
  )
}, 15000)
