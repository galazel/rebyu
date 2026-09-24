import { useQuery } from "@tanstack/react-query"
import { base } from "./base.js"
import { industries as INDUSTRY_FALLBACK } from "@/constants/industries.js"
import { departments as DEPARTMENT_FALLBACK } from "@/constants/departments.js"

/**
 * The stored pick-lists -- industries, department names -- that used to be
 * constants in this bundle. Read from the server so an admin's additions
 * reach every select without a release; the old constant stays as what the
 * industry select shows for the instant before the list arrives.
 */

export const REFERENCE_INDUSTRY = "INDUSTRY"
export const REFERENCE_DEPARTMENT = "DEPARTMENT"

const FALLBACK = {
  [REFERENCE_INDUSTRY]: INDUSTRY_FALLBACK,
  [REFERENCE_DEPARTMENT]: DEPARTMENT_FALLBACK,
}

/** The active labels of one list, in display order. */
export function getReferenceOptions(kind) {
  return base(`public/reference/${encodeURIComponent(kind)}`)
}

/** Admin: every entry of a list, retired ones included. */
export function getReferenceOptionsAdmin(kind) {
  return base(`admin/reference/${encodeURIComponent(kind)}`)
}

export function addReferenceOption(kind, label) {
  return base(`admin/reference/${encodeURIComponent(kind)}`, { method: "POST", data: { label } })
}

export function retireReferenceOption(kind, id) {
  return base(`admin/reference/${encodeURIComponent(kind)}/${id}`, { method: "DELETE" })
}

/**
 * The labels of one list as a plain array, for a select. Never empty while
 * loading where a fallback exists, so a form does not render with no
 * industries for a frame.
 */
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
