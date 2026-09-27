import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { AwardIcon, Building2Icon, UsersIcon } from "@/components/icons"

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
import {
  dropInstitutionCertification,
  getAllocationImpact,
} from "@/services/adminInstitutionService.js"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

/**
 * Dropping a certification, with what it destroys stated first.
 *
 * The server is asked what would go before anything goes: the counts shown
 * here come from the same walk of the same relationships that the delete then
 * performs, so this is not an estimate of the damage, it is the damage.
 */
function DropCertificationDialog({ allocation, title, onClose }) {
  const queryClient = useQueryClient()
  const [reason, setReason] = useState("")

  const impactQuery = useQuery({
    queryKey: ["allocation-impact", allocation?.institutionCertId],
    queryFn: () => getAllocationImpact(allocation.institutionCertId),
    enabled: allocation != null,
  })

  const drop = useMutation({
    mutationFn: () =>
      dropInstitutionCertification(
        allocation.institutionCertId,
        reason.trim() || `${title} dropped by REBYU admin`
      ),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-institution-certificates"] })
      queryClient.invalidateQueries({ queryKey: ["admin-institution-cert-learners"] })
      const refunded = Number(result?.refund?.refunded ?? 0)
      const pending = Number(result?.refund?.pending ?? 0)
      const expired = Number(result?.refund?.expired ?? 0)
      const failed = Number(result?.refund?.failed ?? 0)
      toast.success(`${title} removed`, {
        description:
          refunded > 0
            ? `₱${refunded.toLocaleString("en-PH")} refunded to the institution.`
            : pending > 0
              ? `₱${pending.toLocaleString("en-PH")} refund sent — it may take a few days to settle.`
            : expired > 0
              ? `No refund — ₱${expired.toLocaleString("en-PH")} was past the refund window.`
              : failed > 0
                ? `₱${failed.toLocaleString("en-PH")} could not be refunded. Check PayMongo.`
                : "There was nothing to refund.",
      })
      onClose()
    },
    onError: (error) =>
      toast.error(
        error?.response?.data?.message ?? "Could not drop this certification."
      ),
  })

  const impact = impactQuery.data
  const loading = impactQuery.isLoading

  return (
    <AlertDialog open={allocation != null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Drop {title}?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm">
              <p>This removes the allocation and everything built on it, and cannot be undone.</p>
              {loading ? (
                <p className="text-muted-foreground">Checking what this would remove…</p>
              ) : impact ? (
                <>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>
                      <strong>{impact.departments}</strong> department
                      {impact.departments === 1 ? "" : "s"}
                    </li>
                    <li>
                      <strong>{impact.enrolments}</strong> learner enrolment
                      {impact.enrolments === 1 ? "" : "s"} — access ends immediately
                    </li>
                    <li>
                      <strong>{impact.invitations}</strong> pending invitation
                      {impact.invitations === 1 ? "" : "s"}
                    </li>
                  </ul>
                  {impact.exams + impact.questions + impact.curriculumBranches > 0 ? (
                    <p className="text-muted-foreground">
                      {impact.exams} exam(s), {impact.questions} question(s) and{" "}
                      {impact.curriculumBranches} curriculum branch(es) authored by these
                      departments are kept — learners have already answered them — but they
                      lose their owner.
                    </p>
                  ) : null}
                  {/* The refund window is the one part of this an admin
                      cannot infer from the table, and the one they will be
                      asked about afterwards. */}
                  {Number(impact.refundable) > 0 ? (
                    <p>
                      <strong>
                        ₱{Number(impact.refundable).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </strong>{" "}
                      is refunded to the institution's original payment method.
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      <strong>No refund.</strong> Nothing paid for {title} is still inside the{" "}
                      {impact.refundWindowHours}-hour refund window, so the access is removed
                      without money being returned.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-destructive">
                  Could not read what this would remove. Do not proceed.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="drop-reason">Reason (recorded against the refund)</Label>
          <Textarea
            id="drop-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Optional."
            rows={2}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={drop.isPending}>Keep it</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault()
              drop.mutate()
            }}
            disabled={drop.isPending || loading || !impact}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {drop.isPending ? "Removing…" : "Drop and refund"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
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

  const [dropping, setDropping] = useState(null)

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
        <InstitutionErrorState onRetry={institutionQuery.refetch} />
      </div>
    )
  }

  return (
    <div className="space-y-6">

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
                  <TableHead className="text-right">Actions</TableHead>
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
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            setDropping({
                              allocation: institutionCert,
                              title:
                                certification?.title ??
                                `Certification #${institutionCert.certificationId}`,
                            })
                          }
                        >
                          Drop
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {dropping ? (
        <DropCertificationDialog
          allocation={dropping.allocation}
          title={dropping.title}
          onClose={() => setDropping(null)}
        />
      ) : null}

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
