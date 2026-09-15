import { useMemo, useState } from "react"
import { useLocation, useNavigate, useOutletContext } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  ArrowRight,
  BookOpen,
  Brain,
  CalendarDays,
  Check,
  GraduationCap,
  Repeat2,
  Target,
} from "@/components/icons"
import { Button } from "@/components/ui/button"
import { BentoHeading, BentoSkeleton, BentoTile } from "@/components/commons/bento.jsx"
import { formatWhen, minutesOfDay, toDateKey } from "@/lib/study-schedule.js"
import { EVENT_TYPE_LABELS, describeEvent, eventKind } from "@/lib/study-plan-events.js"
import { returnState } from "@/lib/assessment-return"
import { createPlanMockExam } from "@/services/recallService.js"
import { getLessonById } from "@/services/learnerService.js"
import {
  STUDY_PLAN_QUERY_KEY,
  STUDY_PLAN_TASKS_QUERY_KEY,
  getMyStudyPlans,
  getStudyPlanTaskStatuses,
  setStudyPlanTaskStatus,
} from "@/services/studyPlanService.js"
import { startPomodoro } from "@/lib/pomodoro-store.js"

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

/** What an overall plan calls itself -- never shown as a certification name. */
const OVERALL_LABEL = "All certifications"

function formatDay(dateKey) {
  const date = new Date(`${dateKey}T00:00:00`)
  if (Number.isNaN(date.getTime())) return dateKey
  return date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })
}

/**
 * Where a session's button goes, or null when there is nowhere to go.
 *
 * A mock exam is built on the spot from the lessons already finished -- the
 * certification's official mock stays locked until the curriculum is done, so
 * linking to it would lead nowhere. Anything tied to a lesson opens that lesson.
 */
function actionFor(event) {
  const kind = eventKind(event)

  if (kind === "mock") {
    return event.certificationId ? { label: "Start mock exam", mockFor: event.certificationId } : null
  }

  if ((kind === "lesson" || kind === "review" || kind === "quiz") && event.lessonId) {
    return {
      label: kind === "lesson" ? "Open lesson" : "Open topic",
      lesson: {
        lessonId: event.lessonId,
        middleCategoryId: event.middleCategoryId ?? null,
        certificationId: event.certificationId ?? null,
      },
    }
  }

  return null
}

/**
 * Everything scheduled for today, across every study plan the learner follows
 * and every certification in them -- the same sessions the study calendar shows
 * for today, in time order, each labelled with its certification.
 *
 * Deliberately not filtered by the certification picker on the analytics board:
 * a learner studying for several exams wants one list of what to do today, and
 * hiding the other certifications' sessions made their tasks look missing.
 *
 * The plans are generated in the browser and stored whole, so events are read
 * back out of each `schedule.events` rather than recomputed -- recomputing would
 * let this tile and the calendar disagree about the same day.
 *
 * @param onCreatePlan  opens the generator in place. Passed by the analytics
 *   board, which owns it; without it the tile falls back to linking there.
 */
export function TodaysPlanTile({ onCreatePlan }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [mock, setMock] = useState({ building: null, error: null })

  /* The calendar's query, so both read the same cached list of plans. */
  const plansQuery = useQuery({
    queryKey: [STUDY_PLAN_QUERY_KEY, "mine"],
    queryFn: getMyStudyPlans,
    staleTime: 60_000,
  })

  /* What is already done: tasks marked complete, and lessons the learner has
     finished anywhere in the app -- a lesson read from the curriculum page
     should not still sit on today's list as something to do. */
  const queryClient = useQueryClient()
  const outlet = useOutletContext() ?? {}
  const statusesQuery = useQuery({
    queryKey: [STUDY_PLAN_TASKS_QUERY_KEY],
    queryFn: getStudyPlanTaskStatuses,
    staleTime: 60_000,
  })
  const doneTasks = useMemo(
    () =>
      new Set(
        (statusesQuery.data ?? [])
          .filter((row) => row.status === "COMPLETED")
          .map((row) => `${row.planId}:${row.eventId}`)
      ),
    [statusesQuery.data]
  )
  const completedLessonIds = useMemo(
    () =>
      new Set(
        (outlet.data?.lessons ?? []).filter((lesson) => lesson.completed).map((lesson) => String(lesson.lessonId))
      ),
    [outlet.data?.lessons]
  )
  const markDone = useMutation({
    mutationFn: (event) => setStudyPlanTaskStatus({ planId: event.planId, eventId: event.id, status: "COMPLETED" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [STUDY_PLAN_TASKS_QUERY_KEY] }),
  })
  const isDone = (event) =>
    doneTasks.has(event.key) ||
    (eventKind(event) === "lesson" && event.lessonId != null && completedLessonIds.has(String(event.lessonId)))

  /**
   * Opens a lesson where lessons are read now: its topic page, with the outline
   * and the AI tutor. `/learner/lessons/:id` is the older standalone page. Plans
   * made before sessions carried their topic look it up from the lesson first;
   * the old page is only the fallback when that cannot be done.
   */
  async function openLesson({ lessonId, middleCategoryId, certificationId: certId }) {
    let topicId = middleCategoryId
    if (!topicId && certId) {
      try {
        topicId = (await getLessonById(lessonId))?.middleCategoryId ?? null
      } catch {
        topicId = null
      }
    }
    navigate(
      topicId && certId
        ? `/learner/learning/${certId}/topics/${topicId}?lesson=${lessonId}`
        : `/learner/lessons/${lessonId}`
    )
  }

  async function startMock(key, id) {
    setMock({ building: key, error: null })
    try {
      const exam = await createPlanMockExam({ certificationId: id })
      navigate(`/learner/assessments/${exam.examId}`, { state: returnState(location) })
    } catch (error) {
      setMock({
        building: null,
        error: {
          key,
          message: error?.response?.data?.message ?? error?.message ?? "Could not build the mock exam.",
        },
      })
    }
  }

  const { todaysEvents, nextEvent, planCount } = useMemo(() => {
    const activePlans = (plansQuery.data ?? []).filter((row) => row?.status === "ACTIVE" && row?.schedule)

    /* Every plan's sessions on one list, each carrying what the tile needs
       from its plan: which plan (for task status), which certification (an
       overall plan stamps it per event, a single plan holds it on the row),
       and the technique. */
    const events = activePlans.flatMap((row) =>
      (Array.isArray(row.schedule.events) ? row.schedule.events : []).map((event) => {
        const label = event.certification ?? row.schedule.certification ?? null
        return {
          ...event,
          key: `${row.planId}:${event.id}`,
          planId: row.planId,
          certificationId: event.certificationId ?? row.certificationId ?? null,
          certificationLabel: label && label !== OVERALL_LABEL ? label : null,
          technique: event.technique ?? row.schedule.selectedTechniqueInfo?.id ?? null,
        }
      })
    )

    const todayKey = toDateKey(new Date())
    const byTime = (a, b) => (minutesOfDay(a.at) ?? 24 * 60) - (minutesOfDay(b.at) ?? 24 * 60)

    const todays = events.filter((event) => event.dateKey === todayKey).sort(byTime)

    /* String comparison rather than Date parsing: the keys are zero-padded
       YYYY-MM-DD, so lexicographic order is chronological order. */
    const upcoming = events
      .filter((event) => event.dateKey > todayKey)
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey) || byTime(a, b))

    return { todaysEvents: todays, nextEvent: upcoming[0] ?? null, planCount: activePlans.length }
  }, [plansQuery.data])

  const certificationCount = new Set(todaysEvents.map((event) => event.certificationLabel).filter(Boolean)).size
  const doneCount = todaysEvents.filter(isDone).length

  return (
    <BentoTile col={3} row={2} className="!p-0">
      <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <BentoHeading
            title="today's plan"
            hint={
              todaysEvents.length > 0
                ? `${doneCount} of ${todaysEvents.length} ${todaysEvents.length === 1 ? "task" : "tasks"} done today${
                    certificationCount > 1 ? ` across ${certificationCount} certifications` : ""
                  }.`
                : "Everything your study plans schedule for today, across all certifications."
            }
          />

          {planCount > 0 ? (
            <button
              type="button"
              onClick={() => navigate("/learner/plan")}
              className="mt-0.5 shrink-0 text-xs font-semibold text-primary underline decoration-dotted underline-offset-4 hover:text-primary/80"
            >
              view calendar
            </button>
          ) : null}
        </div>

        {plansQuery.isLoading ? (
          <BentoSkeleton rows={2} />
        ) : planCount === 0 ? (
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
              const action = actionFor(event)
              const when = formatWhen(event)
              const done = isDone(event)

              return (
                <li
                  key={event.key}
                  className={`flex items-start gap-3 rounded-rb-tile border border-border/60 p-3 ${done ? "opacity-60" : ""}`}
                >
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                      done ? "bg-rb-feather text-white" : meta.tone
                    }`}
                  >
                    {done ? <Check className="size-4" aria-hidden="true" /> : <Icon className="size-4" aria-hidden="true" />}
                  </span>

                  <div className="min-w-0 flex-1">
                    {/* Which certification this task is for -- the list mixes
                        every certification, so the name is part of the task. */}
                    {event.certificationLabel ? (
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                        {event.certificationLabel}
                      </p>
                    ) : null}

                    <p className={`text-sm font-semibold leading-5 text-foreground ${done ? "line-through" : ""}`}>
                      {event.title}
                    </p>

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

                    {done ? (
                      <p className="mt-2 text-xs font-semibold text-rb-feather-ink">Done</p>
                    ) : null}

                    <div className={`mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 ${done ? "hidden" : ""}`}>
                      {action ? (
                        <button
                          type="button"
                          disabled={mock.building != null}
                          onClick={() =>
                            action.mockFor ? startMock(event.key, action.mockFor) : openLesson(action.lesson)
                          }
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 disabled:opacity-60"
                        >
                          {mock.building === event.key ? "Building your mock exam…" : action.label}
                          <ArrowRight className="size-3" aria-hidden="true" />
                        </button>
                      ) : null}

                      {/* A Pomodoro-plan lesson can be started from here: the
                          timer starts and the lesson opens beside it. */}
                      {action?.lesson && kind === "lesson" && event.technique === "pomodoro" ? (
                        <button
                          type="button"
                          onClick={() => {
                            startPomodoro({
                              title: event.lessonTitle ?? event.title,
                              lessonId: event.lessonId ?? null,
                              planId: event.planId ?? null,
                              eventId: event.id ?? null,
                            })
                            openLesson(action.lesson)
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-rb-fox-lip hover:text-rb-fox"
                        >
                          Start pomodoro
                          <ArrowRight className="size-3" aria-hidden="true" />
                        </button>
                      ) : null}

                      {/* Ticks the task off, for work done outside the app's
                          own flows -- a review on paper, a mock taken elsewhere. */}
                      {kind !== "exam" ? (
                        <button
                          type="button"
                          disabled={markDone.isPending}
                          onClick={() => markDone.mutate(event)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-60"
                        >
                          <Check className="size-3" aria-hidden="true" />
                          Mark done
                        </button>
                      ) : null}
                    </div>

                    {mock.error?.key === event.key ? (
                      <p className="mt-1 text-xs leading-5 text-destructive">{mock.error.message}</p>
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
                Next up: <span className="font-semibold text-foreground">{nextEvent.title}</span>
                {nextEvent.certificationLabel ? ` (${nextEvent.certificationLabel})` : ""} on{" "}
                {formatDay(nextEvent.dateKey)}.
              </p>
            ) : (
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Every session on your plans has passed — build a new one to keep a schedule.
              </p>
            )}
          </div>
        )}
      </div>
    </BentoTile>
  )
}

export default TodaysPlanTile
