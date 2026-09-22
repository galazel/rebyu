import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Trash2 } from "@/components/icons"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  REFERENCE_DEPARTMENT,
  REFERENCE_INDUSTRY,
  addReferenceOption,
  getReferenceOptionsAdmin,
  retireReferenceOption,
} from "@/services/referenceService.js"

/**
 * The stored pick-lists, side by side. Adding an entry puts it in every
 * select that reads the list; retiring one hides it from the selects but
 * keeps the row, so a certification or department already tagged with it
 * still reads the same.
 */
const LISTS = [
  {
    kind: REFERENCE_INDUSTRY,
    title: "Industries",
    description: "What a certification belongs to. Offered when a certification is created or edited, and on challenge arenas.",
    placeholder: "e.g. Veterinary Medicine and Animal Care",
  },
  {
    kind: REFERENCE_DEPARTMENT,
    title: "Departments",
    description: "The names an institution can group its learners under. Offered when an institution creates a department.",
    placeholder: "e.g. College of Architecture",
  },
]

export default function ReferenceLists() {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-8 overflow-y-auto">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-semibold">Reference lists</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The pick-lists every form draws from. Retired entries stay on the records that already use them.
        </p>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        {LISTS.map((list) => (
          <ReferenceList key={list.kind} {...list} />
        ))}
      </div>
    </div>
  )
}

function ReferenceList({ kind, title, description, placeholder }) {
  const queryClient = useQueryClient()
  const [label, setLabel] = useState("")
  const query = useQuery({
    queryKey: ["reference-options-admin", kind],
    queryFn: () => getReferenceOptionsAdmin(kind),
    staleTime: 30_000,
  })
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["reference-options-admin", kind] })
    queryClient.invalidateQueries({ queryKey: ["reference-options", kind] })
  }
  const add = useMutation({
    mutationFn: (value) => addReferenceOption(kind, value),
    onSuccess: () => {
      setLabel("")
      invalidate()
      toast.success(`Added to ${title.toLowerCase()}.`)
    },
    onError: (error) => toast.error(error?.response?.data?.message ?? "Could not add that entry."),
  })
  const retire = useMutation({
    mutationFn: (id) => retireReferenceOption(kind, id),
    onSuccess: invalidate,
    onError: (error) => toast.error(error?.response?.data?.message ?? "Could not retire that entry."),
  })

  const rows = Array.isArray(query.data) ? query.data : []
  const active = rows.filter((row) => row.active)
  const retired = rows.filter((row) => !row.active)

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
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            const value = label.trim()
            if (value.length < 2) return
            add.mutate(value)
          }}
        >
          <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder={placeholder} maxLength={150} />
          <Button type="submit" disabled={add.isPending || label.trim().length < 2} className="gap-1.5">
            {add.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
            Add
          </Button>
        </form>
      </div>
      <ul className="divide-y divide-border">
        {query.isLoading ? (
          <li className="space-y-2 p-4"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-5 w-1/2" /><Skeleton className="h-5 w-3/5" /></li>
        ) : active.length === 0 ? (
          <li className="p-4 text-sm text-muted-foreground">Nothing here yet.</li>
        ) : (
          active.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
              <span className="min-w-0 break-words">{row.label}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                title="Retire: hide from the selects"
                disabled={retire.isPending}
                onClick={() => retire.mutate(row.id)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
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
                  onClick={() => add.mutate(row.label)}
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
