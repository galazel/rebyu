import { base } from "./base"

/**
 * Learning statistics for the caller: a roster-wide rollup plus a row per
 * member, scoped on the server to the departments the caller teaches.
 *
 * `from`/`to` are inclusive `YYYY-MM-DD` dates and bound the *activity*
 * figures -- attempts sat, lessons finished, answers marked. They do not
 * bound enrolment or progress, which are current state: reporting "nobody
 * enrolled" for a quiet week would be false rather than filtered.
 */
export function getInstitutionLearningStats({ from, to } = {}) {
  const params = new URLSearchParams()
  if (from) params.set("from", from)
  if (to) params.set("to", to)
  const query = params.toString()
  return base(`institution/me/learning-stats${query ? `?${query}` : ""}`)
}

/**
 * Completion per learning group / department, as of `to`.
 *
 * Only an end date: a section's membership and completion are standing
 * facts, so the question is "how did this section stand on that date", not
 * "what happened to it that week".
 */
export function getDepartmentStats({ to } = {}) {
  return base(`institution/me/group-stats${to ? `?to=${encodeURIComponent(to)}` : ""}`)
}
