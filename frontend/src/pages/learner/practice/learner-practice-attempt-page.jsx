import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Layers3, Trophy } from "@/components/icons"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AnswerTile,
  ArenaHeader,
  ArenaShell,
  CountdownRing,
  speedPoints,
  useQuestionClock,
} from "@/components/practice/kahoot-arena.jsx"
import {
  completePracticeAttempt,
  getStudySet,
  startPracticeAttempt,
  submitPracticeAnswer,
} from "@/services/practiceService"
import { IconButton } from "@/components/learner/tutor-game-kit.jsx"

const MCQ_SECONDS = 20
const RECALL_SECONDS = 30

const RATINGS = [
  ["AGAIN", "Again"],
  ["HARD", "Hard"],
  ["GOOD", "Good"],
  ["EASY", "Easy"],
]

function choicesOf(item) {
  try {
    return typeof item.choicesJson === "string"
      ? JSON.parse(item.choicesJson)
      : (item.choicesJson ?? [])
  } catch {
    return []
  }
}

export default function LearnerPracticeAttemptPage() {
  const { studySetId } = useParams()
  const navigate = useNavigate()

  const [studySet, setStudySet] = useState(null)
  const [attempt, setAttempt] = useState(null)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [results, setResults] = useState({})
  const [flashcardRating, setFlashcardRating] = useState("GOOD")
  const [isSaving, setIsSaving] = useState(false)
  const [completion, setCompletion] = useState(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    let live = true
    Promise.all([getStudySet(studySetId), startPracticeAttempt(studySetId)])
      .then(([set, nextAttempt]) => {
        if (live) {
          setStudySet(set)
          setAttempt(nextAttempt)
        }
      })
      .catch(() => toast.error("This practice set could not be opened."))
    return () => {
      live = false
    }
  }, [studySetId])

  const item = studySet?.items?.[index]
  const isFlashcard = studySet?.type === "FLASHCARD"
  const seconds = isFlashcard ? RECALL_SECONDS : MCQ_SECONDS
  const answer = item ? (answers[item.id] ?? "") : ""
  const result = item ? results[item.id] : null
  const locked = Boolean(result)
  const isLast = studySet && index === studySet.items.length - 1
  const choices = useMemo(() => (item ? choicesOf(item) : []), [item])

  const remainingRef = useRef(seconds)

  const lockIn = useCallback(
    async (value) => {
      if (!item || !attempt || locked || isSaving) return

      const submitted = String(value ?? "")
      const earnedFrom = remainingRef.current

      setIsSaving(true)
      setAnswers((current) => ({ ...current, [item.id]: submitted }))

      try {
        const saved = await submitPracticeAnswer(attempt.id, {
          studyItemId: item.id,
          answer: submitted,
          flashcardRating: isFlashcard ? flashcardRating : null,
        })

        setResults((current) => ({ ...current, [item.id]: saved }))
        setScore(
          (current) =>
            current +
            speedPoints({ correct: saved.correct, remaining: earnedFrom, total: seconds })
        )
        setStreak((current) => (saved.correct ? current + 1 : 0))
      } catch {
        toast.error("Your answer could not be saved.")
      } finally {
        setIsSaving(false)
      }
    },
    [attempt, flashcardRating, isFlashcard, isSaving, item, locked, seconds]
  )

  const remaining = useQuestionClock({
    seconds,
    index,
    running: Boolean(item) && !locked && !completion,
    onExpire: () => {
      void lockIn(answers[item?.id] ?? "")
    },
  })

  if (!locked) remainingRef.current = remaining

  async function advance() {
    if (!isLast) {
      setIndex((value) => value + 1)
      setFlashcardRating("GOOD")
      return
    }

    try {
      setCompletion(await completePracticeAttempt(attempt.id))
    } catch {
      toast.error("Finish every item before completing.")
    }
  }

  async function rateFlashcard(value) {
    setFlashcardRating(value)
    if (!item || !attempt || !results[item.id]) return

    try {
      const saved = await submitPracticeAnswer(attempt.id, {
        studyItemId: item.id,
        answer,
        flashcardRating: value,
      })
      setResults((current) => ({ ...current, [item.id]: saved }))
    } catch {
      toast.error("Your flashcard rating could not be saved.")
    }
  }

  if (!studySet || !attempt) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Skeleton className="h-10 w-44" />
        <Skeleton className="mt-6 h-[440px] w-full" />
      </div>
    )
  }

  if (completion) {
    return (
      <ArenaShell>
        <section className="tg-result m-auto w-full max-w-xl p-8 text-center">
          <Trophy className="tg-confetti mx-auto size-14 text-[var(--tg)]" />

          <p className="tg-kicker mt-5">Practice complete</p>

          <h1 className="mt-2 text-5xl font-black tabular-nums text-foreground">
            {Math.round(completion.percentage)}%
          </h1>

          <p className="mt-3 text-muted-foreground">
            You got {completion.score} of {completion.totalItems} correct.
          </p>

          <p className="mt-4 text-lg font-extrabold text-[var(--tg-ink)]">
            {score.toLocaleString()} speed points
            <span className="ml-2 align-middle text-xs font-bold uppercase tracking-wide text-muted-foreground">
              this run only
            </span>
          </p>

          {completion.xpEarned > 0 ? (
            <p className="mt-2 font-semibold text-rb-macaw">+{completion.xpEarned} XP</p>
          ) : null}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(`/learner/practice-review/${completion.id}`)}
            >
              Review answers
            </Button>
            <Button onClick={() => navigate("/learner/library")}>Back to library</Button>
          </div>
        </section>
      </ArenaShell>
    )
  }

  const correctText =
    item.correctAnswer ??
    choices.find((choice) => choice.isCorrect)?.text ??
    ""

  return (
    <ArenaShell
      tool={isFlashcard ? "flashcards" : "quiz"}
      header={
        <ArenaHeader
          title={studySet.title}
          subtitle={isFlashcard ? "Recall round" : "Quiz round"}
          tool={isFlashcard ? "flashcards" : "quiz"}
          position={index + 1}
          total={studySet.items.length}
          onLeave={() => navigate(-1)}
          right={
            <div className="flex items-center gap-4">
              <span className="tg-pill hidden sm:inline">
                {score.toLocaleString()} {streak > 1 ? `· ${streak} in a row` : "points"}
              </span>
              <CountdownRing remaining={remaining} total={seconds} paused={locked} />
            </div>
          }
        />
      }
    >
      <p className="mb-4 text-sm text-muted-foreground">
        {isFlashcard ? "Type what you remember, then rate your recall." : "Pick one answer before the timer runs out."}
      </p>

      <h2 className="mb-6 rounded-2xl bg-[var(--tg-softer)] p-6 text-2xl leading-tight font-extrabold text-foreground ring-1 ring-[var(--tg-line)] sm:p-8 sm:text-3xl">
        {item.questionText}
      </h2>

      {isFlashcard ? (
        <div className="mx-auto w-full max-w-2xl rounded-2xl bg-[var(--tg-softer)] p-6 ring-1 ring-[var(--tg-line)]">
          <div className="tg-kicker flex items-center justify-center gap-2">
            <Layers3 className="size-4" />
            Type what you remember
          </div>

          <Input
            autoFocus
            className="mt-4 h-14 bg-card text-lg"
            value={answer}
            disabled={locked}
            onChange={(event) =>
              setAnswers((current) => ({ ...current, [item.id]: event.target.value }))
            }
            onKeyDown={(event) => {
              if (event.key === "Enter" && !locked) void lockIn(answer)
            }}
            placeholder="Your answer"
          />

          {!locked ? (
            <Button
              type="button"
              className="mt-4 w-full"
              disabled={isSaving}
              onClick={() => void lockIn(answer)}
            >
              Lock it in
            </Button>
          ) : (
            <div className="mt-5">
              <p className="tg-kicker">
                How well did you remember it?
              </p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {RATINGS.map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={flashcardRating === value ? "default" : "outline"}
                    onClick={() => rateFlashcard(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-3 text-left sm:grid-cols-2">
          {choices.map((choice, choiceIndex) => (
            <AnswerTile
              key={`${choice.text}-${choiceIndex}`}
              index={choiceIndex}
              label={choice.text}
              selected={answer === choice.text}
              disabled={locked || isSaving}
              state={
                !locked
                  ? "idle"
                  : choice.text === correctText
                    ? "correct"
                    : answer === choice.text
                      ? "wrong"
                      : "dimmed"
              }
              onSelect={() => void lockIn(choice.text)}
            />
          ))}
        </div>
      )}

      {locked ? (
        <div
          role="status"
          className={`mt-6 animate-in fade-in rounded-2xl p-5 text-center text-foreground duration-300 ${
            result.correct ? "bg-emerald-500/12 ring-1 ring-emerald-500/40" : "bg-rose-500/10 ring-1 ring-rose-500/40"
          }`}
        >
          <p className={`text-2xl font-extrabold ${result.correct ? "text-emerald-600" : "text-rose-600"}`}>
            {result.correct ? "Correct!" : "Not quite"}
          </p>

          {!result.correct && correctText ? (
            <p className="mt-1 font-semibold">Answer: {correctText}</p>
          ) : null}

          {result.explanation ? (
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {result.explanation}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-auto flex justify-end border-t border-[var(--tg-line)] pt-4">
        <IconButton
          icon={isLast ? "check" : "next"}
          primary
          disabled={!locked}
          onClick={advance}
          label={isLast ? "Finish round" : "Next question"}
          className="!size-14"
        />
      </div>
    </ArenaShell>
  )
}
