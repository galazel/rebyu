import { useMemo, useState } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import AssessmentsTab from "@/components/assessments/admin/assessments-tab.jsx"
import { getAllCertifications } from "@/services/certificationService.js"

export default function CertificationAssessmentsPage() {
  const { id: certificationId } = useParams()
  const location = useLocation()

  const { data: certifications = [], isLoading } = useQuery({
    queryKey: ["admin-certifications", "certification-page"],
    queryFn: () => getAllCertifications(),
    staleTime: 5 * 60 * 1000,
  })

  const certification = useMemo(
    () =>
      certifications.find(
        (item) => String(item.certificationId ?? item.id) === String(certificationId),
      ),
    [certifications, certificationId],
  )

  const [createRequest, setCreateRequest] = useState(
    () => location.state?.createAssessment ?? null,
  )

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-muted/20">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-2.5">

        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Assessments
          </p>
          {isLoading ? (
            <Skeleton className="mt-0.5 h-4 w-48 rounded-rb-control" />
          ) : (
            <p className="truncate text-sm font-bold text-foreground">
              {certification?.title ?? "This certification"}
            </p>
          )}
        </div>
      </header>


      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-3 sm:px-6">
        <div className="flex min-h-0 w-full flex-1 flex-col">
          {isLoading && !certification ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : certification ? (
            <AssessmentsTab
              certification={certification}
              createRequest={createRequest}
              onCreateRequestHandled={() => setCreateRequest(null)}
            />
          ) : (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <p className="font-medium">Certification not found</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                It may have been deleted, or the link may be out of date.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/admin">Back to certifications</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
