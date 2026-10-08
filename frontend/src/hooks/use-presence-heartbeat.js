import { useEffect } from "react"

import { sendPresenceHeartbeat } from "@/services/adminMetricsService.js"

const HEARTBEAT_MS = 60_000

export function usePresenceHeartbeat(active) {
  useEffect(() => {
    if (!active) return undefined

    const ping = () => {
      if (document.visibilityState === "visible") {
        sendPresenceHeartbeat().catch(() => {})
      }
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
