// TC-214: Slow-down reminder cooldown
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { skim, arrangeSkim, cooldownKey } from "./support/skim.jsx"
import { useSkimChallenge } from "@/hooks/useSkimChallenge.js"

test("TC-214: Slow-down reminder cooldown", async () => {
  arrangeSkim()
  const { result } = renderHook(() =>
    useSkimChallenge({ learnerId: 14, lessonId: 5, enabled: true })
  )
  act(() => result.current.trigger())
  await waitFor(() => expect(result.current.offer).not.toBeNull())

  // The cooldown has lapsed; skimming the same lesson again shows the reminder
  // (not a second challenge) and restarts the cooldown.
  localStorage.setItem(cooldownKey(14), String(Date.now() - 10 * 60 * 1000))
  act(() => result.current.trigger())
  expect(result.current.warningOpen).toBe(true)
  expect(skim.create).toHaveBeenCalledTimes(1)
  expect(
    Date.now() - Number(localStorage.getItem(cooldownKey(14)))
  ).toBeLessThan(5000)

  // Dismissed, the reminder stays quiet while the cooldown runs.
  act(() => result.current.dismissWarning())
  act(() => result.current.trigger())
  expect(result.current.warningOpen).toBe(false)
})
