import { useMemo } from "react"
import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeftIcon, AwardIcon, Building2Icon, UsersIcon } from "@/components/icons"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TABLE_SURFACE } from "@/components/commons/data-table"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  InstitutionEmptyState,
  InstitutionErrorState,
  InstitutionLoadingSkeleton,
  InstitutionPageHeader,
  InstitutionStatCard,
  AccessWindowBadge,
  InstitutionStatusBadge,
  formatDate,
} from "@/components/institution/institution-ui.jsx"
import { getAllCertifications } from "@/services/certificationService.js"
import { getAllLearners } from "@/services/adminLearnerService.js"
import {
  getAllInstitutionCertificates,
  getAllInstitutionCertificationLearners,
  getInstitutionById,
} from "@/services/institutionService.js"

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function getLearnerDisplayName(learner) {
  if (!learner) return "Unknown learner"
  const full = [learner.firstName, learner.lastName].filter(Boolean).join(" ")
  return full || learner.username || `Learner #${learner.learnerId}`
}

export default function AdminInstitutionDetail() {
  const { id } = useParams()
  const institutionId = Number(id)

  const institutionQuery = useQuery({
    queryKey: ["admin-institution", institutionId],
    queryFn: () => getInstitutionById(institutionId),
    enabled: Number.isFinite(institutionId),
    retry: 1,
  })

  const institutionCertsQuery = useQuery({
    queryKey: ["admin-institution-certificates"],
    queryFn: getAllInstitutionCertificates,
    staleTime: 60_000,
  })

  const institutionCertLearnersQuery = useQuery({
    queryKey: ["admin-institution-certification-learners"],
    queryFn: getAllInstitutionCertificationLearners,
    staleTime: 60_000,
  })

  const certificationsQuery = useQuery({
    queryKey: ["certifications-full"],
    queryFn: () => getAllCertifications(),
    staleTime: 5 * 60 * 1000,
  })

  const learnersQuery = useQuery({
    queryKey: ["admin-learners"],
    queryFn: getAllLearners,
    staleTime: 60_000,
  })

  const isLoading =
    institutionQuery.isLoading ||
    institutionCertsQuery.isLoading ||
    institutionCertLearnersQuery.isLoading ||
    certificationsQuery.isLoading ||
    learnersQuery.isLoading

  const institution = institutionQuery.data

  const certificationById = useMemo(
    () => new Map(asArray(certificationsQuery.data).map((c) => [c.certificationId, c])),
    [certificationsQuery.data]
  )

  const learnerById = useMemo(
    () => new Map(asArray(learnersQuery.data).map((l) => [l.learnerId, l])),
    [learnersQuery.data]
  )

  const institutionCerts = useMemo(
    () =>
      asArray(institutionCertsQuery.data).filter(
        (institutionCert) => institutionCert.institutionId === institutionId
      ),
    [institutionCertsQuery.data, institutionId]
  )

  const institutionCertIds = useMemo(
    () => new Set(institutionCerts.map((c) => c.institutionCertId)),
    [institutionCerts]
  )

  const institutionCertLearners = useMemo(
    () =>
      asArray(institutionCertLearnersQuery.data).filter((row) =>
        institutionCertIds.has(row.institutionCertId)
      ),
    [institutionCertLearnersQuery.data, institutionCertIds]
  )

  const institutionCertById = useMemo(
    () => new Map(institutionCerts.map((c) => [c.institutionCertId, c])),
    [institutionCerts]
  )

  const distinctLearnerCount = useMemo(
    () => new Set(institutionCertLearners.map((row) => row.learnerId)).size,
    [institutionCertLearners]
  )

  if (isLoading) return <InstitutionLoadingSkeleton />

  if (institutionQuery.isError || !institution) {
    return (
      <div className="space-y-6">
        <Link
          to="/admin/institutions"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          Back to Institutions
        </Link>
        <InstitutionErrorState onRetry={institutionQuery.refetch} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        to="/admin/institutions"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        Back to Institutions
      </Link>

      <InstitutionPageHeader
        title={institution.institutionName}
        subtitle={`${institution.industry ?? "General"} · ${
          institution.primaryContactName ?? "No contact assigned"
        }`}
        actions={<InstitutionStatusBadge status={institution.status} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InstitutionStatCard
          icon={UsersIcon}
          label="Enrolled learners"
          value={distinctLearnerCount}
        />
        <InstitutionStatCard
          icon={AwardIcon}
          label="Certification allocations"
          value={institutionCerts.length}
        />
        <InstitutionStatCard
          icon={Building2Icon}
          label="Primary contact"
          value={institution.primaryContactName ?? "—"}
          hint={institution.primaryContactEmail}
        />
        <InstitutionStatCard label="Joined" value={formatDate(institution.joinedAt)} />
      </div>

      <Card className={TABLE_SURFACE}>
        <CardHeader>
          <CardTitle>Certifications</CardTitle>
          <CardDescription>
            Slot allocations this institution has purchased access to.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {institutionCerts.length === 0 ? (
            <InstitutionEmptyState
              icon={AwardIcon}
              title="No certification allocations"
              description="This institution has no active partnership allocations yet."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certification</TableHead>
                  <TableHead>Slot usage</TableHead>
                  <TableHead>Access period</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {institutionCerts.map((institutionCert) => {
                  const certification = certificationById.get(institutionCert.certificationId)
                  const used = institutionCert.usedSlots ?? 0
                  const total = institutionCert.totalSlots ?? 0
                  return (
                    <TableRow key={institutionCert.institutionCertId}>
                      <TableCell className="font-medium">
                        {certification?.title ?? `Certification #${institutionCert.certificationId}`}
                      </TableCell>
                      <TableCell className="w-56">
                        <div className="space-y-1">
                          <Progress value={total > 0 ? (used / total) * 100 : 0} />
                          <p className="text-xs text-muted-foreground">
                            {used} / {total} slots used
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(institutionCert.accessStartDate)} –{" "}
                        {formatDate(institutionCert.accessExpiryDate)}
                      </TableCell>
                      <TableCell>
                        <AccessWindowBadge allocation={institutionCert} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className={TABLE_SURFACE}>
        <CardHeader>
          <CardTitle>Learners ({institutionCertLearners.length})</CardTitle>
          <CardDescription>
            Every learner enrolled in one of this institution's certifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {institutionCertLearners.length === 0 ? (
            <InstitutionEmptyState
              icon={UsersIcon}
              title="No learners yet"
              description="Learners appear here once they accept an invitation to this institution."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Learner</TableHead>
                  <TableHead>Certification</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {institutionCertLearners.map((row) => {
                  const institutionCert = institutionCertById.get(row.institutionCertId)
                  const certification = institutionCert
                    ? certificationById.get(institutionCert.certificationId)
                    : null
                  return (
                    <TableRow key={row.institutionCertLearnerId}>
                      <TableCell className="font-medium">
                        {getLearnerDisplayName(learnerById.get(row.learnerId))}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {certification?.title ?? "—"}
                      </TableCell>
                      <TableCell className="w-40">
                        <div className="space-y-1">
                          <Progress value={Number(row.progressPercentage ?? 0)} />
                          <p className="text-xs text-muted-foreground">
                            {Number(row.progressPercentage ?? 0).toFixed(0)}%
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <InstitutionStatusBadge status={row.status} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
