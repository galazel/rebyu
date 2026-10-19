import { LoadingNote } from "@/components/classroom/loading-note.jsx"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { certificationProgressPercent } from "@/lib/certification-progress.js"
import { toast } from "sonner"
import {
  ArrowRight,
  Brain,
  BookOpen,
  Check,
  ClipboardListIcon,
  GripHorizontal,
  Loader2,
  Target,
  TrendingUp,
  Trophy,
} from "@/components/icons"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  LearnerEmptyState,
  LearnerErrorState,
} from "@/components/learner/learner-ui.jsx"
import { PlayerCardTile } from "@/components/learner/player-card-tile.jsx"
import { ExamCountdownTile } from "@/components/learner/exam-countdown-tile.jsx"
import { StudyNotesTile } from "@/components/learner/study-notes-tile.jsx"
import { TodaysPlanTile } from "@/components/learner/todays-plan-tile.jsx"
import { PrioritySeal } from "@/components/learner/priority-tag.jsx"
import { BentoGrid, BentoHeading, BentoTile } from "@/components/commons/bento.jsx"
import { DashboardBoard } from "@/components/commons/dashboard-board.jsx"
import {
  RadialGauge,
  TrendLineChart,
  masteryBand,
  masteryColor,
  masteryInk,
  readinessColor,
  readinessInk,
  readinessMeta,
  seriesColor,
  useChartTheme,
} from "@/components/charts/rebyu-charts.jsx"
import {
  PRIORITY_META,
  NEW_STUDY_PLAN_PARAM as NEW_PLAN_PARAM,
  PROGRESS_ANALYTICS_PARAM as CERTIFICATION_PARAM,
  PROGRESS_ANALYTICS_STALE_TIME,
  getProgressAnalytics,
  progressAnalyticsQueryKey,
} from "@/services/learnerAnalyticsService.js"
import { useStudyPlanGate } from "@/components/learner/use-study-plan-gate.jsx"
import { useCertificationStudyPlan } from "@/components/learner/use-certification-study-plan.js"
import { isDiagnosticCompleted } from "@/pages/learner/learning/learner-learning-page.jsx"
import {
  DASHBOARD_LAYOUT_KEY,
  getDashboardLayout,
  saveDashboardLayout,
} from "@/services/studyDeskService.js"


const SERIES_INK = ["#2f6b4f", "#c9962b", "#c8553d", "#8b5f7d"]

function clampPercent(value) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return null
  }

  return Math.max(0, Math.min(100, Math.round(numericValue)))
}

function getTopicScore(topic) {
  return (
    clampPercent(
      topic.mastery ??
      topic.masteryPercentage ??
      topic.score ??
      topic.percentage ??
      topic.correctRate ??
      topic.value
    ) ?? 0
  )
}

function getTopicTitle(topic, fallback = "Untitled Topic") {
  return (
    topic.title ??
    topic.name ??
    topic.lessonName ??
    topic.topicName ??
    fallback
  )
}


const RETAKE_COLORS = [
  "#2f6b4f", "#c9962b", "#c8553d", "#6b7d3f", "#d9822b",
  "#4f8a78", "#8a5a2b", "#a8412c", "#9bb35a", "#5c3d2e",
]

const MASTERY_TIERS = {
  weak: { label: "low", bars: 1 },
  developing: { label: "medium", bars: 2 },
  strong: { label: "high", bars: 3 },
}

function masteryConfidence(value, evidenceCount) {
  const count = Number(evidenceCount)
  if (!Number.isFinite(count) || count <= 0) return null
  const band = masteryBand(value)
  return band ? MASTERY_TIERS[band] : null
}

function ConfidenceMeter({ bars }) {
  return (
    <span className="inline-flex items-end gap-0.5" aria-hidden="true">
      {[1, 2, 3].map((step) => (
        <span
          key={step}
          className={`w-1 rounded-sm ${step <= bars ? "bg-foreground" : "bg-muted-foreground/30"}`}
          style={{ height: `${4 + step * 3}px` }}
        />
      ))}
    </span>
  )
}

function MasteryRow({ title, caption, value, color = SERIES_INK[0], leading, evidenceCount }) {
  const confidence = masteryConfidence(value, evidenceCount)

  return (
    <div className="flex items-start gap-3">
      {leading ?? null}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 text-sm font-semibold leading-5 text-foreground">{title}</p>

          <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
            {value}%
          </span>
        </div>

        {caption ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{caption}</p>
        ) : null}

        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${value}%`, background: color }}
          />
        </div>

        {confidence ? (
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <ConfidenceMeter bars={confidence.bars} />
            {confidence.label} confidence
            <span aria-hidden="true">·</span>
            {evidenceCount} {evidenceCount === 1 ? "answer" : "answers"} seen
          </p>
        ) : null}
      </div>
    </div>
  )
}

function NextUpTile({
  nextLesson,
  certification,
  completedLessons,
  totalLessons,
  passedAssessments,
  totalAssessments,
  onResume,
  onOpenAssessments,
}) {
  const lessonsDone = totalLessons > 0 && completedLessons >= totalLessons
  const noAssessmentsKnown = totalAssessments === 0
  const assessmentsDone = noAssessmentsKnown || passedAssessments >= totalAssessments
  const done = lessonsDone && assessmentsDone
  const awaitingAssessments = lessonsDone && !assessmentsDone

  const percent = certificationProgressPercent({
    completedLessons,
    totalLessons,
    passedAssessments,
    totalAssessments,
  })

  return (
    <BentoTile tone="macaw" col={4} row={2}>
      <BentoHeading
        icon={done ? Trophy : BookOpen}
        kicker="Up Next"
        title={done ? "all caught up" : awaitingAssessments ? "assessments left" : "study next"}
        hint="The lesson to open now, and how far through the course you are."
      />

      <div className="min-w-0">
        <p className="truncate text-xs font-bold uppercase tracking-wide text-rb-macaw-lip">
          {certification?.title ?? "Certification"}
        </p>

        <p className="mt-1 font-rb-display text-xl font-extrabold leading-tight sm:text-2xl">
          {done
            ? noAssessmentsKnown
              ? "All lessons complete."
              : "Certification complete."
            : awaitingAssessments
              ? `${totalAssessments - passedAssessments} assessment${
                  totalAssessments - passedAssessments === 1 ? "" : "s"
                } to pass`
              : (nextLesson?.name ?? nextLesson?.title ?? "Untitled Lesson")}
        </p>

        <p className="mt-1.5 text-sm text-rb-macaw-lip">
          {done
            ? noAssessmentsKnown
              ?
                "Every lesson is read. No assessments are listed for this certification."
              : "Every lesson read and every assessment passed."
            : awaitingAssessments
              ? "Every lesson is read. Sit the remaining assessments to finish the certification."
              : (nextLesson?.middleCategoryTitle ?? "Continue studying to raise your mastery.")}
        </p>
      </div>

      <div className="mt-auto pt-5">
        <div className="mb-2 flex items-center justify-between text-xs font-bold text-rb-macaw-lip">
          <span>
            {completedLessons} of {totalLessons} lessons
            {totalAssessments > 0
              ? ` · ${passedAssessments} of ${totalAssessments} assessments`
              : ""}
          </span>
          <span className="tabular-nums">{percent}%</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-white/60 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-rb-macaw transition-[width] duration-700"
            style={{ width: `${percent}%` }}
          />
        </div>

        {!done && nextLesson ? (
          <Button className="mt-4 w-full sm:w-fit" onClick={onResume}>
            study now
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        ) : awaitingAssessments ? (
          <Button className="mt-4 w-full sm:w-fit" onClick={onOpenAssessments}>
            go to assessments
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </BentoTile>
  )
}

function ReadinessTile({ readiness }) {
  const theme = useChartTheme()
  const meta = readinessMeta(readiness)

  return (
    <BentoTile col={2} row={2}>
      <BentoHeading
        icon={Target}
        kicker="Exam Outlook"
        title="exam readiness"
        hint="Your estimated chance of passing."
      />

      {readiness === null ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <Target className="size-6 text-muted-foreground/50" aria-hidden="true" />

          <p className="mt-3 text-sm font-medium text-foreground">Not scored yet</p>

          <p className="mt-1 text-xs text-muted-foreground">
            Sit a quiz or assessment to get an estimate.
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center">
          <RadialGauge
            value={readiness}
            height={150}
            color={readinessColor(theme, readiness)}
          />

          <p
            className="mt-2 font-rb-display text-base font-extrabold lowercase leading-none"
            style={{ color: readinessInk(theme, readiness) }}
          >
            {meta?.label}
          </p>

          <p className="mt-2 text-center text-xs font-semibold leading-5 text-muted-foreground">
            {meta?.hint}
          </p>
        </div>
      )}
    </BentoTile>
  )
}

function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-4">
    <LoadingNote text="drawing your progress board…" />
    <BentoGrid>
      <BentoTile col={4} row={2} className="gap-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="mt-auto h-2 w-full" />
        <Skeleton className="h-10 w-36" />
      </BentoTile>
      <BentoTile col={2} row={2} className="gap-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mx-auto h-[130px] w-[130px] rounded-full" />
      </BentoTile>

      <BentoTile col={2} row={1} className="justify-center gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-16" />
      </BentoTile>
      <BentoTile col={2} row={1} className="justify-center gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-16" />
      </BentoTile>
      <BentoTile col={2} row={1} className="justify-center gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-16" />
      </BentoTile>

      <BentoTile col={4} row={2} className="gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-[200px] w-full" />
      </BentoTile>
      <BentoTile col={2} row={2} className="gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </BentoTile>

      {[0, 1, 2, 3, 4, 5].map((index) => (
        <BentoTile key={index} col={3} row={2} className="gap-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </BentoTile>
      ))}
    </BentoGrid>
    </div>
  )
}


export default function LearnerProgressPage() {
  const navigate = useNavigate()
  const outletContext = useOutletContext()
  const data = outletContext?.data ?? {}

  const publishedCertifications = data.enrolledCertifications ?? []
  const allLessons = data.lessons ?? []



  const [searchParams, setSearchParams] = useSearchParams()
  const selectedCertificationId = searchParams.get(CERTIFICATION_PARAM) ?? ""

  const setSelectedCertificationId = useCallback(
    (certificationId) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          if (certificationId) {
            next.set(CERTIFICATION_PARAM, String(certificationId))
          } else {
            next.delete(CERTIFICATION_PARAM)
          }
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  useEffect(() => {
    if (publishedCertifications.length === 0) {
      if (selectedCertificationId) {
        setSelectedCertificationId("")
      }

      return
    }

    const selectedStillExists = publishedCertifications.some(
      (certification) => String(certification.certificationId) === selectedCertificationId
    )

    if (!selectedStillExists) {
      setSelectedCertificationId(String(publishedCertifications[0].certificationId))
    }
  }, [publishedCertifications, selectedCertificationId, setSelectedCertificationId])

  const selectedCertification = useMemo(() => {
    return publishedCertifications.find(
      (certification) => String(certification.certificationId) === selectedCertificationId
    )
  }, [publishedCertifications, selectedCertificationId])

  const { openCertification, openOverallStudyPlan, studyPlanDialog } = useStudyPlanGate()


  const {
    plan: existingPlan,
    isLoading: planLoading,
  } = useCertificationStudyPlan(selectedCertificationId)

  const hasStudyPlan = Boolean(existingPlan?.planId)

  const wantsNewPlan = searchParams.get(NEW_PLAN_PARAM) === "1"


  const returnTo = searchParams.get("returnTo")
  const safeReturnTo =
    returnTo && returnTo.startsWith("/learner/") && !returnTo.startsWith("//")
      ? returnTo
      : null

  useEffect(() => {
    if (!wantsNewPlan || planLoading) {
      return
    }

    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete(NEW_PLAN_PARAM)
        next.delete("returnTo")
        return next
      },
      { replace: true }
    )

    if (hasStudyPlan) {
      navigate(safeReturnTo ?? "/learner/plan")
    } else {
      openOverallStudyPlan(safeReturnTo)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsNewPlan, planLoading, hasStudyPlan, safeReturnTo])

  const analyticsPoll = useRef({ key: null, startedAt: 0 })
  const analyticsQuery = useQuery({
    queryKey: progressAnalyticsQueryKey(selectedCertificationId),
    queryFn: () => getProgressAnalytics(selectedCertificationId),
    enabled: Boolean(selectedCertificationId),
    staleTime: PROGRESS_ANALYTICS_STALE_TIME,
    gcTime: 60 * 60_000,
    refetchInterval: (query) => {
      if (query.state.data?.bktAvailable !== false) return false
      const poll = analyticsPoll.current
      if (poll.key !== selectedCertificationId) {
        poll.key = selectedCertificationId
        poll.startedAt = Date.now()
      }
      return Date.now() - poll.startedAt < 3 * 60_000 ? 30_000 : false
    },
  })
  const analytics = analyticsQuery.data


  const lessons = useMemo(() => {
    if (!selectedCertificationId) {
      return []
    }

    return allLessons.filter(
      (lesson) => String(lesson.certificationId) === selectedCertificationId
    )
  }, [allLessons, selectedCertificationId])

  const totalLessons = analytics?.totalLessonCount ?? 0
  const completedLessons = analytics?.completedLessonCount ?? 0

  const nextLesson = useMemo(() => {
    return lessons.find((lesson) => !lesson.completed) ?? null
  }, [lessons])

  const goToLesson = (lesson) => {
    const lessonPath =
      lesson?.certificationId && lesson?.middleCategoryId
        ? `/learner/learning/${lesson.certificationId}/topics/${lesson.middleCategoryId}` +
          (lesson.lessonId == null ? "" : `?lesson=${lesson.lessonId}`)
        : null

    if (!lessonPath && !selectedCertificationId) {
      return
    }

    const diagnosticDone = isDiagnosticCompleted(selectedCertification, data)

    openCertification(
      selectedCertification ?? { certificationId: selectedCertificationId },
      {
        diagnosticCompleted: diagnosticDone,
        to: diagnosticDone ? (lessonPath ?? undefined) : undefined,
      },
    )
  }

  const resumeNextLesson = () => {
    if (!nextLesson) return
    goToLesson(nextLesson)
  }

  const goToFocusTopic = () => {
    if (!focusTopic) return
    goToLesson({
      certificationId: selectedCertificationId,
      middleCategoryId: focusTopic.categoryId,
      lessonId: focusTopic.lessonId,
    })
  }

  const retakeTrend = useMemo(() => {
    const points = (analytics?.scoreTrend ?? []).filter(
      (point) => clampPercent(point.percentage) !== null
    )

    const byAssessment = new Map()
    for (const point of points) {
      const key = String(point.examId ?? point.assessmentTitle ?? "unknown")
      if (!byAssessment.has(key)) {
        byAssessment.set(key, {
          key: `assessment-${byAssessment.size}`,
          name: point.assessmentTitle ?? "Assessment",
          attempts: [],
        })
      }
      byAssessment.get(key).attempts.push(point)
    }

    const assessments = [...byAssessment.values()]
      .map((assessment) => ({
        ...assessment,
        attempts: [...assessment.attempts].sort(
          (a, b) =>
            (a.attemptNumber ?? 0) - (b.attemptNumber ?? 0) ||
            new Date(a.submittedAt ?? 0) - new Date(b.submittedAt ?? 0)
        ),
      }))
      .sort((a, b) => b.attempts.length - a.attempts.length)

    const MAX_SERIES = RETAKE_COLORS.length
    const shown = assessments.slice(0, MAX_SERIES)

    const longestRun = shown.reduce((max, item) => Math.max(max, item.attempts.length), 0)
    const rows = Array.from({ length: longestRun }, (_, index) => {
      const row = { label: `Attempt ${index + 1}` }
      for (const assessment of shown) {
        row[assessment.key] = clampPercent(assessment.attempts[index]?.percentage) ?? null
      }
      return row
    })

    const summaries = shown.map((assessment) => {
      const scores = assessment.attempts.map((attempt) => clampPercent(attempt.percentage) ?? 0)
      const first = scores[0]
      const latest = scores[scores.length - 1]
      return {
        key: assessment.key,
        name: assessment.name,
        attempts: scores.length,
        first,
        latest,
        best: Math.max(...scores),
        delta: latest - first,
      }
    })

    return {
      rows,
      series: shown.map((assessment, index) => ({
        key: assessment.key,
        name: assessment.name,
        color: RETAKE_COLORS[index],
      })),
      summaries,
      hiddenCount: assessments.length - shown.length,
    }
  }, [analytics])

  const rankedMastery = useMemo(() => {
    const rows = (analytics?.lessonPriorities ?? []).filter(
      (topic) => Number(topic.evidenceCount) > 0 && topic.masteryPercentage != null
    )

    return [...rows].sort((a, b) => {
      const byMastery = getTopicScore(a) - getTopicScore(b)
      if (byMastery !== 0) return byMastery
      return Number(b.evidenceCount ?? 0) - Number(a.evidenceCount ?? 0)
    })
  }, [analytics])

  const assessmentHistory = useMemo(() => {
    const byExam = new Map()

    for (const point of analytics?.scoreTrend ?? []) {
      if (point.examId == null) continue

      const key = String(point.examId)
      const existing = byExam.get(key)
      const attemptNo = point.attemptNumber ?? 0
      const submitted = new Date(point.submittedAt ?? 0).getTime()

      if (!existing) {
        byExam.set(key, { latest: point, attempts: 1 })
        continue
      }

      existing.attempts += 1

      const currentNo = existing.latest.attemptNumber ?? 0
      const currentSubmitted = new Date(existing.latest.submittedAt ?? 0).getTime()
      if (attemptNo > currentNo || (attemptNo === currentNo && submitted > currentSubmitted)) {
        existing.latest = point
      }
    }

    return [...byExam.entries()]
      .map(([examId, entry]) => ({
        examId,
        title: entry.latest.assessmentTitle ?? "Assessment",
        assessmentType: entry.latest.assessmentType,
        score: clampPercent(entry.latest.percentage),
        passed: entry.latest.passed,
        submittedAt: entry.latest.submittedAt,
        attempts: entry.attempts,
        resultId: entry.latest.assessmentAttemptId,
      }))
      .sort((a, b) => new Date(b.submittedAt ?? 0) - new Date(a.submittedAt ?? 0))
  }, [analytics])


  const MASTERY_TONES = { weak: "cardinal", developing: "fox", strong: "leaf" }

  const FOCUS_COPY = {
    weak: { label: "Study this first", line: "Your weakest topic -- start here." },
    developing: { label: "Needs practice", line: "Coming along. A quiz would move it." },
    strong: { label: "Almost there", line: "One more pass should lock it in." },
    mastered: { label: "You're on top of this", line: "Nothing here needs work right now." },
  }

  function focusCopy(band, score) {
    if (!band) return null
    if (band === "strong" && Number(score) >= 85) return FOCUS_COPY.mastered
    return FOCUS_COPY[band] ?? null
  }

  const focusTopic = useMemo(() => {
    if (rankedMastery.length === 0) return null

    return [...rankedMastery].sort((a, b) => {
      const rankA = PRIORITY_META[a.priorityTag]?.rank ?? -1
      const rankB = PRIORITY_META[b.priorityTag]?.rank ?? -1
      if (rankA !== rankB) return rankB - rankA
      return getTopicScore(a) - getTopicScore(b)
    })[0]
  }, [rankedMastery])

  const focusScore = focusTopic ? getTopicScore(focusTopic) : null
  const focusBand = masteryBand(focusScore)
  const focusTone = MASTERY_TONES[focusBand] ?? "beetle"
  const readinessLevel = clampPercent(analytics?.readinessPercentage)
  const bktUnavailable = analytics != null && analytics.bktAvailable === false

  const chartTheme = useChartTheme()

  const dashboardTiles = [
    {
      id: "player-card",
      x: 0,
      y: 0,
      col: 6,
      row: 1,
      element: <PlayerCardTile portalData={data} />,
    },
    {
      id: "next-up",
      x: 0,
      y: 1,
      col: 3,
      row: 2,
      element: (
        <NextUpTile
        nextLesson={nextLesson}
        certification={selectedCertification}
        completedLessons={completedLessons}
        totalLessons={totalLessons}
        passedAssessments={analytics?.passedAssessmentCount ?? 0}
        totalAssessments={analytics?.totalAssessmentCount ?? 0}
        onResume={resumeNextLesson}
        onOpenAssessments={() =>
        selectedCertificationId
        ? navigate(`/learner/learning/${selectedCertificationId}`)
        : undefined
        }
        />
      ),
    },
    {
      id: "exam-readiness",
      x: 3,
      y: 1,
      col: 2,
      row: 2,
      element: (
        <ReadinessTile readiness={readinessLevel} />
      ),
    },
    {
      id: "topic-mastery",
      x: 3,
      y: 3,
      col: 3,
      row: 1,
      element: (
        <BentoTile tone={focusTone} col={2} row={1} className="relative">
          <div className="flex items-start justify-between gap-3">
            <p
              className={`text-sm font-bold ${focusBand ? "" : "text-rb-beetle-lip"}`}
              style={focusBand ? { color: masteryInk(chartTheme, focusScore) } : undefined}
            >
              {focusTopic
                ? (focusCopy(focusBand, focusScore)?.label ?? "Work on this next")
                : "Topic Mastery"}
            </p>
            {focusTopic?.priorityTag ? (
              <PrioritySeal tag={focusTopic.priorityTag} size={36} />
            ) : (
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/60 text-rb-eel dark:bg-white/10 dark:text-rb-snow">
                <Brain className="size-4" aria-hidden="true" />
              </span>
            )}
          </div>

          {focusTopic ? (
            <div className="mt-auto min-w-0">

              <p
                className="font-rb-display text-4xl font-extrabold leading-[0.9] tracking-tight tabular-nums sm:text-5xl"
                style={{ color: masteryInk(chartTheme, focusScore) }}
              >
                {focusScore}%
              </p>


              <p
                className={`mt-1.5 truncate text-sm font-bold text-rb-eel ${
                  focusBand === "weak" ? "pr-32" : ""
                }`}
              >
                {focusTopic.lessonTitle ?? getTopicTitle(focusTopic)}
              </p>

              <p
                className={`truncate text-xs font-semibold text-rb-wolf ${
                  focusBand === "weak" ? "pr-32" : ""
                }`}
              >
                {focusCopy(focusBand, focusScore)?.line ?? focusTopic.categoryTitle}
              </p>


              {focusBand === "weak" ? (
                <Button
                  size="sm"
                  className="absolute bottom-5 right-5 sm:bottom-6 sm:right-6"
                  onClick={goToFocusTopic}
                >
                  study now
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="mt-auto">
              <p className="font-rb-display text-2xl font-extrabold leading-tight text-rb-eel">
                Nothing scored yet
              </p>
              <p className="mt-1 text-xs font-semibold text-rb-beetle-lip">
                {analytics?.unassessedTopicCount
                  ? `${analytics.unassessedTopicCount} topics not yet assessed`
                  : "Sit an assessment to rank your topics"}
              </p>
            </div>
          )}
        </BentoTile>
      ),
    },
    {
      id: "todays-plan",
      x: 5,
      y: 1,
      col: 1,
      row: 2,
      element: (
        <TodaysPlanTile
          certificationId={selectedCertificationId}
          onCreatePlan={openOverallStudyPlan}
        />
      ),
    },
    {
      id: "exam-countdown",
      x: 2,
      y: 3,
      col: 1,
      row: 1,
      element: (
        <ExamCountdownTile certificationId={selectedCertificationId} />
      ),
    },
    {
      id: "study-notes",
      x: 0,
      y: 3,
      col: 2,
      row: 3,
      element: (
        <StudyNotesTile certificationId={selectedCertificationId} />
      ),
    },
    {
      id: "score-over-time",
      x: 0,
      y: 6,
      col: 3,
      row: 3,
      element: (
        <BentoTile col={4} row={3}>
          <BentoHeading
            icon={TrendingUp}
            kicker="Progress Over Time"
            title="score across retakes"
            hint="Each assessment's attempts in order — a rising line is a score you moved."
            chip={
              retakeTrend.hiddenCount > 0 ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                  showing {retakeTrend.summaries.length} of{" "}
                  {retakeTrend.summaries.length + retakeTrend.hiddenCount} · most retaken
                </span>
              ) : null
            }
          />

          {retakeTrend.rows.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <Target className="size-7 text-muted-foreground/50" aria-hidden="true" />

              <p className="mt-3 text-sm font-medium text-foreground">No graded attempts yet</p>

              <p className="mt-1 text-xs text-muted-foreground">
                Sit a quiz or an assessment, then retake it — this chart is about the
                difference between the two.
              </p>
            </div>
          ) : (
            <>
              <div className="min-h-0 shrink">
                <TrendLineChart
                  data={retakeTrend.rows}
                  xKey="label"
                  series={retakeTrend.series}
                  height={150}
                  unit="%"
                  ticks={[0, 25, 50, 75, 100]}
                  showLegend={false}
                />
              </div>

              <div className="-mr-2 mt-2 min-h-16 flex-1 space-y-1 overflow-y-auto pr-2">
                {retakeTrend.summaries.map((summary, index) => (
                  <div key={summary.key} className="flex items-center gap-2.5 text-xs">
                    <span
                      className="size-2.5 shrink-0 rounded-sm"
                      style={{ background: RETAKE_COLORS[index] ?? seriesColor(chartTheme, index) }}
                      aria-hidden="true"
                    />

                    <span className="min-w-0 flex-1 truncate font-semibold text-foreground">
                      {summary.name}
                    </span>

                    <span className="hidden shrink-0 text-muted-foreground sm:inline">
                      {summary.attempts === 1
                        ? "1 attempt"
                        : `${summary.attempts} attempts · best ${summary.best}%`}
                    </span>

                    {summary.attempts === 1 ? (
                      <span className="w-20 shrink-0 text-right font-semibold tabular-nums text-muted-foreground">
                        {summary.latest}%
                      </span>
                    ) : (
                      <span
                        className={`w-20 shrink-0 text-right font-bold tabular-nums ${
                          summary.delta > 0
                            ? "text-rb-feather-ink"
                            : summary.delta < 0
                              ? "text-rb-cardinal-lip"
                              : "text-muted-foreground"
                        }`}
                        title={`First attempt ${summary.first}%, latest ${summary.latest}%`}
                      >
                        {summary.delta > 0 ? "+" : ""}
                        {summary.delta === 0 ? "no change" : `${summary.delta} pts`}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </BentoTile>
      ),
    },
    {
      id: "mastery-by-topic",
      x: 2,
      y: 4,
      col: 4,
      row: 2,
      element: (
        <BentoTile col={4} row={4} className="!p-0">
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="p-5 pb-0 sm:p-6 sm:pb-0">
              <BentoHeading
                icon={Brain}
                kicker="Topic Breakdown"
                title="mastery by topic"
                hint="Weakest first — every topic with enough answers behind it to score."
                action={
                  analytics?.unassessedTopicCount ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                          {analytics.unassessedTopicCount} not yet assessed
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        These topics have no answers behind them yet, so they carry no
                        mastery estimate and are left out of this list.
                      </TooltipContent>
                    </Tooltip>
                  ) : null
                }
              />
            </div>

            {rankedMastery.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                <Brain className="size-6 text-muted-foreground/50" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium text-foreground">
                  Nothing scored yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sit a diagnostic or an assessment and every topic it touches gets a
                  mastery level here.
                </p>
              </div>
            ) : (
              <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
                {rankedMastery.map((topic, index) => (
                  <li
                    key={topic.lessonId ?? `${getTopicTitle(topic)}-${index}`}
                    className="px-5 py-3.5 sm:px-6"
                  >
                    <MasteryRow
                      title={topic.lessonTitle ?? getTopicTitle(topic)}
                      caption={topic.categoryTitle}
                      value={getTopicScore(topic)}
                      color={masteryColor(chartTheme, getTopicScore(topic))}
                      evidenceCount={topic.evidenceCount}
                      leading={
                        topic.priorityTag ? (
                          <PrioritySeal tag={topic.priorityTag} size={36} />
                        ) : null
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </BentoTile>
      ),
    },
    {
      id: "assessment-history",
      x: 3,
      y: 6,
      col: 3,
      row: 3,
      element: (
        <BentoTile col={4} row={3} className="!p-0">
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-border p-5 sm:p-6">
              <BentoHeading
                icon={ClipboardListIcon}
                kicker="Your Record"
                title="assessment history"
                hint="Your latest attempt on each assessment — open the full run from here."
              />
            </div>

            {assessmentHistory.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                <BookOpen className="size-6 text-muted-foreground/50" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium text-foreground">
                  No assessments sat yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Once you submit one, every attempt shows up here.
                </p>
              </div>
            ) : (
              <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
                {assessmentHistory.map((row) => (
                  <li
                    key={row.examId}
                    className="flex items-center gap-3 px-5 py-3.5 sm:px-6"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {row.title}
                      </p>

                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="font-bold tabular-nums text-foreground">
                          {row.score === null ? "—" : `${row.score}%`}
                        </span>

                        {row.passed == null ? null : (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                              row.passed
                                ? "bg-rb-feather-wash text-rb-feather-ink"
                                : "bg-rb-cardinal-wash text-rb-cardinal-lip"
                            }`}
                          >
                            {row.passed ? "passed" : "not passed"}
                          </span>
                        )}

                        <span aria-hidden="true">·</span>
                        <span>
                          {row.attempts} {row.attempts === 1 ? "attempt" : "attempts"}
                        </span>

                        {row.submittedAt ? (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>
                              {new Date(row.submittedAt).toLocaleDateString(undefined, {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </>
                        ) : null}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => navigate(`/learner/assessments/${row.examId}/history`)}
                    >
                      view attempts
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </BentoTile>
      ),
    },
  ]

  const layoutQuery = useQuery({
    queryKey: [DASHBOARD_LAYOUT_KEY],
    queryFn: getDashboardLayout,
    staleTime: 5 * 60_000,
    retry: 1,
  })

  const queryClient = useQueryClient()
  const [rearranging, setRearranging] = useState(false)
  const [localLayout, setLocalLayout] = useState(null)
  const savedLayout = localLayout ?? layoutQuery.data?.tiles ?? null
  const tileLayout = savedLayout ?? []

  const saveLayoutMutation = useMutation({
    mutationFn: saveDashboardLayout,

    onSuccess: (saved) => {
      queryClient.setQueryData([DASHBOARD_LAYOUT_KEY], saved)
      setLocalLayout(null)
    },

    onError: (error) => {
      setLocalLayout(null)

      console.warn("Saving the dashboard layout failed.", error)
      toast.error("Could not save your layout", {
        description:
          error?.response?.status === 404
            ? "The layout service isn't available, so arrangements cannot be saved yet."
            : "Your tiles have been put back where they were.",
      })
    },
  })

  const handleLayoutChange = (nextLayout) => {
    setLocalLayout(nextLayout)
    saveLayoutMutation.mutate(nextLayout)
  }

  const resetLayout = () => {
    setLocalLayout([])
    saveLayoutMutation.mutate([])
  }

  const [layoutBeforeEdit, setLayoutBeforeEdit] = useState(null)

  const startRearranging = () => {
    setLayoutBeforeEdit(savedLayout)
    setRearranging(true)
  }

  const finishRearranging = () => {
    setLayoutBeforeEdit(null)
    setRearranging(false)
  }

  const cancelRearranging = () => {
    const previous = layoutBeforeEdit
    finishRearranging()
    if (previous != null && JSON.stringify(previous) !== JSON.stringify(tileLayout)) {
      setLocalLayout(previous)
      saveLayoutMutation.mutate(previous)
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-auto flex flex-col items-start gap-2">
            <p className="rb-chalk-label">your progress board</p>
            <h1 className="font-rb-display text-3xl leading-none text-foreground sm:text-4xl">
              how&apos;s your studying going?
            </h1>
          </div>

          {analyticsQuery.isFetching && !analyticsQuery.isLoading ? (
            <span className="ml-auto flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              Updating
            </span>
          ) : null}

          <Select
            value={selectedCertificationId}
            onValueChange={setSelectedCertificationId}
            disabled={publishedCertifications.length === 0}
          >
            <SelectTrigger className="w-auto min-w-[210px] bg-background text-sm font-medium">
              <SelectValue placeholder="Select certification" />
            </SelectTrigger>

            <SelectContent align="start">
              {publishedCertifications.map((certification) => (
                <SelectItem
                  key={certification.certificationId}
                  value={String(certification.certificationId)}
                  className="text-sm"
                >
                  {certification.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>



          {rearranging ? (
            <>
              <Button variant="ghost" onClick={resetLayout}>
                Reset layout
              </Button>

              <Button variant="outline" onClick={cancelRearranging}>
                Cancel
              </Button>
            </>
          ) : null}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={rearranging ? "default" : "outline"}
                size="icon"
                aria-pressed={rearranging}
                aria-label={rearranging ? "Keep this arrangement" : "Rearrange tiles"}
                onClick={rearranging ? finishRearranging : startRearranging}
              >
                {rearranging ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : (
                  <GripHorizontal className="size-4" aria-hidden="true" />
                )}
              </Button>
            </TooltipTrigger>

            <TooltipContent side="bottom">
              {rearranging ? "Keep this arrangement" : "Rearrange tiles"}
            </TooltipContent>
          </Tooltip>
        </div>

        {publishedCertifications.length === 0 ? (
          <LearnerEmptyState
            icon={BookOpen}
            title="No enrolled certifications yet"
            description="Enroll in a certification -- or accept an institution invitation -- and your mastery, performance trends, and recommended next steps will appear here."
            action={
              <Button onClick={() => navigate("/learner/certifications")}>
                Browse certifications
              </Button>
            }
          />
        ) : analyticsQuery.isLoading ? (
          <AnalyticsLoadingSkeleton />
        ) : analyticsQuery.isError ? (
          <LearnerErrorState
            title="Couldn't load your analytics"
            error={analyticsQuery.error}
            onRetry={analyticsQuery.refetch}
          />
        ) : (
          <>
            {bktUnavailable && (
              <div className="flex items-center gap-3 rounded-rb-tile border-2 border-rb-bee/40 bg-rb-bee-wash px-4 py-3 text-sm font-semibold text-rb-bee-lip">
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
                <span>
                  Processing your mastery — this updates itself once it's ready. Your assessment
                  scores below are still up to date.
                </span>
              </div>
            )}

            <DashboardBoard
              tiles={dashboardTiles}
              layout={tileLayout}
              editing={rearranging}
              onLayoutChange={handleLayoutChange}
            />
          </>
        )}

        {studyPlanDialog}
      </div>
    </>
  )
}
