import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { DASHBOARD_LAYOUT_KEY, getDashboardLayout } from "@/services/studyDeskService.js"

const MERGED_TILES = [["todays-plan", "study-behavior"]]
const SPLIT_TILES = [["exam-readiness", "exam-countdown"]]

function migrateLearnerLayout(layout) {
  if (!Array.isArray(layout) || layout.length === 0) return layout
  let next = layout.map((item) => ({ ...item }))
  const idOf = (item) => item.id ?? item.i
  for (const [keepId, newId] of SPLIT_TILES) {
    const keep = next.find((item) => idOf(item) === keepId)
    if (!keep || next.some((item) => idOf(item) === newId) || !(keep.w >= 2)) continue
    const leftW = Math.ceil(keep.w / 2)
    const added = { ...keep, id: newId, x: keep.x + leftW, w: keep.w - leftW }
    if (keep.i != null) added.i = newId
    keep.w = leftW
    next.push(added)
  }
  for (const [keepId, goneId] of MERGED_TILES) {
    const keep = next.find((item) => idOf(item) === keepId)
    const gone = next.find((item) => idOf(item) === goneId)
    if (!gone) continue
    if (!keep) {
      // The merged card inherits the old slot when only the absorbed card was saved.
      gone.id = keepId
      if (gone.i != null) gone.i = keepId
      continue
    }
    const sameRow = keep.y === gone.y
    const adjacent = keep.x + keep.w === gone.x || gone.x + gone.w === keep.x
    if (sameRow && adjacent) {
      keep.x = Math.min(keep.x, gone.x)
      keep.w = keep.w + gone.w
      keep.h = Math.max(keep.h, gone.h)
    }
    next = next.filter((item) => idOf(item) !== goneId)
  }
  return next
}

export function useLearnerDashboardLayout() {
  const { data, isPending } = useQuery({
    queryKey: [DASHBOARD_LAYOUT_KEY],
    queryFn: getDashboardLayout,
    staleTime: 5 * 60_000,
    retry: 1,
  })
  const layout = useMemo(() => migrateLearnerLayout(data?.tiles), [data?.tiles])
  return { layout, isPending }
}
