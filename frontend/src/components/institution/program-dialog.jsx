import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, GraduationCapIcon, Search } from "@/components/icons"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { REFERENCE_DEGREE_PROGRAM, getReferenceDetails } from "@/services/referenceService.js"
import { createDepartmentProgram, updateDepartmentProgram } from "@/services/institutionService.js"

/** A numbered step heading in the form. */
function Step({ n, title, hint, action }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
          {n}
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </div>
      {action}
    </div>
  )
}

/** Add or edit a degree program (BSIT, BSCS...) of a department. */
export function ProgramDialog({ target, onClose }) {
  const queryClient = useQueryClient()
  const editing = target?.program ?? null
  const emptyForm = { programName: "", programCode: "", description: "", institutionCertIds: [] }
  const [query, setQuery] = useState("")
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
  const missing = !form.programName.trim()
    ? "Choose a program to continue."
    : form.institutionCertIds.length === 0
      ? "Pick at least one certification its students will study."
      : null
  const term = query.trim().toLowerCase()
  const visibleChoices = choices.filter(
    (option) => !term || option.code.toLowerCase().includes(term) || String(option.name).toLowerCase().includes(term)
  )
  const allCertsSelected = certifications.length > 0 && form.institutionCertIds.length === certifications.length

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))

  return (
    <Dialog open={target != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault()
            if (canSubmit) mutation.mutate()
          }}
        >
          <DialogHeader className="border-b border-border/50 p-5 pb-4">
            <DialogTitle>{editing ? "Edit program" : "Add program"}</DialogTitle>
            <DialogDescription>
              {target?.deptName} · a program (BSIT, BSCS…) holds sections, and its students study the certifications you pick.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-6 overflow-y-auto p-5">
            {/* 1. Program */}
            <section className="space-y-3">
              <Step
                n={1}
                title="Program"
                hint={`${choices.length} available · programs your department already runs are hidden`}
              />
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by code or name"
                  className="pl-9"
                  aria-label="Search programs"
                />
              </div>
              {degreeProgramsQuery.isLoading ? (
                <p className="text-xs text-muted-foreground">Loading programs…</p>
              ) : visibleChoices.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
                  {choices.length === 0
                    ? "Every program on the list is already in your department. The platform admin manages the list."
                    : "No program matches your search."}
                </p>
              ) : (
                <ul role="listbox" aria-label="Programs" className="max-h-60 space-y-1 overflow-y-auto rounded-xl border border-border/70 p-1">
                  {visibleChoices.map((option) => {
                    const selected = form.programCode === option.code
                    return (
                      <li key={option.code}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onClick={() => setForm((prev) => ({ ...prev, programCode: option.code, programName: option.name }))}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                            selected ? "bg-primary/10 ring-1 ring-inset ring-primary/40" : "hover:bg-muted/60"
                          )}
                        >
                          <span
                            className={cn(
                              "grid h-8 min-w-12 shrink-0 place-items-center rounded-md px-1.5 text-[11px] font-extrabold tracking-wide",
                              selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                            )}
                          >
                            {option.code}
                          </span>
                          <span className="min-w-0 flex-1 text-sm leading-snug text-foreground">{option.name}</span>
                          {selected ? <Check className="size-4 shrink-0 text-primary" aria-hidden="true" /> : null}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            {/* 2. Certifications */}
            <section className="space-y-3">
              <Step
                n={2}
                title="Certifications"
                hint="What this program's students study and sit."
                action={
                  certifications.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          institutionCertIds: allCertsSelected ? [] : certifications.map((cert) => cert.institutionCertId),
                        }))
                      }
                    >
                      {allCertsSelected ? "Clear" : "Select all"}
                    </Button>
                  ) : null
                }
              />
              {certifications.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
                  Your institution has not given this department any certification yet.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {certifications.map((cert) => {
                    const checked = form.institutionCertIds.includes(cert.institutionCertId)
                    return (
                      <button
                        key={cert.institutionCertId}
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        onClick={() => toggleCert(cert.institutionCertId, !checked)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                          checked ? "border-primary/50 bg-primary/5" : "border-border/70 hover:bg-muted/50"
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-5 shrink-0 place-items-center rounded-md border",
                            checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
                          )}
                        >
                          {checked ? <Check className="size-3.5" aria-hidden="true" /> : null}
                        </span>
                        <GraduationCapIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate font-medium text-foreground">{cert.title}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </section>

            {/* 3. Description */}
            <section className="space-y-3">
              <Step n={3} title="Description" hint="Optional — what makes this program different." />
              <Textarea
                id="program-description"
                value={form.description}
                onChange={set("description")}
                maxLength={2000}
                rows={3}
                placeholder="e.g. Four-year degree focused on software development."
              />
              <p className="text-right text-[11px] tabular-nums text-muted-foreground">{form.description.length}/2000</p>
            </section>
          </div>

          <DialogFooter className="flex flex-row items-center justify-between gap-3 border-t border-border/50 bg-muted/20 p-4">
            <p className="min-w-0 text-xs text-muted-foreground">
              {missing ??
                `${form.programCode} · ${form.institutionCertIds.length} certification${form.institutionCertIds.length === 1 ? "" : "s"}`}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {mutation.isPending ? "Saving…" : editing ? "Save changes" : "Add program"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
