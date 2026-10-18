import { useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { BookOpenIcon, GraduationCapIcon, Layers, PencilIcon, PlusIcon, Trash2Icon, UsersRoundIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  InstitutionEmptyState,
  InstitutionErrorState,
  InstitutionLoadingSkeleton,
  InstitutionPageHeader,
} from "@/components/institution/institution-ui.jsx"
import { BubbleCard, toneForIndex } from "@/components/commons/bubble-card.jsx"
import { REFERENCE_DEGREE_PROGRAM, getReferenceDetails } from "@/services/referenceService.js"
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
import {
  archiveDepartmentProgram,
  createDepartmentProgram,
  getDepartmentPrograms,
  getDepartments,
  updateDepartmentProgram,
} from "@/services/institutionService.js"

function asList(raw) {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.departments)) return raw.departments
  if (Array.isArray(raw?.content)) return raw.content
  return []
}

export default function DepartmentHeadProgramsPage() {
  const [addingTo, setAddingTo] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const queryClient = useQueryClient()
  const deleteMutation = useMutation({
    mutationFn: ({ deptId, program }) => archiveDepartmentProgram(deptId, program.programId),
    onSuccess: (_, { deptId, program }) => {
      toast.success(`${program.programName} deleted`)
      queryClient.invalidateQueries({ queryKey: ["department-programs", deptId] })
      queryClient.invalidateQueries({ queryKey: ["department-sections", deptId] })
      setDeleting(null)
    },
    onError: (error) => toast.error(error?.response?.data?.message || error?.message || "Could not delete the program"),
  })

  const departmentsQuery = useQuery({
    queryKey: ["my-institution-groups"],
    queryFn: () => getDepartments(),
    retry: 1,
  })

  const departments = asList(departmentsQuery.data).filter(
    (group) => (group?.status ?? "active").toLowerCase() === "active"
  )

  const programQueries = useQueries({
    queries: departments.map((dept) => {
      const deptId = dept.departmentId ?? dept.id
      return {
        queryKey: ["department-programs", deptId],
        queryFn: () => getDepartmentPrograms(deptId),
        enabled: deptId != null,
      }
    }),
  })

  if (departmentsQuery.isLoading) return <InstitutionLoadingSkeleton />
  if (departmentsQuery.isError)
    return <InstitutionErrorState title="Unable to load your programs" onRetry={departmentsQuery.refetch} />

  return (
    <div className="space-y-8">
      <InstitutionPageHeader
        title="Programs"
        subtitle="Choose a program to manage its sections and the certifications each section takes."
      />

      {departments.length === 0 ? (
        <InstitutionEmptyState
          icon={UsersRoundIcon}
          title="No department assigned"
          description="Ask your Institution Administrator to assign you to a department."
        />
      ) : (
        departments.map((dept, deptIndex) => {
          const deptId = dept.departmentId ?? dept.id
          const deptName = dept.departmentName || dept.name || "Department"
          const query = programQueries[deptIndex]
          const programs = Array.isArray(query?.data) ? query.data : []
          const existingCodes = programs.map((program) => (program.programCode ?? "").toUpperCase())
          const certifications = (Array.isArray(dept.certifications) ? dept.certifications : []).filter(
            (cert) => (cert?.status ?? "active").toLowerCase() === "active"
          )
          return (
            <section key={deptId} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-rb-display text-lg font-bold text-foreground">{deptName}</h2>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/institution/departments/${deptId}?tab=learners`}>
                      <Layers className="size-4" />
                      Manage sections
                    </Link>
                  </Button>
                  <Button size="sm" onClick={() =>
                      setAddingTo({ deptId, deptName, certifications, existingCodes })
                    }>
                    <PlusIcon className="size-4" />
                    Add program
                  </Button>
                </div>
              </div>

              {query?.isLoading ? (
                <InstitutionLoadingSkeleton rows={2} />
              ) : query?.isError ? (
                <InstitutionErrorState title="Unable to load programs" onRetry={query.refetch} />
              ) : programs.length === 0 ? (
                <InstitutionEmptyState
                  icon={GraduationCapIcon}
                  title="No programs yet"
                  description="Add programs such as BSIT, BSCS, or ACT, then create sections inside each one."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {programs.map((program, index) => (
                    <BubbleCard
                      key={program.programId}
                      tone={toneForIndex(index)}
                      icon={GraduationCapIcon}
                      eyebrow={program.programCode || deptName}
                      title={program.programName}
                      footer={
                        <div className="space-y-2">
                          <Button asChild className="w-full">
                            <Link to={`/institution/departments/${deptId}?programId=${program.programId}`}>
                              <BookOpenIcon className="size-4" />
                              Open workspace
                            </Link>
                          </Button>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setAddingTo({ deptId, deptName, certifications, existingCodes, program })}
                            >
                              <PencilIcon className="size-4" />
                              Edit
                            </Button>
                            <Button variant="outline" onClick={() => setDeleting({ deptId, program })}>
                              <Trash2Icon className="size-4" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      }
                    >
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {program.sectionCount} section{program.sectionCount === 1 ? "" : "s"}
                        {program.certifications?.length
                          ? ` · ${program.certifications.map((cert) => cert.title).join(", ")}`
                          : ""}
                      </p>
                    </BubbleCard>
                  ))}
                </div>
              )}
            </section>
          )
        })
      )}

      <ProgramDialog
        key={addingTo ? `${addingTo.deptId}-${addingTo.program?.programId ?? "new"}` : "closed"}
        target={addingTo}
        onClose={() => setAddingTo(null)}
      />

      <AlertDialog open={deleting != null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.program.programName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Its sections and learners stay in the department, outside any program. You can add them to another
              program from its Sections page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={(event) => {
                event.preventDefault()
                deleteMutation.mutate(deleting)
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete program"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ProgramDialog({ target, onClose }) {
  const queryClient = useQueryClient()
  const editing = target?.program ?? null
  const emptyForm = { programName: "", programCode: "", description: "", institutionCertIds: [] }
  const [form, setForm] = useState(
    editing
      ? {
          programName: editing.programName ?? "",
          programCode: editing.programCode ?? "",
          description: editing.description ?? "",
          institutionCertIds: (editing.certifications ?? []).map((cert) => cert.institutionCertId),
        }
      : emptyForm
  )
  const certifications = target?.certifications ?? []
  // The degree programs an admin keeps on the Reference lists page.
  // Fetched fresh on every open so an admin's latest edits show straight away.
  const degreeProgramsQuery = useQuery({
    queryKey: ["reference-details", REFERENCE_DEGREE_PROGRAM],
    queryFn: () => getReferenceDetails(REFERENCE_DEGREE_PROGRAM),
    staleTime: 0,
  })
  const degreePrograms = Array.isArray(degreeProgramsQuery.data) ? degreeProgramsQuery.data : []
  const PROGRAM_CHOICES = degreePrograms
    .filter((option) => option.code)
    .map((option) => ({ code: option.code, name: option.label }))
  // Programs the department already runs are left out, except the one being edited.
  const taken = new Set(
    (target?.existingCodes ?? []).filter((code) => code !== editing?.programCode?.toUpperCase())
  )
  const choices = PROGRAM_CHOICES.filter((option) => !taken.has(option.code.toUpperCase()))
  // A program created before the list existed keeps its own name and code.
  if (editing?.programCode && !PROGRAM_CHOICES.some((option) => option.code === editing.programCode)) {
    choices.unshift({ code: editing.programCode, name: editing.programName })
  }
  const toggleCert = (id, checked) =>
    setForm((prev) => ({
      ...prev,
      institutionCertIds: checked
        ? [...prev.institutionCertIds, id]
        : prev.institutionCertIds.filter((existing) => existing !== id),
    }))

  const mutation = useMutation({
    mutationFn: () =>
      editing
        ? updateDepartmentProgram(target.deptId, editing.programId, form)
        : createDepartmentProgram(target.deptId, form),
    onSuccess: () => {
      toast.success(editing ? "Program updated" : "Program added")
      queryClient.invalidateQueries({ queryKey: ["department-programs", target.deptId] })
      setForm(emptyForm)
      onClose()
    },
    onError: (error) => toast.error(error?.response?.data?.message || error?.message || "Could not add the program"),
  })

  const canSubmit = form.programName.trim() && form.institutionCertIds.length > 0 && !mutation.isPending

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))

  return (
    <Dialog open={target != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (canSubmit) mutation.mutate()
          }}
        >
          <DialogHeader>
            <DialogTitle>{editing ? "Edit program" : "Add program"}</DialogTitle>
            <DialogDescription>{target?.deptName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="program-choice">Program</Label>
            <Select
              value={form.programCode || undefined}
              onValueChange={(code) => {
                const choice = choices.find((option) => option.code === code)
                setForm((prev) => ({ ...prev, programCode: choice.code, programName: choice.name }))
              }}
            >
              <SelectTrigger id="program-choice" className="w-full">
                <SelectValue placeholder="Choose a program" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-64">
                {choices.map((option) => (
                  <SelectItem key={option.code} value={option.code}>
                    {option.code} · {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Certifications</legend>
            {certifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Your institution has not provided any certification to this department yet.
              </p>
            ) : (
              certifications.map((cert) => {
                const checkboxId = `program-cert-${cert.institutionCertId}`
                return (
                  <div key={cert.institutionCertId} className="flex items-center gap-2">
                    <Checkbox
                      id={checkboxId}
                      checked={form.institutionCertIds.includes(cert.institutionCertId)}
                      onCheckedChange={(checked) => toggleCert(cert.institutionCertId, checked === true)}
                    />
                    <Label htmlFor={checkboxId} className="font-normal">
                      {cert.title}
                    </Label>
                  </div>
                )
              })
            )}
          </fieldset>
          <div className="space-y-2">
            <Label htmlFor="program-description">Description</Label>
            <Textarea id="program-description" value={form.description} onChange={set("description")} maxLength={2000} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {mutation.isPending ? "Saving…" : editing ? "Save changes" : "Add program"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
