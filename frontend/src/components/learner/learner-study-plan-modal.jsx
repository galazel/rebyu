import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { CalendarDays, Check, ChevronLeft, ChevronRight, Sparkles } from "@/components/icons"

import { Button } from "@/components/ui/button"
import { STUDY_PLAN_QUERY_KEY, getMyStudyPlans } from "@/services/studyPlanService.js"
import { describeEvent } from "@/lib/study-plan-events.js"
import { useStudyPlanDone } from "@/hooks/use-study-plan-done.js"

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function dateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function buildMonth(viewDate) {
  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
  const start = new Date(first)
  start.setDate(first.getDate() - first.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return { date, key: dateKey(date), currentMonth: date.getMonth() === viewDate.getMonth() }
  })
}

function labelFor(event) {
  return event?.certification ?? event?.planLabel ?? "Study plan"
}

function formatDayLabel(value) {
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

export default function LearnerStudyPlanCalendarPage() {
  const [viewDate, setViewDate] = useState(new Date())
  const [movedToPlan, setMovedToPlan] = useState(false)
  const isDone = useStudyPlanDone()

  const planQuery = useQuery({
    queryKey: [STUDY_PLAN_QUERY_KEY, "mine"],
    queryFn: getMyStudyPlans,
    staleTime: 30_000,
  })

  const activePlans = useMemo(
    () => (planQuery.data ?? []).filter((row) => row?.status === "ACTIVE" && row?.schedule),
    [planQuery.data]
  )

  const events = useMemo(
    () =>
      activePlans.flatMap((row) =>
        (row.schedule?.events ?? []).map((event) => ({
          ...event,
          planId: row.planId,
          planLabel: row.schedule?.certification ?? row.goal ?? "Study plan",
        }))
      ),
    [activePlans]
  )

  const planRange = useMemo(() => {
    const starts = activePlans.map((row) => row.schedule?.calendarStart).filter(Boolean)
    const ends = activePlans.map((row) => row.schedule?.targetExamDate).filter(Boolean)
    if (starts.length === 0 || ends.length === 0) return null

    const from = starts.reduce((earliest, value) => (value < earliest ? value : earliest))
    const to = ends.reduce((latest, value) => (value > latest ? value : latest))

    return `${formatDayLabel(from)} → ${formatDayLabel(to)}`
  }, [activePlans])

  const planSummary = useMemo(() => {
    if (activePlans.length === 0) return "Personal study calendar"
    if (activePlans.length > 3) return `${activePlans.length} study plans`
    return activePlans
      .map((row) => row.schedule?.certification ?? row.goal ?? "Study plan")
      .join(" · ")
  }, [activePlans])

  const days = useMemo(() => buildMonth(viewDate), [viewDate])
  const today = dateKey(new Date())
  const eventsByDate = useMemo(() => events.reduce((result, event) => {
    const key = event.dateKey ?? event.key
    if (key) (result[key] ??= []).push(event)
    return result
  }, {}), [events])

  const earliestStart = useMemo(() => {
    const starts = activePlans.map((row) => row.schedule?.calendarStart).filter(Boolean)
    return starts.length ? starts.reduce((a, b) => (b < a ? b : a)) : null
  }, [activePlans])

  useEffect(() => {
    if (movedToPlan || !earliestStart) return
    setViewDate(new Date(`${earliestStart}T00:00:00`))
    setMovedToPlan(true)
  }, [earliestStart, movedToPlan])

  function changeMonth(amount) {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1))
  }

  const frameRef = useRef(null)
  const [frameHeight, setFrameHeight] = useState(null)

  useLayoutEffect(() => {
    function measure() {
      const top = frameRef.current?.getBoundingClientRect().top
      if (top == null) return
      setFrameHeight(Math.max(420, Math.round(window.innerHeight - top - 16)))
    }

    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  return (
    <div
      ref={frameRef}
      className="flex min-w-0 flex-col"
      style={{ height: frameHeight ?? undefined }}
    >
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border/70 pb-3">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-[-0.025em] text-foreground sm:text-2xl">
              {viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </h2>

            <p className="truncate text-xs text-muted-foreground">
              {planSummary}
              {planRange ? (
                <>
                  <span aria-hidden="true"> · </span>
                  <span>{planRange}</span>
                </>
              ) : null}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="flex w-fit items-center border border-border bg-card p-0.5">
              <Button variant="ghost" size="icon-sm" onClick={() => changeMonth(-1)} aria-label="Previous month"><ChevronLeft /></Button>
              <Button variant="ghost" size="sm" className="min-w-14" onClick={() => setViewDate(new Date())}>Today</Button>
              <Button variant="ghost" size="icon-sm" onClick={() => changeMonth(1)} aria-label="Next month"><ChevronRight /></Button>
            </div>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link to="/learner/analytics?plan=1">
                <Sparkles className="size-4" />
                {activePlans.length ? "Update plan" : "Create a plan"}
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-x-auto border-y border-border bg-card [scrollbar-width:thin]">
          <div className="flex min-h-0 min-w-[44rem] flex-1 flex-col">
            <div className="grid shrink-0 grid-cols-7 border-b border-border bg-muted">
              {DAY_NAMES.map((day, index) => (
                <div key={day} className={`px-3 py-1.5 text-[11px] font-semibold ${index === 0 || index === 6 ? "text-primary" : "text-muted-foreground"}`}>{day}</div>
              ))}
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-[repeat(6,minmax(0,1fr))]">
              {days.map((day, dayIndex) => {
                const dayEvents = eventsByDate[day.key] ?? []
                const isToday = day.key === today
                const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6
                return (
                  <div key={day.key} className={`flex min-h-0 flex-col overflow-hidden border-b border-r border-border/70 px-1.5 py-1 [&:nth-child(7n)]:border-r-0 ${dayIndex >= 35 ? "border-b-0" : ""} ${day.currentMonth ? (isWeekend ? "bg-muted/40" : "bg-card") : "bg-muted/20 text-muted-foreground"} ${isToday ? "shadow-[inset_0_3px_0_var(--primary)]" : ""}`}>
                    <div className="flex shrink-0 items-center justify-between">
                      <span className={`inline-flex size-5 items-center justify-center text-[11px] font-medium ${isToday ? "rounded-full bg-primary font-semibold text-primary-foreground" : ""}`}>{day.date.getDate()}</span>
                      {dayEvents.length ? <span className="text-[10px] font-medium text-muted-foreground">{dayEvents.length}</span> : null}
                    </div>

                    <div className="mt-0.5 min-h-0 flex-1 space-y-0.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {dayEvents.map((event, index) => {
                        const done = isDone(event)
                        return (
                        <div
                          key={`${event.planId ?? ""}-${event.id ?? event.title}-${index}`}
                          className={`border-l-2 px-1.5 py-0.5 text-[10px] font-medium leading-tight ${done ? "border-primary/40 bg-muted/50 text-muted-foreground" : "border-primary bg-primary/[0.06] text-foreground"}`}
                          title={`${event.title} · ${labelFor(event)}${done ? " · Done" : ""}\n${describeEvent(event)}`}
                        >
                          <p className={`flex items-center gap-1 ${done ? "line-through decoration-muted-foreground/70" : ""}`}>
                            {done ? <Check className="size-2.5 shrink-0 text-primary" aria-label="Done" /> : null}
                            <span className="truncate">{event.title}</span>
                          </p>

                          {activePlans.length > 1 ? (
                            <p className="truncate text-[9px] font-normal text-muted-foreground">
                              {labelFor(event)}
                            </p>
                          ) : null}
                        </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {activePlans.length === 0 && !planQuery.isLoading ? (
          <div className="flex shrink-0 items-center gap-3 px-1 py-3">
            <span className="flex size-9 items-center justify-center bg-accent text-primary"><CalendarDays className="size-4" /></span>
            <div>
              <p className="text-sm font-medium">No scheduled study tasks</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Create a study plan from Analytics — it needs your diagnostic result
                to decide what to schedule first.
              </p>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
