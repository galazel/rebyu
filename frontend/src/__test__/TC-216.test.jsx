// TC-216: Stage pass score met
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect } from "vitest"
import { screen } from "@testing-library/react"
import { renderStageResult } from "./support/stage-result.jsx"

test("TC-216: Stage pass score met", async () => {
  await renderStageResult({ percentage: 70, questionIndex: 0, totalProblems: 3 })

  expect(await screen.findByText("Stage cleared!")).toBeInTheDocument()
  expect(screen.getByText("Stage 2 is unlocked.")).toBeInTheDocument()
  const next = screen.getByRole("link", { name: /stage 2/i })
  expect(next).toHaveAttribute(
    "href",
    "/learner/assessments/5?q=1&total=3&arena=codestrike"
  )
})
