import { LoadingSignal } from "@/components/loading-overlay.jsx"


const BLOCK = "animate-pulse rounded-rb-tile bg-rb-swan"

export function SectionStackSkeleton({ count = 3 }) {
  return (
    <div className="space-y-10">
      {Array.from({ length: count }, (_, section) => (
        <div key={section} className="space-y-3">
          <div className={`${BLOCK} h-6 w-1/2 max-w-sm`} />
          <div className={`${BLOCK} h-4 w-full`} />
          <div className={`${BLOCK} h-4 w-full`} />
          <div className={`${BLOCK} h-4 w-4/5`} />
        </div>
      ))}
    </div>
  )
}

export function TopicPageSkeleton() {
  return <LoadingSignal />
}

const STOP_OFFSETS = [0.5, 0.68, 0.5, 0.32, 0.5]

export function CurriculumPageSkeleton() {
  return <LoadingSignal />
}
