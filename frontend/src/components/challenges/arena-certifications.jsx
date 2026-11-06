import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { Check, Loader2, Save, Search } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getAllCertifications } from "@/services/certificationService.js"
import { CHALLENGE_ARENAS_KEY, setArenaCertifications } from "@/services/challengeService.js"
import { cn } from "@/lib/utils"

/**
 * Pick the certifications this challenge belongs to. Learners enrolled in any of
 * them see it on their learning path (a challenge icon on the left), as long as
 * the challenge is live.
 */
export default function ArenaCertifications({ arena, status }) {
  const queryClient = useQueryClient()
  const certificationsQuery = useQuery({
    queryKey: ["certifications", "summary"],
    queryFn: () => getAllCertifications(undefined, { summary: true }),
    staleTime: 5 * 60_000,
  })
  const saved = useMemo(() => status?.assignedCertificationIds ?? [], [status])
  const [picked, setPicked] = useState(null)
  const [search, setSearch] = useState("")
  const selected = new Set(picked ?? saved)
  const dirty = picked != null && (picked.length !== saved.length || picked.some((id) => !saved.includes(id)))

  const all = (Array.isArray(certificationsQuery.data) ? certificationsQuery.data : []).filter(
    (c) => !search.trim() || String(c.title).toLowerCase().includes(search.trim().toLowerCase())
  )

  const save = useMutation({
    mutationFn: () => setArenaCertifications(arena.id, [...selected]),
    onSuccess: (next) => {
      queryClient.setQueryData([CHALLENGE_ARENAS_KEY], (current) =>
        Array.isArray(current) ? current.map((item) => (item.arenaId === arena.id ? next : item)) : current
      )
      setPicked(null)
      toast.success("Certifications saved", {
        description: `${arena.name} now shows on ${next.assignedCertificationIds?.length ?? 0} certification learning path(s).`,
      })
    },
    onError: (error) =>
      toast.error("Could not save", { description: error?.response?.data?.message ?? error?.message ?? "Try again." }),
  })

  const toggle = (id) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setPicked([...next])
  }

  return (
    <div className="space-y-4 rounded-2xl border-2 border-border bg-card p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-sm font-bold text-foreground">Shown on these certifications</h2>
          <p className="text-xs text-muted-foreground">
            Learners enrolled in a ticked certification see {arena.name} as a challenge icon on the left of their learning
            path.{status?.live === false ? " It is paused, so nobody sees it until it goes live again." : ""}
            {status?.certificationId != null && !selected.has(status.certificationId)
              ? " The certification its problems are filed under is not ticked yet."
              : ""}
          </p>
        </div>
        <Button onClick={() => save.mutate()} disabled={!dirty || save.isPending} className="shrink-0">
          {save.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
          Save certifications
        </Button>
      </div>

      <div className="relative sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find a certification" className="pl-9" />
      </div>

      {certificationsQuery.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading certifications…
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {all.map((c) => {
            const on = selected.has(c.certificationId)
            return (
              <button
                key={c.certificationId}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggle(c.certificationId)}
                className={cn(
                  "flex min-h-[44px] items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                  on ? "border-primary/50 bg-primary/5" : "border-border/70 hover:bg-muted/50"
                )}
              >
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-md border",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
                  )}
                >
                  {on ? <Check className="size-3.5" aria-hidden="true" /> : null}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">{c.title}</span>
                {status?.certificationId === c.certificationId ? (
                  <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    Problems filed here
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">{selected.size} selected</p>
    </div>
  )
}
