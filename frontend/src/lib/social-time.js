export function socialTime(value, now = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  const time = date.getTime()
  if (!Number.isFinite(time)) return "Recently"

  const seconds = Math.max(0, (now.getTime() - time) / 1000)
  if (seconds < 60) return "Just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`

  const clock = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday at ${clock}`

  if (date.getFullYear() === now.getFullYear()) {
    return `${date.toLocaleDateString("en-US", { month: "long", day: "numeric" })} at ${clock}`
  }
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}
