import { Fragment, useMemo, useState } from "react"
import { Link, useOutletContext } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  BadgeCheckIcon,
  BarChart3Icon,
  BookOpenCheckIcon,
  Building2,
  CheckCheck,
  CircleDotIcon,
  ClipboardListIcon,
  GraduationCap,
  GraduationCapIcon,
  MailPlusIcon,
  TargetIcon,
  TicketIcon,
  TrendingUp,
  UserCheck,
  Users,
  UsersIcon,
} from "@/components/icons"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  InstitutionPageHeader,
  InstitutionStatusBadge,
  accessWindowStatus,
  formatDateTime,
} from "@/components/institution/institution-ui.jsx"
import { BentoTile } from "@/components/commons/bento.jsx"
import { DashboardBoard } from "@/components/commons/dashboard-board.jsx"
import { DashboardRearrangeControls } from "@/components/commons/dashboard-rearrange-controls.jsx"
import { useDashboardLayout } from "@/hooks/use-dashboard-layout.js"
import { useInstitutionData } from "@/hooks/use-institution-data.js"
import {
  getDepartmentStats,
  getInstitutionLearningStats,
} from "@/services/institutionLearningStatsService.js"
import { getDepartments } from "@/services/institutionService.js"
import {
  BarBreakdownChart,
  DonutChart,
  RadialGauge,
  readinessColor,
  readinessInk,
  useChartTheme,
} from "@/components/charts/rebyu-charts.jsx"
import InstitutionDrilldownStatsCard from "@/components/institution/institution-drilldown-stats-card.jsx"
import { DateRangeNavigator } from "@/components/commons/date-range-navigator.jsx"

const PROGRESS_BUCKETS = [
  { label: "0-25%", min: 0, max: 25 },
  { label: "26-50%", min: 26, max: 50 },
  { label: "51-75%", min: 51, max: 75 },
  { label: "76-100%", min: 76, max: 100 },
]

/** Not-yet-measured reads as a dash. A zero would claim a fact we do not have. */
function count(value) {
  return value == null ? "—" : Number(value).toLocaleString()
}

function percent(value, digits = 0) {
  return value == null ? "—" : `${Number(value).toFixed(digits)}%`
}

/** Relative-ish, but plain: a roster is scanned, not read. */
function lastActive(value) {
  if (!value) return "No activity yet"
  return `Last active ${formatDateTime(value)}`
}

/**
 * Standardized premium card header matching the institution analytics standard:
 * Icon badge (rounded-lg with emerald tint) + uppercase kicker + bold title + hint/chips.
 */
function DashboardCardHeader({
  icon: Icon,
  kicker,
  title,
  hint,
  chip,
  action,
  className = "",
}) {
  return (
    <div
      className={`flex items-start justify-between gap-2 border-b border-border/60 pb-2.5 mb-3 ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {Icon ? (
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        ) : null}
        <div className="min-w-0">
          {kicker ? (
            <h3 className="text-[10px] font-bold uppercase leading-tight tracking-wider text-emerald-700 dark:text-emerald-400">
              {kicker}
            </h3>
          ) : null}
          <p className="truncate text-xs font-extrabold leading-snug text-foreground sm:text-sm">
            {title}
          </p>
          {hint ? (
            <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground">
              {hint}
            </p>
          ) : null}
        </div>
      </div>
      {(chip || action) && (
        <div className="flex shrink-0 items-center gap-2">
          {chip}
          {action}
        </div>
      )}
    </div>
  )
}

/**
 * One supporting figure on the "At a glance" strip.
 *
 * Deliberately smaller than a `BentoStat`: these are the numbers you read after
 * the three gauges, not instead of them, and giving each one a card of its own
 * was what turned the top of this board into a wall of boxes. No border, no
 * fill -- the strip's own tile is the container, and the icon is muted so a row
 * of five does not read as five buttons.
 */
function Figure({ icon: Icon, label, value, hint, alert = false }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      {Icon ? (
        <span
          className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl ${
            alert ? "bg-rb-fox-wash text-rb-fox-lip" : "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      ) : null}
      <div className="min-w-0">
        <dt className="truncate text-xs font-semibold text-muted-foreground">{label}</dt>
        <dd
          className={`mt-0.5 font-rb-display text-2xl font-extrabold leading-none tabular-nums ${
            alert ? "text-rb-fox-lip" : "text-foreground"
          }`}
        >
          {value}
        </dd>
        {hint ? (
          <p className="mt-1 truncate text-[11px] leading-4 text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    </div>
  )
}

export default function InstitutionDashboardPage() {
  const { institution, institutionLoading, institutionError, refetchInstitution } =
    useOutletContext()
  const data = useInstitutionData(institution?.institutionId)
  const layout = useDashboardLayout("institution")

  /* Learning statistics come from their own tenant-scoped endpoint rather than
     being derived in the browser: progress lives on the assignment rows, but
     lessons finished, graded attempts, pass rate and average score are rollups
     over data the portal overview does not carry, and doing them per member
     client-side would mean a request per learner. */
  const statsQuery = useQuery({
    queryKey: ["institution-learning-stats", institution?.institutionId],
    queryFn: getInstitutionLearningStats,
    enabled: institution?.institutionId != null,
    retry: 1,
  })

  const departmentStatsQuery = useQuery({
    queryKey: ["institution-group-stats"],
    queryFn: getDepartmentStats,
    enabled: institution?.institutionId != null,
    retry: 1,
  })

  const departmentsQuery = useQuery({
    queryKey: ["departments", institution?.institutionId],
    queryFn: () => getDepartments({ institutionId: institution?.institutionId }),
    enabled: institution?.institutionId != null,
    retry: 1,
  })

  const summary = statsQuery.data?.summary ?? {}
  const members = useMemo(
    () => (Array.isArray(statsQuery.data?.members) ? statsQuery.data.members : []),
    [statsQuery.data]
  )

  const groupStats = useMemo(
    () => (Array.isArray(departmentStatsQuery.data) ? departmentStatsQuery.data : []),
    [departmentStatsQuery.data]
  )

  const departments = useMemo(
    () => (Array.isArray(departmentsQuery.data) ? departmentsQuery.data : []),
    [departmentsQuery.data]
  )

  const [selectedDepartmentId, setSelectedDepartmentId] = useState("all")

  // Map each member to their designated department
  const membersWithDepartment = useMemo(() => {
    const deptLookup = new Map() // learnerId -> { departmentId, departmentName }

    // Seed from assignments and group memberships
    data.assignments?.forEach((assignment) => {
      const membership = data.groupByInstitutionCertLearnerId?.get(
        assignment.institutionCertLearnerId
      )
      if (membership?.departmentId != null) {
        const dId = String(membership.departmentId)
        const dName =
          membership.departmentName ||
          departments.find((d) => String(d.departmentId ?? d.id) === dId)?.departmentName ||
          `Department #${dId}`
        deptLookup.set(assignment.learnerId, {
          departmentId: dId,
          departmentName: dName,
        })
      }
    })

    return members.map((member) => {
      const dept = deptLookup.get(member.learnerId)
      return {
        ...member,
        departmentId: dept?.departmentId ?? "unassigned",
        departmentName: dept?.departmentName ?? "General / Unassigned",
      }
    })
  }, [members, data.assignments, data.groupByInstitutionCertLearnerId, departments])

  // Available departments for the filter dropdown
  const availableDepartments = useMemo(() => {
    const map = new Map()

    // 1. Registered departments
    departments.forEach((dept) => {
      const id = String(dept.departmentId ?? dept.id ?? "")
      if (id) {
        map.set(id, {
          id,
          name: dept.departmentName || dept.name || `Department #${id}`,
          count: 0,
        })
      }
    })

    // 2. Group stats
    groupStats.forEach((group) => {
      if (group?.departmentId != null) {
        const id = String(group.departmentId)
        if (!map.has(id)) {
          map.set(id, {
            id,
            name: group.departmentName || `Department #${id}`,
            count: Number(group.learners ?? 0),
          })
        }
      }
    })

    // 3. Count member associations
    membersWithDepartment.forEach((member) => {
      if (member.departmentId !== "unassigned") {
        if (map.has(member.departmentId)) {
          const entry = map.get(member.departmentId)
          entry.count = (entry.count || 0) + 1
        } else {
          map.set(member.departmentId, {
            id: member.departmentId,
            name: member.departmentName,
            count: 1,
          })
        }
      }
    })

    const unassignedCount = membersWithDepartment.filter(
      (m) => m.departmentId === "unassigned"
    ).length

    return {
      list: Array.from(map.values()),
      unassignedCount,
    }
  }, [departments, groupStats, membersWithDepartment])

  // Filtered members according to department selection
  const filteredMembers = useMemo(() => {
    if (selectedDepartmentId === "all") return membersWithDepartment
    return membersWithDepartment.filter(
      (m) => m.departmentId === selectedDepartmentId
    )
  }, [membersWithDepartment, selectedDepartmentId])

  // Grouped members for sectioned table presentation
  const departmentGroups = useMemo(() => {
    if (selectedDepartmentId !== "all") {
      const selectedDept =
        availableDepartments.list.find((d) => d.id === selectedDepartmentId) || {
          id: selectedDepartmentId,
          name:
            selectedDepartmentId === "unassigned"
              ? "General / Unassigned"
              : "Department",
        }
      return [
        {
          id: selectedDepartmentId,
          name: selectedDept.name,
          members: filteredMembers,
        },
      ]
    }

    const groups = new Map()
    membersWithDepartment.forEach((m) => {
      if (!groups.has(m.departmentId)) {
        groups.set(m.departmentId, {
          id: m.departmentId,
          name: m.departmentName,
          members: [],
        })
      }
      groups.get(m.departmentId).members.push(m)
    })

    return Array.from(groups.values())
  }, [selectedDepartmentId, filteredMembers, membersWithDepartment, availableDepartments])

  // Department-level aggregated summary rows for the stats table
  // Starts from ALL registered departments (not just those with active members)
  // so zero-enrolled departments still appear as rows.
  const departmentSummaryRows = useMemo(() => {
    // Index groupStats by departmentId
    const statsByDeptId = new Map()
    groupStats.forEach((g) => {
      if (g?.departmentId != null) {
        statsByDeptId.set(String(g.departmentId), g)
      }
    })

    // Index member lists by departmentId from departmentGroups
    const membersByDeptId = new Map()
    departmentGroups.forEach((group) => {
      membersByDeptId.set(String(group.id), group.members)
    })

    // Collect all departments: registered ones + any in membersWithDepartment
    const allDepts = new Map()

    // 1. All registered departments (even with 0 members)
    availableDepartments.list.forEach((dept) => {
      allDepts.set(String(dept.id), { id: String(dept.id), name: dept.name })
    })

    // 2. Unassigned bucket if it exists
    if (availableDepartments.unassignedCount > 0) {
      allDepts.set("unassigned", { id: "unassigned", name: "General / Unassigned" })
    }

    // 3. Any extra departments surfaced by member data
    membersWithDepartment.forEach((m) => {
      if (!allDepts.has(String(m.departmentId))) {
        allDepts.set(String(m.departmentId), { id: String(m.departmentId), name: m.departmentName })
      }
    })

    return Array.from(allDepts.values()).map(({ id, name }) => {
      const apiStat = statsByDeptId.get(id) ?? null
      const mems = membersByDeptId.get(id) ?? []
      const memberCount = mems.length

      const avgProgress =
        apiStat?.averageProgress != null
          ? Number(apiStat.averageProgress)
          : memberCount > 0
          ? Math.round(mems.reduce((s, m) => s + Number(m.averageProgress ?? 0), 0) / memberCount)
          : 0
      const lessonsCompleted =
        apiStat?.lessonsCompleted != null
          ? Number(apiStat.lessonsCompleted)
          : mems.reduce((s, m) => s + Number(m.lessonsCompleted ?? 0), 0)
      const gradedAttempts =
        apiStat?.gradedAttempts != null
          ? Number(apiStat.gradedAttempts)
          : mems.reduce((s, m) => s + Number(m.gradedAttempts ?? 0), 0)
      const passRate =
        apiStat?.passRate != null
          ? Number(apiStat.passRate)
          : memberCount > 0
          ? Math.round(mems.reduce((s, m) => s + Number(m.passRate ?? 0), 0) / memberCount)
          : null
      const averageScore =
        apiStat?.averageScore != null
          ? Number(apiStat.averageScore)
          : memberCount > 0
          ? Math.round(mems.reduce((s, m) => s + Number(m.averageScore ?? 0), 0) / memberCount)
          : null
      const completed = mems.filter((m) => Number(m.averageProgress ?? 0) >= 100).length
      const inProgress = mems.filter(
        (m) => Number(m.averageProgress ?? 0) > 0 && Number(m.averageProgress ?? 0) < 100
      ).length

      return {
        id,
        name,
        memberCount,
        avgProgress,
        lessonsCompleted,
        gradedAttempts,
        passRate,
        averageScore,
        completed,
        inProgress,
      }
    })
  }, [departmentGroups, groupStats, availableDepartments, membersWithDepartment])

  /* The cohort shape the Analytics page used to draw, over the same roster the
     members table below uses -- so the two can never disagree, which is what
     happens when a second page recomputes the same thing from a different read. */
  const cohort = useMemo(() => {
    const buckets = PROGRESS_BUCKETS.map((bucket) => ({
      name: bucket.label,
      value: members.filter((member) => {
        const progress = Number(member.averageProgress ?? 0)
        return progress >= bucket.min && progress <= bucket.max
      }).length,
    }))

    // Below 30% and still holding an active assignment: someone who finished
    // and was archived is not "needing support", they are done.
    const needingSupport = members.filter(
      (member) =>
        member.activeCertifications > 0 && Number(member.averageProgress ?? 0) < 30
    )

    return { buckets, needingSupport }
  }, [members])

  const recentInvitations = useMemo(
    () =>
      [...data.invitations]
        .sort((a, b) => new Date(b.sentAt ?? 0) - new Date(a.sentAt ?? 0))
        .slice(0, 5),
    [data.invitations]
  )

  const pendingInvitations = useMemo(
    () => data.invitations.filter((invite) => invite.status === "PENDING").length,
    [data.invitations]
  )

  // Read once here rather than inside the tiles: `useChartTheme` is a hook and
  // the tiles are built inside a useMemo callback, which is not a component.
  const chartTheme = useChartTheme()

  const cohortStats = useMemo(() => {
    const total = members.length
    const completed = members.filter(
      (m) => Number(m.averageProgress ?? 0) >= 100
    ).length
    const inProgress = members.filter(
      (m) =>
        Number(m.averageProgress ?? 0) >= 25 &&
        Number(m.averageProgress ?? 0) < 100
    ).length
    const stalled = members.filter(
      (m) => Number(m.averageProgress ?? 0) < 25
    ).length

    const pctCompleted = total > 0 ? Math.round((completed / total) * 100) : 0
    const pctInProgress = total > 0 ? Math.round((inProgress / total) * 100) : 0
    const pctStalled =
      total > 0 ? Math.max(100 - pctCompleted - pctInProgress, 0) : 0

    return {
      total,
      completed,
      inProgress,
      stalled,
      pctCompleted,
      pctInProgress,
      pctStalled,
    }
  }, [members])

  const healthBadge = useMemo(() => {
    const avgScore = Number(summary.averageScore ?? 0)
    if (avgScore === 0) {
      return {
        label: "No Activity",
        classes: "border-border bg-muted text-muted-foreground",
      }
    }
    if (avgScore < 40) {
      return {
        label: "Needs Focus",
        classes:
          "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-500/20 dark:bg-amber-950/40 dark:text-amber-400",
      }
    }
    if (avgScore < 70) {
      return {
        label: "Moderate",
        classes:
          "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:border-sky-500/20 dark:bg-sky-950/40 dark:text-sky-400",
      }
    }
    return {
      label: "On Track",
      classes:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-400",
    }
  }, [summary.averageScore])

  const tiles = useMemo(() => {
    const failed = statsQuery.isError
    const seatsTotal = summary.seatsTotal ?? 0
    const seatsUsed = summary.seatsUsed ?? 0

    return [
      {
        id: "ent-members",
        col: 3,
        row: 3,
        x: 0,
        y: 0,
        element: (
          <BentoTile tone="plain" col={3} row={3}>
            <InstitutionDrilldownStatsCard
              data={data}
              groupStats={groupStats}
              departments={departments}
              members={members}
              summary={summary}
              failed={failed}
            />
          </BentoTile>
        ),
      },
      {
        id: "ent-seats",
        col: 3,
        row: 1,
        x: 3,
        y: 0,
        element: (
          <BentoTile tone="plain" col={3} row={1}>
            <div className="flex h-full flex-col justify-between">
              <DashboardCardHeader
                icon={TicketIcon}
                kicker="Capacity & Licensing"
                title="Learner Slots & Capacity"
              />

              <div className="flex items-end justify-between gap-2 pt-1">
                <div className="min-w-0">
                  <div className="font-rb-display text-2xl font-black leading-none tracking-tight tabular-nums text-foreground sm:text-3xl">
                    {failed ? "—" : `${seatsUsed} / ${seatsTotal}`}
                  </div>
                  <div className="mt-1 truncate text-[11px] font-semibold text-muted-foreground">
                    {seatsTotal > 0
                      ? `${Math.round((seatsUsed / seatsTotal) * 100)}% capacity utilized`
                      : "No slots allocated"}
                  </div>
                </div>

                {!failed && seatsTotal > 0 ? (
                  <div className="size-[72px] shrink-0">
                    <RadialGauge
                      value={(seatsUsed / seatsTotal) * 100}
                      label="filled"
                      height={72}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </BentoTile>
        ),
      },
      {
        id: "ent-progress",
        col: 3,
        row: 2,
        x: 3,
        y: 1,
        element: (
          <BentoTile tone="plain" col={3} row={2}>
            <div className="flex h-full flex-col justify-between gap-3">
              <DashboardCardHeader
                icon={TargetIcon}
                kicker="Academic Performance"
                title="Institutional Average Progress"
              />

              {/* Main Content: Left Hero (Radial Gauge + Big %) & Right 2x2 Metric Grid */}
              <div className="my-auto grid grid-cols-1 items-center gap-4 sm:grid-cols-12 py-1">
                {/* Left Column (5 cols): Radial Gauge & Big Stat Hero */}
                <div className="flex items-center gap-3 sm:col-span-5">
                  {!failed && summary.averageProgress != null ? (
                    <div className="size-[84px] shrink-0">
                      <RadialGauge
                        value={Number(summary.averageProgress)}
                        label="complete"
                        height={84}
                        color={readinessColor(chartTheme, Number(summary.averageProgress))}
                        valueInk={readinessInk(chartTheme, Number(summary.averageProgress))}
                      />
                    </div>
                  ) : null}

                  <div className="min-w-0">
                    <div className="font-rb-display text-2xl font-black leading-none tracking-tight tabular-nums text-foreground sm:text-3xl">
                      {failed ? "—" : percent(summary.averageProgress, 1)}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-muted-foreground">
                      Overall completion
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                      <TrendingUp className="size-3.5" />
                      <span>{cohortStats.total} learners</span>
                    </div>
                  </div>
                </div>

                {/* Right Column (7 cols): 2x2 Grid of Key Learning Metrics */}
                <div className="grid grid-cols-2 gap-2 sm:col-span-7">
                  <div className="rounded-lg border border-border/70 bg-muted/30 p-2.5">
                    <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span>Pass Rate</span>
                      <CheckCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="mt-1.5 font-rb-display text-lg font-bold tabular-nums text-foreground">
                      {failed ? "—" : percent(summary.passRate)}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-muted/30 p-2.5">
                    <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span>Avg Score</span>
                      <TargetIcon className="size-3.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="mt-1.5 font-rb-display text-lg font-bold tabular-nums text-foreground">
                      {failed ? "—" : percent(summary.averageScore)}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-muted/30 p-2.5">
                    <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span>Attempts</span>
                      <ClipboardListIcon className="size-3.5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div className="mt-1.5 font-rb-display text-lg font-bold tabular-nums text-foreground">
                      {failed ? "—" : count(summary.gradedAttempts)}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-muted/30 p-2.5">
                    <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span>Lessons Done</span>
                      <BookOpenCheckIcon className="size-3.5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="mt-1.5 font-rb-display text-lg font-bold tabular-nums text-foreground">
                      {failed ? "—" : count(summary.lessonsCompleted)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Cohort Status Summary */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                    <span>Completed: <strong className="text-foreground">{cohortStats.completed}</strong></span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-500" />
                    <span>In Progress: <strong className="text-foreground">{cohortStats.inProgress}</strong></span>
                  </span>
                </div>
                {cohortStats.stalled > 0 ? (
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-slate-400" />
                    <span>Needs Support: <strong className="text-foreground">{cohortStats.stalled}</strong></span>
                  </span>
                ) : null}
              </div>
            </div>
          </BentoTile>
        ),
      },
      {
        /* Six one-row stat boxes used to sit here -- lessons, attempts, score,
           certs, pending invitations, needing support -- each with its own
           border, its own icon chip and its own 48px number. Side by side they
           read as six things of equal weight, which is exactly what they are
           not: they are the supporting figures under the three gauges above.
           One strip states them in a row, so the board has three headline
           tiles and one line of detail rather than nine competing boxes. */
        id: "ent-key-figures",
        col: 6,
        row: 1,
        x: 0,
        y: 3,
        element: (
          <BentoTile col={6} row={1}>
            <DashboardCardHeader
              icon={BarChart3Icon}
              kicker="Executive Summary"
              title="Institutional Activity at a Glance"
              hint="Learning activity across the whole institution."
            />
            <dl className="grid flex-1 grid-cols-2 items-center gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
              <Figure
                icon={BookOpenCheckIcon}
                label="Lessons completed"
                value={failed ? "—" : count(summary.lessonsCompleted)}
              />
              <Figure
                icon={ClipboardListIcon}
                label="Graded attempts"
                value={failed ? "—" : count(summary.gradedAttempts)}
                hint={failed ? null : `${percent(summary.passRate)} pass rate`}
              />
              <Figure
                icon={UserCheck}
                label="Average score"
                value={failed ? "—" : percent(summary.averageScore)}
                hint={failed ? null : "Weighted by attempts"}
              />
              <Figure
                icon={GraduationCapIcon}
                label="Active certifications"
                value={
                  data.institutionCerts.filter((cert) =>
                    ["active", "expiring_soon"].includes(accessWindowStatus(cert).status)
                  ).length
                }
              />
              <Figure
                icon={BarChart3Icon}
                label="Needing support"
                value={failed ? "—" : cohort.needingSupport.length}
                hint={failed ? null : "Active, below 30%"}
                /* The one figure on this strip that is a call to action rather
                   than a record of what happened, so it is the one allowed to
                   carry colour. */
                alert={!failed && cohort.needingSupport.length > 0}
              />
            </dl>
          </BentoTile>
        ),
      },
      {
        id: "ent-completion-distribution",
        col: 3,
        row: 2,
        x: 0,
        y: 4,
        element: (
          <BentoTile col={3} row={2}>
            <DashboardCardHeader
              icon={CircleDotIcon}
              kicker="Progress Milestones"
              title="Learner Completion Distribution"
              hint="How member progress is spread across the roster"
            />
            <DonutChart
              data={cohort.buckets.filter((bucket) => bucket.value > 0)}
              height={168}
              centerValue={String(members.length)}
              centerLabel={members.length === 1 ? "member" : "members"}
            />
          </BentoTile>
        ),
      },
      {
        id: "ent-group-completion",
        col: 3,
        row: 2,
        x: 3,
        y: 4,
        element: (
          <BentoTile col={3} row={2}>
            <DashboardCardHeader
              icon={Building2}
              kicker="Department Benchmark"
              title="Completion by Department"
              hint="Average progress across each department's active learners"
            />
            {departmentStatsQuery.isError ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Department completion could not be loaded.
              </p>
            ) : (
              <BarBreakdownChart
                data={groupStats.map((group) => ({
                  group: group.departmentName,
                  completion: Number(group.averageProgress ?? 0),
                }))}
                categoryKey="group"
                valueKey="completion"
                unit="%"
                target={60}
                height={168}
                categoryWidth={96}
              />
            )}
          </BentoTile>
        ),
      },
      {
        id: "ent-member-table",
        col: 6,
        row: 3,
        x: 0,
        y: 6,
        element: (
          <BentoTile col={6} row={3} className="!p-0">
            <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
              <DashboardCardHeader
                icon={Building2}
                kicker="Department Analytics"
                title="Performance by Department"
                hint="Aggregated learning metrics across all departments — ranked by avg progress."
                chip={
                  departmentSummaryRows.length > 0 ? (
                    <Badge
                      variant="secondary"
                      className="border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      {departmentSummaryRows.length}{" "}
                      {departmentSummaryRows.length === 1 ? "department" : "departments"}
                    </Badge>
                  ) : null
                }
              />

              {statsQuery.isError ? (
                <p className="text-sm text-muted-foreground">
                  Learning statistics could not be loaded.
                </p>
              ) : departmentSummaryRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground">
                  <Building2 className="mb-2 size-8 text-muted-foreground/40" />
                  <p>No departments with active learners yet.</p>
                  <div className="mt-3">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/institution/departments">Manage departments</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-x-auto [mask-image:linear-gradient(to_right,black_calc(100%-1.5rem),transparent)] md:[mask-image:none]">
                  <table className="w-full text-sm" style={{ minWidth: 680 }}>
                    <colgroup>
                      <col style={{ width: "22%" }} />   {/* Department */}
                      <col style={{ width: "10%" }} />   {/* Learners */}
                      <col style={{ width: "18%" }} />   {/* Avg Progress */}
                      <col style={{ width: "10%" }} />   {/* Completed */}
                      <col style={{ width: "10%" }} />   {/* In Progress */}
                      <col style={{ width: "10%" }} />   {/* Lessons */}
                      <col style={{ width: "10%" }} />   {/* Attempts */}
                      <col style={{ width: "10%" }} />   {/* Avg Score */}
                    </colgroup>
                    <thead className="sticky top-0 bg-background z-10">
                      <tr className="border-b border-transparent text-xs font-semibold text-muted-foreground">
                        <th className="py-2.5 pl-2 pr-3 text-left">Department</th>
                        <th className="py-2.5 px-2 text-center">Learners</th>
                        <th className="py-2.5 px-3 text-left">Avg Progress</th>
                        <th className="py-2.5 px-2 text-center">Completed</th>
                        <th className="py-2.5 px-2 text-center">In Progress</th>
                        <th className="py-2.5 px-2 text-center">Lessons</th>
                        <th className="py-2.5 px-2 text-center">Attempts</th>
                        <th className="py-2.5 px-2 text-center">Avg Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...departmentSummaryRows]
                        .sort((a, b) => b.avgProgress - a.avgProgress)
                        .map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-transparent hover:bg-muted/30 transition-colors"
                        >
                          {/* Department name */}
                          <td className="py-2.5 pl-2 pr-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="grid size-6 shrink-0 place-items-center rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                                <Building2 className="size-3.5" />
                              </span>
                              <span className="truncate font-bold text-foreground text-xs" title={row.name}>
                                {row.name}
                              </span>
                            </div>
                          </td>

                          {/* Learner count - centered */}
                          <td className="py-2.5 px-2 text-center">
                            <div className="flex justify-center">
                              <span className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-muted/30 px-2 py-0.5 text-xs font-semibold tabular-nums">
                                <UsersIcon className="size-3 text-muted-foreground" />
                                {row.memberCount}
                              </span>
                            </div>
                          </td>

                          {/* Avg progress bar — smooth rounded ends */}
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2 max-w-[130px]">
                              <Progress
                                value={row.avgProgress}
                                aria-label={`${row.name} avg progress`}
                                className="h-2 flex-1 rounded-full bg-muted/60 [&>[data-slot=progress-indicator]]:rounded-full"
                              />
                              <span className="shrink-0 tabular-nums text-xs font-bold text-foreground w-8 text-right">
                                {percent(row.avgProgress)}
                              </span>
                            </div>
                          </td>

                          {/* Completed - centered */}
                          <td className="py-2.5 px-2 text-center tabular-nums text-xs">
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                              {count(row.completed)}
                            </span>
                          </td>

                          {/* In progress - centered */}
                          <td className="py-2.5 px-2 text-center tabular-nums text-xs">
                            <span className={`font-semibold ${row.inProgress > 0 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"}`}>
                              {count(row.inProgress)}
                            </span>
                          </td>

                          {/* Lessons - centered */}
                          <td className="py-2.5 px-2 text-center tabular-nums text-xs text-muted-foreground">
                            {count(row.lessonsCompleted)}
                          </td>

                          {/* Attempts - centered */}
                          <td className="py-2.5 px-2 text-center tabular-nums text-xs text-muted-foreground">
                            {count(row.gradedAttempts)}
                          </td>

                          {/* Avg score - centered */}
                          <td className="py-2.5 px-2 text-center tabular-nums text-xs font-semibold text-foreground">
                            {percent(row.averageScore)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </BentoTile>
        ),
      },
      {
        id: "ent-invitations",
        col: 3,
        row: 2,
        x: 0,
        y: 9,
        element: (
          <BentoTile col={3} row={2} className="!p-0">
            <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
              <DashboardCardHeader
                icon={MailPlusIcon}
                kicker="Onboarding & Access"
                title="Recent Learner Invitations"
                hint="The latest learner invitations sent."
                chip={
                  pendingInvitations > 0 ? (
                    <Badge
                      variant="secondary"
                      className="gap-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      <MailPlusIcon className="size-3" aria-hidden="true" />
                      {pendingInvitations} pending
                    </Badge>
                  ) : null
                }
              />

              {recentInvitations.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No invitations sent yet.
                  <div className="mt-3">
                    <Button asChild size="sm" variant="outline" >
                      <Link to="/institution/certifications">Invite a learner</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <ul className="-mr-2 min-h-0 flex-1 divide-y-2 divide-border overflow-y-auto pr-2">
                  {recentInvitations.map((invitation) => (
                    <li
                      key={invitation.invitationId}
                      className="flex items-center justify-between gap-3 py-3 text-sm first:pt-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold">{invitation.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Sent {formatDateTime(invitation.sentAt)}
                        </p>
                      </div>
                      <InstitutionStatusBadge status={invitation.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </BentoTile>
        ),
      },
      {
        id: "ent-allocations",
        col: 3,
        row: 2,
        x: 3,
        y: 9,
        element: (
          <BentoTile col={3} row={2} className="!p-0">
            <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
              <DashboardCardHeader
                icon={GraduationCap}
                kicker="Certification Inventory"
                title="Program Slot Allocations"
                hint="Slot usage per certification your institution has access to."
                chip={
                  data.institutionCerts.length > 0 ? (
                    <Badge
                      variant="secondary"
                      className="border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      {data.institutionCerts.length} active
                    </Badge>
                  ) : null
                }
              />

              {data.institutionCerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No certification allocations yet. Submit a partnership request to get started.
                </p>
              ) : (
                <div className="-mr-2 min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
                  {data.institutionCerts.map((institutionCert) => {
                    const certification = data.certificationById.get(institutionCert.certificationId)
                    const used = institutionCert.usedSlots ?? 0
                    const total = institutionCert.totalSlots ?? 0
                    const pct = total > 0 ? (used / total) * 100 : 0

                    return (
                      <div key={institutionCert.institutionCertId} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="truncate font-bold">
                            {certification?.title ?? `Certification #${institutionCert.certificationId}`}
                          </span>
                          <span className="shrink-0 text-muted-foreground">
                            {used} / {total} slots
                          </span>
                        </div>
                        <Progress value={pct} aria-label="Slot usage" />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </BentoTile>
        ),
      },
    ]
  }, [
    chartTheme,
    statsQuery.isError,
    departmentStatsQuery.isError,
    summary,
    members,
    cohort,
    groupStats,
    departments,
    departmentSummaryRows,
    data,
    data.institutionCerts,
    data.certificationById,
    data.assignments,
    data.groupByInstitutionCertLearnerId,
    data.learnerById,
    recentInvitations,
    pendingInvitations,
  ])

  if (institutionLoading || (institution && data.isLoading)) {
    return <InstitutionLoadingSkeleton />
  }

  if (institutionError) {
    return (
      <InstitutionErrorState
        title="Unable to load your institution"
        onRetry={refetchInstitution}
      />
    )
  }

  if (!institution) {
    return (
      <InstitutionEmptyState
        title="No institution found"
        description="Once your institution is registered with REBYU, its dashboard will appear here."
      />
    )
  }

  return (
    <div className="space-y-6">
      <InstitutionPageHeader
        title={institution.institutionName}
        subtitle="How your members are progressing across their assigned certifications."
        actions={
          <div className="flex items-center gap-2">
            {institution.isVerified ? (
              <Badge variant="default" className="gap-1">
                <BadgeCheckIcon className="size-3.5" aria-hidden="true" />
                Verified
              </Badge>
            ) : (
              <Badge variant="secondary">Verification pending</Badge>
            )}
          </div>
        }
      />

      {data.isError ? (
        <InstitutionErrorState onRetry={data.refetchAll} />
      ) : (
        <>
          {/* Toolbar row: Date range navigator directly above the big card, rearrange controls on the right */}
          <div className="relative z-30 flex flex-wrap items-center justify-between gap-4 mb-2.5">
            <div className="w-full md:w-[calc(50%-10px)]">
              <DateRangeNavigator className="w-full" />
            </div>

            <div className="ml-auto flex items-center gap-3">
              <DashboardRearrangeControls
                rearranging={layout.rearranging}
                onStart={layout.startRearranging}
                onFinish={layout.finishRearranging}
                onCancel={layout.cancelRearranging}
                onReset={layout.resetLayout}
              />
            </div>
          </div>

          {/* The four chart panels that used to sit here were fed from
              components/charts/sample-data.js -- invented months, invented group
              names, a donut whose centre read "120 learners" regardless of the
              roster. They are replaced by the institution's own figures rather
              than kept behind a "sample data" chip. */}
          <DashboardBoard
            tiles={tiles}
            layout={layout.tileLayout}
            editing={layout.rearranging}
            onLayoutChange={layout.handleLayoutChange}
          />
        </>
      )}
    </div>
  )
}
