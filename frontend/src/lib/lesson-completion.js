
const completedThisSession = new Set()

function key(lessonId) {
  return String(lessonId)
}

export function rememberLessonCompleted(lessonId) {
  if (lessonId == null) return
  completedThisSession.add(key(lessonId))
}

export function wasLessonCompletedThisSession(lessonId) {
  if (lessonId == null) return false
  return completedThisSession.has(key(lessonId))
}

export function forgetLessonCompleted(lessonId) {
  if (lessonId == null) return
  completedThisSession.delete(key(lessonId))
}
