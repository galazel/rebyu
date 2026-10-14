import { useMemo, useState } from "react"
import { Link, useOutletContext } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { GraduationCapIcon, UsersRound } from "@/components/icons"

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
  AccessWindowBadge,
  accessWindowStatus,
  formatDate,
} from "@/components/institution/institution-ui.jsx"
import { useInstitutionData } from "@/hooks/use-institution-data.js"
import { useUnpaidInvoicePaths } from "@/hooks/use-unpaid-invoice-paths.js"
import { getDepartments, getMyDepartmentHeads } from "@/services/institutionService.js"
import { ManageGroupDialog } from "@/pages/institution/departments/institution-departments-page.jsx"

export default function InstitutionCertificationsPage() {
  const { institution, institutionLoading, institutionError, refetchInstitution } =
    useOutletContext()
  const data = useInstitutionData(institution?.institutionId)
  const invoicePathFor = useUnpaidInvoicePaths(institution?.institutionId != null)
  const institutionId = institution?.institutionId
  const [manageGroup, setManageGroup] = useState(null)

  // Departments and their certifications live here, in one place: each department
  // (one per college) is a heading over the certifications it covers.
  const departmentsQuery = useQuery({
    queryKey: ["departments", institutionId],
    queryFn: () => getDepartments({ institutionId }),
    enabled: institutionId != null,
    retry: 1,
  })
  const membersQuery = useQuery({
    queryKey: ["department-heads", institutionId],
    queryFn: () => getMyDepartmentHeads(),
    enabled: institutionId != null,
    retry: 1,
  })
  const members = Array.isArray(membersQuery.data) ? membersQuery.data : []
  const userById = useMemo(() => new Map(members.map((m) => [m.userId, m])), [members])

  const sections = useMemo(() => {
    const departments = (Array.isArray(departmentsQuery.data) ? departmentsQuery.data : []).filter(
      (department) => department.status === "active"
    )
    const placed = new Set()
    const out = departments.map((department) => {
      const ids = department.institutionCertIds ?? []
      const allocations = data.institutionCerts.filter((cert) => ids.includes(cert.institutionCertId))
      allocations.forEach((cert) => placed.add(cert.institutionCertId))
      return {
        key: `department-${department.departmentId}`,
        title: department.departmentName,
        subtitle: `${department.usedSlots ?? 0} / ${department.totalSlots ?? 0} slots used across ${
          allocations.length
        } certification${allocations.length === 1 ? "" : "s"}`,
        department,
        allocations,
      }
    })
    const rest = data.institutionCerts.filter((cert) => !placed.has(cert.institutionCertId))
    if (rest.length > 0) {
      out.push({
        key: "no-department",
        title: departments.length > 0 ? "Not in a department yet" : "Certifications",
        subtitle: "A department is set up automatically once the certification access is paid and active.",
        department: null,
        allocations: rest,
      })
    }
    return out.filter((section) => section.allocations.length > 0)
  }, [departmentsQuery.data, data.institutionCerts])

  const renderCertification = (institutionCert) => {
            const certification = data.certificationById.get(
              institutionCert.certificationId
            )
            const used = institutionCert.usedSlots ?? 0
            const total = institutionCert.totalSlots ?? 0
            const assignedCount = data.assignments.filter(
              (assignment) =>
                assignment.institutionCertId === institutionCert.institutionCertId &&
                assignment.status !== "revoked"
            ).length
            const schoolYear = schoolYearLabel(institutionCert)
            return (
              <Card key={institutionCert.institutionCertId} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">
                      {certification?.title ??
                        `Certification #${institutionCert.certificationId}`}
                    </CardTitle>
                    <AccessWindowBadge allocation={institutionCert} />
                  </div>
                  {schoolYear ? (
                    <p className="text-sm font-semibold text-primary">{schoolYear}</p>
                  ) : null}
                  <CardDescription>
                    Access {formatDate(institutionCert.accessStartDate)} –{" "}
                    {formatDate(institutionCert.accessExpiryDate)}
                    {accessWindowStatus(institutionCert).detail ? (
                      <span className="text-muted-foreground"> · {accessWindowStatus(institutionCert).detail}</span>
                    ) : null}
                    {institutionCert.status === "pending" ? (
                      <>
                        {" "}
                        <Link to={invoicePathFor(institutionCert.certificationId)} className="font-semibold text-primary underline-offset-2 hover:underline">
                          Open invoice
                        </Link>
                      </>
                    ) : null}
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
                  {institutionCert.status === "pending" ? (
                    <Button asChild size="sm" variant="outline">
                      <Link to={invoicePathFor(institutionCert.certificationId)}>Pay invoice to unlock</Link>
                    </Button>
                  ) : (
                    <Button asChild size="sm">
                      <Link to={`/institution/certifications/${institutionCert.institutionCertId}`}>
                        View certification
                      </Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
  }

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
        subtitle="Your departments and the certifications under each. Manage a department's head, learners and groups from here."
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
        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.key} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-2">
                <div className="min-w-0">
                  <h2 className="font-rb-display text-lg font-bold">{section.title}</h2>
                  <p className="text-xs text-muted-foreground">{section.subtitle}</p>
                </div>
                {section.department ? (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => setManageGroup(section.department)}>
                      <UsersRound className="size-4" aria-hidden="true" />
                      Manage department
                    </Button>
                  </div>
                ) : null}
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {section.allocations.map(renderCertification)}
              </div>
            </section>
          ))}
        </div>
      )}

      <ManageGroupDialog
        group={manageGroup}
        open={manageGroup != null}
        onOpenChange={(open) => !open && setManageGroup(null)}
        members={members}
        userById={userById}
        assignments={data.assignments}
        learnerById={data.learnerById}
        invitations={data.invitations}
        institutionCertById={data.institutionCertById}
      />
    </div>
  )
}

function schoolYearLabel(allocation) {
  const startYear = Number(String(allocation.accessStartDate ?? "").slice(0, 4))
  const endYear = Number(String(allocation.accessExpiryDate ?? "").slice(0, 4))
  if (!startYear) return null
  const lastYear = endYear > startYear ? endYear : startYear + 1
  return `S.Y. ${startYear}–${lastYear}`
}
