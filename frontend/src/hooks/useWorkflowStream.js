import { useEffect, useMemo, useReducer, useState } from "react"
import { streamWorkflow } from "@/services/aiWorkflowService"
import {
  TERMINAL_STATUSES,
  applyEventToRun,
  attemptCount,
  buildTasks,
  currentAttemptEvents,
  findCurrentTask,
  maxSeq,
  mergeEvents,
  runProgress,
  terminalStatus,
} from "./workflow-timeline-model"


const initialState = {
  run: null,
  events: [],
  lastSeq: 0,
  connected: false,
  loading: true,
  error: null,
}

function reducer(state, action) {
  switch (action.type) {
    case "snapshot":
      return {
        ...state,
        run: action.run,
        events: mergeEvents(state.events, action.events),
        lastSeq: Math.max(state.lastSeq, maxSeq(action.events)),
        loading: false,
        error: null,
      }
    case "event":
      if (action.event.seq <= state.lastSeq) return state
      return {
        ...state,
        events: mergeEvents(state.events, [action.event]),
        lastSeq: action.event.seq,
        run: applyEventToRun(state.run, action.event),
      }
    case "complete":
      return {
        ...state,
        connected: false,
        run: state.run
          ? { ...state.run, status: terminalStatus(action.status, state.run.status) }
          : state.run,
      }
    case "open":
      return { ...state, connected: true, error: null }
    case "error":
      return { ...state, connected: false, loading: false, error: action.error }
    case "reset":
      return initialState
    default:
      return state
  }
}

const STALLED_AFTER_MS = 15 * 60 * 1000

const STALL_CHECK_MS = 30_000

function lastActivityAt(state) {
  for (let i = state.events.length - 1; i >= 0; i -= 1) {
    const at = state.events[i]?.created_at
    if (at) return Date.parse(at)
  }
  const fallback = state.run?.updated_at
  return fallback ? Date.parse(fallback) : null
}

export function useWorkflowStream(runId) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    if (!runId) return undefined
    dispatch({ type: "reset" })

    const close = streamWorkflow(runId, {
      lastSeq: 0,
      onOpen: () => dispatch({ type: "open" }),
      onError: (error) => dispatch({ type: "error", error }),
      onMessage: (message) => {
        switch (message.type) {
          case "snapshot":
            dispatch({ type: "snapshot", run: message.run, events: message.events ?? [] })
            break
          case "event":
            dispatch({ type: "event", event: message.event })
            break
          case "complete":
            dispatch({ type: "complete", status: message.status })
            break
          case "error":
            dispatch({ type: "error", error: new Error(message.message) })
            break
          default:
            break
        }
      },
    })

    return close
  }, [runId])

  const attempts = useMemo(() => attemptCount(state.events), [state.events])
  const attemptEvents = useMemo(() => currentAttemptEvents(state.events), [state.events])
  const tasks = useMemo(() => buildTasks(attemptEvents), [attemptEvents])
  const currentTask = useMemo(() => findCurrentTask(tasks), [tasks])

  const isTerminal = TERMINAL_STATUSES.has(state.run?.status)

  const progress = useMemo(
    () => runProgress(tasks, attemptEvents, state.run?.status),
    [tasks, attemptEvents, state.run?.status],
  )

  const [, tick] = useState(0)
  useEffect(() => {
    if (!runId || isTerminal) return undefined
    const timer = setInterval(() => tick((n) => n + 1), STALL_CHECK_MS)
    return () => clearInterval(timer)
  }, [runId, isTerminal])

  const silentFor = (() => {
    const at = lastActivityAt(state)
    return at ? Date.now() - at : null
  })()

  return {
    ...state,
    tasks,
    currentTask,
    progress,
    attempts,
    silentFor,
    isStalled:
      state.run?.status === "RUNNING" && silentFor != null && silentFor > STALLED_AFTER_MS,
    attemptEvents,
    isTerminal,
    isWaitingForReview: state.run?.status === "WAITING_FOR_REVIEW",
  }
}
