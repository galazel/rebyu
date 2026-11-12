import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Search } from "@/components/icons"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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

/**
 * Add or edit a degree program (BSIT, BSCS...) of a department. Only the institution
 * does this. Certifications are not chosen here: each learner's are picked when they
 * are added to a section.
 */
export function ProgramDialog({ target, onClose }) {
  const queryClient = useQueryClient()
  const editing = target?.program ?? null
  const [query, setQuery] = useState("")
  const [form, setForm] = useState({
    programName: editing?.programName ?? "",
    programCode: editing?.programCode ?? "",
    description: editing?.description ?? "",
  })
  const selectedRef = useRef(null)

  // The degree programs an admin keeps on the Reference lists page, fetched fresh
  // on every open so an admin's latest edits show straight away.
  const degreeProgramsQuery = useQuery({
    queryKey: ["reference-details", REFERENCE_DEGREE_PROGRAM],
    queryFn: () => getReferenceDetails(REFERENCE_DEGREE_PROGRAM),
    staleTime: 0,
  })
  const degreePrograms = Array.isArray(degreeProgramsQuery.data) ? degreeProgramsQuery.data : []
  const programChoices = degreePrograms
    .filter((option) => option.code)
    .map((option) => ({ code: option.code, name: option.label }))
  // Programs the department already runs are left out, except the one being edited.
  const taken = new Set(
    (target?.existingCodes ?? []).filter((code) => code !== editing?.programCode?.toUpperCase())
  )
  const choices = programChoices.filter((option) => !taken.has(option.code.toUpperCase()))
  // A program created before the list existed keeps its own name and code.
  if (editing?.programCode && !programChoices.some((option) => option.code === editing.programCode)) {
    choices.unshift({ code: editing.programCode, name: editing.programName })
  }
  const term = query.trim().toLowerCase()
  const visibleChoices = choices.filter(
    (option) => !term || option.code.toLowerCase().includes(term) || String(option.name).toLowerCase().includes(term)
  )

  // Editing: bring the current program into view instead of leaving it below the fold.
  useEffect(() => {
    if (degreeProgramsQuery.isSuccess) selectedRef.current?.scrollIntoView({ block: "nearest" })
  }, [degreeProgramsQuery.isSuccess])

  const mutation = useMutation({
    mutationFn: () => {
      // An empty list keeps the program's certifications (edit) or gives it every one
      // the department covers (new).
      const body = { ...form, institutionCertIds: [] }
      return editing
        ? updateDepartmentProgram(target.deptId, editing.programId, body)
        : createDepartmentProgram(target.deptId, body)
    },
    onSuccess: () => {
      toast.success(editing ? "Program updated" : "Program added")
      queryClient.invalidateQueries({ queryKey: ["department-programs", target.deptId] })
      onClose()
    },
    onError: (error) => toast.error(error?.response?.data?.message || error?.message || "Could not save the program"),
  })

  const canSubmit = form.programName.trim() && !mutation.isPending

  return (
    <Dialog open={target != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
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
              {target?.deptName ? `${target.deptName} · ` : ""}A program (BSIT, BSCS…) holds sections. It
              starts with every certification of the department; its head can narrow that on the program card.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            <section className="space-y-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor="program-search">Program</Label>
                <span className="text-[11px] text-muted-foreground">{choices.length} available</span>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="program-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by code or name"
                  className="pl-9"
                />
              </div>
              {degreeProgramsQuery.isLoading ? (
                <p className="text-xs text-muted-foreground">Loading programs…</p>
              ) : visibleChoices.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
                  {choices.length === 0
                    ? "Every program on the list is already in this department. The platform admin manages the list."
                    : "No program matches your search."}
                </p>
              ) : (
                <ul role="listbox" aria-label="Programs" className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-border/70 p-1">
                  {visibleChoices.map((option) => {
                    const selected = form.programCode === option.code
                    return (
                      <li key={option.code} ref={selected ? selectedRef : undefined}>
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

            <section className="space-y-2.5">
              <Label htmlFor="program-description">
                Description <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="program-description"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                maxLength={2000}
                rows={3}
                placeholder="e.g. Four-year degree focused on software development."
              />
            </section>
          </div>

          <DialogFooter className="flex flex-row items-center justify-between gap-3 border-t border-border/50 bg-muted/20 p-4">
            <p className="min-w-0 truncate text-xs text-muted-foreground">
              {form.programName ? `${form.programCode ? `${form.programCode} · ` : ""}${form.programName}` : "Choose a program to continue."}
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
