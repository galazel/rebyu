import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  CheckCircle2Icon,
  ClockIcon,
  StarIcon,
  XCircleIcon,
} from "@/components/icons"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  Chip,
  RebyuCard,
  TactileButton,
} from "@/components/rebyu/rebyu-ui.jsx"
import {
  getCurrentLearner,
  getCurrentLearnerIdentity,
} from "@/services/learnerService.js"
import { getAssessmentAttempts, getAttemptResult } from "@/services/assessmentService.js"
import { LoadingSignal } from "@/components/loading-overlay.jsx"
import { PenCircle, PenMark } from "@/components/classroom/pen-marks.jsx"
import { TeacherStamp } from "@/components/classroom/teacher-stamp.jsx"
import { AttemptFlipbook } from "@/components/classroom/attempt-flipbook.jsx"

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

/* ------------------------------------------------------------- standing
 *
 * Proficiency is the verdict this page reports, not the pass mark.
 *
 * An adaptive sitting measures a level (0..100) and the curriculum opens on
 * that level, so a learner who reached Proficient has done the thing the
 * system asked of them -- even when the raw percentage on the day sat under
 * the paper's pass mark, which it often does, because the engine keeps
 * feeding harder items until it finds the edge of what they know. Stamping
 * "not passed" across that attempt reports a failure that the rest of the
 * system does not agree happened.
 *
 * Percentage and the pass flag remain for sittings that measured no
 * proficiency -- a fixed institution paper, or a row written before ratings
 * were recorded. There, the pass mark really is the only verdict there is.
 */

/** The rating from which a sitting counts as Proficient (see IrtModel). */
const PROFICIENT_RATING = 50

/**
 * What one attempt is worth: `{ rating, label, cleared, measured }`.
 * `cleared` is the proficiency test where there is a proficiency, and the
 * pass flag only where there is not.
 */
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

/**
 * The run of attempts, as a shape.
 *
 * A list of figures one card apart is not comparable at a glance, and
 * comparing attempts is the entire reason this page exists. Bars are in the
 * order they were sat -- oldest at the left -- so improvement reads left to
 * right, and each is coloured by whether that attempt passed rather than by
 * height, because the pass mark is the only threshold that matters here and the
 * summary payload does not carry its value.
 */
function AttemptTrend({ attempts }) {
  if (attempts.length < 2) return null

  return (
    <section className="rb-graded-sheet p-5">
      <p className="rb-graded-heading">proficiency by attempt</p>
      <div className="mt-4 flex items-end gap-2 sm:gap-3">
        {attempts.map((attempt) => {
          /* Proficiency where the sitting measured one, percentage only as a
             fallback for sittings that did not. Both are 0..100, so the run
             stays comparable either way -- but plotting raw percentage for an
             adaptive paper draws the difficulty of the draw as if it were
             progress. */
          const rating = attempt.proficiency?.rating
          const value = Math.min(100, Math.max(0,
            Number(rating ?? attempt.percentage ?? 0)))
          return (
            <div
              key={attempt.assessmentAttemptId}
              className="flex min-w-0 flex-1 flex-col items-center gap-2"
            >
              <span className="rb-numeric text-xs text-rb-wolf">
                {rating == null ? `${value.toFixed(0)}%` : value.toFixed(0)}
              </span>
              {/* Fixed-height well so every bar is measured against the same
                  100%, not against the tallest score in the run. */}
              <div className="flex h-24 w-full items-end border-b-2 border-dashed border-[#cfc6b3] px-2">
                <div
                  className={cn(
                    "w-full rounded-[6px]",
                    standingOf(attempt).cleared ? "rb-highlight-pass" : "rb-highlight-fail"
                  )}
                  /* A floor of 4px so a zero-scoring attempt is still a mark on
                     the page rather than a gap in the run. */
                  style={{ height: `max(4px, ${value}%)` }}
                />
              </div>
              <span className="text-xs font-bold text-rb-wolf">
                #{attempt.attemptNumber}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/** One figure in the summary strip. */
function SummaryTile({ label, value, caption, tone = "neutral" }) {
  /* A tally in the margin, in the teacher's pen colour for that figure. */
  return (
    <div className={cn("rb-grade-tally", `is-${tone}`)}>
      <dt>{label}</dt>
      <dd>{value}</dd>
      {caption ? <p className="rb-grade-tally-caption">{caption}</p> : null}
    </div>
  )
}

/* How many marked questions a page shows before pointing to the full result. */
const PAGE_ANSWER_LIMIT = 6

function answerMark(answer) {
  if (answer.pendingManualEvaluation) return { kind: "tilde", state: "pending" }
  if (answer.isCorrect == null) return { kind: "question", state: "neutral" }
  return answer.isCorrect ? { kind: "check", state: "correct" } : { kind: "cross", state: "incorrect" }
}

/**
 * One page of the attempt notebook: that attempt's own marked paper.
 *
 * The summary (number, status, date, points, circled score) comes from the
 * attempts list; the tallies and the marked questions are that attempt's
 * result, fetched when its page is opened. The query key is the result page's,
 * so turning to a page you have already looked at -- or opening "view details"
 * from it -- reads from cache instead of fetching again.
 */
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
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <p className="rb-graded-heading">Attempt {attempt.attemptNumber}</p>
          <div className="flex flex-wrap items-center gap-2">
            {inProgress ? (
              <Chip tone="macaw">
                <ClockIcon className="size-3" aria-hidden="true" />
                In progress
              </Chip>
            ) : standing.measured ? (
              /* The level reached, which is what the curriculum reads. */
              <Chip tone={standing.cleared ? "leaf" : "fox"}>
                {standing.cleared ? (
                  <CheckCircle2Icon className="size-3" aria-hidden="true" />
                ) : (
                  <ClockIcon className="size-3" aria-hidden="true" />
                )}
                {standing.label}
              </Chip>
            ) : attempt.passed ? (
              <Chip tone="leaf">
                <CheckCircle2Icon className="size-3" aria-hidden="true" />
                Passed
              </Chip>
            ) : (
              <Chip tone="cardinal">
                <XCircleIcon className="size-3" aria-hidden="true" />
                Not passed
              </Chip>
            )}
            {isHighest ? (
              <Chip tone="fox">
                <StarIcon className="size-3" aria-hidden="true" />
                Highest score
              </Chip>
            ) : null}
            {isLatest ? <Chip>Most recent</Chip> : null}
          </div>
          <p className="rb-caption">
            {formatDate(attempt.startedAt)}
            {!inProgress ? ` · took ${formatDuration(attempt.durationSeconds)}` : null}
          </p>
          {standing.measured ? (
            <p className="rb-pen text-lg text-[#6b706c]">
              proficiency {standing.rating.toFixed(0)} / 100 · {standing.label}
            </p>
          ) : null}
          {attempt.correctCount != null && attempt.itemCount != null ? (
            <p className="rb-pen text-lg text-[#6b706c]">
              {Number(attempt.correctCount)} of {Number(attempt.answeredCount ?? attempt.itemCount)} answered correct
              {attempt.totalPoints != null && attempt.earnedPoints != null
                ? ` · ${Number(attempt.earnedPoints)} / ${Number(attempt.totalPoints)} points`
                : ""}
            </p>
          ) : null}
        </div>

        {inProgress ? null : (
          /* Remounted with every page, so the score stamps down again each
             time a page is turned to. */
          /* Circled in the margin: the proficiency reached, or the raw
             percentage when the sitting measured none. */
          <div className={cn("rb-grade-score rb-grade-score-sm", standing.cleared ? "is-pass" : "is-fail")}>
            <PenCircle />
            <span className="rb-grade-score-value">
              {standing.measured ? standing.rating.toFixed(0) : `${percentage.toFixed(0)}%`}
            </span>
            <span className="rb-grade-score-note">
              {standing.measured ? standing.label : attempt.passed ? "passed" : "not passed"}
            </span>
          </div>
        )}
      </div>

      {inProgress ? (
        <p className="rb-pen text-2xl text-[#c97a1e]">still being written… resume it to finish.</p>
      ) : resultQuery.isLoading ? (
        <p className="rb-pen text-lg text-[#6b706c]">fetching the marked paper…</p>
      ) : resultQuery.isError || !result ? (
        <p className="rb-pen text-lg text-[#c8342b]">Couldn&apos;t load this attempt&apos;s answers.</p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rb-grade-tally is-leaf">
              <dt>Correct</dt>
              <dd>{result.correctCount ?? 0}</dd>
            </div>
            <div className="rb-grade-tally is-cardinal">
              <dt>Incorrect</dt>
              <dd>{result.incorrectCount ?? 0}</dd>
            </div>
            {result.pendingCount > 0 ? (
              <div className="rb-grade-tally is-fox">
                <dt>Pending</dt>
                <dd>{result.pendingCount}</dd>
              </div>
            ) : null}
          </dl>

          {answers.length > 0 ? (
            <ol className="space-y-2.5">
              {answers.slice(0, PAGE_ANSWER_LIMIT).map((answer) => {
                const mark = answerMark(answer)
                const given = answer.selectedChoiceText || answer.learnerAnswer
                return (
                  <li key={answer.attemptQuestionId} className={cn("rb-page-answer", `is-${mark.state}`)}>
                    <PenMark kind={mark.kind} />
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-medium leading-5 text-rb-eel">
                        <span className="mr-1 text-rb-wolf">{answer.displayOrder}.</span>
                        {answer.question}
                      </p>
                      {given ? (
                        <p className="rb-graded-answer truncate !px-0 !text-base !leading-6">{given}</p>
                      ) : null}
                      {answer.isCorrect === false && answer.correctChoiceText ? (
                        <p className="rb-pen truncate text-base text-[#c8342b]">
                          correct: {answer.correctChoiceText}
                        </p>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ol>
          ) : null}

          {answers.length > PAGE_ANSWER_LIMIT ? (
            <p className="rb-pen text-lg text-[#6b706c]">
              + {answers.length - PAGE_ANSWER_LIMIT} more questions on the full paper
            </p>
          ) : null}
        </>
      )}

      <TactileButton asChild variant="ghost" size="sm" className="w-fit">
        {inProgress ? (
          <Link to={`/learner/assessments/${examId}`}>resume</Link>
        ) : (
          <Link to={`/learner/results/${attempt.assessmentAttemptId}`}>view full details</Link>
        )}
      </TactileButton>
    </div>
  )
}

// Every retake is stored separately and never overwritten — this page lists
// the full history so a learner can compare attempts before opening one for
// full review. Highlights the highest-scoring and most recent attempts,
// since progress/analytics elsewhere may use either depending on config.
export default function LearnerAssessmentHistoryPage() {
  const { examId } = useParams()

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

  /* Ranked on proficiency, and shown as proficiency.
   *
   * The raw percentage is how many of the items served happened to be right,
   * and an adaptive paper does not serve the same items twice -- an easy run
   * scoring 80% is a weaker sitting than a hard one scoring 60%, so ordering
   * attempts by percentage ranks the luck of the draw. Proficiency is the
   * measure the engine actually produces (IrtModel.rating, 0..100) and the one
   * the curriculum gates on, so it is what "best" should mean here too.
   *
   * Percentage is kept as the sub-caption: it answers "how did that sitting
   * go", which is a fair question, just not the one the headline figure
   * should be answering. */
  const ratingOf = (attempt) =>
    attempt?.proficiency?.rating == null ? null : Number(attempt.proficiency.rating)

  const highestAttempt = submitted.length
    ? submitted.reduce((best, attempt) => {
        const a = ratingOf(attempt)
        const b = ratingOf(best)
        // Falls back to percentage only while neither sitting measured a
        // proficiency -- a fixed paper, or a row written before ratings were
        // recorded.
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

  /* Oldest first for the trend, whatever order the list arrives in: a run that
     reads right-to-left would show improvement as decline. */
  const chronological = [...submitted].reverse()

  return (
    <div className="rebyu-ds min-h-dvh bg-rb-polar text-rb-eel">
      <header className="sticky top-0 z-40 border-b-2 border-rb-swan bg-rb-snow">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-3 px-4">
          <div className="min-w-0">
            <p className="rb-eyebrow">attempt history</p>
            <p className="truncate text-sm font-bold text-rb-eel">{assessmentTitle}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        {/* The front sheet of the file: every attempt marked, a stamp once
            there is something to stamp. */}
        <section className="rb-graded-sheet p-6 sm:p-8">
          {submitted.length > 0 ? <TeacherStamp passed={everCleared} /> : null}
          <h1 className="rb-display rb-display-md pr-28 sm:pr-36">{assessmentTitle}</h1>
          <p className="rb-body mt-2 text-sm">
            {submitted.length} submitted attempt{submitted.length === 1 ? "" : "s"}
            {inProgressCount > 0 ? ` · ${inProgressCount} in progress` : ""}
            {submitted.length > 0
              ? everCleared
                ? " · proficient"
                : " · not proficient yet"
              : ""}
          </p>

          {submitted.length > 0 ? (
            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
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

          <TactileButton asChild className="mt-6">
            <Link to={`/learner/assessments/${examId}`}>
              {/* Labelled for what the button will actually do. An unfinished
                  attempt is resumed in place, not started over, and calling
                  that "retake" is how a learner ends up afraid to press it. */}
              {inProgressCount > 0
                ? "resume attempt"
                : submitted.length > 0
                  ? "retake assessment"
                  : "start assessment"}
            </Link>
          </TactileButton>
        </section>

        <AttemptTrend attempts={chronological} />

        <section className="space-y-4">
          <h2 className="rb-graded-heading">Every attempt</h2>

          {attempts.length === 0 ? (
            <div className="rb-sticky rb-sticky-yellow mx-auto max-w-md text-center">
              <span className="rb-pushpin" aria-hidden="true" />
              <p className="rb-display rb-display-sm">No attempts yet</p>
              <p className="rb-body mt-2 text-sm">
                Start the assessment to begin your attempt history.
              </p>
            </div>
          ) : (
            /* One notebook page per attempt, oldest first, opened on the most
               recent. Turning a page is how you compare attempts. */
            <AttemptFlipbook
              initialIndex={attempts.length - 1}
              pages={[...attempts].reverse().map((attempt) => {
                const inProgress = attempt.submittedAt == null
                const isHighest =
                  attempt.assessmentAttemptId === highestAttemptId && submitted.length > 1
                const isLatest =
                  attempt.assessmentAttemptId === latestAttemptId && submitted.length > 1

                return {
                  key: attempt.assessmentAttemptId,
                  tab: attempt.attemptNumber,
                  tone: inProgress ? "open" : standingOf(attempt).cleared ? "pass" : "fail",
                  label: `Attempt ${attempt.attemptNumber}`,
                  content: (
                    <AttemptPage
                      attempt={attempt}
                      learnerId={learnerId}
                      examId={examId}
                      isHighest={isHighest}
                      isLatest={isLatest}
                    />
                  ),
                }
              })}
            />
          )}
        </section>
      </main>
    </div>
  )
}
