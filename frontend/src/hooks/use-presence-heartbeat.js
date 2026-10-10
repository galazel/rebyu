import { useEffect } from "react"

import { sendPresenceHeartbeat } from "@/services/adminMetricsService.js"

const HEARTBEAT_MS = 60_000
// Coming back to the tab pings at once, but no more than this often: tab-switching
// (or a browser that flips visibility) otherwise sent a request every second or two.
const MIN_GAP_MS = 30_000

export function usePresenceHeartbeat(active) {
  useEffect(() => {
    if (!active) return undefined

    let lastPing = 0
    const ping = () => {
      if (document.visibilityState !== "visible") return
      const now = Date.now()
      if (now - lastPing < MIN_GAP_MS) return
      lastPing = now
      sendPresenceHeartbeat().catch(() => {})
    }

    ping()
    const timer = window.setInterval(ping, HEARTBEAT_MS)
    document.addEventListener("visibilitychange", ping)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", ping)
    }
  }, [active])
}
