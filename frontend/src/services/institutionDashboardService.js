import { base } from "./base"

export function getInstitutionDashboard({ from, to } = {}) {
  const params = new URLSearchParams()
  if (from) params.set("from", from)
  if (to) params.set("to", to)
  const query = params.toString()
  return base(`institution/me/dashboard${query ? `?${query}` : ""}`)
}
