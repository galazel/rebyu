import { useQuery } from "@tanstack/react-query"

import { getLearnerAssessment } from "@/services/assessmentService.js"

export function useLearnerAssessment(examId) {
  return useQuery({
    queryKey: ["learner-assessment-gate", examId],
    queryFn: () => getLearnerAssessment(examId),
    enabled: examId != null,
    staleTime: 0,
    retry: 1,
  })
}

export function questionCountLabel(assessment) {
  const count = assessment?.totalItems
  return Number.isInteger(count) && count > 0
    ? `${count} ${count === 1 ? "question" : "questions"}`
    : null
}
