import { base } from "./base"

/**
 * Every counter on the admin dashboard, in one payload.
 *
 * Replaces the six global list fetches the page used to make (/learners,
 * /institutions, /certifications, /partnership-requests, /learner-certifications,
 * /exam-results) purely to call `.length` on each — which shipped the whole
 * platform to one browser to produce six numbers, and grew without bound.
 *
 * Shape: { people, catalog, assessments, sales } — see AdminMetricsService.
 */
export function getPlatformMetrics() {
  return base("admin/metrics")
}

/**
 * Online now, total users, and active users per day (week, month) or per
 * month (year). Admins are not counted in any of it.
 *
 * @param period "week" | "month" | "year"
 */
export function getUserPresence(period = "week") {
  return base(`admin/presence?period=${encodeURIComponent(period)}`)
}

/** "Still here" -- see usePresenceHeartbeat. */
export function sendPresenceHeartbeat() {
  return base("presence/heartbeat")
}
