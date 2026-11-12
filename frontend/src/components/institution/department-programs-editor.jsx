import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { GraduationCapIcon, Loader2, PencilIcon, Plus, Trash2Icon } from "@/components/icons"
import { Button } from "@/components/ui/button"
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
import { ProgramDialog } from "@/components/institution/program-dialog.jsx"
import { archiveDepartmentProgram, getDepartmentPrograms } from "@/services/institutionService.js"

/**
 * The institution's view of a department's degree programs (BSIT, BSCS...): add, edit
 * and remove them from the Manage department dialog. Programs belong to the department,
 * so every department head of it sees the same list.
 */
export function DepartmentProgramsEditor({ department }) {
  const queryClient = useQueryClient()
  const departmentId = department?.departmentId
  const [target, setTarget] = useState(null)
  const [removing, setRemoving] = useState(null)

  const programsQuery = useQuery({
    queryKey: ["department-programs", departmentId],
    queryFn: () => getDepartmentPrograms(departmentId),
    enabled: departmentId != null,
  })
  const programs = Array.isArray(programsQuery.data) ? programsQuery.data : []
  const certifications = (department?.certifications ?? []).filter(
    (cert) => String(cert?.status ?? "active").toLowerCase() === "active"
  )
  const existingCodes = programs.map((program) => String(program.programCode ?? "").toUpperCase())

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["department-programs", departmentId] })
    queryClient.invalidateQueries({ queryKey: ["department-sections", departmentId] })
    queryClient.invalidateQueries({ queryKey: ["department-overview", departmentId] })
  }

  const removeMutation = useMutation({
    mutationFn: (program) => archiveDepartmentProgram(departmentId, program.programId),
    onSuccess: () => {
      toast.success("Program removed")
      setRemoving(null)
      refresh()
    },
    onError: (error) =>
      toast.error(error?.response?.data?.message ?? error?.message ?? "The program could not be removed"),
  })

  const open = (program) =>
    setTarget({
      deptId: departmentId,
      deptName: department?.departmentName,
      certifications,
      existingCodes,
      ...(program ? { program } : {}),
    })

  return (
    <section className="space-y-2 rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <GraduationCapIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            Programs ({programs.length})
          </p>
          <p className="text-xs text-muted-foreground">
            Every department head of this department sees and manages the same programs.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 gap-1 text-xs"
          disabled={departmentId == null || certifications.length === 0}
          onClick={() => open(null)}
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Add program
        </Button>
      </div>

      {programsQuery.isLoading ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          Loading programs...
        </p>
      ) : programsQuery.isError ? (
        <p className="text-xs text-destructive">The programs could not be loaded.</p>
      ) : programs.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {certifications.length === 0
            ? "This department covers no active certification yet, so programs can't be added."
            : "No programs yet. Add BSIT, BSCS or any program this department runs."}
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {programs.map((program) => (
            <li key={program.programId} className="flex items-center gap-3 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {program.programCode ? `${program.programCode} · ` : ""}
                  {program.programName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {(program.certifications ?? []).map((cert) => cert.title).filter(Boolean).join(" / ") ||
                    "No certification"}
                  {" · "}
                  {program.sectionCount ?? 0} section{Number(program.sectionCount) === 1 ? "" : "s"}
                </p>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8"
                aria-label={`Edit ${program.programName}`}
                onClick={() => open(program)}
              >
                <PencilIcon className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8 text-destructive hover:text-destructive"
                aria-label={`Remove ${program.programName}`}
                onClick={() => setRemoving(program)}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {target ? (
        <ProgramDialog
          key={`${departmentId}-${target.program?.programId ?? "new"}`}
          target={target}
          onClose={() => {
            setTarget(null)
            refresh()
          }}
        />
      ) : null}

      <AlertDialog open={removing != null} onOpenChange={(next) => !next && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.programName}?</AlertDialogTitle>
            <AlertDialogDescription>
              The program disappears for every department head. Its sections and learners stay in the
              department, no longer grouped under it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={removeMutation.isPending}
              onClick={(event) => {
                event.preventDefault()
                if (removing) removeMutation.mutate(removing)
              }}
            >
              {removeMutation.isPending ? "Removing..." : "Remove program"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
