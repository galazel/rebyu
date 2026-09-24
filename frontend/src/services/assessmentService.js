import { base } from "./base"

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

// Omit includeDepartmentId for official exams only (what every existing caller
// does). Pass a group id to also mix in that group's own exams -- the
// caller must be able to act on that group, enforced server-side.
//
// certificationId narrows the read to one certification. Omitted, this is the
// whole-table read every existing caller makes; passed, the server does the
// filtering the caller would otherwise do over every exam on the platform.
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

// ownerDepartmentId is required for a department head creating their own
// exam; omitted, the backend requires ADMIN and creates an official exam.
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

// Adds questions to an assessment with per-question points + display order.
// questions: [{ questionId, points, displayOrder }]
export function addExamQuestions(examId, questions) {
  return base(`exams/${examId}/questions`, {
    method: "POST",
    data: { questions },
  })
}

// Exam questions (join between exam and question bank)
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

// Question configs used when rendering attempt workspaces
export function getTextQuestionConfig(questionId) {
  return base(`text-question-configs/by-question/${questionId}`)
}

export function getDiagramQuestionConfig(questionId) {
  return base(`diagram-question-configs/by-question/${questionId}`)
}

export function getProgrammingQuestionConfig(questionId) {
  return base(`programming-question-configs/by-question/${questionId}`)
}

// Learner-safe attempt transaction API (server-side snapshots and scoring)

export function getLearnerAssessment(assessmentId, learnerId) {
  return base(`learner/assessments/${assessmentId}?learnerId=${learnerId}`)
}

export function startAssessmentAttempt(assessmentId, learnerId, idempotencyKey) {
  return base(`learner/assessments/${assessmentId}/attempts`, {
    method: "POST",
    data: { learnerId, idempotencyKey },
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

/** One answer of an adaptive session; returns the marking (main round) and the next item. */
export function answerAdaptiveItem(attemptId, learnerId, answer) {
  return base(`learner/assessment-attempts/${attemptId}/adaptive/answer`, {
    method: "POST",
    data: { learnerId, answer },
  })
}

/** Every answer queued on the client, in order, in one request. */
export function answerAdaptiveItems(attemptId, learnerId, answers) {
  return base(`learner/assessment-attempts/${attemptId}/adaptive/answers`, {
    method: "POST",
    data: { learnerId, answers },
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

// Full attempt history for one assessment — every retake, newest first.
export function getAssessmentAttempts(assessmentId, learnerId) {
  return base(`learner/assessments/${assessmentId}/attempts?learnerId=${learnerId}`)
}

// Enrollment / purchase transaction API

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

// Well-known assessment type labels stored in exam_types.exam_type_text.
export const ASSESSMENT_TYPES = [
  { value: "DIAGNOSTIC", label: "Diagnostic" },
  { value: "QUIZ", label: "Lesson Quiz" },
  { value: "MODULE_EXAM", label: "Module Exam" },
  { value: "MOCK_EXAM", label: "Mock Exam" },
  { value: "PRACTICE_TEST", label: "Practice Test" },
  { value: "ASSIGNMENT", label: "Assignment" },
]

// Offered to Institution groups authoring their own assessments. Excludes
// DIAGNOSTIC -- that label carries special meaning on the official
// curriculum (it used to gate lesson access platform-wide), which doesn't
// apply to a group's own, non-gating assessment and would be misleading.
export const INSTITUTION_ASSESSMENT_TYPES = ASSESSMENT_TYPES.filter(
  (type) => type.value !== "DIAGNOSTIC"
)

/* The exam types the backend actually stores, from `ExamTypeSeeder`.
   `ASSESSMENT_TYPES` above is the authoring menu -- what a person may pick when
   creating an assessment -- and it names only a few of these. Everything else
   was falling through to the raw enum, so a learner sitting a lesson quiz saw
   "LESSON_QUIZ" in the attempt header and again on their result. Kept separate
   from the authoring list on purpose: these are labels to read, not options to
   offer. */
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
