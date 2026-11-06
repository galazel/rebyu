import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import {
  Award,
  CheckCheck,
  ClipboardListIcon,
  GraduationCap,
  Layers,
  TargetIcon,
  UserCheck,
  UsersRoundIcon,
} from "@/components/icons"
import { Badge } from "@/components/ui/badge"
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
} from "@/components/institution/institution-ui.jsx"
import {
  PeriodComparisonTile,
  PeriodDeltaBadge,
  usePeriodComparison,
} from "@/components/institution/department-period-comparison.jsx"
import { DateRangeNavigator } from "@/components/commons/date-range-navigator.jsx"
import { MetricsSidebar, METRIC_GROUPS } from "@/components/institution/metrics-sidebar.jsx"
import { getInstitutionLearningStats } from "@/services/institutionLearningStatsService.js"
import { useDepartmentOverview, useMyDepartments } from "@/hooks/use-my-department.js"
import { ExportButton } from "@/components/commons/export-button.jsx"
import {
  BarBreakdownChart,
  BeadedRadialGauge,
  StackedBarChart,
  TrendLineChart,
} from "@/components/charts/rebyu-charts.jsx"

/* The trend tile's icon. Declared here rather than added to the shared icon
   barrel: it is used on this page only. */
const TrendingUpIconSafe = ({ className = "", "aria-hidden": ariaHidden }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden={ariaHidden}
  >
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
)

/* The four readiness bands, in the order the backend names them. */
const READINESS_TIERS = [
  { band: "needs_review", label: "Needs review" },
  { band: "developing", label: "Developing" },
  { band: "nearly_ready", label: "Nearly ready" },
  { band: "exam_ready", label: "Exam ready" },
]

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
    <div className={`border-b border-border/50 pb-3 mb-4 transition-all ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon ? (
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/15 shadow-2xs">
              <Icon className="size-4.5" aria-hidden="true" />
            </span>
          ) : null}
          <div className="min-w-0">
            {kicker ? (
              <h3 className="text-[10px] font-bold uppercase leading-tight tracking-wider text-primary dark:text-emerald-400">
                {kicker}
              </h3>
            ) : null}
            <p className="truncate text-sm font-bold leading-snug text-foreground sm:text-base font-sans tracking-tight">
              {title}
            </p>
            {hint ? (
              <p className="mt-0.5 truncate text-xs font-normal text-muted-foreground font-sans">
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
    </div>
  )
}

function StatBox({ label, value, icon: Icon, iconClass = "", alert = false, delta = null, subtext = null, className = "" }) {
  return (
    <div
      className={`rounded-xl border p-2.5 sm:p-3.5 flex flex-col justify-between transition-all hover:border-border/80 ${
        alert
          ? "border-amber-500/30 bg-amber-500/5 ring-1 ring-inset ring-amber-500/20"
          : "border-border/60 bg-background/60 hover:bg-muted/30"
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <span className="truncate">{label}</span>
        {Icon ? <Icon className={`size-3.5 shrink-0 ${iconClass}`} aria-hidden="true" /> : null}
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-1.5">
        <div
          className={`font-sans tabular-nums text-xl sm:text-2xl font-bold tracking-tight ${
            alert ? "text-amber-600 dark:text-amber-400" : "text-foreground"
          }`}
        >
          {value}
        </div>
        {delta}
      </div>
      {subtext ? (
        <div className="mt-0.5 text-[10px] text-muted-foreground tabular-nums truncate">
          {subtext}
        </div>
      ) : null}
    </div>
  )
}

const METRIC_IDS = METRIC_GROUPS.flatMap((group) => group.items.map((item) => item.id))

/* The order and width of each view when they are all shown on the dashboard. */
const GRID_LAYOUT = [
  { id: "dept-monthly-trend", wide: true },
  { id: "dept-period-comparison", wide: true },
  { id: "dept-programme-enrolment" },
  { id: "dept-programme-table" },
  { id: "dept-completion-spread", wide: true },
  { id: "dept-hard-topics" },
  { id: "dept-hard-assessments" },
]

export default function DepartmentHeadMetrics({ embedded = false, exportRef = null }) {
  const { departmentsQuery, departments, departmentId, selectDepartment } = useMyDepartments()
  const [activeFeature, setActiveFeature] = useState(() => {
    const id = typeof window === "undefined" ? "" : window.location.hash.replace("#", "")
    return METRIC_IDS.includes(id) ? id : "dept-progress"
  })
  const [range, setRange] = useState(null)
  const [comparisonType, setComparisonType] = useState("previous_period")

  const [isMediumScreen, setIsMediumScreen] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches
  )

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    const handler = (e) => setIsMediumScreen(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const from = isoDate(range?.from)
  const to = isoDate(range?.to)

  const statsQuery = useQuery({
    queryKey: ["department-head-learning-stats", departmentId, from, to],
    queryFn: () => getInstitutionLearningStats({ from, to, departmentId }),
    enabled: departmentId != null,
    placeholderData: (previous) => previous,
    retry: 1,
  })
  // Learner statuses are the dashboard's: one definition of "needs support" everywhere.
  const overviewQuery = useDepartmentOverview(departmentId)

  const periodComp = usePeriodComparison({
    range,
    enabled: departmentId != null,
    comparisonType,
    currentStats: statsQuery.data,
    departmentId,
  })

  const summary = statsQuery.data?.summary ?? {}
  const hardestTopics = statsQuery.data?.hardestTopics ?? []
  const hardestAssessments = statsQuery.data?.hardestAssessments ?? []
  const deptLearners = useMemo(
    () => (Array.isArray(statsQuery.data?.members) ? statsQuery.data.members : []),
    [statsQuery.data]
  )
  const programmes = useMemo(
    () => (statsQuery.data?.certifications ?? []).filter((row) => row.enrolled > 0),
    [statsQuery.data]
  )
  const totals = overviewQuery.data?.totals
  const needingSupport = totals ? totals.atRisk + totals.dormant + totals.notStarted : 0

  /* Points are days (yyyy-MM-dd) for a week or a month, months (yyyy-MM)
     for a year or longer; the backend picks from the window's length. */
  const monthlyTrend = useMemo(() => {
    const rows = Array.isArray(statsQuery.data?.monthlyTrend) ? statsQuery.data.monthlyTrend : []
    const daily = String(rows[0]?.month ?? "").length === 10
    const spansYears = rows[0]?.month?.slice(0, 4) !== rows.at(-1)?.month?.slice(0, 4)
    return rows.map((row) => {
      const [year, month, day = 1] = String(row.month).split("-").map(Number)
      return {
        ...row,
        label: new Date(year, month - 1, day).toLocaleDateString(
          undefined,
          daily ? { month: "short", day: "numeric" } : { month: "short", ...(spansYears ? { year: "2-digit" } : {}) }
        ),
      }
    })
  }, [statsQuery.data])

  const readinessDistribution = useMemo(() => {
    const counts = statsQuery.data?.readinessDistribution ?? {}
    return READINESS_TIERS.map((tier) => ({ tier: tier.label, learners: Number(counts[tier.band] ?? 0) }))
  }, [statsQuery.data])

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

  const periodLabel = from || to ? `${from ?? "start"} to ${to ?? "today"}` : "All time"

  /* The metrics as CSV blocks for the period on screen. The dashboard's own
     export calls this too, so one file holds the whole page. */
  const buildCsv = () => {
    const range = periodComp?.comparisonRange
    const deltaRow = (label, key) => {
      const d = periodComp?.deltas?.[key]
      if (!d?.hasData) return [label, d?.current ?? summary[key] ?? null, null, null]
      return [label, d.current, d.previous, d.delta]
    }
    return [
      {
        title: `Metrics summary (${periodLabel})`,
        columns: ["Metric", "Value"],
        rows: [
          ["Learners", deptLearners.length],
          ["Active learners", summary.activeMembers],
          ["Average completion (%)", summary.averageProgress],
          ["Graded pass rate (%)", summary.passRate],
          ["Average score (%)", summary.averageScore],
          ["Graded attempts", summary.gradedAttempts],
          ["Lessons finished", summary.lessonsCompleted],
          ["Need a check-in now (at risk, gone quiet, not started)", needingSupport],
        ],
      },
      {
        title: `Period comparison (${range?.current?.fromStr ?? "?"} to ${range?.current?.toStr ?? "?"} vs ${
          range?.previous?.fromStr ?? "?"
        } to ${range?.previous?.toStr ?? "?"})`,
        columns: ["Metric", "This period", "Previous period", "Change"],
        rows: [
          deltaRow("Average completion (%)", "averageProgress"),
          deltaRow("Graded pass rate (%)", "passRate"),
          deltaRow("Average score (%)", "averageScore"),
          deltaRow("Graded attempts", "gradedAttempts"),
          deltaRow("Lessons finished", "lessonsCompleted"),
          deltaRow("Active learners", "activeMembers"),
        ],
      },
      {
        title: "Certifications",
        columns: [
          "Certification", "Enrolled", "Badge earned", "In progress", "Not started", "Seats used", "Seats total",
          "Completion (%)", "Average score (%)", "Graded attempts", "Graded pass rate (%)",
        ],
        rows: programmes.map((row) => [
          row.title, row.enrolled, row.passed, row.inProgress, row.notStarted, row.seatsUsed, row.seatsTotal,
          row.averageProgress == null ? null : Math.round(Number(row.averageProgress)),
          row.averageScore, row.gradedAttempts, row.attemptPassRate,
        ]),
      },
      {
        title: `Learners (${periodLabel})`,
        columns: [
          "Learner", "Username", "Completion (%)", "Lessons finished", "Graded attempts", "Passed attempts",
          "Pass rate (%)", "Average score (%)", "Certifications assigned", "Certifications earned", "Last active",
        ],
        rows: deptLearners.map((m) => [
          m.name, m.username, m.averageProgress == null ? null : Math.round(Number(m.averageProgress)),
          m.lessonsCompleted, m.gradedAttempts, m.passedAttempts, m.passRate, m.averageScore,
          m.assignedCertifications, m.completedCertifications, m.lastActivityAt ? String(m.lastActivityAt).slice(0, 10) : "Never",
        ]),
      },
      { title: "Completion spread", columns: ["Band", "Learners"], rows: spread.map((b) => [b.tier, b.learners]) },
      {
        title: "Exam readiness",
        columns: ["Band", "Learners"],
        rows: readinessDistribution.map((row) => [row.tier, row.learners]),
      },
      {
        title: "Weakest topics",
        columns: ["Certification", "Topic", "Accuracy (%)", "Answers marked", "Learners"],
        rows: hardestTopics.flatMap((cert) =>
          cert.topics.map((topic) => [cert.certificationTitle, topic.lessonTitle, topic.accuracy, topic.answered, topic.learners])
        ),
      },
      {
        title: "Hardest assessments",
        columns: [
          "Certification", "Assessment", "Type", "Attempts", "Passed attempts", "Pass rate (%)", "Learners",
          "Average score (%)", "Pass mark (%)",
        ],
        rows: hardestAssessments.flatMap((cert) =>
          cert.assessments.map((exam) => [
            cert.certificationTitle, exam.title, exam.examType, exam.attempts, exam.passedAttempts, exam.passRate,
            exam.learners, exam.averageScore, exam.passingScore,
          ])
        ),
      },
      {
        title: `Activity over time (${monthlyTrend[0]?.month?.length === 10 ? "by day" : "by month"})`,
        columns: ["Period", "Graded attempts", "Average score (%)", "Pass rate (%)", "Lessons finished", "Active learners"],
        rows: monthlyTrend.map((row) => [
          row.month, row.gradedAttempts, row.averageScore, row.passRate, row.lessonsCompleted, row.activeLearners,
        ]),
      },
    ]
  }

  // Let the dashboard's export include these blocks and the period they cover.
  if (exportRef) {
    exportRef.current = statsQuery.data ? { blocks: buildCsv, period: periodLabel } : null
  }

  const failed = statsQuery.isError
  const totalEnrolled = programmes.reduce((sum, row) => sum + row.enrolled, 0)
  const seatsTotal = Number(summary.seatsTotal ?? 0)
  const tiles = [
      {
        id: "dept-progress",
        element: (
          <div id="dept-progress" className="rounded-2xl border border-border/70 bg-card p-4 sm:p-6 shadow-xs space-y-6 animate-in fade-in-50 duration-200">
            <div className="flex h-full flex-col justify-between gap-3">
              <DashboardCardHeader
                icon={TargetIcon}
                kicker="Department Performance"
                title="Department Progress & Pass Rate"
              />

              <div className="my-auto grid grid-cols-1 items-center gap-4 sm:grid-cols-12 py-1">
                <div className="sm:col-span-5 flex min-h-[130px] sm:min-h-[180px] items-center justify-center sm:pl-4 min-w-0">
                  <div className="w-full max-w-[130px] sm:max-w-none mx-auto flex items-center justify-center">
                    <BeadedRadialGauge
                      value={failed ? 0 : Number(summary.averageProgress) || 0}
                      label="Department Completion"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:col-span-7">
                  <StatBox
                    label="Students"
                    value={count(deptLearners.length)}
                    icon={UsersRoundIcon}
                    iconClass="text-sky-600 dark:text-sky-400"
                    delta={<PeriodDeltaBadge delta={periodComp.deltas.activeMembers.delta} size="xs" />}
                  />
                  <StatBox
                    label="Pass Rate"
                    value={failed ? "—" : percent(summary.passRate)}
                    icon={CheckCheck}
                    iconClass="text-emerald-600 dark:text-emerald-400"
                    delta={<PeriodDeltaBadge delta={periodComp.deltas.passRate.delta} unit="%" size="xs" />}
                  />
                  <StatBox
                    label="Avg Score"
                    value={failed ? "—" : percent(summary.averageScore)}
                    icon={TargetIcon}
                    iconClass="text-amber-600 dark:text-amber-400"
                    delta={<PeriodDeltaBadge delta={periodComp.deltas.averageScore.delta} unit="%" size="xs" />}
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

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-border/40 pt-2.5 mt-auto text-xs text-muted-foreground font-sans">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 font-medium text-foreground tabular-nums">
                    <strong>{totalEnrolled}</strong> enrolments
                  </span>
                  <span>·</span>
                  <span>{programmes.length} programme{programmes.length === 1 ? "" : "s"}</span>
                  {seatsTotal > 0 ? (
                    <>
                      <span>·</span>
                      <span className="tabular-nums"><strong>{seatsTotal}</strong> seats</span>
                    </>
                  ) : null}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/40 px-2 py-0.5 text-foreground tabular-nums font-medium">
                    <strong className="text-foreground">
                      {failed ? "—" : count(summary.gradedAttempts)}
                    </strong>
                    graded attempts
                  </span>
                  {periodComp.deltas.gradedAttempts.delta !== 0 ? (
                    <PeriodDeltaBadge delta={periodComp.deltas.gradedAttempts.delta} size="xs" />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "dept-programme-enrolment",
        element: (
          <div id="dept-programme-enrolment" className="rounded-2xl border border-border/70 bg-card p-4 sm:p-6 shadow-xs space-y-6 animate-in fade-in-50 duration-200">
            <div className="flex h-full min-h-0 flex-1 flex-col justify-between p-3.5 sm:p-5">
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
                <p className="text-sm text-muted-foreground my-auto">
                  None of your learners are assigned to a certification yet.
                </p>
              ) : (
                <div className="relative min-h-0 flex-1 my-auto py-2">
                  <div className="-mx-2 overflow-x-auto overflow-y-hidden px-2 min-h-0 h-full">
                    <StackedBarChart
                      data={programmes.map((row) => ({
                        programme: row.title,
                        passed: row.passed,
                        inProgress: row.inProgress,
                        notStarted: row.notStarted,
                      }))}
                      categoryKey="programme"
                      series={[
                        { key: "passed", name: "Badge earned" },
                        { key: "inProgress", name: "In progress" },
                        { key: "notStarted", name: "Not started" },
                      ]}
                      height={Math.max(130, programmes.length * 56)}
                      categoryWidth={isMediumScreen ? 140 : 110}
                      note="Badge earned = finished the review and earned the REBYU badge. It is not the official certification."
                    />
                  </div>
                  {/* Faint right-fade gradient overlay to signal horizontal overflow on small screens */}
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background/80 to-transparent sm:hidden" />
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-border/40 pt-2.5 mt-auto text-xs text-muted-foreground font-sans">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 font-medium text-foreground tabular-nums">
                    <strong>{programmes.reduce((sum, r) => sum + (r.passed ?? 0), 0)}</strong> badges earned
                  </span>
                  <span>·</span>
                  <span>{programmes.reduce((sum, r) => sum + (r.inProgress ?? 0), 0)} in progress</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 text-foreground tabular-nums font-medium">
                    {programmes.length} track{programmes.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "dept-programme-table",
        element: (
          <div id="dept-programme-table" className="rounded-2xl border border-border/70 bg-card p-4 sm:p-6 shadow-xs space-y-6 animate-in fade-in-50 duration-200">
            <div className="flex h-full min-h-0 flex-1 flex-col justify-between p-3.5 sm:p-5">
              <DashboardCardHeader
                icon={Award}
                kicker="Programme Scorecard"
                title="Seats, completion and marks"
                hint="Your department's learners on each programme, with their marks."
              />
              {programmes.length === 0 ? (
                <p className="text-sm text-muted-foreground my-auto">
                  None of your learners are assigned to a certification yet.
                </p>
              ) : (
                <div className="-mr-2 min-h-0 flex-1 overflow-x-auto overflow-y-hidden pr-2 my-auto">
                  <table className="w-full text-xs" style={{ minWidth: 400 }}>
                    <thead className="sticky top-0 z-10 bg-background">
                      <tr className="border-b border-border/60 text-[11px] font-semibold text-muted-foreground">
                        <th className="py-2 pr-3 text-left">Programme</th>
                        <th className="px-2 py-2 text-center">Enrolled</th>
                        <th className="px-2 py-2 text-center">Seats</th>
                        <th className="px-2 py-2 text-center">Badge earned</th>
                        <th className="px-2 py-2 text-center">Avg done</th>
                        <th className="px-2 py-2 text-center">Avg score</th>
                        <th className="hidden py-2 pl-2 text-center sm:table-cell">Attempts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {programmes.map((row) => (
                        <tr
                          key={row.certificationId}
                          className="border-b border-border/40 transition-colors hover:bg-muted/40"
                        >
                          <td className="max-w-[180px] overflow-hidden text-ellipsis truncate py-2 pr-3 font-bold text-foreground">
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
                          <td className="hidden py-2 pl-2 text-center tabular-nums text-muted-foreground sm:table-cell">
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

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-border/40 pt-2.5 mt-auto text-xs text-muted-foreground font-sans">
                <span className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 font-medium text-foreground tabular-nums">
                  {programmes.length} active programme{programmes.length === 1 ? "" : "s"}
                </span>
                <span className="text-muted-foreground">
                  {totalEnrolled} total enrolled
                </span>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "dept-completion-spread",
        element: (
          <div id="dept-completion-spread" className="rounded-2xl border border-border/70 bg-card p-4 sm:p-6 shadow-xs space-y-6 animate-in fade-in-50 duration-200">
            <div className="flex h-full flex-col justify-between gap-3">
              <DashboardCardHeader
                icon={Layers}
                kicker="Progress Distribution"
                title="How far the cohort has got"
                hint="Exam ready = average of 75% or more with 80% of lessons done; needs review = under 50% or no graded work."
              />
              {deptLearners.length === 0 ? (
                <p className="text-sm text-muted-foreground my-auto">
                  No learners assigned to your department yet.
                </p>
              ) : (
                <div className="my-auto grid gap-6 py-1 md:grid-cols-2">
                  <div className="min-w-0">
                    <p className="mb-1 text-xs font-semibold text-muted-foreground">Completion (students per band)</p>
                    <BarBreakdownChart
                      data={spread}
                      categoryKey="tier"
                      valueKey="learners"
                      horizontal={false}
                      height={186}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="mb-1 text-xs font-semibold text-muted-foreground">
                      Exam readiness (marks and coverage together)
                    </p>
                    <BarBreakdownChart
                      data={readinessDistribution}
                      categoryKey="tier"
                      valueKey="learners"
                      horizontal={false}
                      height={186}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-border/40 pt-2.5 mt-auto text-xs text-muted-foreground font-sans">
                <span className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 font-medium text-foreground tabular-nums">
                  {deptLearners.length} total students
                </span>
                <span className={needingSupport > 0 ? "font-semibold text-amber-600 dark:text-amber-400" : "text-muted-foreground"}>
                  {needingSupport > 0 ? `${needingSupport} needing intervention` : "Cohort pacing healthy"}
                </span>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "dept-monthly-trend",
        element: (
          <div id="dept-monthly-trend" className="rounded-2xl border border-border/70 bg-card p-4 sm:p-6 shadow-xs space-y-6 animate-in fade-in-50 duration-200">
            <DashboardCardHeader
              icon={TrendingUpIconSafe}
              kicker="Over Time"
              title="How the department worked across the period"
              hint="Follows the date picker at the top: a year shows months, a month or week shows days."
            />
            {monthlyTrend.every((row) => !row.gradedAttempts && !row.lessonsCompleted) ? (
              <p className="text-sm text-muted-foreground">No graded work or finished lessons in this period.</p>
            ) : (
              <div className="grid min-w-0 gap-6 md:grid-cols-2">
                <div className="min-w-0">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">Marks (%)</p>
                  <TrendLineChart
                    data={monthlyTrend}
                    xKey="label"
                    height={200}
                    unit="%"
                    dot
                    series={[
                      { key: "averageScore", name: "Average score" },
                      { key: "passRate", name: "Pass rate" },
                    ]}
                  />
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">Activity (count)</p>
                  <TrendLineChart
                    data={monthlyTrend}
                    xKey="label"
                    height={200}
                    dot
                    domain={[
                      0,
                      Math.max(
                        1,
                        Math.ceil(
                          Math.max(
                            ...monthlyTrend.map((row) => Math.max(row.gradedAttempts, row.lessonsCompleted))
                          ) * 1.15
                        )
                      ),
                    ]}
                    series={[
                      { key: "gradedAttempts", name: "Graded attempts" },
                      { key: "lessonsCompleted", name: "Lessons done" },
                      { key: "activeLearners", name: "Active students" },
                    ]}
                  />
                </div>
              </div>
            )}
          </div>
        ),
      },
      {
        id: "dept-hard-topics",
        element: (
          <div id="dept-hard-topics" className="rounded-2xl border border-border/70 bg-card p-4 sm:p-6 shadow-xs space-y-6 animate-in fade-in-50 duration-200">
            <div className="flex h-full min-h-0 flex-1 flex-col justify-between p-3.5 sm:p-5">
              <DashboardCardHeader
                icon={TargetIcon}
                kicker="Teaching Signal"
                title="Topics the department is failing"
                hint="Lowest accuracy across everyone's marked answers."
              />
              {hardestTopics.length === 0 ? (
                <div className="flex flex-1 items-center justify-center my-auto">
                  <InstitutionEmptyState
                    icon={TargetIcon}
                    title="No topic data yet"
                    description="Not enough marked answers yet to rank topics."
                  />
                </div>
              ) : (
                <div className="space-y-5 min-w-0 my-auto py-2">
                  {hardestTopics.map((programme) => (
                    <div key={programme.certificationId}>
                      <p className="mb-2 truncate text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {programme.certificationTitle}
                      </p>
                      <BarBreakdownChart
                        data={programme.topics.map((topic, i) => {
                          const isDupe = programme.topics.filter((t) => t.lessonTitle === topic.lessonTitle).length > 1
                          const uniqueTitle = isDupe && topic.lessonId ? `${topic.lessonTitle} (#${topic.lessonId})` : isDupe ? `${topic.lessonTitle} (${i + 1})` : topic.lessonTitle
                          return {
                            topic: uniqueTitle,
                            accuracy: topic.accuracy,
                          }
                        })}
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

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-border/40 pt-2.5 mt-auto text-xs text-muted-foreground font-sans">
                <span className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 font-medium text-foreground tabular-nums">
                  50% accuracy threshold benchmark
                </span>
                <span className="text-muted-foreground">
                  Targeted for remedial review
                </span>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "dept-hard-assessments",
        element: (
          <div id="dept-hard-assessments" className="rounded-2xl border border-border/70 bg-card p-4 sm:p-6 shadow-xs space-y-6 animate-in fade-in-50 duration-200">
            <div className="flex h-full min-h-0 flex-1 flex-col justify-between p-3.5 sm:p-5">
              <DashboardCardHeader
                icon={ClipboardListIcon}
                kicker="Assessment Signal"
                title="Hardest assessments"
                hint="Lowest pass rate first, per programme — a paper nobody passes is worth a look."
              />
              {hardestAssessments.length === 0 ? (
                <div className="flex flex-1 items-center justify-center my-auto">
                  <InstitutionEmptyState
                    icon={ClipboardListIcon}
                    title="No graded assessments"
                    description="No assessment has been graded in this department yet."
                  />
                </div>
              ) : (
                <div className="space-y-5 min-w-0 my-auto py-2">
                  {hardestAssessments.map((programme) => (
                    <div key={programme.certificationId}>
                      <p className="mb-2 truncate text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {programme.certificationTitle}
                      </p>
                      <BarBreakdownChart
                        data={programme.assessments.map((exam, i) => {
                          const isDupe = programme.assessments.filter((e) => e.title === exam.title).length > 1
                          const uniqueTitle = isDupe && exam.examId ? `${exam.title} (#${exam.examId})` : isDupe ? `${exam.title} (${i + 1})` : exam.title
                          return {
                            exam: uniqueTitle,
                            averageScore: exam.averageScore ?? 0,
                            passRate: exam.passRate,
                            passedAttempts: exam.passedAttempts,
                            attempts: exam.attempts,
                            learners: exam.learners,
                            passingScore: exam.passingScore,
                          }
                        })}
                        categoryKey="exam"
                        valueKey="averageScore"
                        unit="%"
                        target={passMarkFor(programme.assessments)}
                        domainMax={100}
                        height={Math.max(120, programme.assessments.length * 36)}
                        categoryWidth={150}
                        tooltipContent={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null
                          const item = payload[0]?.payload
                          if (!item) return null
                          return (
                            <div className="rounded-xl border-2 border-border bg-popover px-3 py-2 text-popover-foreground shadow-md">
                              <div className="text-xs font-bold text-muted-foreground">{label}</div>
                              <ul className="mt-1 space-y-1 text-xs">
                                <li className="flex items-center justify-between gap-4">
                                  <span className="text-muted-foreground">Average score</span>
                                  <span className="font-bold tabular-nums">
                                    {item.averageScore}%
                                  </span>
                                </li>
                                <li className="flex items-center justify-between gap-4">
                                  <span className="text-muted-foreground">Pass rate</span>
                                  <span
                                    className={`font-bold tabular-nums ${
                                      item.passRate === 0 ? "text-destructive" : ""
                                    }`}
                                  >
                                    {item.passRate != null ? `${item.passRate}%` : "—"}
                                    {item.attempts != null
                                      ? ` (${item.passedAttempts ?? 0}/${item.attempts} passed)`
                                      : ""}
                                  </span>
                                </li>
                                <li className="flex items-center justify-between gap-4">
                                  <span className="text-muted-foreground">Learners</span>
                                  <span className="font-semibold tabular-nums">
                                    {item.learners ?? 0} learner{item.learners === 1 ? "" : "s"}
                                  </span>
                                </li>
                                {item.passingScore != null ? (
                                  <li className="flex items-center justify-between gap-4">
                                    <span className="text-muted-foreground">Pass mark</span>
                                    <span className="font-medium tabular-nums text-muted-foreground">
                                      {item.passingScore}%
                                    </span>
                                  </li>
                                ) : null}
                              </ul>
                            </div>
                          )
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-border/40 pt-2.5 mt-auto text-xs text-muted-foreground font-sans">
                <span className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 font-medium text-foreground tabular-nums">
                  Sorted by lowest pass rate first
                </span>
                <span className="text-muted-foreground">
                  {hardestAssessments.length} assessment{hardestAssessments.length === 1 ? "" : "s"} analyzed
                </span>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "dept-period-comparison",
        element: (
          <PeriodComparisonTile
            comparisonRange={periodComp.comparisonRange}
            deltas={periodComp.deltas}
            certificationsComparison={periodComp.certificationsComparison}
            learnerMomentum={periodComp.learnerMomentum}
            insights={periodComp.insights}
            comparisonType={comparisonType}
            onComparisonTypeChange={setComparisonType}
            isLoading={periodComp.isLoading}
            isError={periodComp.isError}
            collapsible={false}
          />
        ),
      },
  ]
  const activeTile = tiles.find((t) => t.id === activeFeature) ?? tiles[0]

  if (departmentsQuery.isLoading) return <InstitutionLoadingSkeleton />
  if (departmentsQuery.isError) {
    return <InstitutionErrorState title="Unable to load your department" onRetry={departmentsQuery.refetch} />
  }
  if (departments.length === 0) {
    return (
      <InstitutionEmptyState
        title="No active department yet"
        description="Metrics appear once you head an active department."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative z-30 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div className="flex w-full flex-col items-stretch gap-2.5 sm:flex-row sm:items-center md:w-auto">
          {departments.length > 1 && !embedded ? (
            <Select value={String(departmentId)} onValueChange={(value) => selectDepartment(Number(value))}>
              <SelectTrigger className="w-full bg-background sm:w-[220px]" aria-label="Department">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {departments.map((group) => (
                  <SelectItem key={group.departmentId} value={String(group.departmentId)}>
                    {group.departmentName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <div className="w-full sm:max-w-[320px]">
            <DateRangeNavigator className="w-full" onRangeChange={setRange} />
          </div>
        </div>

        {embedded ? null : (
          <ExportButton
            filename="rebyu-department-metrics"
            report="Department metrics"
            details={() => [
              ["Department", departments.find((g) => g.departmentId === departmentId)?.departmentName],
              ["Period", periodLabel],
            ]}
            className="min-h-[44px] sm:h-9 sm:min-h-0"
            sections={() => buildCsv()}
            disabled={statsQuery.isLoading || statsQuery.isError}
          />
        )}
      </div>

      {embedded ? (
        statsQuery.isLoading ? (
          <InstitutionLoadingSkeleton />
        ) : statsQuery.isError ? (
          <InstitutionErrorState title="Unable to load metrics" onRetry={statsQuery.refetch} />
        ) : (
          /* Every view at once. The dashboard's own cards already show the
             headline numbers, so the "progress" view is left out here. */
          <div className="grid gap-6 lg:grid-cols-2">
            {GRID_LAYOUT.map(({ id, wide }) => {
              const tile = tiles.find((t) => t.id === id)
              return tile ? (
                <div key={id} className={cn("min-w-0 [&>*]:h-full", wide && "lg:col-span-2")}>
                  {tile.element}
                </div>
              ) : null
            })}
          </div>
        )
      ) : (
      <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
        <MetricsSidebar activeFeature={activeFeature} onSelectFeature={setActiveFeature} />
        <div className="min-w-0 space-y-6">
          {statsQuery.isLoading ? (
            <InstitutionLoadingSkeleton />
          ) : statsQuery.isError ? (
            <InstitutionErrorState title="Unable to load metrics" onRetry={statsQuery.refetch} />
          ) : (
            activeTile.element
          )}
        </div>
      </div>
      )}
    </div>
  )
}
