import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  AlertTriangle,
  Award,
  Building2,
  CheckCheck,
  ClipboardListIcon,
  Download,
  GraduationCap,
  Layers,
  TargetIcon,
  UserCheck,
  UsersRoundIcon,
} from "@/components/icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  InstitutionErrorState,
  InstitutionLoadingSkeleton,
} from "@/components/institution/institution-ui.jsx"
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
import { downloadCsv, timestampedFilename, toCsv } from "@/lib/csv.js"
import {
  BarBreakdownChart,
  BeadedRadialGauge,
  StackedBarChart,
} from "@/components/charts/rebyu-charts.jsx"

const PROGRESS_TIERS = [
  { label: "Not started", min: 0, max: 0 },
  { label: "1-25%", min: 1, max: 25 },
  { label: "26-50%", min: 26, max: 50 },
  { label: "51-75%", min: 51, max: 75 },
  { label: "76-100%", min: 76, max: 100 },
]

function passMarkFor(assessments) {
  const marks = new Set(
    assessments.map((exam) => exam.passingScore).filter((mark) => mark != null)
  )
  return marks.size === 1 ? [...marks][0] : null
}

function isoDate(date) {
  if (!date) return null
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")
}

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

function StatBox({ label, value, icon: Icon, iconClass = "", alert = false }) {
  return (
    <div className="rounded-lg border border-border/70 bg-muted/30 p-2.5">
      <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <span className="truncate">{label}</span>
        {Icon ? <Icon className={`size-3.5 shrink-0 ${iconClass}`} aria-hidden="true" /> : null}
      </div>
      <div
        className={`mt-1.5 font-rb-display text-lg font-bold tabular-nums ${
          alert ? "text-rb-fox-lip" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  )
}

export default function DepartmentHeadDashboardPage() {
  const layout = useDashboardLayout("department-head")
  const [range, setRange] = useState(null)
  const from = isoDate(range?.from)
  const to = isoDate(range?.to)

  const departmentsQuery = useQuery({
    queryKey: ["my-institution-groups"],
    queryFn: () => getDepartments(),
    retry: 1,
  })

  const statsQuery = useQuery({
    queryKey: ["department-head-learning-stats", from, to],
    queryFn: () => getInstitutionLearningStats({ from, to }),
    placeholderData: (previous) => previous,
    retry: 1,
  })

  const hardestTopics = statsQuery.data?.hardestTopics ?? []
  const hardestAssessments = statsQuery.data?.hardestAssessments ?? []

  const programmes = useMemo(
    () => (statsQuery.data?.certifications ?? []).filter((row) => row.enrolled > 0),
    [statsQuery.data]
  )

  const flagFor = useMemo(() => {
    const now = Date.now()
    const STALE_DAYS = 14

    return (member) => {
      const daysSince = member.lastActivityAt
        ? Math.floor((now - new Date(member.lastActivityAt).getTime()) / 86_400_000)
        : null

      if (!member.gradedAttempts && !member.lessonsCompleted) {
        return "Has not started"
      }
      if (daysSince != null && daysSince >= STALE_DAYS) {
        return `No activity in ${daysSince} days`
      }
      if (member.averageScore != null && member.averageScore < 50) {
        return `Averaging ${member.averageScore}% across ${member.gradedAttempts} attempt${member.gradedAttempts === 1 ? "" : "s"}`
      }
      if (member.passRate != null && member.passRate < 50 && member.gradedAttempts > 0) {
        return `Passing ${member.passRate}% of attempts`
      }
      return null
    }
  }, [])

  const departmentStatsQuery = useQuery({
    queryKey: ["department-head-group-stats", to],
    queryFn: () => getDepartmentStats({ to }),
    placeholderData: (previous) => previous,
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
          flag: flagFor(m),
        }
      })
      .filter((m) => m.departmentId != null)
      .sort((a, b) => {
        if (Boolean(a.flag) !== Boolean(b.flag)) return a.flag ? -1 : 1
        return Number(a.averageProgress ?? 0) - Number(b.averageProgress ?? 0)
      })
  }, [allMembers, instData.assignments, instData.groupByInstitutionCertLearnerId, assignedDeptIds, groups, flagFor])

  const flaggedCount = useMemo(
    () => deptLearners.filter((learner) => learner.flag).length,
    [deptLearners]
  )

  const spread = useMemo(
    () =>
      PROGRESS_TIERS.map((tier) => ({
        tier: tier.label,
        learners: deptLearners.filter((member) => {
          const progress = Math.round(Number(member.averageProgress ?? 0))
          return progress >= tier.min && progress <= tier.max
        }).length,
      })),
    [deptLearners]
  )

  const needingSupport = useMemo(
    () =>
      deptLearners.filter(
        (member) => member.activeCertifications > 0 && Number(member.averageProgress ?? 0) < 30
      ).length,
    [deptLearners]
  )

  const buildCsv = () =>
    toCsv([
      {
        title: `REBYU department dashboard — ${groups.map((g) => g.departmentName).join(", ") || "my department"}`,
        columns: ["Exported", new Date().toISOString(), "Period", from ?? "all time", to ?? ""],
      },
      {
        title: "Summary",
        columns: ["Metric", "Value"],
        rows: [
          ["Students", deptLearners.length],
          ["Average completion (%)", summary.averageProgress],
          ["Pass rate (%)", summary.passRate],
          ["Average score (%)", summary.averageScore],
          ["Graded attempts", summary.gradedAttempts],
          ["Lessons completed", summary.lessonsCompleted],
          ["Needing support", needingSupport],
          ["Seats used", summary.seatsUsed],
          ["Seats total", summary.seatsTotal],
        ],
      },
      {
        title: "Programmes",
        columns: [
          "Programme", "Enrolled", "Passed", "In progress", "Not started",
          "Seats used", "Seats total", "Avg completion (%)", "Avg score (%)",
          "Graded attempts", "Attempt pass rate (%)",
        ],
        rows: programmes.map((row) => [
          row.title, row.enrolled, row.passed, row.inProgress, row.notStarted,
          row.seatsUsed, row.seatsTotal,
          row.averageProgress == null ? null : Math.round(Number(row.averageProgress)),
          row.averageScore, row.gradedAttempts, row.attemptPassRate,
        ]),
      },
      {
        title: "Completion spread",
        columns: ["Band", "Students"],
        rows: spread.map((band) => [band.tier, band.learners]),
      },
      {
        title: "Weakest topics",
        columns: ["Programme", "Topic", "Accuracy (%)", "Answers", "Learners"],
        rows: hardestTopics.flatMap((programme) =>
          programme.topics.map((topic) => [
            programme.certificationTitle, topic.lessonTitle,
            topic.accuracy, topic.answered, topic.learners,
          ])
        ),
      },
      {
        title: "Hardest assessments",
        columns: [
          "Programme", "Assessment", "Attempts", "Passed", "Pass rate (%)",
          "Learners", "Avg score (%)", "Pass mark (%)",
        ],
        rows: hardestAssessments.flatMap((programme) =>
          programme.assessments.map((exam) => [
            programme.certificationTitle, exam.title, exam.attempts,
            exam.passedAttempts, exam.passRate, exam.learners,
            exam.averageScore, exam.passingScore,
          ])
        ),
      },
      {
        title: "Sections",
        columns: ["Section", "Learners", "Finished", "Avg completion (%)"],
        rows: groupStats.map((group) => [
          group.departmentName, group.learners, group.completedLearners,
          Math.round(Number(group.averageProgress ?? 0)),
        ]),
      },
      {
        title: "Roster",
        columns: [
          "Learner", "Needs attention", "Completion (%)", "Lessons",
          "Attempts", "Avg score (%)",
        ],
        rows: deptLearners.map((learner) => [
          learner.name, learner.flag,
          Math.round(Number(learner.averageProgress ?? 0)),
          learner.lessonsCompleted, learner.gradedAttempts, learner.averageScore,
        ]),
      },
    ])

  const tiles = useMemo(() => {
    const failed = statsQuery.isError
    const totalEnrolled = programmes.reduce((sum, row) => sum + row.enrolled, 0)
    const seatsTotal = Number(summary.seatsTotal ?? 0)

    return [
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
                  <StatBox
                    label="Students"
                    value={count(deptLearners.length)}
                    icon={UsersRoundIcon}
                    iconClass="text-sky-600 dark:text-sky-400"
                  />
                  <StatBox
                    label="Pass Rate"
                    value={failed ? "—" : percent(summary.passRate)}
                    icon={CheckCheck}
                    iconClass="text-emerald-600 dark:text-emerald-400"
                  />
                  <StatBox
                    label="Avg Score"
                    value={failed ? "—" : percent(summary.averageScore)}
                    icon={TargetIcon}
                    iconClass="text-amber-600 dark:text-amber-400"
                  />
                  <StatBox
                    label="Needs Support"
                    value={failed ? "—" : count(needingSupport)}
                    icon={UserCheck}
                    iconClass="text-rb-fox-lip"
                    alert={!failed && needingSupport > 0}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
                <span>
                  <strong className="text-foreground tabular-nums">{totalEnrolled}</strong>{" "}
                  enrolments on {programmes.length} programme
                  {programmes.length === 1 ? "" : "s"}
                  {seatsTotal > 0 ? (
                    <>
                      {" "}
                      · <strong className="text-foreground tabular-nums">{seatsTotal}</strong> seats
                    </>
                  ) : null}
                </span>
                <span>
                  <strong className="text-foreground tabular-nums">
                    {failed ? "—" : count(summary.gradedAttempts)}
                  </strong>{" "}
                  graded attempts
                </span>
              </div>
            </div>
          </BentoTile>
        ),
      },
      {
        id: "dept-programme-enrolment",
        col: 3,
        row: 2,
        x: 3,
        y: 0,
        element: (
          <BentoTile col={3} row={2} className="!p-0">
            <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
              <DashboardCardHeader
                icon={GraduationCap}
                kicker="Enrolment by Programme"
                title="Who is on each certification"
                hint="Your department's learners only — a programme nobody here is on is not listed."
                chip={
                  totalEnrolled > 0 ? (
                    <Badge
                      variant="secondary"
                      className="border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      {totalEnrolled} enrolled
                    </Badge>
                  ) : null
                }
              />
              {programmes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  None of your learners are assigned to a certification yet.
                </p>
              ) : (
                <div className="-mr-2 min-h-0 flex-1 overflow-y-auto pr-2">
                  <StackedBarChart
                    data={programmes.map((row) => ({
                      programme: row.title,
                      passed: row.passed,
                      inProgress: row.inProgress,
                      notStarted: row.notStarted,
                    }))}
                    categoryKey="programme"
                    series={[
                      { key: "passed", name: "Passed" },
                      { key: "inProgress", name: "In progress" },
                      { key: "notStarted", name: "Not started" },
                    ]}
                    height={Math.max(130, programmes.length * 56)}
                    categoryWidth={140}
                    note="Passed counts awarded credentials, not assignments marked complete."
                  />
                </div>
              )}
            </div>
          </BentoTile>
        ),
      },
      {
        id: "dept-programme-table",
        col: 3,
        row: 2,
        x: 0,
        y: 2,
        element: (
          <BentoTile col={3} row={2} className="!p-0">
            <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
              <DashboardCardHeader
                icon={Award}
                kicker="Programme Scorecard"
                title="Seats, completion and marks"
                hint="Your department's learners on each programme, with their marks."
              />
              {programmes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  None of your learners are assigned to a certification yet.
                </p>
              ) : (
                <div className="-mr-2 min-h-0 flex-1 overflow-auto pr-2">
                  <table className="w-full text-xs" style={{ minWidth: 400 }}>
                    <thead className="sticky top-0 z-10 bg-background">
                      <tr className="border-b border-border/60 text-[11px] font-semibold text-muted-foreground">
                        <th className="py-2 pr-3 text-left">Programme</th>
                        <th className="px-2 py-2 text-center">Enrolled</th>
                        <th className="px-2 py-2 text-center">Seats</th>
                        <th className="px-2 py-2 text-center">Passed</th>
                        <th className="px-2 py-2 text-center">Avg done</th>
                        <th className="px-2 py-2 text-center">Avg score</th>
                        <th className="py-2 pl-2 text-center">Attempts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {programmes.map((row) => (
                        <tr
                          key={row.certificationId}
                          className="border-b border-border/40 transition-colors hover:bg-muted/40"
                        >
                          <td className="max-w-[150px] truncate py-2 pr-3 font-bold text-foreground">
                            {row.title}
                          </td>
                          <td className="px-2 py-2 text-center tabular-nums font-semibold text-foreground">
                            {count(row.enrolled)}
                          </td>
                          <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">
                            {row.seatsTotal > 0 ? `${row.seatsUsed}/${row.seatsTotal}` : "—"}
                          </td>
                          <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">
                            {count(row.passed)}
                            {row.passRate != null ? (
                              <span className="ml-1 text-[10px]">({row.passRate}%)</span>
                            ) : null}
                          </td>
                          <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">
                            {row.averageProgress == null
                              ? "—"
                              : `${Math.round(Number(row.averageProgress))}%`}
                          </td>
                          <td
                            className={`px-2 py-2 text-center tabular-nums font-semibold ${
                              row.averageScore != null && row.averageScore < 50
                                ? "text-destructive"
                                : "text-foreground"
                            }`}
                          >
                            {row.averageScore == null ? "—" : `${row.averageScore}%`}
                          </td>
                          <td className="py-2 pl-2 text-center tabular-nums text-muted-foreground">
                            {count(row.gradedAttempts)}
                            {row.attemptPassRate != null ? (
                              <span className="ml-1 text-[10px]">({row.attemptPassRate}%)</span>
                            ) : null}
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
        id: "dept-completion-spread",
        col: 3,
        row: 2,
        x: 3,
        y: 2,
        element: (
          <BentoTile col={3} row={2}>
            <DashboardCardHeader
              icon={Layers}
              kicker="Progress Distribution"
              title="How far the cohort has got"
              hint="Students per completion band — a headcount, not a share."
            />
            {deptLearners.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No learners assigned to your department yet.
              </p>
            ) : (
              <BarBreakdownChart
                data={spread}
                categoryKey="tier"
                valueKey="learners"
                horizontal={false}
                height={186}
              />
            )}
          </BentoTile>
        ),
      },
      {
        id: "dept-hard-topics",
        col: 3,
        row: 2,
        x: 0,
        y: 4,
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
      {
        id: "dept-hard-assessments",
        col: 3,
        row: 2,
        x: 3,
        y: 4,
        element: (
          <BentoTile col={3} row={2} className="!p-0">
            <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
              <DashboardCardHeader
                icon={ClipboardListIcon}
                kicker="Assessment Signal"
                title="Hardest assessments"
                hint="Lowest pass rate first, per programme — a paper nobody passes is worth a look."
              />
              {hardestAssessments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No assessment has been graded in this department yet.
                </p>
              ) : (
                <div className="-mr-2 min-h-0 flex-1 space-y-5 overflow-y-auto pr-2">
                  {hardestAssessments.map((programme) => (
                    <div key={programme.certificationId}>
                      <p className="mb-2 truncate text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {programme.certificationTitle}
                      </p>
                      <BarBreakdownChart
                        data={programme.assessments.map((exam) => ({
                          exam: exam.title,
                          averageScore: exam.averageScore ?? 0,
                        }))}
                        categoryKey="exam"
                        valueKey="averageScore"
                        unit="%"
                        target={passMarkFor(programme.assessments)}
                        domainMax={100}
                        height={Math.max(120, programme.assessments.length * 36)}
                        categoryWidth={150}
                      />
                      <ul className="mt-2 space-y-1">
                        {programme.assessments.map((exam) => (
                          <li key={exam.examId} className="truncate text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">{exam.title}</span>
                            {" — "}
                            <span
                              className={
                                exam.passRate === 0 ? "font-semibold text-destructive" : undefined
                              }
                            >
                              {exam.passedAttempts} of {exam.attempts} passed
                            </span>
                            {" · "}
                            {exam.learners} learner{exam.learners === 1 ? "" : "s"}
                            {exam.averageScore != null ? ` · avg ${exam.averageScore}%` : ""}
                            {exam.passingScore != null ? ` · pass mark ${exam.passingScore}%` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </BentoTile>
        ),
      },
      {
        id: "dept-section-breakdown",
        col: 6,
        row: 1,
        x: 0,
        y: 6,
        element: (
          <BentoTile col={6} row={1} className="!p-0">
            <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
              <DashboardCardHeader
                icon={Building2}
                kicker="Internal Benchmark"
                title="Sections you are responsible for"
                hint="Headcount, finishers and average completion against the 60% benchmark."
              />
              {departmentStatsQuery.isError ? (
                <p className="text-sm text-muted-foreground">Section stats could not be loaded.</p>
              ) : groupStats.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sections assigned to you yet.</p>
              ) : (
                <div className="-mr-2 min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-2">
                  {groupStats.map((group) => {
                    const progress = Math.round(Number(group.averageProgress ?? 0))
                    return (
                      <div
                        key={group.departmentId}
                        className="flex flex-wrap items-center gap-x-4 gap-y-1"
                      >
                        <span className="w-40 shrink-0 truncate text-xs font-bold text-foreground">
                          {group.departmentName}
                        </span>
                        <Progress value={progress} className="h-2 min-w-[120px] flex-1" />
                        <span className="w-10 shrink-0 text-right text-xs font-bold tabular-nums text-foreground">
                          {progress}%
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {count(group.learners)} learner{group.learners === 1 ? "" : "s"} ·{" "}
                          {count(group.completedLearners)} finished
                        </span>
                        <span
                          className={`shrink-0 text-[11px] font-semibold ${
                            progress >= 60 ? "text-rb-leaf" : "text-muted-foreground"
                          }`}
                        >
                          {progress >= 60 ? "on benchmark" : `${60 - progress} pts below`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </BentoTile>
        ),
      },
      {
        id: "dept-learner-table",
        col: 6,
        row: 2,
        x: 0,
        y: 7,
        element: (
          <BentoTile col={6} row={2} className="!p-0">
            <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
              <DashboardCardHeader
                icon={Building2}
                kicker="Department Roster"
                title="Student roster & who needs a conversation"
                hint="Anyone flagged sits at the top, with the reason beside their name."
                chip={
                  <>
                    {flaggedCount > 0 ? (
                      <Badge
                        variant="secondary"
                        className="border-amber-500/20 bg-amber-500/10 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                      >
                        {flaggedCount} need attention
                      </Badge>
                    ) : null}
                    {deptLearners.length > 0 ? (
                      <Badge
                        variant="secondary"
                        className="border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      >
                        {deptLearners.length} {deptLearners.length === 1 ? "student" : "students"}
                      </Badge>
                    ) : null}
                  </>
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
                      <col style={{ width: "22%" }} />
                      <col style={{ width: "26%" }} />
                      <col style={{ width: "22%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "10%" }} />
                    </colgroup>
                    <thead className="sticky top-0 bg-background z-10">
                      <tr className="border-b border-transparent text-xs font-semibold text-muted-foreground">
                        <th className="py-2.5 pl-2 pr-3 text-left">Student Name</th>
                        <th className="py-2.5 px-3 text-left">Needs attention</th>
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
                            {learner.flag ? (
                              <span className="flex items-center gap-1.5 text-xs font-semibold text-rb-fox-lip">
                                <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
                                <span className="truncate">{learner.flag}</span>
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
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
    ]
  }, [
    summary,
    spread,
    needingSupport,
    programmes,
    hardestTopics,
    hardestAssessments,
    flaggedCount,
    groupStats,
    deptLearners,
    groups,
    statsQuery.isError,
    departmentStatsQuery.isError,
  ])

  if (departmentsQuery.isLoading) return <InstitutionLoadingSkeleton />
  if (departmentsQuery.isError)
    return <InstitutionErrorState title="Unable to load your departments" onRetry={departmentsQuery.refetch} />

  return (
    <div className="space-y-6">
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-4 mb-2.5">
        <div className="w-full md:w-[calc(50%-10px)]">
          <DateRangeNavigator className="w-full" onRangeChange={setRange} />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => downloadCsv(timestampedFilename("rebyu-department-dashboard"), buildCsv())}
            disabled={statsQuery.isLoading || statsQuery.isError}
          >
            <Download className="size-4" aria-hidden="true" />
            Export CSV
          </Button>

          <DashboardRearrangeControls
            rearranging={layout.rearranging}
            onStart={layout.startRearranging}
            onFinish={layout.finishRearranging}
            onCancel={layout.cancelRearranging}
            onReset={layout.resetLayout}
          />
        </div>
      </div>

      <DashboardBoard
        tiles={tiles}
        layout={layout.tileLayout}
        editing={layout.rearranging}
        onLayoutChange={layout.handleLayoutChange}
      />
    </div>
  )
}
