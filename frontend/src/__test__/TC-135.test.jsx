// TC-135: PDF extraction
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Current PDF import uses AI page reading. This tests normalization of a mocked page-reader result, not a legacy local text parser or a live AI model.
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
import { wrapper, deferred } from "./support/ui.jsx"
import { request, toast } from "./support/services.js"
import { testReadWithAi } from "@/utils/pdf-question-extractor.js"

test("TC-135: PDF extraction", async (context) => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: vi.fn(),
  })
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
    "data:image/jpeg;base64,TEST"
  )
  const page = {
    num: 1,
    W: 100,
    H: 100,
    canvas: document.createElement("canvas"),
    items: [],
    lines: [],
  }
  const read = vi.fn(async () => ({
    questions: [
      {
        id: "1",
        stem: "2+2?",
        options: [
          { key: "A", text: "3" },
          { key: "B", text: "4" },
        ],
        answer: "B",
      },
    ],
  }))
  const result = await testReadWithAi([page], read)
  expect(result.questions).toHaveLength(1)
  expect(result.questions[0]).toMatchObject({
    num: "1",
    stem: "2+2?",
    answer: "B",
  })
  expect(result.questions[0].options.map((x) => x.text)).toEqual(["3", "4"])
}, 15000)
