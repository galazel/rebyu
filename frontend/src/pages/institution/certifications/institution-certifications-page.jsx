import { Link, useOutletContext } from "react-router-dom"
import { GraduationCapIcon } from "@/components/icons"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  InstitutionEmptyState,
  InstitutionErrorState,
  InstitutionLoadingSkeleton,
  InstitutionPageHeader,
  InstitutionStatusBadge,
  formatDate,
} from "@/components/institution/institution-ui.jsx"
import { useInstitutionData } from "@/hooks/use-institution-data.js"

export default function InstitutionCertificationsPage() {
  const { institution, institutionLoading, institutionError, refetchInstitution } =
    useOutletContext()
  const data = useInstitutionData(institution?.institutionId)

  if (institutionLoading || (institution && data.isLoading)) {
    return <InstitutionLoadingSkeleton />
  }
  if (institutionError) {
    return <InstitutionErrorState onRetry={refetchInstitution} />
  }
  if (!institution) {
    return (
      <InstitutionEmptyState
        title="No institution found"
        description="Certification allocations appear here once your institution is registered."
      />
    )
  }

  return (
    <div className="space-y-6">
      <InstitutionPageHeader
        title="Certifications"
        subtitle="Certification programs allocated to your institution."
      />

      {data.isError ? (
        <InstitutionErrorState onRetry={data.refetchAll} />
      ) : data.institutionCerts.length === 0 ? (
        <InstitutionEmptyState
          icon={GraduationCapIcon}
          title="No certification allocations yet"
          description="Submit a partnership request to allocate certifications and learner slots for your institution."
          action={
            <Button asChild size="sm">
              <Link to="/institution/partnership">Go to Partnership</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.institutionCerts.map((institutionCert) => {
            const certification = data.certificationById.get(
              institutionCert.certificationId
            )
            const used = institutionCert.usedSlots ?? 0
            const total = institutionCert.totalSlots ?? 0
            const assignedCount = data.assignments.filter(
              (assignment) => assignment.institutionCertId === institutionCert.institutionCertId
            ).length
            return (
              <Card key={institutionCert.institutionCertId} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">
                      {certification?.title ??
                        `Certification #${institutionCert.certificationId}`}
                    </CardTitle>
                    <InstitutionStatusBadge status={institutionCert.status} />
                  </div>
                  <CardDescription>
                    Access {formatDate(institutionCert.accessStartDate)} –{" "}
                    {formatDate(institutionCert.accessExpiryDate)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Slot usage</span>
                      <span className="tabular-nums">
                        {used} / {total}
                      </span>
                    </div>
                    <Progress
                      value={total > 0 ? (used / total) * 100 : 0}
                      aria-label="Slot usage"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {assignedCount} learner(s) assigned
                  </p>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button asChild size="sm">
                    <Link to={`/institution/certifications/${institutionCert.institutionCertId}`}>
                      View certification
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link
                      to={`/institution/learners?certification=${institutionCert.certificationId}`}
                    >
                      View learners
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
