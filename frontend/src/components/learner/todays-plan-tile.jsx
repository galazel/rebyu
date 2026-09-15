import { useMemo } from "react"
import { useNavigate } from "react-router-dom"

import {
  ArrowRight,
  BookOpen,
  Brain,
  CalendarDays,
  GraduationCap,
  Repeat2,
  Target,
} from "@/components/icons"
import { Button } from "@/components/ui/button"
import { BentoHeading, BentoSkeleton, BentoTile } from "@/components/commons/bento.jsx"
import { useCertificationStudyPlan } from "@/components/learner/use-certification-study-plan.js"
import { formatWhen, toDateKey } from "@/lib/study-schedule.js"
import { EVENT_TYPE_LABELS, describeEvent, eventKind } from "@/lib/study-plan-events.js"

/* How each kind of session looks. Every entry carries its own words -- a mock
   exam and a lesson are different work, and the icon's colour alone would hide
   that. */
const EVENT_META = {
  lesson: { icon: BookOpen, tone: "bg-rb-feather-wash text-rb-feather-ink" },
  review: { icon: Repeat2, tone: "bg-rb-leaf-wash text-rb-leaf-lip" },
  quiz: { icon: Brain, tone: "bg-rb-bee-wash text-rb-bee-ink" },
  mock: { icon: Target, tone: "bg-rb-fox-wash text-rb-fox-lip" },
  "catch-up": { icon: CalendarDays, tone: "bg-muted text-muted-foreground" },
  exam: { icon: GraduationCap, tone: "bg-rb-cardinal-wash text-rb-cardinal-lip" },
}

const TECHNIQUE_NAMES = {
  "spaced-repetition": "Spaced repetition",
  "active-recall": "Active recall",
  pomodoro: "Pomodoro",
}

function formatDay(dateKey) {
  const date = new Date(`${dateKey}T00:00:00`)
  if (Number.isNaN(date.getTime())) return dateKey
  return date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })
}

/**
 * Where a session's button goes, or null when there is nowhere to go.
 *
 * A mock exam lives with the certification's assessments, so it opens the
 * curriculum page -- the same place "go to assessments" leads. Anything tied to
 * a lesson opens that lesson.
 */
function actionFor(event, certificationId) {
  const kind = eventKind(event)

  if (kind === "mock") {
    const id = event.certificationId ?? certificationId
    return id ? { label: "Find a mock exam", to: `/learner/learning/${id}` } : null
  }

  if ((kind === "lesson" || kind === "review" || kind === "quiz") && event.lessonId) {
    return { label: kind === "lesson" ? "Open lesson" : "Open topic", to: `/learner/lessons/${event.lessonId}` }
  }

  return null
}

/**
 * What the learner's study plan says to do today.
 *
 * The plan is generated in the browser and stored whole, so the events are read
 * back out of `schedule.events` rather than recomputed -- recomputing would let
 * this tile and the study calendar disagree about the same day.
 *
 * Each session says what to actually do (its `detail`) and links to where to do
 * it. An overall plan holds several certifications' sessions, so only this
 * certification's are shown -- the tile sits beside a certification picker.
 *
 * @param onCreatePlan  opens the generator in place. Passed by the analytics
 *   board, which owns it; without it the tile falls back to linking there.
 */
export function TodaysPlanTile({ certificationId, onCreatePlan }) {
  const navigate = useNavigate()

  const { plan, isLoading, isOverall } = useCertificationStudyPlan(certificationId)

  const { todaysEvents, nextEvent, hasEvents } = useMemo(() => {
    const all = plan?.schedule?.events
    if (!Array.isArray(all) || all.length === 0) {
      return { todaysEvents: [], nextEvent: null, hasEvents: false }
    }

    const events = all.filter(
      (event) =>
        event.certificationId == null ||
        certificationId == null ||
        String(event.certificationId) === String(certificationId)
    )

    const todayKey = toDateKey(new Date())
    const todays = events.filter((event) => event.dateKey === todayKey)

    /* String comparison rather than Date parsing: the keys are zero-padded
       YYYY-MM-DD, so lexicographic order is chronological order. */
    const upcoming = events
      .filter((event) => event.dateKey > todayKey)
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey))

    return { todaysEvents: todays, nextEvent: upcoming[0] ?? null, hasEvents: events.length > 0 }
  }, [plan, certificationId])

  const techniqueName = TECHNIQUE_NAMES[plan?.schedule?.selectedTechniqueInfo?.id] ?? null

  return (
    <BentoTile col={3} row={2} className="!p-0">
      <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <BentoHeading
            title="today's plan"
            hint={
              techniqueName
                ? `${isOverall ? "From your overall plan" : "Your plan"} · studying with ${techniqueName.toLowerCase()}.`
                : isOverall
                  ? "From your overall study plan, which covers this certification."
                  : "What your study plan has scheduled for today."
            }
          />

          {plan ? (
            <button
              type="button"
              onClick={() => navigate("/learner/plan")}
              className="mt-0.5 shrink-0 text-xs font-semibold text-primary underline decoration-dotted underline-offset-4 hover:text-primary/80"
            >
              view calendar
            </button>
          ) : null}
        </div>

        {isLoading ? (
          <BentoSkeleton rows={2} />
        ) : !hasEvents ? (
          <div className="mt-4 flex flex-1 flex-col justify-center">
            <p className="text-sm font-medium text-foreground">No study plan yet</p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Create one and this shows the topics it schedules for each day.
            </p>

            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-fit"
              onClick={onCreatePlan ?? (() => navigate("/learner/analytics?plan=1"))}
            >
              Create study plan
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        ) : todaysEvents.length > 0 ? (
          <ul className="-mr-2 mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-2">
            {todaysEvents.map((event) => {
              const kind = eventKind(event)
              const meta = EVENT_META[kind] ?? EVENT_META.lesson
              const Icon = meta.icon
              const action = actionFor(event, certificationId)
              const when = formatWhen(event)

              return (
                <li key={event.id} className="flex items-start gap-3 rounded-rb-tile border border-border/60 p-3">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${meta.tone}`}>
                    <Icon className="size-4" aria-hidden="true" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-5 text-foreground">{event.title}</p>

                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      <span className="font-medium">{EVENT_TYPE_LABELS[kind] ?? kind}</span>
                      {event.minutes ? (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>about {event.minutes} min</span>
                        </>
                      ) : null}
                      {when ? (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{when}</span>
                        </>
                      ) : null}
                    </p>

                    {/* What to actually do. Without it "Mock exam checkpoint"
                        was a name with no instruction behind it. */}
                    <p className="mt-1.5 text-xs leading-5 text-foreground/80">{describeEvent(event)}</p>

                    {action ? (
                      <button
                        type="button"
                        onClick={() => navigate(action.to)}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80"
                      >
                        {action.label}
                        <ArrowRight className="size-3" aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="mt-4 flex flex-1 flex-col justify-center">
            <p className="text-sm font-medium text-foreground">Nothing scheduled today</p>

            {nextEvent ? (
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Next up: <span className="font-semibold text-foreground">{nextEvent.title}</span> on{" "}
                {formatDay(nextEvent.dateKey)}.
              </p>
            ) : (
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Every session on this plan has passed — build a new one to keep a schedule.
              </p>
            )}
          </div>
        )}
      </div>
    </BentoTile>
  )
}

export default TodaysPlanTile
