// TC-104: Turn cancellation
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Covers cancellation in the live-teaching controller; streamed chat cancellation is a separate transport path.
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

test("TC-104: Turn cancellation", async (context) => {
  vi.useFakeTimers()
  const pending = deferred()
  const controller = new LiveTeachingController({
    request: () => pending.promise,
  })
  controller.start()
  controller.pending = false
  controller.dispatch("continue")
  controller.stop()
  pending.reject(new Error("late failure"))
  await Promise.resolve()
  await vi.advanceTimersByTimeAsync(31000)
  expect(controller.active).toBe(false)
  expect(controller.state.phase).not.toBe("ERROR")
  controller.dispose()
}, 15000)
