export function toDraftDto(attemptQuestionId, answer) {
  const subAnswers = answer.subAnswers ?? {}
  const hasSubs = Object.values(subAnswers).some((text) => text?.trim())
  return {
    attemptQuestionId,
    learnerAnswer: hasSubs ? JSON.stringify(subAnswers) : (answer.learnerAnswer ?? null),
    selectedChoiceId: answer.selectedChoiceId ?? null,
    submittedCode: answer.submittedCode ?? null,
    programmingLanguage: answer.programmingLanguage ?? null,
    diagramSubmissionData: answer.diagramSubmissionData ?? null,
  }
}
