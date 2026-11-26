// Older attempts retain a snapshot made before these two ERD questions had
// diagram configuration. Their prompt still identifies the required workspace.
export function skimQuestionFormat(question) {
  const subtype = question?.criticalThinkingType
  if (question?.questionType === "CRITICAL_THINKING" && (subtype === "PROGRAMMING" || subtype === "DIAGRAM")) {
    return subtype
  }
  if (question?.questionType === "CRITICAL_THINKING"
    && /^\[Node 1, Problem 1\] Draw an ERD for a student enrollment system\b/i.test(question.question ?? "")) {
    return "DIAGRAM"
  }
  return question?.questionType
}
