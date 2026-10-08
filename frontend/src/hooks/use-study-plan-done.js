import { useCallback, useMemo } from "react"
import { useOutletContext } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"

import { eventKind } from "@/lib/study-plan-events.js"
import { STUDY_PLAN_TASKS_QUERY_KEY, getStudyPlanTaskStatuses } from "@/services/studyPlanService.js"

export function useStudyPlanDone() {
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

  return useCallback(
    (event) =>
      doneTasks.has(`${event.planId}:${event.id}`) ||
      (eventKind(event) === "lesson" && event.lessonId != null && completedLessonIds.has(String(event.lessonId))),
    [doneTasks, completedLessonIds]
  )
}
