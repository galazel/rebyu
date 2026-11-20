import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { StudyActivityDialog } from "@/components/learner/study-activity-dialog.jsx"
import { usePomodoro } from "@/lib/pomodoro-store.js"
import { isDue, isStale } from "@/lib/study-schedule.js"
import { SESSION_ACTIVITIES, studyActivityFor } from "@/lib/study-activity.js"
import {
  STUDY_PLAN_QUERY_KEY,
  STUDY_PLAN_TASKS_QUERY_KEY,
  getMyStudyPlans,
  getStudyPlanTaskStatuses,
  setStudyPlanTaskStatus,
} from "@/services/studyPlanService.js"


const TICK_MS = 30_000

const SESSION_COOLDOWN_MS = 10 * 60_000

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

        // Only the activities that run as a session interrupt the learner; a
        // plain lesson day is opened from the plan instead of popping a dialog.
        const activity = studyActivityFor(event)
        if (!SESSION_ACTIVITIES.has(activity)) continue

        candidates.push({
          key,
          planId: plan.planId,
          event,
          activity,
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

  return (
    <StudyActivityDialog
      activity={activeTask.activity}
      task={activeTask}
      now={now}
      onFinish={finishTask}
    />
  )
}

export default StudyActivityHost
