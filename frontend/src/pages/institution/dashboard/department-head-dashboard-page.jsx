import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { BookOpenIcon, UsersRoundIcon } from "@/components/icons"

import { Button } from "@/components/ui/button"
import {
  InstitutionEmptyState,
  InstitutionErrorState,
  InstitutionLoadingSkeleton,
} from "@/components/institution/institution-ui.jsx"
import { BubbleCard, toneForIndex } from "@/components/commons/bubble-card.jsx"
import { getDepartments } from "@/services/institutionService.js"

/** Home for teachers/facilitators. The API returns only their active authorities. */
export default function DepartmentHeadDashboardPage() {
  const departmentsQuery = useQuery({
    queryKey: ["my-institution-groups"],
    queryFn: getDepartments,
    retry: 1,
  })

  if (departmentsQuery.isLoading) return <InstitutionLoadingSkeleton />
  if (departmentsQuery.isError)
    return <InstitutionErrorState title="Unable to load your departments" onRetry={departmentsQuery.refetch} />

  const departments = (departmentsQuery.data ?? []).filter((row) => row.status === "active")

  return (
    <div className="space-y-6">

      {/* TEMPORARILY REMOVED (2026-08-24): the "group analytics" section --
          a "completion by group" bar and a "where your learners are" donut.
          Both were correctly wired to real data (`getDepartmentStats`,
          i.e. GET /api/institution/me/group-stats); they were taken out because
          with one learner at 0% progress they had nothing to show yet, not
          because anything was wrong with them.

          To restore: re-add the `departmentStatsQuery` useQuery for
          `getDepartmentStats`, the `completionMix` bucketing derived from
          it, and the two BentoTile charts. Full markup is in git history for
          this file. */}
      <section className="space-y-4">
        <div>
          <h2 className="font-rb-display text-xl font-extrabold lowercase">your departments</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a department to view its curriculum, instructional content, and learners.
          </p>
        </div>

        {departments.length === 0 ? (
          <InstitutionEmptyState
            icon={UsersRoundIcon}
            title="No departments assigned"
            description="Ask your institution to assign you as a department head."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {/* Same bubble card as the challenge arenas — a department is an
                entity you pick from a shelf, which is what that card is for. */}
            {departments.map((department, index) => (
              <BubbleCard
                key={department.departmentId}
                tone={toneForIndex(index)}
                icon={UsersRoundIcon}
                eyebrow="Department"
                title={department.departmentName}
                footer={
                  <Button asChild className="w-full">
                    <Link to={`/institution/departments/${department.departmentId}`}>
                      <BookOpenIcon className="size-4" />
                      Open workspace
                    </Link>
                  </Button>
                }
              >
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {department.departmentDescription || "Assigned department"}
                </p>
              </BubbleCard>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
