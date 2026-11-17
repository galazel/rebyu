// TC-219: Final stage and grading state
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect } from "vitest"
import { screen } from "@testing-library/react"
import { renderStageResult } from "./support/stage-result.jsx"

test("TC-219: Final stage and grading state", async () => {
  // A stage still being graded is never cleared, whatever percentage it carries.
  const first = await renderStageResult({
    percentage: 100,
    marking: true,
    questionIndex: 0,
    totalProblems: 3,
  })
  expect(await screen.findByText("Checking your work…")).toBeInTheDocument()
  expect(screen.queryByRole("link", { name: /stage 2/i })).not.toBeInTheDocument()
  first.unmount()

  // The last stage, once passed, has no next stage to open.
  await renderStageResult({ percentage: 90, questionIndex: 2, totalProblems: 3 })
  expect(await screen.findByText("Stage cleared!")).toBeInTheDocument()
  expect(
    screen.getByText("That was the last stage. Every stage is open to replay.")
  ).toBeInTheDocument()
  expect(screen.queryByRole("link", { name: /stage 4/i })).not.toBeInTheDocument()
})
