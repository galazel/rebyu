import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  AlertTriangle,
  AwardIcon,
  Building2Icon,
  CalendarDays,
  CheckCircle2,
  Layers,
  Mail,
  Send,
  TrendingUp,
  UsersIcon,
} from "@/components/icons"

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
import { getInstitutionOrganisation } from "@/services/adminInstitutionService.js"
import {
  getAllInstitutionCertificates,
  getAllInstitutionCertificationLearners,
  getInstitutionById,
} from "@/services/institutionService.js"

function asArray(value) {
  return Array.isArray(value) ? value : []
}

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

const DAY_MS = 24 * 60 * 60 * 1000
const EXPIRY_WARNING_DAYS = 30
const FULL_WARNING_RATIO = 0.9

function daysUntil(dateValue) {
  if (!dateValue) return null
  const end = new Date(dateValue)
  if (Number.isNaN(end.getTime())) return null
  return Math.ceil((end.getTime() - Date.now()) / DAY_MS)
}

function percent(part, whole) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
}

function isCompleted(row) {
  return Boolean(row.completedAt) || String(row.status).toLowerCase() === "completed"
}

const PROGRESS_BUCKETS = [
  { label: "Not started", test: (p) => p <= 0 },
  { label: "1–25%", test: (p) => p > 0 && p <= 25 },
  { label: "26–50%", test: (p) => p > 25 && p <= 50 },
  { label: "51–75%", test: (p) => p > 50 && p <= 75 },
  { label: "76–99%", test: (p) => p > 75 && p < 100 },
  { label: "Finished", test: (p) => p >= 100 },
]

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon ? <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> : null}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="break-words text-sm font-medium text-foreground">{children || "—"}</p>
      </div>
    </div>
  )
}

function BarRow({ label, value, max, suffix = "" }) {
  return (
    <div className="grid grid-cols-[96px_minmax(0,1fr)_48px] items-center gap-3 text-sm">
      <span className="truncate text-muted-foreground">{label}</span>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
        />
      </div>
      <span className="text-right tabular-nums text-foreground">
        {value}
        {suffix}
      </span>
    </div>
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
    queryKey: ["certifications", "summary"],
    queryFn: () => getAllCertifications(undefined, { summary: true }),
    staleTime: 5 * 60 * 1000,
  })

  // Secondary panels: a failure here hides the panel, never the page.
  const organisationQuery = useQuery({
    queryKey: ["admin-institution-organisation", institutionId],
    queryFn: () => getInstitutionOrganisation(institutionId),
    enabled: Number.isFinite(institutionId),
    staleTime: 60_000,
    retry: false,
  })

  const isLoading =
    institutionQuery.isLoading ||
    institutionCertsQuery.isLoading ||
    institutionCertLearnersQuery.isLoading ||
    certificationsQuery.isLoading

  const institution = institutionQuery.data

  const certificationById = useMemo(
    () => new Map(asArray(certificationsQuery.data).map((c) => [c.certificationId, c])),
    [certificationsQuery.data]
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

  const enrolments = useMemo(
    () =>
      asArray(institutionCertLearnersQuery.data).filter((row) =>
        institutionCertIds.has(row.institutionCertId)
      ),
    [institutionCertLearnersQuery.data, institutionCertIds]
  )

  const stats = useMemo(() => {
    const progress = enrolments.map((row) => Number(row.progressPercentage ?? 0))
    const totalSeats = institutionCerts.reduce((sum, c) => sum + Number(c.totalSlots ?? 0), 0)
    const usedSeats = institutionCerts.reduce((sum, c) => sum + Number(c.usedSlots ?? 0), 0)
    const completed = enrolments.filter(isCompleted).length
    const inactive = enrolments.filter(
      (row) => !isCompleted(row) && String(row.status).toLowerCase() !== "active"
    ).length
    const notStarted = progress.filter((p) => p <= 0).length

    const buckets = PROGRESS_BUCKETS.map((bucket) => ({
      label: bucket.label,
      count: progress.filter(bucket.test).length,
    }))

    // Enrolments per month for the last six months.
    const now = new Date()
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleDateString("en-US", { month: "short" }),
        count: 0,
      }
    })
    const monthByKey = new Map(months.map((month) => [month.key, month]))
    for (const row of enrolments) {
      if (!row.assignedAt) continue
      const date = new Date(row.assignedAt)
      const month = monthByKey.get(`${date.getFullYear()}-${date.getMonth()}`)
      if (month) month.count += 1
    }

    return {
      learners: new Set(enrolments.map((row) => row.learnerId)).size,
      totalSeats,
      usedSeats,
      averageProgress: Math.round(average(progress)),
      completed,
      inactive,
      notStarted,
      buckets,
      months,
    }
  }, [enrolments, institutionCerts])

  const allocationRows = useMemo(
    () =>
      institutionCerts.map((institutionCert) => {
        const rows = enrolments.filter(
          (row) => row.institutionCertId === institutionCert.institutionCertId
        )
        const used = Number(institutionCert.usedSlots ?? 0)
        const total = Number(institutionCert.totalSlots ?? 0)
        return {
          institutionCert,
          title:
            certificationById.get(institutionCert.certificationId)?.title ??
            `Certification #${institutionCert.certificationId}`,
          used,
          total,
          enrolled: rows.length,
          averageProgress: Math.round(
            average(rows.map((row) => Number(row.progressPercentage ?? 0)))
          ),
          completed: rows.filter(isCompleted).length,
          daysLeft: daysUntil(institutionCert.accessExpiryDate),
        }
      }),
    [institutionCerts, enrolments, certificationById]
  )

  const alerts = useMemo(() => {
    const list = []
    for (const row of allocationRows) {
      if (row.daysLeft != null && row.daysLeft >= 0 && row.daysLeft <= EXPIRY_WARNING_DAYS) {
        list.push(`${row.title} access ends in ${row.daysLeft} day${row.daysLeft === 1 ? "" : "s"}.`)
      }
      if (row.daysLeft != null && row.daysLeft < 0) {
        list.push(`${row.title} access expired ${Math.abs(row.daysLeft)} days ago.`)
      }
      if (row.total > 0 && row.used / row.total >= FULL_WARNING_RATIO) {
        list.push(`${row.title} is ${percent(row.used, row.total)}% full (${row.used}/${row.total} seats).`)
      }
      if (row.total > 0 && row.used === 0 && (row.daysLeft ?? 0) > 0) {
        list.push(`${row.title} has no seats used yet.`)
      }
    }
    return list
  }, [allocationRows])

  const departments = asArray(organisationQuery.data?.departments)
  const pendingInvitations = Number(organisationQuery.data?.pendingInvitations ?? 0)

  if (isLoading) return <InstitutionLoadingSkeleton />

  if (institutionQuery.isError || !institution) {
    return (
      <div className="space-y-6">
        <InstitutionErrorState onRetry={institutionQuery.refetch} />
      </div>
    )
  }

  const maxBucket = Math.max(...stats.buckets.map((bucket) => bucket.count), 0)
  const maxMonth = Math.max(...stats.months.map((month) => month.count), 0)

  return (
    <div className="space-y-6">
      <InstitutionPageHeader
        title={institution.institutionName}
        subtitle={[
          institution.institutionType
            ? String(institution.institutionType).replaceAll("_", " ").toLowerCase()
            : null,
          institution.isVerified ? "Verified" : "Not verified",
          `Partner since ${formatDate(institution.joinedAt)}`,
        ]
          .filter(Boolean)
          .join(" · ")}
        actions={<InstitutionStatusBadge status={institution.status} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InstitutionStatCard
          icon={UsersIcon}
          label="Learners enrolled"
          value={stats.learners}
          hint={
            pendingInvitations > 0
              ? `${pendingInvitations} invitation${pendingInvitations === 1 ? "" : "s"} still pending`
              : `${enrolments.length} enrolment${enrolments.length === 1 ? "" : "s"} across certifications`
          }
        />
        <InstitutionStatCard
          icon={AwardIcon}
          label="Seat utilisation"
          value={`${percent(stats.usedSeats, stats.totalSeats)}%`}
          hint={`${stats.usedSeats} of ${stats.totalSeats} purchased seats in use · ${institutionCerts.length} certification${institutionCerts.length === 1 ? "" : "s"}`}
        />
        <InstitutionStatCard
          icon={TrendingUp}
          label="Average progress"
          value={`${stats.averageProgress}%`}
          hint={`${stats.notStarted} enrolment${stats.notStarted === 1 ? " has" : "s have"} not started`}
        />
        <InstitutionStatCard
          icon={CheckCircle2}
          label="Completed"
          value={stats.completed}
          hint={`${percent(stats.completed, enrolments.length)}% completion rate${
            stats.inactive > 0 ? ` · ${stats.inactive} inactive` : ""
          }`}
        />
      </div>

      {alerts.length > 0 ? (
        <div className="rounded-rb-card border-2 border-amber-300/70 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
            <AlertTriangle className="size-4" />
            Needs attention
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-amber-900/90 dark:text-amber-100/90">
            {alerts.map((alert) => (
              <li key={alert}>{alert}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <Card className={TABLE_SURFACE}>
        <CardHeader>
          <CardTitle>Certifications</CardTitle>
          <CardDescription>
            Seats, engagement and access window for each purchased allocation.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {allocationRows.length === 0 ? (
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
                  <TableHead>Seats</TableHead>
                  <TableHead>Avg. progress</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocationRows.map((row) => (
                  <TableRow key={row.institutionCert.institutionCertId}>
                    <TableCell className="font-medium">{row.title}</TableCell>
                    <TableCell className="w-48">
                      <div className="space-y-1">
                        <Progress value={percent(row.used, row.total)} />
                        <p className="text-xs text-muted-foreground">
                          {row.used} / {row.total} used · {Math.max(row.total - row.used, 0)} free
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="w-36">
                      <div className="space-y-1">
                        <Progress value={row.averageProgress} />
                        <p className="text-xs text-muted-foreground">
                          {row.averageProgress}% · {row.enrolled} enrolled
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {row.completed}
                      <span className="text-xs text-muted-foreground">
                        {" "}
                        ({percent(row.completed, row.enrolled)}%)
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      <p className="text-muted-foreground">
                        {formatDate(row.institutionCert.accessStartDate)} –{" "}
                        {formatDate(row.institutionCert.accessExpiryDate)}
                      </p>
                      {row.daysLeft != null ? (
                        <p
                          className={`text-xs ${
                            row.daysLeft <= EXPIRY_WARNING_DAYS
                              ? "font-semibold text-amber-700 dark:text-amber-300"
                              : "text-muted-foreground"
                          }`}
                        >
                          {row.daysLeft >= 0 ? `${row.daysLeft} days left` : "Expired"}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <AccessWindowBadge allocation={row.institutionCert} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setDropping({ allocation: row.institutionCert, title: row.title })
                        }
                      >
                        Drop
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className={TABLE_SURFACE}>
          <CardHeader>
            <CardTitle>Progress distribution</CardTitle>
            <CardDescription>
              How far enrolments have got, across all certifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {enrolments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No enrolments yet.</p>
            ) : (
              stats.buckets.map((bucket) => (
                <BarRow key={bucket.label} label={bucket.label} value={bucket.count} max={maxBucket} />
              ))
            )}
          </CardContent>
        </Card>

        <Card className={TABLE_SURFACE}>
          <CardHeader>
            <CardTitle>New enrolments</CardTitle>
            <CardDescription>Learners added per month, last six months.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.months.map((month) => (
              <BarRow key={month.key} label={month.label} value={month.count} max={maxMonth} />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className={TABLE_SURFACE}>
          <CardHeader>
            <CardTitle>Departments ({departments.length})</CardTitle>
            <CardDescription>How the institution has divided its seats.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {organisationQuery.isError ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">
                Departments could not be loaded.
              </p>
            ) : departments.length === 0 ? (
              <InstitutionEmptyState
                icon={Layers}
                title="No departments"
                description="The institution has not set up departments yet."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Certifications</TableHead>
                    <TableHead>Seats</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((department) => {
                    const covered = asArray(department.certifications)
                      .map((c) => c.title ?? c.certificationTitle)
                      .filter(Boolean)
                    const total = Number(department.totalSlots ?? 0)
                    const used = Number(department.usedSlots ?? 0)
                    return (
                      <TableRow key={department.departmentId}>
                        <TableCell className="font-medium">{department.departmentName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {covered.length > 0 ? covered.join(", ") : "—"}
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">
                          {total > 0 ? `${used} / ${total}` : used || "—"}
                        </TableCell>
                        <TableCell>
                          <InstitutionStatusBadge status={department.status} />
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
            <CardTitle>Partnership details</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border pt-0">
            <DetailRow icon={Building2Icon} label="Primary contact">
              {institution.primaryContactName}
            </DetailRow>
            <DetailRow icon={Mail} label="Email">
              {institution.primaryContactEmail}
            </DetailRow>
            <DetailRow label="Phone">{institution.primaryContactPhone}</DetailRow>
            <DetailRow label="Address">{institution.address}</DetailRow>
            <DetailRow icon={CalendarDays} label="Joined">
              {formatDate(institution.joinedAt)}
            </DetailRow>
            <DetailRow icon={Send} label="Pending invitations">
              {organisationQuery.isError ? "Unavailable" : String(pendingInvitations)}
            </DetailRow>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
