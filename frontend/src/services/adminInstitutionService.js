import { base } from "./base"

/**
 * Admin endpoint: retrieve all institutions and their org profile/billing metadata.
 * Institution managers read their own org via /api/institution/me/overview.
 */
export const getAllInstitutions = () => base("institutions")

/** What dropping this allocation would destroy, and what it would refund. */
export function getAllocationImpact(institutionCertId) {
  return base(`institution-certificates/${institutionCertId}/impact`)
}

/**
 * Drops a certification from an institution: the allocation, its departments,
 * enrolments and invitations, plus a refund of what was paid for it. Not
 * reversible -- call getAllocationImpact first and show what goes.
 */
export function dropInstitutionCertification(institutionCertId, reason) {
  const query = reason ? `?reason=${encodeURIComponent(reason)}` : ""
  return base(`institution-certificates/${institutionCertId}${query}`, { method: "DELETE" })
}
