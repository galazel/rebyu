import { useMemo } from "react"
import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  AlertTriangle,
  ArrowLeft,
  AwardIcon,
  Building2Icon,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Layers,
  Mail,
  Send,
  ShieldCheck,
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
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
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
import { getInstitutionOrganisation } from "@/services/adminInstitutionService.js"
import {
  getAllInstitutionCertificates,
  getAllInstitutionCertificationLearners,
  getInstitutionById,
} from "@/services/institutionService.js"

function asArray(value) {
  return Array.isArray(value) ? value : []
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
    <div className="flex items-start gap-2.5 py-2 text-xs sm:text-sm">
      {Icon ? <Icon className="mt-0.5 size-3.5 sm:size-4 shrink-0 text-muted-foreground" /> : null}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] sm:text-xs text-muted-foreground">{label}</p>
        <p className="break-words font-medium text-foreground text-xs sm:text-sm">{children || "—"}</p>
      </div>
    </div>
  )
}

function BarRow({ label, value, max, suffix = "" }) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)_40px] sm:grid-cols-[96px_minmax(0,1fr)_48px] items-center gap-2 sm:gap-3 text-xs sm:text-sm">
      <span className="truncate text-muted-foreground">{label}</span>
      <div className="h-2 sm:h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
        />
      </div>
      <span className="text-right tabular-nums text-foreground font-medium">
        {value}
        {suffix}
      </span>
    </div>
  )
}

function CompactStatCard({
  icon: Icon,
  label,
  value,
  hint,
  toneClass = "text-primary bg-primary/10 border-primary/20",
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border/80 bg-card p-3 sm:p-4.5 shadow-sm transition-shadow hover:shadow">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] sm:text-xs font-semibold text-muted-foreground">
          {label}
        </span>
        {Icon && (
          <div className={cn("flex size-7 sm:size-9 shrink-0 items-center justify-center rounded-lg border", toneClass)}>
            <Icon className="size-3.5 sm:size-4.5" />
          </div>
        )}
      </div>
      <p className="mt-1 sm:mt-2 text-xl sm:text-3xl font-extrabold font-heading tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      {hint && (
        <p className="mt-1 truncate text-[10px] sm:text-xs text-muted-foreground" title={hint}>
          {hint}
        </p>
      )}
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
        institutionCertIds.has(row.institutionCertId) && ["active", "completed"].includes(String(row.status).toLowerCase())
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

  if (institutionQuery.isError || institutionCertsQuery.isError || institutionCertLearnersQuery.isError || certificationsQuery.isError || !institution) {
    return (
      <div className="space-y-6">
        <InstitutionErrorState onRetry={() => { institutionQuery.refetch(); institutionCertsQuery.refetch(); institutionCertLearnersQuery.refetch(); certificationsQuery.refetch() }} />
      </div>
    )
  }

  const maxBucket = Math.max(...stats.buckets.map((bucket) => bucket.count), 0)
  const maxMonth = Math.max(...stats.months.map((month) => month.count), 0)

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2 sm:space-y-3">
        <Link
          to="/admin/institutions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Institutions</span>
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
              <Building2Icon className="size-5 sm:size-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-lg sm:text-2xl font-bold tracking-tight text-foreground truncate">
                  {institution.institutionName}
                </h1>
                <InstitutionStatusBadge status={institution.status} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                {institution.institutionType && (
                  <Badge variant="outline" className="text-[10px] sm:text-xs font-medium capitalize">
                    {String(institution.institutionType).replaceAll("_", " ").toLowerCase()}
                  </Badge>
                )}
                {institution.isVerified ? (
                  <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs font-medium border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="size-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] sm:text-xs text-muted-foreground">
                    Unverified
                  </Badge>
                )}
                <span>·</span>
                <span>Partner since {formatDate(institution.joinedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
        <CompactStatCard
          icon={UsersIcon}
          label="Learners enrolled"
          value={stats.learners}
          toneClass="text-sky-600 bg-sky-500/10 border-sky-500/20 dark:text-sky-400"
          hint={
            organisationQuery.isError
              ? "Pending invitations unavailable"
              : organisationQuery.isLoading
                ? "Loading invitations…"
                : pendingInvitations > 0
                  ? `${pendingInvitations} invitation${pendingInvitations === 1 ? "" : "s"} pending`
                  : `${enrolments.length} total enrolments`
          }
        />
        <CompactStatCard
          icon={AwardIcon}
          label="Seat utilisation"
          value={`${percent(stats.usedSeats, stats.totalSeats)}%`}
          toneClass="text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400"
          hint={`${stats.usedSeats} of ${stats.totalSeats} seats · ${institutionCerts.length} certs`}
        />
        <CompactStatCard
          icon={TrendingUp}
          label="Average progress"
          value={`${stats.averageProgress}%`}
          toneClass="text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400"
          hint={`${stats.notStarted} not started`}
        />
        <CompactStatCard
          icon={CheckCircle2}
          label="Completed"
          value={stats.completed}
          toneClass="text-purple-600 bg-purple-500/10 border-purple-500/20 dark:text-purple-400"
          hint={`${percent(stats.completed, enrolments.length)}% completion rate${
            stats.inactive > 0 ? ` · ${stats.inactive} inactive` : ""
          }`}
        />
      </div>

      {alerts.length > 0 ? (
        <div className="rounded-xl border border-amber-300/80 bg-amber-50/80 p-3 sm:p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-200">
            <AlertTriangle className="size-4 shrink-0" />
            <span>Needs attention</span>
          </div>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs sm:text-sm text-amber-900/90 dark:text-amber-100/90">
            {alerts.map((alert) => (
              <li key={alert}>{alert}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <Card className={TABLE_SURFACE}>
        <CardHeader className="p-3.5 sm:p-5 pb-2.5 sm:pb-3">
          <CardTitle className="text-base sm:text-lg">Certifications</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Seats, engagement, and access windows for each purchased allocation.
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
            <>
              <div className="divide-y divide-border/60 md:hidden">
                {allocationRows.map((row) => (
                  <div key={row.institutionCert.institutionCertId} className="p-3.5 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm leading-snug">
                          {row.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {formatDate(row.institutionCert.accessStartDate)} – {formatDate(row.institutionCert.accessExpiryDate)}
                          {row.daysLeft != null && (
                            <span
                              className={cn(
                                "ml-1.5 font-medium",
                                row.daysLeft <= EXPIRY_WARNING_DAYS
                                  ? "font-semibold text-amber-600 dark:text-amber-400"
                                  : "text-muted-foreground"
                              )}
                            >
                              ({row.daysLeft >= 0 ? `${row.daysLeft}d left` : "Expired"})
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <AccessWindowBadge allocation={row.institutionCert} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg border border-border/60 bg-muted/20 p-2 space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-muted-foreground">Seats</span>
                          <span className="font-bold text-foreground tabular-nums">
                            {row.used}/{row.total}
                          </span>
                        </div>
                        <Progress value={percent(row.used, row.total)} className="h-1.5" />
                        <p className="text-[10px] text-muted-foreground">
                          {Math.max(row.total - row.used, 0)} free seats
                        </p>
                      </div>

                      <div className="rounded-lg border border-border/60 bg-muted/20 p-2 space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-bold text-foreground tabular-nums">
                            {row.averageProgress}%
                          </span>
                        </div>
                        <Progress value={row.averageProgress} className="h-1.5" />
                        <p className="text-[10px] text-muted-foreground">
                          {row.completed} completed ({percent(row.completed, row.enrolled)}%)
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Certification</TableHead>
                      <TableHead>Seats</TableHead>
                      <TableHead>Avg. progress</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Access</TableHead>
                      <TableHead>Status</TableHead>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:gap-6 lg:grid-cols-2">
        <Card className={TABLE_SURFACE}>
          <CardHeader className="p-3.5 sm:p-5 pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg">Progress distribution</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Lesson progress for active and completed enrolments.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-5 pt-0 sm:pt-0 space-y-2.5 sm:space-y-3">
            {enrolments.length === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground">No enrolments yet.</p>
            ) : (
              stats.buckets.map((bucket) => (
                <BarRow key={bucket.label} label={bucket.label} value={bucket.count} max={maxBucket} />
              ))
            )}
          </CardContent>
        </Card>

        <Card className={TABLE_SURFACE}>
          <CardHeader className="p-3.5 sm:p-5 pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg">New enrolments</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Certification enrolments assigned per month, last 6 months.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-5 pt-0 sm:pt-0 space-y-2.5 sm:space-y-3">
            {stats.months.map((month) => (
              <BarRow key={month.key} label={month.label} value={month.count} max={maxMonth} />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className={TABLE_SURFACE}>
          <CardHeader className="p-3.5 sm:p-5 pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg">
              Departments ({organisationQuery.isError || organisationQuery.isLoading ? "—" : departments.length})
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              How the institution has divided its seats.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {organisationQuery.isError ? (
              <p className="px-4 pb-4 sm:px-6 sm:pb-6 text-xs sm:text-sm text-muted-foreground">
                Departments could not be loaded.
              </p>
            ) : organisationQuery.isLoading ? (
              <p className="px-4 pb-4 sm:px-6 sm:pb-6 text-xs sm:text-sm text-muted-foreground">
                Loading departments…
              </p>
            ) : departments.length === 0 ? (
              <InstitutionEmptyState
                icon={Layers}
                title="No departments"
                description="The institution has not set up departments yet."
              />
            ) : (
              <>
                <div className="divide-y divide-border/60 md:hidden">
                  {departments.map((department) => {
                    const covered = asArray(department.certifications)
                      .map((c) => c.title ?? c.certificationTitle)
                      .filter(Boolean)
                    const total = Number(department.totalSlots ?? 0)
                    const used = Number(department.usedSlots ?? 0)
                    return (
                      <div key={department.departmentId} className="p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-foreground text-sm">
                            {department.departmentName}
                          </p>
                          <InstitutionStatusBadge status={department.status} />
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {covered.length > 0 ? covered.join(", ") : "No certifications assigned"}
                        </p>
                        <div className="flex items-center justify-between text-xs pt-0.5">
                          <span className="text-muted-foreground">Allocated seats:</span>
                          <span className="font-semibold text-foreground tabular-nums">
                            {total > 0 ? `${used} / ${total}` : used || "—"}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="hidden md:block overflow-x-auto">
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
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className={TABLE_SURFACE}>
          <CardHeader className="p-3.5 sm:p-5 pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg">Partnership details</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/60 p-3.5 sm:p-5 pt-0 sm:pt-0">
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
              {organisationQuery.isError ? "Unavailable" : organisationQuery.isLoading ? "Loading…" : String(pendingInvitations)}
            </DetailRow>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
