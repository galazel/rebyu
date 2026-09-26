import { useEffect } from "react"

import { sendPresenceHeartbeat } from "@/services/adminMetricsService.js"

const HEARTBEAT_MS = 60_000

/**
 * Tells the backend "still here" once a minute while a tab is visible.
 *
 * Any signed-in request marks the user as seen; this only covers the reader
 * sitting on one page making none. A hidden tab stops pinging, so a user who
 * walks away drops off the admin "online now" count a few minutes later, and
 * one who comes back is counted again the moment the tab is shown.
 */
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
