import { useCallback, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AnswerTile,
  ArenaHeader,
  ArenaShell,
  CountdownRing,
  useQuestionClock,
} from "@/components/practice/kahoot-arena.jsx"


const QUESTION_SECONDS = 20

function isMultipleChoice(question) {
  return (
    question?.questionType === "MULTIPLE_CHOICE" ||
    question?.questionType === "TRUE_FALSE" ||
    (question?.choices?.length ?? 0) > 0
  )
}

export function GeneratedQuizArena({
  attempt,
  questions,
  answers,
  onAnswer,
  onCheckChoice,
  currentIndex,
  onIndexChange,
  onFinish,
  onLeave,
  isSubmitting,
  remainingSeconds,
}) {
  const [lockedIds, setLockedIds] = useState(() => new Set())

  const [verdicts, setVerdicts] = useState(() => ({}))

  const [checkingIds, setCheckingIds] = useState(() => new Set())

  const question = questions[currentIndex]
  const answer = question ? answers[question.attemptQuestionId] : null
  const locked = question ? lockedIds.has(question.attemptQuestionId) : false
  const verdict = question ? verdicts[question.attemptQuestionId] : null
  const checking = question ? checkingIds.has(question.attemptQuestionId) : false
  const isLast = currentIndex === questions.length - 1

  const lock = useCallback(
    (selectedChoiceId) => {
      if (!question) return
      setLockedIds((current) => new Set(current).add(question.attemptQuestionId))

      if (selectedChoiceId == null || !onCheckChoice) return
      const questionId = question.attemptQuestionId
      setCheckingIds((current) => new Set(current).add(questionId))
      Promise.resolve(onCheckChoice(questionId, selectedChoiceId))
        .then((result) => {
          if (result) setVerdicts((current) => ({ ...current, [questionId]: result }))
        })
        .catch(() => {})
        .finally(() => {
          setCheckingIds((current) => {
            const next = new Set(current)
            next.delete(questionId)
            return next
          })
        })
    },
    [question, onCheckChoice]
  )

  const remaining = useQuestionClock({
    seconds: QUESTION_SECONDS,
    index: currentIndex,
    running: Boolean(question) && !locked && !isSubmitting,
    onExpire: () => lock(),
  })

  if (!question) return null

  const answeredCount = questions.filter(
    (item) =>
      answers[item.attemptQuestionId]?.selectedChoiceId != null ||
      String(answers[item.attemptQuestionId]?.learnerAnswer ?? "").trim()
  ).length

  return (
    <ArenaShell
      header={
        <ArenaHeader
          title={attempt.assessmentTitle}
          subtitle={`Generated quiz · attempt ${attempt.attemptNumber}`}
          position={currentIndex + 1}
          total={questions.length}
          onLeave={onLeave}
          right={
            <div className="flex items-center gap-4">
              <div className="hidden text-right sm:block">
                <p className="font-rb-display text-xl font-extrabold tabular-nums">
                  {answeredCount}/{questions.length}
                </p>
                <p className="text-[11px] uppercase tracking-wide text-white/60">
                  Answered
                </p>
              </div>

              <CountdownRing
                remaining={remaining}
                total={QUESTION_SECONDS}
                paused={locked}
              />
            </div>
          }
        />
      }
    >
      <h1 className="py-6 text-center font-rb-display text-2xl leading-tight font-extrabold text-white sm:py-10 sm:text-4xl">
        {question.question}
      </h1>

      {isMultipleChoice(question) ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {(question.choices ?? []).map((choice, choiceIndex) => (
            <AnswerTile
              key={choice.choiceId ?? choiceIndex}
              index={choiceIndex}
              label={choice.choiceText}
              selected={answer?.selectedChoiceId === choice.choiceId}
              disabled={locked || isSubmitting}
              state={
                !locked
                  ? "idle"
                  : verdict?.correctChoiceId === choice.choiceId
                    ? "correct"
                    : answer?.selectedChoiceId === choice.choiceId
                      ? verdict && verdict.correct === false
                        ? "wrong"
                        : "idle"
                      : "dimmed"
              }
              onSelect={() => {
                onAnswer(question.attemptQuestionId, {
                  selectedChoiceId: choice.choiceId,
                })
                lock(choice.choiceId)
              }}
            />
          ))}
        </div>
      ) : (
        <div className="mx-auto w-full max-w-2xl rounded-3xl bg-white/10 p-6 backdrop-blur">
          <p className="font-rb-display text-sm font-extrabold text-white/80">
            Type your answer
          </p>

          <Input
            autoFocus
            className="mt-4 h-14 border-white/30 bg-white/95 text-lg text-rb-eel"
            value={answer?.learnerAnswer ?? ""}
            disabled={locked || isSubmitting}
            onChange={(event) =>
              onAnswer(question.attemptQuestionId, {
                learnerAnswer: event.target.value,
              })
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") lock()
            }}
            placeholder="Your answer"
          />

          {!locked ? (
            <Button type="button" className="mt-4 w-full" onClick={lock}>
              Lock it in
            </Button>
          ) : null}
        </div>
      )}

      {locked ? (
        <div className="mt-6 text-center">
          {verdict ? (
            <>
              <p
                className={`font-rb-display text-xl font-extrabold ${
                  verdict.correct ? "text-rb-leaf" : "text-white"
                }`}
              >
                {verdict.correct ? "Correct" : "Not quite"}
              </p>
              {!verdict.correct && !verdict.answersReleased ? (
                <p className="mt-1 text-sm text-white/70">
                  This quiz keeps its answers until you finish.
                </p>
              ) : null}
              {verdict.explanation ? (
                <p className="mx-auto mt-2 max-w-2xl text-sm text-white/80">
                  {verdict.explanation}
                </p>
              ) : null}
            </>
          ) : checking ? (
            <p className="text-sm text-white/70">Marking…</p>
          ) : (
            <p className="text-sm text-white/70">
              Locked in. Every answer is marked when you finish the quiz.
            </p>
          )}
        </div>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-4 py-6">
        <p className="text-xs text-white/50">
          {remainingSeconds != null
            ? `${Math.floor(remainingSeconds / 60)}m left on the whole quiz`
            : ""}
        </p>

        <Button
          size="lg"
          disabled={!locked || checking || isSubmitting}
          className="min-w-40 font-rb-display font-extrabold"
          onClick={() => {
            if (isLast) onFinish()
            else onIndexChange(currentIndex + 1)
          }}
        >
          {checking
            ? "Marking..."
            : isLast
              ? isSubmitting
                ? "Marking..."
                : "Finish"
              : "Next"}
        </Button>
      </div>
    </ArenaShell>
  )
}

export default GeneratedQuizArena
