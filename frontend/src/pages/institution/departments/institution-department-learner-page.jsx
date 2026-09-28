import { useMemo } from "react"
import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  ActivityIcon,
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
  TrendingUpIcon
} from "@/components/icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  BarBreakdownChart,
  ChartEmpty,
  ChartPanel,
  TrendLineChart,
} from "@/components/charts/rebyu-charts.jsx"
import {
  InstitutionEmptyState,
  InstitutionErrorState,
  InstitutionLoadingSkeleton,
  InstitutionStatCard,
} from "@/components/institution/institution-ui.jsx"
import {
  getGroupLearnerAnalytics,
  getGroupLearnerAwards,
  getGroupLearnerRoster,
} from "@/services/institutionService.js"
import { certificationBadgeUrl } from "@/services/certificationService.js"

/**
 * Every figure on this page comes from ProgressAnalyticsService, which already
 * returns 0-100 percentages -- so these are used as-is. Nothing is rescaled:
 * treating a small value as a 0-1 fraction would turn a genuine 1% into 100%.
 */
function toPercent(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function formatPercent(value) {
  const percent = toPercent(value)
  return percent == null ? "—" : `${Math.round(percent)}%`
}

function TopicList({ title, description, icon: Icon, topics, tone }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon
            className={`size-4 ${tone === "weak" ? "text-destructive" : "text-primary"}`}
            aria-hidden="true"
          />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {topics.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Not enough assessment activity yet to rank topics.
          </p>
        ) : (
          <ul className="space-y-3">
            {topics.map((topic, index) => (
              <li key={topic.lessonId ?? index}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-sm text-foreground">
                    {topic.lessonTitle ?? `Topic ${index + 1}`}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {formatPercent(topic.masteryPercentage)}
                  </span>
                </div>
                <Progress
                  value={Math.min(100, Math.max(0, toPercent(topic.masteryPercentage) ?? 0))}
                  className="mt-1.5 h-1.5"
                />
                {topic.categoryTitle ? (
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {topic.categoryTitle}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

/** The pass mark every assessment is graded against. */
const PASS_MARK = 75

/** Weeks of history the activity grid covers, matching a year at a glance. */
const ACTIVITY_WEEKS = 53

/**
 * Five steps of one hue, absence through busiest.
 *
 * <p>Mixed against the card rather than hard-coded so the ramp follows the
 * theme: `--color-rb-leaf` is a mid green in light mode and a lighter one in
 * dark, so in both the cell gets further from the surface as the count rises.
 * Step 0 is the neutral track, not the palest green -- "nothing happened" is
 * absence, not a small amount, and GitHub's own grid says it the same way.
 */
const ACTIVITY_STEPS = [
  "var(--color-muted, #ebedf0)",
  "color-mix(in srgb, var(--color-rb-leaf) 28%, transparent)",
  "color-mix(in srgb, var(--color-rb-leaf) 52%, transparent)",
  "color-mix(in srgb, var(--color-rb-leaf) 76%, transparent)",
  "var(--color-rb-leaf)",
]

/** Local-date key; `toISOString` would bucket a late-evening attempt into tomorrow. */
function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`
}

/** 0 for a quiet day, then 1..4 by how busy it was. */
function activityStep(count) {
  if (!count) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  if (count <= 4) return 3
  return 4
}

/**
 * A year of assessment activity as a contribution grid -- a column per week,
 * a row per weekday, the shade carrying how many attempts were submitted.
 *
 * <p>It answers a question no score chart on this page does: not how well the
 * learner did, but whether they are turning up at all, and in what rhythm. A
 * fortnight of blank columns before an exam is the kind of thing a department
 * head wants to catch while it is still fixable.
 *
 * <p>Count, not score, decides the shade: mixing the two would make a single
 * excellent attempt look like a quiet week.
 */
function ActivityGrid({ attempts }) {
  const { weeks, monthLabels, total, activeDays } = useMemo(() => {
    const counts = new Map()
    for (const attempt of attempts) {
      if (!attempt.submittedAt) continue
      const key = dayKey(new Date(attempt.submittedAt))
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    // End on the Saturday of this week so the last column is never a stub,
    // then walk back whole weeks from there.
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
      // One label per month, on the first week that starts inside it. A
      // partial leading month goes unlabelled on purpose: labelling week 0
      // regardless printed it a column away from the next month's label, and
      // the two ran together as "SepOct".
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
      {/* Left-aligned and scrolled rather than centred: centring a grid that
          can outgrow its container risks clipping the leading weeks, and a
          year of columns reads left-to-right from the oldest week anyway. */}
      <div className="overflow-x-auto pb-1">
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

/** LESSON_QUIZ -> "Lesson quiz". Unknown types are shown as they arrive. */
function formatAssessmentType(type) {
  if (!type) return null
  const words = String(type).replaceAll("_", " ").toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/**
 * Passed or not, said in words and an icon as well as colour -- a pass is not
 * legible as "the green one" to a reader who cannot separate the two hues.
 */
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

/**
 * How the latest attempt compares with the first. Only shown once there are
 * two attempts to compare -- a single sitting has no movement, and calling it
 * "0" would read as "did not improve" rather than "has not retaken".
 */
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

/**
 * One assessment and every attempt on it.
 *
 * <p>A single attempt is stated as a number rather than drawn: a bar chart of
 * one bar is a worse read of one value than the value is. From two attempts up
 * the bars earn their place, because the shape between them is the point --
 * whether retaking moved the score.
 */
function AssessmentAttemptPanel({ group }) {
  const { attempts } = group
  const best = Math.max(...attempts.map((attempt) => attempt.score))
  const typeLabel = formatAssessmentType(group.assessmentType)

  return (
    <li className="rounded-lg border border-border/60 bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{group.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {typeLabel ? `${typeLabel} · ` : ""}
            {attempts.length} attempt{attempts.length === 1 ? "" : "s"}
            {attempts.length > 1 ? ` · best ${Math.round(best)}%` : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1">
          <AttemptMovement attempts={attempts} />
          <AttemptOutcome passed={attempts.some((attempt) => attempt.passed)} />
        </div>
      </div>

      {attempts.length === 1 ? (
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-heading text-3xl font-bold tabular-nums text-foreground">
            {Math.round(attempts[0].score)}%
          </span>
          <span className="text-xs text-muted-foreground">
            {attempts[0].takenOn ? `on ${attempts[0].takenOn}` : "single attempt"}
          </span>
        </div>
      ) : (
        <div className="mt-3">
          <BarBreakdownChart
            data={attempts}
            categoryKey="label"
            valueKey="score"
            unit="%"
            target={PASS_MARK}
            domainMax={100}
            height={Math.max(120, attempts.length * 38)}
            categoryWidth={104}
          />
        </div>
      )}
    </li>
  )
}

/**
 * Every assessment this learner has sat, each with its own attempts.
 *
 * <p>Small multiples rather than one long bar list: the previous chart put
 * every attempt of every assessment on a single axis, so "Mock Exam (try 2)"
 * sat between two unrelated quizzes and the one comparison worth making -- a
 * retake against its own first attempt -- was the one the eye could not make.
 *
 * <p>Ordered by most recent activity, so what the learner is working on now is
 * at the top rather than whatever they sat first.
 */
function AssessmentResultsSection({ groups }) {
  if (groups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HistoryIcon className="size-4 text-primary" aria-hidden="true" />
            Assessment results
          </CardTitle>
          <CardDescription>Every assessment this learner has sat, attempt by attempt.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartEmpty message="No assessment has been graded yet." />
        </CardContent>
      </Card>
    )
  }

  const totalAttempts = groups.reduce((sum, group) => sum + group.attempts.length, 0)
  const retaken = groups.filter((group) => group.attempts.length > 1).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HistoryIcon className="size-4 text-primary" aria-hidden="true" />
          Assessment results
        </CardTitle>
        <CardDescription>
          {groups.length} assessment{groups.length === 1 ? "" : "s"} sat ·{" "}
          {totalAttempts} attempt{totalAttempts === 1 ? "" : "s"}
          {retaken ? ` · ${retaken} retaken` : ""}. Bars reaching the {PASS_MARK}% line are passes.
          Practice the learner generated in the AI tutor is not counted.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-3 lg:grid-cols-2">
          {groups.map((group) => (
            <AssessmentAttemptPanel key={group.examId ?? group.title} group={group} />
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

/**
 * One earned credential: the badge image the admin uploaded for the
 * certification, the date it was awarded, and the certificate number when one
 * was issued. Drawn the way the learner's own badge wall draws it, so a
 * department head and the learner are looking at the same object.
 */
function CredentialMark({ award }) {
  const earnedAt = award.badgeAwardedAt ?? award.certificateAwardedAt
  const score = Number(award.scorePercentage)
  return (
    <li className="flex min-w-0 items-center gap-3 rounded-lg border border-border/60 bg-card p-3">
      <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-rb-bee/60 bg-rb-bee-wash shadow-sm">
        {award.hasBadgeImage ? (
          <img
            /* Busted on the award date: the admin can replace a certification's
               badge image, and the URL is otherwise identical forever. */
            src={`${certificationBadgeUrl(award.certificationId)}?v=${encodeURIComponent(earnedAt ?? "")}`}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <AwardIcon className="size-7 text-rb-bee" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {award.certificationTitle ?? "Certification"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {earnedAt ? `Awarded ${new Date(earnedAt).toLocaleDateString()}` : "Awarded"}
          {Number.isFinite(score) ? ` · passed at ${Math.round(score)}%` : ""}
        </p>
        {award.certificateNumber ? (
          <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
            {award.certificateNumber}
          </p>
        ) : null}
      </div>
    </li>
  )
}

/**
 * What this learner has actually walked away with. The figures above are
 * progress; this is the outcome -- a badge is only written once the mock exam
 * is passed (see CertificationAwardService), so an empty card here is a
 * meaningful "not yet", not missing data.
 *
 * <p>Its own query rather than a field on the analytics DTO: awards are earned
 * against a certification, not against the department this page is scoped to,
 * and a failure to load them should cost the card, not the page.
 */
function CredentialsCard({ query }) {
  const awards = (Array.isArray(query.data) ? query.data : []).filter(
    (award) => award.badgeAwardedAt != null || award.certificateAwardedAt != null
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AwardIcon className="size-4 text-rb-bee" aria-hidden="true" />
          Credentials earned
        </CardTitle>
        <CardDescription>
          Badges and certificates from finishing a certification — awarded on passing its mock exam.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading credentials…</p>
        ) : query.isError ? (
          <p className="text-sm text-muted-foreground">
            Unable to load this learner's credentials.{" "}
            <button
              type="button"
              onClick={query.refetch}
              className="underline underline-offset-2 hover:text-foreground"
            >
              Try again
            </button>
          </p>
        ) : awards.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No credential earned yet. One is issued automatically when this learner passes a
            certification's mock exam.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {awards.map((award) => (
              <CredentialMark key={award.certificationId} award={award} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * One learner's statistics, for the leader of the group they belong to. Reached
 * by clicking a row in the group's Learners tab. Read-only: this is a
 * monitoring view, so nothing here changes the learner's record.
 */
export default function InstitutionDepartmentLearnerPage() {
  const { departmentId, learnerId } = useParams()
  const departmentIdNumber = Number(departmentId)
  const learnerIdNumber = Number(learnerId)

  // The roster already carries the learner's name, so this avoids a second
  // per-learner lookup just to title the page.
  const rosterQuery = useQuery({
    queryKey: ["department-learner-roster", departmentIdNumber],
    queryFn: () => getGroupLearnerRoster(departmentIdNumber),
    enabled: Number.isFinite(departmentIdNumber),
  })

  const analyticsQuery = useQuery({
    queryKey: ["group-learner-analytics", departmentIdNumber, learnerIdNumber],
    queryFn: () => getGroupLearnerAnalytics(departmentIdNumber, learnerIdNumber),
    enabled: Number.isFinite(departmentIdNumber) && Number.isFinite(learnerIdNumber),
    retry: 1,
  })

  // Kept out of the page's loading gate: a slow or failed award lookup should
  // not hold back the statistics, which are what this page is mainly for.
  const awardsQuery = useQuery({
    queryKey: ["group-learner-awards", learnerIdNumber],
    queryFn: () => getGroupLearnerAwards(learnerIdNumber),
    enabled: Number.isFinite(learnerIdNumber),
    staleTime: 60_000,
    retry: 1,
  })

  const learner = (Array.isArray(rosterQuery.data) ? rosterQuery.data : []).find(
    (row) => row.learnerId === learnerIdNumber
  )
  const analytics = analyticsQuery.data

  const backToGroup = `/institution/departments/${departmentId}?tab=learners`


  /* `scoreTrend` already excludes the AI tutor's practice quizzes and
     flashcards -- the backend drops anything `tutorPracticeMarker` recognises
     before building it -- so this is the curriculum's own assessments only.
     One point per submitted attempt, which is what lets a retake be grouped
     against its own first sitting rather than against the next exam along. */
  const gradedAttempts = useMemo(
    () => (analytics?.scoreTrend ?? []).filter((point) => point.percentage != null),
    [analytics?.scoreTrend]
  )

  /* Grouped by `examId` -- the id, not the title, because two assessments in a
     certification may legitimately share a name and merging them would invent
     a retake that never happened. Titles are still the fallback for a point
     that arrives without an id. */
  const assessmentGroups = useMemo(() => {
    const byExam = new Map()
    for (const point of gradedAttempts) {
      // The DTO's field is `assessmentTitle`; this once read `examTitle`, which
      // never existed, so every label said "Assessment".
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
        attemptNumber: point.attemptNumber,
        label: point.attemptNumber ? `Try ${point.attemptNumber}` : "Attempt",
        score: Math.round(Number(point.percentage) * 10) / 10,
        passed: point.passed,
        takenOn: submittedAt ? submittedAt.toLocaleDateString() : null,
      })
      if (submittedAt && (group.lastSubmittedAt == null || submittedAt > group.lastSubmittedAt)) {
        group.lastSubmittedAt = submittedAt
      }
    }

    return [...byExam.values()]
      .map((group) => ({
        ...group,
        // Attempt order, not submission order: a late-graded first attempt
        // should still read as "Try 1" on the left.
        attempts: [...group.attempts].sort(
          (a, b) => (a.attemptNumber ?? 0) - (b.attemptNumber ?? 0)
        ),
      }))
      .sort((a, b) => (b.lastSubmittedAt?.getTime() ?? 0) - (a.lastSubmittedAt?.getTime() ?? 0))
  }, [gradedAttempts])

  /* Every attempt on one time axis, oldest first: the trajectory question
     ("is this learner improving?") that the per-assessment panels below
     deliberately cannot answer, since each of those only looks inward at one
     exam. Labelled by date because the x axis here is time, not identity. */
  const scoreTimeline = useMemo(
    () =>
      [...gradedAttempts]
        .sort((a, b) => new Date(a.submittedAt ?? 0) - new Date(b.submittedAt ?? 0))
        .map((point) => ({
          label: point.submittedAt
            ? new Date(point.submittedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })
            : "—",
          score: Math.round(Number(point.percentage) * 10) / 10,
        })),
    [gradedAttempts]
  )

  if (analyticsQuery.isLoading || rosterQuery.isLoading) {
    return (
      <div className="space-y-6">
        <InstitutionLoadingSkeleton rows={4} />
      </div>
    )
  }

  if (analyticsQuery.isError) {
    return (
      <div className="space-y-4">
        <InstitutionErrorState
          title="Unable to load this learner's statistics"
          description="They may no longer be assigned to this department."
          onRetry={analyticsQuery.refetch}
        />
      </div>
    )
  }

  const weakestTopics = analytics?.weakestTopics ?? []

  const completedLessons = analytics?.completedLessonCount ?? 0
  const totalLessons = analytics?.totalLessonCount ?? 0
  const passedAssessments = analytics?.passedAssessmentCount ?? 0
  const totalAssessments = analytics?.totalAssessmentCount ?? 0
  const totalAttempts = analytics?.totalAssessmentAttempts ?? 0

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
              {learner?.name ?? "Learner"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {analytics?.certificationTitle ?? "Progress and performance"}
              {learner?.username ? ` · @${learner.username}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* The roster already carries this learner's mock-exam result, so
                the badge costs no extra call. */}
            {learner?.mockExamPassed ? (
              <Badge className="gap-1">
                <AwardIcon className="size-3.5" aria-hidden="true" />
                Mock exam passed
                {Number.isFinite(Number(learner.bestMockExamScore))
                  ? ` · ${Math.round(Number(learner.bestMockExamScore))}%`
                  : ""}
              </Badge>
            ) : null}
            {analytics?.bktAvailable === false ? (
              <Badge variant="outline">Mastery data unavailable</Badge>
            ) : null}
          </div>
        </div>
      </div>

      {!analytics?.hasAssessmentActivity && !analytics?.hasChallengeActivity ? (
        <InstitutionEmptyState
          icon={SparklesIcon}
          title="No activity yet"
          description="This learner has not attempted an assessment or challenge yet, so there is nothing to report."
        />
      ) : null}

      {/* Four figures: curriculum progress, assessments passed, average score,
          readiness. Average score and the assessment counts are returned by
          this endpoint (`averageAssessmentScore`, `passedAssessmentCount`,
          `totalAssessmentCount`) and were being dropped on the floor -- nothing
          on the page read them.

          Confidence and overall mastery used to sit here too, alongside a
          meter card and a three-gauge row that restated readiness and
          curriculum completion a second and third time. One figure, stated
          once. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InstitutionStatCard
          icon={BookOpen}
          label="Lessons completed"
          value={`${completedLessons}/${totalLessons}`}
          hint={
            totalLessons
              ? `${Math.round(((completedLessons / totalLessons) * 100 + Number.EPSILON) * 10) / 10}% of the curriculum`
              : "No lessons in this certification yet"
          }
        />
        <InstitutionStatCard
          icon={ClipboardListIcon}
          label="Assessments passed"
          value={`${passedAssessments}/${totalAssessments}`}
          hint={
            totalAssessments
              ? `${totalAttempts} attempt${totalAttempts === 1 ? "" : "s"} on this certification`
              : "No published assessments yet"
          }
        />
        <InstitutionStatCard
          icon={TargetIcon}
          label="Average score"
          /* Across graded attempts, not across assessments: an unattempted
             assessment has no score to average in, and counting it as zero
             would report a failure that has not happened. */
          value={formatPercent(analytics?.averageAssessmentScore)}
          hint={
            totalAttempts
              ? `Mean of ${totalAttempts} graded attempt${totalAttempts === 1 ? "" : "s"}`
              : "No graded attempt yet"
          }
        />
        <InstitutionStatCard
          icon={GaugeIcon}
          label="Readiness"
          value={formatPercent(analytics?.readinessPercentage)}
          hint="Weighted likelihood of passing"
        />
      </div>

      <CredentialsCard query={awardsQuery} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ActivityIcon className="size-4 text-rb-leaf" aria-hidden="true" />
            Assessment activity
          </CardTitle>
          <CardDescription>
            When this learner sat something, and how often — a darker square is a busier day.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityGrid attempts={gradedAttempts} />
        </CardContent>
      </Card>

      {/* Only drawn once there are two attempts to join. A "trend" through a
          single point is a claim the data has not earned, and the score is
          already stated on that attempt's own panel below. */}
      {scoreTimeline.length > 1 ? (
        <ChartPanel
          title="score over time"
          subtitle={
            analytics?.averageAssessmentScore == null
              ? "Every graded attempt in the order it was sat."
              : `Every graded attempt in the order it was sat — averaging ${formatPercent(analytics.averageAssessmentScore)}.`
          }
          footnote={`The ${PASS_MARK}% line is the pass mark.`}
        >
          <TrendLineChart
            data={scoreTimeline}
            xKey="label"
            series={[{ key: "score", name: "Score" }]}
            unit="%"
            ticks={[0, 25, 50, PASS_MARK, 100]}
            showLegend={false}
          />
        </ChartPanel>
      ) : null}

      <AssessmentResultsSection groups={assessmentGroups} />

      <TopicList
        title="Weakest topics"
        description="Where this learner needs the most help — lowest mastery first."
        icon={TrendingDownIcon}
        topics={weakestTopics}
        tone="weak"
      />

      <p className="text-xs text-muted-foreground">
        Monitoring view only.{" "}
        <Link to={backToGroup} className="font-medium text-primary hover:underline">
          Back to this group&apos;s learners
        </Link>
        .
      </p>
    </div>
  )
}
