import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  AlertCircle,
  AlertTriangle,
  Award,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  GraduationCap,
  Layers,
  MegaphoneIcon,
  PinIcon,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  TargetIcon,
  TrendingUp,
  UserCheck,
  UsersRound,
  UsersRoundIcon,
} from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  InstitutionEmptyState,
  InstitutionErrorState,
  InstitutionLoadingSkeleton,
  formatDate,
} from "@/components/institution/institution-ui.jsx"
import {
  getDepartmentAnnouncements,
  getDepartmentHeadAssignments,
  getDepartmentHeadCodeInvitations,
  getDepartmentPrograms,
  getDepartments,
  getGroupLearnerRoster,
  getGroupSections,
  getMyInstitutionInvoices,
} from "@/services/institutionService.js"
import { getInstitutionLearningStats } from "@/services/institutionLearningStatsService.js"
import { useInstitutionData } from "@/hooks/use-institution-data.js"
import { useDepartmentAlerts } from "@/components/institution/department-alert-strip.jsx"
import { isInstitutionOwner, useAuth } from "@/context/auth-context.jsx"
import { cn } from "@/lib/utils"

export default function DepartmentHeadOverviewPage() {
  const { user } = useAuth()
  const isOwner = isInstitutionOwner(user)
  const [activeFilter, setActiveFilter] = useState("all")

  // 1. Fetch assigned departments
  const departmentsQuery = useQuery({
    queryKey: ["my-institution-groups"],
    queryFn: () => getDepartments(),
    retry: 1,
  })

  const rawDepts = departmentsQuery.data
  const deptList = Array.isArray(rawDepts)
    ? rawDepts
    : Array.isArray(rawDepts?.departments)
      ? rawDepts.departments
      : Array.isArray(rawDepts?.content)
        ? rawDepts.content
        : []

  const groups = deptList.filter(
    (group) => (group?.status ?? "active").toLowerCase() === "active"
  )
  const assignedDeptIds = useMemo(
    () => new Set(groups.map((g) => String(g.departmentId ?? g.id))),
    [groups]
  )

  const [selectedDeptId, setSelectedDeptId] = useState(null)
  const activeSelectedDeptId =
    selectedDeptId ?? (groups[0]?.departmentId ?? groups[0]?.id)
  const overviewGroup = useMemo(
    () =>
      groups.find(
        (g) => String(g.departmentId ?? g.id) === String(activeSelectedDeptId)
      ) ??
      groups[0] ??
      null,
    [groups, activeSelectedDeptId]
  )
  const primaryDeptId = overviewGroup?.departmentId ?? overviewGroup?.id

  // 2. Institution allocations & metadata
  const instData = useInstitutionData(deptList[0]?.institutionId)
  const certAllocation = overviewGroup?.institutionCertId
    ? instData.institutionCertById?.get(overviewGroup.institutionCertId)
    : null

  // 3. Department learning stats
  const statsQuery = useQuery({
    queryKey: ["department-head-overview-learning-stats", primaryDeptId],
    queryFn: () => getInstitutionLearningStats({}),
    placeholderData: (previous) => previous,
    retry: 1,
  })
  const summary = statsQuery.data?.summary ?? {}
  const allMembers = useMemo(
    () =>
      Array.isArray(statsQuery.data?.members) ? statsQuery.data.members : [],
    [statsQuery.data]
  )

  // 4. Sections & Learner Roster
  const sectionsQuery = useQuery({
    queryKey: ["department-sections", primaryDeptId],
    queryFn: () => getGroupSections(primaryDeptId),
    enabled: primaryDeptId != null,
  })
  const sections = useMemo(
    () => (Array.isArray(sectionsQuery.data) ? sectionsQuery.data : []),
    [sectionsQuery.data]
  )

  const rosterQuery = useQuery({
    queryKey: ["department-learner-roster", primaryDeptId],
    queryFn: () => getGroupLearnerRoster(primaryDeptId),
    enabled: primaryDeptId != null,
  })

  const sectionByLearnerId = useMemo(() => {
    const map = new Map()
    if (Array.isArray(rosterQuery.data)) {
      for (const row of rosterQuery.data) {
        if (row.learnerId != null) {
          map.set(row.learnerId, {
            sectionId: row.sectionId,
            sectionName: row.sectionName,
            departmentLearnerId: row.departmentLearnerId,
            mockExamPassed: row.mockExamPassed,
            bestMockExamScore: row.bestMockExamScore,
            mockExamPassedAt: row.mockExamPassedAt,
          })
        }
      }
    }
    return map
  }, [rosterQuery.data])

  // Derive department learners with risk flags
  const flagFor = useMemo(() => {
    const now = Date.now()
    const STALE_DAYS = 14

    return (member) => {
      const daysSince = member.lastActivityAt
        ? Math.floor(
            (now - new Date(member.lastActivityAt).getTime()) / 86_400_000
          )
        : null

      if (!member.gradedAttempts && !member.lessonsCompleted) {
        return "Has not started curriculum"
      }
      if (daysSince != null && daysSince >= STALE_DAYS) {
        return `No activity in ${daysSince} days`
      }
      if (member.averageScore != null && member.averageScore < 50) {
        return `Averaging ${member.averageScore}% across ${member.gradedAttempts} attempt${
          member.gradedAttempts === 1 ? "" : "s"
        }`
      }
      if (
        member.passRate != null &&
        member.passRate < 50 &&
        member.gradedAttempts > 0
      ) {
        return `Passing ${member.passRate}% of attempts`
      }
      return null
    }
  }, [])

  const deptLearners = useMemo(() => {
    const deptLookup = new Map()
    instData.assignments?.forEach((assignment) => {
      const membership = instData.groupByInstitutionCertLearnerId?.get(
        assignment.institutionCertLearnerId
      )
      if (membership?.departmentId != null) {
        const dId = String(membership.departmentId)
        if (assignedDeptIds.has(dId)) {
          const activeDept = groups.find(
            (d) => String(d.departmentId ?? d.id) === dId
          )
          const dName =
            membership.departmentName ||
            activeDept?.departmentName ||
            `Department #${dId}`
          deptLookup.set(assignment.learnerId, {
            departmentId: dId,
            departmentName: dName,
          })
        }
      }
    })

    return allMembers
      .map((m) => {
        const dept = deptLookup.get(m.learnerId)
        const sectionInfo = sectionByLearnerId.get(m.learnerId)
        return {
          ...m,
          departmentId: dept?.departmentId,
          departmentName: dept?.departmentName,
          sectionId: sectionInfo?.sectionId ?? null,
          sectionName: sectionInfo?.sectionName ?? null,
          departmentLearnerId: sectionInfo?.departmentLearnerId ?? null,
          lastActivityAt: m.lastActivityAt ?? null,
          mockExamPassed:
            sectionInfo?.mockExamPassed ?? m.mockExamPassed ?? false,
          bestMockExamScore:
            sectionInfo?.bestMockExamScore ?? m.bestMockExamScore ?? null,
          mockExamPassedAt:
            sectionInfo?.mockExamPassedAt ?? m.mockExamPassedAt ?? null,
          flag: flagFor(m),
        }
      })
      .filter((m) => m.departmentId != null)
      .sort((a, b) => {
        if (Boolean(a.flag) !== Boolean(b.flag)) return a.flag ? -1 : 1
        return Number(a.averageProgress ?? 0) - Number(b.averageProgress ?? 0)
      })
  }, [
    allMembers,
    instData.assignments,
    instData.groupByInstitutionCertLearnerId,
    assignedDeptIds,
    groups,
    flagFor,
    sectionByLearnerId,
  ])

  const flaggedLearners = useMemo(
    () => deptLearners.filter((l) => Boolean(l.flag)),
    [deptLearners]
  )
  const flaggedCount = flaggedLearners.length

  const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000
  const dormantLearners = useMemo(() => {
    const now = Date.now()
    return deptLearners.filter((l) => {
      if (!l.lastActivityAt) return true
      const time = new Date(l.lastActivityAt).getTime()
      return !Number.isNaN(time) && now - time > FOURTEEN_DAYS_MS
    })
  }, [deptLearners])

  // 5. Invoices & Billing
  const invoicesQuery = useQuery({
    queryKey: ["institution-invoices"],
    queryFn: getMyInstitutionInvoices,
    staleTime: 5 * 60_000,
    retry: 1,
  })
  const invoices = useMemo(
    () => (Array.isArray(invoicesQuery.data) ? invoicesQuery.data : []),
    [invoicesQuery.data]
  )
  const pendingInvoices = useMemo(
    () =>
      invoices.filter(
        (inv) =>
          String(inv.status ?? "").toLowerCase() === "pending" ||
          String(inv.status ?? "").toLowerCase() === "unpaid"
      ),
    [invoices]
  )

  // 6. Co-Authorities
  const headCodesQuery = useQuery({
    queryKey: ["department-head-codes", primaryDeptId],
    queryFn: () => getDepartmentHeadCodeInvitations(primaryDeptId),
    enabled: primaryDeptId != null && isOwner,
    retry: 1,
  })
  const headAssignmentsQuery = useQuery({
    queryKey: ["department-head-assignments", primaryDeptId],
    queryFn: () =>
      getDepartmentHeadAssignments({ departmentId: primaryDeptId }),
    enabled: primaryDeptId != null,
    retry: 1,
  })
  const pendingHeadInvitations = useMemo(
    () =>
      (Array.isArray(headCodesQuery.data) ? headCodesQuery.data : []).filter(
        (inv) => (inv?.status ?? "").toUpperCase() === "PENDING"
      ),
    [headCodesQuery.data]
  )
  const activeHeadAssignments = useMemo(
    () =>
      (Array.isArray(headAssignmentsQuery.data)
        ? headAssignmentsQuery.data
        : []
      ).filter((a) => (a?.status ?? "active") === "active"),
    [headAssignmentsQuery.data]
  )

  // 7. Announcements
  const announcementsQuery = useQuery({
    queryKey: ["department-announcements", primaryDeptId],
    queryFn: () => getDepartmentAnnouncements(primaryDeptId),
    enabled: primaryDeptId != null,
    staleTime: 30_000,
  })
  const announcements = useMemo(
    () =>
      (Array.isArray(announcementsQuery.data)
        ? announcementsQuery.data
        : []
      ).sort((a, b) => {
        if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1
        return new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0)
      }),
    [announcementsQuery.data]
  )

  // 8. Alerts generation
  const alerts = useDepartmentAlerts({
    allocation: certAllocation,
    summary,
    overviewGroup,
    deptLearners,
    flaggedCount,
    invoices,
    pendingHeadInvitations,
    isOwner,
    onOpenCoAuthorities: () => {
      window.location.assign("/institution/departments#dept-co-authorities")
    },
    onInspectFlaggedRoster: () => {
      window.location.assign("/institution/departments#dept-learner-table")
    },
    onInspectDormantRoster: () => {
      window.location.assign("/institution/departments#dept-learner-table")
    },
  })

  // Filter alerts by category
  const filteredAlerts = useMemo(() => {
    if (activeFilter === "all") return alerts
    if (activeFilter === "critical") {
      return alerts.filter((a) => a.severity === "critical")
    }
    if (activeFilter === "academic") {
      return alerts.filter(
        (a) =>
          a.id === "learners-at-risk" ||
          a.id === "learners-dormant" ||
          a.kicker?.toLowerCase().includes("academic")
      )
    }
    if (activeFilter === "admin") {
      return alerts.filter(
        (a) =>
          a.id?.includes("co-authorities") ||
          a.id?.includes("seats") ||
          a.id?.includes("access")
      )
    }
    if (activeFilter === "billing") {
      return alerts.filter(
        (a) => a.id?.includes("invoice") || a.id?.includes("seats")
      )
    }
    return alerts
  }, [alerts, activeFilter])

  // Calculations for vital signs
  const totalEnrolled = deptLearners.length
  const totalSeats = Number(
    summary.seatsTotal ?? overviewGroup?.totalSlots ?? 0
  )
  const seatPercent =
    totalSeats > 0 ? Math.min(100, Math.round((totalEnrolled / totalSeats) * 100)) : 0
  const avgProgress = Math.round(Number(summary.averageProgress ?? 0))
  const passRate = Math.round(Number(summary.passRate ?? 0))

  if (departmentsQuery.isLoading) return <InstitutionLoadingSkeleton />
  if (departmentsQuery.isError) {
    return (
      <InstitutionErrorState
        title="Unable to load your department"
        onRetry={departmentsQuery.refetch}
      />
    )
  }

  if (groups.length === 0) {
    return (
      <InstitutionEmptyState
        title="No active department found"
        description="You do not have an active department assigned yet. Contact your institution administrator."
      />
    )
  }

  const deptName =
    overviewGroup?.departmentName ||
    overviewGroup?.name ||
    "Department"

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* 1. Dean's Command Center Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card/90 to-muted/30 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Building2 className="size-3.5" aria-hidden="true" />
                Dean Executive Command
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                <CalendarDays className="size-3" aria-hidden="true" />
                Academic Term 2026
              </span>
              {alerts.length > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="size-3" aria-hidden="true" />
                  {alerts.length} Active {alerts.length === 1 ? "Notice" : "Notices"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="size-3" aria-hidden="true" />
                  All Systems Clear
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {deptName}
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Real-time executive briefing of critical department notifications,
              academic alerts, and operational vital signs requiring leadership oversight.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {groups.length > 1 && (
              <Select
                value={String(activeSelectedDeptId)}
                onValueChange={(val) => setSelectedDeptId(Number(val))}
              >
                <SelectTrigger className="w-full sm:w-[220px] bg-background">
                  <SelectValue placeholder="Switch Department" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem
                      key={g.departmentId ?? g.id}
                      value={String(g.departmentId ?? g.id)}
                    >
                      {g.departmentName || `Department #${g.departmentId ?? g.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-1.5 shadow-xs"
            >
              <Link to="/institution/departments">
                <Building2 className="size-4 text-primary" aria-hidden="true" />
                <span>Department Management</span>
                <ChevronRight className="size-3.5 opacity-60" aria-hidden="true" />
              </Link>
            </Button>

            <Button
              asChild
              variant="default"
              size="sm"
              className="gap-1.5 shadow-xs"
            >
              <Link to="/institution/metrics">
                <TrendingUp className="size-4" aria-hidden="true" />
                <span>Deep Metrics</span>
                <ChevronRight className="size-3.5 opacity-60" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Dean's Vital Signs Strip (Essential Numbers at a Glance) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Enrolled Learners */}
        <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Learners & Capacity
            </span>
            <UsersRound className="size-4 text-primary" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums">
              {totalEnrolled}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              / {totalSeats > 0 ? totalSeats : "—"} seats
            </span>
          </div>
          <div className="space-y-1 pt-1">
            <Progress value={seatPercent} className="h-1.5" />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{seatPercent}% quota used</span>
              <span>{Math.max(0, totalSeats - totalEnrolled)} available</span>
            </div>
          </div>
        </div>

        {/* Department Progress */}
        <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Avg Completion
            </span>
            <TargetIcon className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums">
              {avgProgress}%
            </span>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-bold px-1.5 py-0.5",
                avgProgress >= 50
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
              )}
            >
              {avgProgress >= 50 ? "Progressing" : "Pacing Low"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            Across active modules & curriculum lessons
          </p>
        </div>

        {/* Pass Rate */}
        <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Assessment Pass Rate
            </span>
            <Award className="size-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums">
              {passRate}%
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              graded attempts
            </span>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            {summary.gradedAttempts ?? 0} attempts completed to date
          </p>
        </div>

        {/* Attention Items */}
        <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Urgent Attention
            </span>
            <ShieldAlert
              className={cn(
                "size-4",
                flaggedCount > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-muted-foreground"
              )}
              aria-hidden="true"
            />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                "text-2xl sm:text-3xl font-extrabold tabular-nums",
                flaggedCount > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-foreground"
              )}
            >
              {flaggedCount}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              at-risk learner{flaggedCount === 1 ? "" : "s"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            {dormantLearners.length} dormant (&gt;14 days inactive)
          </p>
        </div>
      </div>

      {/* 3. Important Notifications & Department Alerts Hub */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <Bell className="size-4" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                Important Department Notifications
                <Badge variant="secondary" className="text-xs font-bold px-2 py-0.5">
                  {alerts.length}
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground">
                Actionable administrative, academic, and operational notices requiring dean attention
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "all", label: `All (${alerts.length})` },
              { id: "critical", label: "Critical" },
              { id: "academic", label: "Academic" },
              { id: "admin", label: "Administrative" },
              { id: "billing", label: "Billing & Seats" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={cn(
                  "px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-colors",
                  activeFilter === tab.id
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-muted/15 p-8 text-center space-y-2">
            <CheckCircle2 className="size-8 mx-auto text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-foreground">
              No active notifications in this category
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Your department operations, allocations, and learner pacing are currently operating without critical warnings.
            </p>
          </div>
        ) : (
          <div className="grid gap-3.5">
            {filteredAlerts.map((alert) => {
              const Icon = alert.icon || AlertCircle
              const isCrit = alert.severity === "critical"
              const isWarn = alert.severity === "warning"

              return (
                <div
                  key={alert.id}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4 sm:p-5 shadow-xs transition-colors",
                    isCrit
                      ? "border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/20"
                      : isWarn
                        ? "border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20"
                        : "border-border/70 bg-card"
                  )}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={cn(
                        "rounded-xl p-2.5 shrink-0 mt-0.5",
                        isCrit
                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          : isWarn
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : "bg-primary/10 text-primary"
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {alert.kicker && (
                          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            {alert.kicker}
                          </span>
                        )}
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold px-1.5 py-0",
                            isCrit
                              ? "border-rose-500/40 text-rose-700 dark:text-rose-400 bg-rose-500/10"
                              : isWarn
                                ? "border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10"
                                : "border-border/60 text-muted-foreground"
                          )}
                        >
                          {isCrit ? "Critical Action" : isWarn ? "Attention Needed" : "Advisory"}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-bold text-foreground">
                        {alert.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {alert.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-border/40">
                    {alert.actionHref ? (
                      <Button asChild size="sm" variant={isCrit ? "default" : "outline"} className="text-xs h-8">
                        <Link to={alert.actionHref}>
                          {alert.actionLabel || "Resolve"}
                          <ChevronRight className="size-3.5 ml-1" aria-hidden="true" />
                        </Link>
                      </Button>
                    ) : alert.onAction ? (
                      <Button
                        size="sm"
                        variant={isCrit ? "default" : "outline"}
                        className="text-xs h-8"
                        onClick={alert.onAction}
                      >
                        {alert.actionLabel || "Resolve"}
                        <ChevronRight className="size-3.5 ml-1" aria-hidden="true" />
                      </Button>
                    ) : (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="text-xs h-8"
                      >
                        <Link to="/institution/departments#dept-learner-table">
                          Review in Management
                          <ChevronRight className="size-3.5 ml-1" aria-hidden="true" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 4. Two-Column Operational Details: Urgent Academic Watchlist & Bulletins */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* At-Risk Learner Intervention Watchlist */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-rose-600 dark:text-rose-400" aria-hidden="true" />
              <h3 className="text-sm font-bold text-foreground sm:text-base">
                Urgent Academic Watchlist
              </h3>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs h-7 gap-1">
              <Link to="/institution/departments#dept-learner-table">
                <span>View Full Roster</span>
                <ChevronRight className="size-3" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          {flaggedLearners.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/15 p-6 text-center space-y-1.5">
              <CheckCircle2 className="size-6 mx-auto text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <p className="text-xs font-semibold text-foreground">
                Zero learners flagged for intervention
              </p>
              <p className="text-[11px] text-muted-foreground">
                All enrolled students are meeting current pace and passing thresholds.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {flaggedLearners.slice(0, 5).map((learner) => (
                <div
                  key={learner.learnerId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 text-xs"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-semibold text-foreground truncate">
                      {learner.name || "Unknown Learner"}
                    </p>
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium truncate">
                      {learner.flag}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold tabular-nums text-foreground">
                      {Math.round(Number(learner.averageProgress ?? 0))}%
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      progress
                    </span>
                  </div>
                </div>
              ))}
              {flaggedLearners.length > 5 && (
                <p className="text-[11px] text-center text-muted-foreground pt-1">
                  +{flaggedLearners.length - 5} more learners require attention in the roster
                </p>
              )}
            </div>
          )}
        </div>

        {/* Department Announcements & Bulletins */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-2">
              <MegaphoneIcon className="size-4 text-primary" aria-hidden="true" />
              <h3 className="text-sm font-bold text-foreground sm:text-base">
                Department Bulletins & Notices
              </h3>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs h-7 gap-1">
              <Link to="/institution/departments#dept-announcements">
                <span>Manage</span>
                <ChevronRight className="size-3" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          {announcements.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/15 p-6 text-center space-y-1.5">
              <FileText className="size-6 mx-auto text-muted-foreground" aria-hidden="true" />
              <p className="text-xs font-semibold text-foreground">
                No active announcements
              </p>
              <p className="text-[11px] text-muted-foreground">
                Post important notices, exam schedules, or reminders for department faculty and students.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border/60 bg-muted/20 p-3.5 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="font-bold text-foreground truncate">
                      {item.title}
                    </h5>
                    {item.pinned && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 text-[10px] font-semibold shrink-0">
                        <PinIcon className="size-2.5" aria-hidden="true" />
                        Pinned
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground line-clamp-2 text-[11px]">
                    {item.body}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground/80">
                    <span>{item.authorName || "Department Head"}</span>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Dean's Quick Action Routing Hub */}
      <div className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider text-[11px]">
          Department Command Shortcuts
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Link
            to="/institution/departments#dept-learner-table"
            className="group flex flex-col justify-between rounded-xl border border-border/60 bg-muted/20 p-4 transition-all hover:border-primary/50 hover:bg-muted/40 hover:shadow-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <UsersRound className="size-4 text-primary group-hover:scale-110 transition-transform" aria-hidden="true" />
                <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
              </div>
              <h4 className="text-xs font-bold text-foreground pt-1">
                Learner Roster & Advising
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Inspect learner milestones, graded attempts, and academic status.
              </p>
            </div>
          </Link>

          <Link
            to="/institution/departments#dept-section-breakdown"
            className="group flex flex-col justify-between rounded-xl border border-border/60 bg-muted/20 p-4 transition-all hover:border-primary/50 hover:bg-muted/40 hover:shadow-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Layers className="size-4 text-emerald-600 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
              </div>
              <h4 className="text-xs font-bold text-foreground pt-1">
                Sections & Classrooms
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Manage cohort sections, capacity limits, and learner allocation.
              </p>
            </div>
          </Link>

          <Link
            to="/institution/departments#dept-co-authorities"
            className="group flex flex-col justify-between rounded-xl border border-border/60 bg-muted/20 p-4 transition-all hover:border-primary/50 hover:bg-muted/40 hover:shadow-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <ShieldCheck className="size-4 text-indigo-600 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
              </div>
              <h4 className="text-xs font-bold text-foreground pt-1">
                Faculty & Co-Authorities
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Invite assistant deans, chairs, and delegate administrative roles.
              </p>
            </div>
          </Link>

          <Link
            to="/institution/metrics"
            className="group flex flex-col justify-between rounded-xl border border-border/60 bg-muted/20 p-4 transition-all hover:border-primary/50 hover:bg-muted/40 hover:shadow-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <TrendingUp className="size-4 text-amber-600 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
              </div>
              <h4 className="text-xs font-bold text-foreground pt-1">
                Curriculum Analytics
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Full metrics, period comparisons, readiness tiers, and topic analysis.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
