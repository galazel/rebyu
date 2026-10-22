import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getAiUsage, getAiUsageBreakdown } from "@/services/learnerToolsService.js"

export const AI_USAGE_QUERY_KEY = ["learner-ai-usage"]

/**
 * Daily and weekly usage of the learner's AI ("tutor": chat, guided dialogue
 * and the tools the tutor uses). Empty for learners whose
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
    isError: query.isError,
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
      {current.weekly ? <UsageBar title="Weekly" window={current.weekly} weekly /> : null}
    </div>
  )
}

/** The learner's AI usage, everywhere it is shown (account, subscription,
 *  tutor menu): one meter, because every AI task -- tutor chat, guided
 *  dialogue, and the quizzes, flashcards and mind maps the tutor makes -- is a
 *  tutor message. */
export function AiUsageSummary({ className = "", showHeading = true }) {
  const { bucket, isLoading } = useAiUsage()
  if (isLoading) {
    // Same footprint as the loaded card, so the page does not jump when it arrives.
    return (
      <div className={`rounded-md border bg-muted/20 p-4 ${className}`} aria-busy="true">
        {showHeading ? <p className="text-sm font-semibold text-foreground">AI usage</p> : null}
        <div className="mt-3 space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3.5 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-2 animate-pulse rounded-full bg-muted" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (!bucket("tutor")) return null
  return (
    <div className={`rounded-md border bg-muted/20 p-4 ${className}`}>
      {showHeading ? <><p className="text-sm font-semibold text-foreground">AI usage</p>
      <p className="mb-3 text-xs text-muted-foreground">
        Tutor chat, guided dialogue, and the quizzes, flashcards and mind maps the tutor makes.
      </p></> : null}
      <AiUsageBars bucketKey="tutor" showLabel={false} />
      <AiUsageBars bucketKey="liveTutor" className="mt-4 border-t pt-4" />
    </div>
  )
}

/**
 * A small progress ring for one bucket; click it for the daily and weekly
 * breakdown with reset times.
 */
export function AiUsageRing({ bucketKey, size = 22, className = "" }) {
  const { bucket } = useAiUsage()
  const [details, setDetails] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const current = bucket(bucketKey)
  if (!current) return null

  const value = bucketRatio(current)
  const stroke = 3
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const color = value >= 1 ? "text-destructive" : value >= 0.8 ? "text-amber-500" : "text-primary"

  return (
    <>
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
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
        <button type="button" onClick={() => { setMenuOpen(false); setDetails(true) }}
                className="mt-3 w-full rounded-md border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">
          See usage breakdown
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
    <UsageDialog open={details} onOpenChange={setDetails} />
    </>
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
        <UsageDialogLink />
      </p>
    </div>
  )
}

const MESSAGE_KINDS = { "tutor-chat": "Tutor chat", "tutor-dialogue": "Guided dialogue" }
const TOOL_LABELS = {
  quiz: "Practice quiz", flashcards: "Flashcards", mindmap: "Mind map", table: "Comparison table",
  cards: "Example cards", steps: "Worked example", matching: "Matching", ordering: "Put in order",
  fill_blank: "Fill in the blank", true_false: "Myth or fact", code: "Code", math: "Math",
  diagram: "Diagram", explorer: "Explorer",
}

function Rows({ title, rows, total, empty }) {
  return (
    <div>
      <p className="mb-1.5 flex items-baseline justify-between text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
        {title} {total != null ? <span className="tabular-nums">{total}</span> : null}
      </p>
      {rows.length ? (
        <ul className="space-y-1.5">
          {rows.map(([label, count, max]) => (
            <li key={label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 text-sm">
              <span className="truncate text-foreground">{label}</span>
              <span className="tabular-nums text-muted-foreground">{count}</span>
              <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full bg-primary" style={{ width: `${max ? (count / max) * 100 : 0}%` }} />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  )
}

/**
 * What the learner's AI use went on, like a usage breakdown: messages by type,
 * the tutor tools those messages produced, and messages per day for a week.
 * Tools are noted for information only -- only messages count toward the limit.
 */
export function AiUsageBreakdown({ className = "" }) {
  const [range, setRange] = useState("today")
  const query = useQuery({ queryKey: [...AI_USAGE_QUERY_KEY, "breakdown"], queryFn: getAiUsageBreakdown, staleTime: 15_000 })
  const data = query.data?.data ?? query.data
  if (query.isLoading) return <div className={`h-40 animate-pulse rounded-md bg-muted ${className}`} />
  if (!data) return null

  const counts = data[range] ?? {}
  const messages = Object.entries(MESSAGE_KINDS).map(([kind, label]) => [label, counts[kind] ?? 0])
  const messageTotal = messages.reduce((sum, [, count]) => sum + count, 0)
  const tools = Object.entries(counts)
    .filter(([kind]) => kind.startsWith("tool:"))
    .map(([kind, count]) => [TOOL_LABELS[kind.slice(5)] ?? kind.slice(5), count])
    .sort((a, b) => b[1] - a[1])
  const toolMax = Math.max(0, ...tools.map(([, c]) => c))
  const days = data.days ?? []
  const dayMax = Math.max(1, ...days.map((d) => d.messages))

  return (
    <div className={`space-y-5 ${className}`}>
      <div className="inline-flex rounded-lg bg-muted p-0.5 text-xs font-semibold">
        {[["today", "Today"], ["week", "This week"]].map(([value, label]) => (
          <button key={value} type="button" onClick={() => setRange(value)}
                  className={`rounded-md px-3 py-1 ${range === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      <Rows title="Messages" total={messageTotal}
            rows={messages.map(([label, count]) => [label, count, Math.max(1, messageTotal)])}
            empty="No AI messages yet." />

      <Rows title="Tools the tutor used" rows={tools.map(([label, count]) => [label, count, toolMax])}
            empty="The tutor has not drawn any quizzes, mind maps or other tools yet." />

      {days.length ? (
        <div>
          <p className="mb-1.5 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Last 7 days</p>
          <div className="flex h-24 items-end gap-1.5" role="img"
               aria-label={days.map((d) => `${d.date}: ${d.messages} messages`).join(", ")}>
            {days.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] tabular-nums text-muted-foreground">{d.messages || ""}</span>
                <span className="w-full rounded-t bg-primary/80" style={{ height: `${(d.messages / dayMax) * 64}px`, minHeight: d.messages ? 3 : 1 }} />
                <span className="text-[10px] text-muted-foreground">
                  {new Date(`${d.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "narrow" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">Chat messages and Live Tutor sessions have separate limits; tools are shown for reference.</p>
    </div>
  )
}

function UsageDialogLink() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="underline underline-offset-2">See usage</button>
      <UsageDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

function UsageDialog({ open, onOpenChange }) {
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>AI usage</DialogTitle>
            <DialogDescription>Your limits and what your AI use went on.</DialogDescription>
          </DialogHeader>
          <AiUsageBars bucketKey="tutor" showLabel={false} />
          <AiUsageBars bucketKey="liveTutor" />
          <AiUsageBreakdown className="mt-2 border-t pt-4" />
        </DialogContent>
      </Dialog>
    </>
  )
}
