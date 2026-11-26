import { describe, expect, it } from "vitest"
import { skimQuestionFormat } from "@/components/learner/skim-question-format.js"

describe("skim question workspace", () => {
  it("opens the diagram canvas for an older ERD attempt snapshot", () => {
    expect(skimQuestionFormat({
      questionType: "CRITICAL_THINKING",
      question: "[Node 1, Problem 1] Draw an ERD for a student enrollment system with Student, Course, and Enrollment entities.",
    })).toBe("DIAGRAM")
  })

  it("keeps configured programming and diagram questions", () => {
    expect(skimQuestionFormat({ questionType: "CRITICAL_THINKING", criticalThinkingType: "PROGRAMMING" })).toBe("PROGRAMMING")
    expect(skimQuestionFormat({ questionType: "DIAGRAM" })).toBe("DIAGRAM")
  })

  it("keeps ordinary written critical thinking questions as text", () => {
    expect(skimQuestionFormat({ questionType: "CRITICAL_THINKING", question: "Explain your decision." })).toBe("CRITICAL_THINKING")
  })
})
