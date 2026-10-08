import { base } from "./base"

export const NOTIFICATION_PREFERENCE_KEY = "notification-preferences"

export function getMyNotificationPreferences() {
  return base("notification-preferences/me")
}

export function updateMyNotificationPreferences(preferences) {
  return base("notification-preferences/me", {
    method: "PUT",
    data: preferences,
  })
}
