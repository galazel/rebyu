import { useEffect, useRef, useState } from "react"

import { getKnowledgeCheckOffer } from "@/services/knowledgeCheckService.js"

/**
 * The pop-up challenge, once a day, at a random moment while studying.
 *
 * Not tied to lessons: a check on every lesson opening was an interruption a
 * learner learned to dread. Instead each day draws one random amount of
 * *active* study time -- somewhere between MIN and MAX minutes -- and the
 * challenge appears when the learner's study time that day reaches it,
 * whichever lesson they happen to be reading.
 *
 * "Active" means the study page is visible and the learner has scrolled,
 * typed, tapped or clicked within the last minute; a lesson left open in a
 * background tab over lunch does not count. The running total and the day's
 * target are kept in localStorage per learner and per date, so moving between
 * lessons, topics or reloading the page carries on counting rather than
 * starting over.
 *
 * The server still decides whether a check can be served (enough completed
 * lessons to ask about, not already served today). If it says there is not
 * enough material yet, the challenge waits another stretch of study and asks
 * again, since finishing a lesson in the meantime can change the answer.
 */

const MIN_MINUTES = 4
const MAX_MINUTES = 30
const IDLE_MS = 60_000
const TICK_MS = 5_000
const RETRY_MINUTES = 10
const COOLDOWN_RETRY_MINUTES = 15

function todayKey() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

function freshDay(date) {
  const minutes = MIN_MINUTES + Math.random() * (MAX_MINUTES - MIN_MINUTES)
  return { date, activeMs: 0, targetMs: Math.round(minutes * 60_000), done: false }
}

function readState(storageKey) {
  const date = todayKey()
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null")
    if (saved && saved.date === date && typeof saved.activeMs === "number") return saved
  } catch {
    /* Storage unavailable or corrupt: start the day fresh. */
  }
  return freshDay(date)
}

function writeState(storageKey, state) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state))
  } catch {
    /* Private mode or full storage: the count just will not survive a reload. */
  }
}

export function useDailyStudyChallenge({ learnerId, lessonId, enabled }) {
  const [offer, setOffer] = useState(null)
  const lessonRef = useRef(lessonId)
  lessonRef.current = lessonId

  useEffect(() => {
    if (!enabled || !learnerId) return undefined

    const storageKey = `rebyu.studyChallenge.${learnerId}`
    let lastActivity = Date.now()
    let asking = false
    let cancelled = false

    const markActive = () => {
      lastActivity = Date.now()
    }
    const events = ["scroll", "wheel", "keydown", "pointerdown", "touchstart"]
    events.forEach((name) => window.addEventListener(name, markActive, { passive: true }))

    const timer = setInterval(() => {
      if (document.hidden || Date.now() - lastActivity > IDLE_MS || asking) return

      const state = readState(storageKey)
      if (state.done) return

      state.activeMs += TICK_MS
      writeState(storageKey, state)

      // Only interrupt a lesson; on an assessment row there is nothing to
      // anchor the check to, so wait for the next lesson.
      if (state.activeMs < state.targetMs || !lessonRef.current) return

      asking = true
      getKnowledgeCheckOffer(lessonRef.current)
        .then((result) => {
          if (cancelled) return
          const latest = readState(storageKey)
          if (result?.available) {
            writeState(storageKey, { ...latest, done: true })
            setOffer(result)
          } else if (result?.reason === "not-enough-completed-lessons") {
            writeState(storageKey, { ...latest, targetMs: latest.activeMs + RETRY_MINUTES * 60_000 })
          } else if (result?.reason === "cooldown") {
            /* The server spaces checks a rolling 24 hours apart, so yesterday's
               check may still be inside that window at today's random moment.
               Wait another stretch of study and ask again rather than losing
               the day. */
            writeState(storageKey, { ...latest, targetMs: latest.activeMs + COOLDOWN_RETRY_MINUTES * 60_000 })
          } else {
            writeState(storageKey, { ...latest, done: true })
          }
        })
        .catch(() => {
          const latest = readState(storageKey)
          writeState(storageKey, { ...latest, targetMs: latest.activeMs + 5 * 60_000 })
        })
        .finally(() => {
          asking = false
        })
    }, TICK_MS)

    return () => {
      cancelled = true
      clearInterval(timer)
      events.forEach((name) => window.removeEventListener(name, markActive))
    }
  }, [enabled, learnerId])

  return {
    offer,
    dismiss: () => setOffer(null),
  }
}

export default useDailyStudyChallenge
