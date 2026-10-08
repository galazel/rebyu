import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

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
import { usePomodoro } from "@/lib/pomodoro-store.js"
import { formatWhen, isDue, isStale } from "@/lib/study-schedule.js"
import {
  STUDY_PLAN_QUERY_KEY,
  STUDY_PLAN_TASKS_QUERY_KEY,
  getMyStudyPlans,
  getStudyPlanTaskStatuses,
  setStudyPlanTaskStatus,
} from "@/services/studyPlanService.js"


const TICK_MS = 30_000

const SESSION_COOLDOWN_MS = 10 * 60_000

const ACTIVITY_TITLES = {
  "pomodoro": "Pomodoro session",
  "active-recall": "Active recall",
  "spaced-repetition": "Spaced repetition review",
}

export function StudyActivityHost() {
  const queryClient = useQueryClient()
  const pomodoro = usePomodoro()

  const plansQuery = useQuery({
    queryKey: [STUDY_PLAN_QUERY_KEY, "mine"],
    queryFn: getMyStudyPlans,
    staleTime: 5 * 60_000,
  })

  const statusesQuery = useQuery({
    queryKey: [STUDY_PLAN_TASKS_QUERY_KEY],
    queryFn: getStudyPlanTaskStatuses,
    staleTime: 60_000,
  })

  const [activeTask, setActiveTask] = useState(null)

  const firedRef = useRef(new Set())

  const [now, setNow] = useState(() => new Date())

  const [settledAt, setSettledAt] = useState(null)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), TICK_MS)
    return () => clearInterval(timer)
  }, [])

  const statusMutation = useMutation({
    mutationFn: setStudyPlanTaskStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [STUDY_PLAN_TASKS_QUERY_KEY] }),
    onError: (error) => {
      console.warn("Could not record study task status.", error)
    },
  })

  const statusByTask = useMemo(() => {
    const map = new Map()
    for (const row of statusesQuery.data ?? []) {
      map.set(`${row.planId}:${row.eventId}`, row.status)
    }
    return map
  }, [statusesQuery.data])

  const dueTask = useMemo(() => {
    if (!statusesQuery.isSuccess || pomodoro) return null
    if (settledAt != null && Date.now() - settledAt < SESSION_COOLDOWN_MS) return null

    const candidates = []

    for (const plan of plansQuery.data ?? []) {
      if (plan?.status !== "ACTIVE") continue

      for (const event of plan.schedule?.events ?? []) {
        if (!isDue(event, now)) continue
        if (isStale(event, now, plan.schedule?.generatedAt)) continue

        const key = `${plan.planId}:${event.id}`
        const status = statusByTask.get(key)

        if (status && status !== "PENDING") continue
        if (firedRef.current.has(key)) continue

        candidates.push({
          key,
          planId: plan.planId,
          event,
          certification: event.certification ?? plan.schedule?.certification ?? null,
          certificationId: event.certificationId ?? plan.certificationId ?? null,
        })
      }
    }

    candidates.sort((a, b) => String(a.event.at).localeCompare(String(b.event.at)))
    return candidates[0] ?? null
  }, [plansQuery.data, statusesQuery.isSuccess, statusByTask, pomodoro, now, settledAt])

  useEffect(() => {
    if (activeTask || !dueTask) return

    firedRef.current.add(dueTask.key)
    setActiveTask(dueTask)
    statusMutation.mutate({
      planId: dueTask.planId,
      eventId: dueTask.event.id,
      status: "IN_PROGRESS",
    })
     
  }, [activeTask, dueTask])

  const finishTask = useCallback(
    async (status) => {
      const task = activeTask
      setActiveTask(null)
      if (!task) return

      if (!status) return

      setSettledAt(Date.now())
      try {
        await statusMutation.mutateAsync({
          planId: task.planId,
          eventId: task.event.id,
          status,
        })
      } catch {
      }
       
    },
    [activeTask]
  )

  if (!activeTask) return null

  const technique = activeTask.event.technique
  const title = ACTIVITY_TITLES[technique] ?? "Scheduled study session"

  const fullWindow = technique === "spaced-repetition"

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) finishTask(null)
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
              {formatWhen(activeTask.event, now)}
              {activeTask.certification ? ` · ${activeTask.certification}` : ""}
            </DialogDescription>
          </DialogHeader>
        ) : (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>

            <DialogDescription>
              {formatWhen(activeTask.event, now)}
              {activeTask.certification ? ` · ${activeTask.certification}` : ""}
            </DialogDescription>
          </DialogHeader>
        )}

        {technique === "pomodoro" ? (
          <PomodoroStart
            task={activeTask}
            onStarted={() => finishTask(null)}
            onDismiss={() => finishTask(null)}
          />
        ) : technique === "active-recall" ? (
          <RecallSession
            task={activeTask.event}
            certificationId={activeTask.certificationId}
            onStarted={() => finishTask("COMPLETED")}
            onDismiss={() => finishTask(null)}
          />
        ) : technique === "spaced-repetition" ? (
          <SpacedRepetitionSession
            task={activeTask.event}
            certificationId={activeTask.certificationId}
            onComplete={() => finishTask("COMPLETED")}
            onDismiss={() => finishTask(null)}
          />
        ) : (
          <div className="space-y-3 py-2">
            <p className="text-sm font-medium text-foreground">
              {activeTask.event.title}
            </p>
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

export default StudyActivityHost
