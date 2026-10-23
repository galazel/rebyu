import { useCallback, useEffect, useRef, useState } from "react"

import { createKnowledgeCheck, getKnowledgeCheckKey } from "@/services/knowledgeCheckService.js"
import { startAssessmentAttempt } from "@/services/assessmentService.js"
import { countSkimLesson, parseSkimLessons, skimSessionKey } from "@/lib/skim-challenge-state.js"

// Skims are counted silently; the challenge comes on the third lesson skimmed,
// then the count starts over.
function readStrikes(learnerId) {
  try {
    return parseSkimLessons(sessionStorage.getItem(skimSessionKey(learnerId)))
  } catch {
    return []
  }
}

function writeStrikes(learnerId, lessons) {
  try {
    sessionStorage.setItem(skimSessionKey(learnerId), JSON.stringify(lessons))
  } catch {
  }
}

export function useSkimChallenge({ learnerId, lessonId, enabled }) {
  const [offer, setOffer] = useState(null)
  const lessonRef = useRef(lessonId)
  const askedRef = useRef(false)
  const busyRef = useRef(false)
  const skimmedRef = useRef(false)
  const contextRef = useRef(null)
  if (!contextRef.current || contextRef.current.learnerId !== learnerId || contextRef.current.lessonId !== lessonId || contextRef.current.enabled !== enabled) {
    contextRef.current = { learnerId, lessonId, enabled }
  }
  lessonRef.current = lessonId

  useEffect(() => {
    askedRef.current = false
    skimmedRef.current = false
    busyRef.current = false
    setOffer(null)
  }, [lessonId, learnerId, enabled])

  const clearStrikes = useCallback(() => {
    if (!learnerId || skimmedRef.current) return
    writeStrikes(learnerId, [])
  }, [learnerId])

  const trigger = useCallback(({ force = false } = {}) => {
    if (!enabled || !learnerId || !lessonRef.current) return
    if (askedRef.current || busyRef.current) return

    const lesson = lessonRef.current

    if (!force) {
      if (!skimmedRef.current) {
        skimmedRef.current = true
        const result = countSkimLesson(readStrikes(learnerId), lesson)
        writeStrikes(learnerId, result.lessons)
        if (!result.challenge) return
      } else {
        return
      }
    }

    askedRef.current = true
    busyRef.current = true
    const requestContext = contextRef.current

    createKnowledgeCheck(lesson, { currentLessonOnly: true })
      .then(async (check) => {
        if (contextRef.current !== requestContext || !check?.examId) return
        const idem = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
        const [attempt, answerKey] = await Promise.all([
          startAssessmentAttempt(check.examId, learnerId, idem),
          getKnowledgeCheckKey(check.examId).catch(() => []),
        ])
        if (contextRef.current !== requestContext) return
        setOffer({ ...check, currentLessonOnly: true, attempt, answerKey })
      })
      .catch(() => {
      })
      .finally(() => {
        if (contextRef.current === requestContext) busyRef.current = false
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
