/**
 * A problem-solving answer is two things -- the working and the final answer --
 * carried in the one `learnerAnswer` string every attempt type already uses.
 *
 * It stays plain, readable text rather than JSON on purpose: this string is
 * what the AI examiner marks, what an admin reads in the question bank, and
 * what a learner sees on their result page. A JSON blob would be correct and
 * illegible in all three places.
 *
 * `encode` and `decode` must be EXACTLY reversible for any working text. The
 * editor round-trips through them on every keystroke, so anything they tidy up
 * -- trailing whitespace, say -- is tidied away as the learner types it, and
 * the space bar stops working. Tidying belongs at submission, not here.
 */

const FINAL_ANSWER_LABEL = "Final answer:"
const SEPARATOR = `\n\n${FINAL_ANSWER_LABEL} `

/** Joins working and final answer into the single stored string. */
export function encodeProblemSolvingAnswer({ working = "", finalAnswer = "" } = {}) {
  const steps = String(working ?? "")
  const answer = String(finalAnswer ?? "")

  if (!steps.trim() && !answer.trim()) return ""
  if (!answer) return steps
  return `${steps}${SEPARATOR}${answer}`
}

/**
 * Splits a stored answer back apart. Anything that was not written by the
 * editor -- an older answer, a paste, a blank -- comes back as working with no
 * final answer, which is the honest reading of it.
 */
export function decodeProblemSolvingAnswer(stored) {
  const text = String(stored ?? "")
  if (!text) return { working: "", finalAnswer: "" }

  const at = text.lastIndexOf(SEPARATOR)
  if (at !== -1) {
    return { working: text.slice(0, at), finalAnswer: text.slice(at + SEPARATOR.length) }
  }

  // An answer that only ever had a final answer, or one typed by hand.
  if (text.startsWith(`${FINAL_ANSWER_LABEL} `)) {
    return { working: "", finalAnswer: text.slice(FINAL_ANSWER_LABEL.length + 1) }
  }

  return { working: text, finalAnswer: "" }
}

/**
 * Whether a stored answer should be shown as worked mathematics.
 *
 * Detected from the answer rather than the question type, because the result
 * page is given answers without their type -- and because an answer that
 * carries equations deserves to be typeset whatever type produced it.
 */
export function looksLikeWorkedAnswer(stored) {
  const text = String(stored ?? "")
  return text.includes(FINAL_ANSWER_LABEL) || text.includes("\\(")
}

export function isProblemSolving(questionType) {
  return String(questionType ?? "").toUpperCase() === "PROBLEM_SOLVING"
}

export { FINAL_ANSWER_LABEL }
