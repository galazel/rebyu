// TC-217: Stage pass score missed
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect } from "vitest"
import { screen } from "@testing-library/react"
import { renderStageResult } from "./support/stage-result.jsx"

test("TC-217: Stage pass score missed", async () => {
  await renderStageResult({ percentage: 69, questionIndex: 0, totalProblems: 3 })

  expect(await screen.findByText("Stage handed in")).toBeInTheDocument()
  expect(
    screen.getByText("Score at least 70% to clear this stage and unlock stage 2.")
  ).toBeInTheDocument()
  expect(screen.queryByRole("link", { name: /stage 2/i })).not.toBeInTheDocument()
  expect(screen.getByRole("link", { name: "back to stages" })).toBeInTheDocument()
})
