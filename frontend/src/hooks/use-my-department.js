import { useCallback, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { getDepartmentOverview, getDepartments } from "@/services/institutionService.js"

const STORAGE_KEY = "rebyu:department-head:selected-department"

function readStored() {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function asList(raw) {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.departments)) return raw.departments
  if (Array.isArray(raw?.content)) return raw.content
  return []
}

/**
 * The departments the signed-in head may see, and the one every department-head
 * page is looking at. The choice is shared across pages for the browser session,
 * so switching department on the dashboard also switches Metrics and Management.
 */
export function useMyDepartments() {
  const departmentsQuery = useQuery({
    queryKey: ["my-institution-groups"],
    queryFn: () => getDepartments(),
    retry: 1,
  })

  const departments = useMemo(
    () =>
      asList(departmentsQuery.data).filter(
        (group) => String(group?.status ?? "active").toLowerCase() === "active"
      ),
    [departmentsQuery.data]
  )

  const [storedId, setStoredId] = useState(readStored)
  const department =
    departments.find((group) => String(group.departmentId) === String(storedId)) ??
    departments[0] ??
    null

  const selectDepartment = useCallback((id) => {
    setStoredId(id == null ? null : String(id))
    try {
      window.sessionStorage.setItem(STORAGE_KEY, String(id))
    } catch {
      // Private windows may refuse storage; the choice then lasts for this page only.
    }
  }, [])

  return {
    departmentsQuery,
    departments,
    department,
    departmentId: department?.departmentId ?? null,
    selectDepartment,
  }
}

/** The backend's one-response dashboard for a department. */
export function useDepartmentOverview(departmentId) {
  return useQuery({
    queryKey: ["department-overview", departmentId],
    queryFn: () => getDepartmentOverview(departmentId),
    enabled: departmentId != null,
    staleTime: 30_000,
    placeholderData: (previous) => previous,
    retry: 1,
  })
}

export const LEARNER_STATUS = {
  at_risk: {
    label: "At risk",
    className: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
  dormant: {
    label: "Gone quiet",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  },
  not_started: {
    label: "Not started",
    className: "border-border bg-muted/60 text-muted-foreground",
  },
  on_track: {
    label: "On track",
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  completed: {
    label: "Badge earned",
    className: "border-primary/40 bg-primary/10 text-primary",
  },
}

export function relativeDays(days) {
  if (days == null) return "Never"
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 30) return `${days} days ago`
  const months = Math.round(days / 30)
  return months <= 1 ? "A month ago" : `${months} months ago`
}
