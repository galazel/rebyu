import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"

import { Brain, Check, Pause, Play, TimerReset, X } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  POMODORO_DEFAULTS,
  endPomodoro,
  pausePomodoro,
  resumePomodoro,
  startNextFocus,
  startPomodoro,
  tickPomodoro,
  usePomodoro,
} from "@/lib/pomodoro-store.js"
import { STUDY_PLAN_TASKS_QUERY_KEY, setStudyPlanTaskStatus } from "@/services/studyPlanService.js"

function formatClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}

/** A short two-note chime from the Web Audio API -- no sound file to load. */
function chime() {
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)()
    ;[660, 880].forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.frequency.value = frequency
      oscillator.connect(gain)
      gain.connect(context.destination)
      const start = context.currentTime + index * 0.22
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35)
      oscillator.start(start)
      oscillator.stop(start + 0.4)
    })
  } catch {
    // No audio is not worth failing over.
  }
}

/**
 * Everything a running Pomodoro puts on screen, mounted once in the learner
 * layout so it follows the learner from page to page:
 *
 *   focus   a small timer at the bottom of the screen; studying goes on around it
 *   break   the whole app is covered and switched off until the break is over
 *   next    a modal asking to start the next focus block
 *   done    a modal closing the session, which marks the plan's task complete
 */
export function PomodoroOverlay() {
  const session = usePomodoro()
  const queryClient = useQueryClient()
  const [now, setNow] = useState(() => Date.now())
  const [confirmEnd, setConfirmEnd] = useState(false)

  // One clock for the whole session. `tickPomodoro` does the phase changes.
  useEffect(() => {
    if (!session) return undefined
    function tick() {
      const changed = tickPomodoro()
      if (changed) chime()
      setNow(Date.now())
    }
    tick()
    const timer = setInterval(tick, 1000)
    document.addEventListener("visibilitychange", tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener("visibilitychange", tick)
    }
  }, [session])

  const phase = session ? session.phases[session.index] : null
  const onBreak = session?.stage === "running" && phase?.kind === "break"

  /* Break: switch the app off underneath. `inert` removes it from clicks, the
     keyboard and focus in one attribute; the overlay itself is portaled to
     <body>, outside #root, so it stays usable. */
  useEffect(() => {
    if (!onBreak) return undefined
    const root = document.getElementById("root")
    const previousOverflow = document.body.style.overflow
    if (root) root.inert = true
    document.body.style.overflow = "hidden"
    return () => {
      if (root) root.inert = false
      document.body.style.overflow = previousOverflow
    }
  }, [onBreak])

  // The time in the tab title, so it can be seen from another tab.
  useEffect(() => {
    if (!session || !phase) return undefined
    const original = document.title
    const left = session.stage === "paused" ? session.pausedLeft : (session.deadline ?? 0) - now
    const label = session.stage === "running" ? `${formatClock(left)} ${phase.kind === "focus" ? "Focus" : "Break"} · ` : ""
    document.title = label + original.replace(/^\d\d:\d\d (Focus|Break) · /, "")
    return () => {
      document.title = document.title.replace(/^\d\d:\d\d (Focus|Break) · /, "")
    }
  }, [session, phase, now])

  if (!session || !phase) return null

  const task = session.task ?? {}

  function finish() {
    if (task.planId && task.eventId) {
      setStudyPlanTaskStatus({ planId: task.planId, eventId: task.eventId, status: "COMPLETED" })
        .then(() => queryClient.invalidateQueries({ queryKey: [STUDY_PLAN_TASKS_QUERY_KEY] }))
        .catch((error) => console.warn("Could not record the Pomodoro as completed.", error))
    }
    endPomodoro()
  }

  if (onBreak) {
    const left = session.deadline - now
    const total = phase.minutes * 60_000
    return createPortal(
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="pomodoro-break-title"
        className="fixed inset-0 z-[200] flex items-center justify-center bg-rb-ink/95 px-6 text-center text-white backdrop-blur-sm"
      >
        <div className="max-w-md">
          <TimerReset className="mx-auto size-10 text-rb-bee" aria-hidden="true" />
          <p id="pomodoro-break-title" className="mt-4 font-rb-display text-3xl font-extrabold">
            {phase.long ? "Long break" : "Break time"}
          </p>
          <p className="mt-2 text-sm text-white/75">
            Studying is paused. Stand up, drink some water, and look away from the screen.
          </p>
          <p className="mt-8 font-rb-display text-7xl font-black tabular-nums leading-none">{formatClock(left)}</p>
          <div className="mx-auto mt-6 h-2 w-64 max-w-full overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-rb-bee transition-[width] duration-1000 ease-linear"
              style={{ width: `${Math.min(100, ((total - left) / total) * 100)}%` }}
            />
          </div>
          <p className="mt-6 text-xs text-white/60">
            Focus {phase.cycle + 1} of {phase.cycles} starts when the break is over.
          </p>

          {/* The only way out, kept small and two-step: ending the whole
              session, not skipping the break. */}
          {confirmEnd ? (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button variant="secondary" size="sm" onClick={() => setConfirmEnd(false)}>
                Keep my break
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setConfirmEnd(false)
                  endPomodoro()
                }}
              >
                End the session
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmEnd(true)}
              className="mt-8 text-xs text-white/50 underline underline-offset-4 hover:text-white/80"
            >
              Need to stop? End session
            </button>
          )}
        </div>
      </div>,
      document.body
    )
  }

  if (session.stage === "next") {
    return (
      <Dialog open onOpenChange={() => {}}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Break's over</DialogTitle>
            <DialogDescription>
              Ready for focus {phase.cycle} of {phase.cycles}? {phase.minutes} minutes
              {task.title ? ` on ${task.title}` : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={endPomodoro}>
              End session
            </Button>
            <Button onClick={startNextFocus}>
              <Play className="size-4" aria-hidden="true" />
              Start focus {phase.cycle}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (session.stage === "done") {
    return (
      <Dialog open onOpenChange={() => {}}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
              <Check className="size-7" aria-hidden="true" />
            </span>
            <DialogHeader className="items-center">
              <DialogTitle>Session complete</DialogTitle>
              <DialogDescription>
                {phase.cycles} focus blocks done{task.title ? ` on ${task.title}` : ""}. Nice work.
              </DialogDescription>
            </DialogHeader>
            <Button className="mt-2" onClick={finish}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Focus: the floating timer. Bottom centre, clear of the notifications
  // (bottom-left), the AI tutor button (bottom-right), and the mobile nav bar.
  const paused = session.stage === "paused"
  const left = paused ? session.pausedLeft : session.deadline - now
  const total = phase.minutes * 60_000

  return createPortal(
    <div
      role="timer"
      aria-live="off"
      aria-label={`Pomodoro focus ${phase.cycle} of ${phase.cycles}, ${formatClock(left)} left`}
      className="fixed bottom-20 left-1/2 z-[70] w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-card shadow-xl lg:bottom-6"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-rb-feather-wash text-rb-feather-ink">
          <Brain className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Focus {phase.cycle} of {phase.cycles}
            {paused ? " · paused" : ""}
          </p>
          <p className="truncate text-xs text-muted-foreground">{task.title ?? "Study session"}</p>
        </div>
        <p className="font-rb-display text-3xl font-black tabular-nums leading-none text-foreground">
          {formatClock(left)}
        </p>
        <div className="flex shrink-0 items-center">
          <Button
            variant="ghost"
            size="icon"
            aria-label={paused ? "Resume" : "Pause"}
            onClick={paused ? resumePomodoro : pausePomodoro}
          >
            {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
          </Button>
          <Button variant="ghost" size="icon" aria-label="End session" onClick={endPomodoro}>
            <X className="size-4" />
          </Button>
        </div>
      </div>
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-[width] duration-1000 ease-linear"
          style={{ width: `${Math.min(100, ((total - left) / total) * 100)}%` }}
        />
      </div>
    </div>,
    document.body
  )
}

/**
 * The notice a scheduled Pomodoro opens with. Starting it hands the session to
 * the floating timer and takes the learner to the lesson -- the dialog itself
 * must not be where they study, or it covers the thing they are studying.
 */
export function PomodoroStart({ task, onStarted, onDismiss }) {
  const navigate = useNavigate()
  const { focusMinutes, breakMinutes, cycles } = POMODORO_DEFAULTS
  const event = task?.event ?? {}

  return (
    <div className="space-y-4 py-2">
      <p className="text-sm font-medium text-foreground">{event.title}</p>
      <p className="text-sm leading-6 text-muted-foreground">
        {cycles} focus blocks of {focusMinutes} minutes, with a {breakMinutes}-minute break between them. A
        timer stays on screen while you study, and the screen locks during breaks.
      </p>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onDismiss}>
          Not now
        </Button>
        <Button
          onClick={() => {
            startPomodoro({
              title: event.lessonTitle ?? event.title,
              lessonId: event.lessonId ?? null,
              planId: task?.planId ?? null,
              eventId: event.id ?? null,
            })
            onStarted?.()
            if (event.lessonId && event.middleCategoryId && task?.certificationId) {
              navigate(
                `/learner/learning/${task.certificationId}/topics/${event.middleCategoryId}?lesson=${event.lessonId}`
              )
            }
          }}
        >
          <Play className="size-4" aria-hidden="true" />
          Start pomodoro
        </Button>
      </div>
    </div>
  )
}

export default PomodoroOverlay
