import { fetchEventSource } from "@microsoft/fetch-event-source"
import { API, base, currentAccessToken } from "./base"


export const listWorkflowRuns = ({ status, certificationId, limit = 50, offset = 0 } = {}) => {
  const params = new URLSearchParams({ limit, offset })
  if (status) params.set("status", status)
  if (certificationId != null) params.set("certificationId", certificationId)
  return base(`ai/workflows?${params}`)
}

export const getAiCredits = () => base("ai/workflows/ai-credits")

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

class StreamRetry extends Error {}

const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 15000]

/**
 * Follows a run's timeline. Each (re)connect fetches a fresh sign-in token and resumes after
 * the last event seen, so a long run outlives token expiry, proxy drops and laptop sleep
 * instead of getting stuck retrying with a dead token.
 */
export function streamWorkflow(runId, { onMessage, onOpen, onError, lastSeq = 0 } = {}) {
  const controller = new AbortController()
  let cursor = lastSeq
  let finished = false

  const wait = (ms) =>
    new Promise((resolve) => {
      const timer = setTimeout(resolve, ms)
      controller.signal.addEventListener("abort", () => { clearTimeout(timer); resolve() }, { once: true })
    })

  const run = async () => {
    let failures = 0
    while (!controller.signal.aborted && !finished) {
      const token = await currentAccessToken().catch(() => null)
      if (controller.signal.aborted) return
      try {
        await fetchEventSource(`${API}/ai/workflows/${runId}/stream?lastSeq=${cursor}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
          openWhenHidden: true,
          async onopen(response) {
            if (!response.ok) throw new StreamRetry(`Workflow stream failed: ${response.status}`)
            failures = 0
            onOpen?.()
          },
          onmessage(event) {
            if (!event.data) return
            let message
            try {
              message = JSON.parse(event.data)
            } catch {
              return
            }
            const seq = message?.event?.seq
            if (typeof seq === "number" && seq > cursor) cursor = seq
            if (message?.type === "complete") finished = true
            onMessage?.(message)
          },
          onclose() {
            // The server or a proxy ended the stream; reconnect unless the run is over.
            if (!finished) throw new StreamRetry("stream closed")
          },
          onerror(error) {
            // Stop fetchEventSource's own retry (it would reuse the old token); the loop retries.
            throw error
          },
        })
      } catch (error) {
        if (controller.signal.aborted || finished) return
        onError?.(error)
      }
      if (finished) return
      await wait(RETRY_DELAYS_MS[Math.min(failures, RETRY_DELAYS_MS.length - 1)])
      failures += 1
    }
  }

  run()
  return () => controller.abort()
}
