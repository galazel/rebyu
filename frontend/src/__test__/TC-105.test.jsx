// TC-105: Split stream chunks
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
import { renderTutor } from "./support/tutor.jsx"

test("TC-105: Split stream chunks", async (context) => {
  const { testStreamTutorAnswer } =
    await import("@/components/learner/lesson-ai-tutor.jsx")
  const chunks = [
    'event: delta\ndata: {"text":"Hel',
    'lo","type":"delta"}\n\nevent: done\ndata: {"type":"done"}\n\n',
  ]
  const read = vi.fn()
  for (const text of chunks)
    read.mockResolvedValueOnce({
      done: false,
      value: new TextEncoder().encode(text),
    })
  read.mockResolvedValue({ done: true })
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    status: 200,
    body: { getReader: () => ({ read }) },
  })
  const entry = {
    text: "",
    controller: new AbortController(),
    onDelta: vi.fn(),
  }
  const result = await testStreamTutorAnswer({ message: "Hi" }, entry)
  expect(result.text).toBe("Hello")
  expect(entry.onDelta).toHaveBeenCalledOnce()
}, 15000)
