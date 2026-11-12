import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  GraduationCapIcon,
  MoreVertical,
  PencilIcon,
  Plus,
  Trash2Icon,
  Settings,
} from "@/components/icons"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ExportButton } from "@/components/commons/export-button.jsx"
import { PROGRAM_COLUMNS, SECTION_COLUMNS, sectionRow } from "@/lib/department-export.js"
import {
  InstitutionEmptyState,
  InstitutionErrorState,
  InstitutionLoadingSkeleton,
} from "@/components/institution/institution-ui.jsx"
import { ProgramDialog } from "@/components/institution/program-dialog.jsx"
import { ProgramCertificationsDialog } from "@/components/institution/program-certifications-dialog.jsx"
import { useDepartmentOverview } from "@/hooks/use-my-department.js"
import { isInstitutionOwner, useAuth } from "@/context/auth-context.jsx"
import { cn } from "@/lib/utils"
import {
  archiveDepartmentProgram,
  getDepartmentPrograms,
  getGroupSections,
} from "@/services/institutionService.js"

function message(error, fallback) {
  return error?.response?.data?.message ?? error?.message ?? fallback
}

/** Weighted by learners, so a big section counts more than an empty one. */
function rollUp(sectionRows) {
  const learners = sectionRows.reduce((sum, row) => sum + Number(row.learners ?? 0), 0)
  const progress = learners
    ? Math.round(
        sectionRows.reduce((sum, row) => sum + Number(row.averageProgress ?? 0) * Number(row.learners ?? 0), 0) /
          learners
      )
    : null
  const checkIns = sectionRows.reduce((sum, row) => sum + Number(row.atRisk ?? 0) + Number(row.dormant ?? 0), 0)
  return { learners, progress, checkIns }
}

function ProgramCard({
  code,
  title,
  href,
  subtitle,
  certifications = null,
  onEditCertifications,
  totals,
  sectionCount,
  menu,
  footer,
  muted = false,
}) {
  return (
    <article
      className={cn(
        "flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-xs",
        muted ? "border-dashed border-amber-500/50" : "border-border/70"
      )}
    >
      <header className="flex items-start gap-3 p-4 pb-3">
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-xl text-xs font-extrabold tracking-wide",
            muted ? "bg-amber-500/15 text-amber-800 dark:text-amber-300" : "bg-primary text-primary-foreground"
          )}
          aria-hidden="true"
        >
          {code}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold leading-snug text-foreground">
            {href ? (
              <Link to={href} className="hover:underline">
                {title}
              </Link>
            ) : (
              title
            )}
          </h3>
          {subtitle ? <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p> : null}
          {certifications ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {certifications.length ? (
                certifications.map((cert) => (
                  <span
                    key={cert.institutionCertId ?? cert.title}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"
                  >
                    <GraduationCapIcon className="size-3" aria-hidden="true" />
                    {cert.title}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-amber-700 dark:text-amber-300">No certification chosen</span>
              )}
              {onEditCertifications ? (
                <button
                  type="button"
                  onClick={onEditCertifications}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <PencilIcon className="size-3" aria-hidden="true" />
                  Certifications
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        {menu}
      </header>

      <div className="px-4 pb-4">
        <dl className="grid grid-cols-3 divide-x divide-border/60 rounded-xl border border-border/60 bg-muted/20 text-center">
          {[
            ["Sections", sectionCount],
            ["Learners", totals.learners],
            ["Completion", totals.progress == null ? "—" : `${totals.progress}%`],
          ].map(([label, value]) => (
            <div key={label} className="px-2 py-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
              <dd className="text-base font-extrabold tabular-nums text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
        {totals.checkIns > 0 ? (
          <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
            {totals.checkIns} learner{totals.checkIns === 1 ? "" : "s"} need a check-in
          </p>
        ) : null}
      </div>

      {footer ? <footer className="mt-auto flex items-center gap-2 border-t border-border/60 bg-muted/20 px-3 py-2">{footer}</footer> : null}
    </article>
  )
}

/**
 * Programs and the sections inside them, in one place: a department offers
 * programs (BSIT, BSCS), and each program holds sections (the actual classes).
 */
export function DepartmentProgramsPanel({ department }) {
  const departmentId = department?.departmentId
  const queryClient = useQueryClient()
  // Only the institution adds programs; a department head works inside the ones it was given.
  const { user } = useAuth()
  const canAddProgram = isInstitutionOwner(user)
  const [programTarget, setProgramTarget] = useState(null)
  const [certsFor, setCertsFor] = useState(null)
  const [deletingProgram, setDeletingProgram] = useState(null)

  const programsQuery = useQuery({
    queryKey: ["department-programs", departmentId],
    queryFn: () => getDepartmentPrograms(departmentId),
    enabled: departmentId != null,
  })
  const sectionsQuery = useQuery({
    queryKey: ["department-sections", departmentId],
    queryFn: () => getGroupSections(departmentId),
    enabled: departmentId != null,
  })
  const overviewQuery = useDepartmentOverview(departmentId)

  const programs = useMemo(() => (Array.isArray(programsQuery.data) ? programsQuery.data : []), [programsQuery.data])
  const sections = useMemo(() => (Array.isArray(sectionsQuery.data) ? sectionsQuery.data : []), [sectionsQuery.data])
  const statsById = useMemo(
    () => new Map((overviewQuery.data?.sections ?? []).map((row) => [row.sectionId, row])),
    [overviewQuery.data]
  )
  const certifications = (department?.certifications ?? []).filter(
    (cert) => String(cert?.status ?? "active").toLowerCase() === "active"
  )
  const existingCodes = programs.map((program) => String(program.programCode ?? "").toUpperCase())

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["department-programs", departmentId] })
    queryClient.invalidateQueries({ queryKey: ["department-sections", departmentId] })
    queryClient.invalidateQueries({ queryKey: ["department-learner-roster", departmentId] })
    queryClient.invalidateQueries({ queryKey: ["department-overview", departmentId] })
  }

  const deleteProgram = useMutation({
    mutationFn: (program) => archiveDepartmentProgram(departmentId, program.programId),
    onSuccess: (_, program) => {
      toast.success(`${program.programName} deleted`)
      refresh()
      setDeletingProgram(null)
    },
    onError: (error) => toast.error(message(error, "Could not delete the program")),
  })
  if (programsQuery.isLoading || sectionsQuery.isLoading) return <InstitutionLoadingSkeleton rows={3} />
  if (programsQuery.isError || sectionsQuery.isError) {
    return (
      <InstitutionErrorState
        title="Unable to load programs and sections"
        onRetry={() => {
          programsQuery.refetch()
          sectionsQuery.refetch()
        }}
      />
    )
  }

  const sectionsOf = (programId) => sections.filter((section) => section.programId === programId)
  const openNewProgram = () =>
    setProgramTarget({ deptId: departmentId, deptName: department?.departmentName, existingCodes })

  const csv = () => [
    {
      title: "Programs",
      columns: PROGRAM_COLUMNS,
      rows: programs.map((program) => {
        const totals = rollUp(sectionsOf(program.programId).map((s) => statsById.get(s.sectionId) ?? {}))
        return [
          program.programCode,
          program.programName,
          (program.certifications ?? []).map((c) => c.title).join(" / "),
          sectionsOf(program.programId).length,
          totals.learners,
          totals.progress,
          totals.checkIns,
          program.createdAt ?? "",
        ]
      }),
    },
    {
      title: "Sections",
      columns: SECTION_COLUMNS,
      rows: sections.map((section) => sectionRow(section, statsById.get(section.sectionId))),
    },
  ]

  const allTotals = rollUp(sections.map((s) => statsById.get(s.sectionId) ?? {}))

  return (
    <section className="space-y-5">
      <div className="flex justify-end gap-3">
        <div className="flex items-center gap-2">
          <ExportButton
            filename="rebyu-department-programs"
            report="Programs and sections"
            details={[["Department", department?.departmentName]]}
            className="h-9 text-xs"
            sections={csv}
          />
          {canAddProgram ? (
            <Button size="sm" className="h-9 gap-1 text-xs" onClick={openNewProgram}>
              <Plus className="size-3.5" aria-hidden="true" />
              Add program
            </Button>
          ) : null}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Programs", programs.length],
          ["Sections", sections.length],
          ["Learners in sections", allTotals.learners],
          ["Average completion", allTotals.progress == null ? "—" : `${allTotals.progress}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border/70 bg-card px-4 py-3 shadow-xs">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-2xl font-extrabold tabular-nums text-foreground">{value}</dd>
          </div>
        ))}
      </dl>

      {programs.length === 0 && sections.length === 0 ? (
        <InstitutionEmptyState
          icon={GraduationCapIcon}
          title="No programs yet"
          description={
            canAddProgram
              ? "Add programs such as BSIT, BSCS or ACT, then create sections inside each one."
              : "Your institution has not given this department a program yet. Ask its administrator to add one."
          }
        />
      ) : (
        <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
          {programs.map((program) => {
            const list = sectionsOf(program.programId)
            const totals = rollUp(list.map((s) => statsById.get(s.sectionId) ?? {}))
            const edit = () =>
              setProgramTarget({ deptId: departmentId, deptName: department?.departmentName, existingCodes, program })
            const workspace = `/institution/departments/${departmentId}?programId=${program.programId}`
            return (
              <ProgramCard
                key={program.programId}
                code={(program.programCode || program.programName || "?").slice(0, 4).toUpperCase()}
                title={program.programName}
                href={workspace}
                certifications={program.certifications ?? []}
                onEditCertifications={() => setCertsFor(program)}
                totals={totals}
                sectionCount={list.length}
                menu={
                  // Only the institution edits or removes a program.
                  !canAddProgram ? null : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label={`${program.programName} actions`}>
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={edit} className="gap-2 text-xs">
                        <PencilIcon className="size-3.5" />
                        Edit program
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeletingProgram(program)}
                        className="gap-2 text-xs text-destructive focus:text-destructive"
                      >
                        <Trash2Icon className="size-3.5" />
                        Delete program
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  )
                }
                footer={
                  <Button asChild size="sm" className="h-9 w-full gap-1.5 text-xs">
                    <Link to={workspace}>
                      <Settings className="size-3.5" aria-hidden="true" />
                      Manage {program.programCode || "program"}
                    </Link>
                  </Button>
                }
              />
            )
          })}

        </div>
      )}

      {programTarget ? (
        <ProgramDialog
          key={`${departmentId}-${programTarget.program?.programId ?? "new"}`}
          target={programTarget}
          onClose={() => {
            setProgramTarget(null)
            refresh()
          }}
        />
      ) : null}

      {certsFor ? (
        <ProgramCertificationsDialog
          key={certsFor.programId}
          departmentId={departmentId}
          program={certsFor}
          certifications={certifications}
          onClose={() => setCertsFor(null)}
        />
      ) : null}

      <AlertDialog open={deletingProgram != null} onOpenChange={(open) => !open && setDeletingProgram(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingProgram?.programName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Its sections and learners stay in the department, listed under “Not in a program”.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProgram.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteProgram.isPending}
              onClick={(event) => {
                event.preventDefault()
                deleteProgram.mutate(deletingProgram)
              }}
            >
              {deleteProgram.isPending ? "Deleting…" : "Delete program"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </section>
  )
}
