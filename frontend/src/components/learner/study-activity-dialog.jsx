import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PomodoroStart } from "@/components/learner/pomodoro-overlay.jsx"
import { RecallSession } from "@/components/learner/recall-session.jsx"
import { SpacedRepetitionSession } from "@/components/learner/spaced-repetition-session.jsx"
import { formatWhen } from "@/lib/study-schedule.js"
import { ACTIVITY_TITLES, RECALL_SCOPES } from "@/lib/study-activity.js"

/**
 * Runs one study-plan task as a session.
 *
 * `task` is the wrapper the plan pages build: `{ planId, event, certification,
 * certificationId }`. `onFinish` is called with the status to record —
 * "COMPLETED", "SKIPPED", or null to leave the task untouched (the pomodoro
 * timer records its own completion when it ends).
 */
export function StudyActivityDialog({ activity, task, now = new Date(), onFinish }) {
  if (!activity || !task) return null

  const event = task.event ?? {}
  const title = ACTIVITY_TITLES[activity] ?? "Scheduled study session"
  const fullWindow = activity === "spaced-repetition"

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onFinish?.("SKIPPED")
      }}
    >
      <DialogContent
        showCloseButton={!fullWindow}
        className={
          fullWindow
            ? "inset-0 top-0 left-0 h-dvh w-screen max-w-none translate-x-0 translate-y-0 gap-0 overflow-y-auto rounded-none border-0 bg-transparent p-0 shadow-none sm:max-w-none"
            : "sm:max-w-lg"
        }
      >
        {fullWindow ? (
          <DialogHeader className="sr-only">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {formatWhen(event, now)}
              {task.certification ? ` · ${task.certification}` : ""}
            </DialogDescription>
          </DialogHeader>
        ) : (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>

            <DialogDescription>
              {formatWhen(event, now)}
              {task.certification ? ` · ${task.certification}` : ""}
            </DialogDescription>
          </DialogHeader>
        )}

        {activity === "pomodoro" ? (
          <PomodoroStart
            task={task}
            onStarted={() => onFinish?.(null)}
            onDismiss={() => onFinish?.("SKIPPED")}
          />
        ) : activity === "active-recall" || activity === "recall-mixed" ? (
          <RecallSession
            task={event}
            certificationId={task.certificationId}
            scope={RECALL_SCOPES[activity].scope}
            size={RECALL_SCOPES[activity].size}
            onStarted={() => onFinish?.("COMPLETED")}
            onDismiss={() => onFinish?.("SKIPPED")}
          />
        ) : activity === "spaced-repetition" ? (
          <SpacedRepetitionSession
            task={event}
            certificationId={task.certificationId}
            onComplete={() => onFinish?.("COMPLETED")}
            onDismiss={() => onFinish?.("SKIPPED")}
          />
        ) : (
          <div className="space-y-3 py-2">
            <p className="text-sm font-medium text-foreground">{event.title}</p>
            <p className="text-sm leading-6 text-muted-foreground">
              This session is scheduled as {title.toLowerCase()}, which isn&apos;t ready
              yet. Nothing has been marked complete — it will be offered again.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default StudyActivityDialog
