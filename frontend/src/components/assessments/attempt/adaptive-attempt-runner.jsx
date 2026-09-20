import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Loader2,
  LogOut,
  Sparkles,
  XCircle,
} from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { answerAdaptiveItems } from "@/services/assessmentService.js"
import { getFileViewUrl } from "@/services/fileService.js"
import { cn } from "@/lib/utils"

import ProgrammingQuestionLayout from "./programming-question-layout.jsx"
import DiagramQuestionLayout from "./diagram-question-layout.jsx"
import { FinalRoundInterstitial } from "./final-round-interstitial.jsx"

/**
 * The adaptive assessment, one question at a time.
 *
 * Nothing here is a list: the learner sees the question the engine chose,
 * answers it, sees at once whether it was right (main round), and the next
 * question -- chosen from that answer -- takes its place. There is no
 * navigator, no flagging, no skipping and no going back, because the
 * sequence does not exist until it is walked.
 *
 *   ANSWERING -> GRADING -> REVEALED -> (Next) ANSWERING ...
 *                                    -> FINAL_INTRO -> ANSWERING (final) ...
 *                                    -> COMPLETED -> the page submits.
 *
 * Final-round items (programming, diagram, critical thinking) are saved as
 * they are answered and marked together at submit, so there is no verdict
 * between them -- "Submit answer" simply moves on.
 */
export function AdaptiveAttemptRunner({
  attempt,
  learnerId,
  remainingSeconds,
  timeUp,
  onFinish,
  onLeave,
  isSubmitting,
  toDraftDto,
  isMultipleChoice,
  WorkspaceQuestionPanel,
}) {
  const initialProgress = attempt.adaptive
  const initialCurrent = useMemo(
    () => (attempt.questions ?? []).find((q) => q.attemptQuestionId === initialProgress?.currentAttemptQuestionId) ?? null,
    [attempt.questions, initialProgress?.currentAttemptQuestionId],
  )

  /* Everything served past the current item comes back in `questions`. */
  const initialReserve = useMemo(
    () => (attempt.questions ?? []).filter((q) => initialCurrent && (q.displayOrder ?? 0) > (initialCurrent.displayOrder ?? 0)),
    [attempt.questions, initialCurrent],
  )
  const initialQueued = initialReserve[0] ?? null

  const [current, setCurrent] = useState(initialCurrent)
  /* Items the server has served but the learner has not reached, by their
     position on the paper. The one after the current is shown the moment the
     current is done, while the server records the answer and serves another
     reserve in the background. */
  const reserveRef = useRef(new Map(initialReserve.map((q) => [q.displayOrder, q])))
  const [queued, setQueued] = useState(initialQueued)
  const [progress, setProgress] = useState(initialProgress)
  const [draft, setDraft] = useState(() => {
    const saved = initialCurrent ? attempt.savedAnswers?.[initialCurrent.attemptQuestionId] : null
    return saved ? fromDraftDto(saved) : {}
  })
  const [verdict, setVerdict] = useState(null)
  const [phase, setPhase] = useState(() =>
    initialProgress?.stage === "DONE" || !initialCurrent ? "COMPLETED" : "ANSWERING",
  )
  /* The in-flight recording of the last answer. Answers are sent one after
     another -- the server insists each is for the question it is asking. */
  const pendingRef = useRef(Promise.resolve(null))
  const [awaitingServer, setAwaitingServer] = useState(false)
  const [failure, setFailure] = useState(null)
  const finishedRef = useRef(false)
  const failedRef = useRef(false)

  const total = progress?.total ?? 0
  /* Position of the item on screen; the server's own count lags by the
     answer still in flight. */
  const answeredCount = current ? Math.max(0, (current.displayOrder ?? 1) - 1) : (progress?.answered ?? 0)

  /* Completion hands the paper to the page, which submits it and opens the
     result. Once, however many renders see the state. */
  useEffect(() => {
    if (phase === "COMPLETED" && !finishedRef.current) {
      finishedRef.current = true
      /* The last answer may still be in flight; submit only once it is recorded. */
      pendingRef.current.then(() => onFinish?.())
    }
  }, [phase, onFinish])

  const setAnswer = useCallback((patch) => {
    setDraft((existing) => ({ ...(existing ?? {}), ...patch }))
  }, [])

  const answered = current ? isAnswered(current, draft, isMultipleChoice) : false
  const finalItem = current?.stage === "FINAL"

  /* Answers waiting to go to the server. One request is in flight at a
     time and takes everything queued while the previous one was out: a
     learner who answers faster than a round trip costs one request per
     burst, not one per answer, so the server's reserve of questions served
     ahead is never drained by a backlog of single posts. */
  const outboxRef = useRef([])
  const inFlightRef = useRef(false)

  function pump() {
    if (inFlightRef.current || outboxRef.current.length === 0) return
    const batch = outboxRef.current.splice(0)
    inFlightRef.current = true
    answerAdaptiveItems(
      attempt.assessmentAttemptId, learnerId,
      batch.map(({ item, answerDraft }) => toDraftDto(item.attemptQuestionId, answerDraft ?? {})),
    )
      .then((response) => {
        setProgress(response.progress)
        const answeredIds = new Set(batch.map(({ item }) => item.attemptQuestionId))
        for (const served of [response.next, ...(response.queued ?? [])]) {
          if (served && !answeredIds.has(served.attemptQuestionId)) {
            reserveRef.current.set(served.displayOrder, served)
          }
        }
        const last = batch[batch.length - 1].item
        setQueued(reserveRef.current.get(last.displayOrder + 1) ?? null)
        for (const entry of batch) {
          entry.resolve({ ...response, verdict: response.verdicts?.[entry.item.attemptQuestionId] ?? null })
        }
      })
      .catch((error) => {
        /* The server did not take the answers, so the paper on screen and
           the paper on record have parted: stop here rather than let the
           learner answer questions that will never count. Reloading resumes
           from the server's own position. */
        failedRef.current = true
        setFailure(error?.response?.data?.message ?? "Could not record that answer. Please check your connection.")
        setPhase("FAILED")
        for (const entry of batch) entry.reject(error)
      })
      .finally(() => {
        inFlightRef.current = false
        pump()
      })
  }

  /* Queues an answer for the server. Resolves to the server's response for
     this item once its batch is back; the reserve items the batch carries
     are kept by position. */
  function record(item, answerDraft) {
    const send = new Promise((resolve, reject) => {
      outboxRef.current.push({ item, answerDraft, resolve, reject })
    })
    const drained = send.catch(() => null)
    pendingRef.current = pendingRef.current.then(() => drained)
    pump()
    return send
  }

  const checkRef = useRef(null)

  /**
   * Marks the current answer. With the key on hand the verdict is immediate
   * and the server is told in the background; without one (a resumed item,
   * blanks with several parts) the server's marking is awaited.
   */
  async function check(override) {
    if (!current || phase !== "ANSWERING") return
    const answerDraft = override ?? draft ?? {}
    if (!isAnswered(current, answerDraft, isMultipleChoice) && !finalItem) return
    const item = current

    if (finalItem) {
      /* Saved, not marked: on to the next problem at once. */
      record(item, answerDraft)
      advance()
      return
    }

    const local = localVerdict(item, answerDraft, isMultipleChoice)
    if (local) {
      setVerdict(local)
      setPhase("REVEALED")
      record(item, answerDraft).then((response) => {
        /* The server is the marker of record; if it disagrees, it wins. */
        if (response?.verdict && response.verdict.isCorrect !== local.isCorrect) setVerdict(response.verdict)
      }).catch(() => {})
      return
    }

    setPhase("GRADING")
    try {
      const response = await record(item, answerDraft)
      if (response.verdict) {
        setVerdict(response.verdict)
        setPhase("REVEALED")
      } else {
        advance()
      }
    } catch {
      setPhase("ANSWERING")
    }
  }

  checkRef.current = check

  /* Moves to the item after the current one; if the server has not served
     it yet, waits for the answer in flight, which brings it. */
  async function advance() {
    const position = (current?.displayOrder ?? 0) + 1
    let next = reserveRef.current.get(position) ?? null
    if (!next) {
      /* Nothing served ahead yet (slow link): keep the marked card on screen
         with the button showing it is fetching, rather than a loading page. */
      setAwaitingServer(true)
      await pendingRef.current
      setAwaitingServer(false)
      next = reserveRef.current.get(position) ?? null
    }
    setVerdict(null)
    setDraft({})
    reserveRef.current.delete(position)
    setQueued(reserveRef.current.get(position + 1) ?? null)
    if (!next) {
      setCurrent(null)
      setPhase("COMPLETED")
      return
    }
    const wasMain = current?.stage !== "FINAL"
    setCurrent(next)
    setPhase(next.stage === "FINAL" && wasMain ? "FINAL_INTRO" : "ANSWERING")
  }

  function next() {
    if (phase !== "REVEALED") return
    advance()
  }

  const continueToFinal = useCallback(() => {
    setPhase("ANSWERING")
  }, [])

  if (phase === "FAILED") {
    return (
      <div className="rebyu-ds flex h-dvh items-center justify-center bg-rb-polar p-6">
        <div className="w-full max-w-md rounded-rb-card border-2 border-rb-cardinal/40 bg-rb-snow p-6 text-center">
          <XCircle className="mx-auto size-8 text-rb-cardinal" aria-hidden="true" />
          <h2 className="mt-3 font-rb-display text-xl font-extrabold text-rb-eel">We lost the thread</h2>
          <p className="mt-2 text-sm leading-6 text-rb-wolf">{failure}</p>
          <p className="mt-1 text-sm leading-6 text-rb-wolf">Your answers so far are saved. Reload to pick up where the server left you.</p>
          <Button className="mt-5" onClick={() => window.location.reload()}>Reload and continue</Button>
        </div>
      </div>
    )
  }

  if (phase === "COMPLETED" || isSubmitting) {
    /* A couple of seconds while the paper is closed and the result built;
       a small card, not the full classroom loading screen with a fake
       percentage -- that read as a long wait for a short one. */
    return (
      <div className="rebyu-ds flex h-dvh items-center justify-center bg-rb-polar p-6">
        <div className="flex items-center gap-3 rounded-rb-card border-2 border-rb-swan bg-rb-snow px-6 py-5 shadow-[var(--comic-shadow-sm)]">
          <Loader2 className="size-5 animate-spin text-rb-feather" aria-hidden="true" />
          <div>
            <p className="font-rb-display text-base font-extrabold text-rb-eel">Finishing up…</p>
            <p className="text-xs text-rb-wolf">Closing your paper and building your results.</p>
          </div>
        </div>
      </div>
    )
  }

  const isProgramming = current?.criticalThinkingType === "PROGRAMMING" || current?.questionType === "PROGRAMMING"
  const isDiagram = current?.criticalThinkingType === "DIAGRAM" || current?.questionType === "DIAGRAM"
  const isWorkspace = current?.questionType === "CRITICAL_THINKING" && !isProgramming && !isDiagram
  const grading = phase === "GRADING"
  const revealed = phase === "REVEALED"

  return (
    <div className="rebyu-ds flex h-dvh flex-col overflow-hidden bg-rb-polar">
      <FinalRoundInterstitial
        open={phase === "FINAL_INTRO"}
        onContinue={continueToFinal}
        count={progress?.finalRoundTotal ?? 0}
      />

      <header className="shrink-0 border-b-2 border-rb-swan bg-rb-snow">
        <div className="flex h-16 items-center justify-between gap-3 px-3 sm:px-4">
          <div className="min-w-0">
            <p className="truncate font-rb-display text-base font-extrabold text-rb-eel">{attempt.assessmentTitle}</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-rb-wolf">
              {finalItem ? "Final round" : "Adaptive"} · Question {Math.min(answeredCount + 1, Math.max(total, 1))} of {total}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {remainingSeconds != null ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-sm font-bold tabular-nums",
                  remainingSeconds <= 60
                    ? "border-rb-cardinal bg-rb-cardinal-wash text-rb-cardinal-lip"
                    : "border-rb-swan bg-rb-polar text-rb-eel",
                )}
              >
                <Clock3 className="size-4" aria-hidden="true" />
                {formatClock(remainingSeconds)}
              </span>
            ) : null}
            <Button variant="outline" size="sm" onClick={onLeave} className="gap-1.5">
              <LogOut className="size-4" aria-hidden="true" />
              Exit
            </Button>
          </div>
        </div>
        <ProgressBar answered={answeredCount} total={total} mainTotal={progress?.mainTotal ?? total} />
      </header>

      {current && (isProgramming || isDiagram) ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
          <div className="min-h-0 flex-1 overflow-hidden">
            {isProgramming ? (
              <ProgrammingQuestionLayout
                key={current.attemptQuestionId}
                question={current}
                index={answeredCount}
                answer={draft}
                onAnswer={setAnswer}
                attemptId={attempt.assessmentAttemptId}
                attemptQuestionId={current.attemptQuestionId}
                learnerId={learnerId}
                navigator={null}
                editingLocked={grading || timeUp}
              />
            ) : (
              <DiagramQuestionLayout
                question={current}
                index={answeredCount}
                answer={draft}
                onAnswer={setAnswer}
                attemptId={attempt.assessmentAttemptId}
                attemptQuestionId={current.attemptQuestionId}
                learnerId={learnerId}
                navigator={null}
                editingLocked={grading || timeUp}
              />
            )}
          </div>
          <FinalRoundFooter onSubmit={() => check()} busy={grading || awaitingServer} last={answeredCount + 1 >= total} />
        </div>
      ) : current && isWorkspace ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
          <div className="min-h-0 flex-1 overflow-hidden">
            <WorkspaceQuestionPanel question={current} index={answeredCount} answer={draft} onAnswer={setAnswer} />
          </div>
          <FinalRoundFooter onSubmit={() => check()} busy={grading || awaitingServer} last={answeredCount + 1 >= total} />
        </div>
      ) : current ? (
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
            <div key={current.attemptQuestionId} className="rounded-rb-card border-2 border-rb-swan bg-rb-snow p-5 shadow-[var(--comic-shadow-sm)] sm:p-7">
              <div className="mb-4 flex items-center gap-2">
                <span className="rounded-full bg-rb-feather-wash px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-rb-feather-ink">
                  {typeLabel(current)}
                </span>
                {current.points != null ? (
                  <span className="text-xs font-semibold text-rb-wolf">
                    {Number(current.points)} {Number(current.points) === 1 ? "point" : "points"}
                  </span>
                ) : null}
              </div>

              <p className="whitespace-pre-wrap text-lg font-medium leading-8 text-rb-eel">{current.question}</p>
              {current.questionImageKey ? (
                <img
                  src={getFileViewUrl(current.questionImageKey)}
                  alt="Question reference"
                  className="mt-4 w-full rounded-xl border-2 border-rb-swan"
                />
              ) : null}

              <div className="mt-6">
                {isMultipleChoice(current) ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(current.choices ?? []).map((choice, choiceIndex) => {
                      const selected = draft?.selectedChoiceId === choice.choiceId
                      const isRight = revealed && verdict?.correctChoiceId === choice.choiceId
                      const isWrong = revealed && selected && !isRight && verdict?.correctChoiceId != null
                      const wrongNoKey = revealed && selected && verdict?.correctChoiceId == null && verdict?.isCorrect === false
                      return (
                        <button
                          key={choice.choiceId ?? choiceIndex}
                          type="button"
                          onClick={() => {
                            if (revealed || grading) return
                            setAnswer({ selectedChoiceId: choice.choiceId })
                            /* Duolingo-style: picking a choice is the answer. */
                            if (current.answerKey?.correctChoiceId != null) {
                              queueMicrotask(() => checkRef.current?.({ ...(draft ?? {}), selectedChoiceId: choice.choiceId }))
                            }
                          }}
                          aria-pressed={selected}
                          disabled={revealed || grading}
                          className={cn(
                            "flex min-h-14 items-start gap-3 rounded-2xl border-2 p-3 text-left text-sm leading-6 transition",
                            !revealed && "active:translate-y-[2px]",
                            isRight
                              ? "border-rb-leaf bg-rb-leaf-wash text-rb-leaf-lip"
                              : isWrong || wrongNoKey
                                ? "border-rb-cardinal bg-rb-cardinal-wash text-rb-cardinal-lip"
                                : selected
                                  ? "border-rb-feather bg-rb-feather-wash text-rb-feather-ink shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-rb-feather)_20%,transparent)]"
                                  : "border-rb-swan bg-rb-snow text-rb-eel hover:border-rb-feather/60 hover:bg-rb-polar",
                            revealed && !isRight && !isWrong && !wrongNoKey && "opacity-60",
                          )}
                        >
                          <span
                            className={cn(
                              "grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold",
                              isRight ? "bg-rb-leaf text-white" : isWrong || wrongNoKey ? "bg-rb-cardinal text-white" : selected ? "bg-rb-feather text-white" : "bg-rb-polar text-rb-wolf",
                            )}
                          >
                            {isRight ? <CheckCircle2 className="size-4" aria-hidden="true" /> : isWrong || wrongNoKey ? <XCircle className="size-4" aria-hidden="true" /> : String.fromCharCode(65 + choiceIndex)}
                          </span>
                          <span className="flex-1">
                            {choice.choiceText}
                            {choice.imageKey ? (
                              <img src={getFileViewUrl(choice.imageKey)} alt="" className="mt-2 max-h-40 rounded-lg" />
                            ) : null}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ) : (current.subQuestions ?? []).length > 0 ? (
                  <div className="space-y-2">
                    {current.subQuestions.map((sub) => (
                      <div key={sub.subQuestionId} className="flex items-center gap-3">
                        <span className="w-14 shrink-0 text-sm font-semibold text-rb-wolf">{sub.questionText}</span>
                        <Input
                          value={draft?.subAnswers?.[sub.subQuestionId] ?? ""}
                          onChange={(event) =>
                            setAnswer({ subAnswers: { ...(draft?.subAnswers ?? {}), [sub.subQuestionId]: event.target.value } })
                          }
                          placeholder="Type the term"
                          autoComplete="off"
                          disabled={revealed || grading}
                        />
                      </div>
                    ))}
                  </div>
                ) : current.questionType === "DESCRIPTIVE" ? (
                  <Textarea
                    value={draft?.learnerAnswer ?? ""}
                    onChange={(event) => setAnswer({ learnerAnswer: event.target.value })}
                    placeholder="Write your answer"
                    disabled={revealed || grading}
                    className="min-h-40 text-base"
                  />
                ) : (
                  <Input
                    autoFocus
                    value={draft?.learnerAnswer ?? ""}
                    onChange={(event) => setAnswer({ learnerAnswer: event.target.value })}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") (revealed ? next() : check())
                    }}
                    placeholder="Type your answer"
                    autoComplete="off"
                    disabled={revealed || grading}
                    className="h-12 text-base"
                  />
                )}
              </div>

              {revealed && verdict ? <VerdictPanel verdict={verdict} /> : null}

              <div className="mt-6 flex items-center justify-between gap-3">
                <span className="text-xs text-rb-wolf">
                  {revealed ? "Marked. Ready for the next one?" : grading ? (finalItem ? "Saving…" : "Marking…") : finalItem ? "Final round: marked with the whole paper when you finish." : "Pick or type an answer, then check."}
                </span>
                <Button onClick={() => (revealed ? next() : check())} disabled={(!answered && !revealed) || grading || awaitingServer} className="gap-2">
                  {awaitingServer ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      Loading next…
                    </>
                  ) : grading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      Checking
                    </>
                  ) : !revealed ? (
                    finalItem ? (answeredCount + 1 >= total ? "Finish and see results" : "Submit answer") : "Check"
                  ) : answeredCount + 1 >= total ? (
                    <>
                      <Sparkles className="size-4" aria-hidden="true" />
                      See my results
                    </>
                  ) : queued?.stage === "FINAL" && !finalItem ? (
                    <>
                      To the final round
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </>
                  ) : (
                    <>
                      Next question
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </main>
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-rb-wolf">
          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
          Loading the next question…
        </div>
      )}
    </div>
  )
}

function FinalRoundFooter({ onSubmit, busy, last }) {
  return (
    <div className="mt-3 flex shrink-0 items-center justify-between gap-3 rounded-2xl border-2 border-rb-swan bg-rb-snow px-4 py-3">
      <span className="text-xs text-rb-wolf">Final round: this problem is marked with the whole paper when you finish.</span>
      <Button onClick={onSubmit} disabled={busy} className="gap-2">
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        {last ? "Finish and see results" : "Submit answer"}
      </Button>
    </div>
  )
}

function VerdictPanel({ verdict }) {
  const correct = verdict.isCorrect === true
  const partial = !correct && Number(verdict.earnedPoints ?? 0) > 0
  return (
    <div
      role="status"
      className={cn(
        "mt-5 rounded-xl border-2 p-4 text-sm",
        correct ? "border-rb-leaf/50 bg-rb-leaf-wash" : partial ? "border-amber-400/60 bg-amber-50" : "border-rb-cardinal/45 bg-rb-cardinal-wash",
      )}
    >
      <p className={cn("flex items-center gap-2 text-base font-bold", correct ? "text-rb-leaf-lip" : partial ? "text-amber-800" : "text-rb-cardinal-lip")}>
        {correct ? <CheckCircle2 className="size-5" aria-hidden="true" /> : <XCircle className="size-5" aria-hidden="true" />}
        {correct ? "Correct!" : partial ? "Partly right" : "Not quite"}
        {verdict.earnedPoints != null && verdict.points != null ? (
          <span className="ml-auto text-xs font-semibold text-rb-wolf">
            {Number(verdict.earnedPoints)} / {Number(verdict.points)} pts
          </span>
        ) : null}
      </p>
      {!correct && verdict.correctChoiceText ? (
        <p className="mt-2 text-rb-eel">
          Correct answer: <span className="font-semibold text-rb-leaf-lip">{verdict.correctChoiceText}</span>
        </p>
      ) : null}
      {!correct && verdict.acceptedAnswer ? (
        <p className="mt-2 text-rb-eel">
          Expected: <span className="font-semibold text-rb-leaf-lip">{verdict.acceptedAnswer}</span>
        </p>
      ) : null}
      {verdict.explanation ? <p className="mt-2 text-sm leading-6 text-rb-wolf">{verdict.explanation}</p> : null}
      {verdict.feedback ? <p className="mt-2 text-sm leading-6 text-rb-wolf">{verdict.feedback}</p> : null}
      {(verdict.subQuestionAnswers ?? []).length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm">
          {verdict.subQuestionAnswers.map((sub) => (
            <li key={sub.subQuestionId} className="flex items-baseline justify-between gap-3">
              <span className="text-rb-wolf">{sub.questionText}</span>
              <span className="font-semibold text-rb-eel">
                {sub.learnerAnswer || "—"} · {Number(sub.earnedPoints ?? 0)}/{Number(sub.maxPoints ?? 0)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function ProgressBar({ answered, total, mainTotal }) {
  const pct = total > 0 ? Math.min(100, Math.round((answered / total) * 100)) : 0
  const finalStart = total > 0 && mainTotal < total ? Math.round((mainTotal / total) * 100) : null
  return (
    <div className="relative h-1.5 w-full bg-rb-swan" aria-hidden="true">
      <div className="h-full bg-rb-feather transition-[width] duration-500" style={{ width: `${pct}%` }} />
      {finalStart != null ? (
        <span className="absolute top-0 h-full w-0.5 bg-rb-eel/40" style={{ left: `${finalStart}%` }} />
      ) : null}
    </div>
  )
}

function typeLabel(question) {
  const type = String(question?.questionType ?? "").toUpperCase()
  if (type === "MULTIPLE_CHOICE" || type === "MCQ") return "Multiple choice"
  if (type === "SHORT_ANSWER") return (question.subQuestions ?? []).length > 0 ? "Fill in the blanks" : "Short answer"
  if (type === "DESCRIPTIVE") return "Written answer"
  return type.replaceAll("_", " ").toLowerCase()
}

function isAnswered(question, draft, isMultipleChoice) {
  if (!draft) return false
  if (isMultipleChoice(question)) return draft.selectedChoiceId != null
  if ((question.subQuestions ?? []).length > 0 && question.questionType !== "CRITICAL_THINKING") {
    return question.subQuestions.every((sub) => (draft.subAnswers?.[sub.subQuestionId] ?? "").trim())
  }
  return Boolean(draft.learnerAnswer?.trim() || draft.submittedCode?.trim() || draft.diagramSubmissionData)
}

/* The instant marking, from the key that came with the question. */
function localVerdict(question, answerDraft, isMultipleChoice) {
  const key = question?.answerKey
  if (!key) return null
  if (isMultipleChoice(question)) {
    if (key.correctChoiceId == null) return null
    const correct = answerDraft?.selectedChoiceId === key.correctChoiceId
    return {
      isCorrect: correct,
      earnedPoints: correct ? question.points : 0,
      points: question.points,
      correctChoiceId: key.correctChoiceId,
      correctChoiceText: key.correctChoiceText,
      explanation: key.explanation,
    }
  }
  if (!Array.isArray(key.acceptedAnswers) || key.acceptedAnswers.length === 0) return null
  const norm = (v) => String(v ?? "").trim().toLowerCase()
  const given = norm(answerDraft?.learnerAnswer)
  const correct = given.length > 0 && key.acceptedAnswers.map(norm).includes(given)
  return {
    isCorrect: correct,
    earnedPoints: correct ? question.points : 0,
    points: question.points,
    acceptedAnswer: key.acceptedAnswers[0],
    explanation: key.explanation,
  }
}

function fromDraftDto(saved) {
  const out = {
    learnerAnswer: saved.learnerAnswer ?? null,
    selectedChoiceId: saved.selectedChoiceId ?? null,
    submittedCode: saved.submittedCode ?? null,
    programmingLanguage: saved.programmingLanguage ?? null,
    diagramSubmissionData: saved.diagramSubmissionData ?? null,
  }
  if (typeof saved.learnerAnswer === "string" && saved.learnerAnswer.startsWith("{")) {
    try {
      out.subAnswers = JSON.parse(saved.learnerAnswer)
      out.learnerAnswer = null
    } catch {
      /* Plain text that happens to start with a brace. */
    }
  }
  return out
}

function formatClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export default AdaptiveAttemptRunner
