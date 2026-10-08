import { useQuery } from "@tanstack/react-query"

import {
  STUDY_PLAN_QUERY_KEY,
  getActiveStudyPlan,
  getOverallStudyPlan,
} from "@/services/studyPlanService.js"

export function useCertificationStudyPlan(certificationId) {
  const scopedQuery = useQuery({
    queryKey: [STUDY_PLAN_QUERY_KEY, String(certificationId ?? "")],
    queryFn: () => getActiveStudyPlan(certificationId),
    enabled: Boolean(certificationId),
    staleTime: 60_000,
  })

  const overallQuery = useQuery({
    queryKey: [STUDY_PLAN_QUERY_KEY, "overall"],
    queryFn: getOverallStudyPlan,
    enabled:
      Boolean(certificationId) && scopedQuery.isSuccess && !scopedQuery.data?.planId,
    staleTime: 60_000,
  })

  const overallPlan = overallQuery.data
  const covered =
    overallPlan?.planId != null && coversCertification(overallPlan, certificationId)

  return {
    plan: scopedQuery.data?.planId ? scopedQuery.data : covered ? overallPlan : null,
    hasAnyPlan: Boolean(scopedQuery.data?.planId || overallPlan?.planId),
    isLoading: scopedQuery.isLoading || overallQuery.isLoading,
    isError: scopedQuery.isError || overallQuery.isError,
    isOverall: !scopedQuery.data?.planId && covered,
  }
}

export function coversCertification(plan, certificationId) {
  const ids = plan?.schedule?.certificationIds

  if (!Array.isArray(ids)) {
    return true
  }

  return ids.map(String).includes(String(certificationId))
}
