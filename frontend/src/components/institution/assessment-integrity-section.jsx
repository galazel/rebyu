import { ShieldAlert } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export const INTEGRITY_RISK = {
  HIGH: {
    label: "Possible cheating",
    className: "border-red-300 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300",
  },
  MEDIUM: {
    label: "Integrity flags",
    className: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200",
  },
}

const EVENT_LABEL = {
  TAB_HIDDEN: "Switched tab or minimised",
  WINDOW_BLUR: "Focused another window",
  RESUMED: "Came back",
  COPY: "Tried to copy",
  CUT: "Tried to cut",
  PASTE: "Tried to paste",
  DROP: "Tried to drop text in",
  CONTEXT_MENU: "Opened the right-click menu",
  SHORTCUT: "Pressed a blocked shortcut",
  PRINT_SCREEN: "Pressed Print Screen",
  FORFEITED: "Assessment ended with 0",
}

const SEVERE = new Set(["FORFEITED", "COPY", "CUT", "PASTE", "DROP"])

function formatAway(seconds) {
  const total = Number(seconds ?? 0)
  if (total < 60) return `${total}s`
  const minutes = Math.floor(total / 60)
  const rest = total % 60
  return rest ? `${minutes}m ${rest}s` : `${minutes}m`
}

function formatWhen(value) {
  if (!value) return ""
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString()
}

function formatTime(value) {
  if (!value) return ""
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

/** The flag chips for one attempt: forfeit, exits with time away, copy/paste, other blocked. */
export function IntegrityAttemptBadges({ attempt }) {
  if (!attempt) return null
  return (
    <span className="flex flex-wrap gap-1.5">
      {attempt.forfeited ? (
        <Badge variant="outline" className={cn("text-[11px]", INTEGRITY_RISK.HIGH.className)}>
          Ended with 0
        </Badge>
      ) : null}
      {attempt.exits > 0 ? (
        <Badge variant="outline" className="text-[11px]">
          {attempt.exits} exit{attempt.exits === 1 ? "" : "s"} · {formatAway(attempt.awaySeconds)} away
        </Badge>
      ) : null}
      {attempt.copyPasteTries > 0 ? (
        <Badge variant="outline" className={cn("text-[11px]", INTEGRITY_RISK.MEDIUM.className)}>
          {attempt.copyPasteTries} copy/paste
        </Badge>
      ) : null}
      {attempt.otherBlocked > 0 ? (
        <Badge variant="outline" className="text-[11px]">
          {attempt.otherBlocked} other blocked
        </Badge>
      ) : null}
    </span>
  )
}

/**
 * The attempt's integrity log, oldest first. `questionLabel(attemptQuestionId)` may turn the
 * logged "question 41" (an internal id) into the number the head sees, e.g. "Question 3".
 */
export function IntegrityTimeline({ events, questionLabel, className }) {
  const describe = (detail) => {
    if (!detail || !questionLabel) return detail
    return detail.replace(/question (\d+)/g, (match, id) => questionLabel(Number(id)) ?? match)
  }
  return (
    <ol className={cn("space-y-1 text-xs", className)}>
      {(events ?? []).map((event, index) => (
        <li key={index} className="flex gap-3">
          <span className="w-20 shrink-0 tabular-nums text-muted-foreground">
            {formatTime(event.occurredAt)}
          </span>
          <span className={cn("text-foreground", SEVERE.has(event.type) && "font-semibold text-red-700 dark:text-red-300")}>
            {EVENT_LABEL[event.type] ?? event.type}
            {event.type === "RESUMED" && event.awaySeconds != null
              ? ` after ${formatAway(event.awaySeconds)}`
              : ""}
            {event.violationNumber && event.type !== "RESUMED" ? ` (exit ${event.violationNumber})` : ""}
            {event.detail ? <span className="text-muted-foreground"> · {describe(event.detail)}</span> : null}
          </span>
        </li>
      ))}
    </ol>
  )
}

function Stat({ label, value, alert }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background px-3 py-2">
      <dt className="text-[11px] font-medium text-muted-foreground">{label}</dt>
      <dd className={cn("text-lg font-bold tabular-nums text-foreground", alert && "text-red-600 dark:text-red-400")}>
        {value}
      </dd>
    </div>
  )
}

/**
 * The department head's view of a learner's exam integrity: every tab exit, blocked
 * copy/paste and forfeit, per assessment attempt, with a timeline to inspect.
 */
export function AssessmentIntegritySection({ query, onOpen }) {
  if (query.isLoading) return null
  if (query.isError) {
    return (
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Assessment integrity</h2>
        <p className="rounded-xl border border-border/70 bg-card p-4 text-sm text-muted-foreground">
          The integrity log could not be loaded.
        </p>
      </section>
    )
  }
  const data = query.data
  const attempts = data?.attempts ?? []
  const risk = INTEGRITY_RISK[data?.risk]

  return (
    <section className="space-y-2" aria-labelledby="integrity-heading">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="integrity-heading" className="text-sm font-semibold text-foreground">
          Assessment integrity
        </h2>
        {risk ? (
          <Badge variant="outline" className={cn("gap-1 text-[11px]", risk.className)}>
            <ShieldAlert className="size-3" aria-hidden="true" />
            {risk.label}
          </Badge>
        ) : null}
      </div>

      <div className="space-y-4 rounded-xl border border-border/70 bg-card p-4 sm:p-5">
        {attempts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No integrity flags. This learner has not left an assessment or tried to copy or paste during one.
          </p>
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <Stat label="Flagged attempts" value={data.flaggedAttempts} />
              <Stat label="Tab / window exits" value={data.totalExits} alert={data.totalExits >= 3} />
              <Stat label="Copy / paste tries" value={data.copyPasteTries} alert={data.copyPasteTries >= 5} />
              <Stat label="Ended with 0" value={data.forfeits} alert={data.forfeits > 0} />
              <Stat label="Time away" value={formatAway(data.totalAwaySeconds)} />
            </dl>
            <p className="text-xs text-muted-foreground">
              These are signals to follow up on, not proof. A learner can lose focus by accident,
              for example from a system notification.
            </p>

            <ul className="divide-y divide-border/60 rounded-lg border border-border/70">
              {attempts.map((attempt) => (
                <li key={attempt.attemptId}>
                  <details className="group">
                    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 hover:bg-muted/40">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {attempt.examTitle ?? "Assessment"}
                          {attempt.attemptNumber ? ` · try ${attempt.attemptNumber}` : ""}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {formatWhen(attempt.startedAt)}
                          {attempt.percentage != null ? ` · scored ${Math.round(Number(attempt.percentage))}%` : ""}
                        </span>
                      </span>
                      <IntegrityAttemptBadges attempt={attempt} />
                    </summary>
                    <div className="border-t border-border/60 bg-muted/20 px-3 py-2.5">
                      <IntegrityTimeline events={attempt.events} />
                      {onOpen ? (
                        <button
                            type="button"
                            onClick={() => onOpen(attempt.attemptId)}
                            className="mt-2 text-xs font-semibold text-primary underline-offset-2 hover:underline"
                        >
                          Open this attempt&apos;s answers
                        </button>
                      ) : null}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}

export default AssessmentIntegritySection
