// TC-212: Skim challenge after cooldown
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { skim, arrangeSkim, cooldownKey } from "./support/skim.jsx"
import { useSkimChallenge } from "@/hooks/useSkimChallenge.js"

test("TC-212: Skim challenge after cooldown", async () => {
  arrangeSkim()
  // The last reminder was shown ten minutes ago; the 3-minute default has passed.
  localStorage.setItem(cooldownKey(12), String(Date.now() - 10 * 60 * 1000))
  const { result } = renderHook(() =>
    useSkimChallenge({ learnerId: 12, lessonId: 3, enabled: true })
  )

  act(() => result.current.trigger())
  await waitFor(() => expect(result.current.offer).not.toBeNull())
  expect(skim.create).toHaveBeenCalledWith(3, { currentLessonOnly: true })
  expect(skim.start).toHaveBeenCalledTimes(1)
  expect(
    Date.now() - Number(localStorage.getItem(cooldownKey(12)))
  ).toBeLessThan(5000)
})
