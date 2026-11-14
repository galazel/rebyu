// TC-112: Conduct lock
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { request, toast } from "./support/services.js"
import { wrapper } from "./support/ui.jsx"
import { announceConduct, useTutorConduct } from "@/lib/tutor-conduct.js"

test("TC-112: Conduct lock", async (context) => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2026-11-12T00:00:00Z"))
  const { result } = renderHook(() => useTutorConduct())
  act(() => announceConduct({ lockedUntil: "2026-11-12T01:00:00Z" }))
  expect(result.current.locked).toBe(true)
  expect(result.current.notice.level).toBe("locked")
  act(() => vi.advanceTimersByTime(3600001))
  expect(result.current.locked).toBe(false)
}, 15000)
