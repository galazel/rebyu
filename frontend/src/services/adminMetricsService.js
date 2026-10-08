import { base } from "./base"

export function getPlatformMetrics() {
  return base("admin/metrics")
}

export function getUserPresence(period = "week") {
  return base(`admin/presence?period=${encodeURIComponent(period)}`)
}

export function sendPresenceHeartbeat() {
  return base("presence/heartbeat")
}
