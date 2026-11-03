import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { CircleAlert, RefreshCw, Trophy } from "@/components/icons"
import { GameIcon } from "@/components/learner/tutor-game-kit.jsx"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArenaHeader,
  ArenaShell,
  CountdownRing,
  useQuestionClock,
} from "@/components/practice/kahoot-arena.jsx"
import { apiMessage } from "@/services/base"
import {
  completePracticeAttempt,
  getStudySet,
  startPracticeAttempt,
  submitPracticeAnswer,
} from "@/services/practiceService"

const RECALL_SECONDS = 25
const ENROLLMENT_ACCESS_MESSAGE = "active certification enrollment is required"

function faceType(text) {
  const length = String(text ?? "").length
  if (length > 320) return "text-base sm:text-xl"
  if (length > 160) return "text-lg sm:text-2xl"
  if (length > 80) return "text-xl sm:text-3xl"
  return "text-2xl sm:text-4xl"
}

const RATINGS = [
  ["AGAIN", "Again", "tg-conf-miss"],
  ["HARD", "Hard", "tg-conf-hard"],
  ["GOOD", "Good", "tg-conf-good"],
  ["EASY", "Easy", "tg-conf-hit"],
]

export default function LearnerFlashcardAttemptPage() {
  const { studySetId } = useParams()
  const navigate = useNavigate()

  const [studySet, setStudySet] = useState(null)
  const [attempt, setAttempt] = useState(null)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [rating, setRating] = useState(null)
  const [saving, setSaving] = useState(false)
  const [completion, setCompletion] = useState(null)
  const [openingError, setOpeningError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let live = true

    async function openFlashcards() {
      setOpeningError(null)
      setStudySet(null)
      setAttempt(null)

      try {
        const nextStudySet = await getStudySet(studySetId)
        if (!live) return

        setStudySet(nextStudySet)

        if (!Array.isArray(nextStudySet?.items) || nextStudySet.items.length === 0) {
          setOpeningError("This flashcard set does not contain any cards yet.")
          return
        }

        const nextAttempt = await startPracticeAttempt(studySetId)
        if (live) setAttempt(nextAttempt)
      } catch (error) {
        if (!live) return

        const message = apiMessage(error, "This flashcard set could not be opened.")
        setOpeningError(message)
        toast.error(message)
      }
    }

    openFlashcards()

    return () => {
      live = false
    }
  }, [studySetId, reloadKey])

  const reveal = useCallback(() => setFlipped(true), [])

  const remaining = useQuestionClock({
    seconds: RECALL_SECONDS,
    index,
    running: Boolean(studySet) && !flipped && !completion,
    onExpire: reveal,
  })

  if (openingError) {
    const enrollmentWasRejected = openingError.toLowerCase().includes(ENROLLMENT_ACCESS_MESSAGE)

    return (
      <ArenaShell tool="flashcards">
        <section className="m-auto w-full max-w-xl text-center">
          <CircleAlert className="mx-auto size-14 text-rb-fox" />

          <p className="tg-kicker mt-5">
            {enrollmentWasRejected ? "Enrollment verification issue" : "Flashcards unavailable"}
          </p>

          <h1 className="mt-2 text-2xl font-extrabold text-foreground">
            {enrollmentWasRejected
              ? "We couldn't verify your active enrollment."
              : "This flashcard set couldn't be opened."}
          </h1>

          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {enrollmentWasRejected
              ? "Your account is shown as enrolled, but the study service did not recognize the active enrollment it expects. This can happen for institution-assigned access and needs service-side verification before it can record this flashcard attempt."
              : openingError}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button variant="secondary" onClick={() => setReloadKey((key) => key + 1)}>
              <RefreshCw className="mr-2 size-4" />
              Try again
            </Button>
            <Button variant="outline" onClick={() => navigate("/learner/library")}>
              Back to library
            </Button>
          </div>
        </section>
      </ArenaShell>
    )
  }

  if (!studySet || !attempt) {
    return (
      <div className="mx-auto max-w-3xl space-y-5 p-6">
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    )
  }

  const item = studySet.items[index]
  const isLast = index === studySet.items.length - 1

  async function rateAndAdvance(value) {
    if (saving) return

    setRating(value)
    setSaving(true)

    try {
      await submitPracticeAnswer(attempt.id, {
        studyItemId: item.id,
        answer: item.correctAnswer ?? "",
        flashcardRating: value,
      })

      if (isLast) {
        setCompletion(await completePracticeAttempt(attempt.id))
      } else {
        setIndex((current) => current + 1)
        setFlipped(false)
        setRating(null)
      }
    } catch {
      toast.error("This flashcard could not be saved.")
    } finally {
      setSaving(false)
    }
  }

  if (completion) {
    return (
      <ArenaShell tool="flashcards">
        <section className="tg-result m-auto w-full max-w-xl p-8 text-center">
          <Trophy className="tg-confetti mx-auto size-14 text-[var(--tg)]" />

          <p className="tg-kicker mt-5">Flashcards complete</p>

          <h1 className="mt-2 text-5xl font-black tabular-nums text-foreground">
            {Math.round(completion.percentage)}%
          </h1>

          <p className="mt-3 text-muted-foreground">You reviewed {completion.totalItems} cards.</p>

          {completion.xpEarned > 0 ? (
            <p className="mt-2 font-semibold text-rb-macaw">+{completion.xpEarned} XP</p>
          ) : null}

          <Button className="mt-8" onClick={() => navigate("/learner/library")}>
            Back to library
          </Button>
        </section>
      </ArenaShell>
    )
  }

  return (
    <ArenaShell
      tool="flashcards"
      header={
        <ArenaHeader
          title={studySet.title}
          subtitle="Flip-card round"
          tool="flashcards"
          position={index + 1}
          total={studySet.items.length}
          onLeave={() => navigate(-1)}
          right={
            <CountdownRing remaining={remaining} total={RECALL_SECONDS} paused={flipped} />
          }
        />
      }
    >
      <p className="mb-4 text-sm text-muted-foreground">
        Recall the answer, flip the card, then rate how well you remembered it.
      </p>

      <button
        type="button"
        className={`tg-flip flex-1 ${flipped ? "is-flipped" : ""}`}
        onClick={() => setFlipped((value) => !value)}
        aria-pressed={flipped}
        aria-label={flipped ? "Show the question" : "Reveal the answer"}
      >
        <span className="tg-flip-inner h-full !min-h-[24rem]">
          <span className="tg-face tg-face-front">
            <span className="tg-badge-icon !size-12"><GameIcon type="flashcards" className="size-5" /></span>
            <span className="tg-kicker">Question</span>
            <span className={`font-extrabold leading-tight ${faceType(item.questionText)}`}>
              {item.questionText}
            </span>
            <span className="mt-2 text-sm font-semibold text-muted-foreground">
              Tap the card or press Space to reveal the answer
            </span>
          </span>

          <span className="tg-face tg-face-back">
            <span className="text-xs font-extrabold uppercase tracking-widest opacity-80">Answer</span>
            <span className={`font-extrabold leading-snug ${faceType(item.correctAnswer)}`}>
              {item.correctAnswer || "Review this concept in the lesson."}
            </span>
            {item.explanation ? (
              <span className="max-w-2xl text-sm leading-6 opacity-90">{item.explanation}</span>
            ) : null}
          </span>
        </span>
      </button>

      <div className="mt-6 border-t border-[var(--tg-line)] pt-4">
        <p className="tg-kicker pb-3">
          {flipped ? "How well did you remember it?" : "Answer first, then rate your recall"}
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {RATINGS.map(([value, label, tone]) => (
            <button
              key={value}
              type="button"
              disabled={!flipped || saving}
              onClick={() => rateAndAdvance(value)}
              className={`tg-conf ${tone} ${rating === value ? "ring-4 ring-[var(--tg)] ring-offset-2" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="pt-3 text-xs text-muted-foreground">
          {isLast ? "Rating the last card finishes the round." : "Rating moves you on."}
        </p>
      </div>
    </ArenaShell>
  )
}
