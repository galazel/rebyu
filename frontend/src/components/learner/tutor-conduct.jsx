// The AI tutor's conduct warnings (a modal) and the lock screen shown while every AI tutor
// feature is paused. See lib/tutor-conduct.js -- the server decides; this only shows it.
import { useEffect, useState } from "react"

import { AlertTriangle, Clock, Lock, ShieldAlert } from "@/components/icons"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { describeCountdown } from "@/lib/countdown"
import { dismissConductNotice, useTutorConduct } from "@/lib/tutor-conduct"

/** Mounted once for the whole app, so a warning shows wherever the tutor is used --
 *  the side panel, or the Live Tutor opened from a lesson or topic page. */
export function TutorConductHost() {
  const { notice } = useTutorConduct()
  return <TutorConductModal notice={notice} />
}

const WHY = {
  unsafe: "asking for help to hack, attack or break into something",
  injection: "trying to override the tutor's rules",
  violence: "threatening violence or harm",
  sexual: "sexual content",
  hate: "hateful language",
  illegal: "asking about drugs or illegal activity",
}

function untilLabel(lockedUntil) {
  const date = new Date(lockedUntil)
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}

function useSecondsLeft(lockedUntil) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!lockedUntil) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [lockedUntil])
  return lockedUntil ? Math.max(0, Math.round((Date.parse(lockedUntil) - now) / 1000)) : 0
}

export function TutorConductModal({ notice }) {
  const open = Boolean(notice)
  const level = notice?.level
  const hours = notice?.lockoutHours ?? 7
  const reason = WHY[notice?.reason] ?? "a message that breaks the tutor's rules"

  const copy = level === "locked" ? {
    icon: Lock,
    tone: "bg-destructive/10 text-destructive",
    title: "AI tutor paused",
    body: `After repeated warnings, your access to the AI Tutor, Dialogue and Live Tutor is paused until ${untilLabel(notice.lockedUntil)}. You can keep studying your lessons in the meantime.`,
    action: "I understand",
  } : level === "final" ? {
    icon: ShieldAlert,
    tone: "bg-destructive/10 text-destructive",
    title: "Final warning",
    body: `Your message was blocked for ${reason}. This is your last warning: one more message like this and every AI tutor feature will be paused for ${hours} hours.`,
    action: "I understand",
  } : {
    icon: AlertTriangle,
    tone: "bg-amber-100 text-amber-700",
    title: "Warning",
    body: `Your message was blocked for ${reason}. The AI tutor is for learning only. Repeated messages like this will pause your AI tutor access for ${hours} hours.`,
    action: "Got it",
  }
  const Icon = copy.icon

  return (
      <AlertDialog open={open} onOpenChange={(next) => { if (!next) dismissConductNotice() }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <span className={`mb-1 grid size-12 place-items-center rounded-full ${copy.tone}`} aria-hidden="true">
              <Icon className="size-6" />
            </span>
            <AlertDialogTitle>{copy.title}</AlertDialogTitle>
            <AlertDialogDescription>{copy.body}</AlertDialogDescription>
          </AlertDialogHeader>
          {level !== "locked" && notice?.strikesBeforeLock != null ? (
              <p className="text-xs font-semibold text-muted-foreground">
                Warnings: {notice.strikes} of {notice.strikes + notice.strikesBeforeLock - 1} before a {hours}-hour pause.
              </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogAction onClick={dismissConductNotice}>{copy.action}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
  )
}

export function TutorLockedPanel({ lockedUntil }) {
  const seconds = useSecondsLeft(lockedUntil)
  return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 py-8 text-center" role="status">
        <span className="grid size-16 place-items-center rounded-2xl bg-destructive/10 text-destructive" aria-hidden="true">
          <Lock className="size-8" />
        </span>
        <p className="font-rb-display text-lg font-extrabold text-foreground">AI tutor paused</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Your AI Tutor, Dialogue and Live Tutor access is paused because of repeated unsafe messages,
          even after warnings. You can still read your lessons and take your quizzes.
        </p>
        <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-bold text-foreground">
          <Clock className="size-3.5" aria-hidden="true" />
          {describeCountdown(seconds)} · back at {untilLabel(lockedUntil)}
        </p>
      </div>
  )
}
