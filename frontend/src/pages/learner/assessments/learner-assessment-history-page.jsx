import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowRight,
  CheckCircle2Icon,
  ClockIcon,
  HistoryIcon,
  RotateCcwIcon,
  StarIcon,
  TrendingUpIcon,
  XCircleIcon,
} from "@/components/icons"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  getCurrentLearner,
  getCurrentLearnerIdentity,
} from "@/services/learnerService.js"
import { getAssessmentAttempts, getAttemptResult } from "@/services/assessmentService.js"
import { LoadingSignal } from "@/components/loading-overlay.jsx"

function formatDuration(totalSeconds) {
  if (totalSeconds == null) return "—"
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds}s`
}

function formatDate(value) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}


const PROFICIENT_RATING = 50

function standingOf(attempt) {
  const raw = attempt?.proficiency?.rating
  const rating = raw == null ? null : Number(raw)
  if (rating == null || !Number.isFinite(rating)) {
    return { rating: null, label: null, cleared: attempt?.passed === true, measured: false }
  }
  return {
    rating,
    label: attempt.proficiency.label,
    cleared: rating >= PROFICIENT_RATING,
    measured: true,
  }
}

function AttemptTrend({ attempts }) {
  if (attempts.length < 2) return null

  return (
    <section className="tg-frame">
      <header className="flex items-center gap-2.5 border-b border-[var(--tg-line)] bg-[var(--tg-softer)] px-5 py-3">
        <span className="tg-badge-icon !size-8"><TrendingUpIcon className="size-4" aria-hidden="true" /></span>
        <h2 className="tg-kicker">Proficiency by attempt</h2>
        <span className="ml-auto text-xs font-semibold text-muted-foreground">Proficient at {PROFICIENT_RATING}</span>
      </header>
      <div className="relative px-5 pb-4 pt-6">
        <div className="relative flex h-40 items-end gap-3 sm:gap-4">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-[var(--tg-line)]"
            style={{ bottom: `${PROFICIENT_RATING}%` }}
          />
          {attempts.map((attempt) => {
            const rating = attempt.proficiency?.rating
            const value = Math.min(100, Math.max(0, Number(rating ?? attempt.percentage ?? 0)))
            const cleared = standingOf(attempt).cleared
            return (
              <div key={attempt.assessmentAttemptId} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                <span className={cn("text-xs font-extrabold tabular-nums", cleared ? "text-[var(--tg-ink)]" : "text-rb-cardinal-lip")}>
                  {rating == null ? `${value.toFixed(0)}%` : value.toFixed(0)}
                </span>
                <div
                  className={cn("w-full max-w-16 rounded-t-xl", cleared ? "tg-solid-soft" : "bg-rb-cardinal/70")}
                  style={{ height: `max(6px, ${value}%)` }}
                />
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex gap-3 sm:gap-4">
          {attempts.map((attempt) => (
            <span key={attempt.assessmentAttemptId} className="flex-1 text-center text-xs font-bold text-muted-foreground">
              #{attempt.attemptNumber}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function SummaryTile({ label, value, caption, tone = "neutral" }) {
  return (
    <div className="rounded-[1rem] border border-[var(--tg-line)] bg-card px-4 py-3">
      <dt className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-1 text-2xl font-black tabular-nums",
          tone === "leaf" ? "text-[var(--tg-ink)]" : tone === "cardinal" ? "text-rb-cardinal-lip" : "text-foreground",
        )}
      >
        {value}
      </dd>
      {caption ? <p className="mt-0.5 text-xs text-muted-foreground">{caption}</p> : null}
    </div>
  )
}

const PAGE_ANSWER_LIMIT = 6

function answerState(answer) {
  if (answer.pendingManualEvaluation) return "pending"
  if (answer.isCorrect == null) return "neutral"
  return answer.isCorrect ? "correct" : "incorrect"
}

const ANSWER_ICON = {
  correct: <CheckCircle2Icon className="size-4 text-[var(--tg)]" aria-hidden="true" />,
  incorrect: <XCircleIcon className="size-4 text-rb-cardinal" aria-hidden="true" />,
  pending: <ClockIcon className="size-4 text-amber-500" aria-hidden="true" />,
  neutral: <ClockIcon className="size-4 text-muted-foreground" aria-hidden="true" />,
}

function StatusPill({ tone, children }) {
  const tones = {
    leaf: "bg-[var(--tg-soft)] text-[var(--tg-ink)]",
    cardinal: "bg-rb-cardinal-wash text-rb-cardinal-lip",
    amber: "bg-amber-100 text-amber-800",
    neutral: "bg-muted text-muted-foreground",
  }
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold", tones[tone] ?? tones.neutral)}>
      {children}
    </span>
  )
}

function AttemptPage({ attempt, learnerId, examId, isHighest, isLatest }) {
  const inProgress = attempt.submittedAt == null
  const percentage = Number(attempt.percentage ?? 0)
  const standing = standingOf(attempt)

  const resultQuery = useQuery({
    queryKey: ["attempt-result", String(attempt.assessmentAttemptId), learnerId],
    queryFn: () => getAttemptResult(attempt.assessmentAttemptId, learnerId),
    enabled: !inProgress && learnerId != null,
    retry: 1,
    staleTime: 5 * 60_000,
  })
  const result = resultQuery.data
  const answers = result?.answers ?? []

  return (
    <div className="tg-frame">
      <div className="flex flex-wrap items-start gap-4 p-5 sm:p-6">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-rb-display text-2xl font-extrabold text-foreground">Attempt {attempt.attemptNumber}</p>
          <div className="flex flex-wrap items-center gap-2">
            {inProgress ? (
              <StatusPill tone="amber"><ClockIcon className="size-3" aria-hidden="true" />In progress</StatusPill>
            ) : standing.measured ? (
              <StatusPill tone={standing.cleared ? "leaf" : "cardinal"}>
                {standing.cleared ? <CheckCircle2Icon className="size-3" aria-hidden="true" /> : <ClockIcon className="size-3" aria-hidden="true" />}
                {standing.label}
              </StatusPill>
            ) : attempt.passed ? (
              <StatusPill tone="leaf"><CheckCircle2Icon className="size-3" aria-hidden="true" />Passed</StatusPill>
            ) : (
              <StatusPill tone="cardinal"><XCircleIcon className="size-3" aria-hidden="true" />Not passed</StatusPill>
            )}
            {isHighest ? <StatusPill tone="amber"><StarIcon className="size-3" aria-hidden="true" />Highest score</StatusPill> : null}
            {isLatest ? <StatusPill>Most recent</StatusPill> : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDate(attempt.startedAt)}
            {!inProgress ? ` · took ${formatDuration(attempt.durationSeconds)}` : null}
            {attempt.correctCount != null && attempt.itemCount != null
              ? ` · ${Number(attempt.correctCount)} of ${Number(attempt.answeredCount ?? attempt.itemCount)} correct`
              : ""}
          </p>
        </div>

        {inProgress ? null : (
          <div
            className={cn(
              "grid size-24 shrink-0 place-items-center rounded-full border-[6px] text-center",
              standing.cleared ? "border-[var(--tg)] bg-[var(--tg-softer)]" : "border-rb-cardinal/70 bg-rb-cardinal-wash",
            )}
          >
            <div>
              <p className={cn("text-2xl font-black tabular-nums leading-none", standing.cleared ? "text-[var(--tg-ink)]" : "text-rb-cardinal-lip")}>
                {standing.measured ? standing.rating.toFixed(0) : `${percentage.toFixed(0)}%`}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {standing.measured ? "of 100" : attempt.passed ? "passed" : "not passed"}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-[var(--tg-line)] px-5 py-4 sm:px-6">
        {inProgress ? (
          <p className="text-sm font-semibold text-amber-700">Still in progress. Resume it to finish.</p>
        ) : resultQuery.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((key) => <Skeleton key={key} className="h-10 w-full rounded-xl" />)}
          </div>
        ) : resultQuery.isError || !result ? (
          <p className="text-sm font-semibold text-rb-cardinal-lip">This attempt&apos;s answers could not be loaded.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <StatusPill tone="leaf">{result.correctCount ?? 0} correct</StatusPill>
              <StatusPill tone="cardinal">{result.incorrectCount ?? 0} incorrect</StatusPill>
              {result.pendingCount > 0 ? <StatusPill tone="amber">{result.pendingCount} pending</StatusPill> : null}
            </div>

            {answers.length > 0 ? (
              <ol className="mt-4 divide-y divide-[var(--tg-line)]">
                {answers.slice(0, PAGE_ANSWER_LIMIT).map((answer) => {
                  const state = answerState(answer)
                  const given = answer.selectedChoiceText || answer.learnerAnswer
                  return (
                    <li key={answer.attemptQuestionId} className="flex gap-3 py-2.5">
                      <span className="mt-0.5 shrink-0">{ANSWER_ICON[state]}</span>
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-semibold leading-5 text-foreground">
                          <span className="mr-1 text-muted-foreground">{answer.displayOrder}.</span>
                          {answer.question}
                        </p>
                        {given ? <p className="mt-0.5 truncate text-sm text-muted-foreground">Your answer: {given}</p> : null}
                        {answer.isCorrect === false && answer.correctChoiceText ? (
                          <p className="truncate text-sm font-semibold text-[var(--tg-ink)]">Correct: {answer.correctChoiceText}</p>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ol>
            ) : null}

            {answers.length > PAGE_ANSWER_LIMIT ? (
              <p className="mt-2 text-xs font-semibold text-muted-foreground">
                + {answers.length - PAGE_ANSWER_LIMIT} more questions in the full details
              </p>
            ) : null}
          </>
        )}

        <Link
          to={inProgress ? `/learner/assessments/${examId}` : `/learner/results/${attempt.assessmentAttemptId}`}
          className="tg-btn mt-4"
        >
          {inProgress ? "Resume" : "View full details"}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

export default function LearnerAssessmentHistoryPage() {
  const { examId } = useParams()
  const [selectedId, setSelectedId] = useState(null)

  const identity = getCurrentLearnerIdentity()
  const currentLearnerQuery = useQuery({
    queryKey: ["current-learner"],
    queryFn: getCurrentLearner,
    retry: 1,
    enabled: identity.learnerId == null,
  })
  const learnerId =
    identity.learnerId ?? currentLearnerQuery.data?.learnerId ?? null

  const attemptsQuery = useQuery({
    queryKey: ["assessment-attempts", examId, learnerId],
    queryFn: () => getAssessmentAttempts(examId, learnerId),
    enabled: examId != null && learnerId != null,
    retry: 1,
  })

  if (attemptsQuery.isLoading || (learnerId == null && currentLearnerQuery.isLoading)) {
    return <LoadingSignal />
  }

  const attempts = Array.isArray(attemptsQuery.data) ? attemptsQuery.data : []
  const submitted = attempts.filter((attempt) => attempt.submittedAt != null)
  const assessmentTitle = attempts[0]?.assessmentTitle ?? "Assessment"

  const ratingOf = (attempt) =>
    attempt?.proficiency?.rating == null ? null : Number(attempt.proficiency.rating)

  const highestAttempt = submitted.length
    ? submitted.reduce((best, attempt) => {
        const a = ratingOf(attempt)
        const b = ratingOf(best)
        if (a == null && b == null) {
          return Number(attempt.percentage ?? 0) > Number(best.percentage ?? 0) ? attempt : best
        }
        if (a == null) return best
        if (b == null) return attempt
        return a > b ? attempt : best
      })
    : null
  const highestAttemptId = highestAttempt?.assessmentAttemptId ?? null
  const latestAttempt = submitted.length ? submitted[0] : null
  const latestAttemptId = latestAttempt?.assessmentAttemptId ?? null

  const everCleared = submitted.some((attempt) => standingOf(attempt).cleared)
  const inProgressCount = attempts.length - submitted.length

  const chronological = [...submitted].reverse()
  // Newest first in the tabs; the newest attempt is open by default.
  const selected = attempts.find((attempt) => attempt.assessmentAttemptId === selectedId) ?? attempts[0] ?? null

  return (
    <div className="rebyu-ds tg-cat-explain min-h-dvh bg-[var(--tg-softer)] text-foreground">
      <header className="sticky top-0 z-40 border-b border-[var(--tg-line)] bg-card">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-3 px-4">
          <span className="tg-badge-icon"><HistoryIcon className="size-4" aria-hidden="true" /></span>
          <div className="min-w-0">
            <p className="tg-kicker">Attempt history</p>
            <p className="truncate font-rb-display text-lg font-extrabold text-foreground">{assessmentTitle}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        <section className="tg-frame p-5 sm:p-6">
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="font-rb-display text-3xl font-extrabold leading-tight text-foreground">{assessmentTitle}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {submitted.length} submitted attempt{submitted.length === 1 ? "" : "s"}
                {inProgressCount > 0 ? ` · ${inProgressCount} in progress` : ""}
              </p>
            </div>
            {submitted.length > 0 ? (
              <StatusPill tone={everCleared ? "leaf" : "cardinal"}>
                {everCleared ? <CheckCircle2Icon className="size-3.5" aria-hidden="true" /> : <ClockIcon className="size-3.5" aria-hidden="true" />}
                {everCleared ? "Proficient" : "Not proficient yet"}
              </StatusPill>
            ) : null}
          </div>

          {submitted.length > 0 ? (
            <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <SummaryTile
                label={ratingOf(highestAttempt) == null ? "Best score" : "Best proficiency"}
                value={
                  ratingOf(highestAttempt) == null
                    ? `${Number(highestAttempt.percentage ?? 0).toFixed(0)}%`
                    : `${ratingOf(highestAttempt).toFixed(0)} / 100`
                }
                caption={
                  ratingOf(highestAttempt) == null
                    ? `Attempt ${highestAttempt.attemptNumber}`
                    : `Attempt ${highestAttempt.attemptNumber} · ${highestAttempt.proficiency.label}`
                }
                tone={standingOf(highestAttempt).cleared ? "leaf" : "cardinal"}
              />
              <SummaryTile
                label={ratingOf(latestAttempt) == null ? "Latest score" : "Latest proficiency"}
                value={
                  ratingOf(latestAttempt) == null
                    ? `${Number(latestAttempt.percentage ?? 0).toFixed(0)}%`
                    : `${ratingOf(latestAttempt).toFixed(0)} / 100`
                }
                caption={
                  ratingOf(latestAttempt) == null
                    ? `Attempt ${latestAttempt.attemptNumber}`
                    : `Attempt ${latestAttempt.attemptNumber} · ${latestAttempt.proficiency.label}`
                }
                tone={standingOf(latestAttempt).cleared ? "leaf" : "cardinal"}
              />
              <SummaryTile label="Attempts sat" value={submitted.length} />
            </dl>
          ) : null}

          <Link to={`/learner/assessments/${examId}`} className="tg-btn tg-btn-primary mt-5 !px-5 !py-2.5">
            <RotateCcwIcon className="size-4" aria-hidden="true" />
            {inProgressCount > 0
              ? "Resume attempt"
              : submitted.length > 0
                ? "Retake assessment"
                : "Start assessment"}
          </Link>
        </section>

        <AttemptTrend attempts={chronological} />

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold text-foreground">Every attempt</h2>
            {attempts.length > 1 ? (
              <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Attempts">
                {attempts.map((attempt) => {
                  const active = attempt.assessmentAttemptId === selected?.assessmentAttemptId
                  return (
                    <button
                      key={attempt.assessmentAttemptId}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSelectedId(attempt.assessmentAttemptId)}
                      className={cn("tg-btn !rounded-full !px-3 !py-1 !text-xs", active && "tg-btn-primary")}
                    >
                      #{attempt.attemptNumber}
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>

          {attempts.length === 0 ? (
            <div className="rounded-[1rem] border-2 border-dashed border-[var(--tg-line)] bg-card px-6 py-10 text-center">
              <p className="text-base font-bold text-foreground">No attempts yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Start the assessment to begin your attempt history.</p>
            </div>
          ) : selected ? (
            <AttemptPage
              key={selected.assessmentAttemptId}
              attempt={selected}
              learnerId={learnerId}
              examId={examId}
              isHighest={selected.assessmentAttemptId === highestAttemptId && submitted.length > 1}
              isLatest={selected.assessmentAttemptId === latestAttemptId && submitted.length > 1}
            />
          ) : null}
        </section>
      </main>
    </div>
  )
}
