import { useCallback, useEffect, useRef, useState } from "react"

import { createKnowledgeCheck, getKnowledgeCheckOffer } from "@/services/knowledgeCheckService.js"
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

    getKnowledgeCheckOffer(lesson, { currentLessonOnly: true })
      .then(async (result) => {
        if (lessonRef.current !== lesson || !result?.available) return
        const check = await createKnowledgeCheck(lesson, { currentLessonOnly: true })
        if (!check?.examId || lessonRef.current !== lesson) return
        const key = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
        const attempt = await startAssessmentAttempt(check.examId, learnerId, key)
        if (lessonRef.current !== lesson) return
        setOffer({ ...result, currentLessonOnly: true, attempt })
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
