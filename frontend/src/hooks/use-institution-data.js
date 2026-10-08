import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import { getAllCertifications } from "@/services/certificationService"
import { getInstitutionPortalOverview } from "@/services/institutionService.js"

function asArray(value) {
  return Array.isArray(value) ? value : []
}

export function useInstitutionData(institutionId) {
  const enabled = institutionId != null

  const overviewQuery = useQuery({
    queryKey: ["institution-overview", institutionId],
    queryFn: getInstitutionPortalOverview,
    enabled,
    retry: 1,
  })

  const certificationsQuery = useQuery({
    queryKey: ["certifications"],
    queryFn: () => getAllCertifications(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const derived = useMemo(() => {
    const overview = overviewQuery.data ?? {}
    const institutionCerts = asArray(overview.institutionCerts)

    const certificationById = new Map(
      asArray(certificationsQuery.data).map((certification) => [
        certification.certificationId,
        certification,
      ])
    )

    const learnerById = new Map(
      asArray(overview.learners).map((learner) => [learner.learnerId, learner])
    )

    const institutionCertById = new Map(institutionCerts.map((cert) => [cert.institutionCertId, cert]))

    const groupByInstitutionCertLearnerId = new Map(
      asArray(overview.groupMemberships).map((membership) => [
        membership.institutionCertLearnerId,
        membership,
      ])
    )

    return {
      institutionCerts,
      institutionCertById,
      certificationById,
      invitations: asArray(overview.invitations),
      assignments: asArray(overview.assignments),
      learnerById,
      groupByInstitutionCertLearnerId,
    }
  }, [certificationsQuery.data, overviewQuery.data])

  const queries = [overviewQuery, certificationsQuery]

  return {
    ...derived,
    isLoading: queries.some((query) => query.isLoading),
    isError: queries.some((query) => query.isError),
    refetchAll: () => queries.forEach((query) => query.refetch()),
    overviewQuery,
    certificationsQuery,
  }
}

export function getLearnerDisplayName(learner) {
  if (!learner) return "Unknown learner"
  const full = [learner.firstName, learner.lastName].filter(Boolean).join(" ")
  return full || learner.username || `Learner #${learner.learnerId}`
}
