export const SKIM_LESSON_THRESHOLD = 3
export const skimSessionKey = (learnerId) => `rebyu:skim-session:v2:${learnerId}`

export function parseSkimLessons(raw) {
  try {
    const value = JSON.parse(raw ?? "null")
    return Array.isArray(value) ? [...new Set(value.map(Number).filter((id) => Number.isSafeInteger(id) && id > 0))] : []
  } catch { return [] }
}

// The count is only cleared once a challenge is actually shown (see skimChallengeShown);
// a lesson with too few questions, a cooldown or a failed request keeps it, so the next
// skimmed lesson tries again instead of the learner silently starting over from zero.
export function countSkimLesson(lessons, lessonId) {
  const lesson = Number(lessonId)
  const previous = parseSkimLessons(JSON.stringify(lessons))
  if (!Number.isSafeInteger(lesson) || lesson <= 0) return { lessons: previous, challenge: false }
  if (previous.includes(lesson)) return { lessons: previous, challenge: previous.length >= SKIM_LESSON_THRESHOLD }
  const next = [...previous, lesson].slice(-SKIM_LESSON_THRESHOLD)
  return { lessons: next, challenge: next.length >= SKIM_LESSON_THRESHOLD }
}

export const skimChallengeShown = () => []

// Nested chat, inputs and scrollable lesson widgets are not page-reading gestures.
export function isLessonScrollGesture(event, root) {
  const target = event.target
  if (event.type === "keydown" && target === document.body && root && !document.querySelector('[role="dialog"][aria-modal="true"]')) return true
  if (!root || !target || !root.contains(target)) return false
  if (target.closest?.('input,textarea,select,[contenteditable="true"],[role="dialog"]')) return false
  for (let node = target; node && node !== root; node = node.parentElement) {
    const style = getComputedStyle(node)
    if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight) return false
  }
  return true
}
