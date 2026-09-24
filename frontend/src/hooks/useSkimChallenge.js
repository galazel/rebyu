import { useCallback, useEffect, useRef, useState } from "react"

import { createKnowledgeCheck, getKnowledgeCheckKey } from "@/services/knowledgeCheckService.js"
import { startAssessmentAttempt } from "@/services/assessmentService.js"

/**
 * A pattern, not a single flick: the challenge fires only once the learner
 * has skimmed more than this many lessons in a row. One lesson raced through
 * is a strike; a lesson finished without a rush clears the count.
 *
 * Two strikes meant the THIRD skimmed lesson in an unbroken run, and paired
 * with a count that died with the tab (see below) that was a bar almost
 * nobody cleared -- the challenge minted twelve times in the days before the
 * rule landed and not once in the three days after it. One strike still
 * refuses to fire on a single flick, which is the whole point of counting.
 */
const STRIKES_BEFORE_CHALLENGE = 1

const strikesKey = (learnerId) => `rebyu:skim-strikes:${learnerId}`

/* localStorage, not sessionStorage.
 *
 * The run this counts is a reading habit, and a habit does not end because a
 * tab was closed. sessionStorage is per-tab: every new tab, every restart,
 * every "open in new tab" from the curriculum started the count at zero, so
 * a learner skimming steadily across a week could never reach the second
 * strike, let alone the third. The count is cleared the moment a lesson is
 * finished at a reading pace, which is the thing that should end the run. */
function readStrikes(learnerId) {
  try {
    const raw = localStorage.getItem(strikesKey(learnerId))
    const parsed = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) ? parsed.map(Number) : []
  } catch {
    return []
  }
}

function writeStrikes(learnerId, lessons) {
  try {
    localStorage.setItem(strikesKey(learnerId), JSON.stringify(lessons))
  } catch {
    /* Storage blocked: the count just lives for this page. */
  }
}

/**
 * The pop-up challenge, fired by one thing only: the reading-pace guard
 * catching the learner skimming -- and not once, but as a habit. Each lesson
 * the guard catches the learner racing through is a strike (one per lesson,
 * however many rushes); when more than STRIKES_BEFORE_CHALLENGE different
 * lessons in a row have been skimmed, the next skimmed lesson brings the
 * challenge. Finishing a lesson at a reading pace wipes the strikes. The
 * count sits in localStorage so it survives moving between lessons, and
 * closing the browser.
 *
 * `trigger()` is what the guard calls. When it is the challenge's turn, it
 * asks the server once whether a challenge can be served for this lesson; an
 * unavailable answer (server cooldown, or too few multiple-choice /
 * short-answer questions in the lesson) closes the matter for this lesson
 * opening rather than being retried on the next rush. Reopening the lesson
 * re-arms it.
 *
 * When the answer is yes, the check is minted and the attempt started here,
 * before anything is shown: the modal opens already holding its five
 * questions, rather than making the learner press a button and wait.
 */
export function useSkimChallenge({ learnerId, lessonId, enabled }) {
  const [offer, setOffer] = useState(null)
  const lessonRef = useRef(lessonId)
  const askedRef = useRef(false)
  const busyRef = useRef(false)
  /* Whether the guard caught a rush in this opening of the lesson. */
  const skimmedRef = useRef(false)
  lessonRef.current = lessonId

  useEffect(() => {
    askedRef.current = false
    skimmedRef.current = false
    setOffer(null)
  }, [lessonId])

  /* Called when the learner finishes a lesson: read properly, the streak of
     skimmed lessons is over. */
  const clearStrikes = useCallback(() => {
    if (!learnerId || skimmedRef.current) return
    writeStrikes(learnerId, [])
  }, [learnerId])

  const trigger = useCallback(({ force = false } = {}) => {
    if (!enabled || !learnerId || !lessonRef.current) return
    if (askedRef.current || busyRef.current) return

    const lesson = lessonRef.current

    if (!force) {
      /* First rush in this lesson: record the strike. The challenge only
         comes once the pattern has held across more than one lesson. */
      if (!skimmedRef.current) {
        skimmedRef.current = true
        const strikes = readStrikes(learnerId).filter((id) => id !== Number(lesson))
        strikes.push(Number(lesson))
        if (strikes.length <= STRIKES_BEFORE_CHALLENGE) {
          writeStrikes(learnerId, strikes)
          return
        }
        writeStrikes(learnerId, [])
      } else {
        return
      }
    }

    askedRef.current = true
    busyRef.current = true

    /* Minting re-checks eligibility server-side and answers `unavailable` the
       same way the pre-flight would, so the pre-flight is one round trip the
       learner would only ever wait on. */
    createKnowledgeCheck(lesson, { currentLessonOnly: true })
      .then(async (check) => {
        if (lessonRef.current !== lesson || !check?.examId) return
        const idem = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
        const [attempt, answerKey] = await Promise.all([
          startAssessmentAttempt(check.examId, learnerId, idem),
          getKnowledgeCheckKey(check.examId).catch(() => []),
        ])
        if (lessonRef.current !== lesson) return
        setOffer({ ...check, currentLessonOnly: true, attempt, answerKey })
      })
      .catch(() => {
        /* An optional prompt must never surface an error over the lesson. */
      })
      .finally(() => {
        busyRef.current = false
      })
  }, [enabled, learnerId])

  return {
    offer,
    dismiss: useCallback(() => setOffer(null), []),
    trigger,
    clearStrikes,
  }
}

export default useSkimChallenge
