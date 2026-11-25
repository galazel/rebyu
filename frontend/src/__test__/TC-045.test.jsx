// TC-045: Knowledge-check feedback
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import {
  render,
  screen,
  fireEvent,
} from "@testing-library/react"
import { wrapper } from "./support/ui.jsx"
import { request } from "./support/services.js"
vi.mock("@/components/learner/xp-award-modal.jsx", () => ({
  announceRewards: vi.fn(),
  snapshotRewards: vi.fn(),
}))
import { LessonKnowledgeCheck, testLocalVerdict } from "@/components/learner/lesson-knowledge-check.jsx"

vi.mock("@/lib/sound.js", () => ({ playCorrectMark: vi.fn(), playWrongMark: vi.fn() }))
vi.mock("@/components/assessments/attempt/programming-question-layout.jsx", () => ({
  default: ({ onAnswer }) => <button onClick={() => onAnswer({ submittedCode: "print(7)", programmingLanguage: "Python" })}>Enter code</button>,
}))
vi.mock("@/components/assessments/attempt/diagram-question-layout.jsx", () => ({
  default: ({ onAnswer }) => <button onClick={() => onAnswer({ diagramSubmissionData: "<mxGraphModel/>" })}>Draw diagram</button>,
}))

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

test("records mixed adaptive answers and reviews the graded submissions", async () => {
  const items = [
    { questionType: "MULTIPLE_ANSWER", questionImageKey: "/prompt.png", selectCount: 2, choices: [{ choiceId: 5, choiceText: "DNS", imageKey: "/choice.png" }, { choiceId: 6, choiceText: "HTTP" }] },
    { questionType: "DESCRIPTIVE" },
    { questionType: "PROGRAMMING" },
    { questionType: "CRITICAL_THINKING", criticalThinkingType: "DIAGRAM" },
    { questionType: "SHORT_ANSWER", subQuestions: [{ subQuestionId: 9, questionText: "Protocol", questionImageKey: "/sub-question.png" }] },
  ].map((item, i) => ({ ...item, question: `Prompt ${i + 1}`, displayOrder: i + 1, attemptQuestionId: i + 1 }))
  const recorded = []
  request.mockImplementation(async (path, options) => {
    if (path.endsWith("/adaptive/answers")) {
      const [draft] = options.data.answers
      recorded.push(draft)
      return { verdicts: { [draft.attemptQuestionId]: { isCorrect: true, credit: 1 } }, next: items[recorded.length], completed: recorded.length === items.length }
    }
    if (path.endsWith("/submit")) {
      expect(options.data.answers).toEqual([])
      return {
        correctCount: 3, pendingCount: 1, answers: items.map((item, i) => ({
          ...item, ...recorded[i], isCorrect: i !== 1, credit: i === 1 ? 0.5 : 1,
          pendingManualEvaluation: i === 3, diagramSubmitted: i === 3,
          subQuestionAnswers: i === 4 ? [{ subQuestionId: 9, questionText: "Protocol", learnerAnswer: "TCP" }] : [],
        })),
      }
    }
    throw new Error(`Unexpected request ${path}`)
  })
  render(<LessonKnowledgeCheck open learnerId={7} attempt={{
    assessmentAttemptId: 40, adaptive: { total: 5 }, questions: items.slice(0, 1),
  }} />, { wrapper })
  fireEvent.click(screen.getByText("Start focus check"))
  expect(screen.getByAltText("Question reference")).toHaveAttribute("src", "/prompt.png")
  async function checkAndAdvance(last = false) {
    fireEvent.click(screen.getByRole("button", { name: "Check" }))
    fireEvent.click(await screen.findByRole("button", { name: last ? "See my score" : "Next" }))
  }
  fireEvent.click(screen.getByRole("checkbox", { name: "Choice A" }))
  expect(screen.getByRole("button", { name: "Check" })).toBeDisabled()
  fireEvent.click(screen.getByRole("checkbox", { name: "Choice B" }))
  await checkAndAdvance()
  fireEvent.change(screen.getByLabelText("Your written answer"), { target: { value: "Layered design" } })
  await checkAndAdvance()
  fireEvent.click(await screen.findByText("Enter code"))
  await checkAndAdvance()
  fireEvent.click(await screen.findByText("Draw diagram"))
  await checkAndAdvance()
  expect(screen.getByAltText("Sub-question reference")).toHaveAttribute("src", "/sub-question.png")
  fireEvent.change(screen.getByLabelText("Protocol"), { target: { value: "TCP" } })
  await checkAndAdvance(true)
  expect(await screen.findByText("Challenge results")).toBeInTheDocument()
  expect(screen.getByAltText("Selected choice")).toHaveAttribute("src", "/choice.png")
  expect(screen.getByAltText("Sub-question reference")).toHaveAttribute("src", "/sub-question.png")
  expect(recorded[0].learnerAnswer).toBe("[5,6]")
  expect(recorded[1].learnerAnswer).toBe("Layered design")
  expect(recorded[2]).toMatchObject({ submittedCode: "print(7)", programmingLanguage: "Python" })
  expect(recorded[3].diagramSubmissionData).toBe("<mxGraphModel/>")
  expect(JSON.parse(recorded[4].learnerAnswer)).toEqual({ 9: "TCP" })
  for (const value of ["DNS", "HTTP", "Layered design", "print(7)", "Diagram submitted", "TCP", "Partial credit · 50%", "Awaiting review"]) {
    expect(screen.getByText(value)).toBeInTheDocument()
  }
})

test("submits a fixed problem-solving item with its working and displays its weighted score", async () => {
  const question = { attemptQuestionId: 3, questionType: "PROBLEM_SOLVING", question: "Find the sum" }
  request.mockImplementationOnce(async (_path, options) => {
    const answer = options.data.answers[0]
    expect(answer.learnerAnswer).toContain("2 + 2")
    expect(answer.learnerAnswer).toContain("Final answer: 4")
    return { percentage: 75, passed: true, correctCount: 1, answers: [{ ...question, ...answer, isCorrect: true, credit: 0.75 }] }
  })
  render(<LessonKnowledgeCheck open learnerId={7} itemCount={1}
    attempt={{ assessmentAttemptId: 42, questions: [question] }}
    answerKey={[{ acceptedAnswers: ["4"] }]} />, { wrapper })
  fireEvent.click(screen.getByText("Start focus check"))
  fireEvent.change(screen.getByLabelText("Your working"), { target: { value: "2 + 2" } })
  fireEvent.change(screen.getByLabelText("Final answer"), { target: { value: "4" } })
  fireEvent.click(screen.getByRole("button", { name: "See my score" }))
  expect(await screen.findByText("Challenge results")).toBeInTheDocument()
  expect(screen.getByLabelText("Final score")).toHaveTextContent("75%")
  expect(screen.getByText("Partial credit · 75%")).toBeInTheDocument()
})
