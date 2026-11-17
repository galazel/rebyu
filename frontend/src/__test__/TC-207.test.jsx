// TC-207: Skim cooldown display
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect } from "vitest"
import { screen } from "@testing-library/react"
import { guard, renderGuardCard } from "./support/reading-guard.jsx"

test("TC-207: Skim cooldown display", async () => {
  guard.get.mockResolvedValue({
    skimCooldownSeconds: 180,
    updatedAt: "2026-11-14T08:00:00Z",
    updatedBy: "admin@example.test",
  })
  await renderGuardCard()

  const input = await screen.findByLabelText(/Cooldown \(minutes\)/)
  expect(input).toHaveValue(3)
  expect(screen.getByText(/by admin@example.test/)).toBeInTheDocument()
  expect(
    screen.getByRole("button", { name: "Save skim cooldown" })
  ).toBeDisabled()
})
