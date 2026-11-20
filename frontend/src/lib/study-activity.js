/**
 * What a study-plan task actually opens.
 *
 * A plan event carries both a type (lesson, quiz, review, …) and the technique
 * the plan was built with. The pair decides the activity: a recall quiz has to
 * open a recall session, a spaced-repetition review has to open its flashcards,
 * and only a plain lesson day sends you to the lesson itself.
 */

export const ACTIVITY_TITLES = {
  pomodoro: "Pomodoro session",
  "active-recall": "Recall quiz",
  "recall-mixed": "Mixed recall review",
  "spaced-repetition": "Spaced repetition review",
}

/**
 * How each recall activity is built, which is what makes the two worth
 * scheduling separately: a recall quiz is the day-after retrieval of one lesson,
 * short and on that topic alone; a review leads with its topic and then keeps
 * going across everything studied earlier, so the recall is interleaved.
 */
export const RECALL_SCOPES = {
  "active-recall": { scope: "lesson", size: 10 },
  "recall-mixed": { scope: "interleaved", size: 20 },
}

/** Activities that run inside a dialog rather than navigating away. */
export const SESSION_ACTIVITIES = new Set([
  "pomodoro",
  "active-recall",
  "recall-mixed",
  "spaced-repetition",
])

export function eventKindOf(event) {
  return event?.type ?? "lesson"
}

/**
 * @returns {"active-recall"|"spaced-repetition"|"pomodoro"|"lesson"|"mock"|"mistakes"|null}
 */
export function studyActivityFor(event) {
  const type = eventKindOf(event)
  const technique = event?.technique ?? null

  if (type === "exam") return null
  if (type === "mock") return event?.certificationId ? "mock" : null
  if (type === "catch-up") return "mistakes"

  if (type === "quiz") return event?.lessonId || event?.certificationId ? "active-recall" : null

  if (type === "review") {
    if (technique === "spaced-repetition") return "spaced-repetition"
    // A pomodoro plan's review day is a reread, so it belongs in the lesson.
    // An active-recall review is the interleaved one, not another single-lesson quiz.
    if (technique === "active-recall") return "recall-mixed"
    return event?.lessonId ? "lesson" : null
  }

  // Lesson days: new material is read, with pomodoro offering its timer.
  if (!event?.lessonId) return null
  return technique === "pomodoro" ? "pomodoro" : "lesson"
}

export function activityLabel(activity, event) {
  switch (activity) {
    case "active-recall":
      return "Start recall quiz"
    case "recall-mixed":
      return "Start mixed recall"
    case "spaced-repetition":
      return "Start flashcard review"
    case "mock":
      return "Start mock exam"
    case "mistakes":
      return "Open mistake bank"
    case "pomodoro":
    case "lesson":
      return eventKindOf(event) === "lesson" ? "Open lesson" : "Open topic"
    default:
      return null
  }
}
