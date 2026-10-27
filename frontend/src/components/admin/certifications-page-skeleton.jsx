import { Skeleton } from "@/components/ui/skeleton"

export function CertificationsPageSkeleton() {
  return (
    <section className="flex flex-col gap-6" role="status" aria-label="Loading certifications" aria-busy="true">
      <span className="sr-only">Loading certifications…</span>
      <div aria-hidden="true" className="rebyu-page-header">
        <div className="min-w-0 space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Skeleton className="h-9 w-full sm:w-[170px]" />
          <Skeleton className="h-9 w-full sm:w-[190px]" />
        </div>
      </div>
      <div aria-hidden="true" className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex h-[470px] flex-col overflow-hidden rounded-[32px] border bg-card">
            <Skeleton className="h-48 w-full shrink-0 rounded-none" />
            <div className="flex flex-1 flex-col gap-4 p-6">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-7 w-4/5" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <Skeleton className="mt-auto h-9 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
