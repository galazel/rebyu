import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import { getCurrentLearnerIdentity } from "@/services/learnerService.js"
import { getLearnerEntitlements } from "@/services/subscriptionService.js"

export function useLearnerEntitlements(certificationId) {
  const identity = getCurrentLearnerIdentity()
  const learnerId = identity?.learnerId ?? null

  const query = useQuery({
    queryKey: ["learner-entitlements", learnerId, certificationId ?? null],
    queryFn: () => getLearnerEntitlements(learnerId, certificationId),
    enabled: learnerId != null,
    staleTime: 60_000,
    retry: 1,
  })

  return useMemo(() => {
    const data = query.data
    const features = new Set(Array.isArray(data?.features) ? data.features : [])
    return {
      isLoading: learnerId != null && query.isLoading,
      isError: query.isError,
      accessSource: data?.accessSource ?? "FREE",
      personalProActive: Boolean(data?.personalProActive),
      institutionalActive: Boolean(data?.institutionalActive),
      hasPremium: (data?.accessSource ?? "FREE") !== "FREE",
      hasFeature: (code) => features.has(code),
      features,
      personalPlanCode: data?.personalPlanCode ?? "FREE",
      personalStatus: data?.personalStatus ?? null,
      currentPeriodEnd: data?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: Boolean(data?.cancelAtPeriodEnd),
      awaitingApproval: Boolean(data?.awaitingApproval),
      isFree: learnerId != null && !query.isLoading && !query.isError && (data?.accessSource ?? "FREE") === "FREE",
      aiGenerationsUsedToday: Number(data?.aiGenerationsUsedToday ?? 0),
      aiGenerationDailyLimit: Number(data?.aiGenerationDailyLimit ?? 0),
      refetch: query.refetch,
    }
  }, [query.data, query.isLoading, query.isError, query.refetch, learnerId])
}
