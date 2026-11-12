import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import {
  pauseAttemptClock,
  primeAttemptIntegrityTransport,
  reportAttemptIntegrityEvents,
  resumeAttemptClock,
} from "@/services/assessmentService.js"

// Shortcuts that copy, cut, paste, select-all-the-page, print, save or view source.
const BLOCKED_KEYS = new Set(["c", "x", "v", "a", "p", "s", "u"])
const DEFAULT_MAX_VIOLATIONS = 3
const FLUSH_MS = 3000

function isEditable(target) {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest("input, textarea, [contenteditable='true'], [contenteditable=''], .cm-editor"))
}

/**
 * Exam integrity for a certification assessment attempt:
 *  - copy, cut, paste, the context menu, dragging text and the matching shortcuts are blocked,
 *    and every blocked try is reported to the server's integrity log;
 *  - leaving the tab (switching tabs, minimising, focusing another window) pauses the
 *    attempt clock on the server and locks the screen until the learner is back and resumes;
 *  - on the last allowed exit the server ends the attempt with a score of 0 and
 *    `onForfeit(attemptId)` is called.
 *
 * `onClock(expiresAt)` receives the server's deadline after every pause and resume.
 * `getQuestionId()` names the question on screen, for the log.
 */
export function useAttemptIntegrity({
  attemptId, enabled, onClock, onForfeit, getQuestionId, initialViolations, initialMaxViolations,
}) {
  const [paused, setPaused] = useState(false)
  const [violations, setViolations] = useState(0)
  const [maxViolations, setMaxViolations] = useState(DEFAULT_MAX_VIOLATIONS)
  const [forfeited, setForfeited] = useState(false)
  const [resuming, setResuming] = useState(false)
  const pausedRef = useRef(false)
  const callbacks = useRef({ onClock, onForfeit, getQuestionId })
  callbacks.current = { onClock, onForfeit, getQuestionId }
  const queueRef = useRef([])
  const lastToastRef = useRef(0)

  // A reloaded page picks the strike count up from the server, never from zero.
  useEffect(() => {
    if (initialViolations != null) setViolations(initialViolations)
    if (initialMaxViolations) setMaxViolations(initialMaxViolations)
  }, [attemptId, initialViolations, initialMaxViolations])

  const flush = useCallback(() => {
    if (attemptId == null || queueRef.current.length === 0) return
    const events = queueRef.current.splice(0, 50)
    reportAttemptIntegrityEvents(attemptId, events).catch(() => {
      // Keep the evidence for the next flush.
      queueRef.current.unshift(...events)
    })
  }, [attemptId])

  const record = useCallback((type, detail) => {
    if (queueRef.current.length >= 200) return
    queueRef.current.push({
      type,
      detail: detail ?? null,
      attemptQuestionId: callbacks.current.getQuestionId?.() ?? null,
    })
  }, [])

  const notifyBlocked = useCallback(() => {
    const now = Date.now()
    if (now - lastToastRef.current < 2500) return
    lastToastRef.current = now
    toast.warning("Copying and pasting are disabled during an assessment. Attempts are recorded.")
  }, [])

  // Preload the bearer token before a mobile browser backgrounds the page. Page-lifecycle events
  // have only a brief window in which a keep-alive request can leave the device.
  useEffect(() => {
    if (!enabled || attemptId == null) return
    primeAttemptIntegrityTransport().catch(() => {})
  }, [attemptId, enabled])

  const pause = useCallback((reason, { keepalive = false } = {}) => {
    if (!enabled || attemptId == null || pausedRef.current) return
    pausedRef.current = true
    setPaused(true)
    setViolations((count) => count + 1)
    flush()
    pauseAttemptClock(attemptId, reason, callbacks.current.getQuestionId?.() ?? null, { keepalive })
        .then((clock) => {
          if (clock?.focusViolations != null) setViolations(clock.focusViolations)
          if (clock?.maxFocusViolations) setMaxViolations(clock.maxFocusViolations)
          if (clock?.forfeited) {
            setForfeited(true)
            callbacks.current.onForfeit?.(attemptId)
            return
          }
          if (clock?.expiresAt) callbacks.current.onClock?.(clock.expiresAt)
        })
        .catch(() => {})
  }, [attemptId, enabled, flush])

  const resume = useCallback(async () => {
    if (!pausedRef.current || attemptId == null) return
    setResuming(true)
    try {
      const clock = await resumeAttemptClock(attemptId)
      if (clock?.expiresAt) callbacks.current.onClock?.(clock.expiresAt)
    } catch {
      // The server still holds the pause and credits it on the next save or submit.
      toast.error("Could not reach the server to restart the timer. Your time away is still credited.")
    } finally {
      pausedRef.current = false
      setPaused(false)
      setResuming(false)
    }
  }, [attemptId])

  // Leaving the attempt tab or window.
  useEffect(() => {
    if (!enabled || forfeited) return
    // A refresh is not leaving: the browser's "Leave site?" prompt steals focus and the
    // unloading page goes hidden, and neither may count as an exit.
    let unloading = false
    let unloadTimer = null
    const onBeforeUnload = () => {
      unloading = true
      clearTimeout(unloadTimer)
      // Timers wait while the prompt is open, so this runs once it closes. If the learner
      // cancelled the reload but is now in another window, that is a real exit.
      unloadTimer = setTimeout(() => {
        unloading = false
        if (document.visibilityState === "hidden") pause("TAB_HIDDEN")
        else if (!document.hasFocus()) pause("WINDOW_BLUR")
      }, 1500)
    }
    const onPageHide = () => {
      // iOS Safari and Android webviews commonly emit pagehide when the learner switches
      // apps. That is an absence, not an unload; count it before the page is frozen.
      if (!unloading && document.visibilityState === "hidden") {
        pause("TAB_HIDDEN", { keepalive: true })
      }
    }
    const onFreeze = () => {
      // The Page Lifecycle API fills the gap in webviews that freeze before pagehide.
      if (!unloading && document.visibilityState === "hidden") {
        pause("TAB_HIDDEN", { keepalive: true })
      }
    }
    const onVisibility = () => {
      if (unloading) return
      if (document.visibilityState === "hidden") pause("TAB_HIDDEN", { keepalive: true })
    }
    const onBlur = () => {
      // Focus moving into an embedded frame on this page is not leaving the attempt.
      setTimeout(() => {
        if (unloading) return
        if (document.activeElement?.tagName === "IFRAME") return
        if (!document.hasFocus()) pause("WINDOW_BLUR")
      }, 0)
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    window.addEventListener("pagehide", onPageHide)
    document.addEventListener("visibilitychange", onVisibility)
    document.addEventListener("freeze", onFreeze)
    window.addEventListener("blur", onBlur)
    return () => {
      clearTimeout(unloadTimer)
      window.removeEventListener("beforeunload", onBeforeUnload)
      window.removeEventListener("pagehide", onPageHide)
      document.removeEventListener("visibilitychange", onVisibility)
      document.removeEventListener("freeze", onFreeze)
      window.removeEventListener("blur", onBlur)
    }
  }, [enabled, forfeited, pause])

  // Copy, cut, paste and their shortcuts.
  useEffect(() => {
    if (!enabled) return
    const blockAs = (type) => (event) => {
      event.preventDefault()
      record(type)
      notifyBlocked()
    }
    const onCopy = blockAs("COPY")
    const onCut = blockAs("CUT")
    const onPaste = blockAs("PASTE")
    const onDrop = blockAs("DROP")
    const onContextMenu = (event) => {
      event.preventDefault()
      record("CONTEXT_MENU")
    }
    const onDragStart = (event) => {
      if (!isEditable(event.target)) event.preventDefault()
    }
    const onKeyDown = (event) => {
      if (event.key === "PrintScreen") {
        record("PRINT_SCREEN")
        notifyBlocked()
        return
      }
      if (!(event.ctrlKey || event.metaKey)) return
      const key = event.key.toLowerCase()
      if (!BLOCKED_KEYS.has(key)) return
      // Select-all inside the learner's own answer field is harmless.
      if (key === "a" && isEditable(event.target)) return
      event.preventDefault()
      event.stopPropagation()
      // Copy/cut/paste shortcuts are logged by their own events; log the rest here.
      if (key === "c" || key === "x" || key === "v") {
        record({ c: "COPY", x: "CUT", v: "PASTE" }[key], `${event.metaKey ? "Cmd" : "Ctrl"}+${key.toUpperCase()}`)
        notifyBlocked()
      } else {
        record("SHORTCUT", `${event.metaKey ? "Cmd" : "Ctrl"}+${key.toUpperCase()}`)
      }
    }
    document.addEventListener("copy", onCopy, true)
    document.addEventListener("cut", onCut, true)
    document.addEventListener("paste", onPaste, true)
    document.addEventListener("drop", onDrop, true)
    document.addEventListener("contextmenu", onContextMenu, true)
    document.addEventListener("dragstart", onDragStart, true)
    document.addEventListener("keydown", onKeyDown, true)
    document.body.classList.add("rb-attempt-nocopy")
    const interval = setInterval(flush, FLUSH_MS)
    return () => {
      document.removeEventListener("copy", onCopy, true)
      document.removeEventListener("cut", onCut, true)
      document.removeEventListener("paste", onPaste, true)
      document.removeEventListener("drop", onDrop, true)
      document.removeEventListener("contextmenu", onContextMenu, true)
      document.removeEventListener("dragstart", onDragStart, true)
      document.removeEventListener("keydown", onKeyDown, true)
      document.body.classList.remove("rb-attempt-nocopy")
      clearInterval(interval)
      flush()
    }
  }, [enabled, record, notifyBlocked, flush])

  return {
    paused: enabled && paused && !forfeited,
    violations,
    maxViolations,
    forfeited,
    resuming,
    resume,
  }
}

export default useAttemptIntegrity
