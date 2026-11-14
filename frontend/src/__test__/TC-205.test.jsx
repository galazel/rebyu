// TC-205: Upload-and-learn placeholder
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
vi.mock("@/pages/learner/workspace/document-reader.jsx", () => ({
  DocumentReader: () => null,
}))
import { TestTutorPanel } from "@/pages/learner/workspace/upload-and-learn-page.jsx"

test("TC-205: Upload-and-learn placeholder", async (context) => {
  vi.useFakeTimers()
  render(<TestTutorPanel fileName="notes.txt" />)
  fireEvent.change(screen.getByLabelText("Message the AI tutor"), {
    target: { value: "Explain this document" },
  })
  fireEvent.click(screen.getByRole("button", { name: "Send message" }))
  await act(() => vi.advanceTimersByTimeAsync(600))
  expect(
    screen.getByText(/this screen is the interface only/)
  ).toBeInTheDocument()
  expect(request).not.toHaveBeenCalled()
}, 15000)
