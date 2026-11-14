// TC-145: Generation timeline
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
vi.mock("@/services/aiWorkflowService", () => ({
  streamWorkflow: (id, options) => {
    request(id, options)
    return () => {}
  },
}))
import { useWorkflowStream } from "@/hooks/useWorkflowStream.js"

test("TC-145: Generation timeline", async (context) => {
  const { result } = renderHook(() => useWorkflowStream("run-1"))
  const callbacks = request.mock.calls[0][1]
  act(() =>
    callbacks.onMessage({
      type: "snapshot",
      run: { status: "RUNNING" },
      events: [],
    })
  )
  act(() =>
    callbacks.onMessage({
      type: "event",
      event: { seq: 2, stage: "lesson", event_type: "node.completed" },
    })
  )
  act(() =>
    callbacks.onMessage({
      type: "event",
      event: { seq: 1, stage: "lesson", event_type: "node.started" },
    })
  )
  expect(result.current.lastSeq).toBe(2)
  expect(result.current.events).toHaveLength(1)
  expect(result.current.events[0].event_type).toBe("node.completed")
}, 15000)
