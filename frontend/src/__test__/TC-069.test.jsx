// TC-069: Unsaved answer state
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

test("TC-069: Unsaved answer state", async (context) => {
  await renderAttempt()
  fireEvent.click(await screen.findByRole("button", { name: "Answer first" }))
  fireEvent.click(screen.getByRole("button", { name: "Answer second" }))
  expect(JSON.parse(screen.getByTestId("answers").textContent)).toEqual({
    1: { selectedChoiceId: 11 },
    2: { selectedChoiceId: 22 },
  })
  await waitFor(() => expect(assessment.save).toHaveBeenCalled(), {
    timeout: 2500,
  })
  expect(assessment.save).toHaveBeenCalledWith(77, 9, [
    expect.objectContaining({ attemptQuestionId: 1, selectedChoiceId: 11 }),
    expect.objectContaining({ attemptQuestionId: 2, selectedChoiceId: 22 }),
  ])
}, 15000)
