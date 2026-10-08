import { base } from "./base"

export function getInstitutionLearningStats({ from, to } = {}) {
  const params = new URLSearchParams()
  if (from) params.set("from", from)
  if (to) params.set("to", to)
  const query = params.toString()
  return base(`institution/me/learning-stats${query ? `?${query}` : ""}`)
}

export function getDepartmentStats({ to } = {}) {
  return base(`institution/me/group-stats${to ? `?to=${encodeURIComponent(to)}` : ""}`)
}
