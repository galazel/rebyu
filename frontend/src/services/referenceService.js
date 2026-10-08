import { useQuery } from "@tanstack/react-query"
import { base } from "./base.js"
import { industries as INDUSTRY_FALLBACK } from "@/constants/industries.js"
import { departments as DEPARTMENT_FALLBACK } from "@/constants/departments.js"


export const REFERENCE_INDUSTRY = "INDUSTRY"
export const REFERENCE_DEPARTMENT = "DEPARTMENT"

const FALLBACK = {
  [REFERENCE_INDUSTRY]: INDUSTRY_FALLBACK,
  [REFERENCE_DEPARTMENT]: DEPARTMENT_FALLBACK,
}

export function getReferenceOptions(kind) {
  return base(`public/reference/${encodeURIComponent(kind)}`)
}

export function getReferenceOptionsAdmin(kind) {
  return base(`admin/reference/${encodeURIComponent(kind)}`)
}

export function addReferenceOption(kind, label) {
  return base(`admin/reference/${encodeURIComponent(kind)}`, { method: "POST", data: { label } })
}

export function retireReferenceOption(kind, id) {
  return base(`admin/reference/${encodeURIComponent(kind)}/${id}`, { method: "DELETE" })
}

export function useReferenceOptions(kind) {
  const query = useQuery({
    queryKey: ["reference-options", kind],
    queryFn: () => getReferenceOptions(kind),
    staleTime: 5 * 60_000,
    retry: 1,
  })
  const baseFallback = FALLBACK[kind] ?? []
  const fetched = Array.isArray(query.data) && query.data.length > 0 ? query.data : []
  const options = Array.from(new Set([...baseFallback, ...fetched]))
  return { options, isLoading: query.isLoading, error: query.error }
}
