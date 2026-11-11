import { useState } from "react"

import { ChevronRight } from "@/components/icons"
import { cn } from "@/lib/utils"

/*
 * "How your score was made": the parts a challenge score is built from, what each one
 * weighs, what the learner achieved on it and how many points it added. The rows always
 * add up to the score shown above them (the backend adds a labelled line for anything the
 * parts cannot explain), followed by each problem's mark and feedback.
 */

function points(value) {
  const n = Number(value ?? 0)
  const text = Math.abs(n) < 0.05 ? "0" : Math.abs(n).toFixed(Number.isInteger(Math.round(n * 10) / 10) ? 0 : 1)
  return `${n < 0 ? "−" : "+"}${text}`
}

function mark(value) {
  const n = Number(value ?? 0)
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")
}

export function ScoreBreakdown({ score, arena }) {
  const [open, setOpen] = useState(false)
  if (!score || !(score.components ?? []).length) return null
  const total = Math.round(Number(score.percentage ?? 0))
  const items = score.items ?? []

  return (
    <section
      aria-labelledby="score-breakdown-title"
      className="mx-auto mt-8 max-w-2xl rounded-[1.25rem] border-2 border-rb-swan bg-rb-snow p-5 text-left shadow-[0_3px_0_var(--color-rb-swan)]"
    >
      <h2 id="score-breakdown-title" className="font-rb-display text-xl font-extrabold text-rb-eel">
        How your score was made
      </h2>
      {score.formula ? <p className="mt-1 text-sm leading-6 text-rb-wolf">{score.formula}</p> : null}

      <ul className="mt-4 divide-y divide-rb-swan">
        {score.components.map((part) => {
          const achieved = part.achievedPercent
          const negative = Number(part.points) < 0
          return (
            <li key={part.key} className="py-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-bold text-rb-eel">
                  {part.label}
                  {part.weightPercent != null ? (
                    <span className="ml-2 rounded-full bg-rb-polar px-2 py-0.5 text-[11px] font-bold text-rb-wolf">
                      {part.weightPercent}% weight
                    </span>
                  ) : null}
                </p>
                <p className={cn("shrink-0 font-rb-display text-lg font-extrabold tabular-nums",
                  negative ? "text-rb-cardinal" : "text-rb-eel")}
                >
                  {points(part.points)}
                </p>
              </div>
              {achieved != null ? (
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-rb-polar" aria-hidden="true">
                    <div className={cn("h-full rounded-full", arena?.line ?? "bg-rb-feather")}
                      style={{ width: `${Math.max(0, Math.min(100, achieved))}%` }} />
                  </div>
                  <span className="w-20 shrink-0 text-right text-xs font-bold tabular-nums text-rb-wolf">
                    {achieved}% achieved
                  </span>
                </div>
              ) : null}
              {part.detail ? <p className="mt-1.5 text-xs leading-5 text-rb-wolf">{part.detail}</p> : null}
            </li>
          )
        })}
        <li className="flex items-baseline justify-between pt-3">
          <p className="font-extrabold text-rb-eel">Your score</p>
          <p className="font-rb-display text-2xl font-extrabold tabular-nums text-rb-eel">{total}%</p>
        </li>
      </ul>

      {items.length ? (
        <div className="mt-4 border-t-2 border-rb-swan pt-3">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            className="flex w-full items-center justify-between text-sm font-bold text-rb-eel"
          >
            {items.length === 1 ? "Marking details" : `Each ${arena?.name === "Champions Cup" ? "question" : "problem"} (${items.length})`}
            <ChevronRight className={cn("size-4 transition-transform", open && "rotate-90")} aria-hidden="true" />
          </button>
          {open ? (
            <ol className="mt-3 space-y-2">
              {items.map((item, index) => (
                <li key={`${item.order ?? index}`} className="rounded-xl border border-rb-swan bg-white/60 p-3 text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 font-semibold text-rb-eel">
                      <span className="mr-1.5 text-rb-wolf">{index + 1}.</span>
                      {item.title}
                    </p>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
                      item.correct ? "bg-rb-leaf-wash text-rb-leaf-lip" : "bg-rb-polar text-rb-wolf")}
                    >
                      {mark(item.earned)} / {mark(item.max)}
                    </span>
                  </div>
                  {item.feedback ? (
                    <p className="mt-1.5 whitespace-pre-wrap text-xs leading-5 text-rb-wolf">{item.feedback}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

export default ScoreBreakdown
