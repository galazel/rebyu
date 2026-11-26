import { useState } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { LessonKnowledgeCheck } from "../../src/components/learner/lesson-knowledge-check.jsx"
import { ThemeProvider } from "../../src/components/theme-provider"
import "../../src/index.css"

const attempt = {
  assessmentAttemptId: 99,
  questions: [{
    attemptQuestionId: 1,
    questionType: "MULTIPLE_CHOICE",
    question: "What allows separate business teams to work from the same ERP records?",
    questionImageKey: "/lesson-media/erp-shared-database.svg",
    choices: [{ choiceId: 1, choiceText: "A shared database" }],
    subQuestions: [{ subQuestionId: 2, questionText: "Which teams share data in this example?" }],
  }, {
    attemptQuestionId: 3,
    questionType: "SHORT_ANSWER",
    question: "A sales team receives an order for a product. Explain how ERP helps the warehouse respond.",
    subQuestions: [{ subQuestionId: 4, questionText: "How does the warehouse know which stock to reserve?" }],
  }],
}
const allFormats = [
  { questionType: "MULTIPLE_CHOICE", question: "Choose a network device.", choices: [{ choiceId: 1, choiceText: "Router" }] },
  { questionType: "MULTIPLE_ANSWER", question: "Choose both transport protocols.", selectCount: 2, choices: [{ choiceId: 2, choiceText: "TCP" }, { choiceId: 3, choiceText: "UDP" }] },
  { questionType: "SHORT_ANSWER", question: "Name the protocol that resolves host names." },
  { questionType: "SHORT_ANSWER", question: "Fill in the two database terms.", subQuestions: [{ subQuestionId: 41, questionText: "Part A" }, { subQuestionId: 42, questionText: "Part B" }] },
  { questionType: "DESCRIPTIVE", question: "Explain the value of a backup." },
  { questionType: "PROBLEM_SOLVING", question: "Find the total of 2 and 2." },
  { questionType: "PROGRAMMING", question: "Print the number 7.", programmingLanguage: "PYTHON" },
  { questionType: "CRITICAL_THINKING", criticalThinkingType: "DIAGRAM", question: "Draw a student entity.", diagramType: "ERD" },
  { questionType: "TRUE_FALSE", question: "A database can enforce a primary key.", choices: [{ choiceId: 9, choiceText: "True" }, { choiceId: 10, choiceText: "False" }] },
  { questionType: "CRITICAL_THINKING", question: "Compare two backup schedules." },
].map((question, index) => ({ ...question, attemptQuestionId: index + 11 }))
const preparedAttempt = new URLSearchParams(location.search).has("all-formats")
  ? { ...attempt, questions: allFormats }
  : attempt
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
queryClient.setQueryData(["learner-rewards"], {})

function Fixture() {
  const [open, setOpen] = useState(true)
  return (
    <ThemeProvider defaultTheme="light" storageKey="skim-test-theme">
      <QueryClientProvider client={queryClient}>
        <LessonKnowledgeCheck open={open} lessonId={1} learnerId={9} itemCount={preparedAttempt.questions.length} attempt={preparedAttempt} onDismiss={() => setOpen(false)} />
      </QueryClientProvider>
    </ThemeProvider>
  )
}

createRoot(document.getElementById("root")).render(<Fixture />)
