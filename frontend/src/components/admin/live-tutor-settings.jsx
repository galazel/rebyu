import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { apiMessage } from "@/services/base.js"
import { getLiveTutorSettings, updateLiveTutorSettings } from "@/services/aiSettingsService.js"

const inputClass = "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"

export function LiveTutorSettingsCard() {
  const client = useQueryClient()
  const [changes, setChanges] = useState({})
  const query = useQuery({ queryKey: ["live-tutor-settings"], queryFn: getLiveTutorSettings, staleTime: 30_000 })
  const saved = query.data?.settings
  const values = { ...saved, proDailyMessages: query.data?.proLimits?.dailyMessages, proWeeklyMessages: query.data?.proLimits?.weeklyMessages, ...changes }
  const change = (name, value) => setChanges((current) => ({ ...current, [name]: value }))
  const save = useMutation({
    mutationFn: updateLiveTutorSettings,
    onSuccess: () => {
      setChanges({})
      client.invalidateQueries({ queryKey: ["live-tutor-settings"] })
      client.invalidateQueries({ queryKey: ["learner-ai-usage"] })
      client.invalidateQueries({ queryKey: ["subscription-plans"] })
      toast.success("Live Tutor and Pro usage limits saved. Voice/duration changes apply to new sessions.")
    },
    onError: (error) => toast.error(apiMessage(error, "Live Tutor settings could not be saved.")),
  })
  const credits = query.data?.credits
  const voices = query.data?.voices ?? []
  return (
    <section className="rounded-xl border border-border bg-background p-4" aria-label="ElevenLabs Live Tutor settings">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">ElevenLabs · Live Tutor & Pro limits</h2>
          <p className="mt-1 text-xs text-muted-foreground">Provider balance, educational voice and server-enforced usage caps. The API key stays on the server.</p>
        </div>
        <Button variant="outline" size="sm" disabled={query.isFetching || save.isPending} onClick={() => query.refetch()}>Refresh balance</Button>
      </div>
      {query.isLoading ? <p className="mt-4 text-sm" role="status">Loading Live Tutor settings…</p> : query.isError ? (
        <p className="mt-4 text-sm text-destructive" role="alert">{apiMessage(query.error, "Live Tutor settings could not be loaded.")}</p>
      ) : saved ? <>
        {credits?.available ? <>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[["Credits remaining", credits.remaining], ["Used this billing cycle", credits.used], ["Cycle allowance", credits.limit], ["ElevenLabs plan", credits.tier ?? "—"]].map(([label, value]) => (
              <div key={label} className="rounded-lg border p-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-lg font-semibold">{typeof value === "number" ? value.toLocaleString() : value}</dd></div>
            ))}
          </dl>
          <p className="mt-2 text-xs text-muted-foreground">Credits are the provider’s character-based allowance, not a guaranteed number of teaching sessions.{credits.resetsAt ? ` Next reset: ${new Date(credits.resetsAt * 1000).toLocaleString()}.` : ""}</p>
        </> : <p className="mt-4 text-sm text-amber-700" role="status">{credits?.reason ?? "ElevenLabs balance is unavailable."}</p>}
        {query.data.voicesError ? <p className="mt-2 text-sm text-amber-700">{query.data.voicesError} You can still enter an accessible voice ID.</p> : null}
        <form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); save.mutate({ enabled: values.enabled, dailySessionLimit: Number(values.dailySessionLimit), maxDurationSeconds: Number(values.maxDurationSeconds), voiceId: values.voiceId, proDailyMessages: Number(values.proDailyMessages), proWeeklyMessages: Number(values.proWeeklyMessages) }) }}>
          <fieldset disabled={save.isPending} className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={Boolean(values.enabled)} onChange={(event) => change("enabled", event.target.checked)} />Allow new Live Tutor sessions</label>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm font-medium">Live sessions per learner / day<input className={inputClass} type="number" min="1" max="1000" required value={values.dailySessionLimit ?? ""} onChange={(event) => change("dailySessionLimit", event.target.value)} /></label>
              <label className="text-sm font-medium">Maximum session length (minutes)<input className={inputClass} type="number" min="1" max="30" step="1" required value={Number(values.maxDurationSeconds) / 60} onChange={(event) => change("maxDurationSeconds", Number(event.target.value) * 60)} /></label>
              <label className="text-sm font-medium">Teaching voice<select className={inputClass} value={values.voiceId ?? ""} onChange={(event) => change("voiceId", event.target.value)}>
                {!voices.some((voice) => voice.id === values.voiceId) ? <option value={values.voiceId}>{values.voiceId} (current/custom)</option> : null}
                {voices.map((voice) => <option key={voice.id} value={voice.id}>{voice.name}{voice.category ? ` · ${voice.category}` : ""}</option>)}
              </select></label>
              <label className="text-sm font-medium">Voice ID<input className={inputClass} required pattern="[A-Za-z0-9_-]{1,100}" value={values.voiceId ?? ""} onChange={(event) => change("voiceId", event.target.value)} /></label>
              <label className="text-sm font-medium">Pro tutor messages / day<input className={inputClass} type="number" min="1" max="100000" required value={values.proDailyMessages ?? ""} onChange={(event) => change("proDailyMessages", event.target.value)} /></label>
              <label className="text-sm font-medium">Pro tutor messages / week<input className={inputClass} type="number" min="1" max="100000" required value={values.proWeeklyMessages ?? ""} onChange={(event) => change("proWeeklyMessages", event.target.value)} /></label>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">Live sessions default to 5 per day for Pro and eligible institutional learners. Each newly authorized voice or text connection counts once, including reopening or reconnecting; pausing/resuming the same connection does not. Failed provider authorization is not charged. The daily allowance resets at midnight UTC+8. Message limits update the personal Pro plan. Existing sessions keep their current voice and duration.</p>
            {saved.updatedAt ? <p className="text-xs text-muted-foreground">Last saved {new Date(saved.updatedAt).toLocaleString()}{saved.updatedBy ? ` by ${saved.updatedBy}` : ""}.</p> : null}
            <Button type="submit" disabled={save.isPending || !Object.keys(changes).length}>{save.isPending ? "Saving…" : "Save Live Tutor & Pro limits"}</Button>
          </fieldset>
        </form>
      </> : null}
    </section>
  )
}
