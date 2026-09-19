import { useCallback, useEffect, useRef, useState } from "react"

import { createKnowledgeCheck, getKnowledgeCheckKey } from "@/services/knowledgeCheckService.js"
import { startAssessmentAttempt } from "@/services/assessmentService.js"

/**
 * The pop-up challenge, fired by one thing only: the reading-pace guard
 * catching the learner skimming the lesson on screen. There is no timer and no
 * random scroll depth -- racing through the content is what earns the
 * interruption, and the five questions come from that same lesson.
 *
 * `trigger()` is what the guard calls. It asks the server once whether a
 * challenge can be served for this lesson; an unavailable answer (server
 * cooldown, or too few multiple-choice / short-answer questions in the lesson)
 * closes the matter for this lesson opening rather than being retried on the
 * next rush. Reopening the lesson re-arms it.
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
  lessonRef.current = lessonId

  useEffect(() => {
    askedRef.current = false
    setOffer(null)
  }, [lessonId])

  const trigger = useCallback(() => {
    if (!enabled || !learnerId || !lessonRef.current) return
    if (askedRef.current || busyRef.current) return

    const lesson = lessonRef.current
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
  }
}

export default useSkimChallenge
