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
    weekday: "long",
    day: "numeric",
    month: "long",
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
      <BentoHeading
        icon={CalendarDays}
        kicker="Exam Day"
        title="exam countdown"
        hint="Days left against your plan's target date."
      />

      {isLoading ? (
        <BentoSkeleton rows={1} />
      ) : !examDate ? (
        <div className="flex flex-1 flex-col justify-center">
          <p className="text-sm font-medium text-foreground">No exam date yet</p>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Create a study plan and the countdown starts from its target exam date.
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-center">
          <div className="flex items-baseline gap-2">
            <span className="font-rb-display text-5xl font-black leading-none tabular-nums text-foreground">
              {today ? "today" : Math.abs(days)}
            </span>

            {today ? null : (
              <span className="text-sm font-bold text-muted-foreground">
                {Math.abs(days) === 1
                  ? past ? "day ago" : "day to go"
                  : past ? "days ago" : "days to go"}
              </span>
            )}
          </div>

          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
            {formatExamDate(examDate)}
          </p>
        </div>
      )}
    </BentoTile>
  )
}
