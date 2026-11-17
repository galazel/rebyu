import { useMemo } from "react"
import { Link, useOutletContext, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  Award,
  CheckCircle,
  ClipboardCheck,
  Target,
  TrendingUp,
  Users,
} from "@/components/icons"

import { Button } from "@/components/ui/button"
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

function StatTile({ icon: Icon, label, shortLabel, value, hint, shortHint }) {
  return (
    <div className="group relative rounded-xl border border-border/70 bg-card p-2.5 sm:p-4 shadow-2xs transition-all duration-200 hover:border-border dark:border-border/70 dark:bg-card">
      <div className="flex items-start justify-between gap-1.5">
        <span className="text-[11px] font-semibold text-muted-foreground truncate leading-tight sm:text-xs">
          {shortLabel ? (
            <>
              <span className="sm:hidden">{shortLabel}</span>
              <span className="hidden sm:inline">{label}</span>
            </>
          ) : (
            label
          )}
        </span>
        {Icon ? (
          <div className="grid size-6 shrink-0 place-items-center rounded-md bg-muted/60 text-muted-foreground transition-colors group-hover:bg-emerald-500/15 group-hover:text-emerald-600 dark:bg-muted/40 dark:group-hover:bg-emerald-500/20 dark:group-hover:text-emerald-400">
            <Icon className="size-3.5" aria-hidden="true" />
          </div>
        ) : null}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <p className="font-mono text-base font-bold tracking-tight text-foreground tabular-nums sm:text-xl">
          {value}
        </p>
      </div>
      {hint ? (
        <p className="mt-0.5 text-[10px] font-medium text-muted-foreground/80 truncate">
          {shortHint ? (
            <>
              <span className="sm:hidden">{shortHint}</span>
              <span className="hidden sm:inline">{hint}</span>
            </>
          ) : (
            hint
          )}
        </p>
      ) : null}
    </div>
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
    <div className="space-y-4 sm:space-y-6">
      <InstitutionPageHeader
        title={certification.title}
        subtitle={certification.description || "No description available."}
        actions={<AccessWindowBadge allocation={institutionCert} />}
      />

      {analyticsQuery.isError ? (
        <InstitutionErrorState title="Unable to load the analytics" onRetry={analyticsQuery.refetch} />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6 sm:gap-3">
          <StatTile
            icon={Users}
            label="Learners enrolled"
            shortLabel="Enrolled"
            value={show(summary?.enrolled)}
            hint={`${used} / ${total} slots used`}
            shortHint={`${used}/${total} slots`}
          />
          <StatTile
            icon={CheckCircle}
            label="Finished"
            value={show(summary?.finished)}
          />
          <StatTile
            icon={TrendingUp}
            label="Average progress"
            shortLabel="Avg. progress"
            value={show(summary?.averageProgress, "%")}
          />
          <StatTile
            icon={Award}
            label="Passed a mock exam"
            shortLabel="Passed mock"
            value={show(summary?.mockPassed)}
          />
          <StatTile
            icon={ClipboardCheck}
            label="Assessment attempts"
            shortLabel="Attempts"
            value={show(summary?.assessmentAttempts)}
          />
          <StatTile
            icon={Target}
            label="Average score"
            shortLabel="Avg. score"
            value={show(summary?.averageScore, "%")}
          />
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
