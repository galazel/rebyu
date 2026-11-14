// TC-106: Repeated progress event
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { request, toast } from "./support/services.js"
import { wrapper } from "./support/ui.jsx"
import {
  widgetProgressKey,
  writeWidgetField,
  readWidgetField,
} from "@/lib/tutor-widget-progress.js"

test("TC-106: Repeated progress event", async (context) => {
  vi.useFakeTimers()
  const widget = { type: "quiz", questions: [] }
  const key = widgetProgressKey("lesson:7", widget)
  const duplicateKey = widgetProgressKey("library:8", {
    ...widget,
    library: { id: 8 },
  })
  expect(duplicateKey).toBe(key)
  writeWidgetField(key, "answers", { 0: 1 })
  writeWidgetField(duplicateKey, "answers", { 0: 1 })
  expect(readWidgetField(key, "answers", {})).toEqual({ 0: 1 })
  expect(localStorage.length).toBe(1)
  request.mockResolvedValue({})
  await vi.advanceTimersByTimeAsync(701)
  expect(request).toHaveBeenCalledTimes(1)
}, 15000)
