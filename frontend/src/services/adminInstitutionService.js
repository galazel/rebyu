import { base } from "./base"

export const getAllInstitutions = () => base("institutions")

export function getAllocationImpact(institutionCertId) {
  return base(`institution-certificates/${institutionCertId}/impact`)
}

export function dropInstitutionCertification(institutionCertId, reason) {
  const query = reason ? `?reason=${encodeURIComponent(reason)}` : ""
  return base(`institution-certificates/${institutionCertId}${query}`, { method: "DELETE" })
}
