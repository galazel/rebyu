import { HistoryIcon, Loader2Icon } from "@/components/icons"

import { Badge } from "@/components/ui/badge"

const STATUS_LABEL = {
  UNAVAILABLE: "Unavailable",
  QUEUED: "Queued",
  RUNNING: "Running",
  COMPLETED: "Ran",
  ERROR: "Error",
}

const STATUS_VARIANT = {
  UNAVAILABLE: "outline",
  QUEUED: "secondary",
  RUNNING: "secondary",
  COMPLETED: "secondary",
  ERROR: "destructive",
}

function formatWhen(value) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

// Recent runs for this item: when, in which language, and whether it ran.
// No test counts -- runs are not checked against the test cases mid-attempt.
export default function ExecutionHistoryPanel({ executions, loading }) {
  const list = Array.isArray(executions) ? executions : []

  if (loading) {
    return (
      <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
        Loading runs…
      </p>
    )
  }

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
        <HistoryIcon className="size-5" aria-hidden="true" />
        <p>No runs yet. Press Run to see your output.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {list.map((execution) => (
        <li
          key={execution.executionId}
          className="flex items-center justify-between gap-2 rounded-[var(--radius-rb-control)] border px-3 py-2 text-sm"
        >
          <div className="min-w-0">
            <p className="font-medium">{execution.language ?? "Run"}</p>
            <p className="text-xs text-muted-foreground">{formatWhen(execution.createdAt)}</p>
          </div>
          <Badge variant={STATUS_VARIANT[execution.status] ?? "secondary"}>
            {STATUS_LABEL[execution.status] ?? execution.status}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
