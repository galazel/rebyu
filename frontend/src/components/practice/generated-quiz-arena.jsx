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

/**
 * A generated quiz, played rather than sat.
 *
 * <p>The attempt runner behind this is the one every REBYU assessment uses --
 * item navigator, flags, skips, autosave, a server-issued clock for the whole
 * paper. That is right for a mock exam and far too much furniture for the
 * ten-question quiz the tutor generates from a lesson: an exam hall for a
 * warm-up.
 *
 * <p>This is the same attempt with the same endpoints -- answers still autosave
 * through the page's own `setAnswer`, and finishing still submits the same
 * payload for the same server-side grading. What changes is the framing: one
 * question filling the window, four coloured tiles, and a clock per question.
 *
 * <h3>Where the verdict between questions comes from</h3>
 * The browser still does not mark the paper. A locked choice is sent to
 * {@code /choice/{attemptQuestionId}/check}, which marks it the same way
 * submission will and answers with what it made of it, so the tile that lights
 * up and the score at the end cannot disagree. The choices in this page carry
 * no correct flag and never have -- reading one off the payload would put the
 * answers in the page for anyone with a network tab open.
 *
 * <p>Which choice was right, and why, arrive only when the exam releases its
 * answers. Where it does not, the learner is still told whether theirs stood:
 * they have locked it and cannot change it, and that much is theirs to know.
 */

/** Per question. Enough to read four options, not enough to deliberate. */
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
  /* Locked per question, not per answer: a tile can be changed until the clock
     stops or the learner moves on, and after that the question is done. This is
     the arena's own state -- the attempt still holds the answer itself. */
  const [lockedIds, setLockedIds] = useState(() => new Set())

  /* The server's marking of each locked choice, by question. Kept here rather
     than on the attempt because it is what this runner shows, not part of the
     answer: the attempt is still marked in full at submission. */
  const [verdicts, setVerdicts] = useState(() => ({}))

  const question = questions[currentIndex]
  const answer = question ? answers[question.attemptQuestionId] : null
  const locked = question ? lockedIds.has(question.attemptQuestionId) : false
  const verdict = question ? verdicts[question.attemptQuestionId] : null
  const isLast = currentIndex === questions.length - 1

  const lock = useCallback(
    (selectedChoiceId) => {
      if (!question) return
      setLockedIds((current) => new Set(current).add(question.attemptQuestionId))

      /* Only a choice can be marked this way, and only one that was actually
         picked: a question the clock ran out on has nothing to send, and is
         marked unanswered at submission like any other. */
      if (selectedChoiceId == null || !onCheckChoice) return
      const questionId = question.attemptQuestionId
      Promise.resolve(onCheckChoice(questionId, selectedChoiceId))
        .then((result) => {
          if (result) setVerdicts((current) => ({ ...current, [questionId]: result }))
        })
        /* A verdict that does not arrive costs the learner the feedback, not
           the question: the answer is already saved, and submission marks it
           regardless. Falling back to the old "marked at the end" line is a
           better failure than a tile that never resolves. */
        .catch(() => {})
    },
    [question, onCheckChoice]
  )

  /* Time up locks whatever is selected, blank included -- an unanswered
     question is submitted unanswered and marked wrong, the same as it would be
     on the standard runner when the paper's clock runs out. */
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
              /* Once the server has answered: the right tile lights up, the
                 learner's own stays lit so they can see what they picked
                 against it, and the rest step back. Until then -- or where
                 the exam withholds its answers -- only the picked tile stays
                 lit, exactly as before. */
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

      {/* Said once, plainly. With a verdict it is the verdict; without one --
          a typed answer, a question the clock took, or a check that did not
          come back -- it is still the old promise, so a learner watching a
          tile dim never concludes the quiz is broken. */}
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
          disabled={!locked || isSubmitting}
          className="min-w-40 font-rb-display font-extrabold"
          onClick={() => {
            if (isLast) onFinish()
            else onIndexChange(currentIndex + 1)
          }}
        >
          {isLast ? (isSubmitting ? "Marking..." : "Finish") : "Next"}
        </Button>
      </div>
    </ArenaShell>
  )
}

export default GeneratedQuizArena
