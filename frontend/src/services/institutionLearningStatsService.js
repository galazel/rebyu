import { base } from "./base"

export function getInstitutionLearningStats({ from, to, departmentId } = {}) {
  const params = new URLSearchParams()
  if (from) params.set("from", from)
  if (to) params.set("to", to)
  if (departmentId != null) params.set("departmentId", departmentId)
  const query = params.toString()
  return base(`institution/me/learning-stats${query ? `?${query}` : ""}`)
}

export function getDepartmentStats({ to, departmentId } = {}) {
  const params = new URLSearchParams()
  if (to) params.set("to", to)
  if (departmentId != null) params.set("departmentId", departmentId)
  const query = params.toString()
  return base(`institution/me/group-stats${query ? `?${query}` : ""}`)
}
