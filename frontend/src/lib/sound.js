
const PREF_KEY = "rebyu.sound"

export function isSoundEnabled() {
  try {
    return window.localStorage.getItem(PREF_KEY) !== "off"
  } catch {
    return true
  }
}

export function setSoundEnabled(enabled) {
  try {
    window.localStorage.setItem(PREF_KEY, enabled ? "on" : "off")
  } catch {
  }
}

let context = null

function getContext() {
  if (context) return context
  const Ctor = window.AudioContext || window.webkitAudioContext
  if (!Ctor) return null
  try {
    context = new Ctor()
  } catch {
    return null
  }
  return context
}

function playNote(ctx, frequency, startAt, duration, peak) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = "triangle"
  osc.frequency.value = frequency

  gain.gain.setValueAtTime(0.0001, startAt)
  gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(startAt)
  osc.stop(startAt + duration + 0.02)
}

const ACHIEVEMENT_NOTES = [523.25, 659.25, 783.99, 1046.5]

export function playAchievementChime() {
  if (!isSoundEnabled()) return
  if (typeof document !== "undefined" && document.hidden) return

  const ctx = getContext()
  if (!ctx) return

  try {
    const resumed = ctx.state === "suspended" ? ctx.resume() : Promise.resolve()

    resumed
      .then(() => {
        const now = ctx.currentTime
        ACHIEVEMENT_NOTES.forEach((frequency, index) => {
          playNote(ctx, frequency, now + index * 0.07, 0.55, 0.13)
        })
      })
      .catch(() => {})
  } catch {
  }
}

export function playFinalRoundBell() {
  if (!isSoundEnabled()) return
  if (typeof document !== "undefined" && document.hidden) return
  const ctx = getContext()
  if (!ctx) return
  try {
    const resumed = ctx.state === "suspended" ? ctx.resume() : Promise.resolve()
    resumed
      .then(() => {
        const now = ctx.currentTime
        for (let hit = 0; hit < 3; hit += 1) {
          const at = now + hit * 0.45
          playNote(ctx, 880, at, 0.9, 0.16)
          playNote(ctx, 1760, at, 0.6, 0.06)
          playNote(ctx, 2637, at, 0.35, 0.03)
        }
      })
      .catch(() => {})
  } catch {
  }
}

function withContext(play) {
  if (!isSoundEnabled()) return
  if (typeof document !== "undefined" && document.hidden) return
  const ctx = getContext()
  if (!ctx) return
  try {
    const resumed = ctx.state === "suspended" ? ctx.resume() : Promise.resolve()
    resumed.then(() => play(ctx, ctx.currentTime)).catch(() => {})
  } catch {
  }
}

export function playCorrectMark() {
  withContext((ctx, now) => {
    playNote(ctx, 783.99, now, 0.16, 0.08)
    playNote(ctx, 1174.66, now + 0.09, 0.22, 0.09)
  })
}

export function playWrongMark() {
  withContext((ctx, now) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "triangle"
    osc.frequency.setValueAtTime(220, now)
    osc.frequency.exponentialRampToValueAtTime(165, now + 0.22)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.09, now + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.3)
  })
}
