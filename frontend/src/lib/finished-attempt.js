/**
 * Remembering that a sitting has been handed in, for as long as the tab lives.
 *
 * The assessment page starts an attempt as soon as it mounts. Pressing Back
 * from the result page lands on that same URL, so Back silently began a SECOND
 * sitting of a paper the learner had just finished -- a fresh clock, and the
 * exit counted against them on the new attempt. The page also rewrites its
 * history entries when it submits, but that juggling races the router and
 * cannot be relied on by itself. This is the part that must not be got wrong.
 *
 * The rule is deliberately narrow: only a POP -- Back, Forward or a reload --
 * is redirected. A PUSH is the learner asking for a new sitting ("Retake
 * assessment", opening the paper from the curriculum), and clears the mark.
 */

// Keyed per question index because a challenge arena runs one attempt per
// problem under the same exam id.
export function finishedAttemptKey(examId, learnerId, questionIndex) {
  const suffix = questionIndex != null ? `-q${questionIndex}` : ""
  return `rebyu-finished-attempt-${examId}-${learnerId}${suffix}`
}

export function rememberFinishedAttempt(examId, learnerId, questionIndex, attemptId) {
  try {
    sessionStorage.setItem(
      finishedAttemptKey(examId, learnerId, questionIndex),
      String(attemptId)
    )
  } catch {
    // Storage blocked (a private window): the history rewrite still applies.
  }
}

export function forgetFinishedAttempt(examId, learnerId, questionIndex) {
  try {
    sessionStorage.removeItem(finishedAttemptKey(examId, learnerId, questionIndex))
  } catch {
    // Nothing to clear.
  }
}

/**
 * The result to show instead of starting the paper again, or null to start it.
 *
 * Clears the mark on any navigation that is not a POP, so the next deliberate
 * visit begins a new sitting.
 */
export function finishedAttemptToShow({ examId, learnerId, questionIndex, navigationType }) {
  let attemptId = null
  try {
    attemptId = sessionStorage.getItem(finishedAttemptKey(examId, learnerId, questionIndex))
  } catch {
    return null
  }

  if (!attemptId) return null

  if (navigationType === "POP") return attemptId

  forgetFinishedAttempt(examId, learnerId, questionIndex)
  return null
}
