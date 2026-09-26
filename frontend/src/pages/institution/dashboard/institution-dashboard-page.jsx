import { useCallback, useMemo, useState } from "react"
import { Link, useOutletContext } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
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
  TrendingUp,
  UserCheck,
  UsersIcon,
} from "@/components/icons"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  InstitutionEmptyState,
  InstitutionErrorState,
  InstitutionLoadingSkeleton,
  InstitutionPageHeader,
  InstitutionStatusBadge,
  InstitutionVerifiedBadge,
  accessWindowStatus,
  formatDateTime,
} from "@/components/institution/institution-ui.jsx"
import { BentoTile } from "@/components/commons/bento.jsx"
import { DashboardBoard } from "@/components/commons/dashboard-board.jsx"
import { DashboardRearrangeControls } from "@/components/commons/dashboard-rearrange-controls.jsx"
import { useDashboardLayout } from "@/hooks/use-dashboard-layout.js"
import { getInstitutionDashboard } from "@/services/institutionDashboardService.js"
import {
  BarBreakdownChart,
  BeadedRadialGauge,
  DonutChart,
  RadialGauge,
  TrendLineChart,
  seriesColor,
  useChartTheme,
} from "@/components/charts/rebyu-charts.jsx"
import InstitutionDrilldownStatsCard from "@/components/institution/institution-drilldown-stats-card.jsx"
import { getDepartmentColor, getDepartmentAbbreviation } from "@/constants/departments.js"
import { DateRangeNavigator } from "@/components/commons/date-range-navigator.jsx"

/** The three lines, named once so the chart and its legend cannot disagree. */
const TREND_SERIES = [
  { key: "lessons", name: "Lessons completed" },
  { key: "attempts", name: "Graded attempts" },
  { key: "learners", name: "Active learners" },
]

const EMPTY_DASHBOARD = {
  range: null,
  summary: {},
  certifications: [],
  departments: [],
  enrollments: [],
  progressBuckets: [],
  trend: [],
  invitations: { pending: 0, recent: [] },
}

/** Not-yet-measured reads as a dash. A zero would claim a fact we do not have. */
function count(value) {
  return value == null ? "—" : Number(value).toLocaleString()
}

function percent(value, digits = 0) {
  return value == null ? "—" : `${Number(value).toFixed(digits)}%`
}

/**
 * The local calendar date, as the API's `from`/`to` want it.
 *
 * Not `toISOString().slice(0, 10)`: that converts to UTC first, so anyone east
 * of Greenwich asking for "today" would send yesterday. Manila is UTC+8, which
 * is every hour of the working day.
 */
function isoDate(date) {
  if (!date) return null
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

/**
 * A trend bucket's label, at the resolution the server bucketed by -- it picks
 * hour, day or month from the length of the range, so the axis never has to
 * choose between 24 labels and 365 of them.
 */
function bucketLabel(value, granularity) {
  if (!value) return ""
  const at = new Date(value)
  if (Number.isNaN(at.getTime())) return String(value)
  if (granularity === "hour") {
    return at.toLocaleTimeString("en-US", { hour: "numeric" })
  }
  if (granularity === "month") {
    return at.toLocaleDateString("en-US", { month: "short" })
  }
  return at.toLocaleDateString("en-US", { month: "short", day: "numeric" })
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
  const layout = useDashboardLayout("institution")

  /* The period selected above the board. Held here rather than inside the
     navigator because it is a query parameter: the navigator used to be a shell
     that moved a label and changed nothing.

     Seeded with the navigator's own default -- this year -- so the first render
     asks for the same range the navigator reports back on mount. Starting empty
     would fetch twice, and the query cannot simply wait for the navigator: the
     loading branch below renders a skeleton in its place, so nothing would ever
     mount to report a range. */
  const [range, setRange] = useState(() => {
    const now = new Date()
    return {
      mode: "yearly",
      from: new Date(now.getFullYear(), 0, 1),
      to: new Date(now.getFullYear(), 11, 31),
    }
  })
  const handleRangeChange = useCallback((next) => setRange(next), [])
  const from = isoDate(range?.from)
  const to = isoDate(range?.to)

  /* One read, one snapshot. The board used to stitch four together -- learning
     stats, group stats, the department list and the portal overview -- and then
     fill in everything the joins between them did not carry: a department with
     no slots was drawn as ten, seats came from a stored counter that had drifted
     from the roster, and a learner's practice on a certification the institution
     never licensed counted towards its pass rate. Every figure below is now
     counted from the rows themselves, server-side, so two tiles reading the same
     thing cannot disagree. */
  const dashboardQuery = useQuery({
    queryKey: ["institution-dashboard", institution?.institutionId, from, to],
    queryFn: () => getInstitutionDashboard({ from, to }),
    enabled: institution?.institutionId != null,
    // Keep the board on screen while a new period loads; a full skeleton on
    // every arrow press reads as the page reloading rather than as a filter.
    placeholderData: (previous) => previous,
    retry: 1,
  })

  const dashboard = dashboardQuery.data ?? EMPTY_DASHBOARD
  const {
    summary = {},
    certifications = [],
    departments = [],
    enrollments = [],
    progressBuckets = [],
    invitations = { pending: 0, recent: [] },
  } = dashboard

  const chartTheme = useChartTheme()

  const trendData = useMemo(
    () =>
      (dashboard.trend ?? []).map((point) => ({
        label: bucketLabel(point.bucket, dashboard.range?.granularity),
        attempts: point.gradedAttempts,
        lessons: point.lessonsCompleted,
        learners: point.activeLearners,
      })),
    [dashboard.trend, dashboard.range]
  )

  /* What the period adds up to. The chart's own legend states the *last*
     bucket, which on any range that ends quietly -- a month read on its last
     day, a year read in January -- puts three zeros under a line with a visible
     spike in it. Lessons and attempts sum; active learners cannot, because the
     same person active in two buckets is one learner, so that one comes from
     the summary, which counts them distinctly across the whole range. */
  const trendTotals = useMemo(
    () => ({
      lessons: trendData.reduce((sum, point) => sum + Number(point.lessons ?? 0), 0),
      attempts: trendData.reduce((sum, point) => sum + Number(point.attempts ?? 0), 0),
      learners: summary.activeLearners ?? 0,
    }),
    [trendData, summary.activeLearners]
  )

  const activeCertifications = useMemo(
    () =>
      certifications.filter((cert) =>
        ["active", "expiring_soon"].includes(accessWindowStatus(cert).status)
      ),
    [certifications]
  )

  const cohortBuckets = useMemo(
    () =>
      progressBuckets
        .map((bucket) => ({ name: bucket.label, value: bucket.enrollments }))
        .filter((bucket) => bucket.value > 0),
    [progressBuckets]
  )

  const departmentRows = useMemo(
    () => [...departments].sort((a, b) => (b.averageProgress ?? 0) - (a.averageProgress ?? 0)),
    [departments]
  )

  const tiles = useMemo(() => {
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
              certifications={certifications}
              departments={departments}
              enrollments={enrollments}
              summary={summary}
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
          <BentoTile
            tone="plain"
            col={3}
            row={1}
            className="relative overflow-hidden border border-teal-500/35 bg-cover bg-center shadow-xs text-white"
            style={{ backgroundImage: "url('/images/cards/learner-capacity-card-bg.jpg')" }}
          >
            {/* Left-side scrim overlay for clear text contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent pointer-events-none" />

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex items-start justify-between gap-2 border-b border-white/20 pb-2 mb-2">
                <div className="min-w-0">
                  <h3 className="text-[10px] font-bold uppercase leading-tight tracking-wider text-teal-200 drop-shadow-xs">
                    Capacity & Licensing
                  </h3>
                  <p className="truncate text-xs font-extrabold leading-snug text-white sm:text-sm font-rb-display drop-shadow-xs">
                    Learner Slots & Capacity
                  </p>
                </div>
              </div>

              <div className="flex items-end justify-between gap-2 pt-1">
                <div className="min-w-0 max-w-[62%]">
                  <div className="font-rb-display text-2xl font-black leading-none tracking-tight tabular-nums text-white sm:text-3xl drop-shadow-md">
                    {`${seatsUsed} / ${seatsTotal}`}
                  </div>
                  <div className="mt-1.5 truncate text-[11px] font-semibold text-emerald-100 drop-shadow-xs">
                    {seatsTotal > 0
                      ? `${Math.round((seatsUsed / seatsTotal) * 100)}% capacity utilized`
                      : "No slots allocated"}
                  </div>
                </div>

                {seatsTotal > 0 ? (
                  <div className="size-[72px] shrink-0 rounded-full bg-slate-900/60 p-1 backdrop-blur-md border border-white/25 shadow-md ring-1 ring-white/10">
                    <RadialGauge
                      value={(seatsUsed / seatsTotal) * 100}
                      label="filled"
                      height={64}
                      color="#2dd4bf"
                      trackColor="rgba(255, 255, 255, 0.22)"
                      valueInk="#ffffff"
                      labelColor="#e2e8f0"
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
                {/* Left Column (5 cols): Beaded Ring Gauge & Stat Hero (styled like reference) */}
                <div className="sm:col-span-5 flex items-center justify-center pl-4 min-w-0">
                  <BeadedRadialGauge
                    value={Number(summary.averageProgress) || 0}
                    label="Overall Completion"
                  />
                </div>

                {/* Right Column (7 cols): 2x2 Grid of Key Learning Metrics */}
                <div className="grid grid-cols-2 gap-2 sm:col-span-7">
                  <div className="rounded-lg border border-border/70 bg-muted/30 p-2.5">
                    <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span>Pass Rate</span>
                      <CheckCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="mt-1.5 font-rb-display text-lg font-bold tabular-nums text-foreground">
                      {percent(summary.passRate)}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-muted/30 p-2.5">
                    <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span>Avg Score</span>
                      <TargetIcon className="size-3.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="mt-1.5 font-rb-display text-lg font-bold tabular-nums text-foreground">
                      {percent(summary.averageScore)}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-muted/30 p-2.5">
                    <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span>Attempts</span>
                      <ClipboardListIcon className="size-3.5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div className="mt-1.5 font-rb-display text-lg font-bold tabular-nums text-foreground">
                      {count(summary.gradedAttempts)}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-muted/30 p-2.5">
                    <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span>Lessons Done</span>
                      <BookOpenCheckIcon className="size-3.5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="mt-1.5 font-rb-display text-lg font-bold tabular-nums text-foreground">
                      {count(summary.lessonsCompleted)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Cohort Status Summary */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                    <span>Completed: <strong className="text-foreground">{count(summary.completed)}</strong></span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-500" />
                    <span>In Progress: <strong className="text-foreground">{count(summary.inProgress)}</strong></span>
                  </span>
                </div>
                {summary.needingSupport > 0 ? (
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-slate-400" />
                    <span>Needs Support: <strong className="text-foreground">{count(summary.needingSupport)}</strong></span>
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
              hint="Learning activity across the whole institution, over the selected period."
            />
            <dl className="grid flex-1 grid-cols-2 items-center gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
              <Figure
                icon={BookOpenCheckIcon}
                label="Lessons completed"
                value={count(summary.lessonsCompleted)}
              />
              <Figure
                icon={ClipboardListIcon}
                label="Graded attempts"
                value={count(summary.gradedAttempts)}
                hint={`${percent(summary.passRate)} pass rate`}
              />
              <Figure
                icon={UserCheck}
                label="Average score"
                value={percent(summary.averageScore)}
                hint="Weighted by attempts"
              />
              <Figure
                icon={GraduationCapIcon}
                label="Active certifications"
                value={count(activeCertifications.length)}
              />
              <Figure
                icon={BarChart3Icon}
                label="Needing support"
                value={count(summary.needingSupport)}
                hint="Unfinished, below 30%"
                /* The one figure on this strip that is a call to action rather
                   than a record of what happened, so it is the one allowed to
                   carry colour. */
                alert={summary.needingSupport > 0}
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
              hint="How progress is spread across the roster"
            />
            <DonutChart
              data={cohortBuckets}
              height={168}
              centerValue={String(summary.enrollments ?? 0)}
              centerLabel={summary.enrollments === 1 ? "enrollment" : "enrollments"}
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
              hint="Average progress across each department's learners"
            />
            <BarBreakdownChart
              data={departmentRows.map((row) => ({
                group: row.name,
                completion: Number(row.averageProgress ?? 0),
              }))}
              categoryKey="group"
              valueKey="completion"
              unit="%"
              target={60}
              height={168}
              categoryWidth={96}
            />
          </BentoTile>
        ),
      },
      {
        /* The one tile the period selector above the board exists for. Progress
           is current state and cannot be replayed over time, so this plots what
           the institution's learners actually did inside the range -- bucketed
           by hour, day or month by the server, whichever the range's length
           calls for. */
        id: "ent-activity-trend",
        col: 6,
        row: 2,
        x: 0,
        y: 6,
        element: (
          <BentoTile col={6} row={2}>
            <DashboardCardHeader
              icon={TrendingUp}
              kicker="Activity Over Time"
              title="Lessons, Attempts & Active Learners"
              hint="Work done inside the selected period, on certifications this institution licenses."
            />
            {/* Lines, not stacked areas: three counts on very different
                scales -- a year of lessons against a handful of learners --
                and a stack would add them into a total nobody asked for. */}
            <TrendLineChart
              data={trendData}
              xKey="label"
              domain={["auto", "auto"]}
              dot={trendData.length <= 14}
              height={200}
              showLegend={false}
              series={TREND_SERIES}
            />
            <dl className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border/40 pt-2.5">
              {TREND_SERIES.map((entry, index) => (
                <div key={entry.key} className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: seriesColor(chartTheme, index) }}
                    aria-hidden="true"
                  />
                  <dt className="text-xs font-semibold text-muted-foreground">{entry.name}</dt>
                  <dd className="font-rb-display text-sm font-bold tabular-nums text-foreground">
                    {count(trendTotals[entry.key])}
                  </dd>
                </div>
              ))}
              <p className="ml-auto text-[11px] text-muted-foreground">
                Totals for the selected period
              </p>
            </dl>
          </BentoTile>
        ),
      },
      {
        id: "ent-member-table",
        col: 6,
        row: 3,
        x: 0,
        y: 8,
        element: (
          <BentoTile col={6} row={3} className="!p-0">
            <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
              <DashboardCardHeader
                icon={Building2}
                kicker="Department Analytics"
                title="Performance by Department"
                hint="Aggregated learning metrics across all departments — ranked by avg progress."
                chip={
                  departmentRows.length > 0 ? (
                    <Badge
                      variant="secondary"
                      className="border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      {departmentRows.length}{" "}
                      {departmentRows.length === 1 ? "department" : "departments"}
                    </Badge>
                  ) : null
                }
              />

              {departmentRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground">
                  <Building2 className="mb-2 size-8 text-muted-foreground/40" />
                  <p>No departments yet.</p>
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
                      {departmentRows.map((row) => (
                        <tr
                          key={row.departmentId ?? "unassigned"}
                          className="border-b border-border/40 hover:bg-muted/40 transition-colors duration-150"
                        >
                          {/* Department name with open-ring badge */}
                          <td className="py-2.5 pl-2 pr-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className="grid size-6 shrink-0 place-items-center rounded-md border-2 bg-transparent text-[9.5px] font-black tabular-nums transition-transform hover:scale-105"
                                style={{
                                  borderColor: getDepartmentColor(row.name),
                                  color: getDepartmentColor(row.name),
                                }}
                              >
                                {getDepartmentAbbreviation(row.name)}
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
                                {row.enrolled}
                              </span>
                            </div>
                          </td>

                          {/* Avg progress bar — smooth rounded ends */}
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2 max-w-[130px]">
                              <Progress
                                value={Number(row.averageProgress ?? 0)}
                                aria-label={`${row.name} avg progress`}
                                className="h-2 flex-1 rounded-full bg-muted/60 [&>[data-slot=progress-indicator]]:rounded-full"
                              />
                              <span className="shrink-0 tabular-nums text-xs font-bold text-foreground w-8 text-right">
                                {percent(row.averageProgress)}
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
        y: 11,
        element: (
          <BentoTile col={3} row={2} className="!p-0">
            <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
              <DashboardCardHeader
                icon={MailPlusIcon}
                kicker="Onboarding & Access"
                title="Recent Learner Invitations"
                hint="The latest learner invitations sent."
                chip={
                  invitations.pending > 0 ? (
                    <Badge
                      variant="secondary"
                      className="gap-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      <MailPlusIcon className="size-3" aria-hidden="true" />
                      {invitations.pending} pending
                    </Badge>
                  ) : null
                }
              />

              {invitations.recent.length === 0 ? (
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
                  {invitations.recent.map((invitation) => (
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
        y: 11,
        element: (
          <BentoTile col={3} row={2} className="!p-0">
            <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
              <DashboardCardHeader
                icon={GraduationCap}
                kicker="Certification Inventory"
                title="Program Slot Allocations"
                hint="Seats taken per certification your institution has access to."
                chip={
                  activeCertifications.length > 0 ? (
                    <Badge
                      variant="secondary"
                      className="border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      {activeCertifications.length} active
                    </Badge>
                  ) : null
                }
              />

              {certifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No certification allocations yet. Submit a partnership request to get started.
                </p>
              ) : (
                <div className="-mr-2 min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
                  {certifications.map((cert) => {
                    const used = cert.seatsUsed ?? 0
                    const total = cert.totalSlots ?? 0
                    const pct = total > 0 ? (used / total) * 100 : 0

                    return (
                      <div key={cert.institutionCertId} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="truncate font-bold">{cert.title}</span>
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
    summary,
    certifications,
    departments,
    enrollments,
    activeCertifications,
    cohortBuckets,
    departmentRows,
    trendData,
    trendTotals,
    invitations,
  ])

  if (institutionLoading || (institution && dashboardQuery.isLoading)) {
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
            <InstitutionVerifiedBadge verified={institution.isVerified} />
          </div>
        }
      />

      {dashboardQuery.isError ? (
        <InstitutionErrorState onRetry={dashboardQuery.refetch} />
      ) : (
        <>
          {/* Toolbar row: Date range navigator directly above the big card, rearrange controls on the right */}
          <div className="relative z-30 flex flex-wrap items-center justify-between gap-4 mb-2.5">
            <div className="w-full md:w-[calc(50%-10px)]">
              <DateRangeNavigator className="w-full" onRangeChange={handleRangeChange} />
            </div>

            <div className="ml-auto flex items-center gap-3">
              {dashboardQuery.isFetching ? (
                <span className="text-xs font-semibold text-muted-foreground" role="status">
                  Updating…
                </span>
              ) : null}
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
