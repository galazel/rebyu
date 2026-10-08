import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CalendarDays } from "@/components/icons"
import { STUDY_PLAN_QUERY_KEY, getActiveStudyPlan } from "@/services/studyPlanService.js"

export function StudyPlanPrompt({ certificationId, enabled }) {
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)

  const planQuery = useQuery({
    queryKey: [STUDY_PLAN_QUERY_KEY, "active"],
    queryFn: () => getActiveStudyPlan(),
    enabled: Boolean(enabled),
    staleTime: 60_000,
  })

  const shouldOffer =
    Boolean(enabled) && planQuery.isSuccess && !planQuery.data?.planId && !dismissed

  useEffect(() => {
    if (planQuery.isError) setDismissed(true)
  }, [planQuery.isError])

  return (
    <Dialog open={shouldOffer} onOpenChange={(next) => (next ? null : setDismissed(true))}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Turn this into a study plan</DialogTitle>
          <DialogDescription>
            Your diagnostic is done, so we know which topics to put first. A study
            plan schedules them across the days before your exam.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:justify-start">
          <Button
            className="gap-2"
            onClick={() => {
              setDismissed(true)
              navigate(
                certificationId != null
                  ? `/learner/analytics?certification=${certificationId}&plan=1`
                  : "/learner/analytics?plan=1"
              )
            }}
          >
            <CalendarDays className="size-4" aria-hidden="true" />
            Create study plan
          </Button>

          <Button variant="ghost" onClick={() => setDismissed(true)}>
            Maybe later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default StudyPlanPrompt
