import { useMemo } from "react"
import { Link, useOutletContext, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  InstitutionEmptyState,
  InstitutionErrorState,
  InstitutionLoadingSkeleton,
  InstitutionPageHeader,
  AccessWindowBadge,
} from "@/components/institution/institution-ui.jsx"
import { useInstitutionData } from "@/hooks/use-institution-data.js"
import { useUnpaidInvoicePaths } from "@/hooks/use-unpaid-invoice-paths.js"
import { getCertificationAnalytics } from "@/services/institutionService.js"
import { getCertificationSummary } from "@/services/certificationService.js"
import { CertificationViewer } from "./institution-certification-viewer-page.jsx"

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function StatTile({ label, value, hint }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xl font-semibold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}

/**
 * One certification the institution holds: how its own learners are doing, beside the
 * course outline and lessons (the same viewer the department head reads).
 */
export default function InstitutionCertificationDetailPage() {
  const { institutionCertId } = useParams()
  const numericInstitutionCertId = Number(institutionCertId)
  const { institution, institutionLoading, institutionError, refetchInstitution } =
    useOutletContext()
  const institutionId = institution?.institutionId
  const data = useInstitutionData(institutionId)
  const invoicePathFor = useUnpaidInvoicePaths(institutionId != null)

  const institutionCert = data.institutionCertById.get(numericInstitutionCertId)
  const certificationsQuery = useQuery({
    queryKey: ["certifications", "summary", institutionCert?.certificationId ?? null],
    queryFn: () => getCertificationSummary(institutionCert.certificationId),
    enabled: institutionCert?.certificationId != null,
    staleTime: 5 * 60 * 1000,
  })
  const analyticsQuery = useQuery({
    queryKey: ["certification-analytics", institutionCert?.certificationId ?? null],
    queryFn: () => getCertificationAnalytics(institutionCert.certificationId),
    enabled: institutionCert?.certificationId != null && institutionCert?.status !== "pending",
    staleTime: 60_000,
  })

  const certification = useMemo(
    () =>
      asArray(certificationsQuery.data).find(
        (c) => c.certificationId === institutionCert?.certificationId
      ) ?? null,
    [certificationsQuery.data, institutionCert?.certificationId]
  )

  if (institutionLoading || (institution && data.isLoading) || (institutionCert && certificationsQuery.isLoading)) {
    return <InstitutionLoadingSkeleton />
  }
  if (institutionError) return <InstitutionErrorState onRetry={refetchInstitution} />
  if (!institution || !institutionCert || !certification) {
    return (
      <InstitutionEmptyState
        title="Certification not found"
        description="This certification allocation could not be found."
      />
    )
  }

  if (institutionCert.status === "pending") {
    return (
      <InstitutionEmptyState
        title={`${certification.title ?? "This certification"} is awaiting payment`}
        description="Pay the invoice for this access to open its curriculum, departments, and assessments."
        action={
          <Button asChild size="sm">
            <Link to={invoicePathFor(institutionCert.certificationId)}>Open invoice</Link>
          </Button>
        }
      />
    )
  }

  const summary = analyticsQuery.data?.summary ?? null
  const used = institutionCert.usedSlots ?? 0
  const total = institutionCert.totalSlots ?? 0
  const show = (value, suffix = "") => (summary ? `${value}${suffix}` : "…")

  return (
    <div className="space-y-6">
      <InstitutionPageHeader
        title={certification.title}
        subtitle={certification.description || "No description available."}
        actions={<AccessWindowBadge allocation={institutionCert} />}
      />

      {analyticsQuery.isError ? (
        <InstitutionErrorState title="Unable to load the analytics" onRetry={analyticsQuery.refetch} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <StatTile label="Learners enrolled" value={show(summary?.enrolled)} hint={`${used} / ${total} slots used`} />
          <StatTile label="Finished" value={show(summary?.finished)} />
          <StatTile label="Average progress" value={show(summary?.averageProgress, "%")} />
          <StatTile label="Passed a mock exam" value={show(summary?.mockPassed)} />
          <StatTile label="Assessment attempts" value={show(summary?.assessmentAttempts)} />
          <StatTile label="Average score" value={show(summary?.averageScore, "%")} />
        </div>
      )}

      <CertificationViewer
        certificationId={institutionCert.certificationId}
        analytics={analyticsQuery.data ?? null}
        embedded
      />
    </div>
  )
}
