import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { createKnowledgeCheck, getKnowledgeCheckKey } from "@/services/knowledgeCheckService.js"
import { startAssessmentAttempt } from "@/services/assessmentService.js"
import { countSkimLesson, parseSkimLessons, skimChallengeShown, skimSessionKey } from "@/lib/skim-challenge-state.js"

// Skims are counted silently across lessons; the challenge comes on the third lesson
// skimmed, and the count starts over only once a challenge has actually been shown.
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

  // Reading one lesson properly no longer wipes skims counted on other lessons.
  const clearStrikes = useCallback(() => {}, [])

  const trigger = useCallback(({ force = false } = {}) => {
    if (!enabled || !learnerId || !lessonRef.current) return
    if (askedRef.current || busyRef.current) return

    const lesson = lessonRef.current

    if (!force) {
      if (skimmedRef.current) return
      skimmedRef.current = true
      const result = countSkimLesson(readStrikes(learnerId), lesson)
      writeStrikes(learnerId, result.lessons)
      if (!result.challenge) return
    }

    askedRef.current = true
    busyRef.current = true
    const requestContext = contextRef.current

    createKnowledgeCheck(lesson, { currentLessonOnly: true })
      .then(async (check) => {
        if (contextRef.current !== requestContext) return
        if (!check?.examId) {
          // Not enough quick questions on this lesson, or a challenge was served a minute ago:
          // keep the count so the next skimmed lesson gets the challenge.
          askedRef.current = false
          return
        }
        const idem = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
        const [attempt, answerKey] = await Promise.all([
          startAssessmentAttempt(check.examId, learnerId, idem),
          getKnowledgeCheckKey(check.examId).catch(() => []),
        ])
        if (contextRef.current !== requestContext) return
        writeStrikes(learnerId, skimChallengeShown())
        setOffer({ ...check, currentLessonOnly: true, attempt, answerKey })
      })
      .catch((error) => {
        if (contextRef.current !== requestContext) return
        askedRef.current = false
        skimmedRef.current = false
        toast.error("Could not load the skim challenge", {
          description: error?.response?.data?.message ?? "It will try again the next time you skim.",
        })
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
