import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { apiMessage } from "@/services/base.js"
import { getReadingGuardSettings, updateReadingGuardSettings } from "@/services/aiSettingsService.js"

const inputClass = "mt-1 min-h-11 w-full min-w-0 max-w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm"

export function ReadingGuardSettingsCard() {
  const client = useQueryClient()
  const [minutes, setMinutes] = useState(null)
  const query = useQuery({ queryKey: ["reading-guard-settings"], queryFn: getReadingGuardSettings, staleTime: 30_000 })
  const saved = query.data
  const value = minutes ?? (saved ? saved.skimCooldownSeconds / 60 : "")

  const save = useMutation({
    mutationFn: updateReadingGuardSettings,
    onSuccess: () => {
      setMinutes(null)
      client.invalidateQueries({ queryKey: ["reading-guard-settings"] })
      toast.success("Skim challenge cooldown saved.")
    },
    onError: (error) => toast.error(apiMessage(error, "Skim challenge settings could not be saved.")),
  })
  return (
    <section className="rounded-xl border border-border bg-background p-4" aria-label="Skim challenge settings">
      <h2 className="text-base font-semibold">Lessons · Skim challenge</h2>
      <p className="mt-1 text-xs text-muted-foreground">After a learner gets a skim challenge or a slow-down reminder, it stays quiet for this long across all lessons.</p>
      {query.isLoading ? <p className="mt-4 text-sm" role="status">Loading…</p> : query.isError ? (
        <p className="mt-4 text-sm text-destructive" role="alert">{apiMessage(query.error, "Skim challenge settings could not be loaded.")}</p>
      ) : (
        <form className="mt-4 space-y-4" onSubmit={(event) => { event.preventDefault(); save.mutate({ skimCooldownSeconds: Math.round(Number(value) * 60) }) }}>
          <fieldset disabled={save.isPending} className="min-w-0 max-w-full space-y-4">
            <label className="block max-w-xs text-sm font-medium">Cooldown (minutes)
              <input className={inputClass} type="number" min="0" max="1440" step="0.5" required value={value} onChange={(event) => setMinutes(event.target.value)} />
            </label>
            {saved?.updatedAt ? <p className="text-xs text-muted-foreground">Last saved {new Date(saved.updatedAt).toLocaleString()}{saved.updatedBy ? ` by ${saved.updatedBy}` : ""}.</p> : null}
            <Button type="submit" className="h-auto min-h-11 w-full whitespace-normal sm:w-auto" disabled={save.isPending || minutes === null}>{save.isPending ? "Saving…" : "Save skim cooldown"}</Button>
          </fieldset>
        </form>
      )}
    </section>
  )
}
