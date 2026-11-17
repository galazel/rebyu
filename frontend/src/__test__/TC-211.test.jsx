// TC-211: Skim challenge cooldown
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { skim, arrangeSkim, cooldownKey } from "./support/skim.jsx"
import { useSkimChallenge } from "@/hooks/useSkimChallenge.js"

test("TC-211: Skim challenge cooldown", async () => {
  arrangeSkim()
  const { result, rerender } = renderHook(
    ({ lessonId }) =>
      useSkimChallenge({ learnerId: 11, lessonId, enabled: true }),
    { initialProps: { lessonId: 1 } }
  )

  act(() => result.current.trigger())
  await waitFor(() => expect(result.current.offer).not.toBeNull())
  expect(skim.create).toHaveBeenCalledTimes(1)
  expect(localStorage.getItem(cooldownKey(11))).not.toBeNull()

  // A different lesson, skimmed straight after, stays quiet during the cooldown.
  rerender({ lessonId: 2 })
  act(() => result.current.trigger())
  expect(skim.create).toHaveBeenCalledTimes(1)
  expect(result.current.warningOpen).toBe(false)
})
