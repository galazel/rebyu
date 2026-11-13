import { useState } from "react"
import { Link, Navigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeftIcon, Loader2, Save } from "@/components/icons"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ArenaProblemBuilder from "@/components/challenges/arena-problem-builder.jsx"
import WorldCupEditions from "@/components/challenges/world-cup-editions.jsx"
import ArenaCertifications from "@/components/challenges/arena-certifications.jsx"
import { getArena, isArenaHidden } from "@/lib/arenas.js"
import { cn } from "@/lib/utils"
import {
  CHALLENGE_ARENAS_KEY,
  getChallengeArenas,
  saveArenaSettings,
  setArenaLive,
} from "@/services/challengeService.js"

const WEIGHT_KEYS = ["weightCorrect", "weightSpeed", "weightBigO"]
const WEIGHT_TONES = { weightCorrect: "bg-primary", weightSpeed: "bg-amber-500", weightBigO: "bg-sky-600" }

/* Settings, grouped by what they decide. Keys an arena does not have are skipped. */
const SETTING_GROUPS = [
  { title: "Who can enter", hint: "The bar a learner must clear to start.", keys: ["entryXp"] },
  {
    title: "Pacing",
    hint: "How long a run, a problem or a round may take.",
    keys: ["timeLimit", "timePerProblem", "roundSeconds", "countdown", "queueTimeout"],
  },
  { title: "Path & lobby", hint: "How the challenge is laid out.", keys: ["problems", "lobbySize"] },
  { title: "Scoring", hint: "How a run is marked.", keys: ["pointsPerProblem", ...WEIGHT_KEYS] },
]

function updateStatus(queryClient, arenaId, next) {
  queryClient.setQueryData([CHALLENGE_ARENAS_KEY], (current) =>
    Array.isArray(current) ? current.map((item) => (item.arenaId === arenaId ? next : item)) : current
  )
}

export default function ArenaDetailPage() {
  const { arenaId } = useParams()
  const hidden = isArenaHidden(arenaId)
  const arena = hidden ? null : getArena(arenaId)
  const queryClient = useQueryClient()

  const statusQuery = useQuery({
    queryKey: [CHALLENGE_ARENAS_KEY],
    queryFn: getChallengeArenas,
    enabled: Boolean(arena),
  })
  const status = Array.isArray(statusQuery.data)
    ? statusQuery.data.find((item) => item.arenaId === arenaId) ?? null
    : null
  const savedSettings = status?.settings ?? null

  const [edits, setEdits] = useState({})

  const values = Object.fromEntries(
    (arena?.fields ?? []).map((field) => [field.key, edits[field.key] ?? String(savedSettings?.[field.key] ?? field.value)])
  )
  const dirty = Object.keys(edits).some((key) => String(savedSettings?.[key] ?? "") !== edits[key])

  const weightTotal = WEIGHT_KEYS.reduce((sum, key) => sum + (Number(values[key]) || 0), 0)
  const hasWeights = WEIGHT_KEYS.every((key) => key in values)

  const saveMutation = useMutation({
    mutationFn: (settings) => saveArenaSettings(arenaId, settings),
    onSuccess: (nextStatus) => {
      updateStatus(queryClient, arenaId, nextStatus)
      setEdits({})
      toast.success("Settings saved", { description: `${arena.name} runs with these settings from the next attempt.` })
    },
    onError: (error) =>
      toast.error("Could not save the settings", {
        description: error?.response?.data?.message ?? error?.message ?? "Try again.",
      }),
  })

  const liveMutation = useMutation({
    mutationFn: (live) => setArenaLive(arenaId, live),
    onSuccess: (nextStatus) => {
      updateStatus(queryClient, arenaId, nextStatus)
      toast.success(nextStatus.live ? `${arena.name} is live` : `${arena.name} is paused`, {
        description: nextStatus.live
          ? "Learners can enter it again."
          : "Learners cannot start it, and it is hidden from their learning paths.",
      })
    },
    onError: (error) =>
      toast.error("Could not change it", { description: error?.response?.data?.message ?? error?.message ?? "Try again." }),
  })

  function saveConfiguration() {
    const settings = {}
    for (const field of arena.fields) {
      const raw = values[field.key].trim()
      if (!/^\d+$/.test(raw)) {
        toast.error(`${field.label} must be a whole number`)
        return
      }
      settings[field.key] = Number(raw)
    }
    if (hasWeights && weightTotal !== 100) {
      toast.error("Weights must total 100%", { description: `They add up to ${weightTotal}%.` })
      return
    }
    saveMutation.mutate(settings)
  }

  if (hidden) {
    return <Navigate to="/admin/challenges" replace />
  }

  if (!arena) {
    return (
      <div className="rebyu-page">
        <div className="rounded-2xl border-2 border-border bg-card p-10 text-center">
          <h1 className="text-lg font-bold">Arena not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">No arena is registered under &ldquo;{arenaId}&rdquo;.</p>
          <Button asChild variant="outline" className="mt-5">
            <Link to="/admin/challenges">Back to challenges</Link>
          </Button>
        </div>
      </div>
    )
  }

  const fieldByKey = new Map(arena.fields.map((field) => [field.key, field]))
  const grouped = new Set(SETTING_GROUPS.flatMap((g) => g.keys))
  const groups = [
    ...SETTING_GROUPS.map((g) => ({ ...g, fields: g.keys.map((k) => fieldByKey.get(k)).filter(Boolean) })),
    { title: "Other", hint: null, fields: arena.fields.filter((f) => !grouped.has(f.key)) },
  ].filter((g) => g.fields.length)

  const assignedCount = status?.assignedCertificationIds?.length ?? 0
  // Track-locked arenas (Champions Cup) already run per certification through their
  // editions, so they have no separate certification assignment.
  const assignable = !arena.tracked
  const live = status?.live !== false
  const stateLabel = !status
    ? "Loading…"
    : !live
      ? "Paused"
      : status.configured || arena.weekly
        ? "Live"
        : "Live, but no problems yet"

  const renderField = (field) => (
    <div key={field.key}>
      <Label htmlFor={`${arena.id}-${field.key}`} className="text-sm font-bold">
        {field.label}
      </Label>
      <Input
        id={`${arena.id}-${field.key}`}
        value={values[field.key]}
        onChange={(event) => setEdits((current) => ({ ...current, [field.key]: event.target.value }))}
        inputMode="numeric"
        disabled={!savedSettings}
        className={cn(
          "mt-1.5",
          edits[field.key] != null && edits[field.key] !== String(savedSettings?.[field.key] ?? "") && "border-primary"
        )}
      />
      {field.hint ? <p className="mt-1 text-xs text-muted-foreground">{field.hint}</p> : null}
    </div>
  )

  return (
    <div className="rebyu-page space-y-6">
      <div className="flex w-full justify-start">
        <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 gap-1.5 px-2 text-xs">
          <Link to="/admin/challenges">
            <ArrowLeftIcon className="size-4" />
            All challenges
          </Link>
        </Button>
      </div>

      {/* What it is, whether learners can play it, and the key facts */}
      <header className="space-y-4 rounded-2xl border-2 border-border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${arena.tone}`}>
            <arena.icon className="size-6" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-rb-display text-2xl font-extrabold">{arena.name}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{arena.blurb}</p>
          </div>
          <label className="flex shrink-0 items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 px-3 py-2">
            <span className="sm:text-right">
              <span className="block text-sm font-bold text-foreground">{stateLabel}</span>
              <span className="block text-[11px] text-muted-foreground">{live ? "Learners can enter" : "Hidden from learners"}</span>
            </span>
            <Switch
              checked={live}
              disabled={!status || liveMutation.isPending}
              onCheckedChange={(next) => liveMutation.mutate(next)}
              aria-label={live ? `Pause ${arena.name}` : `Make ${arena.name} live`}
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{arena.format}</Badge>
          {arena.tracked ? <Badge variant="outline">Track-locked</Badge> : null}
          {status && !arena.weekly ? (
            <Badge variant="outline" className="tabular-nums">
              {status.problemCount} question{status.problemCount === 1 ? "" : "s"}
            </Badge>
          ) : null}
          {assignable ? (
            <Badge variant="outline" className="tabular-nums">
              Shown on {assignedCount} certification{assignedCount === 1 ? "" : "s"}
            </Badge>
          ) : null}
          {savedSettings?.entryXp != null ? (
            <Badge variant="outline" className="tabular-nums">
              {Number(savedSettings.entryXp) === 0 ? "Open to everyone" : `${savedSettings.entryXp} XP to enter`}
            </Badge>
          ) : null}
        </div>
      </header>

      <Tabs defaultValue="problems" className="w-full">
        <TabsList className="max-w-full justify-start overflow-x-auto">
          <TabsTrigger value="problems">{arena.weekly ? "Editions" : "Problems"}</TabsTrigger>
          {assignable ? (
            <TabsTrigger value="certifications">
              Certifications
              {assignedCount ? (
                <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 text-[10px] font-bold text-primary">{assignedCount}</span>
              ) : null}
            </TabsTrigger>
          ) : null}
          <TabsTrigger value="settings">
            Settings
            {dirty ? <span className="ml-1.5 size-1.5 rounded-full bg-primary" aria-label="unsaved changes" /> : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="problems" className="mt-5">
          {arena.weekly ? (
            <WorldCupEditions arena={arena} />
          ) : status ? (
            <ArenaProblemBuilder arena={arena} status={status} settings={savedSettings} />
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-2xl border-2 border-border bg-card px-6 py-12 text-sm text-muted-foreground">
              {statusQuery.isError ? (
                "This arena could not be loaded."
              ) : (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Loading...
                </>
              )}
            </div>
          )}
        </TabsContent>

        {assignable ? (
        <TabsContent value="certifications" className="mt-5">
          {status ? (
            <ArenaCertifications arena={arena} status={status} />
          ) : (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
        </TabsContent>
        ) : null}

        <TabsContent value="settings" className="mt-5 space-y-4">
          {groups.map((group) => (
            <section key={group.title} className="space-y-4 rounded-2xl border-2 border-border bg-card p-4 sm:p-5">
              <div>
                <h2 className="text-sm font-bold text-foreground">{group.title}</h2>
                {group.hint ? <p className="text-xs text-muted-foreground">{group.hint}</p> : null}
              </div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{group.fields.map(renderField)}</div>
              {group.title === "Scoring" && hasWeights ? (
                <div className="space-y-1.5">
                  <div className="flex h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                    {WEIGHT_KEYS.map((key) => (
                      <span
                        key={key}
                        className={cn("h-full transition-all", WEIGHT_TONES[key])}
                        style={{ width: `${Math.min(100, Number(values[key]) || 0)}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="flex flex-wrap gap-3 text-muted-foreground">
                      {WEIGHT_KEYS.map((key) => (
                        <span key={key} className="inline-flex items-center gap-1.5">
                          <span className={cn("size-2 rounded-full", WEIGHT_TONES[key])} />
                          {fieldByKey.get(key)?.label.replace("Weight — ", "").replace(" (%)", "")} {Number(values[key]) || 0}%
                        </span>
                      ))}
                    </span>
                    <span className={cn("font-semibold", weightTotal === 100 ? "text-primary" : "text-destructive")}>
                      {weightTotal === 100 ? "Weights total 100%" : `Weights total ${weightTotal}% — they must total 100%`}
                    </span>
                  </div>
                </div>
              ) : null}
            </section>
          ))}

          <div className="sticky bottom-4 z-10 flex flex-col items-stretch gap-2 rounded-2xl border border-border/70 bg-background/95 p-3 shadow-md backdrop-blur sm:flex-row sm:items-center">
            <p className="text-xs text-muted-foreground sm:mr-auto">
              {dirty ? "You have unsaved changes." : "Settings are saved."} They apply from the next attempt.
            </p>
            <Button variant="outline" disabled={!dirty || saveMutation.isPending} onClick={() => setEdits({})}>
              Discard
            </Button>
            <Button onClick={saveConfiguration} disabled={!dirty || saveMutation.isPending || !savedSettings}>
              {saveMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
              {saveMutation.isPending ? "Saving..." : "Save settings"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
