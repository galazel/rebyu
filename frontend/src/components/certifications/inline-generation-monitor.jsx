import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Ban, ChevronDown, FastForward, Loader2 } from "@/components/icons"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useWorkflowStream } from "@/hooks/useWorkflowStream"
import {
  cancelWorkflowRun,
  getPendingReview,
  getWorkflowVersions,
  listWorkflowRuns,
  setCertificationReviewMode,
  submitCertificationReview,
} from "@/services/aiWorkflowService"
import { ActivityPanel } from "@/components/generation/activity-panel"
import {
  GenerationStatusBar,
  GenerationTranscript,
} from "@/components/generation/generation-transcript"
import { ReviewCheckpoint } from "@/components/generation/review-checkpoint"
import { RunRecoveryPanel } from "@/components/generation/run-recovery-panel"
import { TaskStatusIcon, stageLabel } from "@/components/generation/task-status"

export function InlineGenerationMonitor({ certificationId, onClose, onFinished }) {
  const queryClient = useQueryClient()
  const [runId, setRunId] = useState(null)
  const [waitedTooLong, setWaitedTooLong] = useState(false)
  const [isConfirmingStop, setIsConfirmingStop] = useState(false)

  const runs = useQuery({
    queryKey: ["workflow-runs", "for-cert", certificationId],
    queryFn: () => listWorkflowRuns({ certificationId, limit: 20 }),
    enabled: Boolean(certificationId) && !runId,
    refetchInterval: runId ? false : 1_500,
  })

  useEffect(() => {
    if (runId) return
    const match = (runs.data?.runs ?? []).find(
      (r) => String(r.certification_id) === String(certificationId),
    )
    if (match) setRunId(match.run_id)
  }, [runs.data, certificationId, runId])

  useEffect(() => {
    if (runId) return undefined
    const timer = setTimeout(() => setWaitedTooLong(true), 20_000)
    return () => clearTimeout(timer)
  }, [runId])

  const stream = useWorkflowStream(runId)
  const {
    run,
    attemptEvents,
    tasks,
    attempts,
    currentTask,
    progress,
    connected,
    isTerminal,
    isWaitingForReview,
    isStalled,
    silentFor,
  } = stream

  const finishedRef = useRef(false)
  useEffect(() => {
    if (!isTerminal || finishedRef.current || !run?.status) return
    finishedRef.current = true
    onFinished?.(run.status)
  }, [isTerminal, run?.status, onFinished])

  const review = useQuery({
    queryKey: ["workflow-review", runId, isWaitingForReview, run?.last_seq],
    queryFn: () => getPendingReview(runId),
    enabled: Boolean(runId) && isWaitingForReview,
  })

  const versionKey = review.data?.review
    ? `${review.data.review.stage}:${review.data.review.item_index ?? 0}`
    : null

  const versions = useQuery({
    queryKey: ["workflow-versions", runId, versionKey],
    queryFn: () => getWorkflowVersions(runId, versionKey),
    enabled: Boolean(runId && versionKey),
  })

  const submitReview = useMutation({
    mutationFn: (decision) =>
      submitCertificationReview(review.data?.thread_id ?? run?.thread_id, decision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-review", runId] })
      queryClient.invalidateQueries({ queryKey: ["workflow-versions", runId] })
    },
    onError: (error) =>
      toast.error(error?.response?.data?.detail || "Could not submit that decision."),
  })

  const cancel = useMutation({
    mutationFn: () => cancelWorkflowRun(runId),
    onSuccess: () =>
      toast.success("Cancellation requested. The run will stop at the next safe point.", {
        description: "Everything it has generated so far is saved as drafts.",
      }),
    onError: () => toast.error("Could not cancel this run."),
  })

  const [unattended, setUnattended] = useState(false)

  const finishWithoutReview = useMutation({
    mutationFn: () => setCertificationReviewMode(run?.thread_id, "auto"),
    onSuccess: () => {
      setUnattended(true)
      toast.success("It will finish on its own", {
        description:
          "No more review stops. Everything it generates is saved as drafts for you to edit.",
      })
      queryClient.invalidateQueries({ queryKey: ["workflow-review", runId] })
    },
    onError: (error) =>
      toast.error(error?.response?.data?.detail || "Could not switch this run to unattended."),
  })

  if (!runId) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
        {waitedTooLong ? (
          <>
            <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-medium text-foreground">Nothing has picked this up yet</p>
            <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
              The build was queued but no worker has claimed it — usually the Python generation
              service is not running, or cannot reach RabbitMQ or the database. Still watching.
            </p>
          </>
        ) : (
          <>
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Queuing the build…</p>
            <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
              Waiting for a worker to pick this up. The transcript starts as soon as it does.
            </p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex flex-wrap items-center gap-x-2.5 gap-y-2 border-b border-border px-4 py-2.5 sm:px-6">
        <TaskStatusIcon status={run?.status === "RUNNING" ? "RUNNING" : (run?.status ?? "PENDING")} />

        <span className="text-sm font-medium text-foreground">
          {currentTask
            ? stageLabel(currentTask.stage)
            : (run?.status ?? "").replace(/_/g, " ").toLowerCase()}
        </span>

        {isTerminal ? (
          <Badge variant="secondary">Finished</Badge>
        ) : connected ? (
          <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400">
            Live
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Reconnecting
          </Badge>
        )}

        {attempts > 1 ? <Badge variant="outline">Attempt {attempts}</Badge> : null}

        <span className="ml-auto flex items-center gap-2">
          {!isTerminal && !unattended ? (
            <Button
              size="sm"
              variant="secondary"
              disabled={finishWithoutReview.isPending || !run?.thread_id}
              onClick={() => finishWithoutReview.mutate()}
            >
              <FastForward className="mr-2 size-4" />
              Finish without review
            </Button>
          ) : null}

          {!isTerminal ? (
            <Button
              size="sm"
              variant="destructive"
              disabled={cancel.isPending}
              onClick={() => setIsConfirmingStop(true)}
            >
              <Ban className="mr-2 size-4" />
              Stop generating
            </Button>
          ) : (
            <Button size="sm" onClick={onClose}>
              Done
            </Button>
          )}
        </span>
      </header>

      <AlertDialog open={isConfirmingStop} onOpenChange={setIsConfirmingStop}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop this generation?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  {currentTask?.itemNumber && currentTask?.itemTotal
                    ? `This run is on ${currentTask.itemNumber} of ${currentTask.itemTotal} — ${stageLabel(currentTask.stage).toLowerCase()}.`
                    : "This run is still building."}{" "}
                  Stopping it ends the build — it does not pause, and it cannot
                  be resumed from here.
                </p>
                <p>
                  Everything already written is kept as drafts, so nothing
                  finished is lost. Anything still to come is not generated, and
                  starting again re-does the remaining work from scratch.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancel.isPending}>
              Keep generating
            </AlertDialogCancel>
            <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault()
                  cancel.mutate(undefined, {
                    onSettled: () => setIsConfirmingStop(false),
                  })
                }}
                disabled={cancel.isPending}
                className="bg-destructive text-white hover:bg-destructive/90"
            >
              {cancel.isPending ? "Stopping..." : "Stop generating"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isStalled ? (
        <p className="flex items-start gap-2 border-b border-border bg-amber-50 px-4 py-2 text-xs leading-relaxed text-amber-900 sm:px-6 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Nothing has happened for {minutesSince(silentFor)} minutes. The generation service
            most likely restarted while this was building. It is picked back up automatically
            from its last checkpoint — nothing generated so far is lost.
          </span>
        </p>
      ) : !isTerminal ? (
        <p className="border-b border-border bg-muted/30 px-4 py-2 text-xs leading-relaxed text-muted-foreground sm:px-6">
          Generation runs on the server — closing this, signing out, or closing the browser all
          leave it running. The certification stays marked as generating until it finishes.
        </p>
      ) : null}

      <div className="min-h-0 flex-1 px-2 sm:px-4">
        <GenerationTranscript tasks={tasks} currentTaskId={currentTask?.id}>
          {isWaitingForReview ? (
            review.data?.review ? (
              <ReviewCheckpoint
                review={review.data.review}
                versions={versions.data?.versions}
                submitting={submitReview.isPending}
                onSubmit={(decision) => submitReview.mutate(decision)}
                onRestore={(version) =>
                  submitReview.mutate({
                    action: "edit",
                    payload: version.artifact,
                    restoredFrom: version.revision,
                  })
                }
              />
            ) : (
              <p className="flex items-center gap-2 px-2.5 py-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading the item waiting for review…
              </p>
            )
          ) : null}

          {run?.status === "FAILED" ? (
            <RunRecoveryPanel
              runId={runId}
              lastSeq={run?.last_seq}
              errorMessage={run?.error_message}
            />
          ) : null}
        </GenerationTranscript>
      </div>

      <RawEventLog events={attemptEvents} />

      <GenerationStatusBar
        status={run?.status === "RUNNING" ? "RUNNING" : (run?.status ?? "PENDING")}
        stage={
          currentTask
            ? stageLabel(currentTask.stage)
            : (run?.status ?? "").replace(/_/g, " ").toLowerCase()
        }
        startedAt={currentTask?.startedAt}
        live={Boolean(currentTask) && !isTerminal}
        connected={connected}
        terminal={isTerminal}
        progress={progress}
        item={
          currentTask?.itemNumber
            ? { number: currentTask.itemNumber, total: currentTask.itemTotal }
            : null
        }
        className="px-4 sm:px-6"
      />
    </div>
  )
}

function minutesSince(milliseconds) {
  return Math.max(1, Math.round((milliseconds ?? 0) / 60_000))
}

function RawEventLog({ events }) {
  const [open, setOpen] = useState(false)
  const count = events?.length ?? 0

  return (
    <div className="border-t border-border">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-6"
      >
        <ChevronDown
          aria-hidden="true"
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
        />
        Event log
        <span className="font-mono tabular-nums">({count})</span>
      </button>

      {open ? (
        <div className="h-48 border-t border-border px-4 py-2.5 sm:px-6">
          <ActivityPanel events={events} />
        </div>
      ) : null}
    </div>
  )
}
