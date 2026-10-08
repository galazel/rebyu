import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  OVERALL_CERTIFICATION_LABEL,
  StudyPlanGenerator,
} from "@/pages/learner/learning/learner-study-plan.jsx"
import {
  STUDY_PLAN_QUERY_KEY,
  getActiveStudyPlan,
  getOverallStudyPlan,
  saveStudyPlan,
} from "@/services/studyPlanService.js"


function certificationIdOf(certification) {
  return String(
    certification?.certificationId ??
      certification?.id ??
      certification?.certification?.certificationId ??
      ""
  )
}

export function useStudyPlanGate() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [planFor, setPlanFor] = useState(null)

  const savePlanMutation = useMutation({
    mutationFn: (plan) =>
      saveStudyPlan({
        certificationId: planFor?.certificationId
          ? Number(planFor.certificationId)
          : null,
        goal: plan?.courseGoal ?? "Complete a full reviewer",
        schedule: plan,
      }),
    onSuccess: async () => {
      const next = planFor?.next

      setPlanFor(null)

      toast.success("Study plan saved", {
        description: "Your schedule is on the study calendar.",
      })

      queryClient.removeQueries({ queryKey: [STUDY_PLAN_QUERY_KEY] })

      if (next) navigate(next)
    },
    onError: (error) => {
      toast.error("Could not save your study plan", {
        description: error?.response?.data?.message ?? error?.message ?? "Please try again.",
      })
    },
  })

  async function existingPlan(certificationId) {
    const scoped = await queryClient.fetchQuery({
      queryKey: [STUDY_PLAN_QUERY_KEY, String(certificationId ?? "")],
      queryFn: () => getActiveStudyPlan(certificationId),
      staleTime: 60_000,
    })
    if (scoped?.planId) return scoped

    const overall = await queryClient.fetchQuery({
      queryKey: [STUDY_PLAN_QUERY_KEY, "overall"],
      queryFn: getOverallStudyPlan,
      staleTime: 60_000,
    })
    return overall?.planId ? overall : null
  }

  async function openCertification(certification, options = {}) {
    const certificationId = certificationIdOf(certification)
    const path = options.to ?? `/learner/learning/${certificationId}`

    if (!options.diagnosticCompleted) {
      navigate(path)
      return
    }


    const cachedScoped = queryClient.getQueryData([STUDY_PLAN_QUERY_KEY, String(certificationId ?? "")])
    const cachedOverall = queryClient.getQueryData([STUDY_PLAN_QUERY_KEY, "overall"])
    const knownNoPlan =
      cachedScoped !== undefined && cachedOverall !== undefined
      && !cachedScoped?.planId && !cachedOverall?.planId

    if (!knownNoPlan) {
      navigate(path)
      existingPlan(certificationId).catch(() => {})
      return
    }

    openOverallStudyPlan(path)
  }

  function openOverallStudyPlan(next = null) {
    setPlanFor({
      certificationId: null,
      overall: true,
      title: OVERALL_CERTIFICATION_LABEL,
      next: typeof next === "string" ? next : null,
    })
  }

  function closeStudyPlan() {
    setPlanFor(null)
  }

  const dialog = (
    <Dialog open={planFor != null} onOpenChange={(next) => (next ? null : closeStudyPlan())}>
      <DialogContent
        aria-describedby={undefined}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[min(1180px,calc(100vw-4rem))]"
      >
        <DialogHeader>
          <DialogTitle>{planFor?.overall ? "Overall study plan" : "Study plan"}</DialogTitle>
        </DialogHeader>

        {planFor ? (
          <StudyPlanGenerator
            lockedCertification={planFor.overall ? undefined : planFor.title}
            certificationId={planFor.overall ? null : planFor.certificationId}
            overall={Boolean(planFor.overall)}
            generating={savePlanMutation.isPending}
            onPlanGenerated={(plan) => savePlanMutation.mutate(plan)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )

  return {
    openCertification,
    openOverallStudyPlan,
    closeStudyPlan,
    planFor,
    studyPlanDialog: dialog,
  }
}
