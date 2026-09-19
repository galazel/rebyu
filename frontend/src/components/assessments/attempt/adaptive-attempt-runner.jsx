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
import { LoadingSignal } from "@/components/loading-overlay.jsx"
import { GRADING_MESSAGES } from "@/components/loading-screen.jsx"
import { answerAdaptiveItem } from "@/services/assessmentService.js"
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

  const [current, setCurrent] = useState(initialCurrent)
  const [progress, setProgress] = useState(initialProgress)
  const [draft, setDraft] = useState(() => {
    const saved = initialCurrent ? attempt.savedAnswers?.[initialCurrent.attemptQuestionId] : null
    return saved ? fromDraftDto(saved) : {}
  })
  const [verdict, setVerdict] = useState(null)
  const [phase, setPhase] = useState(() =>
    initialProgress?.stage === "DONE" || !initialCurrent ? "COMPLETED" : "ANSWERING",
  )
  const [pendingNext, setPendingNext] = useState(null)
  /* Set when the item just marked was the last of the main round: the next
     press shows the bell before the first final-round problem. */
  const [enteringFinal, setEnteringFinal] = useState(false)
  const finishedRef = useRef(false)

  const stage = progress?.stage ?? "MAIN"
  const inFinalRound = stage === "FINAL"
  const answeredCount = progress?.answered ?? 0
  const total = progress?.total ?? 0

  /* Completion hands the paper to the page, which submits it and opens the
     result. Once, however many renders see the state. */
  useEffect(() => {
    if (phase === "COMPLETED" && !finishedRef.current) {
      finishedRef.current = true
      onFinish?.()
    }
  }, [phase, onFinish])

  const setAnswer = useCallback((patch) => {
    setDraft((existing) => ({ ...(existing ?? {}), ...patch }))
  }, [])

  const answered = current ? isAnswered(current, draft, isMultipleChoice) : false

  async function check() {
    if (!current || phase !== "ANSWERING") return
    if (!answered && !inFinalRound) return
    setPhase("GRADING")
    try {
      const response = await answerAdaptiveItem(
        attempt.assessmentAttemptId,
        learnerId,
        toDraftDto(current.attemptQuestionId, draft ?? {}),
      )
      setProgress(response.progress)
      setPendingNext(response.next ?? null)
      setEnteringFinal(Boolean(response.enteringFinalRound))
      if (response.verdict) {
        /* Main round: show the marking; the learner moves on when ready. */
        setVerdict(response.verdict)
        setPhase("REVEALED")
        return
      }
      /* Final round: saved, not marked. Straight to the next problem. */
      if (response.completed || !response.next) {
        setPhase("COMPLETED")
      } else if (response.enteringFinalRound) {
        setPhase("FINAL_INTRO")
      } else {
        advance(response.next)
      }
    } catch (error) {
      setPhase("ANSWERING")
      toast.error(error?.response?.data?.message ?? "Could not record that answer. Please try again.")
    }
  }

  function advance(next) {
    setVerdict(null)
    setCurrent(next)
    setDraft({})
    setPendingNext(null)
    setPhase(next ? "ANSWERING" : "COMPLETED")
  }

  function next() {
    if (phase !== "REVEALED") return
    if (!pendingNext) {
      setPhase("COMPLETED")
      return
    }
    if (enteringFinal) {
      setPhase("FINAL_INTRO")
      return
    }
    advance(pendingNext)
  }

  const continueToFinal = useCallback(() => {
    setEnteringFinal(false)
    advance(pendingNext)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingNext])

  if (phase === "COMPLETED" || isSubmitting) {
    return <LoadingSignal messages={GRADING_MESSAGES} />
  }

  const isProgramming = current?.criticalThinkingType === "PROGRAMMING" || current?.questionType === "PROGRAMMING"
  const isDiagram = current?.criticalThinkingType === "DIAGRAM" || current?.questionType === "DIAGRAM"
  const isWorkspace = current?.questionType === "CRITICAL_THINKING" && !isProgramming && !isDiagram
  /* While the last main-round item's marking is on screen the stage has
     already moved to FINAL; the item itself is still a main one. */
  const finalItem = inFinalRound && phase !== "REVEALED"
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
              {finalItem ? "Final round" : "Adaptive"} · Question {Math.min(revealed ? answeredCount : answeredCount + 1, Math.max(total, 1))} of {total}
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
          <FinalRoundFooter onSubmit={check} busy={grading} last={answeredCount + 1 >= total} />
        </div>
      ) : current && isWorkspace ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
          <div className="min-h-0 flex-1 overflow-hidden">
            <WorkspaceQuestionPanel question={current} index={answeredCount} answer={draft} onAnswer={setAnswer} />
          </div>
          <FinalRoundFooter onSubmit={check} busy={grading} last={answeredCount + 1 >= total} />
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
                          onClick={() => !revealed && !grading && setAnswer({ selectedChoiceId: choice.choiceId })}
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
                      if (event.key === "Enter") (revealed ? next : check)()
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
                <Button onClick={revealed ? next : check} disabled={(!answered && !revealed) || grading} className="gap-2">
                  {grading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      Checking
                    </>
                  ) : !revealed ? (
                    finalItem ? (answeredCount + 1 >= total ? "Finish and see results" : "Submit answer") : "Check"
                  ) : !pendingNext ? (
                    <>
                      <Sparkles className="size-4" aria-hidden="true" />
                      See my results
                    </>
                  ) : enteringFinal ? (
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
        <LoadingSignal messages={GRADING_MESSAGES} />
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
