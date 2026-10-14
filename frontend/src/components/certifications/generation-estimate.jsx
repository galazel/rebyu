import { AlertTriangle, CheckCircle2 } from "@/components/icons"
import { cn } from "@/lib/utils"

// Rough per-unit token costs, input and output together. Nothing records real
// usage yet, so these are typical sizes: a lesson is its content, its quiz and
// a validation pass over each; every diagnostic item is one question per lesson.
const TOKENS_PER_LESSON = 30_000
const TOKENS_PER_BANK_QUESTION = 1_500
const TOKENS_PER_DIAGNOSTIC_QUESTION = 1_500
const MOCK_EXAM_TOKENS = 75_000
const CURRICULUM_TOKENS = 30_000

// Blended OpenRouter price per million tokens across the models a run uses,
// mostly input-heavy calls to gemini-2.5-pro. Only used to compare the
// estimate with the account balance, so it errs high.
const USD_PER_MILLION_TOKENS = 4

const HIGH_TOKENS = 1_500_000
const MEDIUM_TOKENS = 500_000

export function estimateGenerationTokens(lessons, bankSize) {
  const lessonCount = Math.max(0, Number(lessons) || 0)
  const bank = Math.max(0, Number(bankSize) || 0)
  return (
    CURRICULUM_TOKENS +
    lessonCount * (TOKENS_PER_LESSON + TOKENS_PER_DIAGNOSTIC_QUESTION) +
    bank * TOKENS_PER_BANK_QUESTION +
    MOCK_EXAM_TOKENS
  )
}

export function estimateGenerationCost(tokens) {
  return (tokens / 1_000_000) * USD_PER_MILLION_TOKENS
}

// null when the balance is unknown -- an unreadable balance never blocks a run.
export function hasEnoughCredit(credits, tokens) {
  if (!credits?.available) return null
  return credits.remaining >= estimateGenerationCost(tokens)
}

function formatUsd(amount) {
  return `$${amount.toFixed(2)}`
}

export function generationEstimateLevel(tokens) {
  if (tokens >= HIGH_TOKENS) return "high"
  if (tokens >= MEDIUM_TOKENS) return "medium"
  return "low"
}

function formatTokens(tokens) {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  return `${Math.round(tokens / 1_000)}K`
}

const LEVELS = {
  low: {
    label: "Small run",
    note: "Should finish comfortably.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  medium: {
    label: "Medium run",
    note: "Check your AI provider has credit to spare before starting.",
    className: "border-amber-200 bg-amber-50 text-amber-900",
  },
  high: {
    label: "Large run",
    note:
      "If your AI provider runs out of credit part-way, generation stops. Finished steps are kept and you can retry, but consider fewer lessons or a smaller bank.",
    className: "border-destructive/30 bg-destructive/5 text-destructive",
  },
}

export function GenerationEstimate({ lessons, bankSize, credits, creditsLoading }) {
  const tokens = estimateGenerationTokens(lessons, bankSize)
  const cost = estimateGenerationCost(tokens)
  const enough = hasEnoughCredit(credits, tokens)
  const level = enough === false ? "high" : generationEstimateLevel(tokens)
  const { label, note, className } = LEVELS[level]
  const Icon = level === "low" ? CheckCircle2 : AlertTriangle

  return (
    <div className={cn("mt-5 rounded-lg border p-3 text-sm", className)} aria-live="polite">
      <p className="flex items-center gap-2 font-semibold">
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        {enough === false ? "Not enough credit" : label}: about {formatTokens(tokens)} tokens
        (~{formatUsd(cost)})
      </p>
      <p className="mt-1 text-xs font-medium">
        {creditsLoading
            ? "Checking your OpenRouter balance…"
            : credits?.available
                ? `OpenRouter balance: ${formatUsd(credits.remaining)}`
                : `OpenRouter balance unknown${credits?.reason ? ` — ${credits.reason}` : ""}`}
      </p>
      <p className="mt-1 text-xs leading-5 opacity-90">
        {enough === false
            ? "Top up your OpenRouter credits, or lower the lessons or bank size, before generating."
            : note}{" "}
        This is a rough estimate; the real figure depends on your documents.
      </p>
    </div>
  )
}
