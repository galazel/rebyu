import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2 } from "@/components/icons"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  getCertificationExamFormat,
  updateCertificationExamFormat,
} from "@/services/certificationService.js"

const ORIGIN_LABELS = {
  PLANNER: "found by the AI planner",
  LOOKUP: "looked up by the AI",
  MANUAL: "set by an admin",
}

export function examFormatQuery(certificationId) {
  return {
    queryKey: ["certification-exam-format", Number(certificationId)],
    queryFn: () => getCertificationExamFormat(certificationId),
    enabled: certificationId != null,
    staleTime: 5 * 60 * 1000,
  }
}

function describe(format) {
  const parts = []
  if (format?.totalItems) parts.push(`${format.totalItems} questions`)
  if (format?.durationMinutes) parts.push(`${format.durationMinutes} min`)
  if (format?.passingScore) parts.push(`pass ${Number(format.passingScore)}%`)
  return parts.join(" · ")
}

function toNumberOrNull(value) {
  const number = Number(value)
  return value === "" || value == null || !Number.isFinite(number) || number <= 0 ? null : number
}

function draftOf(format) {
  return {
    totalItems: format?.totalItems ?? "",
    durationMinutes: format?.durationMinutes ?? "",
    passingScore: format?.passingScore != null ? Number(format.passingScore) : "",
    source: format?.source ?? "",
    sections: (format?.sections ?? []).map((section) => ({
      name: section.name ?? "",
      totalItems: section.totalItems ?? "",
      durationMinutes: section.durationMinutes ?? "",
      questionTypes: section.questionTypes ?? [],
    })),
  }
}

/**
 * The real exam a certification's mock imitates. `editable` lets an admin
 * correct it; `selectedCount` compares a mock exam's question count against it.
 */
export default function ExamFormatPanel({
  certificationId,
  editable = false,
  selectedCount = null,
  onUseTiming = null,
}) {
  const queryClient = useQueryClient()
  const formatQuery = useQuery(examFormatQuery(certificationId))
  const format = formatQuery.data
  const [draft, setDraft] = useState(null)

  const saveMutation = useMutation({
    mutationFn: () =>
      updateCertificationExamFormat(certificationId, {
        ...format,
        totalItems: toNumberOrNull(draft.totalItems),
        durationMinutes: toNumberOrNull(draft.durationMinutes),
        passingScore: toNumberOrNull(draft.passingScore),
        source: draft.source.trim() || null,
        sections: draft.sections
          .filter((section) => section.name.trim())
          .map((section) => ({
            name: section.name.trim(),
            totalItems: toNumberOrNull(section.totalItems),
            durationMinutes: toNumberOrNull(section.durationMinutes),
            questionTypes: section.questionTypes,
          })),
      }),
    onSuccess: (saved) => {
      queryClient.setQueryData(examFormatQuery(certificationId).queryKey, saved)
      toast.success("Real exam format saved.")
      setDraft(null)
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? "The exam format could not be saved.")
    },
  })

  if (formatQuery.isLoading) {
    return <p className="text-xs text-muted-foreground">Loading the real exam format…</p>
  }

  const summary = describe(format)
  const total = format?.totalItems ?? null
  const mismatch = selectedCount != null && total != null && selectedCount !== total

  function updateSection(index, field, value) {
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((section, i) =>
        i === index ? { ...section, [field]: value } : section,
      ),
    }))
  }

  if (draft) {
    const sectionTotal = draft.sections.reduce((sum, s) => sum + (toNumberOrNull(s.totalItems) ?? 0), 0)
    const draftTotal = toNumberOrNull(draft.totalItems)
    return (
      <div className="space-y-3 rounded-xl border p-4">
        <h4 className="text-sm font-semibold">Real exam format</h4>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="format-items">Questions</Label>
            <Input id="format-items" type="number" min="1" value={draft.totalItems}
              onChange={(e) => setDraft({ ...draft, totalItems: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="format-minutes">Time (minutes)</Label>
            <Input id="format-minutes" type="number" min="1" value={draft.durationMinutes}
              onChange={(e) => setDraft({ ...draft, durationMinutes: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="format-passing">Pass mark (%)</Label>
            <Input id="format-passing" type="number" min="0" max="100" value={draft.passingScore}
              onChange={(e) => setDraft({ ...draft, passingScore: e.target.value })} />
          </div>
          <div className="space-y-1 sm:col-span-3">
            <Label htmlFor="format-source">Source (official page)</Label>
            <Input id="format-source" value={draft.source} placeholder="https://"
              onChange={(e) => setDraft({ ...draft, source: e.target.value })} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Sections</p>
            <Button type="button" variant="outline" size="sm"
              onClick={() => setDraft({
                ...draft,
                sections: [...draft.sections, { name: "", totalItems: "", durationMinutes: "", questionTypes: [] }],
              })}>
              <Plus aria-hidden="true" /> Add section
            </Button>
          </div>
          {draft.sections.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              None — the exam is one undivided paper.
            </p>
          ) : (
            draft.sections.map((section, index) => (
              <div key={index} className="grid grid-cols-[1fr_6rem_6rem_auto] items-center gap-2">
                <Input aria-label="Section name" placeholder="e.g. Subject A" value={section.name}
                  onChange={(e) => updateSection(index, "name", e.target.value)} />
                <Input aria-label="Section questions" type="number" min="1" placeholder="Items"
                  value={section.totalItems}
                  onChange={(e) => updateSection(index, "totalItems", e.target.value)} />
                <Input aria-label="Section minutes" type="number" min="1" placeholder="Min"
                  value={section.durationMinutes}
                  onChange={(e) => updateSection(index, "durationMinutes", e.target.value)} />
                <Button type="button" variant="ghost" size="icon" aria-label="Remove section"
                  onClick={() => setDraft({
                    ...draft,
                    sections: draft.sections.filter((_, i) => i !== index),
                  })}>
                  <Trash2 />
                </Button>
              </div>
            ))
          )}
          {draft.sections.length > 0 && draftTotal != null && sectionTotal !== draftTotal ? (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              The sections add up to {sectionTotal} questions, not {draftTotal}.
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setDraft(null)}
            disabled={saveMutation.isPending}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving…" : "Save format"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-xl border p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold">
            Real exam: {summary || "not recorded yet"}
          </p>
          <p className="text-xs text-muted-foreground">
            {format?.origin ? `${ORIGIN_LABELS[format.origin] ?? format.origin}` : "The mock exam should match the real paper."}
            {format?.source ? (
              <>
                {" · "}
                <a href={format.source} target="_blank" rel="noreferrer" className="underline">
                  source
                </a>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {onUseTiming && (format?.durationMinutes || format?.passingScore) ? (
            <Button type="button" variant="outline" size="sm"
              onClick={() => onUseTiming({
                durationMinutes: format.durationMinutes,
                passingScore: format.passingScore != null ? Number(format.passingScore) : null,
              })}>
              Use real time and pass mark
            </Button>
          ) : null}
          {editable ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setDraft(draftOf(format))}>
              {summary ? "Edit" : "Set format"}
            </Button>
          ) : null}
        </div>
      </div>

      {format?.sections?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {format.sections.map((section) => (
            <Badge key={section.name} variant="secondary" className="font-normal">
              {section.name}
              {section.totalItems ? ` · ${section.totalItems}` : ""}
              {section.durationMinutes ? ` · ${section.durationMinutes} min` : ""}
            </Badge>
          ))}
        </div>
      ) : null}

      {mismatch ? (
        <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
          This mock has {selectedCount} question{selectedCount === 1 ? "" : "s"}; the real exam
          has {total}. Add or remove questions to match it.
        </p>
      ) : selectedCount != null && total != null ? (
        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
          Matches the real exam&apos;s {total} questions.
        </p>
      ) : null}
    </div>
  )
}
