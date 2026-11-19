// TC-223: Problem-solving answer round-trip
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect } from "vitest"
import {
  decodeProblemSolvingAnswer,
  encodeProblemSolvingAnswer,
  looksLikeWorkedAnswer,
} from "@/lib/problem-solving-answer.js"

// The editor round-trips through these on EVERY keystroke. The first version
// trimmed trailing whitespace, which quietly ate the space bar: "a" + " " came
// back as "a", so a learner could not type a space in their working.
test("TC-223: encoding a problem-solving answer never edits what was typed", () => {
  const cases = [
    { working: "", finalAnswer: "" },
    { working: "a ", finalAnswer: "" },
    { working: "\\(V = I \\times R\\) ", finalAnswer: "\\(\\pu{12 V}\\)" },
    { working: "step one\n\nstep two  ", finalAnswer: "42" },
    { working: "", finalAnswer: "42" },
    { working: "  leading and trailing  ", finalAnswer: " 12 V " },
    // Working that itself mentions a final answer must not confuse the split.
    { working: "Final answer: not this one", finalAnswer: "this one" },
  ]

  for (const original of cases) {
    const decoded = decodeProblemSolvingAnswer(encodeProblemSolvingAnswer(original))
    expect(decoded, JSON.stringify(original)).toEqual(original)
  }
})

test("TC-223: a blank answer encodes to nothing, and plain text decodes as working", () => {
  expect(encodeProblemSolvingAnswer()).toBe("")
  expect(encodeProblemSolvingAnswer({ working: "   ", finalAnswer: "" })).toBe("")

  // An answer written before this type existed is all working, not a lost one.
  expect(decodeProblemSolvingAnswer("just some prose")).toEqual({
    working: "just some prose",
    finalAnswer: "",
  })
  expect(decodeProblemSolvingAnswer(null)).toEqual({ working: "", finalAnswer: "" })
})

test("TC-223: worked answers are recognised without their question type", () => {
  expect(looksLikeWorkedAnswer("\\(E = mc^2\\)")).toBe(true)
  expect(looksLikeWorkedAnswer("Final answer: 12 V")).toBe(true)
  expect(looksLikeWorkedAnswer("A normal written answer about normalisation.")).toBe(false)
  expect(looksLikeWorkedAnswer("")).toBe(false)
})
