import examReady from "@/assets/exam-ready.png"
import finisher from "@/assets/finisher.png"
import firstPerfectScore from "@/assets/first-perfect-score.png"
import firstQuiz from "@/assets/first-quiz.png"
import firstStep from "@/assets/first-step.png"
import knowledgeSeeker from "@/assets/knowledge-seeker.png"
import rebyuLegend from "@/assets/rebyu-legend.png"
import topAchiever from "@/assets/top-achiever.png"

const BADGES = {
  "first-step": firstStep,
  "first-quiz": firstQuiz,
  "first-perfect-score": firstPerfectScore,
  "exam-ready": examReady,
  "knowledge-seeker": knowledgeSeeker,
  finisher,
  "top-achiever": topAchiever,
  "rebyu-legend": rebyuLegend,
}

function toSlug(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
}

export function achievementBadge(achievement) {
  const key = toSlug(achievement?.slug ?? achievement?.code ?? achievement?.title)
  return BADGES[key] ?? null
}

export function achievementKey(achievement) {
  return (
    achievement?.code ??
    toSlug(achievement?.slug ?? achievement?.title) ??
    String(achievement?.achievementId ?? "")
  )
}

export function earnedAchievementKeys(achievements) {
  return new Set(
    (Array.isArray(achievements) ? achievements : [])
      .filter((achievement) => achievement?.earned)
      .map(achievementKey)
  )
}
