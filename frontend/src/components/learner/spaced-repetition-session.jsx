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

const GRADE_FACES = {
  AGAIN: "var(--color-rb-cardinal)",
  HARD: "var(--color-rb-fox)",
  GOOD: "var(--color-rb-feather)",
  EASY: "var(--color-rb-leaf)",
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
    <ArenaShell>
      <section className="m-auto w-full max-w-lg rounded-3xl bg-white/10 p-8 text-center backdrop-blur">
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
        <Loader2 className="mx-auto size-8 animate-spin text-white" aria-hidden="true" />
        <p className="mt-4 font-rb-display text-lg font-extrabold">Finding what is due</p>
      </Centered>
    )
  }

  if (state.status === "error") {
    return (
      <Centered>
        <p className="font-rb-display text-xl font-extrabold">Could not load your review</p>
        <p className="mt-2 text-sm leading-6 text-white/75">
          {state.error?.response?.data?.message ?? state.error?.message ?? "Please try again."}
        </p>
        <Button
          variant="outline"
          className="mt-6 border-white/40 bg-transparent text-white hover:bg-white/10"
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
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-white/15">
          <Check className="size-8" aria-hidden="true" />
        </span>
        <p className="mt-5 font-rb-display text-2xl font-extrabold">Nothing due</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/75">
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
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-white/15">
          <Check className="size-8" aria-hidden="true" />
        </span>
        <p className="mt-5 font-rb-display text-2xl font-extrabold">Review complete</p>
        <p className="mt-2 text-sm text-white/75">
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
      header={
        <ArenaHeader
          title="Spaced repetition"
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
        <p className="mx-auto max-w-2xl rounded-2xl bg-white/10 p-3 text-center text-xs leading-5 text-white/75">
          Some of these are entering your review schedule for the first time, drawn
          from questions you have answered before.
        </p>
      ) : null}

      <div className="flex flex-1 flex-col justify-center py-6 text-center">
        <p className="font-rb-display text-xs font-extrabold uppercase tracking-[0.2em] text-white/60">
          Recall this
        </p>

        <h1 className="mx-auto mt-4 max-w-4xl font-rb-display text-2xl leading-tight font-extrabold text-white sm:text-4xl">
          {card.question}
        </h1>

        {revealed ? (
          <div className="mx-auto mt-10 max-h-[45vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 text-rb-eel shadow-2xl sm:p-8">
            <p className="font-rb-display text-xs font-extrabold uppercase tracking-[0.2em] text-rb-feather">
              Answer
            </p>
            <p className="mt-3 text-xl leading-8 font-semibold sm:text-2xl">
              {card.answer ??
                "This question is marked from its own assessment — check the explanation there."}
            </p>
          </div>
        ) : (
          <Button
            size="lg"
            className="mx-auto mt-10 min-w-56 font-rb-display font-extrabold"
            onClick={reveal}
          >
            Show answer
          </Button>
        )}
      </div>

      <div className="py-6">
        <p className="pb-3 text-center font-rb-display text-xs font-extrabold uppercase tracking-wide text-white/60">
          {revealed ? "How well did you recall it?" : "Try to recall it before the clock runs out"}
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {REVIEW_GRADES.map((grade) => (
            <button
              key={grade.id}
              type="button"
              disabled={!revealed || grading}
              onClick={() => submitGrade(grade.id)}
              style={{ background: GRADE_FACES[grade.id] }}
              className="rounded-2xl px-4 py-4 text-white transition enabled:hover:-translate-y-0.5 disabled:opacity-35 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              <span className="block font-rb-display text-lg font-extrabold">{grade.label}</span>
              <span className="block text-xs opacity-85">{grade.hint}</span>
            </button>
          ))}
        </div>

        {lastOutcome && nextDueLabel(lastOutcome) ? (
          <p className="pt-3 text-center text-xs text-white/50">
            Last card returns {nextDueLabel(lastOutcome)}.
          </p>
        ) : null}
      </div>
    </ArenaShell>
  )
}

export default SpacedRepetitionSession
