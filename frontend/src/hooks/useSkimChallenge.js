import { useCallback, useEffect, useRef, useState } from "react"

import { createKnowledgeCheck, getKnowledgeCheckKey } from "@/services/knowledgeCheckService.js"
import { startAssessmentAttempt } from "@/services/assessmentService.js"

const STRIKES_BEFORE_CHALLENGE = 1

const strikesKey = (learnerId) => `rebyu:skim-strikes:${learnerId}`

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
  }
}

export function useSkimChallenge({ learnerId, lessonId, enabled }) {
  const [offer, setOffer] = useState(null)
  const lessonRef = useRef(lessonId)
  const askedRef = useRef(false)
  const busyRef = useRef(false)
  const skimmedRef = useRef(false)
  lessonRef.current = lessonId

  useEffect(() => {
    askedRef.current = false
    skimmedRef.current = false
    setOffer(null)
  }, [lessonId])

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
