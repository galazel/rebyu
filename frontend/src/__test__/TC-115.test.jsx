// TC-115: Game completion scoring
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
import { TutorStudyWidget } from "@/components/learner/tutor-study-widget.jsx"

test("TC-115: Game completion scoring", async (context) => {
  render(
    <TutorStudyWidget
      data={{
        type: "quiz",
        title: "Addition",
        questions: [{ question: "2+2?", options: ["3", "4"], correctIndex: 1 }],
      }}
    />,
    { wrapper }
  )
  fireEvent.click(screen.getByRole("button", { name: /B.*4/ }))
  expect(screen.getByText("Correct!")).toBeInTheDocument()
  fireEvent.click(screen.getByRole("button", { name: "See results" }))
  expect(screen.getByText(/1\s*\/\s*1/)).toBeInTheDocument()
}, 15000)
