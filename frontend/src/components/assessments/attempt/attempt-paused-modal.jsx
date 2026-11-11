import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

import { EyeOffIcon, Loader2Icon } from "@/components/icons"
import { Button } from "@/components/ui/button"

// True only while this tab is the one the learner is looking at and typing into.
function attemptHasFocus() {
  return document.visibilityState === "visible" && document.hasFocus()
}

/**
 * The lock screen shown while an attempt is paused for leaving the tab. It has no close
 * button, ignores Escape and outside clicks, and covers the questions so the paused time
 * cannot be spent reading them. "Resume" stays disabled until this tab is back in focus.
 */
export function AttemptPausedModal({ open, violations, maxViolations = 3, resuming, onResume }) {
  const [focused, setFocused] = useState(() => attemptHasFocus())

  useEffect(() => {
    if (!open) return
    const sync = () => setFocused(attemptHasFocus())
    sync()
    window.addEventListener("focus", sync)
    window.addEventListener("blur", sync)
    document.addEventListener("visibilitychange", sync)
    // Some browsers skip the focus event when returning from another window.
    const poll = setInterval(sync, 500)
    return () => {
      window.removeEventListener("focus", sync)
      window.removeEventListener("blur", sync)
      document.removeEventListener("visibilitychange", sync)
      clearInterval(poll)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const swallow = (event) => {
      if (event.key === "Escape") {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    document.addEventListener("keydown", swallow, true)
    return () => document.removeEventListener("keydown", swallow, true)
  }, [open])

  if (!open) return null

  return createPortal(
      <div
          className="rebyu-ds fixed inset-0 z-[1000] flex items-center justify-center bg-background p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="attempt-paused-title"
          aria-describedby="attempt-paused-body"
      >
        <div className="w-full max-w-md rounded-2xl border border-[var(--tg-line)] bg-card p-6 text-center shadow-lg sm:p-8">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            <EyeOffIcon aria-hidden="true" />
          </div>
          <h2 id="attempt-paused-title" className="font-rb-display text-xl font-extrabold text-foreground">
            Assessment paused
          </h2>
          <p id="attempt-paused-body" className="mt-2 text-sm text-muted-foreground">
            You left the assessment tab, so the timer has stopped and the questions are hidden.
            Close any other tabs or windows and come back to this one to continue.
          </p>
          <p className="mt-3 text-xs font-semibold text-muted-foreground">
            Times you have left this assessment: {violations} of {maxViolations}
          </p>
          {maxViolations - violations === 1 ? (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              Last warning: leaving once more ends this assessment with a score of 0.
            </p>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              Leaving {maxViolations} times ends the assessment with a score of 0. Every exit is recorded.
            </p>
          )}
          <Button
              className="mt-6 w-full"
              disabled={!focused || resuming}
              onClick={onResume}
          >
            {resuming ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
            {focused ? "Resume assessment" : "Return to this tab to resume"}
          </Button>
        </div>
      </div>,
      document.body
  )
}

export default AttemptPausedModal
