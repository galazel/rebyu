import { useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getAssessmentTimers, saveAssessmentTimers } from "@/services/assessmentService.js"

const GLOBAL_FIELDS = [
  { field: "lessonQuizMinutes", label: "Lesson quizzes" },
  { field: "middleExamMinutes", label: "Middle exams" },
  { field: "majorExamMinutes", label: "Major exams" },
]

const CERTIFICATION_FIELDS = [
  { field: "diagnosticMinutes", label: "Diagnostic exam", placeholder: "96 min default" },
  { field: "mockExamMinutes", label: "Mock exam", placeholder: "150 min default" },
]

export default function AssessmentTimerSettings({ certificationId = null, currentDurations = {} }) {
  const queryClient = useQueryClient()
  const global = certificationId == null
  const fields = global ? GLOBAL_FIELDS : CERTIFICATION_FIELDS
  const queryKey = ["assessment-timers", certificationId == null ? null : String(certificationId)]
  const [edits, setEdits] = useState({})
  const { data, isPending, isError, refetch } = useQuery({
    queryKey,
    queryFn: () => getAssessmentTimers(certificationId),
  })
  const save = useMutation({
    mutationFn: (timers) => saveAssessmentTimers(certificationId, timers),
    onSuccess: async (timers) => {
      queryClient.setQueryData(queryKey, timers)
      setEdits({})
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["exams"] }),
        queryClient.invalidateQueries({ queryKey: ["learner-assessment-gate"] }),
      ])
      toast.success("Assessment timers saved.")
    },
    onError: (error) => toast.error(error?.response?.data?.message ?? "Could not save assessment timers."),
  })

  const values = Object.fromEntries(fields.map(({ field }) => [
    field, edits[field] ?? (data?.[field] == null ? "" : String(data[field])),
  ]))
  const timers = Object.fromEntries(fields.map(({ field }) => [
    field, values[field] === "" ? null : Number(values[field]),
  ]))
  const valid = Object.values(timers).every((value) =>
    value == null ? !global : Number.isInteger(value) && value > 0 && value <= 2147483647,
  )
  const changed = fields.some(({ field }) => timers[field] !== (data?.[field] ?? null))

  return (
    <section className="shrink-0 rounded-xl border border-border/80 bg-background p-4">
      <h2 className="text-sm font-semibold">{global ? "Assessment timers" : "Certification timers"}</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {global
          ? "Set the time in minutes for new attempts across all certifications. Existing attempts keep their deadline."
          : "Set the time in minutes for this certification. Leave a field empty to use the assessment’s duration or the standard default. Existing attempts keep their deadline."}
      </p>
      {!global && (
        <Link to="/admin/ai-settings#section-assessment-timers" className="mt-2 inline-block text-xs font-medium underline underline-offset-4">
          Manage shared timers for quizzes, middle exams, and major exams
        </Link>
      )}
      {isError ? (
        <div className="mt-3 flex items-center gap-3">
          <p className="text-sm">Could not load assessment timers.</p>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
        </div>
      ) : (
        <form
          className="mt-3 flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            if (!isPending && !save.isPending && valid && changed) save.mutate(timers)
          }}
        >
          {fields.map(({ field, label, placeholder }) => (
            <label key={field} className="min-w-36 flex-1 text-xs font-medium">
              {label}
              <Input
                className="mt-1"
                type="number"
                min="1"
                step="1"
                required={global}
                value={values[field]}
                placeholder={data?.[field] != null ? "Use default" : currentDurations[field] ?? placeholder}
                disabled={isPending || save.isPending}
                onChange={(event) => setEdits((current) => ({ ...current, [field]: event.target.value }))}
              />
            </label>
          ))}
          <Button type="submit" disabled={isPending || save.isPending || !valid || !changed}>
            {save.isPending ? "Saving…" : "Save timers"}
          </Button>
        </form>
      )}
    </section>
  )
}
