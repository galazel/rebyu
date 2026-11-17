// TC-208: Skim cooldown save
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import { guard, renderGuardCard } from "./support/reading-guard.jsx"

test("TC-208: Skim cooldown save", async () => {
  guard.get.mockResolvedValue({ skimCooldownSeconds: 180 })
  guard.put.mockResolvedValue({ skimCooldownSeconds: 300 })
  await renderGuardCard()

  const input = await screen.findByLabelText(/Cooldown \(minutes\)/)
  fireEvent.change(input, { target: { value: "5" } })
  fireEvent.click(screen.getByRole("button", { name: "Save skim cooldown" }))

  await waitFor(() => expect(guard.put).toHaveBeenCalledTimes(1))
  expect(guard.put.mock.calls[0][0]).toEqual({ skimCooldownSeconds: 300 })
  await waitFor(() =>
    expect(guard.toast.success).toHaveBeenCalledWith(
      "Skim challenge cooldown saved."
    )
  )
})
