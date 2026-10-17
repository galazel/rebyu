import { useQuery, useQueryClient } from "@tanstack/react-query"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getAiUsage } from "@/services/learnerToolsService.js"

export const AI_USAGE_QUERY_KEY = ["learner-ai-usage"]

/**
 * Daily and weekly usage of each limited AI feature ("tutor" for chat and
 * dialogue, "studyAids" for flashcards and quizzes). Empty for learners whose
 * plan has no AI access.
 */
export function useAiUsage() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: AI_USAGE_QUERY_KEY,
    queryFn: getAiUsage,
    staleTime: 30_000,
    retry: 1,
  })
  const buckets = Array.isArray(query.data) ? query.data : []
  return {
    isLoading: query.isLoading,
    buckets,
    bucket: (key) => buckets.find((bucket) => bucket.key === key) ?? null,
    refresh: () => queryClient.invalidateQueries({ queryKey: AI_USAGE_QUERY_KEY }),
  }
}

function ratio(window) {
  return window && window.limit > 0 ? Math.min(window.used / window.limit, 1) : 0
}

/** The bucket's tightest window: what the ring and "blocked" follow. */
export function bucketRatio(bucket) {
  return bucket ? Math.max(ratio(bucket.daily), ratio(bucket.weekly)) : 0
}

export function isBucketExhausted(bucket) {
  return bucketRatio(bucket) >= 1
}

function resetLabel(resetsAt, weekly) {
  if (!resetsAt) return ""
  const at = new Date(resetsAt)
  const ms = at.getTime() - Date.now()
  if (!weekly && ms > 0) {
    const hours = Math.floor(ms / 3_600_000)
    const minutes = Math.floor((ms % 3_600_000) / 60_000)
    return `Resets in ${hours > 0 ? `${hours} hr ` : ""}${minutes} min`
  }
  return `Resets ${at.toLocaleDateString("en-US", { weekday: "short" })} ${at.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`
}

function toneFor(value) {
  return value >= 1 ? "bg-destructive" : value >= 0.8 ? "bg-amber-500" : "bg-primary"
}

function UsageBar({ title, window, weekly }) {
  const value = ratio(window)
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium text-foreground">{title}</span>
        <span className="tabular-nums text-muted-foreground">{Math.round(value * 100)}% used</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full transition-all ${toneFor(value)}`} style={{ width: `${value * 100}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {window.used} of {window.limit} · {resetLabel(window.resetsAt, weekly)}
      </p>
    </div>
  )
}

/** Daily + weekly bars for one bucket, with its label as a heading. */
export function AiUsageBars({ bucketKey, showLabel = true, className = "" }) {
  const { bucket } = useAiUsage()
  const current = bucket(bucketKey)
  if (!current) return null
  return (
    <div className={`space-y-3 ${className}`}>
      {showLabel ? <p className="text-sm font-semibold text-foreground">{current.label}</p> : null}
      <UsageBar title="Daily limit" window={current.daily} />
      <UsageBar title="Weekly" window={current.weekly} weekly />
    </div>
  )
}

/** The learner's AI usage, everywhere it is shown (account, subscription,
 *  tutor menu): one meter, because every AI task -- tutor chat, guided
 *  dialogue, and the quizzes, flashcards and mind maps the tutor makes -- is a
 *  tutor message. */
export function AiUsageSummary({ className = "" }) {
  const { bucket } = useAiUsage()
  if (!bucket("tutor")) return null
  return (
    <div className={`rounded-md border bg-muted/20 p-4 ${className}`}>
      <p className="text-sm font-semibold text-foreground">AI usage</p>
      <p className="mb-3 text-xs text-muted-foreground">
        Tutor chat, guided dialogue, and the quizzes, flashcards and mind maps the tutor makes.
      </p>
      <AiUsageBars bucketKey="tutor" showLabel={false} />
    </div>
  )
}

/**
 * A small progress ring for one bucket; click it for the daily and weekly
 * breakdown with reset times.
 */
export function AiUsageRing({ bucketKey, size = 22, className = "" }) {
  const { bucket } = useAiUsage()
  const current = bucket(bucketKey)
  if (!current) return null

  const value = bucketRatio(current)
  const stroke = 3
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const color = value >= 1 ? "text-destructive" : value >= 0.8 ? "text-amber-500" : "text-primary"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`inline-grid shrink-0 place-items-center rounded-full transition hover:bg-muted ${className}`}
          aria-label={`AI usage: ${Math.round(value * 100)}% of limit used`}
          title={`AI usage: ${Math.round(value * 100)}% used`}
        >
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={stroke}
              className="stroke-muted"
              stroke="currentColor"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
              stroke="currentColor"
              className={`${color} transition-all`}
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - value)}
            />
          </svg>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-72 p-4">
        <p className="mb-3 text-sm font-semibold">AI usage</p>
        <AiUsageBars bucketKey={bucketKey} showLabel={false} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** The window that blocks or warns first: the one that is fullest, daily before weekly on a tie. */
function tightestWindow(bucket) {
  if (!bucket) return null
  const daily = { ...bucket.daily, weekly: false, period: "today" }
  const weekly = { ...bucket.weekly, weekly: true, period: "this week" }
  return ratio(weekly) > ratio(daily) ? weekly : daily
}

/**
 * Says so in the conversation when the learner's AI limit is reached (and warns
 * when it is nearly reached), with when it resets -- instead of a send button
 * that just stops working. Used by the tutor chat, the guided dialogue and any
 * other AI surface; renders nothing below 80% use.
 */
export function AiLimitNotice({ bucketKey = "tutor", className = "" }) {
  const { bucket } = useAiUsage()
  const window = tightestWindow(bucket(bucketKey))
  if (!window || !window.limit) return null
  const value = ratio(window)
  if (value < 0.8) return null
  const left = Math.max(0, window.limit - window.used)
  const reset = resetLabel(window.resetsAt, window.weekly).replace(/^Resets/, "It resets")
  const reached = value >= 1
  return (
    <div
      role={reached ? "alert" : "status"}
      className={`rounded-xl border-2 px-3 py-2 text-sm leading-snug ${
        reached ? "border-rb-cardinal/40 bg-rb-cardinal-wash text-rb-cardinal-lip" : "border-amber-300 bg-amber-50 text-amber-900"
      } ${className}`}
    >
      <p className="font-extrabold">
        {reached
          ? `You've reached your AI limit for ${window.period}.`
          : `${left} AI ${left === 1 ? "message" : "messages"} left ${window.period}.`}
      </p>
      <p className="mt-0.5 text-xs font-semibold opacity-90">
        {reached
          ? `${reset}. The tutor chat, guided dialogue and the quizzes, flashcards and mind maps it makes all count toward it.`
          : `${reset}.`}{" "}
        <a href="/learner/account" className="underline underline-offset-2">See usage</a>
      </p>
    </div>
  )
}
