// TC-103: Stale streamed turn
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  renderHook,
} from "@testing-library/react"
import { request, toast } from "./support/services.js"
import { wrapper, deferred } from "./support/ui.jsx"
import { LiveTeachingController } from "@/lib/live-teaching-controller.js"

test("TC-103: Stale streamed turn", async (context) => {
  vi.useFakeTimers()
  const pending = deferred()
  const controller = new LiveTeachingController({
    request: () => pending.promise,
  })
  controller.start()
  controller.pending = false
  controller.dispatch("first")
  controller.cancelPending(false)
  controller.studentMessage("newer answer")
  pending.reject(new Error("old request failed"))
  await Promise.resolve()
  expect(controller.state.phase).toBe("EVALUATING_ANSWER")
  expect(controller.active).toBe(true)
  controller.dispose()
}, 15000)
