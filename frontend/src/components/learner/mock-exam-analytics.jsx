import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  CheckCircle2,
  Clock,
  ClipboardCheck,
  History,
  Target,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "@/components/icons"
import { Button } from "@/components/ui/button"
import { getAttemptResult } from "@/services/assessmentService.js"
import { getCurrentLearner, getCurrentLearnerIdentity } from "@/services/learnerService.js"

const MOCK_TYPES = new Set(["MOCK_EXAM", "MOCK"])

function bandColor(value) {
  if (value == null) return "var(--muted-foreground)"
  if (value >= 75) return "#2f6b4f"
  if (value >= 50) return "#3f8f6a"
  if (value >= 25) return "#c9962b"
  return "#c8553d"
}

function fmtDate(value) {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "—"
}

function fmtDuration(seconds) {
  const total = Number(seconds)
  if (!Number.isFinite(total) || total <= 0) return "—"
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  return h ? `${h}h ${m}m` : `${m}m ${Math.round(total % 60)}s`
}

function Stat({ icon: Icon, label, value, note, color }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">
        <Icon className="size-3" aria-hidden="true" /> {label}
      </p>
      <p className="mt-1 text-lg font-extrabold leading-none" style={{ color: color ?? "var(--foreground)" }}>
        {value}
      </p>
      {note ? <p className="mt-1 text-[11px] text-muted-foreground">{note}</p> : null}
    </div>
  )
}

function LessonRow({ lesson }) {
  const pct = Math.round(Number(lesson.percentage ?? 0))
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="min-w-0 truncate font-semibold text-foreground">{lesson.lessonTitle}</span>
        <span className="shrink-0 font-extrabold" style={{ color: bandColor(pct) }}>
          {lesson.correctCount ?? 0}/{lesson.itemCount ?? 0} · {pct}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: bandColor(pct) }} />
      </div>
    </div>
  )
}

/**
 * The learner's mock exam sittings for one certification: pick a sitting to see
 * its score, proficiency, right/wrong/unanswered counts, time taken and how each
 * lesson went, with a link to review every answer.
 */
export function MockExamAnalytics({ scoreTrend }) {
  const navigate = useNavigate()

  const sittings = useMemo(
    () =>
      (scoreTrend ?? [])
        .filter((point) => MOCK_TYPES.has(String(point.assessmentType ?? "").toUpperCase()))
        .filter((point) => point.assessmentAttemptId != null)
        .sort((a, b) => new Date(b.submittedAt ?? 0) - new Date(a.submittedAt ?? 0)),
    [scoreTrend],
  )

  const bestId = useMemo(() => {
    if (!sittings.length) return null
    return sittings.reduce((best, point) =>
      Number(point.percentage ?? 0) > Number(best.percentage ?? 0) ? point : best,
    ).assessmentAttemptId
  }, [sittings])

  const [selectedId, setSelectedId] = useState(null)
  useEffect(() => {
    if (selectedId == null && sittings.length) setSelectedId(sittings[0].assessmentAttemptId)
  }, [sittings, selectedId])

  const identity = useMemo(() => getCurrentLearnerIdentity(), [])
  const learnerQuery = useQuery({
    queryKey: ["current-learner"],
    queryFn: getCurrentLearner,
    enabled: !identity?.learnerId,
    staleTime: 5 * 60_000,
  })
  const learnerId = identity?.learnerId || learnerQuery.data?.learnerId || null

  const resultQuery = useQuery({
    queryKey: ["attempt-result", String(selectedId), learnerId],
    queryFn: () => getAttemptResult(selectedId, learnerId),
    enabled: selectedId != null && learnerId != null,
    staleTime: 5 * 60_000,
  })

  if (!sittings.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <Header />
        <p className="text-sm text-muted-foreground">You haven't sat the mock exam for this certification yet.</p>
      </div>
    )
  }

  const result = resultQuery.data
  const correct = result?.correctCount ?? 0
  const incorrect = result?.incorrectCount ?? 0
  const unanswered = result?.unansweredCount ?? 0
  const pending = result?.pendingCount ?? 0
  const total = correct + incorrect + unanswered + pending
  const percent = result?.percentage != null ? Math.round(Number(result.percentage)) : null
  const rating = result?.proficiency?.rating != null ? Math.round(Number(result.proficiency.rating)) : null
  const lessons = [...(result?.lessonBreakdown ?? [])].sort(
    (a, b) => Number(a.percentage ?? 0) - Number(b.percentage ?? 0),
  )
  const weakest = lessons.slice(0, 5)
  const strongest = [...lessons].reverse().filter((lesson) => Number(lesson.percentage ?? 0) >= 70).slice(0, 3)
  const examId = sittings[0].examId

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <Header
        action={
          examId != null ? (
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => navigate(`/learner/assessments/${examId}/history`)}>
              <History className="mr-1 size-3.5" /> All sittings
            </Button>
          ) : null
        }
      />

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {sittings.map((sitting, index) => {
          const pct = Math.round(Number(sitting.percentage ?? 0))
          const active = sitting.assessmentAttemptId === selectedId
          return (
            <button
              key={sitting.assessmentAttemptId}
              type="button"
              onClick={() => setSelectedId(sitting.assessmentAttemptId)}
              className={`shrink-0 rounded-lg border px-3 py-1.5 text-left transition ${
                active ? "border-[var(--color-rb-feather)] bg-[var(--color-rb-feather)]/10" : "border-border hover:bg-muted/60"
              }`}
            >
              <span className="block text-[10px] font-bold text-muted-foreground">
                {index === 0 ? "Latest" : `Sitting ${sitting.attemptNumber ?? sittings.length - index}`}
                {sitting.assessmentAttemptId === bestId ? " · best" : ""}
              </span>
              <span className="block text-sm font-extrabold" style={{ color: bandColor(pct) }}>
                {pct}%
              </span>
              <span className="block text-[10px] text-muted-foreground">{fmtDate(sitting.submittedAt)}</span>
            </button>
          )
        })}
      </div>

      {resultQuery.isLoading || learnerId == null ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[0, 1, 2, 3].map((key) => (
              <div key={key} className="h-[74px] animate-pulse rounded-lg bg-muted/40" />
            ))}
          </div>
          <div className="h-40 animate-pulse rounded-lg bg-muted/40" />
        </div>
      ) : resultQuery.isError || !result ? (
        <p className="text-sm text-muted-foreground">This sitting's details could not be loaded.</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Stat
              icon={Target}
              label="Score"
              value={percent != null ? `${percent}%` : "—"}
              note={result.passed ? "Passed" : result.passingScore != null ? `Pass mark ${Math.round(Number(result.passingScore))}%` : null}
              color={bandColor(percent)}
            />
            {rating != null ? (
              <Stat
                icon={TrendingUp}
                label="Proficiency"
                value={`${rating} / 100`}
                note={result.proficiency?.label ?? null}
                color={bandColor(rating)}
              />
            ) : (
              <Stat icon={XCircle} label="Wrong" value={incorrect} note={`of ${total} items`} color="#c8553d" />
            )}
            <Stat icon={CheckCircle2} label="Correct" value={correct} note={`of ${total} items`} color="#2f6b4f" />
            <Stat icon={Clock} label="Time taken" value={fmtDuration(result.durationSeconds)} note={fmtDate(result.submittedAt)} />
          </div>

          {total > 0 ? (
            <div>
              <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
                <div style={{ width: `${(correct / total) * 100}%`, background: "#2f6b4f" }} />
                <div style={{ width: `${(incorrect / total) * 100}%`, background: "#c8553d" }} />
                <div style={{ width: `${(pending / total) * 100}%`, background: "#c9962b" }} />
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="size-3 text-[#2f6b4f]" aria-hidden="true" /> {correct} correct
                </span>
                <span className="inline-flex items-center gap-1">
                  <XCircle className="size-3 text-[#c8553d]" aria-hidden="true" /> {incorrect} wrong
                </span>
                {unanswered ? <span>{unanswered} unanswered</span> : null}
                {pending ? <span>{pending} still being marked</span> : null}
              </div>
            </div>
          ) : null}

          {lessons.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2.5">
                <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  <TrendingDown className="size-3 text-[#c8553d]" aria-hidden="true" /> Weakest lessons
                </p>
                {weakest.map((lesson) => (
                  <LessonRow key={lesson.lessonId} lesson={lesson} />
                ))}
              </div>
              <div className="space-y-2.5">
                <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  <TrendingUp className="size-3 text-[#2f6b4f]" aria-hidden="true" /> Strongest lessons
                </p>
                {strongest.length ? (
                  strongest.map((lesson) => <LessonRow key={lesson.lessonId} lesson={lesson} />)
                ) : (
                  <p className="text-xs text-muted-foreground">No lesson reached 70% in this sitting yet.</p>
                )}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">
              See every question with your answer, the correct answer and the explanation.
            </p>
            <Button size="sm" onClick={() => navigate(`/learner/results/${selectedId}`)}>
              <ClipboardCheck className="mr-1.5 size-4" /> Review answers
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Header({ action }) {
  return (
    <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
      <ClipboardCheck className="size-4 text-[var(--color-rb-feather)]" aria-hidden="true" />
      <h3 className="flex-1 font-rb-display text-sm font-extrabold text-foreground">Mock Exam Analytics</h3>
      {action}
    </div>
  )
}
