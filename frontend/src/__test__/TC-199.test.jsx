// TC-199: Date-range filter
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { request, toast } from "./support/services.js"
import { wrapper } from "./support/ui.jsx"
import { useDateRange } from "@/hooks/use-date-range.js"

test("TC-199: Date-range filter", async (context) => {
  const { result } = renderHook(() =>
    useDateRange("weekly", new Date(2026, 10, 12, 12))
  )
  expect(result.current.from).toEqual(new Date(2026, 10, 9, 0, 0, 0, 0))
  expect(result.current.to).toEqual(new Date(2026, 10, 15, 23, 59, 59, 999))
}, 15000)
