import { base } from "./base"

/**
 * Every figure on the institution dashboard, counted server-side in one
 * consistent snapshot: summary, certifications, departments, enrollments,
 * progress buckets, the activity trend and recent invitations.
 *
 * Replaces the four reads the dashboard used to stitch together in the browser
 * -- /institution/me/learning-stats, /group-stats, /departments and the portal
 * overview -- and the guesses it needed wherever the joins between them carried
 * nothing: a department with no slots was drawn as ten, seats came from a stored
 * counter that had drifted from the roster, and a learner's practice on a
 * certification the institution never licensed counted towards its pass rate.
 * See InstitutionDashboardService.
 *
 * `from`/`to` are inclusive ISO dates (yyyy-mm-dd) bounding the activity
 * figures -- attempts, lessons, the trend. Progress is current state and does
 * not move with them. Omitting both means the current year.
 *
 * Shape: { range, summary, certifications, departments, enrollments,
 * progressBuckets, trend, invitations }.
 */
export function getInstitutionDashboard({ from, to } = {}) {
  const params = new URLSearchParams()
  if (from) params.set("from", from)
  if (to) params.set("to", to)
  const query = params.toString()
  return base(`institution/me/dashboard${query ? `?${query}` : ""}`)
}
