import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Check, GraduationCapIcon } from "@/components/icons"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { setDepartmentProgramCertifications } from "@/services/institutionService.js"

/** Pick which of the department's certifications a program's learners can be given. */
export function ProgramCertificationsDialog({ departmentId, program, certifications, onClose }) {
  const queryClient = useQueryClient()
  const [chosen, setChosen] = useState(() => (program?.certifications ?? []).map((cert) => cert.institutionCertId))
  const toggle = (id) => setChosen((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]))
  const allChosen = certifications.length > 0 && certifications.every((cert) => chosen.includes(cert.institutionCertId))

  const save = useMutation({
    mutationFn: () => setDepartmentProgramCertifications(departmentId, program.programId, chosen),
    onSuccess: () => {
      toast.success(`${program.programCode || program.programName} certifications saved; its learners are enrolled in any you added`)
      queryClient.invalidateQueries({ queryKey: ["department-programs", departmentId] })
      queryClient.invalidateQueries({ queryKey: ["department-program", departmentId, program.programId] })
      onClose()
    },
    onError: (error) => toast.error(error?.response?.data?.message || "Could not save the certifications"),
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{program.programCode || program.programName} certifications</DialogTitle>
          <DialogDescription>
            What {program.programName} learners study. Learners already in its sections are enrolled in any
            certification you add right away, with no invitation email; each takes one seat.
          </DialogDescription>
        </DialogHeader>

        {certifications.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
            Your institution has not given this department any certification yet.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-end">
              <button
                type="button"
                className="text-xs font-semibold text-primary hover:underline"
                onClick={() => setChosen(allChosen ? [] : certifications.map((cert) => cert.institutionCertId))}
              >
                {allChosen ? "Clear" : "Select all"}
              </button>
            </div>
            {certifications.map((cert) => {
              const checked = chosen.includes(cert.institutionCertId)
              return (
                <button
                  key={cert.institutionCertId}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() => toggle(cert.institutionCertId)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button onClick={() => save.mutate()} disabled={chosen.length === 0 || save.isPending}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
