import { Link, Navigate, useParams, useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeftIcon, Layers } from "@/components/icons"

import { Tabs, TabsContent } from "@/components/ui/tabs"
import {
  InstitutionEmptyState,
  InstitutionErrorState,
  InstitutionLoadingSkeleton,
} from "@/components/institution/institution-ui.jsx"
import { cn } from "@/lib/utils"
import { SectionsTab } from "@/components/institution/sections-tab.jsx"
import {
  getDepartmentLearners,
  getDepartmentById,
  getDepartmentProgram,
} from "@/services/institutionService.js"

function asArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.content)) return value.content
  if (Array.isArray(value?.departments)) return value.departments
  if (Array.isArray(value?.data)) return value.data
  return []
}

/**
 * A program workspace is only for its sections and learners. Curriculum, assessments,
 * the question bank, co-authorities and announcements are department-level views.
 */
const WORKSPACE_TABS = [
  { tab: "learners", label: "Sections & learners", icon: Layers },
]
const VALID_TABS = WORKSPACE_TABS.map((item) => item.tab)
/** Old workspace tabs that now live on the department page. */
const DEPARTMENT_TAB_VIEWS = {
  authorities: "heads",
  announcements: "announcements",
  assessments: "assessments",
  "question-bank": "question-bank",
  curriculum: "curriculum",
}

export default function InstitutionDepartmentWorkspacePage() {
  const { departmentId } = useParams()
  const id = Number(departmentId)
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get("tab")
  const programId = Number(searchParams.get("programId")) || null
  const activeTab = VALID_TABS.includes(requestedTab) ? requestedTab : "learners"
  const focusSectionId = Number(searchParams.get("section")) || null

  const departmentQuery = useQuery({
    queryKey: ["department", id],
    queryFn: () => getDepartmentById(id),
    enabled: Number.isFinite(id),
  })
  const assigneesQuery = useQuery({
    queryKey: ["department-learners", id],
    queryFn: () => getDepartmentLearners({ departmentId: id }),
    enabled: Number.isFinite(id),
  })
  const programQuery = useQuery({
    queryKey: ["department-program", id, programId],
    queryFn: () => getDepartmentProgram(id, programId),
    enabled: Number.isFinite(id) && programId != null,
  })
  const program = programId != null ? programQuery.data ?? null : null
  // A department covers every certification its institution holds from the college; a
  // program offers the ones its department head picked. One shows at a time (?certificationId=).
  const programCertIds = new Set(asArray(program?.certifications).map((cert) => cert.institutionCertId))
  const coveredCertifications = asArray(departmentQuery.data?.certifications).filter(
    (cert) =>
      String(cert?.status ?? "active").toLowerCase() === "active" &&
      (program == null || programCertIds.has(cert.institutionCertId))
  )
  const requestedCertificationId = Number(searchParams.get("certificationId"))
  const groupCertificationId = coveredCertifications.some((cert) => cert.certificationId === requestedCertificationId)
    ? requestedCertificationId
    : coveredCertifications[0]?.certificationId ?? departmentQuery.data?.certificationId ?? null

  if (DEPARTMENT_TAB_VIEWS[requestedTab]) {
    const cert = searchParams.get("certificationId")
    return (
      <Navigate
        to={`/institution/departments?view=${DEPARTMENT_TAB_VIEWS[requestedTab]}&department=${id}${cert ? `&certificationId=${cert}` : ""}`}
        replace
      />
    )
  }

  if (departmentQuery.isLoading || (programId != null && programQuery.isLoading) || assigneesQuery.isLoading) {
    return <InstitutionLoadingSkeleton />
  }
  if (departmentQuery.isError) {
    return <InstitutionErrorState title="Unable to load this department" onRetry={departmentQuery.refetch} />
  }

  const group = departmentQuery.data
  if (!group) {
    return (
      <InstitutionEmptyState
        title="Department not found"
        description="This department is unavailable or you no longer have access to it."
      />
    )
  }

  const certIds = new Set(coveredCertifications.map((cert) => cert.institutionCertId))
  const learners = asArray(assigneesQuery.data).filter(
    (item) => item?.status === "active" && (program == null || certIds.has(item?.institutionCertId))
  )

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link
          to="/institution/departments?view=programs"
          className="inline-flex items-center gap-1.5 font-medium hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" aria-hidden="true" />
          {group?.departmentName || "Department"}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate font-semibold text-foreground">
          {program ? program.programCode || program.programName : "Workspace"}
        </span>
      </nav>

      <header className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-xs sm:flex-row sm:items-center">
        <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-primary text-sm font-extrabold tracking-wide text-primary-foreground">
          {(program?.programCode || group?.departmentName || "?").slice(0, 4).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            {program ? `Program · ${group?.departmentName ?? ""}` : "Department workspace"}
          </p>
          <h1 className="text-xl font-bold leading-tight text-foreground sm:text-2xl">
            {program ? program.programName : group?.departmentName || "Department workspace"}
          </h1>
          {program?.description ? (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{program.description}</p>
          ) : null}
        </div>
        <dl className="grid shrink-0 grid-cols-2 gap-2 text-center">
          {[
            ["Learners", learners.length],
            ["Certifications", coveredCertifications.length],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</dt>
              <dd className="text-lg font-extrabold tabular-nums text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <WorkspaceNav
        tabs={WORKSPACE_TABS}
        activeTab={activeTab}
        onSelect={(tab) =>
          setSearchParams((prev) => {
            const params = new URLSearchParams(prev)
            params.set("tab", tab)
            params.delete("section")
            return params
          })
        }
      />

      <Tabs value={activeTab} className="min-w-0">
        <TabsContent value="learners" className="mt-0">
          <SectionsTab
            departmentId={id}
            group={group}
            certificationId={program ? null : groupCertificationId}
            programId={programId}
            certifications={program ? coveredCertifications : null}
            focusSectionId={focusSectionId}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * The program workspace has a single focused view for its sections and learners.
 */
function WorkspaceNav({ tabs, activeTab, onSelect }) {
  return (
    <div className="space-y-3">
      <nav aria-label="Program" className="-mb-px flex gap-1 overflow-x-auto border-b border-border/70 scrollbar-none">
        {tabs.map((page) => {
          const Icon = page.icon
          const active = activeTab === page.tab
          return (
            <button
              key={page.tab}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onSelect(page.tab)}
              className={cn(
                "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {page.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
