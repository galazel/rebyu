import { useQuery } from "@tanstack/react-query"
import { base } from "./base.js"

export const REFERENCE_PROGRAM = "PROGRAM"
export const REFERENCE_INSTITUTION = "INSTITUTION"
export const REFERENCE_DEGREE_PROGRAM = "DEGREE_PROGRAM"

export function getReferenceOptions(kind) {
  return base(`public/reference/${encodeURIComponent(kind)}`)
}

export function getReferenceOptionsAdmin(kind) {
  return base(`admin/reference/${encodeURIComponent(kind)}`)
}

export function addReferenceOption(kind, label, details = {}) {
  return base(`admin/reference/${encodeURIComponent(kind)}`, { method: "POST", data: { label, ...details } })
}

export function updateReferenceOption(kind, id, label, details = {}) {
  return base(`admin/reference/${encodeURIComponent(kind)}/${id}`, {
    method: "PUT",
    data: { label, ...details },
  })
}

export function getReferenceDetails(kind) {
  return base(`public/reference/${encodeURIComponent(kind)}/details`)
}

/** Active entries of a detailed list (programs, institutions) with code, description, category and certifications. */
export function useReferenceDetails(kind) {
  const query = useQuery({
    queryKey: ["reference-details", kind],
    queryFn: () => getReferenceDetails(kind),
    staleTime: 5 * 60_000,
    retry: 1,
  })
  return {
    options: Array.isArray(query.data) ? query.data : [],
    isLoading: query.isLoading,
    error: query.error,
  }
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
  const options = Array.isArray(query.data) ? query.data : []
  return { options, isLoading: query.isLoading, error: query.error }
}
