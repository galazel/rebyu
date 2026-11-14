// TC-099: Saved widget progress
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { request, toast } from "./support/services.js"
import { wrapper } from "./support/ui.jsx"
import {
  readWidgetField,
  widgetProgressKey,
} from "@/lib/tutor-widget-progress.js"

test("TC-099: Saved widget progress", async (context) => {
  const widget = {
    type: "quiz",
    questions: [{ question: "2+2?", options: ["3", "4"], correctIndex: 1 }],
  }
  const key = widgetProgressKey("lesson:7", widget)
  localStorage.setItem(
    key,
    JSON.stringify({ answers: { 0: 1 }, finished: true })
  )
  expect(readWidgetField(key, "answers", {})).toEqual({ 0: 1 })
  expect(readWidgetField(key, "finished", false)).toBe(true)
  expect(request).not.toHaveBeenCalled()
}, 15000)
