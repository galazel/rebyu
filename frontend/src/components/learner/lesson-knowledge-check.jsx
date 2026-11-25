import { toDraftDto } from "@/lib/attempt-answer.js"
import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { EquationAnswerInput, ProblemSolvingAnswerView } from "@/components/assessments/attempt/equation-answer-input.jsx"
import { isMultipleAnswer, MultipleAnswerChoices, parseChoiceIds } from "@/components/assessments/attempt/multiple-answer-choices.jsx"
import { DiagramAnswerBreakdown, ProgrammingAnswerBreakdown } from "@/components/assessments/attempt/answer-breakdown.jsx"
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
import { answerAdaptiveItems, getAttemptResult, startAssessmentAttempt, submitAssessmentAttempt } from "@/services/assessmentService.js"
import { announceRewards, snapshotRewards } from "@/components/learner/xp-award-modal.jsx"
import { AuthedImage, prefetchAuthedMedia, questionMediaKeys } from "@/lib/authed-media.jsx"
import { playCorrectMark, playWrongMark } from "@/lib/sound.js"
import { withInlineMath } from "@/components/certifications/math.jsx"

const ProgrammingQuestionLayout = lazy(() => import("@/components/assessments/attempt/programming-question-layout.jsx"))
const DiagramQuestionLayout = lazy(() => import("@/components/assessments/attempt/diagram-question-layout.jsx"))

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
  const [serverVerdict, setServerVerdict] = useState(null)
  const [paperComplete, setPaperComplete] = useState(false)
  const requestInProgress = useRef(false)

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
      setServerVerdict(null)
      setPaperComplete(false)
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

  useEffect(() => {
    if (!open || !result?.gradingPending || !attempt) return
    let active = true
    let timer
    async function refresh() {
      try {
        const updated = await getAttemptResult(attempt.assessmentAttemptId, learnerId)
        if (active) setResult(updated)
        if (!updated.gradingPending) return
      } catch {
        // Keep the submitted result visible while waiting for the grader.
      }
      if (active) timer = setTimeout(refresh, 5000)
    }
    timer = setTimeout(refresh, 5000)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [open, result?.gradingPending, attempt, learnerId])

  function start() {
    if (attempt) {
      setError(null)
      setPhase(result ? "result" : "playing")
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
        const started = await startAssessmentAttempt(check.examId, learnerId, key)
        setAttempt(started)
        setServed(orderedItems(started))
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
  const last = paperComplete || index >= total - 1
  const currentKey = adaptive ? (current?.answerKey ?? null) : (Array.isArray(answerKey) ? answerKey[index] : null)
  const local = localVerdict(current, currentAnswer, currentKey)
  const verdict = revealed ? (serverVerdict ?? local) : null
  const busy = phase === "checking" || phase === "submitting"
  const locked = revealed || busy
  const type = questionFormat(current)
  const Workspace = type === "PROGRAMMING" ? ProgrammingQuestionLayout : type === "DIAGRAM" ? DiagramQuestionLayout : null

  // Image-based questions need their secured media before the learner reaches them.
  // This also keeps the modal responsive when all answer choices are diagrams.
  useEffect(() => {
    prefetchAuthedMedia(questions.flatMap(questionMediaKeys))
  }, [questions])

  function setAnswer(patch) {
    if (locked) return
    setAnswers((existing) => ({
      ...existing,
      [current.attemptQuestionId]: { ...(existing[current.attemptQuestionId] ?? {}), ...patch },
    }))
  }

  async function next() {
    if (!answered || requestInProgress.current) return
    requestInProgress.current = true
    try {
      if (!revealed && (adaptive || local)) {
        let mark = local
        if (adaptive) {
          setPhase("checking")
          const response = await answerAdaptiveItems(
            attempt.assessmentAttemptId, learnerId, [toDraftDto(current.attemptQuestionId, currentAnswer)],
            local ? undefined : { timeout: 120_000 },
          )
          const fresh = [response.next, ...(response.queued ?? [])].filter(Boolean)
          setServed((existing) => {
            const byOrder = new Map([...existing, ...fresh].map((item) => [item.displayOrder, item]))
            return [...byOrder.values()].sort((a, b) => a.displayOrder - b.displayOrder)
          })
          setPaperComplete(Boolean(response.completed))
          const graded = response.verdicts?.[current.attemptQuestionId]
          if (graded) {
            mark = { ...graded, correct: graded.isCorrect, expected: graded.correctChoiceText ?? graded.acceptedAnswer }
            setServerVerdict(mark)
          }
          setPhase("playing")
        }
        if (mark?.correct === true) playCorrectMark()
        else if (mark?.correct === false && !(mark.credit > 0)) playWrongMark()
        setRevealed(true)
        return
      }
      if (!last) {
        setRevealed(false)
        setServerVerdict(null)
        setIndex(index + 1)
        return
      }
      setPhase("submitting")
      const before = await snapshotRewards(queryClient)
      const payload = adaptive ? [] : questions.map((q) => toDraftDto(q.attemptQuestionId, answers[q.attemptQuestionId]))
      const submitted = await submitAssessmentAttempt(attempt.assessmentAttemptId, learnerId, payload)
      setResult(submitted)
      setPhase("result")
      await announceRewards({ queryClient, before, title: "Challenge complete", silentXp: true })
    } catch (caught) {
      setError(caught)
      setPhase("error")
    } finally {
      requestInProgress.current = false
    }
  }

  const sources = Array.isArray(lessonNames) ? lessonNames.filter(Boolean) : []
  const count = itemCount ?? 5

  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        data-no-snip
        className={cn(
          "tg-cat-explain max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1rem)] border border-[var(--tg-line)] bg-card text-foreground",
          phase === "playing" || busy || phase === "result"
            ? "flex h-[min(48rem,calc(100dvh-1.5rem))] !max-w-[84rem] flex-col overflow-hidden rounded-[26px] border-rb-swan/90 bg-rb-snow p-0 shadow-[0_28px_90px_-32px_rgba(16,62,48,0.62)] dark:shadow-[0_28px_90px_-24px_rgba(0,0,0,0.75)] sm:!w-[min(90vw,84rem)]"
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
              <Button onClick={attempt && !result ? next : start}>Try again</Button>
            </AlertDialogFooter>
          </>
        ) : phase === "result" && result ? (
          <ResultScreen result={result} questions={questions} onDone={() => { onComplete?.(result); onDismiss?.() }} onReadAgain={onReadAgain ? () => { onComplete?.(result); onDismiss?.(); onReadAgain() } : null} />
        ) : phase === "playing" || busy ? (
          <>
            <AlertDialogHeader className="shrink-0 items-start border-b border-rb-swan/80 bg-[linear-gradient(118deg,var(--tg-soft),var(--card)_62%)] px-5 py-4 text-left sm:px-8 sm:py-4">
              <div className="flex w-full items-center gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-2xl bg-rb-leaf text-white shadow-[0_8px_18px_-10px_rgba(31,132,91,0.9)] dark:text-[#10151a]">
                    <Zap className="size-[18px]" aria-hidden="true" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-rb-leaf-lip">Focus check</p>
                      <span className="rounded-full border border-rb-swan bg-rb-polar px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-rb-eel shadow-sm">
                        {index + 1} <span className="font-medium text-rb-wolf">of {total}</span>
                      </span>
                    </div>
                    <AlertDialogTitle className="mt-0.5 text-lg font-extrabold tracking-[-0.02em] text-rb-eel sm:text-xl">Skim challenge</AlertDialogTitle>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <ProgressDots total={total} current={index} answers={answers} questions={questions} />
              </div>
              <AlertDialogDescription className="sr-only">
                Question {index + 1} of {total}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {Workspace ? (
              <div className="min-h-0 flex-1 overflow-auto p-3">
                <Suspense fallback={<p role="status">Loading workspace…</p>}>
                  <Workspace key={current.attemptQuestionId} question={current} index={index}
                    answer={currentAnswer} onAnswer={setAnswer} attemptId={attempt.assessmentAttemptId}
                    attemptQuestionId={current.attemptQuestionId} learnerId={learnerId} editingLocked={locked} />
                </Suspense>
              </div>
            ) : current ? (
              <div key={current.attemptQuestionId} className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8 sm:py-7">
                <div className="max-h-[38dvh] overflow-y-auto overscroll-contain pr-2 sm:max-h-96">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-rb-wolf">{formatLabel(current)}</p>
                  <p className="text-base font-semibold leading-7 tracking-[-0.008em] text-rb-eel sm:text-lg sm:leading-8">{withInlineMath(current.question)}</p>
                  {current.instructions && <p className="mt-2 whitespace-pre-wrap">{withInlineMath(current.instructions)}</p>}
                  <AuthedImage
                    imageKey={current.questionImageKey ?? current.imageKey}
                    alt="Question reference"
                    zoomable
                    className="tg-media-img-paper mx-auto mt-4 max-h-80 w-auto max-w-full rounded-xl border border-rb-swan object-contain dark:p-1"
                    placeholderClassName="mx-auto mt-4 h-28 w-full max-w-md"
                  />
                </div>

                {isMultipleAnswer(current) ? (
                  <MultipleAnswerChoices question={current} learnerAnswer={currentAnswer?.learnerAnswer}
                    onChange={(learnerAnswer) => setAnswer({ learnerAnswer })} disabled={locked}
                    correctChoiceIds={revealed ? serverVerdict?.correctChoiceIds : null} />
                ) : isMultipleChoice(current) ? (
                  <div
                    className={cn(
                      "grid gap-3",
                      // Long answers read better full width than squeezed into two columns.
                      (current.choices ?? []).every((choice) => String(choice.choiceText ?? "").length <= 60) && "sm:grid-cols-2",
                    )}
                  >
                    {(current.choices ?? []).map((choice, choiceIndex) => {
                      const selected = currentAnswer?.selectedChoiceId === choice.choiceId
                      const isRight = revealed && (serverVerdict?.correctChoiceId ?? currentKey?.correctChoiceId) === choice.choiceId
                      const isWrong = revealed && selected && !isRight
                      const hasImage = Boolean(choice.imageKey)
                      return (
                        <button
                          key={choice.choiceId ?? choiceIndex}
                          type="button"
                          onClick={() => setAnswer({ selectedChoiceId: choice.choiceId })}
                          aria-pressed={selected}
                          disabled={locked}
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
                            {choice.choiceText ? <span className={hasImage ? "block" : undefined}>{withInlineMath(choice.choiceText)}</span> : null}
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
                      <div key={sub.subQuestionId} className="space-y-2">
                        <span className="block text-sm font-semibold text-rb-wolf">{withInlineMath(sub.questionText)}</span>
                        <AuthedImage imageKey={sub.questionImageKey} alt="Sub-question reference" zoomable className="max-h-64 rounded-lg" />
                        <Textarea aria-label={sub.questionText}
                          value={currentAnswer?.subAnswers?.[sub.subQuestionId] ?? ""}
                          onChange={(event) =>
                            setAnswer({ subAnswers: { ...(currentAnswer?.subAnswers ?? {}), [sub.subQuestionId]: event.target.value } })
                          }
                          placeholder="Your answer"
                          autoComplete="off"
                          disabled={locked}
                        />
                      </div>
                    ))}
                  </div>
                ) : type === "PROBLEM_SOLVING" ? (
                  <EquationAnswerInput value={currentAnswer?.learnerAnswer ?? ""} disabled={locked}
                    onChange={(learnerAnswer) => setAnswer({ learnerAnswer })} />
                ) : type === "DESCRIPTIVE" || type === "CRITICAL_THINKING" ? (
                  <Textarea aria-label="Your written answer" placeholder="Write your answer" className="min-h-40"
                    value={currentAnswer?.learnerAnswer ?? ""} disabled={locked}
                    onChange={(event) => setAnswer({ learnerAnswer: event.target.value })} />
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
                    disabled={locked}
                    className="h-12 text-base"
                  />
                )}

              </div>
            ) : null}

            {revealed && (
              <div role="status" className="max-h-[18vh] shrink-0 overflow-auto border-t border-rb-swan bg-rb-polar px-5 py-2 sm:px-8">
                <strong>{verdict ? markLabel(verdict.correct, verdict.credit) : "Answer recorded"}</strong>
                {verdict?.correct === false && verdict.expected && <p>Expected answer · {withInlineMath(verdict.expected)}</p>}
                {(verdict?.feedback || verdict?.explanation || currentKey?.explanation) &&
                  <p className="whitespace-pre-wrap text-sm">{withInlineMath(verdict?.feedback || verdict?.explanation || currentKey.explanation)}</p>}
              </div>
            )}

            <AlertDialogFooter className="shrink-0 border-t border-rb-swan/80 bg-rb-snow/55 px-5 py-4 sm:justify-between sm:px-8 sm:py-5">
              <span className="max-w-[22rem] self-center text-xs leading-5 text-rb-wolf">
                {sources[0] ? <><span className="font-semibold text-rb-eel">Lesson · </span>{sources[0]}</> : null}
              </span>
              <Button onClick={next} disabled={!answered || busy} className="h-11 gap-2 rounded-xl px-5 shadow-[0_10px_20px_-14px_rgba(19,70,52,0.8)]">
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Checking
                  </>
                ) : !revealed && (adaptive || local) ? (
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
              <AlertDialogTitle className="font-rb-display text-xl font-extrabold text-foreground">Lesson focus check</AlertDialogTitle>
              <AlertDialogDescription className="text-[15px] leading-relaxed text-muted-foreground">
                You moved through this lesson quickly. Before continuing, take{" "}
                {count} {count === 1 ? "question" : "questions"} about the material you just passed.
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

function ResultScreen({ result, questions, onDone, onReadAgain }) {
  const answers = result.answers ?? []
  const pending = result.pendingCount ?? answers.filter((answer) => answer.pendingManualEvaluation).length
  const marking = result.gradingPending || pending > 0

  return (
    <>
      <AlertDialogHeader className="shrink-0 border-b border-rb-swan bg-rb-polar px-5 py-5 text-left sm:px-8">
        <div className="flex w-full items-center gap-3">
          <AlertDialogMedia className="shrink-0 bg-rb-leaf-wash text-rb-leaf-lip"><Trophy /></AlertDialogMedia>
          <div className="flex-1">
            <AlertDialogTitle>Challenge results</AlertDialogTitle>
            <AlertDialogDescription aria-live="polite">
              {marking ? `${pending} awaiting review` : result.passed ? "Passed" : "Below the passing score"}
              {" · "}{result.correctCount ?? 0} of {answers.length} correct
            </AlertDialogDescription>
          </div>
          {!marking && result.percentage != null &&
            <p className="text-3xl font-bold tabular-nums" aria-label="Final score">{Math.round(result.percentage)}%</p>}
        </div>
      </AlertDialogHeader>
      <ol className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 py-5 sm:px-8">
        {answers.map((answer, index) => {
          const question = questions.find((item) => item.attemptQuestionId === answer.attemptQuestionId) ?? answer
          return <AnswerReview key={answer.attemptQuestionId} answer={answer} question={question} index={index} />
        })}
      </ol>
      <AlertDialogFooter className="shrink-0 border-t border-rb-swan px-5 py-4 sm:justify-between sm:px-8">
        {onReadAgain && <Button variant="outline" onClick={onReadAgain}>Read the lesson again</Button>}
        <Button onClick={onDone}>Continue reading</Button>
      </AlertDialogFooter>
    </>
  )
}

function AnswerReview({ answer, question, index }) {
  const { submittedCode, diagramSubmitted, learnerAnswer } = answer
  const subQuestionAnswers = answer.subQuestionAnswers ?? []
  const partial = answer.credit > 0 && answer.credit < 1
  const label = answer.pendingManualEvaluation ? "Awaiting review" : markLabel(answer.isCorrect, answer.credit)
  const choices = question.choices ?? []
  const pickedIds = isMultipleAnswer(question) ? parseChoiceIds(learnerAnswer) : [answer.selectedChoiceId]
  const picks = choices.filter((choice) => pickedIds.includes(choice.choiceId))
  const selectedImages = (answer.choiceImages ?? []).filter((image) => pickedIds.includes(image.choiceId))
  const imageByChoiceId = new Map(selectedImages.map((image) => [image.choiceId, image.imageKey]))
  const choice = isMultipleChoice(question) || isMultipleAnswer(question)
  const type = questionFormat(question)
  return (
    <li className="space-y-3 rounded-xl border border-rb-swan bg-rb-snow p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold capitalize text-rb-wolf">{index + 1} · {formatLabel(question)}</span>
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold",
          answer.pendingManualEvaluation || partial ? "bg-rb-fox-wash text-rb-fox-lip"
            : answer.isCorrect ? "bg-rb-leaf-wash text-rb-leaf-lip" : "bg-rb-cardinal-wash text-rb-cardinal-lip")}>
          {label}{partial && !answer.pendingManualEvaluation && ` · ${Math.round(answer.credit * 100)}%`}
        </span>
      </div>
      <p className="whitespace-pre-wrap font-semibold">{withInlineMath(answer.question)}</p>
      <AuthedImage imageKey={answer.questionImageKey ?? question.questionImageKey ?? question.imageKey} alt="Question reference" zoomable className="max-h-52 rounded-lg" />
      {choice && <div>
        <p className="font-medium">Your {isMultipleAnswer(question) ? "choices" : "choice"}</p>
        {picks.length ? picks.map((pick) => (
          <div key={pick.choiceId}>{withInlineMath(pick.choiceText)}
            <AuthedImage imageKey={pick.imageKey ?? imageByChoiceId.get(pick.choiceId)} alt="Selected choice" zoomable className="max-h-40 rounded-lg" />
          </div>
        )) : (
          <>
            {answer.selectedChoiceText ?? (selectedImages.length ? null : "No selection")}
            {selectedImages.map((image) => (
              <AuthedImage key={image.choiceId} imageKey={image.imageKey} alt="Selected choice" zoomable className="max-h-40 rounded-lg" />
            ))}
          </>
        )}
      </div>}
      {!choice && learnerAnswer && !subQuestionAnswers?.length && (
        type === "PROBLEM_SOLVING" ? <ProblemSolvingAnswerView value={learnerAnswer} />
          : <p className="whitespace-pre-wrap break-words">{withInlineMath(learnerAnswer)}</p>
      )}
      {subQuestionAnswers?.map((sub) => (
        <div className="border-l-2 border-rb-swan pl-3" key={sub.subQuestionId}>
          <p className="font-medium">{withInlineMath(sub.questionText)}</p>
          <AuthedImage imageKey={sub.questionImageKey ?? question.subQuestions?.find((item) => item.subQuestionId === sub.subQuestionId)?.questionImageKey} alt="Sub-question reference" zoomable className="max-h-40" />
          <p className="whitespace-pre-wrap">{withInlineMath(sub.learnerAnswer || "Unanswered")}</p>
          {sub.feedback && <p className="text-rb-wolf">{withInlineMath(sub.feedback)}</p>}
        </div>
      ))}
      {submittedCode && <div>
        <p className="font-medium">Submitted code{answer.programmingLanguage && ` · ${answer.programmingLanguage}`}</p>
        <pre className="max-h-64 overflow-auto rounded-lg bg-rb-polar p-3"><code>{submittedCode}</code></pre>
        {answer.programOutput != null && <p className="mt-2 whitespace-pre-wrap">Output · {answer.programOutput}</p>}
        {answer.programError && <p className="whitespace-pre-wrap text-rb-cardinal-lip">{answer.programError}</p>}
      </div>}
      {submittedCode && !answer.pendingManualEvaluation && <ProgrammingAnswerBreakdown answer={answer} />}
      {diagramSubmitted && <p className="font-medium">Diagram submitted</p>}
      {diagramSubmitted && answer.diagramElements?.length > 0 && <DiagramAnswerBreakdown elements={answer.diagramElements} />}
      {!answer.pendingManualEvaluation && !answer.isCorrect && answer.correctChoiceText &&
        <p>Correct answer · {withInlineMath(answer.correctChoiceText)}</p>}
      {[...new Set([answer.wrongChoiceExplanation, answer.feedback, answer.explanation].filter(Boolean))].map((text) =>
        <p key={text} className="whitespace-pre-wrap border-t border-rb-swan pt-2">{withInlineMath(text)}</p>)}
    </li>
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
              "h-2 flex-1 rounded-full transition-colors",
              position === current ? "bg-rb-leaf" : done ? "bg-rb-leaf/50" : "bg-rb-swan",
            )}
          />
        )
      })}
    </div>
  )
}

function localVerdict(question, answer, key) {
  if (!question || !answer || !key) return null
  if (isMultipleChoice(question)) {
    if (key.correctChoiceId == null) return null
    return { correct: answer.selectedChoiceId === key.correctChoiceId, expected: key.correctChoiceText }
  }
  if (question.questionType !== "SHORT_ANSWER" || question.subQuestions?.length || !key.acceptedAnswers?.length) return null
  const norm = (v) => String(v ?? "").trim().toLowerCase()
  const given = norm(answer.learnerAnswer)
  const accepted = (key.acceptedAnswers ?? []).map(norm).filter(Boolean)
  return { correct: given.length > 0 && accepted.includes(given), expected: key.acceptedAnswers?.[0] ?? null }
}

function questionFormat(question) {
  const subtype = question?.criticalThinkingType
  return question?.questionType === "CRITICAL_THINKING" && (subtype === "PROGRAMMING" || subtype === "DIAGRAM")
    ? subtype : question?.questionType
}

function formatLabel(question) {
  if (isMultipleChoice(question)) return "Multiple choice"
  if (question?.questionType === "SHORT_ANSWER" && question.subQuestions?.length) return "Fill in the blanks"
  return String(questionFormat(question) ?? "Question").toLowerCase().replaceAll("_", " ")
}

function markLabel(correct, credit) {
  if (credit > 0 && credit < 1) return "Partial credit"
  if (correct == null) return "Awaiting review"
  return correct ? "Correct" : "Incorrect"
}

function orderedItems(attempt) {
  return [...(attempt?.questions ?? [])].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
}

function isMultipleChoice(question) {
  const type = String(question?.questionType ?? "").toUpperCase()
  return type === "MULTIPLE_CHOICE" || type === "MCQ" || type === "TRUE_FALSE"
}

function isAnswered(question, answer) {
  if (!question || !answer) return false
  if (isMultipleChoice(question)) return answer.selectedChoiceId != null
  if (isMultipleAnswer(question)) {
    const count = parseChoiceIds(answer.learnerAnswer).length
    return count > 0 && (!question.selectCount || count === Number(question.selectCount))
  }
  if (question.subQuestions?.some((sub) => !answer.subAnswers?.[sub.subQuestionId]?.trim())) return false
  const type = questionFormat(question)
  if (type === "PROGRAMMING") return Boolean(answer.submittedCode?.trim())
  if (type === "DIAGRAM") return Boolean(answer.diagramSubmissionData?.trim())
  if (question.subQuestions?.length) return true
  return Boolean(answer.learnerAnswer?.trim())
}

export default LessonKnowledgeCheck
