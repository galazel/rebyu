import { fetchEventSource } from "@microsoft/fetch-event-source"

import { API, base, currentAccessToken } from "./base"

export function getMyNotifications() {
  return base("notifications")
}

export function markNotificationRead(notificationId) {
  return base(`notifications/${notificationId}/read`, { method: "PUT" })
}

export function markAllNotificationsRead() {
  return base("notifications/read-all", { method: "PUT" })
}

export function deleteNotification(notificationId) {
  return base(`notifications/${notificationId}`, { method: "DELETE" })
}

export function deleteAllNotifications() {
  return base("notifications", { method: "DELETE" })
}

const STREAM_RETRY_BASE_MS = 1_000
const STREAM_RETRY_MAX_MS = 30_000

/**
 * Keeps one notification stream open. When it drops (a server restart, a network blip,
 * an expired token) it reconnects with a fresh token, waiting longer after each failure
 * so a server that is down is not hit every second.
 */
export function streamNotifications({ onNotification, onOpen } = {}) {
  const controller = new AbortController()
  let failures = 0

  const wait = (ms) =>
    new Promise((resolve) => {
      const timer = setTimeout(resolve, ms)
      controller.signal.addEventListener("abort", () => {
        clearTimeout(timer)
        resolve()
      }, { once: true })
    })

  const run = async () => {
    while (!controller.signal.aborted) {
      const token = await currentAccessToken()
      if (!token || controller.signal.aborted) return

      try {
        await fetchEventSource(`${API}/notifications/stream`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
          openWhenHidden: true,
          async onopen(response) {
            if (response.ok) {
              failures = 0
              onOpen?.()
              return
            }
            throw new Error(`Notification stream failed: ${response.status}`)
          },
          onmessage(event) {
            if (event.event !== "notification" || !event.data) return
            try {
              onNotification?.(JSON.parse(event.data))
            } catch {
            }
          },
          onclose() {
            throw new Error("Notification stream closed")
          },
          onerror(error) {
            throw error
          },
        })
      } catch {
      }
      if (controller.signal.aborted) return

      failures += 1
      const backoff = Math.min(STREAM_RETRY_MAX_MS, STREAM_RETRY_BASE_MS * 2 ** (failures - 1))
      await wait(backoff + Math.random() * 500)
    }
  }

  run()
  return () => controller.abort()
}
