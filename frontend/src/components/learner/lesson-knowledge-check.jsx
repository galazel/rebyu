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
import { playCorrectMark, playWrongMark } from "@/lib/sound.js"

/**
 * The skim challenge: five quick questions from the lesson on screen, sprung
 * when the reading-pace guard catches the learner racing through it.
 *
 * <p>Played inside the modal, one question at a time, like a round of a quiz
 * game: pick a tile or type a word, hit next, see the score. Only multiple
 * choice and short answer are ever served here (the server filters to those),
 * so no workspace, editor or canvas is needed. Grading, XP and mastery events
 * still run through the ordinary attempt engine -- the modal mints a real
 * check, starts an attempt, and submits it.
 *
 * <p>The check is an adaptive attempt, the same engine as the lesson quiz:
 * the server picks each item by the learner's ability from this lesson's
 * bank, avoids what they have met, and re-estimates after every answer. The
 * modal follows the same protocol the full-page runner does -- the key rides
 * with each served item so the mark is instant, answers go to the server in
 * the background, the next item is already held in reserve -- only smaller.
 * A check minted the old way (a fixed paper with a separate key) still plays.
 *
 * <h3>Why it does not close</h3>
 * The challenge is a gate: escape and outside-click are both suppressed, so
 * the lesson is unreadable until it is dealt with. The single exception is the
 * error path -- if the check cannot be minted there is nothing to answer, and
 * leaving the learner sealed behind a modal over a failed request would trap
 * them in the lesson with no way out.
 */
export function LessonKnowledgeCheck({ open, lessonId, learnerId, itemCount, lessonNames, currentLessonOnly = true, attempt: preparedAttempt = null, answerKey = [], onDismiss, onReadAgain }) {
  const queryClient = useQueryClient()

  const [phase, setPhase] = useState("intro")
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(null)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [revealed, setRevealed] = useState(false)
  const [result, setResult] = useState(null)

  /* Minted at most once per opening. Without the guard a double-click, or
     React's development double-invoke, mints two checks for one interruption
     and the second sits abandoned in the learner's history. */
  const mintingRef = useRef(false)

  /* Adaptive protocol: items served so far by position, and the answers
     still on their way to the server. One request in flight at a time,
     carrying everything queued since the last one. */
  const [served, setServed] = useState([])
  const outboxRef = useRef([])
  const inFlightRef = useRef(false)
  const pendingRef = useRef(Promise.resolve())

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
      return
    }
    /* Opened with the attempt already started: the intro is a gate, not a
       wait -- "Take the challenge" goes straight to question one. */
    if (preparedAttempt) {
      mintingRef.current = true
      setAttempt(preparedAttempt)
      setServed(orderedItems(preparedAttempt))
    }
  }, [open, preparedAttempt])

  const adaptive = Boolean(attempt?.adaptive)

  /* Sends everything queued to the server in one request; the items it
     serves in return join the reserve. Failure ends the round -- the paper on
     screen and on record have parted, and answering on is pointless. */
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
        setError(caught)
        setPhase("error")
      })
      .finally(() => {
        inFlightRef.current = false
        pump()
      })
    pendingRef.current = pendingRef.current.then(() => request.catch(() => null))
  }

  function record(question, answer) {
    outboxRef.current.push({ question, answer })
    pump()
  }

  function start() {
    if (attempt) {
      setPhase("playing")
      return
    }
    if (mintingRef.current) return
    mintingRef.current = true
    setPhase("minting")
    setError(null)

    createKnowledgeCheck(lessonId, { currentLessonOnly })
      .then(async (check) => {
        if (!check?.examId) {
          /* Eligibility is re-checked server-side, so a check can legitimately
             come back unavailable if the learner raced another tab. Nothing to
             answer means nothing to gate on. */
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
  /* The key comes with the item on an adaptive check; on a fixed paper it is
     the separate list, by position. */
  const currentKey = adaptive ? (current?.answerKey ?? null) : (Array.isArray(answerKey) ? answerKey[index] : null)
  const verdict = revealed ? localVerdict(current, currentAnswer, currentKey) : null
  /* The next item is still on its way from the server (the learner is faster
     than the round trip): the button waits rather than the whole modal. */
  const awaitingNext = adaptive && revealed && !last && !questions[index + 1]

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
      /* Marked here from the key; the server marks it too, in the background,
         and picks the item after next from what it learned. */
      if (adaptive) record(current, currentAnswer)
      return
    }
    if (!last) {
      setRevealed(false)
      setIndex(index + 1)
      return
    }
    if (adaptive) {
      /* Nothing more to send: every answer went as it was marked. Wait for the
         last of them to land, then close the round. */
      if (!revealed) record(current, currentAnswer)
      setPhase("submitting")
      const local = localResult(questions, answers, questions.map((question) => question.answerKey ?? null))
      const before = await snapshotRewards(queryClient)
      try {
        await pendingRef.current
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

    /* The score is shown from the marks the learner has already seen, the
       moment they ask for it. The official submit -- XP, mastery, history --
       runs behind it and only rewrites the screen if the server disagrees. */
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
        className={cn(phase === "playing" || phase === "submitting" || phase === "result" ? "sm:max-w-2xl" : null)}
        /* Both suppressed deliberately -- see the class comment. */
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        {phase === "error" ? (
          <>
            <AlertDialogHeader>
              <AlertDialogMedia className="bg-amber-100 text-amber-700">
                <AlertTriangle aria-hidden="true" />
              </AlertDialogMedia>
              <AlertDialogTitle>Could not run the challenge</AlertDialogTitle>
              <AlertDialogDescription>
                {error?.response?.data?.message ?? error?.message ?? "Something went wrong building your questions."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              {/* The only exit this modal offers, and only here: there is no
                  check to sit, so gating the lesson on it would strand them. */}
              <Button variant="outline" onClick={() => onDismiss?.()}>Back to the lesson</Button>
              <Button onClick={start}>Try again</Button>
            </AlertDialogFooter>
          </>
        ) : phase === "result" && result ? (
          <ResultScreen result={result} onDone={() => onDismiss?.()} onReadAgain={onReadAgain ? () => { onDismiss?.(); onReadAgain() } : null} />
        ) : phase === "playing" || phase === "submitting" ? (
          <>
            <AlertDialogHeader className="items-start text-left sm:text-left">
              <div className="flex w-full items-center justify-between gap-3">
                <AlertDialogTitle className="flex items-center gap-2 text-base">
                  <Zap className="size-4 text-rb-leaf" aria-hidden="true" />
                  Skim challenge
                </AlertDialogTitle>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-rb-wolf">
                  {index + 1} / {total}
                </span>
              </div>
              <ProgressDots total={total} current={index} answers={answers} questions={questions} />
              <AlertDialogDescription className="sr-only">
                Question {index + 1} of {total}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {current ? (
              <div key={current.attemptQuestionId} className={cn("space-y-4", verdict && !verdict.correct && "rb-wrong-shake")}>
                <p className="text-base font-medium leading-7 text-rb-eel">{current.question}</p>

                {isMultipleChoice(current) ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(current.choices ?? []).map((choice, choiceIndex) => {
                      const selected = currentAnswer?.selectedChoiceId === choice.choiceId
                      const isRight = revealed && currentKey?.correctChoiceId === choice.choiceId
                      const isWrong = revealed && selected && !isRight
                      return (
                        <button
                          key={choice.choiceId ?? choiceIndex}
                          type="button"
                          onClick={() => setAnswer({ selectedChoiceId: choice.choiceId })}
                          aria-pressed={selected}
                          disabled={revealed}
                          className={cn(
                            "flex min-h-14 items-start gap-3 rounded-2xl border-2 p-3 text-left text-sm leading-6 transition",
                            !revealed && "active:translate-y-[2px]",
                            isRight
                              ? "border-rb-leaf bg-rb-leaf-wash text-rb-leaf-lip"
                              : isWrong
                                ? "border-rb-cardinal bg-rb-cardinal-wash text-rb-cardinal-lip"
                                : selected
                                  ? "border-rb-feather bg-rb-feather-wash text-rb-feather-ink shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-rb-feather)_20%,transparent)]"
                                  : "border-rb-swan bg-rb-snow text-rb-eel hover:border-rb-feather/60 hover:bg-rb-polar",
                            revealed && !isRight && !isWrong && "opacity-60",
                          )}
                        >
                          <span
                            className={cn(
                              "grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold",
                              isRight ? "bg-rb-leaf text-white" : isWrong ? "bg-rb-cardinal text-white" : selected ? "bg-rb-feather text-white" : "bg-rb-polar text-rb-wolf",
                            )}
                          >
                            {isRight ? <CheckCircle2 className="size-4" aria-hidden="true" /> : isWrong ? <XCircle className="size-4" aria-hidden="true" /> : String.fromCharCode(65 + choiceIndex)}
                          </span>
                          <span className="min-w-0">{choice.choiceText}</span>
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
                      <p className="mt-1 text-xs leading-5 text-rb-wolf">{currentKey.explanation}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            <AlertDialogFooter className="sm:justify-between">
              <span className="self-center text-xs text-rb-wolf">
                {sources[0] ? `From: ${sources[0]}` : null}
              </span>
              <Button onClick={next} disabled={!answered || phase === "submitting" || awaitingNext} className="gap-2">
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
              <AlertDialogMedia className="bg-rb-leaf-wash text-rb-leaf-lip">
                <Zap aria-hidden="true" />
              </AlertDialogMedia>
              <AlertDialogTitle>Oops, caught you skimming!</AlertDialogTitle>
              <AlertDialogDescription>
                That was faster than anyone can read. Prove you have got it:{" "}
                {count} quick {count === 1 ? "question" : "questions"} on what you just scrolled
                past. Get them right and carry on.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {sources.length > 0 ? (
              <div className="rounded-lg border border-rb-swan bg-rb-polar px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rb-wolf">Lesson</p>
                <p className="mt-1.5 text-sm leading-6 text-rb-eel">{sources.join(" · ")}</p>
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
                    Take the challenge
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

function ResultScreen({ result, onDone, onReadAgain }) {
  const answers = result?.answers ?? []
  const correct = answers.filter((answer) => answer.isCorrect === true).length
  const pending = answers.filter((answer) => answer.pendingManualEvaluation).length
  const total = answers.length
  const perfect = total > 0 && correct === total
  const passed = Boolean(result?.passed)

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogMedia className={cn(passed ? "bg-rb-leaf-wash text-rb-leaf-lip" : "bg-rb-fox-wash text-rb-fox-lip")}>
          <Trophy aria-hidden="true" />
        </AlertDialogMedia>
        <AlertDialogTitle>
          {perfect ? "Perfect round!" : passed ? "Nice recovery" : "Worth a re-read"}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {correct} of {total} correct
          {pending > 0 ? ` · ${pending} awaiting review` : ""}
          {perfect
            ? " — you clearly got it. Carry on."
            : passed
              ? " — take the next sections a little slower."
              : " — the answers below are the parts you scrolled past."}
        </AlertDialogDescription>
      </AlertDialogHeader>

      <ol className="max-h-72 space-y-2 overflow-y-auto pr-1">
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
                  <p className="font-medium leading-5 text-rb-eel">{answer.question}</p>
                  <p className="text-xs text-rb-wolf">
                    You answered: <span className="font-medium text-rb-eel">{answer.selectedChoiceText ?? answer.learnerAnswer ?? "—"}</span>
                  </p>
                  {state === "incorrect" && answer.correctChoiceText ? (
                    <p className="text-xs text-rb-wolf">
                      Correct: <span className="font-medium text-rb-leaf-lip">{answer.correctChoiceText}</span>
                    </p>
                  ) : null}
                  {answer.explanation ? (
                    <p className="text-xs leading-5 text-rb-wolf">{answer.explanation}</p>
                  ) : null}
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      {/* Two ways out, and the score says which is the honest one: a round
          that went badly is offered the lesson from the top; a round that
          went well, the place they were at. Both are always there. */}
      <AlertDialogFooter className="sm:justify-between">
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

/* The result screen's shape, built from the local marks so it can be shown
   before the server has graded. Same fields the server review uses. */
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

/* Marks an answer against the check's own key, for the moment it is given.
   The server's grade on submit is still the one that counts. */
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

/* The items an attempt was started with, in paper order: on an adaptive
   check the first is the one being asked and the rest are held in reserve. */
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

/* Mirrors the attempt page's serializer so the engine grades this exactly as
   it would the same question sat there. */
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
