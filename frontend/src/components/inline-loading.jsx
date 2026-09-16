import { Skeleton } from "@/components/ui/skeleton"

/**
 * An in-page wait drawn as the shape of what is coming: a title bar, a row of
 * stat tiles and a few content rows. Used when a tab or section of a page that
 * is already open loads its data -- never the full-screen loading board.
 */
export function InlineLoading({ rows = 4 }) {
  return (
    <div role="status" aria-live="polite" aria-label="Loading" className="space-y-4 py-2">
      <div className="space-y-2">
        <Skeleton className="h-6 w-56 max-w-[70%]" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-24 rounded-rb-card" />
        <Skeleton className="h-24 rounded-rb-card" />
        <Skeleton className="hidden h-24 rounded-rb-card sm:block" />
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: Math.max(1, rows) }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export default InlineLoading
