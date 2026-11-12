import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { CheckIcon, ShieldAlert } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SAFETY_KIND } from "@/components/institution/safety-alert-kinds.js"
import { cn } from "@/lib/utils"
import { base } from "@/services/base"

const SURFACE = { chat: "AI tutor chat", dialogue: "Guided Dialogue", live: "Live Tutor" }
const QUERY_KEY = "admin-safety-alerts"

function formatWhen(value) {
  if (!value) return ""
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString()
}

function AdminAlert({ alert, openOnly }) {
  const queryClient = useQueryClient()
  const [noting, setNoting] = useState(false)
  const [note, setNote] = useState("")
  const kind = SAFETY_KIND[alert.kind] ?? SAFETY_KIND.THREAT
  const open = alert.status === "OPEN"
  const review = useMutation({
    mutationFn: () => base(`admin/safety-alerts/${alert.alertId}/review`, { method: "POST", data: { note } }),
    onSuccess: () => {
      toast.success("Marked as followed up")
      setNoting(false)
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, openOnly] })
    },
    onError: () => toast.error("Could not save the review. Try again."),
  })
  return (
    <li className={cn("rounded-xl border bg-card p-4", !open && "opacity-75")}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={cn("text-[11px]", kind.tone)}>{kind.label}</Badge>
        {open ? (
          <Badge variant="outline" className="border-red-300 text-[11px] text-red-700 dark:text-red-300">Needs follow-up</Badge>
        ) : (
          <Badge variant="outline" className="gap-1 text-[11px]">
            <CheckIcon className="size-3" aria-hidden="true" />
            Followed up {formatWhen(alert.reviewedAt)}
          </Badge>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {SURFACE[alert.surface] ?? alert.surface} · {formatWhen(alert.createdAt)}
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold text-foreground">
        {alert.learnerName}
        {alert.learnerUsername ? <span className="font-normal text-muted-foreground"> @{alert.learnerUsername}</span> : null}
      </p>
      {alert.message ? (
        <blockquote className="mt-2 rounded-md border-l-4 border-border bg-muted/40 px-3 py-2 text-sm">{alert.message}</blockquote>
      ) : null}
      {open ? <p className="mt-2 text-xs text-muted-foreground">{kind.action}</p> : null}
      {alert.reviewNote ? <p className="mt-2 text-xs"><span className="font-semibold">Note:</span> {alert.reviewNote}</p> : null}
      {open ? (
        noting ? (
          <div className="mt-2 space-y-2">
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500}
              placeholder="What was done? (optional)" className="min-h-16 text-sm" />
            <div className="flex gap-2">
              <Button size="sm" disabled={review.isPending} onClick={() => review.mutate()}>
                {review.isPending ? "Saving…" : "Save as followed up"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setNoting(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="outline" className="mt-2" onClick={() => setNoting(true)}>Mark as followed up</Button>
        )
      ) : null}
    </li>
  )
}

/** Every AI tutor safety alert on the platform: self-harm, abuse, threats and data probes. */
export default function SafetyAlertsPage() {
  const [openOnly, setOpenOnly] = useState(true)
  const query = useQuery({
    queryKey: [QUERY_KEY, openOnly],
    queryFn: () => base(`admin/safety-alerts?openOnly=${openOnly}`),
    refetchInterval: 60_000,
  })
  const alerts = Array.isArray(query.data) ? query.data : []

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
            <ShieldAlert className="size-5 text-red-600" aria-hidden="true" />
            Safety alerts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Raised when a learner writes to the AI tutor about self-harm or abuse, threatens violence, or asks for
            other people's data. Department heads see their own learners' alerts on the learner's page.
          </p>
        </div>
        <div className="flex gap-1" role="group" aria-label="Filter">
          {[["Needs follow-up", true], ["All", false]].map(([label, value]) => (
            <button key={label} type="button" aria-pressed={openOnly === value} onClick={() => setOpenOnly(value)}
              className={cn("h-8 rounded-lg px-3 text-xs font-semibold",
                openOnly === value ? "bg-foreground text-background" : "border border-border bg-muted/40 text-muted-foreground")}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : query.isError ? (
        <p className="text-sm text-destructive">Safety alerts could not be loaded.</p>
      ) : alerts.length === 0 ? (
        <p className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          {openOnly ? "Nothing needs follow-up right now." : "No safety alerts have been raised."}
        </p>
      ) : (
        <ul className="space-y-3">
          {alerts.map((alert) => <AdminAlert key={alert.alertId} alert={alert} openOnly={openOnly} />)}
        </ul>
      )}
    </div>
  )
}
