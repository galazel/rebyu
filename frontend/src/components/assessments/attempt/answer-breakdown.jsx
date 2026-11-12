import { cn } from "@/lib/utils"
import { DiagramChecks } from "@/components/challenges/score-breakdown.jsx"
import { diagramPartLabel, summarizeDiagramChecks } from "@/lib/diagram-checks.js"

/*
 * How one diagram or code answer was marked, shown on the assessment result page:
 * for a diagram, the points each kind of part earned (in the diagram type's own terms --
 * Actors, «include», Decisions...) and every rule it was held to; for code, whether it ran
 * and whether its output (or, for SQL, its statement) matched.
 */

function amount(value) {
  const n = Number(value ?? 0)
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")
}

function Bar({ share }) {
  return (
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-rb-polar" aria-hidden="true">
      <div
        className={cn("h-full rounded-full", share >= 100 ? "bg-rb-feather" : share > 0 ? "bg-rb-fox" : "bg-rb-polar")}
        style={{ width: `${Math.max(0, Math.min(100, share))}%` }}
      />
    </div>
  )
}

/** [{ label, earned, max, count, matched }] per kind of required part, in first-seen order. */
export function summarizeDiagramCategories(elements = []) {
  const groups = new Map()
  for (const element of elements) {
    const max = Number(element?.maxPoints ?? 0)
    if (!(max > 0)) continue
    const label = diagramPartLabel(element)
    const group = groups.get(label) ?? { label, earned: 0, max: 0, count: 0, matched: 0 }
    group.earned += Number(element.earnedPoints ?? 0)
    group.max += max
    group.count += 1
    if (element.matched) group.matched += 1
    groups.set(label, group)
  }
  return [...groups.values()]
}

export function DiagramAnswerBreakdown({ elements }) {
  const categories = summarizeDiagramCategories(elements)
  const checks = summarizeDiagramChecks(elements)
  if (!categories.length) return null
  const earned = categories.reduce((sum, c) => sum + c.earned, 0)
  const max = categories.reduce((sum, c) => sum + c.max, 0)

  return (
    <div className="rounded-rb-tile border-2 border-[var(--tg-line)] bg-card p-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-extrabold text-foreground">How your diagram was marked</p>
        <p className="text-sm font-extrabold tabular-nums text-foreground">
          {amount(earned)} / {amount(max)}
        </p>
      </div>
      <ul className="mt-2 space-y-1.5">
        {categories.map((category) => {
          const share = category.max > 0 ? Math.round((category.earned / category.max) * 100) : 0
          return (
            <li key={category.label} className="flex items-center gap-3 text-sm">
              <span className="w-56 shrink-0 text-foreground max-sm:w-36">
                {category.label}
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {category.matched}/{category.count} drawn
                </span>
              </span>
              <Bar share={share} />
              <span className="w-20 shrink-0 text-right text-xs font-bold tabular-nums text-muted-foreground">
                {amount(category.earned)} / {amount(category.max)}
              </span>
            </li>
          )
        })}
      </ul>
      {checks.length ? <DiagramChecks checks={checks} className="mt-3 pt-3" /> : null}
    </div>
  )
}

function CheckRow({ label, met, detail }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <span
        className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded-full text-[10px] font-black text-white",
          met ? "bg-rb-feather" : "bg-rb-cardinal")}
        aria-hidden="true"
      >
        {met ? "✓" : "✕"}
      </span>
      <span className="text-foreground">
        {label}
        {detail ? <span className="block text-xs text-muted-foreground">{detail}</span> : null}
      </span>
    </li>
  )
}

/**
 * A code answer is marked by one rule: its output (or, for SQL, its statement) must match.
 * Shown as the checks behind that verdict, using what the result page already received.
 */
export function ProgrammingAnswerBreakdown({ answer }) {
  if (!answer?.submittedCode) return null
  const isSql = String(answer.programmingLanguage ?? "").toUpperCase() === "SQL"
  const correct = answer.isCorrect === true

  if (isSql) {
    return (
      <div className="rounded-rb-tile border-2 border-[var(--tg-line)] bg-card p-3">
        <p className="text-sm font-extrabold text-foreground">How your SQL was marked</p>
        <ul className="mt-2 space-y-1.5">
          <CheckRow label="Statement written" met />
          <CheckRow
            label="Returns the same result as the correct statement"
            met={correct}
            detail="Compared with the correct statement; formatting, letter case and aliases do not matter. Not run."
          />
        </ul>
      </div>
    )
  }

  const ran = answer.programOutput != null || answer.programError != null
  const failed = Boolean(answer.programError)
  const expected = answer.expectedOutput
  const output = answer.programOutput ?? ""
  const expectedLines = expected != null ? String(expected).replace(/\s+$/, "").split("\n") : []
  const outputLines = String(output).replace(/\s+$/, "").split("\n")
  const matchingLines = expectedLines.filter((line, i) => (outputLines[i] ?? "").replace(/\s+$/, "") === line.replace(/\s+$/, "")).length

  return (
    <div className="rounded-rb-tile border-2 border-[var(--tg-line)] bg-card p-3">
      <p className="text-sm font-extrabold text-foreground">How your code was marked</p>
      <ul className="mt-2 space-y-1.5">
        {ran ? (
          <CheckRow
            label={failed ? "Ran into an error" : "Compiled and ran"}
            met={!failed}
            detail={failed ? "See the error under your program's output." : null}
          />
        ) : null}
        <CheckRow
          label="Output matches the expected output exactly"
          met={correct}
          detail={expectedLines.length
            ? `${matchingLines} of ${expectedLines.length} expected line${expectedLines.length === 1 ? "" : "s"} matched (trailing spaces ignored).`
            : "Your program's output is compared with the expected output, trailing spaces ignored."}
        />
      </ul>
    </div>
  )
}
