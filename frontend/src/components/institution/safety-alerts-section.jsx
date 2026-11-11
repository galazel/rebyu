import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { CheckIcon, LockIcon, ShieldAlert } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { reviewGroupLearnerSafetyAlert } from "@/services/institutionService.js"

export const SAFETY_KIND = {
  SELF_HARM: {
    label: "Wellbeing: self-harm",
    tone: "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-200",
    action: "Check on this learner today. If they may be in immediate danger, follow your school's safeguarding process.",
  },
  ABUSE: {
    label: "Wellbeing: abuse disclosure",
    tone: "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-200",
    action: "Follow your safeguarding process and involve the guidance counselor. Don't ask the learner to repeat details.",
  },
  THREAT: {
    label: "Threat of violence",
    tone: "border-red-300 bg-red-50 text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200",
    action: "Review it now and speak with the learner. Escalate to school security or authorities if it may be real.",
  },
  DATA_PROBE: {
    label: "Data access attempt",
    tone: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200",
    action: "The tutor shared nothing. Remind the learner of the acceptable-use rules.",
  },
}

const SURFACE = { chat: "AI tutor chat", dialogue: "Guided Dialogue", live: "Live Tutor" }

function formatWhen(value) {
  if (!value) return ""
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString()
}

function AlertRow({ alert, departmentId, learnerId }) {
  const queryClient = useQueryClient()
  const [noting, setNoting] = useState(false)
  const [note, setNote] = useState("")
  const kind = SAFETY_KIND[alert.kind] ?? SAFETY_KIND.THREAT
  const open = alert.status === "OPEN"
  const review = useMutation({
    mutationFn: () => reviewGroupLearnerSafetyAlert(departmentId, learnerId, alert.alertId, note),
    onSuccess: () => {
      toast.success("Marked as followed up")
      setNoting(false)
      queryClient.invalidateQueries({ queryKey: ["group-learner-safety-alerts", departmentId, learnerId] })
    },
    onError: () => toast.error("Could not save the review. Try again."),
  })

  return (
    <li className={cn("rounded-lg border p-3", open ? "border-border" : "border-border/60 opacity-75")}>
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
        <span className="ml-auto text-[11px] text-muted-foreground">
          {SURFACE[alert.surface] ?? alert.surface} · {formatWhen(alert.createdAt)}
        </span>
      </div>
      {alert.message ? (
        <blockquote className="mt-2 rounded-md border-l-4 border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
          {alert.message}
        </blockquote>
      ) : null}
      {open ? <p className="mt-2 text-xs text-muted-foreground">{kind.action}</p> : null}
      {alert.reviewNote ? <p className="mt-2 text-xs text-foreground"><span className="font-semibold">Note:</span> {alert.reviewNote}</p> : null}
      {open ? (
        noting ? (
          <div className="mt-2 space-y-2">
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={500}
              placeholder="What did you do? (optional, e.g. spoke with the learner and their adviser)"
              className="min-h-16 text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" disabled={review.isPending} onClick={() => review.mutate()}>
                {review.isPending ? "Saving…" : "Save as followed up"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setNoting(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="outline" className="mt-2" onClick={() => setNoting(true)}>
            Mark as followed up
          </Button>
        )
      ) : null}
    </li>
  )
}

/** The learner's AI tutor safety alerts, for their department head. Anchored as #safety-alerts. */
export function SafetyAlertsSection({ query, departmentId, learnerId }) {
  if (query.isLoading) return null
  const alerts = Array.isArray(query.data) ? query.data : []
  const openCount = alerts.filter((alert) => alert.status === "OPEN").length

  return (
    <section id="safety-alerts" className="scroll-mt-24 space-y-2" aria-labelledby="safety-alerts-heading">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="safety-alerts-heading" className="text-sm font-semibold text-foreground">Safety alerts</h2>
        {openCount > 0 ? (
          <Badge variant="outline" className="gap-1 border-red-300 bg-red-50 text-[11px] text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
            <ShieldAlert className="size-3" aria-hidden="true" />
            {openCount} need{openCount === 1 ? "s" : ""} follow-up
          </Badge>
        ) : null}
      </div>
      <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5">
        {query.isError ? (
          <p className="text-sm text-muted-foreground">Safety alerts could not be loaded.</p>
        ) : alerts.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <LockIcon className="size-3.5" aria-hidden="true" />
            No safety alerts. This learner hasn't written anything to the AI tutor that needed staff attention.
          </p>
        ) : (
          <>
            <p className="mb-3 text-xs text-muted-foreground">
              Raised automatically when a learner writes to the AI tutor about self-harm or abuse, threatens
              violence, or asks for other people's data. Treat each one as a prompt to check in, not a verdict.
            </p>
            <ul className="space-y-2">
              {alerts.map((alert) => (
                <AlertRow key={alert.alertId} alert={alert} departmentId={departmentId} learnerId={learnerId} />
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}

export default SafetyAlertsSection
