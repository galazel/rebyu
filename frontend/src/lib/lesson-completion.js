/**
 * Which lessons this browsing session has already finished.
 *
 * Both lesson surfaces complete a lesson the same way -- the learner reaches
 * the end (or clears its quick check), the page POSTs the completion, and the
 * award pops up. Both then guard against doing it twice with state that dies
 * with the component: the topic page's `locallyDone`, the lesson page's
 * `completionSentRef`. Leave the page and come back and the guard is gone, so
 * the only thing standing between the learner and a second completion is the
 * `completed` flag on the portal payload -- which the topic page invalidates
 * on mount, and which therefore reads stale for as long as that refetch takes.
 *
 * That window is wide enough to walk through, and the database shows it being
 * walked through: completions whose `completed_at` is minutes newer than the
 * XP they paid, meaning a second POST overwrote the first. The XP itself is
 * safe -- the server keys its ledger by lesson and refuses to pay twice -- but
 * the learner still gets the "lesson complete" celebration a second time for a
 * lesson they finished several minutes ago.
 *
 * So the record outlives the component: a module-level set, which lasts as
 * long as the tab. A reload clears it, and that is correct -- a reload fetches
 * the portal payload fresh, so the server's own answer is available before
 * anything can fire.
 *
 * Deliberately not persisted to storage. This is a de-duplication guard, not a
 * source of truth about progress; the server owns that, and a stale entry in
 * localStorage would suppress a genuine completion after the learner's
 * progress was reset.
 */

const completedThisSession = new Set()

function key(lessonId) {
  return String(lessonId)
}

/** Call as the completion is sent, not when it succeeds: the duplicate we are
 *  guarding against can be issued while the first request is still in flight. */
export function rememberLessonCompleted(lessonId) {
  if (lessonId == null) return
  completedThisSession.add(key(lessonId))
}

export function wasLessonCompletedThisSession(lessonId) {
  if (lessonId == null) return false
  return completedThisSession.has(key(lessonId))
}

/** A completion that failed never happened; let the learner earn it again. */
export function forgetLessonCompleted(lessonId) {
  if (lessonId == null) return
  completedThisSession.delete(key(lessonId))
}
