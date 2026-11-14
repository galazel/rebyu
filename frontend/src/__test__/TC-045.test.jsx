// TC-045: Knowledge-check feedback
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
import { wrapper, deferred } from "./support/ui.jsx"
import { request, toast } from "./support/services.js"
vi.mock("@/components/learner/xp-award-modal.jsx", () => ({
  announceRewards: vi.fn(),
  snapshotRewards: vi.fn(),
}))
import { testLocalVerdict } from "@/components/learner/lesson-knowledge-check.jsx"

test("TC-045: Knowledge-check feedback", async (context) => {
  expect(
    testLocalVerdict(
      { questionType: "MULTIPLE_CHOICE" },
      { selectedChoiceId: 2 },
      { correctChoiceId: 2, correctChoiceText: "Router" }
    )
  ).toMatchObject({ correct: true, expected: "Router" })
  expect(
    testLocalVerdict(
      { questionType: "MULTIPLE_CHOICE" },
      { selectedChoiceId: 1 },
      { correctChoiceId: 2, correctChoiceText: "Router" }
    )
  ).toMatchObject({ correct: false, expected: "Router" })
}, 15000)
