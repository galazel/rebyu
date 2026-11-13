import { Table } from "@/components/ui/table"
import { useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  AwardIcon,
  BookOpen,
  CircleAlertIcon,
  CircleCheckIcon,
  ClipboardListIcon,
  GaugeIcon,
  HistoryIcon,
  MinusCircleIcon,
  TargetIcon,
  SparklesIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "@/components/icons"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ChartEmpty } from "@/components/charts/rebyu-charts.jsx"
import {
  InstitutionEmptyState,
  InstitutionErrorState,
  InstitutionLoadingSkeleton,
} from "@/components/institution/institution-ui.jsx"
import {
  getGroupLearnerAnalytics,
  getGroupLearnerIntegrity,
  getGroupLearnerAwards,
  getGroupLearnerRoster,
  getDepartmentById,
} from "@/services/institutionService.js"
import { certificationBadgeUrl } from "@/services/certificationService.js"
import { useAvatarUrl } from "@/hooks/use-avatar-url.js"
import MemberAttemptReviewSheet from "@/components/institution/member-attempt-review-sheet.jsx"
import { ExportButton } from "@/components/commons/export-button.jsx"
import { learnerReportBlocks } from "@/lib/learner-export.js"
import { LEARNER_STATUS, relativeDays, useDepartmentOverview } from "@/hooks/use-my-department.js"
import { AssessmentIntegritySection, INTEGRITY_RISK } from "@/components/institution/assessment-integrity-section.jsx"
import { ShieldAlert } from "@/components/icons"

function toPercent(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function formatPercent(value) {
  const percent = toPercent(value)
  return percent == null ? "—" : `${Math.round(percent)}%`
}

function TopicList({ title, description, icon: Icon, topics }) {
  return (
    <Card className="gap-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="size-4 text-destructive" aria-hidden="true" />
          {title}
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {topics.length === 0 ? (
          <p className="text-xs text-muted-foreground">Not enough marked answers yet to rank topics.</p>
        ) : (
          <ul className="grid gap-x-8 gap-y-3 md:grid-cols-2">
            {topics.slice(0, 8).map((topic, index) => {
              const value = Math.min(100, Math.max(0, toPercent(topic.masteryPercentage) ?? 0))
              return (
                <li key={topic.lessonId ?? index}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 text-xs font-medium leading-snug text-foreground">
                      {topic.lessonTitle ?? `Topic ${index + 1}`}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-xs font-bold tabular-nums",
                        value < 50 ? "text-destructive" : "text-foreground"
                      )}
                    >
                      {formatPercent(topic.masteryPercentage)}
                    </span>
                  </div>
                  <Progress value={value} className="mt-1 h-1.5" />
                  {topic.categoryTitle ? (
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{topic.categoryTitle}</p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}


function initialsOf(name) {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "—"
  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("")
}

function ProfileStat({ icon: Icon, label, value, hint, progress = null, alert = false }) {
  return (
    <div className="space-y-1.5 px-3.5 py-3">
      <div className="flex items-center gap-3">
        <Icon className={cn("size-4 shrink-0", alert ? "text-destructive" : "text-muted-foreground")} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <dt className="truncate text-xs font-medium text-foreground">{label}</dt>
          {hint ? <dd className="truncate text-[11px] text-muted-foreground">{hint}</dd> : null}
        </div>
        <dd className={cn("shrink-0 font-heading text-lg font-bold tabular-nums", alert ? "text-destructive" : "text-foreground")}>
          {value}
        </dd>
      </div>
      {progress != null ? <Progress value={Math.min(100, Math.max(0, progress))} className="h-1" /> : null}
    </div>
  )
}

const ACTIVITY_WEEKS = 53

const ACTIVITY_STEPS = [
  "var(--color-muted, #ebedf0)",
  "color-mix(in srgb, var(--color-rb-leaf) 28%, transparent)",
  "color-mix(in srgb, var(--color-rb-leaf) 52%, transparent)",
  "color-mix(in srgb, var(--color-rb-leaf) 76%, transparent)",
  "var(--color-rb-leaf)",
]

function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`
}

function activityStep(count) {
  if (!count) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  if (count <= 4) return 3
  return 4
}

function ActivityGrid({ attempts }) {
  const { weeks, monthLabels, total, activeDays } = useMemo(() => {
    const counts = new Map()
    for (const attempt of attempts) {
      if (!attempt.submittedAt) continue
      const key = dayKey(new Date(attempt.submittedAt))
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    const end = new Date()
    end.setHours(0, 0, 0, 0)
    end.setDate(end.getDate() + (6 - end.getDay()))
    const start = new Date(end)
    start.setDate(start.getDate() - (ACTIVITY_WEEKS * 7 - 1))

    const builtWeeks = []
    const labels = []
    let seenTotal = 0
    let seenDays = 0
    const cursor = new Date(start)
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    for (let week = 0; week < ACTIVITY_WEEKS; week += 1) {
      const days = []
      for (let day = 0; day < 7; day += 1) {
        const date = new Date(cursor)
        const key = dayKey(date)
        const count = counts.get(key) ?? 0
        const future = date > today
        if (!future && count > 0) {
          seenTotal += count
          seenDays += 1
        }
        days.push({ key, date, count, future })
        cursor.setDate(cursor.getDate() + 1)
      }
      const first = days[0].date
      if (first.getDate() <= 7) {
        const name = first.toLocaleDateString(undefined, { month: "short" })
        if (labels[labels.length - 1]?.name !== name) labels.push({ week, name })
      }
      builtWeeks.push(days)
    }

    return { weeks: builtWeeks, monthLabels: labels, total: seenTotal, activeDays: seenDays }
  }, [attempts])

  return (
    <div>
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-8 bg-gradient-to-l from-card to-transparent sm:hidden"
          aria-hidden="true"
        />
        <div className="overflow-x-auto pb-1 scrollbar-none">
          <div className="min-w-max">
            <div className="flex gap-[3px] pl-8 text-[10px] text-muted-foreground">
              {weeks.map((_, week) => {
                const label = monthLabels.find((entry) => entry.week === week)
                return (
                  <span key={week} className="w-[11px] shrink-0">
                    {label ? label.name : ""}
                  </span>
                )
              })}
            </div>

            <div className="mt-1 flex gap-[3px]">
              <div className="flex w-8 shrink-0 flex-col gap-[3px] pr-1 text-[10px] leading-[11px] text-muted-foreground">
                {["", "Mon", "", "Wed", "", "Fri", ""].map((label, index) => (
                  <span key={index} className="h-[11px]">
                    {label}
                  </span>
                ))}
              </div>

              {weeks.map((days, week) => (
                <div key={week} className="flex flex-col gap-[3px]">
                  {days.map((day) => (
                    <span
                      key={day.key}
                      title={
                        day.future
                          ? undefined
                          : `${day.count} attempt${day.count === 1 ? "" : "s"} on ${day.date.toLocaleDateString()}`
                      }
                      className="size-[11px] rounded-[2px] ring-1 ring-inset ring-border/40"
                      style={{
                        background: day.future ? "transparent" : ACTIVITY_STEPS[activityStep(day.count)],
                        visibility: day.future ? "hidden" : undefined,
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {total} attempt{total === 1 ? "" : "s"} on {activeDays} day
          {activeDays === 1 ? "" : "s"} in the last year
        </span>
        <span className="flex items-center gap-1.5">
          Less
          {ACTIVITY_STEPS.map((step, index) => (
            <span
              key={index}
              className="size-[11px] rounded-[2px] ring-1 ring-inset ring-border/40"
              style={{ background: step }}
            />
          ))}
          More
        </span>
      </div>
    </div>
  )
}

function formatAssessmentType(type) {
  if (!type) return null
  const words = String(type).replaceAll("_", " ").toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function AttemptOutcome({ passed }) {
  if (passed == null) return null
  const Icon = passed ? CircleCheckIcon : CircleAlertIcon
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        passed ? "text-rb-leaf" : "text-destructive"
      }`}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {passed ? "Passed" : "Not passed"}
    </span>
  )
}

function AttemptMovement({ attempts }) {
  if (attempts.length < 2) return null
  const delta = Math.round(attempts[attempts.length - 1].score - attempts[0].score)
  const Icon = delta > 0 ? TrendingUpIcon : delta < 0 ? TrendingDownIcon : MinusCircleIcon
  const tone = delta > 0 ? "text-rb-leaf" : delta < 0 ? "text-destructive" : "text-muted-foreground"
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${tone}`}>
      <Icon className="size-3.5" aria-hidden="true" />
      {delta > 0 ? `+${delta}` : delta}
      <span className="font-normal text-muted-foreground">since first try</span>
    </span>
  )
}

/** A strip of small bars, one per attempt, oldest first. Click one to open its answers. */
function flagSummary(flag) {
  if (!flag) return ""
  const parts = []
  if (flag.forfeited) parts.push("ended with 0")
  if (flag.exits) parts.push(`${flag.exits} exit${flag.exits === 1 ? "" : "s"}`)
  if (flag.copyPasteTries) parts.push(`${flag.copyPasteTries} copy/paste`)
  if (flag.otherBlocked) parts.push(`${flag.otherBlocked} other blocked`)
  return parts.length ? ` — integrity flags: ${parts.join(", ")}` : ""
}

function AttemptStrip({ attempts, onOpen, flags }) {
  return (
    <div className="flex h-8 items-end gap-1">
      {attempts.map((attempt) => {
        const value = Math.min(100, Math.max(0, Number(attempt.score) || 0))
        const flag = flags?.get(attempt.attemptId)
        return (
          <button
            type="button"
            key={attempt.attemptId ?? attempt.attemptNumber}
            disabled={!attempt.attemptId || !onOpen}
            onClick={() => onOpen?.(attempt.attemptId)}
            className={cn(
              "relative flex h-full w-3 items-end rounded-sm bg-muted/60 transition enabled:hover:ring-2 enabled:hover:ring-primary/40",
              flag && "ring-2 ring-red-500/80 enabled:hover:ring-red-500"
            )}
            title={`Attempt ${attempt.attemptNumber ?? "?"}: ${Math.round(value)}%${
              attempt.correctCount != null && attempt.itemCount != null ? ` (${attempt.correctCount}/${attempt.itemCount})` : ""
            }${attempt.takenOn ? ` on ${attempt.takenOn}` : ""}${flagSummary(flag)} — open its answers`}
          >
            {flag ? (
              <span className="absolute -top-1.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-red-500" aria-hidden="true" />
            ) : null}
            <span
              className={cn("w-full rounded-sm", attempt.passed ? "rb-highlight-pass" : "rb-highlight-fail")}
              style={{ height: `max(3px, ${value}%)` }}
            />
          </button>
        )
      })}
    </div>
  )
}

const RESULT_FILTERS = [
  { id: "all", label: "All" },
  { id: "failing", label: "Not passed yet" },
  { id: "retaken", label: "Retaken" },
  { id: "exams", label: "Exams only" },
  { id: "flagged", label: "Flagged" },
]

function AssessmentResultsSection({ groups, onOpen, flags }) {
  const [filter, setFilter] = useState("all")
  const [showAll, setShowAll] = useState(false)

  const rows = groups.map((group) => {
    const scores = group.attempts.map((attempt) => attempt.score)
    return {
      ...group,
      first: scores[0],
      best: Math.max(...scores),
      latest: scores[scores.length - 1],
      passed: group.attempts.some((attempt) => attempt.passed),
      flaggedAttempts: group.attempts.filter((attempt) => flags?.has(attempt.attemptId)).length,
    }
  })
  const counts = {
    all: rows.length,
    failing: rows.filter((r) => !r.passed).length,
    retaken: rows.filter((r) => r.attempts.length > 1).length,
    exams: rows.filter((r) => r.assessmentType !== "LESSON_QUIZ").length,
    flagged: rows.filter((r) => r.flaggedAttempts > 0).length,
  }
  const visible = rows.filter((r) =>
    filter === "failing" ? !r.passed : filter === "retaken" ? r.attempts.length > 1 : filter === "exams" ? r.assessmentType !== "LESSON_QUIZ" : filter === "flagged" ? r.flaggedAttempts > 0 : true
  )
  const shown = showAll ? visible : visible.slice(0, 12)
  const totalAttempts = groups.reduce((sum, group) => sum + group.attempts.length, 0)

  return (
    <Card className="gap-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <HistoryIcon className="size-4 text-primary" aria-hidden="true" />
          Assessment results
        </CardTitle>
        <CardDescription className="text-xs">
          {groups.length} assessment{groups.length === 1 ? "" : "s"} · {totalAttempts} graded attempt
          {totalAttempts === 1 ? "" : "s"} · one row per assessment. Click a bar to see that attempt's answers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {groups.length === 0 ? (
          <ChartEmpty message="No assessment has been graded yet." />
        ) : (
          <>
            <div className="flex flex-wrap gap-1">
              {RESULT_FILTERS.filter((item) => item.id !== "flagged" || counts.flagged > 0).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={filter === item.id}
                  onClick={() => {
                    setFilter(item.id)
                    setShowAll(false)
                  }}
                  className={cn(
                    "h-7 rounded-lg px-2.5 text-xs font-semibold transition-colors",
                    filter === item.id
                      ? item.id === "flagged" ? "bg-red-600 text-white" : "bg-foreground text-background"
                      : item.id === "flagged"
                        ? "border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300"
                        : "border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {item.label} ({counts[item.id]})
                </button>
              ))}
            </div>
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <Table className="w-full text-xs">
                <thead className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Assessment</th>
                    <th className="px-2 py-2 text-right">Tries</th>
                    <th className="px-2 py-2 text-right">First</th>
                    <th className="px-2 py-2 text-right">Best</th>
                    <th className="px-2 py-2 text-right">Latest</th>
                    <th className="px-2 py-2 text-left">Attempts</th>
                    <th className="px-3 py-2 text-left">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {shown.map((row) => (
                    <tr key={row.examId ?? row.title} className="hover:bg-muted/20">
                      <td className="max-w-[18rem] px-3 py-2">
                        <p className="truncate font-semibold text-foreground" title={row.title}>{row.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatAssessmentType(row.assessmentType)}
                          {row.lastSubmittedAt ? ` · last ${row.lastSubmittedAt.toLocaleDateString()}` : ""}
                        </p>
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">{row.attempts.length}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-muted-foreground">{Math.round(row.first)}%</td>
                      <td className="px-2 py-2 text-right font-semibold tabular-nums">{Math.round(row.best)}%</td>
                      <td className="px-2 py-2 text-right tabular-nums">{Math.round(row.latest)}%</td>
                      <td className="px-2 py-2">
                        <AttemptStrip attempts={row.attempts} onOpen={onOpen} flags={flags} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-0.5">
                          <AttemptOutcome passed={row.passed} />
                          <AttemptMovement attempts={row.attempts} />
                          {row.flaggedAttempts > 0 ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-red-600 dark:text-red-400">
                              <ShieldAlert className="size-3" aria-hidden="true" />
                              {row.flaggedAttempts} flagged attempt{row.flaggedAttempts === 1 ? "" : "s"}
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            {visible.length > 12 ? (
              <Button variant="ghost" size="sm" className="h-8 w-full text-xs" onClick={() => setShowAll((v) => !v)}>
                {showAll ? "Show fewer" : `Show all ${visible.length}`}
              </Button>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function CredentialMark({ award }) {
  const earnedAt = award.badgeAwardedAt ?? award.certificateAwardedAt
  const score = Number(award.scorePercentage)
  return (
    <li className="flex min-w-0 items-center gap-2.5 rounded-md border border-border/60 bg-card px-3 py-2">
      <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-rb-bee/60 bg-rb-bee-wash">
        {award.hasBadgeImage ? (
          <img
            src={`${certificationBadgeUrl(award.certificationId)}?v=${encodeURIComponent(earnedAt ?? "")}`}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <AwardIcon className="size-4 text-rb-bee" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">
          {award.certificationTitle ?? "Certification"}
        </p>
        <p className="text-[11px] leading-tight text-muted-foreground">
          {earnedAt ? new Date(earnedAt).toLocaleDateString() : "Awarded"}
          {Number.isFinite(score) ? ` · ${Math.round(score)}%` : ""}
        </p>
      </div>
    </li>
  )
}

function CredentialsCard({ query }) {
  const awards = (Array.isArray(query.data) ? query.data : []).filter(
    (award) => award.badgeAwardedAt != null || award.certificateAwardedAt != null
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <AwardIcon className="size-4 text-rb-bee" aria-hidden="true" />
          Badges earned
        </CardTitle>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : query.isError ? (
          <p className="text-xs text-muted-foreground">
            Unable to load.{" "}
            <button
              type="button"
              onClick={query.refetch}
              className="underline underline-offset-2 hover:text-foreground"
            >
              Retry
            </button>
          </p>
        ) : awards.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No badge yet. A badge is earned by finishing the review — it is not the official certification.
          </p>
        ) : (
          <ul className="grid gap-2">
            {awards.map((award) => (
              <CredentialMark key={award.certificationId} award={award} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

/** One tab per certification the learner studies here; the chosen one shows its lesson progress. */
function CertificationTabs({ enrolments, fallbackTitle, activeCertificationId, onSelect }) {
  const found = enrolments.findIndex((r) => r.certificationId === activeCertificationId)
  const active = found >= 0 ? found : 0
  const setActive = (index) => onSelect(enrolments[index]?.certificationId ?? null)
  const row = enrolments[active]
  const total = Number(row?.totalLessonCount ?? 0)
  const done = Number(row?.completedLessonCount ?? 0)
  const titleOf = (r) => r.certificationTitle ?? fallbackTitle ?? "Certification"
  return (
    <div className="space-y-2">
      {enrolments.length > 1 ? (
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Certifications">
          {enrolments.map((r, index) => (
            <button
              key={r.departmentLearnerId ?? r.certificationId}
              type="button"
              role="tab"
              aria-selected={index === active}
              onClick={() => setActive(index)}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors",
                index === active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
              )}
            >
              {titleOf(r)}
            </button>
          ))}
        </div>
      ) : null}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="truncate font-medium text-foreground">{titleOf(row)}</span>
          <span className="shrink-0 tabular-nums">{total ? `${done}/${total} lessons` : "No lessons yet"}</span>
        </div>
        <Progress value={total ? (done / total) * 100 : 0} className="h-1" />
      </div>
    </div>
  )
}

export default function InstitutionDepartmentLearnerPage() {
  const { departmentId, learnerId } = useParams()
  const departmentIdNumber = Number(departmentId)
  const learnerIdNumber = Number(learnerId)
  const [reviewAttemptId, setReviewAttemptId] = useState(null)

  const rosterQuery = useQuery({
    queryKey: ["department-learner-roster", departmentIdNumber],
    queryFn: () => getGroupLearnerRoster(departmentIdNumber),
    enabled: Number.isFinite(departmentIdNumber),
  })
  // Status and the reason for it, exactly as the dashboard and roster show them.
  const overviewQuery = useDepartmentOverview(Number.isFinite(departmentIdNumber) ? departmentIdNumber : null)

  const [activeCertificationId, setActiveCertificationId] = useState(null)
  // The department's certifications name the learner's enrolments (the roster has ids only).
  const departmentQuery = useQuery({
    queryKey: ["department", departmentIdNumber],
    queryFn: () => getDepartmentById(departmentIdNumber),
    enabled: Number.isFinite(departmentIdNumber),
    staleTime: 5 * 60_000,
  })
  const analyticsQuery = useQuery({
    queryKey: ["group-learner-analytics", departmentIdNumber, learnerIdNumber, activeCertificationId],
    // The chosen certification tab decides which certification's results and stats load.
    queryFn: () => getGroupLearnerAnalytics(departmentIdNumber, learnerIdNumber, activeCertificationId),
    placeholderData: (previous) => previous,
    enabled: Number.isFinite(departmentIdNumber) && Number.isFinite(learnerIdNumber),
    retry: 1,
  })


  const integrityQuery = useQuery({
    queryKey: ["group-learner-integrity", departmentIdNumber, learnerIdNumber],
    queryFn: () => getGroupLearnerIntegrity(departmentIdNumber, learnerIdNumber),
    enabled: Number.isFinite(departmentIdNumber) && Number.isFinite(learnerIdNumber),
    retry: 1,
  })

  const awardsQuery = useQuery({
    queryKey: ["group-learner-awards", learnerIdNumber],
    queryFn: () => getGroupLearnerAwards(learnerIdNumber),
    enabled: Number.isFinite(learnerIdNumber),
    staleTime: 60_000,
    retry: 1,
  })

  // One roster row per certification the learner studies in this department.
  const certificationTitles = new Map(
    (departmentQuery.data?.certifications ?? []).map((cert) => [cert.certificationId, cert.title])
  )
  const enrolments = (Array.isArray(rosterQuery.data) ? rosterQuery.data : [])
    .filter((row) => row.learnerId === learnerIdNumber && row.status !== "removed")
    .map((row) => ({ ...row, certificationTitle: row.certificationTitle ?? certificationTitles.get(row.certificationId) }))
  const learner = enrolments[0]
  const status = (overviewQuery.data?.learners ?? []).find((row) => row.learnerId === learnerIdNumber)
  const initials = initialsOf(learner?.name)
  const avatarUrl = useAvatarUrl(learner?.avatarKey ?? null)
  const analytics = analyticsQuery.data

  const gradedAttempts = useMemo(
    () => (analytics?.scoreTrend ?? []).filter((point) => point.percentage != null),
    [analytics?.scoreTrend]
  )

  const assessmentGroups = useMemo(() => {
    const byExam = new Map()
    for (const point of gradedAttempts) {
      const title = point.assessmentTitle ?? "Assessment"
      const key = point.examId ?? `title:${title}`
      if (!byExam.has(key)) {
        byExam.set(key, {
          examId: point.examId ?? key,
          title,
          assessmentType: point.assessmentType,
          attempts: [],
          lastSubmittedAt: null,
        })
      }
      const group = byExam.get(key)
      const submittedAt = point.submittedAt ? new Date(point.submittedAt) : null
      group.attempts.push({
        attemptId: point.assessmentAttemptId,
        attemptNumber: point.attemptNumber,
        label: point.attemptNumber ? `Try ${point.attemptNumber}` : "Attempt",
        score: Math.round(Number(point.percentage) * 10) / 10,
        passed: point.passed,
        takenOn: submittedAt ? submittedAt.toLocaleDateString() : null,
        submittedAt: point.submittedAt,
        correctCount: point.correctCount,
        itemCount: point.itemCount,
      })
      if (submittedAt && (group.lastSubmittedAt == null || submittedAt > group.lastSubmittedAt)) {
        group.lastSubmittedAt = submittedAt
      }
    }
    return [...byExam.values()]
      .map((group) => ({
        ...group,
        attempts: [...group.attempts].sort((a, b) => (a.attemptNumber ?? 0) - (b.attemptNumber ?? 0)),
      }))
      .sort((a, b) => (b.lastSubmittedAt?.getTime() ?? 0) - (a.lastSubmittedAt?.getTime() ?? 0))
  }, [gradedAttempts])

  if (analyticsQuery.isLoading || rosterQuery.isLoading) {
    return <InstitutionLoadingSkeleton rows={4} />
  }
  if (analyticsQuery.isError) {
    return (
      <InstitutionErrorState
        title="Unable to load this learner's statistics"
        description="They may no longer be assigned to this department."
        onRetry={analyticsQuery.refetch}
      />
    )
  }

  const weakestTopics = analytics?.weakestTopics ?? []
  const completedLessons = analytics?.completedLessonCount ?? 0
  const totalLessons = analytics?.totalLessonCount ?? 0
  const passedAssessments = analytics?.passedAssessmentCount ?? 0
  const totalAssessments = analytics?.totalAssessmentCount ?? 0
  const totalAttempts = analytics?.totalAssessmentAttempts ?? 0
  const lessonShare = totalLessons ? (completedLessons / totalLessons) * 100 : 0
  const statusStyle = status ? LEARNER_STATUS[status.status] : null
  const integrityRisk = INTEGRITY_RISK[integrityQuery.data?.risk]
  const integrityByAttempt = new Map(
    (integrityQuery.data?.attempts ?? []).map((row) => [row.attemptId, row])
  )

  // The export is for the certification on screen: its enrolment row, and its analytics.
  const activeEnrolment =
    enrolments.find((row) => row.certificationId === (activeCertificationId ?? analytics?.certificationId)) ??
    enrolments[0] ??
    learner
  const exportCertification = analytics?.certificationTitle ?? activeEnrolment?.certificationTitle ?? "certification"
  const exportName = `rebyu-${String(learner?.name ?? "learner")}-${exportCertification}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  const csv = () =>
    learnerReportBlocks(analytics, [
      ["Learner", learner?.name],
      ["Username", learner?.username],
      ["Status", statusStyle?.label ?? ""],
      ["Why", status?.reason ?? ""],
      ["Section", activeEnrolment?.sectionName ?? "No section"],
      ["Enrolled in this certification on", activeEnrolment?.assignedAt ?? ""],
      ["Last active", status?.lastActivityAt ?? "Never"],
      ["Passed a mock exam", Boolean(activeEnrolment?.mockExamPassed)],
      ["Best mock exam score (%)", activeEnrolment?.bestMockExamScore == null ? null : Math.round(Number(activeEnrolment.bestMockExamScore))],
      ["Mock exam passed on", activeEnrolment?.mockExamPassedAt ?? ""],
      ["Other certifications here", enrolments.filter((row) => row !== activeEnrolment).map((row) => row.certificationTitle).filter(Boolean).join(", ") || "None"],
    ])

  const averageScore = toPercent(analytics?.averageAssessmentScore)

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
      {/* Profile column (GitHub style) */}
      <aside className="space-y-5 lg:sticky lg:top-20">
        <div className="space-y-3">
          <div className="relative grid aspect-square w-32 place-items-center overflow-hidden rounded-full border-2 border-border bg-muted lg:w-full lg:max-w-[16rem]">
            <span className="font-heading text-4xl font-bold text-muted-foreground lg:text-6xl">{initials}</span>
            {avatarUrl ? <img src={avatarUrl} alt="" className="absolute inset-0 size-full object-cover" /> : null}
          </div>

          <div>
            <h1 className="font-heading text-2xl font-bold leading-tight tracking-tight text-foreground">
              {learner?.name ?? "Learner"}
            </h1>
            {learner?.username ? <p className="text-lg text-muted-foreground">@{learner.username}</p> : null}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {statusStyle ? (
              <Badge variant="outline" className={cn("text-[11px]", statusStyle.className)}>
                {statusStyle.label}
              </Badge>
            ) : null}
            {integrityRisk ? (
              <Badge variant="outline" className={cn("gap-1 text-[11px]", integrityRisk.className)}>
                <ShieldAlert className="size-3" aria-hidden="true" />
                {integrityRisk.label}
              </Badge>
            ) : null}
            {learner?.mockExamPassed ? (
              <Badge className="gap-1 text-[11px]">
                <AwardIcon className="size-3" aria-hidden="true" />
                Mock exam passed
                {Number.isFinite(Number(learner.bestMockExamScore))
                  ? ` · ${Math.round(Number(learner.bestMockExamScore))}%`
                  : ""}
              </Badge>
            ) : null}
          </div>
          {status?.reason && status.status !== "on_track" ? (
            <p className="text-xs font-medium text-rose-700 dark:text-rose-300">{status.reason}</p>
          ) : null}

          <ul className="space-y-1 text-sm text-muted-foreground">
            {enrolments.length ? (
              <li className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-2.5">
                <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider">
                  <AwardIcon className="size-3.5 shrink-0" aria-hidden="true" />
                  Certification{enrolments.length === 1 ? "" : "s"}
                </span>
                <CertificationTabs
                  enrolments={enrolments}
                  fallbackTitle={analytics?.certificationTitle}
                  activeCertificationId={activeCertificationId}
                  onSelect={setActiveCertificationId}
                />
              </li>
            ) : analytics?.certificationTitle ? (
              <li className="flex items-center gap-2">
                <AwardIcon className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{analytics.certificationTitle}</span>
              </li>
            ) : null}
            <li className="flex items-center gap-2">
              <ClipboardListIcon className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{learner?.sectionName ?? "No section"}</span>
            </li>
            {status ? (
              <li className="flex items-center gap-2">
                <HistoryIcon className="size-4 shrink-0" aria-hidden="true" />
                <span>Last active {relativeDays(status.daysInactive).toLowerCase()}</span>
              </li>
            ) : null}
          </ul>

          <div className="grid gap-2">
            <ExportButton
              filename={exportName}
              report={`Learner report · ${exportCertification}`}
              details={[
                ["Learner", learner?.name],
                ["Username", learner?.username],
                ["Certification", exportCertification],
              ]}
              className="h-9"
              label={enrolments.length > 1 ? `Export ${exportCertification}` : "Export"}
              disabled={analyticsQuery.isPlaceholderData || !analytics}
              sections={csv}
            />
          </div>
        </div>

        <dl className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-card">
          <ProfileStat
            icon={BookOpen}
            label="Lessons completed"
            value={`${completedLessons}/${totalLessons}`}
            progress={lessonShare}
            hint={totalLessons ? `${Math.round(lessonShare)}% of the curriculum` : "No lessons yet"}
          />
          <ProfileStat
            icon={ClipboardListIcon}
            label="Assessments passed"
            value={`${passedAssessments}/${totalAssessments}`}
            progress={totalAssessments ? (passedAssessments / totalAssessments) * 100 : 0}
            hint={`${totalAttempts} graded attempt${totalAttempts === 1 ? "" : "s"}`}
          />
          <ProfileStat
            icon={TargetIcon}
            label="Average score"
            value={formatPercent(averageScore)}
            alert={averageScore != null && averageScore < 50}
            hint={totalAttempts ? `Mean of ${totalAttempts} graded` : "No graded attempt yet"}
          />
          <ProfileStat
            icon={GaugeIcon}
            label="Readiness"
            value={formatPercent(analytics?.readinessPercentage)}
            progress={toPercent(analytics?.readinessPercentage) ?? 0}
            hint="Chance of passing the real exam"
          />
        </dl>

        <CredentialsCard query={awardsQuery} />
      </aside>

      {/* Main column */}
      <div className="min-w-0 space-y-6">

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">
            {gradedAttempts.length} graded attempt{gradedAttempts.length === 1 ? "" : "s"} in the last year
          </h2>
          <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5">
            <ActivityGrid attempts={gradedAttempts} />
          </div>
        </section>

        {!analytics?.hasAssessmentActivity && !analytics?.hasChallengeActivity ? (
          <InstitutionEmptyState
            icon={SparklesIcon}
            title="No activity yet"
            description="This learner has not attempted an assessment or challenge yet, so there is nothing to report."
          />
        ) : null}

        <AssessmentResultsSection groups={assessmentGroups} onOpen={setReviewAttemptId} flags={integrityByAttempt} />

        <AssessmentIntegritySection query={integrityQuery} onOpen={setReviewAttemptId} />

        <TopicList
          title="Weakest topics"
          description={
            analytics?.bktAvailable === false
              ? "Least accurate first, from their marked answers."
              : "Lowest mastery first — where to help."
          }
          icon={TrendingDownIcon}
          topics={weakestTopics}
        />
      </div>

      <MemberAttemptReviewSheet
        departmentId={departmentIdNumber}
        learnerId={learnerIdNumber}
        learnerName={learner?.name}
        attemptId={reviewAttemptId}
        integrity={reviewAttemptId != null ? integrityByAttempt.get(reviewAttemptId) : null}
        onOpenChange={(open) => {
          if (!open) setReviewAttemptId(null)
        }}
      />
    </div>
  )
}
