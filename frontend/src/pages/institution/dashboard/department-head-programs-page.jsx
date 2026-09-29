import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { BookOpenIcon, UsersRoundIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import {
  InstitutionEmptyState,
  InstitutionErrorState,
  InstitutionLoadingSkeleton,
  InstitutionPageHeader,
} from "@/components/institution/institution-ui.jsx"
import { BubbleCard, toneForIndex } from "@/components/commons/bubble-card.jsx"
import { getDepartments } from "@/services/institutionService.js"

export default function DepartmentHeadProgramsPage() {
  const departmentsQuery = useQuery({
    queryKey: ["my-institution-groups"],
    queryFn: () => getDepartments(),
    retry: 1,
  })

  if (departmentsQuery.isLoading) return <InstitutionLoadingSkeleton />
  if (departmentsQuery.isError)
    return <InstitutionErrorState title="Unable to load your programs" onRetry={departmentsQuery.refetch} />

  const raw = departmentsQuery.data
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.departments)
      ? raw.departments
      : Array.isArray(raw?.content)
        ? raw.content
        : []

  const groups = list.filter((group) => (group?.status ?? "active").toLowerCase() === "active")

  return (
    <div className="space-y-6">
      <InstitutionPageHeader
        title="Programs"
        subtitle="Choose a program to view its curriculum, instructional content, and learners."
      />

      {groups.length === 0 ? (
        <InstitutionEmptyState
          icon={UsersRoundIcon}
          title="No programs assigned"
          description="Ask your Institution Administrator to assign you to a program."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group, index) => {
            const deptId = group.departmentId ?? group.id
            const deptName = group.departmentName || group.name || "Learning group"
            return (
              <BubbleCard
                key={deptId ?? index}
                tone={toneForIndex(index)}
                icon={UsersRoundIcon}
                eyebrow="Learning group"
                title={deptName}
                footer={
                  <Button asChild className="w-full">
                    <Link to={`/institution/departments/${deptId}`}>
                      <BookOpenIcon className="size-4" />
                      Open workspace
                    </Link>
                  </Button>
                }
              >
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {group.departmentDescription || group.description || "Assigned learning group"}
                </p>
              </BubbleCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
