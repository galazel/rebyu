import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
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
  TrendingUpIcon
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
  getGroupLearnerAwards,
  getGroupLearnerRoster,
} from "@/services/institutionService.js"
import { certificationBadgeUrl } from "@/services/certificationService.js"
import { useAvatarUrl } from "@/hooks/use-avatar-url.js"
import MemberAttemptReviewSheet from "@/components/institution/member-attempt-review-sheet.jsx"

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


function initialsOf(name) {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "—"
  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("")
}

function ProfileStat({ icon: Icon, label, value, hint }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <dt className="truncate text-xs text-muted-foreground">{label}</dt>
        {hint ? <dd className="truncate text-[11px] text-muted-foreground/80">{hint}</dd> : null}
      </div>
      <dd className="shrink-0 font-heading text-base font-bold tabular-nums text-foreground">
        {value}
      </dd>
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

function AttemptBars({ attempts, onOpen }) {
  return (
    <div className="mt-4 flex items-end gap-2 overflow-x-auto pb-1 sm:gap-3">
      {attempts.map((attempt) => {
        const value = Math.min(100, Math.max(0, Number(attempt.score) || 0))
        return (
          <button
            type="button"
            key={attempt.attemptId ?? attempt.attemptNumber ?? attempt.label}
            disabled={!attempt.attemptId || !onOpen}
            onClick={() => onOpen?.(attempt.attemptId)}
            className="flex w-14 shrink-0 flex-col items-center gap-2 rounded-md transition enabled:hover:bg-muted/50"
            title={`Open every answer of attempt ${attempt.attemptNumber ?? "?"}: ${Math.round(value)}%${
              attempt.correctCount != null && attempt.itemCount != null
                ? ` (${attempt.correctCount} of ${attempt.itemCount} correct)`
                : ""
            }${attempt.takenOn ? ` on ${attempt.takenOn}` : ""}`}
          >
            <span className="text-xs tabular-nums text-muted-foreground">
              {Math.round(value)}%
            </span>
            {attempt.correctCount != null && attempt.itemCount != null ? (
              <span className="-mt-1.5 text-[10px] tabular-nums text-muted-foreground/80">
                {attempt.correctCount}/{attempt.itemCount}
              </span>
            ) : null}
            <div className="flex h-24 w-full items-end border-b-2 border-dashed border-border px-1.5">
              <div
                className={cn(
                  "w-full rounded-[6px]",
                  attempt.passed ? "rb-highlight-pass" : "rb-highlight-fail"
                )}
                style={{ height: `max(4px, ${value}%)` }}
              />
            </div>
            <span className="text-xs font-bold text-muted-foreground">
              #{attempt.attemptNumber ?? "—"}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function AssessmentAttemptPanel({ group, onOpen }) {
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

      <AttemptBars attempts={attempts} onOpen={onOpen} />
    </li>
  )
}

function AssessmentResultsSection({ groups, onOpen }) {
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
          {retaken ? ` · ${retaken} retaken` : ""}. Each bar is one attempt, oldest on the left;
          green cleared the assessment, red did not. Select a bar to see every answer. Practice
          the learner generated in the AI tutor is not counted.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-3 lg:grid-cols-2">
          {groups.map((group) => (
            <AssessmentAttemptPanel key={group.examId ?? group.title} group={group} onOpen={onOpen} />
          ))}
        </ul>
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
          Credentials earned
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
            No credentials yet.
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

  const analyticsQuery = useQuery({
    queryKey: ["group-learner-analytics", departmentIdNumber, learnerIdNumber],
    queryFn: () => getGroupLearnerAnalytics(departmentIdNumber, learnerIdNumber),
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

  const learner = (Array.isArray(rosterQuery.data) ? rosterQuery.data : []).find(
    (row) => row.learnerId === learnerIdNumber
  )
  const initials = initialsOf(learner?.name)
  const avatarUrl = useAvatarUrl(learner?.avatarKey ?? null)
  const analytics = analyticsQuery.data

  const backToGroup = `/institution/departments/${departmentId}?tab=learners`


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
        attempts: [...group.attempts].sort(
          (a, b) => (a.attemptNumber ?? 0) - (b.attemptNumber ?? 0)
        ),
      }))
      .sort((a, b) => (b.lastSubmittedAt?.getTime() ?? 0) - (a.lastSubmittedAt?.getTime() ?? 0))
  }, [gradedAttempts])

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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:h-[calc(100dvh-6rem)]">
      <aside className="space-y-4 lg:overflow-y-auto">
        <div>
          <div className="relative flex size-20 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-muted sm:size-24">
            <span className="font-heading text-2xl font-bold text-muted-foreground sm:text-3xl">
              {initials}
            </span>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="absolute inset-0 size-full object-cover" />
            ) : null}
          </div>

          <h1 className="mt-3 font-heading text-xl font-bold leading-tight tracking-tight text-foreground">
            {learner?.name ?? "Learner"}
          </h1>
          {learner?.username ? (
            <p className="text-base text-muted-foreground">@{learner.username}</p>
          ) : null}
          <p className="mt-2 text-sm text-muted-foreground">
            {analytics?.certificationTitle ?? "Progress and performance"}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
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

          <Button asChild variant="outline" className="mt-4 w-full">
            <Link to={backToGroup}>Back to this group</Link>
          </Button>
        </div>

        <dl className="divide-y divide-border/60 rounded-lg border border-border/60">
          <ProfileStat
            icon={BookOpen}
            label="Lessons completed"
            value={`${completedLessons}/${totalLessons}`}
            hint={
              totalLessons
                ? `${Math.round(((completedLessons / totalLessons) * 100 + Number.EPSILON) * 10) / 10}% of the curriculum`
                : "No lessons yet"
            }
          />
          <ProfileStat
            icon={ClipboardListIcon}
            label="Assessments passed"
            value={`${passedAssessments}/${totalAssessments}`}
            hint={
              totalAssessments
                ? `${totalAttempts} attempt${totalAttempts === 1 ? "" : "s"}`
                : "None published yet"
            }
          />
          <ProfileStat
            icon={TargetIcon}
            label="Average score"
            value={formatPercent(analytics?.averageAssessmentScore)}
            hint={totalAttempts ? `Mean of ${totalAttempts} graded` : "No graded attempt yet"}
          />
          <ProfileStat
            icon={GaugeIcon}
            label="Readiness"
            value={formatPercent(analytics?.readinessPercentage)}
            hint="Likelihood of passing"
          />
        </dl>

        <CredentialsCard query={awardsQuery} />
      </aside>

      <div className="min-w-0 space-y-6 lg:overflow-y-auto">
        {!analytics?.hasAssessmentActivity && !analytics?.hasChallengeActivity ? (
          <InstitutionEmptyState
            icon={SparklesIcon}
            title="No activity yet"
            description="This learner has not attempted an assessment or challenge yet, so there is nothing to report."
          />
        ) : null}

        <Card>
          <CardContent className="pt-6">
            <ActivityGrid attempts={gradedAttempts} />
          </CardContent>
        </Card>

        <AssessmentResultsSection groups={assessmentGroups} onOpen={setReviewAttemptId} />
        <MemberAttemptReviewSheet
          departmentId={departmentIdNumber}
          learnerId={learnerIdNumber}
          learnerName={learner?.name}
          attemptId={reviewAttemptId}
          onOpenChange={(open) => {
            if (!open) setReviewAttemptId(null)
          }}
        />

        <TopicList
          title="Weakest topics"
          description={
            analytics?.bktAvailable === false
              ? "Where this learner needs the most help — least accurate first, from their marked answers."
              : "Where this learner needs the most help — lowest mastery first."
          }
          icon={TrendingDownIcon}
          topics={weakestTopics}
          tone="weak"
        />

        <p className="text-xs text-muted-foreground">Monitoring view only.</p>
      </div>
    </div>
  )
}
