import { useEffect, useRef } from "react"
import { DashboardBoard } from "@/components/commons/dashboard-board.jsx"
import { DashboardRearrangeControls } from "@/components/commons/dashboard-rearrange-controls.jsx"
import { useDashboardLayout } from "@/hooks/use-dashboard-layout.js"
import { Link, useLocation } from "react-router-dom"
import {
  AlertCircle,
  AlertTriangle,
  Award,
  CheckCircle2,
  ChevronRight,
  Info,
  Layers,
  MegaphoneIcon,
  PinIcon,
  ShieldAlert,
  TargetIcon,
  UsersRound,
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
  LEARNER_STATUS,
  relativeDays,
  useDepartmentOverview,
  useMyDepartments,
} from "@/hooks/use-my-department.js"
import { cn } from "@/lib/utils"
import DepartmentHeadMetrics from "@/pages/institution/dashboard/department-head-metrics.jsx"
import { ExportButton, pct } from "@/components/commons/export-button.jsx"
import {
  ANNOUNCEMENT_COLUMNS,
  FORMER_LEARNER_COLUMNS,
  LEARNER_COLUMNS,
  PROGRAM_COLUMNS,
  SECTION_COLUMNS,
  announcementRow,
  formerLearnerRow,
  learnerRow,
  sectionRow,
} from "@/lib/department-export.js"
import { getDepartmentAnnouncements, getDepartmentPrograms } from "@/services/institutionService.js"

const SEVERITY = {
  critical: {
    icon: AlertCircle,
    card: "border-rose-500/30 bg-rose-500/5",
    badge: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    iconWrap: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    label: "Urgent",
  },
  warning: {
    icon: AlertTriangle,
    card: "border-amber-500/30 bg-amber-500/5",
    badge: "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300",
    iconWrap: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    label: "Needs attention",
  },
  info: {
    icon: Info,
    card: "border-border/70 bg-card",
    badge: "border-border bg-muted/60 text-muted-foreground",
    iconWrap: "bg-primary/10 text-primary",
    label: "For your information",
  },
}

const WATCH_STATUSES = new Set(["at_risk", "dormant", "not_started"])

function percent(value) {
  return value == null ? "—" : `${Math.round(Number(value))}%`
}

function alertHref(alert) {
  if (alert.action === "roster") {
    return `/institution/departments?view=roster${alert.filter ? `&filter=${alert.filter}` : ""}`
  }
  if (alert.action === "sections") return "/institution/departments?view=programs"
  if (alert.action === "announcements") return "/institution/departments?view=announcements"
  return null
}

function KpiCard({ label, icon: Icon, iconClass, value, suffix, children }) {
  return (
    <div className="space-y-2 rounded-2xl border border-border/70 bg-card p-4 shadow-xs sm:p-5">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
        <Icon className={cn("size-4", iconClass)} aria-hidden="true" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-extrabold tabular-nums text-foreground sm:text-3xl">{value}</span>
        {suffix ? <span className="text-xs font-medium text-muted-foreground">{suffix}</span> : null}
      </div>
      {children}
    </div>
  )
}

function Panel({ icon: Icon, iconClass, title, action, children }) {
  return (
    <section className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-xs sm:p-6">
      <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <Icon className={cn("size-4", iconClass)} aria-hidden="true" />
          <h2 className="text-sm font-bold text-foreground sm:text-base">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function PanelLink({ to, children }) {
  return (
    <Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-xs">
      <Link to={to}>
        <span>{children}</span>
        <ChevronRight className="size-3" aria-hidden="true" />
      </Link>
    </Button>
  )
}

function QuietState({ icon: Icon = CheckCircle2, title, children }) {
  return (
    <div className="space-y-1.5 rounded-xl border border-dashed border-border/70 bg-muted/15 p-6 text-center">
      <Icon className="mx-auto size-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
      <p className="text-xs font-semibold text-foreground">{title}</p>
      {children ? <p className="text-[11px] text-muted-foreground">{children}</p> : null}
    </div>
  )
}

/** The whole dashboard as CSV: the department, every learner, section, program and
    announcement, then the metrics for the period picked on the page. */
async function dashboardCsv(overview, metrics) {
  const { totals, summary } = overview
  const [programs, announcements] = await Promise.all([
    getDepartmentPrograms(overview.departmentId).catch(() => []),
    getDepartmentAnnouncements(overview.departmentId).catch(() => overview.announcements),
  ])
  const sectionsByProgram = new Map()
  for (const section of overview.sections) {
    const key = section.programId ?? "none"
    sectionsByProgram.set(key, [...(sectionsByProgram.get(key) ?? []), section])
  }
  const programRow = (program) => {
    const list = sectionsByProgram.get(program.programId) ?? []
    const learners = list.reduce((sum, row) => sum + Number(row.learners ?? 0), 0)
    const progress = learners
      ? Math.round(list.reduce((sum, row) => sum + Number(row.averageProgress ?? 0) * Number(row.learners ?? 0), 0) / learners)
      : null
    const checkIns = list.reduce((sum, row) => sum + Number(row.atRisk ?? 0) + Number(row.dormant ?? 0), 0)
    return [
      program.programCode, program.programName, (program.certifications ?? []).map((c) => c.title).join(" / "),
      list.length, learners, progress, checkIns, program.createdAt ?? "",
    ]
  }

  return [
    {
      title: "Department totals (all time)",
      columns: ["Metric", "Value"],
      rows: [
        ["Figures as of", overview.generatedAt],
        ["Former learners", (overview.formerLearners ?? []).length],
        ["Learners", totals.learners],
        ["Active learners", totals.activeLearners],
        ["Earned the review badge", totals.completed],
        ["On track", totals.onTrack],
        ["At risk", totals.atRisk],
        ["Gone quiet (14+ days)", totals.dormant],
        ["Not started", totals.notStarted],
        ["Not in a section", totals.unsectioned],
        ["Passed a mock exam", totals.mockExamPassed],
        ["Average completion (%)", pct(summary.averageProgress)],
        ["Graded pass rate (%)", summary.passRate],
        ["Average score (%)", summary.averageScore],
        ["Graded attempts", summary.gradedAttempts],
        ["Lessons finished", summary.lessonsCompleted],
        ["Programs", totals.programs],
        ["Sections", totals.sections],
        ["Department heads", totals.departmentHeads],
        ["Pending learner invitations", totals.pendingInvitations],
        ["Seats used", totals.seatsUsed],
        ["Seats total", totals.seatsTotal],
      ],
    },
    {
      title: "Certifications and seats",
      columns: ["Certification", "Seats used", "Seats total", "Status", "Access from", "Access until", "Days left"],
      rows: overview.certifications.map((c) => [
        c.title, c.usedSlots, c.totalSlots, c.status, c.accessStartDate, c.accessExpiryDate, c.daysRemaining,
      ]),
    },
    {
      title: "Needs your attention",
      columns: ["Severity", "Category", "Title", "Detail", "As of"],
      rows: overview.alerts.map((a) => [a.severity, a.category, a.title, a.message, overview.generatedAt]),
    },
    { title: "Learners", columns: LEARNER_COLUMNS, rows: overview.learners.map(learnerRow) },
    {
      title: "Former learners (removed from the department; figures as they stood when they left)",
      columns: FORMER_LEARNER_COLUMNS,
      rows: (overview.formerLearners ?? []).map(formerLearnerRow),
    },
    { title: "Programs", columns: PROGRAM_COLUMNS, rows: (Array.isArray(programs) ? programs : []).map(programRow) },
    { title: "Sections", columns: SECTION_COLUMNS, rows: overview.sections.map((row) => sectionRow({}, row)) },
    {
      title: "Announcements",
      columns: ANNOUNCEMENT_COLUMNS,
      rows: (Array.isArray(announcements) ? announcements : []).map(announcementRow),
    },
    ...(metrics ? metrics.blocks() : []),
  ]
}

export default function DepartmentHeadOverviewPage() {
  const { departmentsQuery, departments, departmentId, selectDepartment } = useMyDepartments()
  const overviewQuery = useDepartmentOverview(departmentId)
  const overview = overviewQuery.data
  const { hash } = useLocation()
  const metricsExport = useRef(null)
  const layout = useDashboardLayout("department-head")
  const ready = Boolean(overview)
  // /institution/metrics lands here with #metrics; scroll to it once it has rendered.
  useEffect(() => {
    if (!ready || !hash) return
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [ready, hash])

  if (departmentsQuery.isLoading) return <InstitutionLoadingSkeleton />
  if (departmentsQuery.isError) {
    return <InstitutionErrorState title="Unable to load your department" onRetry={departmentsQuery.refetch} />
  }
  if (departments.length === 0) {
    return (
      <InstitutionEmptyState
        title="No active department yet"
        description="You are not heading an active department. Ask your institution administrator to assign you to one."
      />
    )
  }
  if (overviewQuery.isLoading || !overview) return <InstitutionLoadingSkeleton />
  if (overviewQuery.isError) {
    return <InstitutionErrorState title="Unable to load the department dashboard" onRetry={overviewQuery.refetch} />
  }

  const { totals, summary, certifications = [], alerts = [], sections = [], announcements = [] } = overview
  const seatPercent = totals.seatsTotal > 0 ? Math.min(100, Math.round((totals.seatsUsed / totals.seatsTotal) * 100)) : 0
  const progress = summary.averageProgress == null ? null : Math.round(Number(summary.averageProgress))
  const needsHelp = totals.atRisk + totals.dormant + totals.notStarted
  const watchlist = overview.learners.filter((learner) => WATCH_STATUSES.has(learner.status))
  const nextExpiry = certifications
    .filter((cert) => cert.accessExpiryDate)
    .sort((a, b) => String(a.accessExpiryDate).localeCompare(String(b.accessExpiryDate)))[0]

  const tiles = [
    { id: "dh-kpis", col: 6, row: 2, element: (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Learners"
          icon={UsersRound}
          iconClass="text-primary"
          value={totals.learners}
          suffix={`${totals.activeLearners} active`}
        >
          {totals.seatsTotal > 0 ? (
            <div className="space-y-1 pt-1">
              <Progress value={seatPercent} className="h-1.5" aria-label="Seats used" />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  {totals.seatsUsed} of {totals.seatsTotal} seats used
                </span>
                <span>{Math.max(0, totals.seatsTotal - totals.seatsUsed)} free</span>
              </div>
            </div>
          ) : (
            <p className="pt-1 text-xs text-muted-foreground">No seat allocation yet</p>
          )}
        </KpiCard>

        <KpiCard
          label="Average completion"
          icon={TargetIcon}
          iconClass="text-emerald-600 dark:text-emerald-400"
          value={progress == null ? "—" : `${progress}%`}
        >
          <p className="pt-1 text-xs text-muted-foreground">
            {summary.lessonsCompleted} lesson{summary.lessonsCompleted === 1 ? "" : "s"} finished ·{" "}
            {totals.completed} earned the badge
          </p>
        </KpiCard>

        <KpiCard
          label="Graded pass rate"
          icon={Award}
          iconClass="text-primary"
          value={percent(summary.passRate)}
          suffix={summary.averageScore == null ? null : `avg score ${summary.averageScore}%`}
        >
          <p className="pt-1 text-xs text-muted-foreground">
            {summary.gradedAttempts} graded attempt{summary.gradedAttempts === 1 ? "" : "s"} ·{" "}
            {totals.mockExamPassed} passed a mock exam
          </p>
        </KpiCard>

        <KpiCard
          label="Need a check-in"
          icon={ShieldAlert}
          iconClass={needsHelp > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}
          value={needsHelp}
          suffix={`of ${totals.learners}`}
        >
          <p className="pt-1 text-xs text-muted-foreground">
            {totals.atRisk} at risk · {totals.dormant} quiet · {totals.notStarted} not started
          </p>
        </KpiCard>
      </div>
    ) },
    { id: "dh-alerts", col: 6, row: 2, element: (
      <section className="space-y-3" aria-labelledby="dept-alerts-heading">
        <div className="flex items-center gap-2">
          <h2 id="dept-alerts-heading" className="text-base font-bold text-foreground sm:text-lg">
            Needs your attention
          </h2>
          <Badge variant="secondary" className="px-2 py-0.5 text-xs font-bold">
            {alerts.length}
          </Badge>
        </div>

        {alerts.length === 0 ? (
          <QuietState title="Nothing needs your attention right now">
            Seats, access and learner activity are all within normal range.
          </QuietState>
        ) : (
          <div className="grid gap-3">
            {alerts.map((alert) => {
              const tone = SEVERITY[alert.severity] ?? SEVERITY.info
              const Icon = tone.icon
              const href = alertHref(alert)
              const Card = href ? Link : "div"
              return (
                <Card
                  key={alert.id}
                  {...(href ? { to: href } : {})}
                  className={cn(
                    "flex flex-col justify-between gap-3 rounded-2xl border p-4 shadow-xs sm:flex-row sm:items-center sm:p-5",
                    href && "transition-colors hover:border-primary/40 hover:shadow-sm",
                    tone.card
                  )}
                >
                  <div className="flex min-w-0 items-start gap-3.5">
                    <div className={cn("mt-0.5 shrink-0 rounded-xl p-2.5", tone.iconWrap)}>
                      <Icon className="size-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <Badge variant="outline" className={cn("px-1.5 py-0 text-[10px] font-bold", tone.badge)}>
                        {tone.label}
                      </Badge>
                      <h3 className="text-sm font-bold text-foreground">{alert.title}</h3>
                      <p className="text-xs text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                  {href ? <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /> : null}
                </Card>
              )
            })}
          </div>
        )}
      </section>
    ) },
    { id: "dh-watchlist", col: 3, row: 4, element: (
        <Panel
          icon={ShieldAlert}
          iconClass="text-rose-600 dark:text-rose-400"
          title="Learners to check in with"
        >
          {watchlist.length === 0 ? (
            <QuietState title="Every learner is on track">No one is at risk, quiet or yet to start.</QuietState>
          ) : (
            <ul className="space-y-2">
              {watchlist.slice(0, 6).map((learner) => {
                const status = LEARNER_STATUS[learner.status]
                return (
                  <li key={learner.learnerId}>
                    <Link
                      to={`/institution/departments/${departmentId}/learners/${learner.learnerId}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 text-xs transition-colors hover:border-primary/40 hover:bg-muted/40"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-semibold text-foreground">{learner.name}</span>
                          <Badge variant="outline" className={cn("px-1.5 py-0 text-[10px]", status.className)}>
                            {status.label}
                          </Badge>
                        </div>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {learner.reason}
                          {learner.sectionName ? ` · ${learner.sectionName}` : " · No section"}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="font-bold tabular-nums text-foreground">{percent(learner.averageProgress)}</span>
                        <span className="block text-[10px] text-muted-foreground">
                          {relativeDays(learner.daysInactive)}
                        </span>
                      </div>
                    </Link>
                  </li>
                )
              })}
              {watchlist.length > 6 ? (
                <li className="pt-1 text-center text-[11px] text-muted-foreground">
                  +{watchlist.length - 6} more
                </li>
              ) : null}
            </ul>
          )}
        </Panel>
    ) },
    { id: "dh-sections", col: 3, row: 4, element: (
        <Panel
          icon={Layers}
          iconClass="text-primary"
          title="Sections"
        >
          {sections.length === 0 ? (
            <QuietState icon={Layers} title="No sections yet">
              Create sections under a program to group learners into classes.
            </QuietState>
          ) : (
            <ul className="space-y-2.5">
              {sections.map((section) => {
                const sectionProgress =
                  section.averageProgress == null ? 0 : Math.round(Number(section.averageProgress))
                const flagged = section.atRisk + section.dormant
                const sectionHref =
                  section.programId != null
                    ? `/institution/departments/${departmentId}?programId=${section.programId}&tab=learners&section=${section.sectionId}`
                    : null
                const Row = sectionHref ? Link : "div"
                return (
                  <li key={section.sectionId}>
                  <Row
                    {...(sectionHref ? { to: sectionHref } : {})}
                    className={cn(
                      "block space-y-1.5 rounded-xl border border-border/60 bg-muted/20 p-3",
                      sectionHref && "transition-colors hover:border-primary/40 hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{section.sectionName}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {[section.programName, section.certificationTitle].filter(Boolean).join(" · ") || "No program"}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="font-bold tabular-nums text-foreground">
                          {section.learners === 0 ? "—" : `${sectionProgress}%`}
                        </span>
                        <span className="block text-[10px] text-muted-foreground">
                          {section.learners} learner{section.learners === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                    <Progress value={sectionProgress} className="h-1.5" aria-label={`${section.sectionName} completion`} />
                    {flagged > 0 || section.pendingInvitations > 0 ? (
                      <p className="text-[11px] text-muted-foreground">
                        {flagged > 0 ? (
                          <span className="font-semibold text-rose-600 dark:text-rose-400">
                            {flagged} need{flagged === 1 ? "s" : ""} a check-in
                          </span>
                        ) : null}
                        {flagged > 0 && section.pendingInvitations > 0 ? " · " : null}
                        {section.pendingInvitations > 0
                          ? `${section.pendingInvitations} invitation${section.pendingInvitations === 1 ? "" : "s"} pending`
                          : null}
                      </p>
                    ) : null}
                  </Row>
                  </li>
                )
              })}
              {totals.unsectioned > 0 ? (
                <li className="pt-1 text-[11px] text-muted-foreground">
                  {totals.unsectioned} learner{totals.unsectioned === 1 ? " is" : "s are"} not in any section.
                </li>
              ) : null}
            </ul>
          )}
        </Panel>
    ) },
    { id: "dh-metrics", col: 6, row: 8, element: (
      <section id="metrics" aria-labelledby="dept-metrics-heading" className="scroll-mt-24 space-y-4 border-t border-border/60 pt-6">
        <div>
          <h2 id="dept-metrics-heading" className="text-base font-bold text-foreground sm:text-lg">Metrics</h2>
          <p className="text-xs text-muted-foreground">
            Trends, period comparison, programmes, readiness and the hardest topics and assessments. Pick a date range to
            narrow every chart below.
          </p>
        </div>
        <DepartmentHeadMetrics embedded exportRef={metricsExport} />
      </section>
    ) },
    { id: "dh-announcements", col: 6, row: 3, element: (
      <Panel
        icon={MegaphoneIcon}
        iconClass="text-primary"
        title="Latest announcements"
        action={
          <PanelLink to="/institution/departments?view=announcements">
            {overview.announcementCount > announcements.length
              ? `All ${overview.announcementCount}`
              : "Post or manage"}
          </PanelLink>
        }
      >
        {announcements.length === 0 ? (
          <QuietState icon={MegaphoneIcon} title="No announcements posted">
            Announcements reach every learner in the department.
          </QuietState>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {announcements.map((item) => (
              <article
                key={item.departmentAnnouncementId}
                className="space-y-1 rounded-xl border border-border/60 bg-muted/20 p-3.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate font-bold text-foreground">{item.title}</h3>
                  {item.pinned ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                      <PinIcon className="size-2.5" aria-hidden="true" />
                      Pinned
                    </span>
                  ) : null}
                </div>
                <p className="line-clamp-3 text-[11px] text-muted-foreground">{item.body}</p>
                <p className="pt-1 text-[10px] text-muted-foreground/80">
                  {[item.createdByEmail, formatDate(item.createdAt)].filter(Boolean).join(" · ")}
                </p>
              </article>
            ))}
          </div>
        )}
      </Panel>
    ) },
  ]

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Department */}
      <header className="flex flex-col justify-between gap-4 rounded-3xl border border-border/70 bg-card p-6 shadow-xs sm:p-8 lg:flex-row lg:items-center">
        <div className="min-w-0 space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{overview.departmentName}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {certifications.map((cert) => (
              <span
                key={cert.institutionCertId}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
              >
                <Award className="size-3.5" aria-hidden="true" />
                {cert.title}
              </span>
            ))}
            {nextExpiry ? (
              <span className="text-xs text-muted-foreground">
                Access until {formatDate(nextExpiry.accessExpiryDate)}
              </span>
            ) : null}
          </div>
          {overview.departmentDescription ? (
            <p className="max-w-2xl text-sm text-muted-foreground">{overview.departmentDescription}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <DashboardRearrangeControls
          rearranging={layout.rearranging}
          onStart={layout.startRearranging}
          onFinish={layout.finishRearranging}
          onCancel={layout.cancelRearranging}
          onReset={layout.resetLayout}
        />
        <ExportButton
          filename="rebyu-department-dashboard"
          report="Department dashboard"
          details={() => [
            ["Department", overview.departmentName],
            ["Metrics period", metricsExport.current?.period ?? "All time"],
          ]}
          sections={() => dashboardCsv(overview, metricsExport.current)}
        />
        {departments.length > 1 ? (
          <Select value={String(departmentId)} onValueChange={(value) => selectDepartment(Number(value))}>
            <SelectTrigger className="w-full bg-background sm:w-[240px]" aria-label="Department">
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
        </div>
      </header>

      <DashboardBoard
        tiles={tiles}
        layout={layout.tileLayout}
        editing={layout.rearranging}
        onLayoutChange={layout.handleLayoutChange}
      />
    </div>
  )
}
