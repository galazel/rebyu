import React from "react"
import { vi } from "vitest"
import { render } from "@testing-library/react"
import { wrapper } from "./ui.jsx"
const assessment = vi.hoisted(() => ({
  start: vi.fn(),
  save: vi.fn(async () => ({})),
  submit: vi.fn(),
}))
export { assessment }
vi.mock("react-router-dom", async (original) => ({
  ...(await original()),
  useParams: () => ({ examId: "5" }),
}))
vi.mock("@/services/assessmentService.js", () => ({
  startAssessmentAttempt: assessment.start,
  autosaveAttemptAnswers: assessment.save,
  submitAssessmentAttempt: assessment.submit,
  checkChoiceAnswer: vi.fn(),
  getAssessmentTypeLabel: () => "Quiz",
  setAttemptCurrentItem: vi.fn(async () => {}),
  setAttemptFlag: vi.fn(),
  setAttemptSkip: vi.fn(),
}))
vi.mock("@/services/learnerService.js", () => ({
  getCurrentLearnerIdentity: () => ({ learnerId: 9 }),
  getCurrentLearner: vi.fn(),
  getLearnerPortalData: vi.fn(async () => ({})),
}))
vi.mock("@/components/learner/xp-award-modal.jsx", () => ({
  prefetchRewards: async () => {},
  snapshotRewards: () => ({}),
  announceRewards: async () => {},
}))
vi.mock("@/components/challenges/diagram-area.jsx", () => ({
  default: () => null,
}))
vi.mock(
  "@/components/assessments/attempt/code-mirror-programming-workspace.jsx",
  () => ({ default: () => null })
)
vi.mock("@/components/assessments/attempt/adaptive-attempt-runner.jsx", () => ({
  AdaptiveAttemptRunner: () => null,
}))
vi.mock("@/components/loading-overlay.jsx", () => ({
  LoadingSignal: () => <p role="status">Grading pending</p>,
}))
vi.mock("@/lib/authed-media.jsx", () => ({
  AuthedImage: () => null,
  prefetchAuthedMedia: async () => {},
  questionMediaKeys: () => [],
}))
vi.mock("@/components/practice/generated-quiz-arena.jsx", () => ({
  GeneratedQuizArena: ({ answers, onAnswer, onFinish }) => (
    <section>
      <button onClick={() => onAnswer(1, { selectedChoiceId: 11 })}>
        Answer first
      </button>
      <button onClick={() => onAnswer(2, { selectedChoiceId: 22 })}>
        Answer second
      </button>
      <button onClick={onFinish}>Finish test</button>
      <output data-testid="answers">{JSON.stringify(answers)}</output>
    </section>
  ),
}))
export async function renderAttempt() {
  assessment.start.mockResolvedValue({
    assessmentAttemptId: 77,
    assessmentType: "GENERATED_QUIZ",
    questions: [
      { attemptQuestionId: 1, questionType: "MULTIPLE_CHOICE", choices: [] },
      { attemptQuestionId: 2, questionType: "MULTIPLE_CHOICE", choices: [] },
    ],
  })
  const { default: Page } =
    await import("@/pages/learner/assessments/learner-assessment-attempt-page.jsx")
  return render(<Page />, { wrapper })
}
