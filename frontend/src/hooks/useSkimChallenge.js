import { useCallback, useEffect, useRef, useState } from "react"

import { getKnowledgeCheckOffer } from "@/services/knowledgeCheckService.js"

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
      .then((result) => {
        if (lessonRef.current !== lesson) return
        if (result?.available) setOffer({ ...result, currentLessonOnly: true })
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
