import { useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Pencil, Plus, Search, Trash2, X } from "@/components/icons"
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
  useReferenceDetails,
} from "@/services/referenceService.js"
import { cn } from "@/lib/utils"

const EMPTY = { label: "", code: "", description: "", category: "", certificationIds: [] }

/**
 * A reference list whose entries carry more than a label: programs (code, description,
 * certifications) and institutions (short name, address, category).
 */
export function DetailedReferenceList({ kind, title, description, fields, withCertifications = false, className = "", defaultEditorOpen = false }) {
  const queryClient = useQueryClient()
  const scrollContainerRef = useRef(null)
  const [draft, setDraft] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [editorOpen, setEditorOpen] = useState(defaultEditorOpen)
  const [search, setSearch] = useState("")

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
    setEditorOpen(false)
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
  const searchTerm = search.trim().toLocaleLowerCase()
  const visibleActive = active.filter((row) => {
    if (!searchTerm) return true
    const certificationNames = (row.certificationIds ?? [])
      .map((id) => titleById.get(Number(id)) ?? "")
      .join(" ")
    return [row.code, row.label, row.description, row.category, certificationNames]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase()
      .includes(searchTerm)
  })

  const startEdit = (row) => {
    setEditingId(row.id)
    setDraft({
      label: row.label ?? "",
      code: row.code ?? "",
      description: row.description ?? "",
      category: row.category ?? "",
      certificationIds: (row.certificationIds ?? []).map(Number),
    })
    setEditorOpen(true)
    setTimeout(() => {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    }, 40)
  }

  const startAdd = () => {
    setDraft(EMPTY)
    setEditingId(null)
    setEditorOpen(true)
    setTimeout(() => {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    }, 40)
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
    <section
      className={cn(
        "flex h-[460px] sm:h-[520px] lg:h-[580px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs",
        className
      )}
    >
      <div className="shrink-0 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-rb-display text-lg font-bold text-foreground sm:text-xl">{title}</h2>
          </div>
          <Badge variant="secondary" className="shrink-0 px-2.5 py-0.5 text-xs font-semibold tabular-nums">
            {active.length}
          </Badge>
        </div>

        <div className="mt-3.5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${title.toLocaleLowerCase()}...`}
              className="h-9 pl-9 pr-9 text-xs sm:text-sm"
              aria-label={`Search ${title}`}
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <Button
            type="button"
            size="sm"
            onClick={editorOpen && !editingId ? reset : startAdd}
            className="h-9 shrink-0 gap-1.5 text-xs font-medium"
          >
            {editorOpen && !editingId ? (
              <>
                <X className="size-3.5" aria-hidden="true" />
                Close
              </>
            ) : (
              <>
                <Plus className="size-3.5" aria-hidden="true" />
                Add {title.slice(0, -1)}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-y border-border/70 bg-muted/15 px-4 py-2 text-xs text-muted-foreground sm:px-5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {searchTerm ? "Matching entries" : "Active entries"}
        </span>
        <span className="tabular-nums">
          {visibleActive.length} of {active.length}
        </span>
      </div>

      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain divide-y divide-border/70">
        {editorOpen ? (
          <div className="border-b border-border/70 bg-muted/20 p-4 sm:p-5">
            <div className="mb-3.5 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  {editingId ? "Editing entry" : "New entry"}
                </p>
                <h3 className="text-sm font-semibold text-foreground sm:text-base">
                  {editingId ? `Update ${draft.label || title.slice(0, -1)}` : `Add ${title.slice(0, -1)}`}
                </h3>
              </div>
              <Button type="button" variant="ghost" size="icon" className="size-7 text-muted-foreground" onClick={reset} aria-label="Close editor">
                <X className="size-3.5" aria-hidden="true" />
              </Button>
            </div>
            <form
              className="space-y-3.5"
              onSubmit={(event) => {
                event.preventDefault()
                if (draft.label.trim().length < 2) return
                save.mutate()
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {fields.map((field) => (
                  <div key={field.key} className={`space-y-1.5 ${field.wide ? "sm:col-span-2" : ""}`}>
                    <Label htmlFor={`${kind}-${field.key}`} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {field.label}
                    </Label>
                    {field.optionsKind ? (
                      <CodeChecklist
                        kind={field.optionsKind}
                        value={draft[field.key]}
                        onChange={(next) => setDraft((prev) => ({ ...prev, [field.key]: next }))}
                      />
                    ) : field.multiline ? (
                      <Textarea
                        id={`${kind}-${field.key}`}
                        value={draft[field.key]}
                        onChange={set(field.key)}
                        placeholder={field.placeholder}
                        maxLength={field.max}
                        rows={2}
                        className="text-xs sm:text-sm"
                      />
                    ) : (
                      <Input
                        id={`${kind}-${field.key}`}
                        value={draft[field.key]}
                        onChange={set(field.key)}
                        placeholder={field.placeholder}
                        maxLength={field.max}
                        required={field.key === "label"}
                        className="h-9 text-xs sm:text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>

              {withCertifications ? (
                <fieldset className="space-y-1.5">
                  <legend className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Certifications under this program
                  </legend>
                  {certificationsQuery.isLoading ? (
                    <Skeleton className="h-16 w-full" />
                  ) : (
                    <div className="grid max-h-44 gap-1.5 overflow-y-auto rounded-lg border border-border bg-background p-2 sm:grid-cols-2">
                      {certifications.map((certification) => (
                        <label
                          key={certification.certificationId}
                          className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs hover:bg-muted"
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

              <div className="flex flex-wrap justify-end gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={reset}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={save.isPending || draft.label.trim().length < 2} className="gap-1.5">
                  {save.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : editingId ? null : (
                    <Plus className="size-3.5" aria-hidden="true" />
                  )}
                  {editingId ? "Save changes" : "Add"}
                </Button>
              </div>
            </form>
          </div>
        ) : null}

        <ul className="divide-y divide-border/60">
          {query.isLoading ? (
            <li className="space-y-2 p-4">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
            </li>
          ) : visibleActive.length === 0 ? (
            <li className="p-8 text-center text-xs text-muted-foreground sm:text-sm">
              {active.length === 0 ? `No ${title.toLocaleLowerCase()} yet.` : "No entries match that search."}
            </li>
          ) : (
            visibleActive.map((row) => (
              <li
                key={row.id}
                className={cn(
                  "flex items-start justify-between gap-3 px-4 py-3 text-sm transition-colors sm:px-5 sm:py-3.5",
                  editingId === row.id ? "bg-primary/5" : "hover:bg-muted/30"
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {row.code ? (
                      <span className="inline-flex items-center rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[11px] font-bold text-primary">
                        {row.code}
                      </span>
                    ) : null}
                    <span className="break-words font-medium text-foreground">{row.label}</span>
                  </div>
                  {row.category ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="font-medium text-muted-foreground/80">Classification:</span> {row.category}
                    </p>
                  ) : null}
                  {row.description ? (
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{row.description}</p>
                  ) : null}
                  {withCertifications ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(row.certificationIds ?? []).length === 0 ? (
                        <span className="text-[11px] italic text-muted-foreground">No certifications linked</span>
                      ) : (
                        (row.certificationIds ?? []).map((id) => (
                          <span
                            key={id}
                            className="inline-flex items-center rounded border border-border/80 bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {titleById.get(Number(id)) ?? `#${id}`}
                          </span>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7.5 text-muted-foreground hover:text-foreground"
                    title="Edit"
                    onClick={() => startEdit(row)}
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7.5 text-muted-foreground hover:text-destructive"
                    title="Retire: hide from selects"
                    disabled={retire.isPending}
                    onClick={() => retire.mutate(row.id)}
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>

        {retired.length > 0 ? (
          <div className="bg-muted/15 p-4 sm:px-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Retired ({retired.length})
              </p>
              <span className="text-[11px] text-muted-foreground">Click to restore</span>
            </div>
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {retired.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground active:scale-95"
                    title="Bring back"
                    onClick={() => restore.mutate(row)}
                  >
                    <Plus className="size-3 text-muted-foreground" aria-hidden="true" />
                    <span>{row.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  )
}

// Picks codes from another reference list and stores them as "BSIT, BSCS, ACT".
function CodeChecklist({ kind, value, onChange }) {
  const { options, isLoading } = useReferenceDetails(kind)
  const codes = options.filter((option) => option.code)
  const chosen = new Set(
    String(value ?? "")
      .toUpperCase()
      .split(/[^A-Z0-9]+/)
      .filter(Boolean)
  )
  const toggle = (code) => {
    const next = codes
      .map((option) => option.code)
      .filter((c) => (c === code ? !chosen.has(c.toUpperCase()) : chosen.has(c.toUpperCase())))
    onChange(next.join(", "))
  }
  if (isLoading) return <Skeleton className="h-16 w-full" />
  if (codes.length === 0) {
    return <p className="text-sm text-muted-foreground">Add degree programs to their list first.</p>
  }
  return (
    <div className="grid max-h-48 gap-1.5 overflow-y-auto rounded-md border border-border p-2 sm:grid-cols-2">
      {codes.map((option) => (
        <label
          key={option.id}
          className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-muted"
        >
          <Checkbox
            checked={chosen.has(option.code.toUpperCase())}
            onCheckedChange={() => toggle(option.code)}
          />
          <span className="min-w-0 truncate">
            <span className="font-semibold">{option.code}</span> · {option.label}
          </span>
        </label>
      ))}
    </div>
  )
}
