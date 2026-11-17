// TC-222: Stage clock warning at start
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import { render, screen, act } from "@testing-library/react"
import { wrapper } from "./support/ui.jsx"
import { assessment } from "./support/attempt.jsx"

const toast = vi.hoisted(() => ({
  warning: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
  info: vi.fn(),
}))
vi.mock("sonner", () => ({ toast }))
vi.mock("@/hooks/use-attempt-integrity.js", () => ({
  useAttemptIntegrity: () => ({
    paused: false,
    violations: 0,
    maxViolations: 3,
    resuming: false,
  }),
}))

// Only the interval and clock are faked so promises and waitFor keep working.
const FAKE = { toFake: ["setInterval", "clearInterval", "Date"] }

async function renderWithClock(secondsLeft) {
  assessment.start.mockResolvedValue({
    assessmentAttemptId: 77,
    assessmentType: "GENERATED_QUIZ",
    expiresAt: new Date(Date.now() + secondsLeft * 1000).toISOString(),
    questions: [
      { attemptQuestionId: 1, questionType: "MULTIPLE_CHOICE", choices: [] },
      { attemptQuestionId: 2, questionType: "MULTIPLE_CHOICE", choices: [] },
    ],
  })
  const { default: Page } =
    await import("@/pages/learner/assessments/learner-assessment-attempt-page.jsx")
  const view = render(<Page />, { wrapper })
  await screen.findByRole("button", { name: "Answer first" })
  return view
}
const advance = (seconds) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(seconds * 1000)
  })

test("TC-222: Stage clock warning at start", async () => {
  // A 10-minute stage reads 10:01 and then 10:00 a second later (clock skew).
  // That is not "running low", so no 10-minute warning is raised.
  vi.useFakeTimers(FAKE)
  const view = await renderWithClock(601)
  await advance(5)
  expect(toast.warning).not.toHaveBeenCalled()
  view.unmount()

  // Control: a 15-minute sitting that really counts down past 10:00 still warns once.
  vi.useFakeTimers(FAKE)
  await renderWithClock(900)
  await advance(301)
  expect(toast.warning).toHaveBeenCalledTimes(1)
  expect(toast.warning).toHaveBeenCalledWith("10 minutes remaining.")
})
