// TC-136: PDF empty content
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Tests empty normalized page-reader output; the outer readExamPdf function separately rejects papers with no questions or answers.
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

test("TC-136: PDF empty content", async (context) => {
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
  const result = await testReadWithAi(
    [page],
    vi.fn(async () => ({ questions: [], answers: {} }))
  )
  expect(result.questions).toEqual([])
  expect(result.answers).toEqual({})
}, 15000)
