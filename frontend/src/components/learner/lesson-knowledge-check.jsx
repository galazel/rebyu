import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Trophy,
  XCircle,
  Zap,
} from "@/components/icons"
import { createKnowledgeCheck } from "@/services/knowledgeCheckService.js"
import { answerAdaptiveItems, startAssessmentAttempt, submitAssessmentAttempt } from "@/services/assessmentService.js"
import { announceRewards, snapshotRewards } from "@/components/learner/xp-award-modal.jsx"
import { AuthedImage, prefetchAuthedMedia, questionMediaKeys } from "@/lib/authed-media.jsx"
import { playCorrectMark, playWrongMark } from "@/lib/sound.js"

export function LessonKnowledgeCheck({ open, lessonId, learnerId, itemCount, lessonNames, currentLessonOnly = true, attempt: preparedAttempt = null, answerKey = [], onDismiss, onReadAgain, onComplete }) {
  const queryClient = useQueryClient()

  const [phase, setPhase] = useState("intro")
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(null)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [revealed, setRevealed] = useState(false)
  const [result, setResult] = useState(null)

  const mintingRef = useRef(false)

  const [served, setServed] = useState([])
  const outboxRef = useRef([])
  const inFlightRef = useRef(false)
  const pendingRef = useRef(Promise.resolve())
  const failedRef = useRef(false)

  useEffect(() => {
    if (!open) {
      mintingRef.current = false
      setPhase("intro")
      setError(null)
      setAttempt(null)
      setIndex(0)
      setAnswers({})
      setRevealed(false)
      setResult(null)
      setServed([])
      outboxRef.current = []
      inFlightRef.current = false
      pendingRef.current = Promise.resolve()
      failedRef.current = false
      return
    }
    if (preparedAttempt) {
      mintingRef.current = true
      setAttempt(preparedAttempt)
      setServed(orderedItems(preparedAttempt))
      // The attempt is ready, but learners should first see why it appeared.
      setPhase("intro")
    }
  }, [open, preparedAttempt])

  const adaptive = Boolean(attempt?.adaptive)

  function pump() {
    if (inFlightRef.current || outboxRef.current.length === 0 || !attempt) return
    const batch = outboxRef.current.splice(0)
    inFlightRef.current = true
    const request = answerAdaptiveItems(
      attempt.assessmentAttemptId, learnerId,
      batch.map(({ question, answer }) => toDraftDto(question.attemptQuestionId, answer)),
    )
      .then((response) => {
        const fresh = [response.next, ...(response.queued ?? [])].filter(Boolean)
        if (fresh.length > 0) {
          setServed((existing) => {
            const byOrder = new Map(existing.map((item) => [item.displayOrder, item]))
            for (const item of fresh) byOrder.set(item.displayOrder, item)
            return [...byOrder.values()].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
          })
        }
      })
      .catch((caught) => {
        // Keep the answers so "Try again" resends them instead of waiting forever for the next item.
        outboxRef.current.unshift(...batch)
        failedRef.current = true
        setError(caught)
        setPhase("error")
      })
      .finally(() => {
        inFlightRef.current = false
        if (!failedRef.current) pump()
      })
    pendingRef.current = pendingRef.current.then(() => request.catch(() => null))
  }

  function record(question, answer) {
    outboxRef.current.push({ question, answer })
    pump()
  }

  function start() {
    if (attempt) {
      failedRef.current = false
      setError(null)
      setPhase(result ? "result" : "playing")
      pump()
      return
    }
    if (mintingRef.current) return
    mintingRef.current = true
    setPhase("minting")
    setError(null)

    createKnowledgeCheck(lessonId, { currentLessonOnly })
      .then(async (check) => {
        if (!check?.examId) {
          onDismiss?.()
          return
        }
        const key = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
        setAttempt(await startAssessmentAttempt(check.examId, learnerId, key))
        setPhase("playing")
      })
      .catch((caught) => {
        mintingRef.current = false
        setError(caught)
        setPhase("error")
      })
  }

  const questions = adaptive ? served : (attempt?.questions ?? [])
  const total = adaptive ? (attempt?.adaptive?.total ?? itemCount ?? 5) : questions.length
  const current = questions[index]
  const currentAnswer = current ? answers[current.attemptQuestionId] : null
  const answered = isAnswered(current, currentAnswer)
  const last = index >= total - 1
  const currentKey = adaptive ? (current?.answerKey ?? null) : (Array.isArray(answerKey) ? answerKey[index] : null)
  const verdict = revealed ? localVerdict(current, currentAnswer, currentKey) : null
  const awaitingNext = adaptive && revealed && !last && !questions[index + 1]

  // Image-based questions need their secured media before the learner reaches them.
  // This also keeps the modal responsive when all answer choices are diagrams.
  useEffect(() => {
    prefetchAuthedMedia(questions.flatMap(questionMediaKeys))
  }, [questions])

  function setAnswer(patch) {
    if (revealed) return
    setAnswers((existing) => ({
      ...existing,
      [current.attemptQuestionId]: { ...(existing[current.attemptQuestionId] ?? {}), ...patch },
    }))
  }

  async function next() {
    if (!answered || awaitingNext) return
    if (!revealed && currentKey) {
      setRevealed(true)
      const mark = localVerdict(current, currentAnswer, currentKey)
      if (mark?.correct) playCorrectMark()
      else if (mark) playWrongMark()
      if (adaptive) record(current, currentAnswer)
      return
    }
    if (!last) {
      setRevealed(false)
      setIndex(index + 1)
      return
    }
    if (adaptive) {
      if (!revealed) record(current, currentAnswer)
      setPhase("submitting")
      const local = localResult(questions, answers, questions.map((question) => question.answerKey ?? null))
      const before = await snapshotRewards(queryClient)
      try {
        await pendingRef.current
        if (outboxRef.current.length > 0) throw new Error("Some answers were not saved yet. Try again to resend them.")
        const submitted = await submitAssessmentAttempt(attempt.assessmentAttemptId, learnerId, [])
        setResult(submitted)
        setPhase("result")
        await announceRewards({
          queryClient,
          before,
          title: "Challenge complete",
          fallback: "Nice work — keep reading at your own pace.",
          silentXp: true,
        })
      } catch (caught) {
        if (local) {
          setResult(local)
          setPhase("result")
        } else {
          setError(caught)
          setPhase("error")
        }
      }
      return
    }
    const payload = questions
      .map((question) => {
        const answer = answers[question.attemptQuestionId]
        return answer ? toDraftDto(question.attemptQuestionId, answer) : null
      })
      .filter(Boolean)

    const local = localResult(questions, answers, answerKey)
    if (local) {
      setResult(local)
      setPhase("result")
    } else {
      setPhase("submitting")
    }
    const before = await snapshotRewards(queryClient)
    try {
      const submitted = await submitAssessmentAttempt(attempt.assessmentAttemptId, learnerId, payload)
      setResult(submitted)
      setPhase("result")
      await announceRewards({
        queryClient,
        before,
        title: "Challenge complete",
        fallback: "Nice work — keep reading at your own pace.",
        silentXp: true,
      })
    } catch (caught) {
      if (!local) {
        setError(caught)
        setPhase("error")
      }
    }
  }

  const sources = Array.isArray(lessonNames) ? lessonNames.filter(Boolean) : []
  const count = itemCount ?? 5

  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        data-no-snip
        className={cn(
          "tg-cat-explain max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1rem)] border border-[var(--tg-line)] bg-card text-foreground sm:w-[min(92vw,66rem)]",
          phase === "playing" || phase === "submitting" || phase === "result"
            ? "flex h-[min(48rem,calc(100dvh-1.5rem))] max-w-[66rem] flex-col overflow-hidden rounded-[26px] border-rb-swan/90 bg-rb-snow p-0 shadow-[0_28px_90px_-32px_rgba(16,62,48,0.62)] dark:shadow-[0_28px_90px_-24px_rgba(0,0,0,0.75)]"
            : "rounded-[24px] p-6 shadow-[0_24px_64px_-24px_rgba(16,62,48,0.45)] dark:shadow-[0_28px_80px_-20px_rgba(0,0,0,0.75)]",
        )}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        {phase === "error" ? (
          <>
            <AlertDialogHeader>
              <AlertDialogMedia className="rounded-2xl bg-rb-fox-wash text-rb-fox-lip ring-1 ring-rb-fox/30">
                <AlertTriangle aria-hidden="true" />
              </AlertDialogMedia>
              <AlertDialogTitle className="text-foreground">Could not run the challenge</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                {error?.response?.data?.message ?? error?.message ?? "Something went wrong building your questions."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => onDismiss?.()}>Back to the lesson</Button>
              <Button onClick={start}>Try again</Button>
            </AlertDialogFooter>
          </>
        ) : phase === "result" && result ? (
          <ResultScreen result={result} onDone={() => { onComplete?.(result); onDismiss?.() }} onReadAgain={onReadAgain ? () => { onComplete?.(result); onDismiss?.(); onReadAgain() } : null} />
        ) : phase === "playing" || phase === "submitting" ? (
          <>
            <AlertDialogHeader className="shrink-0 items-start border-b border-rb-swan/80 bg-[linear-gradient(118deg,var(--tg-soft),var(--card)_62%)] px-5 pb-5 pt-5 text-left sm:px-8 sm:pb-6 sm:pt-7">
              <div className="flex w-full items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-2xl bg-rb-leaf text-white shadow-[0_8px_18px_-10px_rgba(31,132,91,0.9)] dark:text-[#10151a]">
                    <Zap className="size-[18px]" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-rb-leaf-lip">Focus check</p>
                    <AlertDialogTitle className="mt-0.5 text-lg font-extrabold tracking-[-0.02em] text-rb-eel sm:text-xl">
                      Skim challenge
                    </AlertDialogTitle>
                  </div>
                </div>
                <span className="rounded-full border border-rb-swan bg-rb-polar px-3 py-1.5 text-xs font-bold tabular-nums text-rb-eel shadow-sm">
                  {index + 1} <span className="font-medium text-rb-wolf">of {total}</span>
                </span>
              </div>
              <div className="mt-5">
                <ProgressDots total={total} current={index} answers={answers} questions={questions} />
              </div>
              <AlertDialogDescription className="sr-only">
                Question {index + 1} of {total}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {current ? (
              <div key={current.attemptQuestionId} className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8 sm:py-7">
                <div className="max-h-[38dvh] overflow-y-auto overscroll-contain pr-2 sm:max-h-96">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-rb-wolf">Choose the best answer</p>
                  <p className="text-base font-semibold leading-7 tracking-[-0.008em] text-rb-eel sm:text-lg sm:leading-8">{current.question}</p>
                  <AuthedImage
                    imageKey={current.questionImageKey ?? current.imageKey}
                    alt="Question reference"
                    zoomable
                    className="tg-media-img-paper mx-auto mt-4 max-h-80 w-auto max-w-full rounded-xl border border-rb-swan object-contain dark:p-1"
                    placeholderClassName="mx-auto mt-4 h-28 w-full max-w-md"
                  />
                </div>

                {isMultipleChoice(current) ? (
                  <div
                    className={cn(
                      "grid gap-3",
                      // Long answers read better full width than squeezed into two columns.
                      (current.choices ?? []).every((choice) => String(choice.choiceText ?? "").length <= 60) && "sm:grid-cols-2",
                    )}
                  >
                    {(current.choices ?? []).map((choice, choiceIndex) => {
                      const selected = currentAnswer?.selectedChoiceId === choice.choiceId
                      const isRight = revealed && currentKey?.correctChoiceId === choice.choiceId
                      const isWrong = revealed && selected && !isRight
                      const hasImage = Boolean(choice.imageKey)
                      return (
                        <button
                          key={choice.choiceId ?? choiceIndex}
                          type="button"
                          onClick={() => setAnswer({ selectedChoiceId: choice.choiceId })}
                          aria-pressed={selected}
                          disabled={revealed}
                          className={cn(
                            "group flex min-h-[78px] items-start gap-3.5 rounded-2xl border px-4 py-3.5 text-left text-[15px] leading-6 transition duration-200 sm:text-base",
                            !revealed && "hover:-translate-y-px hover:shadow-[0_12px_24px_-20px_rgba(19,70,52,0.65)] active:translate-y-0",
                            isRight
                              ? "border-rb-leaf bg-rb-leaf-wash text-rb-leaf-lip"
                              : isWrong
                                ? "border-rb-cardinal bg-rb-cardinal-wash text-rb-cardinal-lip"
                                : selected
                                  ? "border-rb-leaf bg-rb-leaf-wash text-rb-eel shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-rb-leaf)_16%,transparent)]"
                                  : "border-rb-swan bg-rb-snow text-rb-eel hover:border-rb-leaf/50 hover:bg-rb-polar dark:bg-[#1b221e]",
                            revealed && !isRight && !isWrong && "opacity-60",
                          )}
                        >
                          <span
                            className={cn(
                              "grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold",
                              isRight ? "bg-rb-leaf text-white dark:text-[#10151a]" : isWrong ? "bg-rb-cardinal text-white dark:text-[#10151a]" : selected ? "bg-rb-leaf text-white dark:text-[#10151a]" : "bg-rb-polar text-rb-wolf group-hover:bg-rb-leaf-wash group-hover:text-rb-leaf-lip dark:bg-[#28312c]",
                            )}
                          >
                            {isRight ? <CheckCircle2 className="size-4" aria-hidden="true" /> : isWrong ? <XCircle className="size-4" aria-hidden="true" /> : String.fromCharCode(65 + choiceIndex)}
                          </span>
                          <span className="min-w-0 flex-1">
                            {choice.choiceText ? <span className={hasImage ? "block" : undefined}>{choice.choiceText}</span> : null}
                            <AuthedImage
                              imageKey={choice.imageKey}
                              alt={choice.choiceText ? `Answer choice ${String.fromCharCode(65 + choiceIndex)}` : `Answer choice ${String.fromCharCode(65 + choiceIndex)} diagram`}
                              className="tg-media-img-paper mt-2 max-h-56 w-auto max-w-full rounded-lg border border-rb-swan object-contain dark:p-1"
                              placeholderClassName="mt-2 h-24 w-full max-w-[14rem]"
                            />
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ) : (current.subQuestions ?? []).length > 0 ? (
                  <div className="space-y-2">
                    {current.subQuestions.map((sub) => (
                      <div key={sub.subQuestionId} className="flex items-center gap-3">
                        <span className="w-10 shrink-0 text-sm font-semibold text-rb-wolf">{sub.questionText}</span>
                        <Input
                          value={currentAnswer?.subAnswers?.[sub.subQuestionId] ?? ""}
                          onChange={(event) =>
                            setAnswer({ subAnswers: { ...(currentAnswer?.subAnswers ?? {}), [sub.subQuestionId]: event.target.value } })
                          }
                          placeholder="Type the term"
                          autoComplete="off"
                          disabled={revealed}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Input
                    autoFocus
                    value={currentAnswer?.learnerAnswer ?? ""}
                    onChange={(event) => setAnswer({ learnerAnswer: event.target.value })}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") next()
                    }}
                    placeholder="Type your answer"
                    autoComplete="off"
                    disabled={revealed}
                    className="h-12 text-base"
                  />
                )}

                {verdict ? (
                  <div
                    className={cn(
                      "rounded-xl border p-3 text-sm",
                      verdict.correct ? "border-rb-leaf/50 bg-rb-leaf-wash" : "border-rb-cardinal/45 bg-rb-cardinal-wash",
                    )}
                    role="status"
                  >
                    <p className={cn("font-bold", verdict.correct ? "text-rb-leaf-lip" : "text-rb-cardinal-lip")}>
                      {verdict.correct ? "Correct!" : "Not quite"}
                    </p>
                    {!verdict.correct && verdict.expected ? (
                      <p className="mt-1 text-rb-eel">
                        Correct answer: <span className="font-semibold text-rb-leaf-lip">{verdict.expected}</span>
                      </p>
                    ) : null}
                    {currentKey?.explanation ? (
                      <div className="mt-3 border-t border-current/15 pt-3">
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-rb-wolf">Explanation</p>
                        <p className="mt-1 text-sm leading-6 text-rb-eel">{currentKey.explanation}</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            <AlertDialogFooter className="shrink-0 border-t border-rb-swan/80 bg-rb-snow/55 px-5 py-4 sm:justify-between sm:px-8 sm:py-5">
              <span className="max-w-[22rem] self-center text-xs leading-5 text-rb-wolf">
                {sources[0] ? <><span className="font-semibold text-rb-eel">Lesson · </span>{sources[0]}</> : null}
              </span>
              <Button onClick={next} disabled={!answered || phase === "submitting" || awaitingNext} className="h-11 gap-2 rounded-xl px-5 shadow-[0_10px_20px_-14px_rgba(19,70,52,0.8)]">
                {phase === "submitting" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Checking
                  </>
                ) : awaitingNext ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Loading next
                  </>
                ) : !revealed && currentKey ? (
                  "Check"
                ) : last ? (
                  "See my score"
                ) : (
                  <>
                    Next
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </>
                )}
              </Button>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogMedia className="rounded-2xl bg-[var(--tg-soft)] text-[var(--tg-ink)] ring-1 ring-[var(--tg-line)]">
                <Zap aria-hidden="true" />
              </AlertDialogMedia>
              <AlertDialogTitle className="font-rb-display text-xl font-extrabold text-foreground">Quick focus check</AlertDialogTitle>
              <AlertDialogDescription className="text-[15px] leading-relaxed text-muted-foreground">
                You moved through this lesson quickly. Before continuing, take{" "}
                {count} quick {count === 1 ? "question" : "questions"} about the material you just passed.
                You can begin when you are ready.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {sources.length > 0 ? (
              <div className="rounded-xl border border-rb-swan bg-rb-polar px-4 py-3">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-rb-wolf">Lesson</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-rb-eel">{sources.join(" · ")}</p>
              </div>
            ) : null}

            <AlertDialogFooter>
              <Button onClick={start} disabled={phase === "minting"} className="gap-2">
                {phase === "minting" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Building your questions
                  </>
                ) : (
                  <>
                    <Zap className="size-4" aria-hidden="true" />
                    Start focus check
                  </>
                )}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function SkimWarningDialog({ open, onContinue, onReadAgain }) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        className="tg-cat-explain max-w-md rounded-[24px] border border-[var(--tg-line)] bg-rb-snow p-6 text-foreground shadow-[0_28px_90px_-32px_rgba(16,62,48,0.62)] dark:shadow-[0_28px_80px_-20px_rgba(0,0,0,0.75)]"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <AlertDialogHeader>
          <AlertDialogMedia className="rounded-2xl bg-rb-fox-wash text-rb-fox-lip ring-1 ring-rb-fox/30">
            <AlertTriangle aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle className="font-rb-display text-xl font-extrabold text-foreground">Take a moment with this lesson</AlertDialogTitle>
          <AlertDialogDescription className="leading-6 text-muted-foreground">
            You have already completed the focus check for this lesson. Moving through it quickly again may make key ideas easier to miss.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={onReadAgain}>Read again</Button>
          <Button onClick={onContinue}>Continue reading</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function ResultScreen({ result, onDone, onReadAgain }) {
  const answers = result?.answers ?? []
  const correct = answers.filter((answer) => answer.isCorrect === true).length
  const pending = answers.filter((answer) => answer.pendingManualEvaluation).length
  const total = answers.length
  const perfect = total > 0 && correct === total
  const passed = Boolean(result?.passed)

  return (
    <>
      <AlertDialogHeader className="shrink-0 border-b border-rb-swan/80 bg-[linear-gradient(118deg,var(--tg-soft),var(--card)_62%)] px-5 py-5 sm:px-8 sm:py-6">
        <div className="flex items-start gap-3">
          <AlertDialogMedia className={cn("shrink-0", passed ? "bg-rb-leaf-wash text-rb-leaf-lip" : "bg-rb-fox-wash text-rb-fox-lip")}>
            <Trophy aria-hidden="true" />
          </AlertDialogMedia>
          <div>
            <AlertDialogTitle className="text-xl tracking-[-0.02em]">
              {perfect ? "Perfect round!" : passed ? "Nice recovery" : "Worth a re-read"}
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-1.5 leading-6">
              {correct} of {total} correct
              {pending > 0 ? ` · ${pending} awaiting review` : ""}
              {perfect
                ? " — you clearly got it. Carry on."
                : passed
                  ? " — take the next sections a little slower."
                  : " — the answers below are the parts you scrolled past."}
            </AlertDialogDescription>
          </div>
        </div>
      </AlertDialogHeader>

      <ol className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 py-5 sm:px-8 sm:py-6">
        {answers.map((answer, position) => {
          const state = answer.pendingManualEvaluation ? "pending" : answer.isCorrect ? "correct" : "incorrect"
          return (
            <li
              key={answer.attemptQuestionId ?? position}
              className={cn(
                "rb-paper-card rounded-xl border p-3 text-sm",
                state === "correct" && "border-rb-leaf/50 bg-rb-leaf-wash",
                state === "incorrect" && "border-rb-cardinal/45 bg-rb-cardinal-wash",
                state === "pending" && "border-rb-fox/45 bg-rb-fox-wash",
              )}
            >
              <div className="flex items-start gap-2">
                {state === "correct" ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-rb-leaf-lip" aria-hidden="true" />
                ) : state === "incorrect" ? (
                  <XCircle className="mt-0.5 size-4 shrink-0 text-rb-cardinal-lip" aria-hidden="true" />
                ) : (
                  <Loader2 className="mt-0.5 size-4 shrink-0 text-rb-fox-lip" aria-hidden="true" />
                )}
                <div className="min-w-0 space-y-1">
                  <p className="font-medium leading-6 text-rb-eel">{answer.question}</p>
                  <p className="text-sm text-rb-wolf">
                    You answered: <span className="font-medium text-rb-eel">{answer.selectedChoiceText ?? answer.learnerAnswer ?? "—"}</span>
                  </p>
                  {state === "incorrect" && answer.correctChoiceText ? (
                    <p className="text-sm text-rb-wolf">
                      Correct: <span className="font-medium text-rb-leaf-lip">{answer.correctChoiceText}</span>
                    </p>
                  ) : null}
                  {answer.explanation ? (
                    <div className="border-t border-current/10 pt-2">
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-rb-wolf">Explanation</p>
                      <p className="mt-1 text-sm leading-6 text-rb-eel">{answer.explanation}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      <AlertDialogFooter className="shrink-0 border-t border-rb-swan/80 bg-rb-polar/70 px-5 py-4 sm:justify-between sm:px-8 sm:py-5">
        {onReadAgain ? (
          <Button variant={perfect || passed ? "outline" : "default"} onClick={onReadAgain}>
            Read the lesson again
          </Button>
        ) : <span />}
        <Button variant={perfect || passed ? "default" : "outline"} onClick={onDone}>
          Continue reading
        </Button>
      </AlertDialogFooter>
    </>
  )
}

function ProgressDots({ total, current, answers, questions }) {
  return (
    <div className="flex w-full gap-1.5" aria-hidden="true">
      {Array.from({ length: total }).map((_, position) => {
        const question = questions[position]
        const done = question && isAnswered(question, answers[question.attemptQuestionId])
        return (
          <span
            key={position}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              position === current ? "bg-rb-leaf" : done ? "bg-rb-leaf/50" : "bg-rb-swan",
            )}
          />
        )
      })}
    </div>
  )
}

function localResult(questions, answers, answerKey) {
  if (!Array.isArray(answerKey) || answerKey.length !== questions.length) return null
  const items = questions.map((question, position) => {
    const answer = answers[question.attemptQuestionId]
    const key = answerKey[position]
    const verdict = localVerdict(question, answer, key)
    if (!verdict) return null
    const selected = isMultipleChoice(question)
      ? (question.choices ?? []).find((choice) => choice.choiceId === answer?.selectedChoiceId)?.choiceText
      : answer?.learnerAnswer
    return {
      attemptQuestionId: question.attemptQuestionId,
      question: question.question,
      isCorrect: verdict.correct,
      pendingManualEvaluation: false,
      selectedChoiceText: selected ?? null,
      learnerAnswer: answer?.learnerAnswer ?? null,
      correctChoiceText: verdict.expected ?? null,
      explanation: key?.explanation ?? null,
    }
  })
  if (items.some((item) => item == null)) return null
  const correct = items.filter((item) => item.isCorrect).length
  return {
    answers: items,
    correctCount: correct,
    totalQuestions: items.length,
    passed: items.length > 0 && correct / items.length >= 0.6,
  }
}

function localVerdict(question, answer, key) {
  if (!question || !answer || !key) return null
  if (isMultipleChoice(question)) {
    return { correct: answer.selectedChoiceId === key.correctChoiceId, expected: key.correctChoiceText }
  }
  const norm = (v) => String(v ?? "").trim().toLowerCase()
  const given = norm(answer.learnerAnswer)
  const accepted = (key.acceptedAnswers ?? []).map(norm).filter(Boolean)
  return { correct: given.length > 0 && accepted.includes(given), expected: key.acceptedAnswers?.[0] ?? null }
}

function orderedItems(attempt) {
  return [...(attempt?.questions ?? [])].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
}

function isMultipleChoice(question) {
  const type = String(question?.questionType ?? "").toUpperCase()
  return type === "MULTIPLE_CHOICE" || type === "MCQ"
}

function isAnswered(question, answer) {
  if (!question || !answer) return false
  if (isMultipleChoice(question)) return answer.selectedChoiceId != null
  if ((question.subQuestions ?? []).length > 0) {
    return question.subQuestions.every((sub) => answer.subAnswers?.[sub.subQuestionId]?.trim())
  }
  return Boolean(answer.learnerAnswer?.trim())
}

function toDraftDto(attemptQuestionId, answer) {
  const subAnswers = answer.subAnswers ?? {}
  const hasSubs = Object.values(subAnswers).some((text) => text?.trim())
  return {
    attemptQuestionId,
    learnerAnswer: hasSubs ? JSON.stringify(subAnswers) : (answer.learnerAnswer ?? null),
    selectedChoiceId: answer.selectedChoiceId ?? null,
    submittedCode: null,
    programmingLanguage: null,
    diagramSubmissionData: null,
  }
}

export default LessonKnowledgeCheck
