import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { listWorkflowRuns } from "@/services/aiWorkflowService"


const POLL_MS = 10_000

const SETTLED_POLL_MS = 60_000

const PENDING_TTL_MS = 3 * 60_000

const pending = new Map()
const pendingListeners = new Set()

let pendingVersion = 0

function notifyPending() {
  pendingVersion += 1
  pendingListeners.forEach((listener) => listener())
}

function prunePending() {
  const now = Date.now()
  let changed = false
  for (const [id, startedAt] of pending) {
    if (now - startedAt > PENDING_TTL_MS) {
      pending.delete(id)
      changed = true
    }
  }
  return changed
}

export function markGenerationQueued(certificationId) {
  if (certificationId == null) return
  pending.set(String(certificationId), Date.now())
  notifyPending()
}

function clearPending(certificationId) {
  if (pending.delete(String(certificationId))) notifyPending()
}

function subscribePending(listener) {
  pendingListeners.add(listener)
  return () => pendingListeners.delete(listener)
}

function pendingSnapshot() {
  return pendingVersion
}

function useRunsWithStatus(status, enabled, pollMs = POLL_MS) {
  return useQuery({
    queryKey: ["workflow-runs", "active", status],
    queryFn: () => listWorkflowRuns({ status, limit: 200 }),
    enabled,
    refetchInterval: enabled ? pollMs : false,
    staleTime: pollMs / 2,
    refetchIntervalInBackground: false,
  })
}

export function useActiveGenerations({ enabled = true } = {}) {
  const queryClient = useQueryClient()
  const pendingTick = useSyncExternalStore(subscribePending, pendingSnapshot, pendingSnapshot)

  const running = useRunsWithStatus("RUNNING", enabled)
  const awaitingReview = useRunsWithStatus("WAITING_FOR_REVIEW", enabled)
  const failed = useRunsWithStatus("FAILED", enabled, SETTLED_POLL_MS)
  const cancelled = useRunsWithStatus("CANCELLED", enabled, SETTLED_POLL_MS)

  const byCertificationId = useMemo(() => {
    const map = new Map()
    const add = (run) => {
      if (run?.certification_id == null || run.kind !== "CERTIFICATION") return
      const key = String(run.certification_id)
      if (!map.has(key)) map.set(key, run)
    }
    ;(running.data?.runs ?? []).forEach(add)
    ;(awaitingReview.data?.runs ?? []).forEach(add)
    ;(failed.data?.runs ?? []).forEach(add)
    ;(cancelled.data?.runs ?? []).forEach(add)

    prunePending()
    pending.forEach((_startedAt, certificationId) => {
      if (map.has(certificationId)) {
        clearPending(certificationId)
        return
      }
      map.set(certificationId, {
        certification_id: Number(certificationId),
        kind: "CERTIFICATION",
        status: "RUNNING",
        current_stage: null,
        run_id: null,
        thread_id: null,
        queued: true,
      })
    })

    return map
  }, [running.data, awaitingReview.data, failed.data, cancelled.data, pendingTick])

  const previousIds = useRef(new Set())
  useEffect(() => {
    const current = new Set(
      [...byCertificationId.entries()]
        .filter(([, run]) => run.status !== "FAILED")
        .map(([id]) => id)
    )
    const finished = [...previousIds.current].some((id) => !current.has(id))
    previousIds.current = current
    if (finished) {
      queryClient.invalidateQueries({ queryKey: ["admin-certifications"] })
    }
  }, [byCertificationId, queryClient])

  return {
    byCertificationId,
    isLoading: running.isPending || awaitingReview.isPending || failed.isPending,
  }
}

export function generationStatusOf(run) {
  if (!run) return null
  if (run.status === "WAITING_FOR_REVIEW") return "AWAITING_REVIEW"
  if (run.status === "FAILED") return "FAILED"
  if (run.status === "CANCELLED") return "STOPPED"
  return "GENERATING"
}

export function generationErrorOf(run) {
  if (!run || run.status !== "FAILED") return null
  return run.error_message || "Generation failed without a reported reason."
}
