// TC-100: Tutor answer success
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

test("TC-100: Tutor answer success", async (context) => {
  await renderTutor()
  const input = await screen.findByLabelText("Message your tutor")
  await waitFor(() => expect(input).not.toBeDisabled())
  request.mockImplementation((endpoint) =>
    Promise.resolve(
      endpoint === "ai/tutor" ? { response: "A network connects devices." } : {}
    )
  )
  vi.mocked(fetch).mockRejectedValue(new Error("Streaming unavailable"))
  fireEvent.change(input, { target: { value: "What is a network?" } })
  fireEvent.click(screen.getByRole("button", { name: "Send message" }))
  expect(
    await screen.findByText("A network connects devices.")
  ).toBeInTheDocument()
  fireEvent.change(input, { target: { value: "Another question" } })
  expect(
    screen.getByRole("button", { name: "Send message" })
  ).not.toBeDisabled()

  fireEvent.keyDown(screen.getByRole("button", { name: "Create study aid" }), {
    key: "ArrowDown",
  })
  expect(await screen.findByRole("menuitem", { name: /Practice & games/ })).toBeInTheDocument()
  expect(screen.getByRole("menuitem", { name: /Guided dialogue/ })).toBeInTheDocument()
  expect(screen.queryByRole("menuitem", { name: /Live tutor/ })).not.toBeInTheDocument()
}, 15000)
