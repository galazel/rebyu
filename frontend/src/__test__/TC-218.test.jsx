// TC-218: Custom stage pass score
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import { renderStageResult, stage } from "./support/stage-result.jsx"

test("TC-218: Custom stage pass score", async () => {
  // The admin raised the pass mark to 80%, so 75% no longer clears the stage.
  await renderStageResult({
    percentage: 75,
    passScore: 80,
    questionIndex: 0,
    totalProblems: 3,
  })

  await waitFor(() => expect(stage.arenas).toHaveBeenCalled())
  expect(
    await screen.findByText(/Score at least 80% to clear this stage/)
  ).toBeInTheDocument()
  expect(screen.queryByRole("link", { name: /stage 2/i })).not.toBeInTheDocument()
})
