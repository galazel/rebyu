import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { showLiveTutor } from "@/lib/live-tutor-visibility.js"
import { apiMessage } from "@/services/base.js"
import { getLiveTutorSettings, updateLiveTutorSettings } from "@/services/aiSettingsService.js"

const inputClass = "mt-1 min-h-11 w-full min-w-0 max-w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm"
const settingsLabel = showLiveTutor ? "Live Tutor & Pro limits" : "Pro AI usage limits"

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
      toast.success(showLiveTutor
        ? "Live Tutor and Pro usage limits saved. Voice/duration changes apply to new sessions."
        : "Pro AI usage limits saved.")
    },
    onError: (error) => toast.error(apiMessage(error, `${settingsLabel} could not be saved.`)),
  })
  const credits = query.data?.credits
  const voices = query.data?.voices ?? []

  function submit(event) {
    event.preventDefault()

    save.mutate({
      enabled: values.enabled,
      maxDurationSeconds: Number(values.maxDurationSeconds),
      voiceId: values.voiceId,
      proDailyMessages: Number(values.proDailyMessages),
      proWeeklyMessages: Number(values.proWeeklyMessages),
    })
  }

  return (
    <section className="rounded-xl border border-border bg-background p-4" aria-label={settingsLabel}>
      <div className="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{showLiveTutor ? "ElevenLabs · " : null}{settingsLabel}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {showLiveTutor
              ? "Provider balance, teaching voice and server-enforced usage caps."
              : "Set the daily and weekly AI allowance for the personal Pro plan."}
          </p>
        </div>
        {showLiveTutor ? <Button variant="outline" size="sm" className="min-h-11 shrink-0" disabled={query.isFetching || save.isPending} onClick={() => query.refetch()}>Refresh balance</Button> : null}
      </div>
      {query.isLoading ? <p className="mt-4 text-sm" role="status">Loading {settingsLabel}…</p> : query.isError ? (
        <p className="mt-4 text-sm text-destructive" role="alert">{apiMessage(query.error, `${settingsLabel} could not be loaded.`)}</p>
      ) : saved ? <>
        {showLiveTutor ? <>
          {credits?.available ? <>
            <dl className="mt-4 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 xl:grid-cols-4">
              {[["Credits remaining", credits.remaining], ["Used this billing cycle", credits.used], ["Cycle allowance", credits.limit], ["ElevenLabs plan", credits.tier ?? "—"]].map(([label, value]) => (
                <div key={label} className="rounded-lg border p-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-lg font-semibold">{typeof value === "number" ? value.toLocaleString() : value}</dd></div>
              ))}
            </dl>
            <p className="mt-2 text-xs text-muted-foreground">Credits are measured in characters.{credits.resetsAt ? ` Next reset ${new Date(credits.resetsAt * 1000).toLocaleString()}.` : ""}</p>
          </> : <p className="mt-4 text-sm text-amber-700" role="status">{credits?.reason ?? "ElevenLabs balance is unavailable."}</p>}
          {query.data.voicesError ? <p className="mt-2 text-sm text-amber-700">{query.data.voicesError} You can still enter an accessible voice ID.</p> : null}
        </> : null}
        <form className="mt-5 space-y-4" onSubmit={submit}>
          <fieldset disabled={save.isPending} className="min-w-0 max-w-full space-y-4">
            {showLiveTutor ? <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={Boolean(values.enabled)} onChange={(event) => change("enabled", event.target.checked)} />Allow new Live Tutor sessions</label> : null}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {showLiveTutor ? <>
                <label className="text-sm font-medium">Maximum session length (minutes)<input className={inputClass} type="number" min="1" max="30" step="1" required value={Number(values.maxDurationSeconds) / 60} onChange={(event) => change("maxDurationSeconds", Number(event.target.value) * 60)} /></label>
                <label className="text-sm font-medium">Teaching voice<select className={inputClass} value={values.voiceId ?? ""} onChange={(event) => change("voiceId", event.target.value)}>
                  {!voices.some((voice) => voice.id === values.voiceId) ? <option value={values.voiceId}>{values.voiceId} (current/custom)</option> : null}
                  {voices.map((voice) => <option key={voice.id} value={voice.id}>{voice.name}{voice.category ? ` · ${voice.category}` : ""}</option>)}
                </select></label>
                <label className="text-sm font-medium">Voice ID<input className={inputClass} required pattern="[A-Za-z0-9_-]{1,100}" value={values.voiceId ?? ""} onChange={(event) => change("voiceId", event.target.value)} /></label>
              </> : null}
              <label className="text-sm font-medium">Shared Pro AI uses / day<input className={inputClass} type="number" min="1" max="100000" required value={values.proDailyMessages ?? ""} onChange={(event) => change("proDailyMessages", event.target.value)} /></label>
              <label className="text-sm font-medium">Shared Pro AI uses / week<input className={inputClass} type="number" min="1" max="100000" required value={values.proWeeklyMessages ?? ""} onChange={(event) => change("proWeeklyMessages", event.target.value)} /></label>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {showLiveTutor
                ? "Chat, guided dialogue and Live Tutor share the plan's AI allowance. Successful responses and provider-verified Live Tutor sessions count once. Pausing and resuming a session keeps the same connection. Existing sessions keep their voice and duration."
                : "Chat and guided dialogue share the plan's AI allowance. Each successful response counts once."}{" "}
              Daily usage resets at midnight UTC+8 and weekly usage on Monday. Eligible institutional learners use their assigned plan limits.
            </p>
            {showLiveTutor && saved.updatedAt ? <p className="text-xs text-muted-foreground">Last saved {new Date(saved.updatedAt).toLocaleString()}{saved.updatedBy ? ` by ${saved.updatedBy}` : ""}.</p> : null}
            <Button type="submit" className="h-auto min-h-11 w-full whitespace-normal sm:w-auto" disabled={save.isPending || !Object.keys(changes).length}>{save.isPending ? "Saving…" : `Save ${settingsLabel}`}</Button>
          </fieldset>
        </form>
      </> : null}
    </section>
  )
}
