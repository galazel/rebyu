import { fetchEventSource } from "@microsoft/fetch-event-source"
import { API, base, currentAccessToken } from "./base"


export const listWorkflowRuns = ({ status, certificationId, limit = 50, offset = 0 } = {}) => {
  const params = new URLSearchParams({ limit, offset })
  if (status) params.set("status", status)
  if (certificationId != null) params.set("certificationId", certificationId)
  return base(`ai/workflows?${params}`)
}

export const listAwaitingReview = (limit = 50) =>
  base(`ai/workflows/awaiting-review?limit=${limit}`)

export const getWorkflowRun = (runId, afterSeq = 0) =>
  base(`ai/workflows/${runId}?afterSeq=${afterSeq}`)

export const getWorkflowVersions = (runId, key) =>
  base(`ai/workflows/${runId}/versions${key ? `?key=${encodeURIComponent(key)}` : ""}`)

export const getPendingReview = (runId) => base(`ai/workflows/${runId}/review`)

export const cancelWorkflowRun = (runId) =>
  base(`ai/workflows/${runId}/cancel`, { method: "POST" })

export const retryWorkflowRun = (runId) =>
  base(`ai/workflows/${runId}/retry`, { method: "POST" })

export const restartWorkflowRun = (runId) =>
  base(`ai/workflows/${runId}/restart`, { method: "POST" })

export const submitCertificationReview = (threadId, { action, instructions, payload, restoredFrom } = {}) =>
  base(`ai/workflows/certification/${threadId}/review`, {
    method: "POST",
    data: { action, instructions, payload, restored_from: restoredFrom },
  })

export const setCertificationReviewMode = (threadId, mode) =>
  base(`ai/workflows/certification/${threadId}/review-mode`, {
    method: "POST",
    data: { mode },
  })

export const submitQuestionBatchReview = (threadId, { action, instructions, questions, restoredFrom } = {}) =>
  base(`ai/workflows/question-bank/${threadId}/review`, {
    method: "POST",
    data: { action, instructions, questions, restored_from: restoredFrom },
  })

export function streamWorkflow(runId, { onMessage, onOpen, onError, lastSeq = 0 } = {}) {
  const controller = new AbortController()

  const run = async () => {
    const token = await currentAccessToken()
    if (!token || controller.signal.aborted) return

    try {
      await fetchEventSource(`${API}/ai/workflows/${runId}/stream?lastSeq=${lastSeq}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
        openWhenHidden: true,
        async onopen(response) {
          if (response.ok) {
            onOpen?.()
            return
          }
          throw new Error(`Workflow stream failed: ${response.status}`)
        },
        onmessage(event) {
          if (!event.data) return
          try {
            onMessage?.(JSON.parse(event.data))
          } catch {
          }
        },
        onerror(error) {
          if (controller.signal.aborted) throw error
          onError?.(error)
        },
      })
    } catch {
    }
  }

  run()
  return () => controller.abort()
}
