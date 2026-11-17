// TC-210: Skim cooldown load failure
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect } from "vitest"
import { screen } from "@testing-library/react"
import { guard, renderGuardCard } from "./support/reading-guard.jsx"

test("TC-210: Skim cooldown load failure", async () => {
  guard.get.mockRejectedValue({})
  await renderGuardCard()

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Skim challenge settings could not be loaded."
  )
  expect(screen.queryByLabelText(/Cooldown \(minutes\)/)).not.toBeInTheDocument()
  expect(guard.put).not.toHaveBeenCalled()
})
