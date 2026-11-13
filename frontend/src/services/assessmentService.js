import { API, base, currentAccessToken } from "./base"

// Mobile browsers can freeze a page immediately after it is backgrounded. Cache the token while
// an attempt is active so its pause request can use fetch({ keepalive: true }) without waiting on
// storage or Supabase during the page-lifecycle event.
let attemptIntegrityToken = null

export async function primeAttemptIntegrityTransport() {
  attemptIntegrityToken = await currentAccessToken()
}

export function getExamTypes() {
  return base("exam-types")
}

export function createExamType(examTypeText) {
  return base("exam-types", { method: "POST", data: { examTypeText } })
}

export async function ensureExamType(examTypeText) {
  const types = await getExamTypes()
  const existing = (Array.isArray(types) ? types : []).find(
    (type) => type.examTypeText === examTypeText
  )
  if (existing) return existing
  return createExamType(examTypeText)
}

export function getExams(includeDepartmentId, certificationId) {
  const params = new URLSearchParams()
  if (includeDepartmentId != null) params.set("includeDepartmentId", includeDepartmentId)
  if (certificationId != null) params.set("certificationId", certificationId)
  const query = params.toString()
  return base(`exams${query ? `?${query}` : ""}`)
}

export function getExamById(examId, includeDepartmentId) {
  const query = includeDepartmentId != null ? `?includeDepartmentId=${includeDepartmentId}` : ""
  return base(`exams/${examId}${query}`)
}

export function createExam(exam, ownerDepartmentId) {
  const query = ownerDepartmentId != null ? `?ownerDepartmentId=${ownerDepartmentId}` : ""
  return base(`exams${query}`, { method: "POST", data: exam })
}

export function updateExam(examId, exam) {
  return base(`exams/${examId}`, { method: "PUT", data: exam })
}

export function deleteExam(examId) {
  return base(`exams/${examId}`, { method: "DELETE" })
}

export function publishExam(examId) {
  return base(`exams/${examId}/publish`, { method: "POST" })
}

export function archiveExam(examId) {
  return base(`exams/${examId}/archive`, { method: "POST" })
}

export function addExamQuestions(examId, questions) {
  return base(`exams/${examId}/questions`, {
    method: "POST",
    data: { questions },
  })
}

export function getExamQuestions() {
  return base("exam-questions")
}

export function createExamQuestion(examQuestion) {
  return base("exam-questions", { method: "POST", data: examQuestion })
}

export function updateExamQuestion(examQuestionId, examQuestion) {
  return base(`exam-questions/${examQuestionId}`, {
    method: "PUT",
    data: examQuestion,
  })
}

export function deleteExamQuestion(examQuestionId) {
  return base(`exam-questions/${examQuestionId}`, { method: "DELETE" })
}

export function getTextQuestionConfig(questionId) {
  return base(`text-question-configs/by-question/${questionId}`)
}

export function getDiagramQuestionConfig(questionId) {
  return base(`diagram-question-configs/by-question/${questionId}`)
}

export function getProgrammingQuestionConfig(questionId) {
  return base(`programming-question-configs/by-question/${questionId}`)
}


// The server takes the learner from the login token; learnerId is optional and is
// left off entirely when unknown (a literal "undefined" fails Long parsing with a 500).
export function getLearnerAssessment(assessmentId, learnerId) {
  const query = learnerId != null ? `?learnerId=${learnerId}` : ""
  return base(`learner/assessments/${assessmentId}${query}`)
}

export function startAssessmentAttempt(assessmentId, learnerId, idempotencyKey, questionIndex, matchId) {
  const data = { learnerId, idempotencyKey }
  if (questionIndex != null) data.questionIndex = questionIndex
  if (matchId != null) data.matchId = matchId
  return base(`learner/assessments/${assessmentId}/attempts`, {
    method: "POST",
    data,
  })
}

export function autosaveAttemptAnswers(attemptId, learnerId, answers) {
  return base(`learner/assessment-attempts/${attemptId}/answers`, {
    method: "PUT",
    data: { learnerId, answers },
  })
}

export function setAttemptFlag(attemptId, attemptQuestionId, learnerId, flagged) {
  return base(`learner/assessment-attempts/${attemptId}/flags/${attemptQuestionId}`, {
    method: "PUT",
    data: { learnerId, flagged },
  })
}

export function setAttemptSkip(attemptId, attemptQuestionId, learnerId, skipped) {
  return base(`learner/assessment-attempts/${attemptId}/skip/${attemptQuestionId}`, {
    method: "PUT",
    data: { learnerId, skipped },
  })
}

export function setAttemptCurrentItem(attemptId, attemptQuestionId, learnerId) {
  return base(`learner/assessment-attempts/${attemptId}/current-item`, {
    method: "PUT",
    data: { learnerId, attemptQuestionId },
  })
}

// The learner left the attempt tab: the server stops the clock and counts the violation.
// reason: "TAB_HIDDEN" | "WINDOW_BLUR". On the last allowed exit the server forfeits the
// attempt (score 0) and answers with forfeited: true.
export async function pauseAttemptClock(attemptId, reason, attemptQuestionId, { keepalive = false } = {}) {
  if (keepalive && typeof fetch === "function") {
    const token = attemptIntegrityToken ?? await currentAccessToken()
    if (token) {
      try {
        const response = await fetch(`${API}/learner/assessment-attempts/${attemptId}/pause`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason, attemptQuestionId }),
          keepalive: true,
        })
        if (!response.ok) throw new Error(`Could not pause assessment (${response.status}).`)
        return response.json()
      } catch {
        // Use the normal client where the browser allows it; this also covers older webviews.
      }
    }
  }
  return base(`learner/assessment-attempts/${attemptId}/pause`, {
    method: "POST",
    data: { reason, attemptQuestionId },
  })
}

// Blocked copy/paste/shortcut attempts, stored as the attempt's integrity log.
export function reportAttemptIntegrityEvents(attemptId, events) {
  return base(`learner/assessment-attempts/${attemptId}/integrity-events`, {
    method: "POST",
    data: { events },
  })
}

// Back on the attempt tab: the server credits the paused time and returns the new deadline.
export function resumeAttemptClock(attemptId) {
  return base(`learner/assessment-attempts/${attemptId}/resume`, { method: "POST" })
}

export function runAttemptProgramming(attemptId, attemptQuestionId, learnerId, code, language) {
  return base(
    `learner/assessment-attempts/${attemptId}/programming/${attemptQuestionId}/run`,
    { method: "POST", data: { learnerId, code, language } }
  )
}

export function checkAttemptProgramming(attemptId, attemptQuestionId, learnerId, code, language) {
  return base(
    `learner/assessment-attempts/${attemptId}/programming/${attemptQuestionId}/check`,
    { method: "POST", data: { learnerId, code, language } }
  )
}

export function getAttemptExecutions(attemptId, attemptQuestionId, learnerId) {
  return base(
    `learner/assessment-attempts/${attemptId}/programming/${attemptQuestionId}/executions?learnerId=${learnerId}`
  )
}

export function checkAttemptDiagram(attemptId, attemptQuestionId, learnerId, diagramData, diagramType) {
  return base(
    `learner/assessment-attempts/${attemptId}/diagram/${attemptQuestionId}/check`,
    { method: "POST", data: { learnerId, diagramData, diagramType } }
  )
}

export function checkChoiceAnswer(attemptId, attemptQuestionId, learnerId, selectedChoiceId) {
  return base(`learner/assessment-attempts/${attemptId}/choice/${attemptQuestionId}/check`, {
    method: "POST",
    data: { learnerId, selectedChoiceId },
  })
}

export function answerAdaptiveItem(attemptId, learnerId, answer) {
  return base(`learner/assessment-attempts/${attemptId}/adaptive/answer`, {
    method: "POST",
    data: { learnerId, answer },
  })
}

// Adaptive MCQ marking should be quick. A bounded request prevents an unavailable
// API connection from leaving a learner trapped on "Loading next" indefinitely.
export function answerAdaptiveItems(attemptId, learnerId, answers, { timeout = 15_000 } = {}) {
  return base(`learner/assessment-attempts/${attemptId}/adaptive/answers`, {
    method: "POST",
    data: { learnerId, answers },
    timeout,
  })
}

export function submitAssessmentAttempt(attemptId, learnerId, answers) {
  return base(`learner/assessment-attempts/${attemptId}/submit`, {
    method: "POST",
    data: { learnerId, answers },
  })
}

export function getAttemptResult(attemptId, learnerId) {
  return base(`learner/assessment-attempts/${attemptId}/result?learnerId=${learnerId}`)
}

export function getLearnerAttempts(learnerId) {
  return base(`learner/assessment-attempts?learnerId=${learnerId}`)
}

export function getAssessmentAttempts(assessmentId, learnerId) {
  return base(`learner/assessments/${assessmentId}/attempts?learnerId=${learnerId}`)
}


export function purchaseCertification(certificationId, learnerId, idempotencyKey) {
  return base(`learner/certifications/${certificationId}/purchase`, {
    method: "POST",
    data: { learnerId, idempotencyKey },
  })
}

export function confirmPurchase(transactionId, learnerId, paymentReference) {
  return base(`learner/purchases/${transactionId}/confirm`, {
    method: "POST",
    data: { learnerId, paymentReference },
  })
}

export function getLearnerEnrollments(learnerId) {
  return base(`learner/enrollments?learnerId=${learnerId}`)
}

export const ASSESSMENT_TYPES = [
  { value: "DIAGNOSTIC", label: "Diagnostic" },
  { value: "QUIZ", label: "Lesson Quiz" },
  { value: "MODULE_EXAM", label: "Module Exam" },
  { value: "MOCK_EXAM", label: "Mock Exam" },
  { value: "PRACTICE_TEST", label: "Practice Test" },
  { value: "ASSIGNMENT", label: "Assignment" },
]

export const INSTITUTION_ASSESSMENT_TYPES = ASSESSMENT_TYPES.filter(
  (type) => type.value !== "DIAGNOSTIC"
)

const RUNTIME_TYPE_LABELS = {
  DIAGNOSTIC: "Diagnostic",
  LESSON_QUIZ: "Lesson Quiz",
  MIDDLE_EXAM: "Module Exam",
  MAJOR_EXAM: "Major Exam",
  MOCK_EXAM: "Mock Exam",
  GENERATED_QUIZ: "AI Quiz",
  GENERATED_FLASHCARD: "AI Flashcards",
  RECALL: "Active Recall",
  CHALLENGE: "Challenge",
  KNOWLEDGE_CHECK: "Knowledge Check",
}

export function getAssessmentTypeLabel(examTypeText) {
  return (
    ASSESSMENT_TYPES.find((type) => type.value === examTypeText)?.label ??
    RUNTIME_TYPE_LABELS[examTypeText] ??
    examTypeText ??
    "Assessment"
  )
}
