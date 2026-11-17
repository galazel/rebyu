// TC-209: Skim cooldown save failure
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import { guard, renderGuardCard } from "./support/reading-guard.jsx"

test("TC-209: Skim cooldown save failure", async () => {
  guard.get.mockResolvedValue({ skimCooldownSeconds: 180 })
  guard.put.mockRejectedValue({
    response: { data: { message: "Cooldown is out of range." } },
  })
  await renderGuardCard()

  const input = await screen.findByLabelText(/Cooldown \(minutes\)/)
  fireEvent.change(input, { target: { value: "30" } })
  fireEvent.click(screen.getByRole("button", { name: "Save skim cooldown" }))

  await waitFor(() =>
    expect(guard.toast.error).toHaveBeenCalledWith("Cooldown is out of range.")
  )
  expect(guard.toast.success).not.toHaveBeenCalled()
  // The edited value stays in the field so the admin can correct it.
  expect(screen.getByLabelText(/Cooldown \(minutes\)/)).toHaveValue(30)
})
