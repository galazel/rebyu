import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  BarChart3Icon,
  BookOpenCheckIcon,
  BookOpenIcon,
  Building2,
  CheckCheck,
  CircleDotIcon,
  ClipboardListIcon,
  GraduationCap,
  GraduationCapIcon,
  MailPlusIcon,
  TargetIcon,
  UserCheck,
  UsersIcon,
  UsersRoundIcon,
} from "@/components/icons"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  InstitutionEmptyState,
  InstitutionErrorState,
  InstitutionLoadingSkeleton,
  InstitutionStatusBadge,
  accessWindowStatus,
  formatDateTime,
} from "@/components/institution/institution-ui.jsx"
import { BubbleCard, toneForIndex } from "@/components/commons/bubble-card.jsx"
import { getDepartments } from "@/services/institutionService.js"
import { DateRangeNavigator } from "@/components/commons/date-range-navigator.jsx"
import { DashboardRearrangeControls } from "@/components/commons/dashboard-rearrange-controls.jsx"
import { DashboardBoard } from "@/components/commons/dashboard-board.jsx"
import { BentoTile } from "@/components/commons/bento.jsx"
import { useDashboardLayout } from "@/hooks/use-dashboard-layout.js"
import {
  getDepartmentStats,
  getInstitutionLearningStats,
} from "@/services/institutionLearningStatsService.js"
import { useInstitutionData } from "@/hooks/use-institution-data.js"
import {
  BarBreakdownChart,
  BeadedRadialGauge,
  DonutChart,
} from "@/components/charts/rebyu-charts.jsx"

const PROGRESS_BUCKETS = [
  { label: "0-25%", min: 0, max: 25 },
  { label: "26-50%", min: 26, max: 50 },
  { label: "51-75%", min: 51, max: 75 },
  { label: "76-100%", min: 76, max: 100 },
]

function count(value) {
  return value == null ? "—" : Number(value).toLocaleString()
}

function percent(value, digits = 0) {
  return value == null ? "—" : `${Number(value).toFixed(digits)}%`
}

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

function Figure({ icon: Icon, label, value, hint, alert = false }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      {Icon ? (
        <span
          className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl ${alert ? "bg-rb-fox-wash text-rb-fox-lip" : "bg-muted text-muted-foreground"
            }`}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      ) : null}
      <div className="min-w-0">
        <dt className="truncate text-xs font-semibold text-muted-foreground">{label}</dt>
        <dd
          className={`mt-0.5 font-rb-display text-2xl font-extrabold leading-none tabular-nums ${alert ? "text-rb-fox-lip" : "text-foreground"
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

/** Home for teachers/facilitators. */
export default function DepartmentHeadDashboardPage() {
  const layout = useDashboardLayout("department-head")
  const [dateRange, setDateRange] = useState(null)

  const departmentsQuery = useQuery({
    queryKey: ["my-institution-groups"],
    queryFn: () => getDepartments(),
    retry: 1,
  })

  const statsQuery = useQuery({
    queryKey: ["department-head-learning-stats"],
    queryFn: getInstitutionLearningStats,
    retry: 1,
  })

  /* Outcomes per programme, keyed so a slot row can pick up its own. The
     panel listed seats filled and nothing about the people in them. */
  const certificationStatsById = useMemo(() => {
    const map = new Map()
    for (const row of statsQuery.data?.certifications ?? []) {
      map.set(row.certificationId, row)
    }
    return map
  }, [statsQuery.data])

  const hardestTopics = statsQuery.data?.hardestTopics ?? []
  const hardestAssessments = statsQuery.data?.hardestAssessments ?? []

  /* Who to speak to, by name and with the reason.
     "Needing support: 3" is a number a head cannot act on -- they have to go
     and find out who. These are the same learners, named, each carrying why
     they are here so the follow-up is obvious before the row is opened. */
  const needsAttention = useMemo(() => {
    const members = statsQuery.data?.members ?? []
    const now = Date.now()
    const STALE_DAYS = 14

    return members
      .map((member) => {
        const daysSince = member.lastActivityAt
          ? Math.floor((now - new Date(member.lastActivityAt).getTime()) / 86_400_000)
          : null

        /* One reason each, most urgent first: never started outranks gone
           quiet, which outranks struggling. A row listing three problems is
           read as none. */
        let reason = null
        if (!member.gradedAttempts && !member.lessonsCompleted) {
          reason = "Has not started"
        } else if (daysSince != null && daysSince >= STALE_DAYS) {
          reason = `No activity in ${daysSince} days`
        } else if (member.averageScore != null && member.averageScore < 50) {
          reason = `Averaging ${member.averageScore}% across ${member.gradedAttempts} attempt${member.gradedAttempts === 1 ? "" : "s"}`
        } else if (member.passRate != null && member.passRate < 50 && member.gradedAttempts > 0) {
          reason = `Passing ${member.passRate}% of attempts`
        }
        return reason ? { ...member, reason } : null
      })
      .filter(Boolean)
      .slice(0, 8)
  }, [statsQuery.data])

  const departmentStatsQuery = useQuery({
    queryKey: ["department-head-group-stats"],
    queryFn: getDepartmentStats,
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

  const groups = deptList.filter((group) => (group?.status ?? "active").toLowerCase() === "active")
  const assignedDeptIds = useMemo(
    () => new Set(groups.map((g) => String(g.departmentId ?? g.id))),
    [groups]
  )

  const instData = useInstitutionData(deptList[0]?.institutionId)

  const summary = statsQuery.data?.summary ?? {}
  const allMembers = useMemo(
    () => (Array.isArray(statsQuery.data?.members) ? statsQuery.data.members : []),
    [statsQuery.data]
  )

  const groupStats = useMemo(
    () =>
      (Array.isArray(departmentStatsQuery.data) ? departmentStatsQuery.data : []).filter((g) =>
        assignedDeptIds.has(String(g.departmentId))
      ),
    [departmentStatsQuery.data, assignedDeptIds]
  )

  // Map each member to designated department
  const deptLearners = useMemo(() => {
    const deptLookup = new Map()
    instData.assignments?.forEach((assignment) => {
      const membership = instData.groupByInstitutionCertLearnerId?.get(
        assignment.institutionCertLearnerId
      )
      if (membership?.departmentId != null) {
        const dId = String(membership.departmentId)
        if (assignedDeptIds.has(dId)) {
          const activeDept = groups.find((d) => String(d.departmentId ?? d.id) === dId)
          const dName = membership.departmentName || activeDept?.departmentName || `Department #${dId}`
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
        return {
          ...m,
          departmentId: dept?.departmentId,
          departmentName: dept?.departmentName,
        }
      })
      .filter((m) => m.departmentId != null)
  }, [allMembers, instData.assignments, instData.groupByInstitutionCertLearnerId, assignedDeptIds, groups])

  const cohort = useMemo(() => {
    const buckets = PROGRESS_BUCKETS.map((bucket) => ({
      name: bucket.label,
      value: deptLearners.filter((member) => {
        const progress = Number(member.averageProgress ?? 0)
        return progress >= bucket.min && progress <= bucket.max
      }).length,
    }))

    const needingSupport = deptLearners.filter(
      (member) => member.activeCertifications > 0 && Number(member.averageProgress ?? 0) < 30
    )

    return { buckets, needingSupport }
  }, [deptLearners])

  const cohortStats = useMemo(() => {
    const total = deptLearners.length
    const completed = deptLearners.filter((m) => Number(m.averageProgress ?? 0) >= 100).length
    const inProgress = deptLearners.filter(
      (m) => Number(m.averageProgress ?? 0) >= 25 && Number(m.averageProgress ?? 0) < 100
    ).length
    const stalled = deptLearners.filter((m) => Number(m.averageProgress ?? 0) < 25).length

    return { total, completed, inProgress, stalled }
  }, [deptLearners])

  const recentInvitations = useMemo(
    () =>
      [...instData.invitations]
        .sort((a, b) => new Date(b.sentAt ?? 0) - new Date(a.sentAt ?? 0))
        .slice(0, 5),
    [instData.invitations]
  )

  const pendingInvitations = useMemo(
    () => instData.invitations.filter((invite) => invite.status === "PENDING").length,
    [instData.invitations]
  )

  const tiles = useMemo(() => {
    const failed = statsQuery.isError

    return [
      // 3. Departmental Progress & Performance Gauge
      {
        id: "dept-progress",
        col: 3,
        row: 2,
        x: 0,
        y: 0,
        element: (
          <BentoTile tone="plain" col={3} row={2}>
            <div className="flex h-full flex-col justify-between gap-3">
              <DashboardCardHeader
                icon={TargetIcon}
                kicker="Department Performance"
                title="Department Progress & Pass Rate"
              />

              <div className="my-auto grid grid-cols-1 items-center gap-4 sm:grid-cols-12 py-1">
                <div className="sm:col-span-5 flex items-center justify-center pl-4 min-w-0">
                  <BeadedRadialGauge
                    value={failed ? 0 : Number(summary.averageProgress) || 0}
                    label="Department Completion"
                  />
                </div>

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

              {/* 4. Learner Cohort & Risk Summary */}
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
                    <span>Needing Support: <strong className="text-foreground">{cohortStats.stalled}</strong></span>
                  </span>
                ) : null}
              </div>
            </div>
          </BentoTile>
        ),
      },
      // 6. Learner Completion Distribution Chart
      {
        id: "dept-completion-distribution",
        col: 3,
        row: 2,
        x: 3,
        y: 0,
        element: (
          <BentoTile col={3} row={2}>
            <DashboardCardHeader
              icon={CircleDotIcon}
              kicker="Progress Distribution"
              title="Learner Completion Spread"
              hint="How department learners are distributed across completion tiers"
            />
            <DonutChart
              data={cohort.buckets.filter((bucket) => bucket.value > 0)}
              height={168}
              centerValue={String(deptLearners.length)}
              centerLabel={deptLearners.length === 1 ? "student" : "students"}
            />
          </BentoTile>
        ),
      },
      // 5. Department Activity at a Glance Strip
      {
        id: "dept-key-figures",
        col: 6,
        row: 1,
        x: 0,
        y: 2,
        element: (
          <BentoTile col={6} row={1}>
            <DashboardCardHeader
              icon={BarChart3Icon}
              kicker="Operational Summary"
              title="Department Activity at a Glance"
              hint="Current metrics across your assigned department workspace."
            />
            <dl className="grid flex-1 grid-cols-2 items-center gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
              <Figure
                icon={BookOpenCheckIcon}
                label="Department lessons"
                value={failed ? "—" : count(summary.lessonsCompleted)}
              />
              <Figure
                icon={ClipboardListIcon}
                label="Graded exam attempts"
                value={failed ? "—" : count(summary.gradedAttempts)}
                hint={failed ? null : `${percent(summary.passRate)} pass rate`}
              />
              <Figure
                icon={UserCheck}
                label="Avg test score"
                value={failed ? "—" : percent(summary.averageScore)}
              />
              <Figure
                icon={GraduationCapIcon}
                label="Active certifications"
                value={
                  instData.institutionCerts.filter((cert) =>
                    ["active", "expiring_soon"].includes(accessWindowStatus(cert).status)
                  ).length
                }
              />
              <Figure
                icon={BarChart3Icon}
                label="Needing support"
                value={failed ? "—" : cohort.needingSupport.length}
                hint={failed ? null : "Active, below 30%"}
                alert={!failed && cohort.needingSupport.length > 0}
              />
            </dl>
          </BentoTile>
        ),
      },
      // 7. Group / Section Breakdown Tile
      {
        id: "dept-section-breakdown",
        col: 3,
        row: 2,
        x: 0,
        y: 3,
        element: (
          <BentoTile col={3} row={2}>
            <DashboardCardHeader
              icon={Building2}
              kicker="Internal Benchmark"
              title="Section / Course Completion"
              hint="Average progress vs 60% department benchmark"
            />
            {departmentStatsQuery.isError ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Section stats could not be loaded.
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
      // 9. Program Slot Allocations & Active Enrolments
      {
        id: "dept-allocations",
        col: 3,
        row: 2,
        x: 3,
        y: 3,
        element: (
          <BentoTile col={3} row={2} className="!p-0">
            <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
              <DashboardCardHeader
                icon={GraduationCap}
                kicker="Department Allocations"
                title="Programmes & Outcomes"
                hint="Seats used, who is on each programme, and how many have passed."
                chip={
                  instData.institutionCerts.length > 0 ? (
                    <Badge
                      variant="secondary"
                      className="border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      {instData.institutionCerts.length} active
                    </Badge>
                  ) : null
                }
              />

              {instData.institutionCerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No program allocations assigned to this department yet.
                </p>
              ) : (
                <div className="-mr-2 min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
                  {instData.institutionCerts.map((institutionCert) => {
                    const certification = instData.certificationById.get(institutionCert.certificationId)
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

                        {/* Seats filled says what the department bought; this
                            says what happened to the people in them, which is
                            the question a department is asked about its own
                            programmes. */}
                        {(() => {
                          const outcome = certificationStatsById.get(institutionCert.certificationId)
                          if (!outcome || outcome.enrolled === 0) {
                            return (
                              <p className="text-xs text-muted-foreground">
                                No learners on this programme yet.
                              </p>
                            )
                          }
                          return (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                              <span className="font-semibold text-foreground">
                                {outcome.enrolled} enrolled
                              </span>
                              <span className="text-rb-leaf">
                                {outcome.passed} passed
                                {outcome.passRate != null ? ` · ${outcome.passRate}%` : ""}
                              </span>
                              <span className="text-muted-foreground">
                                {outcome.inProgress} in progress
                              </span>
                              {outcome.notStarted > 0 ? (
                                <span className="text-muted-foreground">
                                  {outcome.notStarted} not started
                                </span>
                              ) : null}
                              {outcome.averageProgress != null ? (
                                <span className="text-muted-foreground">
                                  avg {Math.round(Number(outcome.averageProgress))}% complete
                                </span>
                              ) : null}
                              {/* How well, beside how far. A programme can be
                                  most of the way through and averaging 40% on
                                  its papers, and only one of those is a
                                  warning. */}
                              {outcome.averageScore != null ? (
                                <span
                                  className={
                                    outcome.averageScore < 50
                                      ? "font-semibold text-destructive"
                                      : "text-muted-foreground"
                                  }
                                >
                                  avg score {outcome.averageScore}%
                                </span>
                              ) : null}
                              {outcome.gradedAttempts > 0 ? (
                                <span className="text-muted-foreground">
                                  {outcome.gradedAttempts} attempt
                                  {outcome.gradedAttempts === 1 ? "" : "s"}
                                  {outcome.attemptPassRate != null
                                    ? ` · ${outcome.attemptPassRate}% passed`
                                    : ""}
                                </span>
                              ) : null}
                            </div>
                          )
                        })()}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </BentoTile>
        ),
      },
      // 8a. What the cohort is getting wrong
      {
        id: "dept-hard-topics",
        col: 3,
        row: 2,
        x: 0,
        y: 5,
        element: (
          <BentoTile col={3} row={2} className="!p-0">
            <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
              <DashboardCardHeader
                icon={TargetIcon}
                kicker="Teaching Signal"
                title="Topics the department is failing"
                hint="Lowest accuracy across everyone's marked answers."
              />
              {hardestTopics.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Not enough marked answers yet to rank topics.
                </p>
              ) : (
                /* One chart per programme. A department teaches courses, and a
                   single pooled ranking is unusable to a head fixing one
                   syllabus -- they cannot act on a list where half the rows
                   belong to a course they do not run. */
                <div className="-mr-2 min-h-0 flex-1 space-y-5 overflow-y-auto pr-2">
                  {hardestTopics.map((programme) => (
                    <div key={programme.certificationId}>
                      <p className="mb-2 truncate text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {programme.certificationTitle}
                      </p>
                      <BarBreakdownChart
                        data={programme.topics.map((topic) => ({
                          topic: topic.lessonTitle,
                          accuracy: topic.accuracy,
                        }))}
                        categoryKey="topic"
                        valueKey="accuracy"
                        unit="%"
                        target={50}
                        domainMax={100}
                        height={Math.max(120, programme.topics.length * 34)}
                        categoryWidth={150}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </BentoTile>
        ),
      },
      // 8b. Which papers are hardest
      {
        id: "dept-hard-assessments",
        col: 3,
        row: 2,
        x: 3,
        y: 5,
        element: (
          <BentoTile col={3} row={2} className="!p-0">
            <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
              <DashboardCardHeader
                icon={ClipboardListIcon}
                kicker="Assessment Signal"
                title="Hardest assessments"
                hint="Lowest pass rate first — a paper nobody passes is worth a look."
              />
              {hardestAssessments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No assessment has been graded in this department yet.
                </p>
              ) : (
                <div className="-mr-2 min-h-0 flex-1 overflow-y-auto pr-2">
                  {/* Pass rate, not mean score: a paper everyone scrapes
                      through at 76% is fine, one everyone fails at 74% is
                      not, and only the first of those is visible in a mean. */}
                  <BarBreakdownChart
                    data={hardestAssessments.map((exam) => ({
                      exam: exam.title,
                      passRate: exam.passRate,
                    }))}
                    categoryKey="exam"
                    valueKey="passRate"
                    unit="%"
                    target={50}
                    domainMax={100}
                    height={Math.max(140, hardestAssessments.length * 38)}
                    categoryWidth={150}
                  />
                  <ul className="mt-3 space-y-1">
                    {hardestAssessments.map((exam) => (
                      <li key={exam.examId} className="truncate text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{exam.title}</span>
                        {" — "}
                        {exam.attempts} attempt{exam.attempts === 1 ? "" : "s"} by {exam.learners} learner
                        {exam.learners === 1 ? "" : "s"}
                        {exam.averageScore != null ? ` · avg ${exam.averageScore}%` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </BentoTile>
        ),
      },
      // 8c. Who needs a conversation, by name
      {
        id: "dept-needs-attention",
        col: 6,
        row: 2,
        x: 0,
        y: 7,
        element: (
          <BentoTile col={6} row={2} className="!p-0">
            <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
              <DashboardCardHeader
                icon={UserCheck}
                kicker="Follow Up"
                title="Learners needing attention"
                hint="Named, with the reason — a count alone cannot be acted on."
                chip={
                  needsAttention.length > 0 ? (
                    <Badge variant="secondary" className="border-amber-500/20 bg-amber-500/10 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                      {needsAttention.length}
                    </Badge>
                  ) : null
                }
              />
              {needsAttention.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nobody is flagged right now.
                </p>
              ) : (
                <ul className="-mr-2 min-h-0 flex-1 divide-y divide-border/60 overflow-y-auto pr-2">
                  {needsAttention.map((row) => (
                    <li key={row.learnerId} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{row.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{row.reason}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-4 text-xs tabular-nums text-muted-foreground">
                        <span>{Math.round(Number(row.averageProgress ?? 0))}% complete</span>
                        {row.averageScore != null ? <span>{row.averageScore}% avg</span> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </BentoTile>
        ),
      },
      // 8. Department Learner Roster & Performance Table
      {
        id: "dept-learner-table",
        col: 6,
        row: 3,
        x: 0,
        y: 9,
        element: (
          <BentoTile col={6} row={3} className="!p-0">
            <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
              <DashboardCardHeader
                icon={Building2}
                kicker="Department Roster"
                title="Student Learner Roster & Performance"
                hint="Individual student progress and assessment records."
                chip={
                  deptLearners.length > 0 ? (
                    <Badge
                      variant="secondary"
                      className="border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      {deptLearners.length} {deptLearners.length === 1 ? "student" : "students"}
                    </Badge>
                  ) : null
                }
              />

              {statsQuery.isError ? (
                <p className="text-sm text-muted-foreground">
                  Department learners could not be loaded.
                </p>
              ) : deptLearners.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground">
                  <Building2 className="mb-2 size-8 text-muted-foreground/40" />
                  <p>No learners assigned to your department yet.</p>
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-x-auto">
                  <table className="w-full text-sm" style={{ minWidth: 640 }}>
                    <colgroup>
                      <col style={{ width: "30%" }} />
                      <col style={{ width: "25%" }} />
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "15%" }} />
                    </colgroup>
                    <thead className="sticky top-0 bg-background z-10">
                      <tr className="border-b border-transparent text-xs font-semibold text-muted-foreground">
                        <th className="py-2.5 pl-2 pr-3 text-left">Student Name</th>
                        <th className="py-2.5 px-3 text-left">Progress</th>
                        <th className="py-2.5 px-2 text-center">Lessons</th>
                        <th className="py-2.5 px-2 text-center">Attempts</th>
                        <th className="py-2.5 px-2 text-center">Avg Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deptLearners.map((learner) => (
                        <tr
                          key={learner.learnerId}
                          className="border-b border-border/40 hover:bg-muted/40 transition-colors"
                        >
                          <td className="py-2.5 pl-2 pr-3">
                            <Link
                              to={`/institution/departments/${learner.departmentId || groups[0]?.departmentId || groups[0]?.id}/learners/${learner.learnerId}`}
                              className="font-bold text-foreground hover:underline text-xs"
                            >
                              {learner.name || `Learner #${learner.learnerId}`}
                            </Link>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2 max-w-[140px]">
                              <Progress
                                value={Number(learner.averageProgress ?? 0)}
                                className="h-2 flex-1 rounded-full"
                              />
                              <span className="shrink-0 tabular-nums text-xs font-bold text-foreground">
                                {percent(learner.averageProgress)}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-center tabular-nums text-xs text-muted-foreground">
                            {count(learner.lessonsCompleted)}
                          </td>
                          <td className="py-2.5 px-2 text-center tabular-nums text-xs text-muted-foreground">
                            {count(learner.gradedAttempts)}
                          </td>
                          <td className="py-2.5 px-2 text-center tabular-nums text-xs font-semibold text-foreground">
                            {percent(learner.averageScore)}
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
      // 10. Recent Submissions & Activity Feed
      {
        id: "dept-recent-activity",
        col: 6,
        row: 2,
        x: 0,
        y: 12,
        element: (
          <BentoTile col={6} row={2} className="!p-0">
            <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
              <DashboardCardHeader
                icon={MailPlusIcon}
                kicker="Recent Activity"
                title="Recent Submissions & Department Invitations"
                hint="Recent activity, test submissions, and onboarding invitations."
                chip={
                  pendingInvitations > 0 ? (
                    <Badge
                      variant="secondary"
                      className="gap-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      <MailPlusIcon className="size-3" aria-hidden="true" />
                      {pendingInvitations} pending invitations
                    </Badge>
                  ) : null
                }
              />

              {recentInvitations.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No recent activity or invitations logged yet.
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
    ]
  }, [
    summary,
    cohort,
    cohortStats,
    groupStats,
    deptLearners,
    groups,
    instData,
    recentInvitations,
    pendingInvitations,
    statsQuery.isError,
    departmentStatsQuery.isError,
  ])

  if (departmentsQuery.isLoading) return <InstitutionLoadingSkeleton />
  if (departmentsQuery.isError)
    return <InstitutionErrorState title="Unable to load your departments" onRetry={departmentsQuery.refetch} />

  return (
    <div className="space-y-6">
      {/* Controls & Header Navigation (2A) */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-4 mb-2.5">
        <div className="w-full md:w-[calc(50%-10px)]">
          <DateRangeNavigator className="w-full" onChange={setDateRange} />
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

      {/* Analytical Widgets & Key Metrics (2B Bento Grid) */}
      <DashboardBoard
        tiles={tiles}
        layout={layout.tileLayout}
        editing={layout.rearranging}
        onLayoutChange={layout.handleLayoutChange}
      />
    </div>
  )
}
