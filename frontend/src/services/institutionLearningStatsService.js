import { base } from "./base"

/**
 * Learning statistics for the caller's own institution: a roster-wide
 * rollup plus a row per member.
 */
export function getInstitutionLearningStats() {
  return base("institution/me/learning-stats")
}

/**
 * Completion per learning group / department for group analytics.
 */
export function getDepartmentStats() {
  return base("institution/me/group-stats")
}
