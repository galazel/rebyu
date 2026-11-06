// The learner's AI-tutor conduct standing: the server (TutorConductService) counts strikes
// for severe messages -- 1 warning, 2 final warning, 3 = every AI tutor feature locked for
// 7 hours. This store only REFLECTS what the server says: the lock is enforced there, so
// clearing it here could never unlock anything.
//
// Notices arrive from anywhere a tutor call returns (`services/base.js` for plain requests,
// the chat stream's `conduct` event, a 423 TUTOR_LOCKED refusal) as a window event, so
// this file does not have to import the HTTP layer and the HTTP layer not this file.
import { useEffect, useSyncExternalStore } from "react"

export const CONDUCT_EVENT = "rebyu:tutor-conduct"
export const TUTOR_LOCKED = "TUTOR_LOCKED"

let state = { notice: null, lockedUntil: null }
const listeners = new Set()

function set(next) {
  state = { ...state, ...next }
  listeners.forEach((listener) => listener())
}

/** Called by the HTTP layer; `detail` is {conduct} or {lockedUntil}. */
export function announceConduct(detail) {
  if (typeof window === "undefined" || !detail) return
  window.dispatchEvent(new CustomEvent(CONDUCT_EVENT, { detail }))
}

if (typeof window !== "undefined") {
  window.addEventListener(CONDUCT_EVENT, (event) => {
    const { conduct, lockedUntil } = event.detail ?? {}
    if (lockedUntil) {
      set({ notice: { level: "locked", lockedUntil }, lockedUntil })
    } else if (conduct?.level) {
      set({ notice: conduct })
    }
  })
}

/** Non-hook read, for callbacks that run before React re-renders (e.g. a failed turn). */
export function isTutorLocked() {
  return Boolean(state.lockedUntil && Date.parse(state.lockedUntil) > Date.now())
}

export function dismissConductNotice() {
  set({ notice: null })
}

function lockedUntilFrom(status) {
  return status?.locked && status.lockedUntil ? status.lockedUntil : null
}

export function useTutorConduct(base) {
  const snapshot = useSyncExternalStore(
      (listener) => { listeners.add(listener); return () => listeners.delete(listener) },
      () => state,
      () => state,
  )

  // On open, ask the server whether a lock is already running (e.g. after a reload).
  useEffect(() => {
    if (!base) return
    let cancelled = false
    base("ai/tutor/conduct")
        .then((status) => { if (!cancelled) set({ lockedUntil: lockedUntilFrom(status) }) })
        .catch(() => {})
    return () => { cancelled = true }
  }, [base])

  // The lock lifts by itself when its time is up.
  const until = snapshot.lockedUntil ? Date.parse(snapshot.lockedUntil) : null
  useEffect(() => {
    if (!until) return
    const left = until - Date.now()
    if (left <= 0) { set({ lockedUntil: null }); return }
    const timer = setTimeout(() => set({ lockedUntil: null }), Math.min(left, 2 ** 31 - 1))
    return () => clearTimeout(timer)
  }, [until])

  return {
    notice: snapshot.notice,
    lockedUntil: until && until > Date.now() ? snapshot.lockedUntil : null,
    locked: Boolean(until && until > Date.now()),
  }
}
