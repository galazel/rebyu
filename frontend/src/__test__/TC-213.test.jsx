// TC-213: Forced skim challenge during cooldown
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { skim, arrangeSkim, cooldownKey } from "./support/skim.jsx"
import { useSkimChallenge } from "@/hooks/useSkimChallenge.js"

test("TC-213: Forced skim challenge during cooldown", async () => {
  arrangeSkim()
  localStorage.setItem(cooldownKey(13), String(Date.now()))
  const { result } = renderHook(() =>
    useSkimChallenge({ learnerId: 13, lessonId: 4, enabled: true })
  )

  act(() => result.current.trigger())
  expect(skim.create).not.toHaveBeenCalled()

  act(() => result.current.trigger({ force: true }))
  await waitFor(() => expect(result.current.offer).not.toBeNull())
  expect(skim.create).toHaveBeenCalledTimes(1)
})
