import { useMemo } from "react"

export const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]
export const MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

export function startOfISOWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d
}

export function endOfISOWeek(date) {
  const d = startOfISOWeek(date)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

export function useDateRange(mode, cursor) {
  return useMemo(() => {
    const now = new Date()

    let from, to, label

    if (mode === "daily") {
      from  = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), 0, 0, 0, 0)
      to    = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), 23, 59, 59, 999)
      label = cursor.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    } else if (mode === "weekly") {
      from  = startOfISOWeek(cursor)
      to    = endOfISOWeek(cursor)
      const s = MONTHS_SHORT[from.getMonth()]
      const e = MONTHS_SHORT[to.getMonth()]
      if (from.getMonth() === to.getMonth()) {
        label = `${s} ${from.getDate()} \u2013 ${to.getDate()}, ${to.getFullYear()}`
      } else {
        label = `${s} ${from.getDate()} \u2013 ${e} ${to.getDate()}, ${to.getFullYear()}`
      }
    } else if (mode === "monthly") {
      from  = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
      to    = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999)
      label = `${MONTHS_FULL[cursor.getMonth()]} ${cursor.getFullYear()}`
    } else {
      from  = new Date(cursor.getFullYear(), 0, 1)
      to    = new Date(cursor.getFullYear(), 11, 31, 23, 59, 59, 999)
      label = String(cursor.getFullYear())
    }

    let nextStart = new Date(from)
    if (mode === "daily")        nextStart.setDate(nextStart.getDate() + 1)
    else if (mode === "weekly")  nextStart.setDate(nextStart.getDate() + 7)
    else if (mode === "monthly") nextStart.setMonth(nextStart.getMonth() + 1)
    else                         nextStart.setFullYear(nextStart.getFullYear() + 1)

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const canGoForward = nextStart <= todayStart

    return { from, to, label, canGoForward }
  }, [mode, cursor])
}
