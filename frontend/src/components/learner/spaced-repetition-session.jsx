import { useCallback, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Check, Loader2 } from "@/components/icons"
import {
  ArenaHeader,
  ArenaShell,
  CountdownRing,
  useQuestionClock,
} from "@/components/practice/kahoot-arena.jsx"
import {
  REVIEW_GRADES,
  getDueReviewCards,
  gradeReviewCard,
} from "@/services/reviewService.js"


const RECALL_SECONDS = 20

// The lesson game tools' recall-rating buttons (styles/tutor-games.css).
const GRADE_TONES = {
  AGAIN: "tg-conf-miss",
  HARD: "tg-conf-hard",
  GOOD: "tg-conf-good",
  EASY: "tg-conf-hit",
}

function nextDueLabel(outcome) {
  const days = outcome?.intervalDays
  if (!days && days !== 0) return null
  if (days <= 0) return "again today"
  if (days === 1) return "tomorrow"
  if (days < 30) return `in ${days} days`

  const months = Math.round(days / 30)
  return months <= 1 ? "in about a month" : `in about ${months} months`
}

function Centered({ children }) {
  return (
    <ArenaShell tool="flashcards">
      <section className="m-auto w-full max-w-lg text-center">
        {children}
      </section>
    </ArenaShell>
  )
}

export function SpacedRepetitionSession({ task, certificationId, onComplete, onDismiss }) {
  const [state, setState] = useState({ status: "loading" })
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [lastOutcome, setLastOutcome] = useState(null)
  const [grading, setGrading] = useState(false)

  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true

    let cancelled = false

    getDueReviewCards({ certificationId, lessonId: task?.lessonId ?? null })
      .then((queue) => {
        if (!cancelled) setState({ status: "ready", queue })
      })
      .catch((error) => {
        if (!cancelled) setState({ status: "error", error })
      })

    return () => {
      cancelled = true
    }
  }, [certificationId, task?.lessonId])

  const reveal = useCallback(() => setRevealed(true), [])

  const cards = state.queue?.cards ?? []
  const card = cards[index]

  const remaining = useQuestionClock({
    seconds: RECALL_SECONDS,
    index,
    running: state.status === "ready" && Boolean(card) && !revealed,
    onExpire: reveal,
  })

  async function submitGrade(grade) {
    if (!card || grading) return

    setGrading(true)
    try {
      const outcome = await gradeReviewCard({ questionId: card.questionId, grade })
      setLastOutcome(outcome)
    } catch (error) {
      console.warn("Could not save that review grade.", error)
    } finally {
      setGrading(false)
      setRevealed(false)
      setIndex((current) => current + 1)
    }
  }

  if (state.status === "loading") {
    return (
      <Centered>
        <Loader2 className="mx-auto size-8 animate-spin text-[var(--tg)]" aria-hidden="true" />
        <p className="mt-4 text-lg font-extrabold text-foreground">Finding what is due</p>
      </Centered>
    )
  }

  if (state.status === "error") {
    return (
      <Centered>
        <p className="text-xl font-extrabold text-foreground">Could not load your review</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {state.error?.response?.data?.message ?? state.error?.message ?? "Please try again."}
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={onDismiss}
        >
          Close
        </Button>
      </Centered>
    )
  }

  const { dueCount, seeded } = state.queue

  if (cards.length === 0) {
    return (
      <Centered>
        <span className="tg-badge-icon mx-auto !size-16">
          <Check className="size-8" aria-hidden="true" />
        </span>
        <p className="mt-5 text-2xl font-extrabold text-foreground">Nothing due</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          You have no material waiting for review on this certification. Sit an
          assessment and what you miss will start appearing here.
        </p>
        <Button className="mt-6" onClick={onDismiss}>Close</Button>
      </Centered>
    )
  }

  if (!card) {
    return (
      <Centered>
        <span className="tg-badge-icon mx-auto !size-16">
          <Check className="size-8" aria-hidden="true" />
        </span>
        <p className="mt-5 text-2xl font-extrabold text-foreground">Review complete</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {cards.length} {cards.length === 1 ? "card" : "cards"} reviewed.
          {dueCount > cards.length
            ? ` ${dueCount - cards.length} more still due — they'll be waiting next time.`
            : ""}
        </p>
        <Button className="mt-6" onClick={onComplete}>Done</Button>
      </Centered>
    )
  }

  return (
    <ArenaShell
      tool="flashcards"
      header={
        <ArenaHeader
          title="Spaced repetition"
          tool="flashcards"
          kind="Review"
          subtitle={card.lessonTitle ?? "Scheduled review"}
          position={index + 1}
          total={cards.length}
          onLeave={onDismiss}
          right={
            <CountdownRing remaining={remaining} total={RECALL_SECONDS} paused={revealed} />
          }
        />
      }
    >
      {seeded && index === 0 ? (
        <p className="mx-auto max-w-2xl rounded-2xl bg-[var(--tg-softer)] p-3 text-center text-xs leading-5 text-muted-foreground ring-1 ring-[var(--tg-line)]">
          Some of these are entering your review schedule for the first time, drawn
          from questions you have answered before.
        </p>
      ) : null}

      <div className="flex flex-1 flex-col justify-center py-6 text-center">
        <p className="tg-kicker">Recall this</p>

        <h2 className="mx-auto mt-4 w-full rounded-2xl bg-[var(--tg-softer)] p-6 text-2xl leading-tight font-extrabold text-foreground ring-1 ring-[var(--tg-line)] sm:p-8 sm:text-3xl">
          {card.question}
        </h2>

        {revealed ? (
          <div className="tg-face tg-face-back mx-auto mt-6 max-h-[45vh] w-full animate-in fade-in zoom-in-95 overflow-y-auto duration-300 sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-widest opacity-80">
              Answer
            </p>
            <p className="mt-3 text-xl leading-8 font-semibold sm:text-2xl">
              {card.answer ??
                "This question is marked from its own assessment — check the explanation there."}
            </p>
          </div>
        ) : (
          <button
            type="button"
            className="tg-btn tg-btn-primary mx-auto mt-6 min-w-56 !py-3 !text-base"
            onClick={reveal}
          >
            Show answer
          </button>
        )}
      </div>

      <div className="border-t border-[var(--tg-line)] pt-4">
        <p className="tg-kicker pb-3 text-center">
          {revealed ? "How well did you recall it?" : "Try to recall it before the clock runs out"}
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {REVIEW_GRADES.map((grade) => (
            <button
              key={grade.id}
              type="button"
              disabled={!revealed || grading}
              onClick={() => submitGrade(grade.id)}
              className={`tg-conf !flex-col !gap-0 py-3 ${GRADE_TONES[grade.id] ?? "tg-conf-good"}`}
            >
              <span className="block text-lg font-extrabold">{grade.label}</span>
              <span className="block text-xs opacity-85">{grade.hint}</span>
            </button>
          ))}
        </div>

        {lastOutcome && nextDueLabel(lastOutcome) ? (
          <p className="pt-3 text-center text-xs text-muted-foreground">
            Last card returns {nextDueLabel(lastOutcome)}.
          </p>
        ) : null}
      </div>
    </ArenaShell>
  )
}

export default SpacedRepetitionSession
