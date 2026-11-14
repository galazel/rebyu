// TC-102: Tutor request failure
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

test("TC-102: Tutor request failure", async (context) => {
  await renderTutor()
  const input = await screen.findByLabelText("Message your tutor")
  await waitFor(() => expect(input).not.toBeDisabled())
  request.mockImplementation((endpoint) =>
    endpoint === "ai/tutor"
      ? Promise.reject(new Error("Tutor unavailable"))
      : Promise.resolve({})
  )
  vi.mocked(fetch).mockRejectedValue(new Error("Streaming unavailable"))
  fireEvent.change(input, { target: { value: "Explain networking" } })
  fireEvent.click(screen.getByRole("button", { name: "Send message" }))
  expect(await screen.findByText(/Tutor unavailable/)).toBeInTheDocument()
  fireEvent.change(input, { target: { value: "Another question" } })
  expect(
    screen.getByRole("button", { name: "Send message" })
  ).not.toBeDisabled()
}, 15000)
