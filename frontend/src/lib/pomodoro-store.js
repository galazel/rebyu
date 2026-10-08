import { useSyncExternalStore } from "react"


const STORAGE_KEY = "rebyu:pomodoro"

export const POMODORO_DEFAULTS = { focusMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, cycles: 4 }

function buildPhases({ focusMinutes, breakMinutes, longBreakMinutes, cycles }) {
  const phases = []
  for (let cycle = 1; cycle <= cycles; cycle += 1) {
    phases.push({ kind: "focus", cycle, cycles, minutes: focusMinutes })
    if (cycle < cycles) {
      const isLong = cycle % 4 === 0
      phases.push({ kind: "break", long: isLong, cycle, cycles, minutes: isLong ? longBreakMinutes : breakMinutes })
    }
  }
  return phases
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null")
    return saved && Array.isArray(saved.phases) ? saved : null
  } catch {
    return null
  }
}

let state = load()
const listeners = new Set()

function commit(next) {
  state = next
  try {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function usePomodoro() {
  return useSyncExternalStore(subscribe, () => state, () => null)
}

export function startPomodoro(task, settings = {}) {
  const phases = buildPhases({ ...POMODORO_DEFAULTS, ...settings })
  commit({
    task: task ?? {},
    phases,
    index: 0,
    stage: "running",
    deadline: Date.now() + phases[0].minutes * 60_000,
    pausedLeft: null,
  })
}

export function tickPomodoro(now = Date.now()) {
  if (!state || state.stage !== "running") return null

  let next = state
  let changed = null
  while (next.stage === "running" && next.deadline <= now) {
    const phase = next.phases[next.index]
    const isLast = next.index >= next.phases.length - 1

    if (phase.kind === "focus" && isLast) {
      next = { ...next, stage: "done", deadline: null }
      changed = "done"
    } else if (phase.kind === "focus") {
      const breakPhase = next.phases[next.index + 1]
      next = { ...next, index: next.index + 1, deadline: next.deadline + breakPhase.minutes * 60_000 }
      changed = "break"
    } else {
      next = { ...next, index: next.index + 1, stage: "next", deadline: null }
      changed = "next"
    }
  }

  if (next !== state) commit(next)
  return changed
}

export function pausePomodoro() {
  if (!state || state.stage !== "running" || state.phases[state.index].kind !== "focus") return
  commit({ ...state, stage: "paused", pausedLeft: Math.max(0, state.deadline - Date.now()), deadline: null })
}

export function resumePomodoro() {
  if (!state || state.stage !== "paused") return
  commit({ ...state, stage: "running", deadline: Date.now() + state.pausedLeft, pausedLeft: null })
}

export function startNextFocus() {
  if (!state || state.stage !== "next") return
  const phase = state.phases[state.index]
  commit({ ...state, stage: "running", deadline: Date.now() + phase.minutes * 60_000 })
}

export function endPomodoro() {
  commit(null)
}

export function pomodoroSnapshot() {
  return state
}
