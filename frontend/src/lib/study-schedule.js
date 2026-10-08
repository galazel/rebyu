
export function toDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function minutesOfDay(at) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(at ?? "").trim())
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null

  return hours * 60 + minutes
}

export function formatClockTime(at) {
  const total = minutesOfDay(at)
  if (total == null) return null

  const date = new Date()
  date.setHours(Math.floor(total / 60), total % 60, 0, 0)
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
}

export function formatWhen(event, now = new Date()) {
  const clock = formatClockTime(event?.at) ?? event?.time ?? null
  const dateKey = event?.dateKey

  if (!dateKey) return clock

  const todayKey = toDateKey(now)
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)

  const day =
    dateKey === todayKey
      ? "Today"
      : dateKey === toDateKey(tomorrow)
        ? "Tomorrow"
        : new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
            weekday: "short",
            day: "numeric",
            month: "short",
          })

  return clock ? `${day} · ${clock}` : day
}

const TRIGGERABLE_TYPES = new Set(["lesson", "review", "quiz", "catch-up"])

export function isTriggerable(event) {
  return (
    Boolean(event?.technique) &&
    minutesOfDay(event?.at) != null &&
    TRIGGERABLE_TYPES.has(event?.type)
  )
}

export const AUTO_OPEN_WINDOW_MS = 3 * 60 * 60_000

function dueAt(event) {
  const minutes = minutesOfDay(event?.at)
  if (minutes == null || !event?.dateKey) return null
  const due = new Date(`${event.dateKey}T00:00:00`)
  due.setMinutes(minutes)
  return Number.isNaN(due.getTime()) ? null : due
}

export function isStale(event, now = new Date(), generatedAt = null) {
  const due = dueAt(event)
  if (!due) return false
  if (now.getTime() - due.getTime() > AUTO_OPEN_WINDOW_MS) return true

  const made = generatedAt ? new Date(generatedAt) : null
  return Boolean(made && !Number.isNaN(made.getTime()) && due.getTime() < made.getTime())
}

export function isDue(event, now = new Date()) {
  if (!isTriggerable(event)) return false
  if (event.dateKey !== toDateKey(now)) return false

  return now.getHours() * 60 + now.getMinutes() >= minutesOfDay(event.at)
}
