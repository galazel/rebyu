import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { createKnowledgeCheck, getKnowledgeCheckKey } from "@/services/knowledgeCheckService.js"
import { startAssessmentAttempt } from "@/services/assessmentService.js"

const challengeSessionKey = (learnerId, lessonId) => `rebyu:skim-challenge:v1:${learnerId}:${lessonId}`
const handledSessionKey = (learnerId, lessonId) => `rebyu:skim-challenge:handled:v1:${learnerId}:${lessonId}`

function readOffer(learnerId, lessonId) {
  try {
    const stored = JSON.parse(sessionStorage.getItem(challengeSessionKey(learnerId, lessonId)) ?? "null")
    return stored?.attempt?.assessmentAttemptId ? stored : null
  } catch {
    return null
  }
}

function writeOffer(learnerId, lessonId, offer) {
  try {
    sessionStorage.setItem(challengeSessionKey(learnerId, lessonId), JSON.stringify(offer))
  } catch {
  }
}

function clearOffer(learnerId, lessonId) {
  try {
    sessionStorage.removeItem(challengeSessionKey(learnerId, lessonId))
  } catch {
  }
}

function wasHandled(learnerId, lessonId) {
  try {
    return sessionStorage.getItem(handledSessionKey(learnerId, lessonId)) === "true"
  } catch {
    return false
  }
}

function markHandled(learnerId, lessonId) {
  try {
    sessionStorage.setItem(handledSessionKey(learnerId, lessonId), "true")
  } catch {
  }
}

export function useSkimChallenge({ learnerId, lessonId, enabled }) {
  const [offer, setOffer] = useState(null)
  const [warningOpen, setWarningOpen] = useState(false)
  const lessonRef = useRef(lessonId)
  const learnerRef = useRef(learnerId)
  const askedRef = useRef(false)
  const busyRef = useRef(false)
  const skimmedRef = useRef(false)
  const contextRef = useRef(null)
  if (!contextRef.current || contextRef.current.learnerId !== learnerId || contextRef.current.lessonId !== lessonId || contextRef.current.enabled !== enabled) {
    contextRef.current = { learnerId, lessonId, enabled }
  }
  lessonRef.current = lessonId
  learnerRef.current = learnerId

  useEffect(() => {
    askedRef.current = false
    skimmedRef.current = false
    busyRef.current = false
    const restored = learnerId && lessonId ? readOffer(learnerId, lessonId) : null
    if (restored) {
      askedRef.current = true
      skimmedRef.current = true
      setOffer(restored)
    } else {
      const handled = learnerId && lessonId && wasHandled(learnerId, lessonId)
      askedRef.current = Boolean(handled)
      skimmedRef.current = Boolean(handled)
      setOffer(null)
    }
    setWarningOpen(false)
  }, [lessonId, learnerId, enabled])

  // Kept for callers that clear a completed lesson's previous guard state.
  const clearStrikes = useCallback(() => {}, [])

  const trigger = useCallback(({ force = false } = {}) => {
    if (!enabled || !learnerId || !lessonRef.current) return
    if (askedRef.current || busyRef.current) {
      if (!busyRef.current) setWarningOpen(true)
      return
    }

    const lesson = lessonRef.current

    if (!force && skimmedRef.current) return
    skimmedRef.current = true

    askedRef.current = true
    busyRef.current = true
    const requestContext = contextRef.current

    createKnowledgeCheck(lesson, { currentLessonOnly: true })
      .then(async (check) => {
        if (contextRef.current !== requestContext) return
        if (!check?.examId) {
          // Keep this lesson quiet when it has no available quick questions.
          askedRef.current = false
          return
        }
        const idem = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
        const [attempt, answerKey] = await Promise.all([
          startAssessmentAttempt(check.examId, learnerId, idem),
          getKnowledgeCheckKey(check.examId).catch(() => []),
        ])
        if (contextRef.current !== requestContext) return
        const nextOffer = { ...check, currentLessonOnly: true, attempt, answerKey }
        writeOffer(learnerId, lesson, nextOffer)
        markHandled(learnerId, lesson)
        setOffer(nextOffer)
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
    warningOpen,
    dismissWarning: useCallback(() => setWarningOpen(false), []),
    dismiss: useCallback(() => {
      clearOffer(learnerRef.current, lessonRef.current)
      setOffer(null)
    }, []),
    trigger,
    clearStrikes,
  }
}

export default useSkimChallenge
