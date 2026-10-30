import { AlertTriangle, CheckCircle2, ChevronDown } from "@/components/icons"
import { cn } from "@/lib/utils"

// Per-unit rates come from the server (python app/services/generation_rates.py):
// measured from earlier runs where a run has measured the unit, otherwise priced
// from the configured models' current OpenRouter rates. These are only the
// fallback for when that endpoint cannot be reached.
const FALLBACK_RATES = {
  units: {
    run: { tokens: 88_000, cost_usd: 0.32, seconds: 720, source: "priced", time_source: "default" },
    lesson: { tokens: 66_000, cost_usd: 0.15, seconds: 185, source: "priced", time_source: "default" },
    middle: { tokens: 40_000, cost_usd: 0.14, seconds: 40, source: "priced", time_source: "default" },
    major: { tokens: 51_000, cost_usd: 0.2, seconds: 90, source: "priced", time_source: "default" },
    bank_question: { tokens: 2_200, cost_usd: 0.007, seconds: 3, source: "priced", time_source: "default" },
    diagnostic_question: { tokens: 1_450, cost_usd: 0.007, seconds: 9, source: "priced", time_source: "default" },
    mock: { tokens: 72_500, cost_usd: 0.33, seconds: 500, source: "priced", time_source: "default" },
  },
  shape: { lessons_per_middle: 2, middles_per_major: 3 },
  measured_runs: 0,
  parallel: { lessons: 1, questions: 1 },
}

// Lessons written side by side finish when the slowest of each batch does.
const BATCH_SLOWEST_FACTOR = 1.2
const QUESTION_BATCH_SIZE = 20

const ROWS = [
  { key: "run", label: "Documents & curriculum plan", unit: () => "once" },
  { key: "lesson", label: "Lessons, lesson quizzes & audits", unit: (n) => `${n} lessons` },
  { key: "middle", label: "Category quizzes", unit: (n) => `~${n} categories` },
  { key: "major", label: "Domain quizzes", unit: (n) => `~${n} domains` },
  { key: "bank_question", label: "Question bank", unit: (n) => `${n} questions` },
  { key: "diagnostic_question", label: "Diagnostic exam", unit: (n) => `${n} questions` },
  { key: "mock", label: "Mock exam", unit: () => "once" },
]

const HIGH_TOKENS = 1_500_000
const MEDIUM_TOKENS = 500_000

// Unit seconds are serial-equivalent; this is how many run at once. Review
// runs write lessons one at a time so a reviewer can change each.
function parallelWidth(key, count, parallel, reviewMode) {
  const questions = Math.max(1, parallel?.questions ?? 1)
  switch (key) {
    case "lesson": {
      const lessons = Math.max(1, parallel?.lessons ?? 1)
      return reviewMode === "review" || lessons === 1 ? 1 : lessons / BATCH_SLOWEST_FACTOR
    }
    case "bank_question":
    case "diagnostic_question":
      return Math.max(1, Math.min(questions, Math.ceil(count / QUESTION_BATCH_SIZE)))
    case "mock":
      return questions
    default:
      return 1
  }
}

export function estimateGeneration(lessons, bankSize, rates, reviewMode) {
  const { units, shape, parallel } = rates?.units ? rates : FALLBACK_RATES
  const lessonCount = Math.max(0, Math.round(Number(lessons) || 0))
  const bank = Math.max(0, Math.round(Number(bankSize) || 0))
  const middles = lessonCount ? Math.max(1, Math.round(lessonCount / (shape.lessons_per_middle || 3))) : 0
  const majors = middles ? Math.max(1, Math.round(middles / (shape.middles_per_major || 3))) : 0
  const counts = {
    run: 1,
    lesson: lessonCount,
    middle: middles,
    major: majors,
    // Every lesson gets at least one bank question (nodes.question_bank_count).
    bank_question: Math.max(bank, lessonCount),
    diagnostic_question: lessonCount,
    mock: 1,
  }

  const rows = ROWS.map((row) => {
    const rate = units[row.key] ?? FALLBACK_RATES.units[row.key]
    const count = counts[row.key]
    return {
      ...row,
      count,
      tokens: count * rate.tokens,
      cost: count * rate.cost_usd,
      seconds: (count * rate.seconds) / parallelWidth(row.key, count, parallel, reviewMode),
      measured: rate.source === "measured",
      timed: rate.time_source === "measured",
    }
  })

  const sum = (field) => rows.reduce((total, row) => total + row[field], 0)
  return {
    rows,
    tokens: sum("tokens"),
    cost: sum("cost"),
    seconds: sum("seconds"),
    measuredRows: rows.filter((row) => row.measured).length,
    measuredRuns: rates?.measured_runs ?? 0,
  }
}

// null when the balance is unknown -- an unreadable balance never blocks a run.
export function hasEnoughCredit(credits, cost) {
  if (!credits?.available) return null
  return credits.remaining >= cost
}

export function generationEstimateLevel(tokens) {
  if (tokens >= HIGH_TOKENS) return "high"
  if (tokens >= MEDIUM_TOKENS) return "medium"
  return "low"
}

function formatUsd(amount) {
  return `$${amount.toFixed(2)}`
}

function formatTokens(tokens) {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  return `${Math.round(tokens / 1_000)}K`
}

export function formatDuration(seconds) {
  const minutes = Math.max(1, Math.round(seconds / 60))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} h ${rest} min` : `${hours} h`
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-md bg-muted/40 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{value}</p>
      {hint ? <p className="text-[11px] leading-4 text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function basisNote(estimate) {
  const total = estimate.rows.length
  if (estimate.measuredRows === total) {
    return `Measured from your last ${estimate.measuredRuns} run${estimate.measuredRuns === 1 ? "" : "s"}.`
  }
  if (estimate.measuredRows === 0) {
    return "Priced from the configured models' current OpenRouter rates. Each finished run records what it really used, and later estimates use those figures."
  }
  return "Measured where an earlier run has recorded the step; the rest is priced from current model rates."
}

export function GenerationEstimate({ lessons, bankSize, credits, creditsLoading, reviewMode }) {
  const estimate = estimateGeneration(lessons, bankSize, credits?.rates, reviewMode)
  const enough = hasEnoughCredit(credits, estimate.cost)
  const level = enough === false ? "high" : generationEstimateLevel(estimate.tokens)
  const Icon = level === "low" ? CheckCircle2 : AlertTriangle

  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        enough === false ? "border-destructive/40 bg-destructive/5" : "border-border"
      )}
      aria-live="polite"
    >
      <div className="flex items-start gap-2">
        <Icon
          className={cn(
            "mt-0.5 size-4 shrink-0",
            enough === false || level === "high"
              ? "text-destructive"
              : level === "medium"
                ? "text-amber-600"
                : "text-primary"
          )}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            {enough === false ? "Not enough credit for this run" : "Estimated run"}
          </p>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
            {creditsLoading
              ? "Checking your OpenRouter balance…"
              : credits?.available
                ? `OpenRouter balance: ${formatUsd(credits.remaining)}`
                : `OpenRouter balance unknown${credits?.reason ? ` — ${credits.reason}` : ""}`}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="Cost" value={`~${formatUsd(estimate.cost)}`} />
        <Stat
          label="Time"
          value={`~${formatDuration(estimate.seconds)}`}
          hint={reviewMode === "review" ? "plus your review time" : null}
        />
        <Stat label="Tokens" value={`~${formatTokens(estimate.tokens)}`} />
      </div>

      <details className="group mt-3">
        <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-foreground [&::-webkit-details-marker]:hidden">
          <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
          Breakdown
        </summary>
        <table className="mt-2 w-full text-xs">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="py-1 font-normal">Step</th>
              <th className="py-1 text-right font-normal">Cost</th>
              <th className="py-1 text-right font-normal">Time</th>
            </tr>
          </thead>
          <tbody>
            {estimate.rows.map((row) => (
              <tr key={row.key} className="border-t border-border">
                <td className="py-1.5 pr-2">
                  <span className="text-foreground">{row.label}</span>
                  <span className="block text-muted-foreground">
                    {row.unit(row.count)} · cost {row.measured ? "measured" : "from model rates"}
                    {row.timed ? "" : " · time assumed"}
                  </span>
                </td>
                <td className="py-1.5 text-right tabular-nums text-foreground">{formatUsd(row.cost)}</td>
                <td className="py-1.5 text-right tabular-nums text-foreground">
                  {row.seconds ? formatDuration(row.seconds) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        {enough === false
          ? "Top up your OpenRouter credits, or lower the lessons or bank size, before generating. "
          : level === "high"
            ? "If credit runs out part-way, generation stops. Finished steps are kept and you can retry. "
            : ""}
        {basisNote(estimate)} Times come from how long earlier runs took
        {reviewMode === "review" ? "; lessons are written one at a time so you can review each." : ", with lessons written side by side."}
      </p>
    </div>
  )
}
