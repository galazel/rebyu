import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowLeft, Check, X } from "@/components/icons"
import { categoryClass, GameIcon, OPTION_COLORS } from "@/components/learner/tutor-game-kit.jsx"


export function useCountdown({ seconds, resetKey, running = true, onExpire }) {
  const [remaining, setRemaining] = useState(seconds)
  const expireRef = useRef(onExpire)
  expireRef.current = onExpire

  useEffect(() => {
    setRemaining(seconds)
  }, [seconds, resetKey])

  useEffect(() => {
    if (!running) return undefined

    const started = Date.now()
    const interval = setInterval(() => {
      const left = seconds - Math.floor((Date.now() - started) / 1000)

      if (left <= 0) {
        clearInterval(interval)
        setRemaining(0)
        expireRef.current?.()
        return
      }

      setRemaining(left)
    }, 250)

    return () => clearInterval(interval)
  }, [seconds, resetKey, running])

  return remaining
}

export function CountdownRing({ remaining, total, paused = false }) {
  const safeTotal = Math.max(1, total)
  const fraction = Math.max(0, Math.min(1, remaining / safeTotal))
  const circumference = 2 * Math.PI * 26
  const urgent = !paused && remaining <= 5

  return (
    <div className="relative grid size-14 shrink-0 place-items-center" role="timer" aria-label={`${remaining} seconds left`}>
      <svg viewBox="0 0 60 60" className="size-14 -rotate-90" aria-hidden="true">
        <circle cx="30" cy="30" r="26" fill="none" stroke="var(--tg-soft)" strokeWidth="6" />
        <circle
          cx="30"
          cy="30"
          r="26"
          fill="none"
          stroke={urgent ? "#e0475f" : "var(--tg)"}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          className="transition-[stroke-dashoffset] duration-300 ease-linear"
        />
      </svg>

      <span
        className={`absolute text-lg font-black tabular-nums ${
          urgent ? "text-[#e0475f]" : "text-foreground"
        } ${paused ? "opacity-50" : ""}`}
      >
        {remaining}
      </span>
    </div>
  )
}

// The same lettered answer option as the lesson game tools (tutor-game-kit).
export function AnswerTile({ index, label, selected, state, disabled, onSelect }) {
  const correct = state === "correct"
  const wrong = state === "wrong"

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={selected}
      style={{ "--opt": OPTION_COLORS[index % OPTION_COLORS.length] }}
      className={`tg-option !min-h-20 !px-4 !text-base sm:!text-lg ${
        correct ? "is-right" : wrong ? "is-wrong" : state === "dimmed" ? "is-dim" : ""
      } ${selected && !correct && !wrong ? "ring-2 ring-[var(--opt)] ring-offset-2 ring-offset-[var(--card)]" : ""}`}
    >
      <span className="tg-letter !size-10">
        {correct ? <Check className="size-5" /> : wrong ? <X className="size-5" /> : String.fromCharCode(65 + index)}
      </span>

      <span className="min-w-0 flex-1">{label}</span>

      {correct || wrong ? (
        <span className="tg-chip shrink-0">{wrong ? "Your answer" : "Correct"}</span>
      ) : null}
    </button>
  )
}

/** The page every practice round sits on: the Library item layout (back link,
 *  icon and title) around one game frame, like the lesson game tools. With no
 *  header it is a single centred frame, for the result and error screens. */
export function ArenaShell({ children, header, tool = "quiz" }) {
  return (
    <main className={`mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-6 sm:px-6 ${categoryClass(tool)}`}>
      {header}
      <section
        className={`tg-frame flex flex-1 flex-col items-center p-5 text-center sm:p-8 ${
          header ? "!mt-0 !rounded-t-none !border-t-0" : "my-auto !flex-none"
        }`}
      >
        <div className="flex w-full max-w-4xl flex-1 flex-col">{children}</div>
      </section>
    </main>
  )
}

export function ArenaHeader({ title, subtitle, position, total, onLeave, right, tool = "quiz", kind, leaveLabel = "Back" }) {
  return (
    <header className={categoryClass(tool)}>
      <button
        type="button"
        onClick={onLeave}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-rb-feather-lip hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tg)]"
      >
        <ArrowLeft className="size-4" /> {leaveLabel}
      </button>

      <h1 className="flex items-center gap-3 text-2xl font-extrabold text-foreground">
        <span className="tg-badge-icon !size-12"><GameIcon type={tool} className="size-5" /></span>
        <span className="min-w-0 font-rb-display">{title}</span>
      </h1>
      {subtitle ? <p className="mt-1 text-sm font-semibold text-rb-hare">{subtitle}</p> : null}

      <div className="tg-frame mt-4 !rounded-b-none !shadow-none">
        <div className="tg-head flex items-center gap-3 px-4 py-3">
          <span className="tg-kicker">{kind ?? (tool === "flashcards" ? "Flashcards" : "Quiz")}</span>
          <span className="ml-auto flex items-center gap-3">
            {total ? <span className="tg-pill">{position} / {total}</span> : null}
            {right}
          </span>
          {total ? (
            <span className="tg-progress" role="progressbar" aria-label="Round progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={position}>
              <span style={{ width: `${(position / total) * 100}%` }} />
            </span>
          ) : null}
        </div>
      </div>
    </header>
  )
}

export function speedPoints({ correct, remaining, total }) {
  if (!correct) return 0
  const safeTotal = Math.max(1, total)
  return 500 + Math.round(500 * Math.max(0, Math.min(1, remaining / safeTotal)))
}

export function useQuestionClock({ seconds, index, running, onExpire }) {
  const expire = useCallback(() => onExpire?.(), [onExpire])
  return useCountdown({ seconds, resetKey: index, running, onExpire: expire })
}
