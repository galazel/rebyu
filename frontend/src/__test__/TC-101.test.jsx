// TC-101: Blank tutor message
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
import { request, toast } from "./support/services.js"
import { wrapper, deferred } from "./support/ui.jsx"
import { renderTutor } from "./support/tutor.jsx"

test("TC-101: Blank tutor message", async (context) => {
  await renderTutor()
  const input = await screen.findByLabelText("Message your tutor")
  await waitFor(() => expect(input).not.toBeDisabled())
  request.mockClear()
  fireEvent.change(input, { target: { value: "   " } })
  fireEvent.submit(input.closest("form"))
  expect(request).not.toHaveBeenCalled()
  expect(fetch).not.toHaveBeenCalled()
}, 15000)
