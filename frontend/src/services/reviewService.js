import { base } from "./base"


export function getDueReviewCards({ certificationId, lessonId, size }) {
  return base("review-sessions/due", {
    method: "POST",
    data: { certificationId, lessonId, size },
  })
}

export function gradeReviewCard({ questionId, grade }) {
  return base(`review-sessions/items/${questionId}/grade`, {
    method: "PUT",
    data: { grade },
  })
}

export const REVIEW_GRADES = [
  { id: "AGAIN", label: "Again", hint: "Forgot it" },
  { id: "HARD", label: "Hard", hint: "Struggled" },
  { id: "GOOD", label: "Good", hint: "Recalled it" },
  { id: "EASY", label: "Easy", hint: "Instant" },
]
