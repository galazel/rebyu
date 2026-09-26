import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Save } from "@/components/icons"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ArenaProblemBuilder from "@/components/challenges/arena-problem-builder.jsx"
import WorldCupEditions from "@/components/challenges/world-cup-editions.jsx"
import { getArena } from "@/lib/arenas.js"
import {
  CHALLENGE_ARENAS_KEY,
  getChallengeArenas,
  saveArenaSettings,
} from "@/services/challengeService.js"

/** CodeStrike's scoring weights, which must total 100. */
const WEIGHT_KEYS = ["weightCorrect", "weightSpeed", "weightBigO"]

/**
 * One arena's workspace: its settings and its problems, and nothing else.
 *
 * Split out of the arena overview because three question builders on one screen
 * is three screens of editors stacked in a column -- you scrolled past
 * CodeStrike's test-case tables to reach Blueprint's canvas. Authoring is
 * per-arena work, so it gets a per-arena page.
 *
 * Settings are the server's: the status carries the saved values (defaults
 * filled in), and "Save configuration" writes them back. The time limit set
 * here is what a learner's run is actually timed by -- the server writes it
 * through to the arena's exam.
 */
export default function ArenaDetailPage() {
  const { arenaId } = useParams()
  const arena = getArena(arenaId)
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

  /* The admin's edits over the saved values, as strings so a field can be
     cleared while typing. Only keys that were touched are held here. */
  const [edits, setEdits] = useState({})

  const values = Object.fromEntries(
    (arena?.fields ?? []).map((field) => [
      field.key,
      edits[field.key] ?? String(savedSettings?.[field.key] ?? field.value),
    ]),
  )
  const dirty = Object.keys(edits).some(
    (key) => String(savedSettings?.[key] ?? "") !== edits[key],
  )

  const weightTotal = WEIGHT_KEYS.reduce((sum, key) => sum + (Number(values[key]) || 0), 0)
  const hasWeights = WEIGHT_KEYS.every((key) => key in values)

  const saveMutation = useMutation({
    mutationFn: (settings) => saveArenaSettings(arenaId, settings),
    onSuccess: (nextStatus) => {
      queryClient.setQueryData([CHALLENGE_ARENAS_KEY], (current) =>
        Array.isArray(current)
          ? current.map((item) => (item.arenaId === arenaId ? nextStatus : item))
          : current,
      )
      setEdits({})
      toast.success("Configuration saved", {
        description: `${arena.name} runs with these settings from the next attempt.`,
      })
    },
    onError: (error) => {
      toast.error("Could not save the configuration", {
        description: error?.response?.data?.message ?? error?.message ?? "Try again.",
      })
    },
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

  if (!arena) {
    return (
      <div className="rebyu-page">
        <div className="rounded-2xl border-2 border-border bg-card p-10 text-center">
          <h1 className="text-lg font-bold">Arena not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            No arena is registered under &ldquo;{arenaId}&rdquo;.
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link to="/admin/challenges">Back to challenges</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rebyu-page">
      <div className="rebyu-page-header">
        <div className="flex items-start gap-3">

          <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${arena.tone}`}>
            <arena.icon className="size-6" aria-hidden="true" />
          </span>

          <div className="min-w-0">
            <h1 className="font-rb-display text-2xl font-extrabold lowercase">
              {arena.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{arena.format}</Badge>
              {arena.tracked ? <Badge variant="outline">Track-locked</Badge> : null}
              {status ? (
                <Badge variant={status.configured ? "default" : "outline"}>
                  {status.configured
                    ? `Live · ${status.problemCount} question${status.problemCount === 1 ? "" : "s"}`
                    : status.live === false
                      ? "Paused"
                      : "Not live yet"}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        {/* Saves the Settings tab. Problems have their own save, because
            writing them means writing questions to the bank. */}
        <Button
          onClick={saveConfiguration}
          disabled={!dirty || saveMutation.isPending || !savedSettings}
        >
          {saveMutation.isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Save className="mr-2 size-4" />
          )}
          {saveMutation.isPending ? "Saving..." : "Save configuration"}
        </Button>
      </div>

      <p className="max-w-2xl text-sm text-muted-foreground">{arena.blurb}</p>

      <Tabs defaultValue="problems" className="w-full">
        <TabsList>
          <TabsTrigger value="problems">Problems</TabsTrigger>
          <TabsTrigger value="settings">
            Settings
            {dirty ? <span className="ml-1.5 size-1.5 rounded-full bg-primary" aria-label="unsaved" /> : null}
          </TabsTrigger>
        </TabsList>

        {/* Problems first: the config is set once, the problem set is the work
            an admin comes back to. */}
        <TabsContent value="problems" className="mt-5">
          {/* A weekly arena is authored a week at a time, not as one standing
              set: everyone sits the same bracket at once, so last week's
              questions are public by the time this week's lobby fills.

              The builder waits for the status: it reloads the saved set into
              the certification the status names. */}
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

        <TabsContent value="settings" className="mt-5">
          <div className="rounded-2xl border-2 border-border bg-card p-5">
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {arena.fields.map((field) => (
                <div key={field.key}>
                  <Label htmlFor={`${arena.id}-${field.key}`} className="text-sm font-bold">
                    {field.label}
                  </Label>
                  <Input
                    id={`${arena.id}-${field.key}`}
                    value={values[field.key]}
                    onChange={(event) =>
                      setEdits((current) => ({ ...current, [field.key]: event.target.value }))
                    }
                    inputMode="numeric"
                    disabled={!savedSettings}
                    className="mt-1.5"
                  />
                  {field.hint ? (
                    <p className="mt-1 text-xs text-muted-foreground">{field.hint}</p>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Scoring weights must total 100, so surface the sum rather than
                letting an admin discover it after a broken run. */}
            {hasWeights ? (
              <p
                className={`mt-5 rounded-xl px-3 py-2 text-xs font-semibold ${
                  weightTotal === 100
                    ? "bg-muted text-muted-foreground"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                Weights must total 100%. Currently {weightTotal}%.
              </p>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
