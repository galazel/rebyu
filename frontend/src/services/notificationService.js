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

export function streamNotifications({ onNotification, onOpen } = {}) {
  const controller = new AbortController()

  const run = async () => {
    const token = await currentAccessToken()
    if (!token || controller.signal.aborted) return

    try {
      await fetchEventSource(`${API}/notifications/stream`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
        openWhenHidden: true,
        async onopen(response) {
          if (response.ok) {
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
        onerror(error) {
          if (controller.signal.aborted) throw error
        },
      })
    } catch {
    }
  }

  run()
  return () => controller.abort()
}
