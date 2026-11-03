import { CalendarDays } from "@/components/icons"
import { BentoHeading, BentoSkeleton, BentoTile } from "@/components/commons/bento.jsx"
import { useCertificationStudyPlan } from "@/components/learner/use-certification-study-plan.js"

function parseDay(value) {
  if (!value) return null
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function examDateFor(plan, certificationId) {
  const entries = plan?.schedule?.certificationPlans

  if (!Array.isArray(entries)) {
    return null
  }

  const match = entries.find(
    (entry) => String(entry?.certificationId) === String(certificationId)
  )

  return match?.targetExamDate ?? null
}

function daysUntil(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((date - today) / 86_400_000)
}

function formatExamDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function ExamCountdownTile({ certificationId }) {
  const { plan, isLoading } = useCertificationStudyPlan(certificationId)

  const examDate = parseDay(
    examDateFor(plan, certificationId) ?? plan?.schedule?.targetExamDate
  )
  const days = examDate ? daysUntil(examDate) : null
  const past = days !== null && days < 0
  const today = days === 0

  return (
    <BentoTile col={3} row={2}>
      <BentoHeading icon={CalendarDays} kicker="Exam Day" title="Exam countdown" />

      {isLoading ? (
        <BentoSkeleton rows={1} />
      ) : !examDate ? (
        <div className="flex flex-1 flex-col justify-center">
          <p className="text-sm font-semibold text-foreground">No exam date yet</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Set a target date in your study plan to start the countdown.
          </p>
        </div>
      ) : past ? (
        <div className="flex flex-1 flex-col justify-center">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
            Your exam date has passed
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
            {formatExamDate(examDate)} · {Math.abs(days)} day{Math.abs(days) === 1 ? "" : "s"} ago
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Set a new date in your study plan.</p>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-between gap-3">
          <p className="leading-none">
            <span className="font-rb-display text-4xl font-black tabular-nums text-foreground">
              {today ? "Today" : days}
            </span>
            {today ? null : (
              <span className="ml-1.5 text-xs font-bold text-muted-foreground">
                day{days === 1 ? "" : "s"} to go
              </span>
            )}
          </p>
          <p className="flex items-center gap-1.5 text-right text-xs font-medium text-muted-foreground">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
            {formatExamDate(examDate)}
          </p>
        </div>
      )}
    </BentoTile>
  )
}
