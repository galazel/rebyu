import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"

import { AuthedImage } from "@/lib/authed-media.jsx"
import { returnPath } from "@/lib/assessment-return"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowRight,
  CheckCircle2Icon,
  ClockIcon,
  HistoryIcon,
  HourglassIcon,
  Loader2Icon,
  RotateCcwIcon,
  Trophy,
  XCircleIcon,
} from "@/components/icons"
import { toast } from "sonner"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  Chip,
  RebyuCard,
  TactileButton,
} from "@/components/rebyu/rebyu-ui.jsx"
import CodeMirrorProgrammingWorkspace from "@/components/assessments/attempt/code-mirror-programming-workspace.jsx"
import PerformanceBreakdown from "@/components/assessments/attempt/performance-breakdown.jsx"
import {
  getCurrentLearner,
  getCurrentLearnerIdentity,
} from "@/services/learnerService.js"
import {
  getAssessmentTypeLabel,
  getAttemptResult,
} from "@/services/assessmentService.js"
import { getChallengeLeaderboard } from "@/services/challengeService.js"
import LearnerPremiumGuard from "@/components/learner/learner-premium-guard.jsx"
import { StudyPlanPrompt } from "@/components/learner/study-plan-prompt.jsx"
import { FEATURES } from "@/services/subscriptionService.js"
import { LoadingSignal } from "@/components/loading-overlay.jsx"

const ANSWER_TONES = {
  correct: {
    card: "border-rb-leaf/45 bg-rb-leaf-wash",
    panel: "border-rb-leaf/45 bg-rb-leaf-wash",
    text: "text-rb-leaf",
    badge: "bg-rb-leaf text-white",
  },
  incorrect: {
    card: "border-rb-cardinal/45 bg-rb-cardinal-wash",
    panel: "border-rb-cardinal/45 bg-rb-cardinal-wash",
    text: "text-rb-cardinal-lip",
    badge: "bg-rb-cardinal text-white",
  },
  pending: {
    card: "border-rb-fox/45 bg-rb-fox-wash",
    panel: "border-rb-fox/45 bg-rb-fox-wash",
    text: "text-rb-fox-lip",
    badge: "bg-rb-fox text-white",
  },
  neutral: {
    card: "border-rb-swan bg-rb-snow",
    panel: "border-rb-swan bg-rb-polar",
    text: "text-muted-foreground",
    badge: "bg-rb-hare text-white",
  },
}

function answerState(answer) {
  if (answer.pendingManualEvaluation) return "pending"
  if (answer.isCorrect == null) return "neutral"
  return answer.isCorrect ? "correct" : "incorrect"
}

const STATE_LABEL = {
  correct: "Correct",
  incorrect: "Incorrect",
  pending: "Pending review",
  neutral: "Unanswered",
}

function formatDuration(totalSeconds) {
  if (totalSeconds == null) return "—"
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds}s`
}

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function ScoreRing({ value, cleared, top, note, mark }) {
  const ring = 2 * Math.PI * 54
  const pct = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div className="flex shrink-0 flex-col items-center">
      <div className="relative grid size-36 place-items-center">
        <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90" aria-hidden="true">
          <circle cx="60" cy="60" r="54" fill="none" stroke="var(--tg-soft)" strokeWidth="10" />
          <circle cx="60" cy="60" r="54" fill="none" stroke={cleared ? "var(--tg)" : "var(--color-rb-cardinal)"} strokeWidth="10"
                  strokeLinecap="round" strokeDasharray={ring} strokeDashoffset={ring * (1 - pct / 100)} className="transition-[stroke-dashoffset] duration-700" />
        </svg>
        <div className="text-center">
          <p className={cn("text-4xl font-black tabular-nums leading-none", cleared ? "text-[var(--tg-ink)]" : "text-rb-cardinal-lip")}>{top}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{note}</p>
        </div>
      </div>
      {mark ? <p className="mt-2 text-xs font-semibold text-muted-foreground">{mark}</p> : null}
    </div>
  )
}

function ScoreDial({ percentage, passingScore, passed }) {
  return (
    <ScoreRing
      value={percentage}
      cleared={passed}
      top={`${percentage.toFixed(0)}%`}
      note={passed ? "passed" : "not passed"}
      mark={passingScore != null ? `Pass mark ${passingScore.toFixed(0)}%` : null}
    />
  )
}

const PROFICIENCY_TONE = {
  Advanced: "is-pass",
  Proficient: "is-pass",
  Developing: "is-fail",
  Novice: "is-fail",
}

function ProficiencyDial({ rating, label }) {
  return (
    <ScoreRing
      value={rating}
      cleared={(PROFICIENCY_TONE[label] ?? "is-fail") === "is-pass"}
      top={rating.toFixed(0)}
      note={label}
      mark="Proficiency out of 100"
    />
  )
}

const PROFICIENCY_TIERS = [
  { label: "Novice", from: 0 },
  { label: "Developing", from: 25 },
  { label: "Proficient", from: 50 },
  { label: "Advanced", from: 75 },
]

const PROFICIENT_RATING = PROFICIENCY_TIERS.find((tier) => tier.label === "Proficient").from

function ProficiencyScale({ rating }) {
  return (
    <ol className="mt-3 grid grid-cols-4 gap-1" aria-label="Proficiency tiers">
      {PROFICIENCY_TIERS.map((tier, index) => {
        const to = PROFICIENCY_TIERS[index + 1]?.from ?? 100
        const active = rating >= tier.from && (index === PROFICIENCY_TIERS.length - 1 ? rating <= to : rating < to)
        return (
          <li
            key={tier.label}
            className={cn(
              "rounded-xl border px-2 py-2 text-center",
              active ? "border-[var(--tg)] bg-[var(--tg)] font-bold text-white shadow-[0_2px_0_color-mix(in_oklab,var(--tg)_55%,#000)]" : "border-[var(--tg-line)] bg-card text-muted-foreground"
            )}
            aria-current={active ? "true" : undefined}
          >
            <span className="block text-[11px] font-bold uppercase tracking-wide">{tier.label}</span>
            <span className="rb-numeric block text-xs">
              {tier.from}–{to === 100 ? 100 : to - 1}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

const STAT_COLUMNS = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
}

const STAT_TONE_TEXT = {
  leaf: "text-[var(--tg-ink)]",
  cardinal: "text-rb-cardinal-lip",
  fox: "text-amber-700",
  neutral: "text-foreground",
}

function StatTile({ label, value, tone }) {
  return (
    <div className="rounded-[1rem] border border-[var(--tg-line)] bg-card px-4 py-3">
      <dt className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={cn("mt-1 text-2xl font-black tabular-nums", STAT_TONE_TEXT[tone] ?? STAT_TONE_TEXT.neutral)}>{value ?? 0}</dd>
    </div>
  )
}

const XP_PER_PROBLEM = 100

function parseChallengeBreakdown(answers, result) {
  let totalPassed = 0, totalTests = 0
  let speedSum = 0, efficiencySum = 0, parsed = 0, worstMs = null
  let diagramMatched = 0, diagramTotal = 0, diagramParsed = 0
  const feedbacks = (answers ?? []).map((a) => a.feedback).filter(Boolean)

  for (const fb of feedbacks) {
    const m = fb.match(
      /correctness (\d+)\/(\d+).*?speed (\d+)%.*?efficiency (\d+)%(?:.*?slowest test (\d+) ms)?/
    )
    if (m) {
      totalPassed += Number(m[1])
      totalTests += Number(m[2])
      speedSum += Number(m[3])
      efficiencySum += Number(m[4])
      parsed++
      if (m[5]) worstMs = Math.max(worstMs ?? 0, Number(m[5]))
      continue
    }
    const dm = fb.match(/(\d+) of (\d+) required element/)
    if (dm) {
      diagramMatched += Number(dm[1])
      diagramTotal += Number(dm[2])
      diagramParsed++
    }
  }

  const itemCount = (result.correctCount ?? 0) + (result.incorrectCount ?? 0) + (result.unansweredCount ?? 0)
  const isBlueprint = diagramParsed > 0 && parsed === 0

  if (isBlueprint) {
    const correctnessPct = diagramTotal > 0 ? Math.round((diagramMatched / diagramTotal) * 100) : 0
    const maxXp = itemCount * XP_PER_PROBLEM
    const totalXp = Math.round((correctnessPct / 100) * maxXp)
    return { passed: diagramMatched, total: diagramTotal, correctnessPct, speedPct: 0, efficiencyPct: 0, slowestMs: null, correctnessXp: totalXp, speedXp: 0, efficiencyXp: 0, isBlueprint: true }
  }

  const passed = parsed > 0 ? totalPassed : (result.correctCount ?? 0)
  const total = parsed > 0 ? totalTests : itemCount
  const correctnessPct = total > 0 ? Math.round((passed / total) * 100) : 0
  const speedPct = parsed > 0 ? Math.round(speedSum / parsed) : 0
  const efficiencyPct = parsed > 0 ? Math.round(efficiencySum / parsed) : 0

  const maxXp = itemCount * XP_PER_PROBLEM
  const correctnessXp = Math.round((correctnessPct / 100) * 0.6 * maxXp)
  const speedXp = Math.round((speedPct / 100) * 0.2 * maxXp * (correctnessPct / 100))
  const efficiencyXp = Math.round((efficiencyPct / 100) * 0.2 * maxXp * (correctnessPct / 100))

  return { passed, total, correctnessPct, speedPct, efficiencyPct, slowestMs: worstMs, correctnessXp, speedXp, efficiencyXp, isBlueprint: false }
}

const CHALLENGE_TONE_BG = {
  leaf: "border-rb-leaf/40 bg-rb-leaf-wash",
  macaw: "border-rb-macaw/40 bg-rb-macaw-wash",
  bee: "border-rb-bee/40 bg-rb-bee-wash",
}

function ChallengeScoreTile({ label, value, total, unit, tone }) {
  return (
    <div className={cn("rounded-2xl border-2 p-4 text-center", CHALLENGE_TONE_BG[tone] ?? "border-rb-swan bg-rb-polar")}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-rb-display text-2xl font-extrabold tabular-nums text-foreground">
        {value}{total != null ? <span className="text-base text-muted-foreground"> / {total}</span> : null}
      </p>
      <p className="mt-0.5 text-[10px] font-semibold text-muted-foreground">{unit}</p>
    </div>
  )
}

const DIFFICULTY_TONES = {
  EASY: "border-rb-feather/50 bg-rb-feather-wash text-rb-feather-lip",
  AVERAGE: "border-rb-bee/60 bg-rb-bee-wash text-foreground",
  HARD: "border-rb-cardinal/50 bg-rb-cardinal-wash text-rb-cardinal-lip",
}

function DifficultyChip({ level }) {
  const key = String(level ?? "").trim().toUpperCase()
  if (!key) return null
  const tone = DIFFICULTY_TONES[key] ?? "border-rb-swan bg-rb-snow text-muted-foreground"
  return (
    <span
      className={cn(
        "ml-2 inline-block rounded-full border px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide",
        tone
      )}
    >
      {key.charAt(0) + key.slice(1).toLowerCase()}
    </span>
  )
}

export default function LearnerAssessmentResultPage() {
  const { examResultId: attemptId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const resumePath = returnPath(location)

  const [reviewFilter, setReviewFilter] = useState("all")
  const fromChallengeState = location.state?.fromChallenge === true
  const isWorldCup = location.state?.isWorldCup === true

  const identity = getCurrentLearnerIdentity()
  const currentLearnerQuery = useQuery({
    queryKey: ["current-learner"],
    queryFn: getCurrentLearner,
    retry: 1,
    enabled: identity.learnerId == null,
  })
  const learnerId =
    identity.learnerId ?? currentLearnerQuery.data?.learnerId ?? null

  const resultQuery = useQuery({
    queryKey: ["attempt-result", attemptId, learnerId],
    queryFn: () => getAttemptResult(attemptId, learnerId),
    enabled: attemptId != null && learnerId != null,
    retry: 1,
    refetchInterval: (query) => (query.state.data?.gradingPending ? 2500 : false),
    refetchIntervalInBackground: false,
  })

  const result = resultQuery.data
  const fromChallenge = fromChallengeState || String(result?.assessmentType ?? "").toUpperCase() === "CHALLENGE"

  const leaderboardQuery = useQuery({
    queryKey: ["challenge-leaderboard"],
    queryFn: () => getChallengeLeaderboard(10),
    enabled: fromChallenge,
    staleTime: 30_000,
  })

  const backPath =
    resumePath ??
    (result?.certificationId != null ? `/learner/learning/${result.certificationId}` : "/learner/learning")
  const marking = Boolean(result?.gradingPending)
  const wasMarkingRef = useRef(false)
  useEffect(() => {
    if (marking) wasMarkingRef.current = true
    else if (wasMarkingRef.current && result) {
      wasMarkingRef.current = false
      toast.success(
        result.proficiency
          ? `All marked — proficiency ${Number(result.proficiency.rating).toFixed(0)} / 100, ${result.correctCount} of ${result.correctCount + result.incorrectCount} right`
          : `All marked — final score ${Number(result.percentage ?? 0).toFixed(0)}%`
      )
    }
  }, [marking, result])
  const answers = useMemo(() => result?.answers ?? [], [result])

  const counts = useMemo(() => {
    const tally = { all: answers.length, correct: 0, incorrect: 0, pending: 0, neutral: 0 }
    answers.forEach((answer) => {
      tally[answerState(answer)] += 1
    })
    return tally
  }, [answers])

  const visibleAnswers = useMemo(
    () =>
      reviewFilter === "all"
        ? answers
        : answers.filter((answer) => answerState(answer) === reviewFilter),
    [answers, reviewFilter]
  )

  if (resultQuery.isLoading || (learnerId == null && currentLearnerQuery.isLoading)) {
    return <LoadingSignal />
  }

  if (resultQuery.isError || !result) {
    return (
      <div className="rebyu-ds flex min-h-dvh items-center justify-center bg-rb-polar p-6">
        <RebyuCard className="max-w-md p-8 text-center">
          <p className="text-lg font-bold text-foreground">Unable to load this result</p>
          <p className="rb-body mt-2 text-sm">
            The result may not exist, or the backend is unavailable.
          </p>
          <TactileButton
            variant="ghost"
            className="mt-6 w-full"
            onClick={() => navigate("/learner/progress")}
          >
            back to progress
          </TactileButton>
        </RebyuCard>
      </div>
    )
  }

  const percentage = Number(result.percentage ?? 0)

  const rawPassingScore = Number(result.passingScore)
  const passingScore =
    result.passingScore != null && Number.isFinite(rawPassingScore) ? rawPassingScore : null

  const proficiency = result.proficiency ?? null
  const proficiencyRating = proficiency ? toNumber(proficiency.rating) : null
  const correctCount = Number(result.correctCount ?? 0)
  const answeredCount = // eslint-disable-line no-unused-vars
    Number(result.correctCount ?? 0) + Number(result.incorrectCount ?? 0) + Number(result.pendingCount ?? 0)
  const itemCount = answeredCount + Number(result.unansweredCount ?? 0)

  const statTiles = [
    { label: "Correct", value: result.correctCount, tone: "leaf" },
    { label: "Incorrect", value: result.incorrectCount, tone: "cardinal" },
    { label: marking ? "Marking" : "Pending", value: result.pendingCount, tone: "fox" },
    { label: "Unanswered", value: result.unansweredCount, tone: "neutral" },
  ].filter((tile) => tile.tone === "leaf" || tile.tone === "cardinal" || tile.value > 0)

  const REVIEW_FILTERS = [
    { key: "all", label: "All", count: counts.all, tone: "neutral" },
    { key: "incorrect", label: "Incorrect", count: counts.incorrect, tone: "cardinal" },
    { key: "pending", label: "Pending", count: counts.pending, tone: "fox" },
    { key: "neutral", label: "Unanswered", count: counts.neutral, tone: "neutral" },
    { key: "correct", label: "Correct", count: counts.correct, tone: "leaf" },
  ].filter((option) => option.key === "all" || option.count > 0)

  return (
    <div className="rebyu-ds tg-cat-explain min-h-dvh bg-[var(--tg-softer)] text-foreground">
      <header className="sticky top-0 z-40 border-b border-[var(--tg-line)] bg-card">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-3 px-4">
          <span className="tg-badge-icon"><Trophy className="size-4" aria-hidden="true" /></span>
          <div className="min-w-0">
            <p className="tg-kicker">Attempt result</p>
            <p className="truncate font-rb-display text-lg font-extrabold text-foreground">
              {result.assessmentTitle}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        {fromChallenge ? (
          <>
            <RebyuCard className="p-6">
              <h1 className="font-rb-display text-2xl font-extrabold lowercase text-foreground">
                {result.assessmentTitle}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Chip tone="macaw">Challenge</Chip>
                <Chip>Attempt {result.attemptNumber}</Chip>
                <Chip>
                  <ClockIcon className="size-3.5" aria-hidden="true" />
                  {formatDuration(result.durationSeconds)}
                </Chip>
              </div>

              {(() => {
                const breakdown = parseChallengeBreakdown(answers, result)
                const totalXp = breakdown.correctnessXp + breakdown.speedXp + breakdown.efficiencyXp
                return (
                  <>
                    <div className="mt-6 flex items-center justify-center">
                      <div className="text-center">
                        <p className="font-rb-display text-5xl font-extrabold tabular-nums text-foreground">
                          {totalXp}
                        </p>
                        <p className="mt-1 text-sm font-bold text-muted-foreground">
                          xp earned
                        </p>
                      </div>
                    </div>

                    {breakdown.isBlueprint ? (
                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <ChallengeScoreTile
                          label="Accuracy"
                          value={`${breakdown.correctnessPct}%`}
                          total={null}
                          unit={`${breakdown.passed}/${breakdown.total} elements matched`}
                          tone="leaf"
                        />
                        <ChallengeScoreTile
                          label="Time"
                          value={formatDuration(result.durationSeconds)}
                          total={null}
                          unit={`Attempt ${result.attemptNumber}`}
                          tone="macaw"
                        />
                      </div>
                    ) : (
                      <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <ChallengeScoreTile
                          label="Correctness"
                          value={`${breakdown.correctnessXp}`}
                          total={null}
                          unit={`${breakdown.passed}/${breakdown.total} solved · ${breakdown.correctnessPct}%`}
                          tone="leaf"
                        />
                        <ChallengeScoreTile
                          label="Speed"
                          value={`${breakdown.speedXp}`}
                          total={null}
                          unit={`${breakdown.speedPct}% · ${formatDuration(result.durationSeconds)}`}
                          tone="macaw"
                        />
                        <ChallengeScoreTile
                          label="Efficiency"
                          value={`${breakdown.efficiencyXp}`}
                          total={null}
                          unit={`${breakdown.efficiencyPct}%${breakdown.slowestMs != null ? ` · ${breakdown.slowestMs}ms` : ""}`}
                          tone="bee"
                        />
                      </div>
                    )}
                  </>
                )
              })()}

              {marking ? (
                <p className="rb-caption mt-4 flex items-start gap-2 rounded-rb-tile border-2 border-rb-feather/40 bg-rb-feather-wash p-3 text-rb-feather-ink" role="status" aria-live="polite">
                  <Loader2Icon className="mt-0.5 size-3.5 shrink-0 animate-spin" aria-hidden="true" />
                  Grading your code… this usually takes under a minute.
                </p>
              ) : null}
            </RebyuCard>

            <RebyuCard className="p-5">
              <div className="flex items-center gap-2">
                <Trophy className="size-5 text-rb-bee" aria-hidden="true" />
                <h2 className="font-rb-display text-base font-extrabold lowercase text-foreground">
                  standings
                </h2>
              </div>
              {leaderboardQuery.isLoading ? (
                <div className="mt-4 flex items-center justify-center py-6 text-sm text-muted-foreground">
                  Loading leaderboard...
                </div>
              ) : (
                <div className="mt-4 space-y-1.5">
                  {(leaderboardQuery.data ?? []).map((row, i) => (
                    <div
                      key={row.rank ?? i}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm",
                        row.you
                          ? "border-2 border-rb-macaw/40 bg-rb-macaw-wash font-bold"
                          : "bg-rb-polar"
                      )}
                    >
                      <span className="w-6 text-center font-rb-display text-base font-extrabold text-muted-foreground">
                        {row.rank ?? i + 1}
                      </span>
                      <span className="flex-1 truncate text-foreground">
                        {row.name ?? "Learner"}
                        {row.you ? " (you)" : ""}
                      </span>
                      <span className="font-rb-display font-extrabold tabular-nums text-foreground">
                        {row.points ?? 0}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">pts</span>
                    </div>
                  ))}
                  {(leaderboardQuery.data ?? []).length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No standings yet — be the first!
                    </p>
                  )}
                </div>
              )}
            </RebyuCard>

            <div className="flex flex-wrap gap-3">
              <TactileButton asChild>
                <Link to={isWorldCup ? "/learner/challenges/world-cup" : "/learner/challenges"}>
                  {isWorldCup ? "back to bracket" : "back to arenas"}
                </Link>
              </TactileButton>
              {!isWorldCup && (
                <TactileButton asChild variant="ghost">
                  <Link to={`/learner/assessments/${result.assessmentId}`}>
                    retake challenge
                  </Link>
                </TactileButton>
              )}
            </div>
          </>
        ) : (
          <>
        <section className="tg-frame p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="tg-chip">{getAssessmentTypeLabel(result.assessmentType)}</span>
            <span className="tg-chip">Attempt {result.attemptNumber}</span>
            <span className="tg-chip inline-flex items-center gap-1">
              <ClockIcon className="size-3" aria-hidden="true" />
              {formatDuration(result.durationSeconds)}
            </span>
            {(proficiencyRating != null ? proficiencyRating >= PROFICIENT_RATING : Boolean(result.passed)) ? (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[var(--tg)] px-3 py-1 text-xs font-bold text-white">
                <CheckCircle2Icon className="size-3.5" aria-hidden="true" />Passed
              </span>
            ) : (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-rb-cardinal-wash px-3 py-1 text-xs font-bold text-rb-cardinal-lip">
                <HourglassIcon className="size-3.5" aria-hidden="true" />Keep going
              </span>
            )}
          </div>

          <h1 className="mt-4 font-rb-display text-3xl font-extrabold leading-tight text-foreground">{result.assessmentTitle}</h1>

          <div className="mt-7 flex flex-col items-center gap-7 sm:flex-row sm:items-start">
            {proficiencyRating != null ? (
              <ProficiencyDial rating={proficiencyRating} label={proficiency.label} />
            ) : (
              <ScoreDial
                percentage={percentage}
                passingScore={passingScore}
                passed={Boolean(result.passed)}
              />
            )}

            <div className="min-w-0 flex-1 space-y-5">
              {proficiencyRating != null ? (
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {proficiency.label} — proficiency {proficiencyRating.toFixed(0)} out of 100
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your skill level based on the difficulty of the questions you answered correctly.
                    {marking ? " It may still change while the last answers are marked." : ""}
                  </p>
                  <ProficiencyScale rating={proficiencyRating} />
                  <details className="mt-3 rounded-xl border border-[var(--tg-line)] bg-[var(--tg-softer)] px-3 py-2 text-sm text-foreground">
                    <summary className="cursor-pointer font-bold">How is this different from my correct answers?</summary>
                    <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                      <p>
                        Everyone starts at 50. Each answer moves the rating up or down, and how far depends on how
                        surprising it was: a hard question answered right moves it up a lot, an easy question answered
                        wrong moves it down a lot, and an expected result moves it only a little.
                      </p>
                      <p>
                        So the rating measures the level of questions you can handle, not the share you got right.
                        {correctCount === 0
                          ? " Getting none right lowers it with every answer, but it settles near the bottom rather than at exactly 0 — the questions were already being chosen at your level."
                          : ""}
                        {" "}The tally beside it is the plain count.
                      </p>
                      <p>
                        Written, code and diagram answers count for the share they earned — a half-right diagram
                        is half an item for the rating and the percentage, though it only joins the correct tally
                        at 60% or more. Every other question is simply right or wrong.
                      </p>
                    </div>
                  </details>
                </div>
              ) : (
                <div>
                  {passingScore != null ? (
                    <>
                      <p className="text-lg font-bold text-foreground">
                        {result.passed
                          ? `Cleared the ${passingScore.toFixed(0)}% mark`
                          : `${(passingScore - percentage).toFixed(0)}% short of the ${passingScore.toFixed(0)}% mark`}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {result.passed
                          ? `You scored ${percentage.toFixed(0)}%, ${(percentage - passingScore).toFixed(0)} percentage points above the passing score.`
                          : `You scored ${percentage.toFixed(0)}%. The pass mark is written under the score.`}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      This assessment has no passing score set.
                    </p>
                  )}
                  <p className="mt-2 text-sm font-bold text-foreground" data-testid="real-score">
                    <span className="rb-numeric">{correctCount}</span>
                    <span className="text-muted-foreground"> of {itemCount} correct</span>
                    {result.totalPoints != null && result.earnedPoints != null ? (
                      <span className="text-muted-foreground">
                        {" "}· <span className="rb-numeric text-foreground">{Number(result.earnedPoints)}</span> / {Number(result.totalPoints)} points
                      </span>
                    ) : null}
                  </p>
                </div>
              )}

              <dl className={cn("grid grid-cols-2 gap-3", STAT_COLUMNS[statTiles.length])}>
                {statTiles.map((tile) => (
                  <StatTile
                    key={tile.label}
                    label={tile.label}
                    value={tile.value}
                    tone={tile.tone}
                  />
                ))}
              </dl>
            </div>
          </div>

          {marking ? (
            <p className="mt-6 flex items-start gap-2 rounded-xl border border-[var(--tg-line)] bg-[var(--tg-softer)] p-3 text-sm text-[var(--tg-ink)]" role="status" aria-live="polite">
              <Loader2Icon className="mt-0.5 size-3.5 shrink-0 animate-spin" aria-hidden="true" />
              Marking your {result.pendingCount} code, diagram or written {result.pendingCount === 1 ? "answer" : "answers"}…
              this usually takes under a minute. The score above is provisional and updates here as each one lands.
            </p>
          ) : result.pendingCount > 0 ? (
            <p className="mt-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <HourglassIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {result.pendingCount} written, code, or diagram response(s) await
              manual evaluation and are not included in the automatic score yet.
            </p>
          ) : null}
        </section>
          </>
        )}

        {!fromChallenge && (
          <>
        <StudyPlanPrompt
          certificationId={result.certificationId}
          enabled={result.assessmentType === "DIAGNOSTIC"}
        />

        {result.assessmentType === "DIAGNOSTIC" ? (
          <div className="flex items-start gap-2.5 rounded-rb-card border-2 border-rb-leaf/45 bg-rb-leaf-wash p-4 text-sm">
            <CheckCircle2Icon
              className="mt-0.5 size-4 shrink-0 text-rb-leaf"
              aria-hidden="true"
            />
            <p className="text-foreground">
              You've completed the diagnostic — your lesson content is now
              unlocked. Focus first on the recommended review topics below.
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">

          <Link to={backPath} className="tg-btn tg-btn-primary !px-5 !py-2.5">
            Continue learning
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          {result.assessmentType !== "DIAGNOSTIC" ? (
            <>
              <Link to={`/learner/assessments/${result.assessmentId}`} className="tg-btn !px-5 !py-2.5">
                <RotateCcwIcon className="size-4" aria-hidden="true" />
                Retake assessment
              </Link>
              <Link to={`/learner/assessments/${result.assessmentId}/history`} className="tg-btn !px-5 !py-2.5">
                <HistoryIcon className="size-4" aria-hidden="true" />
                View all attempts
              </Link>
            </>
          ) : null}
        </div>

        <LearnerPremiumGuard
          feature={FEATURES.READINESS_ANALYSIS}
          certificationId={result.certificationId}
          compact
          title="Advanced result insights"
          description="Unlock weakness analysis, detailed performance breakdowns, readiness insights, and deeper attempt comparisons with Pro or institution access."
        >
          <PerformanceBreakdown lessonBreakdown={result.lessonBreakdown} />
        </LearnerPremiumGuard>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-foreground">Answer review</h2>
            {REVIEW_FILTERS.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {REVIEW_FILTERS.map((option) => {
                  const active = reviewFilter === option.key
                  return (
                    <button
                      key={option.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setReviewFilter(option.key)}
                      className={cn(
                        "tg-btn !rounded-full !px-3 !py-1.5 !text-xs",
                        active && "tg-btn-primary"
                      )}
                    >
                      {option.label}
                      <span className="rb-numeric text-xs opacity-70">
                        {option.count}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>

          {visibleAnswers.length === 0 ? (
            <div className="rounded-[1rem] border-2 border-dashed border-[var(--tg-line)] bg-card py-10 text-center">
              <p className="text-sm text-muted-foreground">Nothing in this group.</p>
            </div>
          ) : null}

          <ol className="space-y-3">
            {visibleAnswers.map((answer) => {
              const state = answerState(answer)
              const tone = ANSWER_TONES[state]
              return (
              <li key={answer.attemptQuestionId}>
                <div
                  className={cn(
                    "rounded-[1rem] border border-l-4 bg-card p-4 sm:p-5",
                    state === "correct"
                      ? "border-[var(--tg-line)] border-l-[var(--tg)]"
                      : state === "incorrect"
                        ? "border-[var(--tg-line)] border-l-rb-cardinal"
                        : state === "pending"
                          ? "border-[var(--tg-line)] border-l-amber-400"
                          : "border-[var(--tg-line)] border-l-muted-foreground/40",
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="flex min-w-0 gap-3 text-sm font-medium leading-6 text-foreground">
                        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[var(--tg-soft)] text-xs font-extrabold tabular-nums text-[var(--tg-ink)]">
                          {answer.displayOrder}
                        </span>
                        <span className="min-w-0">
                          {answer.question}
                          {answer.difficultyLevel ? (
                            <DifficultyChip level={answer.difficultyLevel} />
                          ) : null}
                        </span>
                      </p>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
                            state === "correct"
                              ? "bg-[var(--tg-soft)] text-[var(--tg-ink)]"
                              : state === "incorrect"
                                ? "bg-rb-cardinal-wash text-rb-cardinal-lip"
                                : state === "pending"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-muted text-muted-foreground",
                          )}
                        >
                          {state === "correct" ? <CheckCircle2Icon className="size-3.5" aria-hidden="true" /> : state === "incorrect" ? <XCircleIcon className="size-3.5" aria-hidden="true" /> : <HourglassIcon className="size-3.5" aria-hidden="true" />}
                          {state === "pending" && marking ? "Marking…" : STATE_LABEL[state]}
                        </span>
                        {answer.points != null && answer.credit != null ? (
                          <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                            {Number((Number(answer.credit) * Number(answer.points)).toFixed(2))} / {Number(answer.points)} pts
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <AuthedImage
                      imageKey={answer.questionImageKey}
                      alt="Question reference"
                      zoomable
                      className="max-h-80 w-auto rounded-xl border border-rb-swan"
                    />
                    {answer.choiceImages?.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {answer.choiceImages.map((choice) => (
                          <AuthedImage
                            key={choice.choiceId}
                            imageKey={choice.imageKey}
                            alt=""
                            zoomable
                            className="max-h-40 rounded-lg border border-rb-swan"
                          />
                        ))}
                      </div>
                    ) : null}

                    {answer.selectedChoiceText ? (
                      <div className="space-y-2 text-sm">
                        <p className="text-foreground">
                          <span className="text-muted-foreground">Your answer: </span>
                          {answer.selectedChoiceText}
                        </p>
                        {answer.isCorrect === false && answer.correctChoiceText ? (
                          <p className="rounded-xl bg-[var(--tg-softer)] px-3 py-2 text-[var(--tg-ink)]">
                            <span className="font-bold">
                              Correct answer:{" "}
                            </span>
                            {answer.correctChoiceText}
                          </p>
                        ) : null}
                        {answer.explanation ? (
                          <div className="rounded-xl border border-[var(--tg-line)] bg-[var(--tg-softer)] px-3 py-2.5">
                            <p className={cn("text-xs font-bold", tone.text)}>
                              Explanation
                            </p>
                            <p className="mt-1 text-muted-foreground">{answer.explanation}</p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {answer.subQuestionAnswers?.length > 0 ? (
                      <ol className="space-y-2.5 text-sm">
                        {answer.subQuestionAnswers.map((sub, index) => (
                          <li
                            key={sub.subQuestionId}
                            className="rounded-rb-tile border border-[var(--tg-line)] bg-card p-3"
                          >
                            <p className="font-bold text-foreground">
                              <span className="mr-1.5 text-muted-foreground">{index + 1}.</span>
                              {sub.questionText}
                            </p>
                            <p className="mt-1.5 whitespace-pre-wrap rounded-xl bg-[var(--tg-softer)] p-2.5 text-muted-foreground">
                              {sub.learnerAnswer?.trim()
                                ? sub.learnerAnswer
                                : "No answer submitted."}
                            </p>
                            {sub.earnedPoints != null && sub.maxPoints != null && Number(sub.maxPoints) > 0 ? (
                              <p className="rb-numeric mt-1.5 text-xs text-muted-foreground">
                                {Math.round((Number(sub.earnedPoints) / Number(sub.maxPoints)) * 100)}% credit for this part
                              </p>
                            ) : null}
                            {sub.feedback ? (
                              <p className="mt-1 text-sm text-muted-foreground">{sub.feedback}</p>
                            ) : null}
                          </li>
                        ))}
                      </ol>
                    ) : answer.learnerAnswer && !answer.selectedChoiceText ? (
                      <div className="space-y-2 text-sm">
                        <p className="text-muted-foreground">Your answer:</p>
                        <p className="whitespace-pre-wrap rounded-xl bg-muted/50 p-3 text-foreground">
                          {answer.learnerAnswer}
                        </p>

                        {answer.isCorrect === false && answer.correctChoiceText ? (
                          <p className="rounded-xl bg-[var(--tg-softer)] px-3 py-2 text-[var(--tg-ink)]">
                            <span className="font-bold">
                              Correct answer:{" "}
                            </span>
                            {answer.correctChoiceText}
                          </p>
                        ) : null}

                        {answer.explanation ? (
                          <div className="rounded-xl border border-[var(--tg-line)] bg-[var(--tg-softer)] px-3 py-2.5">
                            <p className={cn("text-xs font-bold", tone.text)}>
                              Explanation
                            </p>
                            <p className="mt-1 text-muted-foreground">{answer.explanation}</p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {answer.feedback ? (
                      <div className="rounded-xl border border-[var(--tg-line)] bg-[var(--tg-softer)] px-3 py-2.5 text-sm">
                        <p className={cn("text-xs font-bold", tone.text)}>Feedback</p>
                        <p className="mt-1 text-muted-foreground">{answer.feedback}</p>
                      </div>
                    ) : null}

                    {answer.submittedCode ? (
                      <div className="text-sm">
                        <p className="mb-2 text-muted-foreground">
                          Your code ({answer.programmingLanguage ?? "code"}):
                        </p>
                        <div className="h-64 overflow-hidden rounded-xl border border-[var(--tg-line)]">
                          <CodeMirrorProgrammingWorkspace
                            value={answer.submittedCode}
                            language={answer.programmingLanguage ?? "Java"}
                            readOnly
                          />
                        </div>
                      </div>
                    ) : null}

                    {answer.submittedCode && (answer.programOutput != null || answer.programError) ? (
                      <div className="text-sm">
                        <p className="mb-2 text-muted-foreground">Your program's output:</p>
                        <div className="overflow-hidden rounded-rb-tile bg-[#22302a] text-[#e6eee8]">
                          <div className="max-h-56 overflow-auto px-3 py-2.5 font-mono text-xs leading-5">
                            {answer.programOutput ? (
                              <pre className="whitespace-pre-wrap">{answer.programOutput}</pre>
                            ) : null}
                            {answer.programError ? (
                              <pre className="mt-1 whitespace-pre-wrap text-[#ff9d92]">{answer.programError}</pre>
                            ) : null}
                            {!answer.programOutput && !answer.programError ? (
                              <pre className="whitespace-pre-wrap text-white/60">(your program printed nothing)</pre>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : null}


                    {answer.programmingTests?.length > 0 ? (
                      <div className="space-y-2 text-sm">
                        <p className="text-muted-foreground">
                          Test cases —{" "}
                          {answer.programmingTests.filter((test) => test.passed).length} of{" "}
                          {answer.programmingTests.length} passed:
                        </p>
                        <ul className="space-y-1.5">
                          {answer.programmingTests.map((test) => (
                            <li
                              key={test.index}
                              className={cn(
                                "flex items-start gap-2 rounded-rb-tile border-2 p-2.5",
                                test.passed
                                  ? ANSWER_TONES.correct.panel
                                  : ANSWER_TONES.incorrect.panel
                              )}
                            >
                              {test.passed ? (
                                <CheckCircle2Icon
                                  className="mt-0.5 size-4 shrink-0 text-rb-leaf"
                                  aria-hidden="true"
                                />
                              ) : (
                                <XCircleIcon
                                  className="mt-0.5 size-4 shrink-0 text-rb-cardinal"
                                  aria-hidden="true"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="flex flex-wrap items-center gap-1.5 font-bold text-foreground">
                                  <span className="rounded-rb-control border border-[var(--tg-line)] bg-card px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                    {test.sample ? "Sample" : "Hidden"}
                                  </span>
                                  {test.label}
                                  {test.status && test.status !== "PASSED" && test.status !== "FAILED" ? (
                                    <span className="text-xs font-semibold text-rb-cardinal-lip">
                                      {test.status.replaceAll("_", " ").toLowerCase()}
                                    </span>
                                  ) : null}
                                </p>

                                {test.input != null ||
                                test.expectedOutput != null ||
                                test.actualOutput != null ? (
                                  <dl className="mt-1.5 space-y-1 text-xs">
                                    {test.input != null ? (
                                      <div>
                                        <dt className="font-bold text-muted-foreground">Input</dt>
                                        <dd className="mt-0.5 overflow-x-auto whitespace-pre-wrap break-words rounded-rb-control bg-rb-snow p-1.5 font-mono text-foreground">
                                          {test.input}
                                        </dd>
                                      </div>
                                    ) : null}
                                    {test.expectedOutput != null ? (
                                      <div>
                                        <dt className="font-bold text-muted-foreground">Expected output</dt>
                                        <dd className="mt-0.5 overflow-x-auto whitespace-pre-wrap break-words rounded-rb-control bg-rb-snow p-1.5 font-mono text-foreground">
                                          {test.expectedOutput}
                                        </dd>
                                      </div>
                                    ) : null}
                                    {test.actualOutput != null ? (
                                      <div>
                                        <dt className="font-bold text-muted-foreground">Your output</dt>
                                        <dd className="mt-0.5 overflow-x-auto whitespace-pre-wrap break-words rounded-rb-control bg-rb-snow p-1.5 font-mono text-foreground">
                                          {test.actualOutput}
                                        </dd>
                                      </div>
                                    ) : null}
                                  </dl>
                                ) : null}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {answer.diagramSubmitted && answer.diagramElements?.length > 0 ? (
                      <div className="space-y-2 text-sm">
                        <p className="text-muted-foreground">
                          Diagram comparison — required elements vs. what you drew:
                        </p>
                        <ul className="space-y-1.5">
                          {answer.diagramElements.map((element, index) => (
                            <li
                              key={index}
                              className={cn(
                                "flex items-start gap-2 rounded-rb-tile border-2 p-2.5",
                                element.matchQuality === "OPTIONAL"
                                  ? ANSWER_TONES.neutral.panel
                                  : element.matched
                                    ? ANSWER_TONES.correct.panel
                                    : ANSWER_TONES.incorrect.panel
                              )}
                            >
                              {element.matchQuality === "OPTIONAL" && !element.matched ? (
                                <span
                                  className="mt-1.5 size-2.5 shrink-0 rounded-full border-2 border-rb-hare"
                                  aria-hidden="true"
                                />
                              ) : element.matched ? (
                                <CheckCircle2Icon
                                  className="mt-0.5 size-4 shrink-0 text-rb-leaf"
                                  aria-hidden="true"
                                />
                              ) : (
                                <XCircleIcon
                                  className="mt-0.5 size-4 shrink-0 text-rb-cardinal"
                                  aria-hidden="true"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="flex flex-wrap items-center gap-1.5 font-bold text-foreground">
                                  <span className="rounded-rb-control border border-[var(--tg-line)] bg-card px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                    {element.kind === "EDGE"
                                      ? "Relationship"
                                      : element.kind === "ATTRIBUTE"
                                        ? "Attribute"
                                        : "Node"}
                                  </span>
                                  {element.expectedDescription}
                                  {element.matchQuality === "OPTIONAL" ? (
                                    <span className="rounded-rb-control bg-rb-swan px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                                      Optional
                                    </span>
                                  ) : null}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {element.matched
                                    ? `You drew: ${element.learnerDescription}`
                                    : element.matchQuality === "OPTIONAL"
                                      ? "Not in your diagram -- not required"
                                      : "Missing from your diagram"}
                                  {element.earnedPoints != null && element.maxPoints != null && Number(element.maxPoints) > 0
                                    ? ` · ${Math.round((Number(element.earnedPoints) / Number(element.maxPoints)) * 100)}% credit`
                                    : ""}
                                </p>

                                {element.reason &&
                                !(element.matched && element.matchQuality === "STRONG") ? (
                                  <p className="mt-1 text-xs font-semibold text-foreground">
                                    {element.reason}
                                  </p>
                                ) : null}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : answer.diagramSubmitted ? (
                      <p className="text-sm text-muted-foreground">
                        A diagram answer was submitted and stored for review.
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
              )
            })}
          </ol>
        </section>
          </>
        )}
      </main>
    </div>
  )
}
