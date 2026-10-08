import { useCallback, useEffect, useRef, useState } from "react"


export const ANSWER_TILES = [
  { key: "triangle", face: "var(--color-rb-cardinal)", lip: "var(--color-rb-cardinal-lip)" },
  { key: "diamond", face: "var(--color-rb-feather)", lip: "var(--color-rb-feather-lip)" },
  { key: "circle", face: "var(--color-rb-fox)", lip: "var(--color-rb-fox-lip)" },
  { key: "square", face: "var(--color-rb-leaf)", lip: "var(--color-rb-leaf-lip)" },
]

function TileShape({ shape, className = "" }) {
  const common = { className, viewBox: "0 0 24 24", "aria-hidden": "true", fill: "currentColor" }

  switch (shape) {
    case "triangle":
      return (
        <svg {...common}>
          <path d="M12 3 22 21H2z" />
        </svg>
      )
    case "diamond":
      return (
        <svg {...common}>
          <path d="M12 2 22 12 12 22 2 12z" />
        </svg>
      )
    case "circle":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.5" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      )
  }
}

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
    <div className="relative grid size-16 shrink-0 place-items-center">
      <svg viewBox="0 0 60 60" className="size-16 -rotate-90">
        <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
        <circle
          cx="30"
          cy="30"
          r="26"
          fill="none"
          stroke={urgent ? "var(--color-rb-cardinal)" : "#ffffff"}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          className="transition-[stroke-dashoffset] duration-300 ease-linear"
        />
      </svg>

      <span
        className={`absolute font-rb-display text-xl font-extrabold tabular-nums ${
          urgent ? "text-rb-cardinal" : "text-white"
        } ${paused ? "opacity-50" : ""}`}
      >
        {remaining}
      </span>
    </div>
  )
}

export function AnswerTile({ index, label, selected, state, disabled, onSelect }) {
  const tile = ANSWER_TILES[index % ANSWER_TILES.length]
  const dimmed = state === "dimmed"
  const wrong = state === "wrong"


  const face = wrong ? "var(--color-rb-cardinal)" : tile.face
  const lip = wrong ? "var(--color-rb-cardinal-lip)" : tile.lip

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={selected}
      style={{ background: face, boxShadow: `0 6px 0 0 ${lip}` }}
      className={`flex min-h-28 items-center gap-4 rounded-2xl px-5 py-4 text-left text-white transition duration-150 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-white enabled:hover:-translate-y-0.5 enabled:active:translate-y-0.5 enabled:active:shadow-none ${
        dimmed ? "opacity-35 saturate-50" : ""
      } ${selected ? "ring-4 ring-white ring-offset-2 ring-offset-transparent" : ""}`}
    >
      <TileShape shape={tile.key} className="size-8 shrink-0 drop-shadow" />

      <span className="font-rb-display text-lg leading-6 font-extrabold sm:text-xl">
        {label}
      </span>

      {state === "correct" || wrong ? (
        <span className="ml-auto shrink-0 font-rb-display text-sm font-extrabold uppercase tracking-wide">
          {wrong ? "Your answer" : "Correct"}
        </span>
      ) : null}
    </button>
  )
}

export function ArenaShell({ children, header }) {
  return (
    <main className="flex min-h-dvh flex-col bg-[linear-gradient(160deg,#1B1F3B_0%,#2A1F5B_45%,#12142B_100%)] px-4 py-4 text-white sm:px-6">
      {header}
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">{children}</div>
    </main>
  )
}

export function ArenaHeader({ title, subtitle, position, total, onLeave, right }) {
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center gap-4 pb-4">
      <button
        type="button"
        onClick={onLeave}
        className="rounded-full border border-white/25 px-4 py-2 font-rb-display text-xs font-extrabold uppercase tracking-wide text-white/85 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Leave
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate font-rb-display font-extrabold">{title}</p>
        <p className="truncate text-xs text-white/70">{subtitle}</p>
      </div>

      <span className="rounded-full bg-white/15 px-3 py-1 font-rb-display text-sm font-extrabold tabular-nums">
        {position} / {total}
      </span>

      {right}
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
