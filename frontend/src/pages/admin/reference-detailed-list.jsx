import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Pencil, Plus, Trash2 } from "@/components/icons"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { getAllCertifications } from "@/services/certificationService.js"
import {
  addReferenceOption,
  getReferenceOptionsAdmin,
  retireReferenceOption,
  updateReferenceOption,
} from "@/services/referenceService.js"

const EMPTY = { label: "", code: "", description: "", category: "", certificationIds: [] }

/**
 * A reference list whose entries carry more than a label: programs (code, description,
 * certifications) and institutions (short name, address, category).
 */
export function DetailedReferenceList({ kind, title, description, fields, withCertifications = false }) {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)

  const query = useQuery({
    queryKey: ["reference-options-admin", kind],
    queryFn: () => getReferenceOptionsAdmin(kind),
    staleTime: 30_000,
  })
  const certificationsQuery = useQuery({
    queryKey: ["certifications", "request-access"],
    queryFn: () => getAllCertifications(undefined, { includeComingSoon: true, summary: true }),
    staleTime: 5 * 60 * 1000,
    enabled: withCertifications,
  })
  const certifications = useMemo(
    () =>
      (Array.isArray(certificationsQuery.data) ? certificationsQuery.data : [])
        .filter((c) => c.status === "PUBLISHED" || c.status === "COMING_SOON")
        .sort((a, b) => a.title.localeCompare(b.title)),
    [certificationsQuery.data]
  )
  const titleById = useMemo(
    () => new Map(certifications.map((c) => [c.certificationId, c.title])),
    [certifications]
  )

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["reference-options-admin", kind] })
    queryClient.invalidateQueries({ queryKey: ["reference-details", kind] })
  }
  const reset = () => {
    setDraft(EMPTY)
    setEditingId(null)
  }

  const payload = () => ({
    code: draft.code.trim(),
    description: draft.description.trim(),
    category: draft.category.trim(),
    ...(withCertifications ? { certificationIds: draft.certificationIds } : {}),
  })

  const save = useMutation({
    mutationFn: () =>
      editingId
        ? updateReferenceOption(kind, editingId, draft.label.trim(), payload())
        : addReferenceOption(kind, draft.label.trim(), payload()),
    onSuccess: () => {
      toast.success(editingId ? `Updated ${draft.label.trim()}.` : `Added to ${title.toLowerCase()}.`)
      reset()
      invalidate()
    },
    onError: (error) => toast.error(error?.response?.data?.message ?? "Could not save that entry."),
  })
  const retire = useMutation({
    mutationFn: (id) => retireReferenceOption(kind, id),
    onSuccess: () => {
      invalidate()
      if (editingId) reset()
    },
    onError: (error) => toast.error(error?.response?.data?.message ?? "Could not retire that entry."),
  })
  const restore = useMutation({
    mutationFn: (row) => addReferenceOption(kind, row.label, {}),
    onSuccess: invalidate,
    onError: (error) => toast.error(error?.response?.data?.message ?? "Could not bring that entry back."),
  })

  const rows = Array.isArray(query.data) ? query.data : []
  const active = rows.filter((row) => row.active)
  const retired = rows.filter((row) => !row.active)

  const startEdit = (row) => {
    setEditingId(row.id)
    setDraft({
      label: row.label ?? "",
      code: row.code ?? "",
      description: row.description ?? "",
      category: row.category ?? "",
      certificationIds: (row.certificationIds ?? []).map(Number),
    })
  }

  const toggleCertification = (id) =>
    setDraft((current) => ({
      ...current,
      certificationIds: current.certificationIds.includes(id)
        ? current.certificationIds.filter((value) => value !== id)
        : [...current.certificationIds, id],
    }))

  const set = (key) => (event) => setDraft((current) => ({ ...current, [key]: event.target.value }))

  return (
    <section className="rounded-xl border border-border bg-background">
      <div className="border-b border-border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          </div>
          <Badge variant="secondary">{active.length}</Badge>
        </div>

        <form
          className="mt-3 space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            if (draft.label.trim().length < 2) return
            save.mutate()
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.key} className={`space-y-1 ${field.wide ? "sm:col-span-2" : ""}`}>
                <Label htmlFor={`${kind}-${field.key}`}>{field.label}</Label>
                {field.multiline ? (
                  <Textarea
                    id={`${kind}-${field.key}`}
                    value={draft[field.key]}
                    onChange={set(field.key)}
                    placeholder={field.placeholder}
                    maxLength={field.max}
                    rows={2}
                  />
                ) : (
                  <Input
                    id={`${kind}-${field.key}`}
                    value={draft[field.key]}
                    onChange={set(field.key)}
                    placeholder={field.placeholder}
                    maxLength={field.max}
                    required={field.key === "label"}
                  />
                )}
              </div>
            ))}
          </div>

          {withCertifications ? (
            <fieldset className="space-y-1.5">
              <legend className="text-sm font-medium">Certifications under this program</legend>
              {certificationsQuery.isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="grid max-h-48 gap-1.5 overflow-y-auto rounded-md border border-border p-2 sm:grid-cols-2">
                  {certifications.map((certification) => (
                    <label
                      key={certification.certificationId}
                      className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-muted"
                    >
                      <Checkbox
                        checked={draft.certificationIds.includes(certification.certificationId)}
                        onCheckedChange={() => toggleCertification(certification.certificationId)}
                      />
                      <span className="min-w-0 truncate">{certification.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={save.isPending || draft.label.trim().length < 2} className="gap-1.5">
              {save.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : editingId ? null : (
                <Plus className="size-4" aria-hidden="true" />
              )}
              {editingId ? "Save changes" : "Add"}
            </Button>
            {editingId ? (
              <Button type="button" variant="outline" onClick={reset}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </div>

      <ul className="max-h-[32rem] divide-y divide-border overflow-y-auto">
        {query.isLoading ? (
          <li className="space-y-2 p-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
          </li>
        ) : active.length === 0 ? (
          <li className="p-4 text-sm text-muted-foreground">Nothing here yet.</li>
        ) : (
          active.map((row) => (
            <li
              key={row.id}
              className={`flex items-start justify-between gap-3 px-4 py-2.5 text-sm ${
                editingId === row.id ? "bg-primary/5" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="break-words">
                  {row.code ? (
                    <span className="mr-1.5 rounded bg-muted px-1.5 py-0.5 text-[11px] font-semibold">{row.code}</span>
                  ) : null}
                  {row.label}
                </p>
                {row.description ? <p className="text-xs text-muted-foreground">{row.description}</p> : null}
                {withCertifications ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {(row.certificationIds ?? []).length === 0
                      ? "No certifications yet"
                      : (row.certificationIds ?? []).map((id) => titleById.get(Number(id)) ?? `#${id}`).join(", ")}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  title="Edit"
                  onClick={() => startEdit(row)}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  title="Retire: hide from the selects"
                  disabled={retire.isPending}
                  onClick={() => retire.mutate(row.id)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))
        )}
      </ul>

      {retired.length > 0 ? (
        <div className="border-t border-border p-4">
          <p className="text-xs font-medium text-muted-foreground">Retired ({retired.length})</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {retired.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-foreground"
                  title="Bring back"
                  onClick={() => restore.mutate(row)}
                >
                  {row.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
