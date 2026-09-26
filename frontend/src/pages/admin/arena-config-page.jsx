import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronRight, Loader2 } from "@/components/icons"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ARENAS } from "@/lib/arenas.js"
import { getAllCertifications } from "@/services/certificationService.js"
import {
  CHALLENGE_ARENAS_KEY,
  getChallengeArenas,
  setArenaLive,
  setWorldCupDisabledTracks,
} from "@/services/challengeService.js"

/**
 * IT Olympics overview (admin).
 *
 * A directory, not a workspace: which arenas are live, which tracks players can
 * queue into, and a way into each arena. The settings and the problem builder
 * live on the arena's own page — three builders stacked here meant scrolling
 * past CodeStrike's test cases to reach Blueprint's canvas.
 *
 * Both switches save as they are flipped. A paused arena keeps its problems but
 * locks for learners (and refuses new attempts server-side); a track switched
 * off drops out of every learner's World Cup track picker.
 */
export default function ArenaConfigPage() {
  const queryClient = useQueryClient()

  const statusQuery = useQuery({
    queryKey: [CHALLENGE_ARENAS_KEY],
    queryFn: getChallengeArenas,
  })
  const statusById = new Map((statusQuery.data ?? []).map((row) => [row.arenaId, row]))
  const disabledTracks = new Set(
    (statusById.get("worldcup")?.disabledTrackIds ?? []).map(String),
  )

  /* The tracks are the real certifications: a World Cup lobby is drawn from a
     certification's bank, so there is nothing else a track could be. */
  const certificationsQuery = useQuery({
    queryKey: ["admin-certifications", "arena-tracks"],
    queryFn: () => getAllCertifications(),
    staleTime: 5 * 60 * 1000,
  })
  const certifications = certificationsQuery.data ?? []

  /** Puts a fresh status for one arena into the shared list. */
  function applyStatus(nextStatus) {
    queryClient.setQueryData([CHALLENGE_ARENAS_KEY], (current) =>
      Array.isArray(current)
        ? current.map((row) => (row.arenaId === nextStatus.arenaId ? nextStatus : row))
        : current,
    )
  }

  const liveMutation = useMutation({
    mutationFn: ({ arenaId, live }) => setArenaLive(arenaId, live),
    onSuccess: (nextStatus, { live }) => {
      applyStatus(nextStatus)
      const name = ARENAS.find((arena) => arena.id === nextStatus.arenaId)?.name ?? "Arena"
      toast.success(live ? `${name} is open` : `${name} is paused`, {
        description: live
          ? nextStatus.problemCount > 0
            ? "Learners can enter it now."
            : "It has no problems yet, so learners still see it locked."
          : "Learners see it locked. Its problems are kept.",
      })
    },
    onError: (error) =>
      toast.error("Could not change the arena", {
        description: error?.response?.data?.message ?? error?.message ?? "Try again.",
      }),
  })

  const tracksMutation = useMutation({
    mutationFn: setWorldCupDisabledTracks,
    onSuccess: applyStatus,
    onError: (error) =>
      toast.error("Could not change the track", {
        description: error?.response?.data?.message ?? error?.message ?? "Try again.",
      }),
  })

  function toggleTrack(certificationId, enabled) {
    const next = new Set(disabledTracks)
    if (enabled) next.delete(String(certificationId))
    else next.add(String(certificationId))
    tracksMutation.mutate([...next].map(Number))
  }

  const loading = statusQuery.isLoading

  return (
    <div className="rebyu-page">
      <div className="rebyu-page-header">
        <div>
          <h1 className="font-rb-display text-2xl font-extrabold lowercase">it olympics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Open an arena to author its problems and set how a run is scored.
          </p>
        </div>
      </div>

      {statusQuery.isError ? (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          The arenas could not be loaded, so the switches below are disabled.
        </p>
      ) : null}

      {/* Track availability gates World Cup matchmaking — a track with too few
          players queued will never fill a lobby, so it stays admin-controlled. */}
      <section className="rebyu-section">
        <div className="rounded-2xl border-2 border-border bg-card p-5">
          <h2 className="text-base font-bold">Certification tracks</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Disabled tracks are hidden from the World Cup track-selection screen.
          </p>

          {certificationsQuery.isLoading || loading ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Loading tracks...
            </div>
          ) : certifications.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No certifications yet.</p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {certifications.map((certification) => {
                const id = certification.certificationId ?? certification.id
                return (
                  <label
                    key={id}
                    className="flex items-center justify-between gap-3 rounded-xl border-2 border-border bg-background px-4 py-3"
                  >
                    <span className="text-sm font-bold">{certification.title}</span>
                    <Switch
                      checked={!disabledTracks.has(String(id))}
                      disabled={tracksMutation.isPending || !statusQuery.isSuccess}
                      onCheckedChange={(next) => toggleTrack(id, next)}
                    />
                  </label>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section className="rebyu-section">
        <div className="grid gap-4 xl:grid-cols-3">
          {ARENAS.map((arena) => {
            const status = statusById.get(arena.id)
            const pending =
              liveMutation.isPending && liveMutation.variables?.arenaId === arena.id

            return (
              <div
                key={arena.id}
                className="flex flex-col rounded-2xl border-2 border-border bg-card p-5"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`grid size-12 shrink-0 place-items-center rounded-2xl ${arena.tone}`}
                  >
                    <arena.icon className="size-6" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-rb-display text-lg font-extrabold">{arena.name}</h2>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge variant="secondary">{arena.format}</Badge>
                      {status ? (
                        <Badge variant="outline">
                          {!status.live
                            ? "Paused"
                            : status.problemCount > 0
                              ? "Open"
                              : "No problems yet"}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  {/* The switch is the one thing you'd change without opening the
                      arena, so it stays on the card. */}
                  <Switch
                    checked={Boolean(status?.live)}
                    disabled={!status || pending}
                    onCheckedChange={(next) => liveMutation.mutate({ arenaId: arena.id, live: next })}
                    aria-label={`${arena.name} live`}
                  />
                </div>

                <p className="mt-4 text-sm leading-6 text-muted-foreground">{arena.blurb}</p>

                <Link
                  to={`/admin/arenas/${arena.id}`}
                  className="mt-5 flex items-center justify-between gap-2 rounded-xl border-2 border-border px-4 py-3 text-sm font-bold transition hover:border-primary/45 hover:bg-accent/40"
                >
                  Problems and settings
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
