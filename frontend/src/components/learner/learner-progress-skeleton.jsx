import { BentoTile } from "@/components/commons/bento.jsx"
import { LearnerDashboardBoard } from "@/components/commons/dashboard-board.jsx"
import { LEARNER_PRESET } from "@/components/commons/dashboard-tile-labels.js"
import { Skeleton } from "@/components/ui/skeleton"
import { useLearnerDashboardLayout } from "@/hooks/use-learner-dashboard-layout.js"

const tiles = LEARNER_PRESET.map(({ id }) => ({
  id,
  element: (
    <BentoTile className="gap-3">
      <Skeleton className="h-4 w-32 max-w-full" />
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="mt-3 min-h-8 w-full flex-1" />
    </BentoTile>
  ),
}))

export function LearnerProgressSkeleton({ layout }) {
  return (
    <div role="status" aria-label="Loading progress dashboard" aria-busy="true">
      <div aria-hidden="true">
        <LearnerDashboardBoard tiles={tiles} layout={layout} preset={LEARNER_PRESET} editing={false} />
      </div>
    </div>
  )
}

export function LearnerProgressRouteSkeleton() {
  const { layout } = useLearnerDashboardLayout()
  return (
    <div className="rb-hub rb-progress-board space-y-6">
      <div className="flex h-11 justify-end gap-3" aria-hidden="true">
        <Skeleton className="w-24" />
        <Skeleton className="w-32 sm:w-52" />
        <Skeleton className="w-28 sm:w-44" />
      </div>
      <LearnerProgressSkeleton layout={layout} />
    </div>
  )
}
