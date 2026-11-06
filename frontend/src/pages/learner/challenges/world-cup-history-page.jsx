import { useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { motion, useReducedMotion } from "framer-motion"

import { ArrowLeft, ChevronRight, Crown, HistoryIcon, Loader2, Shield, Trophy } from "@/components/icons"
import { TactileButton } from "@/components/rebyu/rebyu-ui.jsx"
import { PathBackdrop } from "@/components/challenges/arena-lobby.jsx"
import { getWorldCupHistory } from "@/services/challengeService.js"
import { getLearnerPortalData } from "@/services/learnerService.js"
import { cn } from "@/lib/utils"

/*
 * Every Champions Cup the learner has played: a summary strip, a certification
 * filter, and one row per tournament that opens its bracket and results.
 */

const ROUND_LABELS = {
  QUARTERFINAL: "Quarterfinals",
  SEMIFINAL: "Semifinals",
  FINAL: "Final",
  ELIMINATED_QUARTERFINAL: "Quarterfinals",
  ELIMINATED_SEMIFINAL: "Semifinals",
  ELIMINATED_FINAL: "Final",
}
const ROUND_DEPTH = { QUARTERFINAL: 1, SEMIFINAL: 2, FINAL: 3 }

function outcome(h) {
  if (h.won) return { label: "Champion", tone: "bg-rb-fox text-white", icon: Crown }
  if (!h.bestRound) return { label: "Not played", tone: "bg-rb-polar text-rb-wolf", icon: Shield }
  const round = (ROUND_LABELS[h.bestRound] ?? "").toLowerCase()
  return h.bestRound.startsWith("ELIMINATED_")
    ? { label: `Out in ${round}`, tone: "bg-rb-polar text-rb-wolf", icon: Shield }
    : { label: `Won ${round}`, tone: "bg-rb-feather-wash text-rb-feather-ink", icon: Trophy }
}

/** How far a tournament went: 1 quarterfinals … 4 champion. */
function reach(h) {
  if (h.won) return 4
  const round = String(h.bestRound ?? "").replace("ELIMINATED_", "")
  const depth = ROUND_DEPTH[round] ?? 0
  return String(h.bestRound ?? "").startsWith("ELIMINATED_") ? depth : depth + 1
}

export default function WorldCupHistoryPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const [certFilter, setCertFilter] = useState("all")

  const historyQuery = useQuery({ queryKey: ["worldcup-history"], queryFn: getWorldCupHistory, staleTime: 30_000 })
  const portalQuery = useQuery({ queryKey: ["learner-portal-data"], queryFn: getLearnerPortalData, staleTime: 5 * 60_000 })

  const history = useMemo(
    () =>
      (Array.isArray(historyQuery.data) ? historyQuery.data : [])
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [historyQuery.data]
  )
  const certName = useMemo(() => {
    const map = new Map(
      (portalQuery.data?.enrolledCertifications ?? []).map((c) => [String(c.certificationId ?? c.id), c.title])
    )
    return (id) => (id == null ? "Certification" : map.get(String(id)) ?? "Certification")
  }, [portalQuery.data])
  const certIds = [...new Set(history.map((h) => h.certificationId).filter((id) => id != null).map(String))]
  const visible = certFilter === "all" ? history : history.filter((h) => String(h.certificationId) === certFilter)

  const titles = visible.filter((h) => h.won).length
  const bestScore = visible.reduce((max, h) => Math.max(max, Number(h.bestScore) || 0), 0)
  const furthest = visible.reduce((max, h) => Math.max(max, reach(h)), 0)
  const furthestLabel = ["—", "Quarterfinals", "Semifinals", "Final", "Champion"][furthest]

  const goBack = (event) => {
    if (location.key !== "default") {
      event.preventDefault()
      navigate(-1)
    }
  }

  return (
    <div className="rebyu-ds relative isolate min-h-dvh overflow-x-hidden bg-rb-polar">
      <PathBackdrop />
      <div className="mx-auto max-w-4xl px-4 pb-16 pt-5 sm:px-6">
        <TactileButton asChild variant="ghost" size="sm">
          <Link to="/learner/challenges/world-cup" onClick={goBack}>
            <ArrowLeft className="mr-1.5 size-4" aria-hidden="true" />
            back
          </Link>
        </TactileButton>

        <div className="mt-6">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-rb-wolf">champions cup</p>
          <h1 className="mt-1 font-rb-display text-4xl font-extrabold leading-none text-rb-eel sm:text-5xl">
            Your tournaments
          </h1>
          <div className="mt-3 h-[3px] w-24 rounded-full bg-rb-fox" />
        </div>

        {/* Summary */}
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Played", value: visible.length },
            { label: "Cups won", value: titles },
            { label: "Furthest", value: furthestLabel },
            { label: "Best score", value: visible.length ? `${Math.round(bestScore)}%` : "—" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border-2 border-rb-swan bg-rb-snow px-4 py-3 text-center">
              <dt className="text-[11px] font-extrabold uppercase tracking-wide text-rb-wolf">{stat.label}</dt>
              <dd className="mt-1 font-rb-display text-2xl font-extrabold tabular-nums text-rb-eel">{stat.value}</dd>
            </div>
          ))}
        </dl>

        {/* Certification filter */}
        {certIds.length > 1 ? (
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="Filter by certification">
            {[["all", "All"], ...certIds.map((id) => [id, certName(id)])].map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={certFilter === id}
                onClick={() => setCertFilter(id)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                  certFilter === id
                    ? "border-rb-fox bg-rb-fox text-white"
                    : "border-rb-swan bg-rb-snow text-rb-eel hover:bg-rb-polar"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        {/* Tournaments */}
        {historyQuery.isLoading ? (
          <p className="flex items-center justify-center gap-2 py-16 text-sm font-semibold text-rb-wolf">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Loading your tournaments…
          </p>
        ) : visible.length === 0 ? (
          <div className="mx-auto max-w-sm py-16 text-center">
            <HistoryIcon className="mx-auto size-9 text-rb-hare" aria-hidden="true" />
            <p className="mt-3 font-rb-display text-xl font-extrabold text-rb-eel">No tournaments yet</p>
            <p className="mt-1 text-sm text-rb-wolf">Enter this week's Champions Cup and it shows up here.</p>
            <TactileButton asChild variant="fox" size="sm" className="mt-5">
              <Link to="/learner/challenges/world-cup">play this week</Link>
            </TactileButton>
          </div>
        ) : (
          <ol className="mt-6 space-y-3">
            {visible.map((h, i) => {
              const o = outcome(h)
              const steps = reach(h)
              return (
                <motion.li
                  key={h.bracketId}
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                >
                  <Link
                    to={`/learner/challenges/world-cup?bracket=${h.bracketId}`}
                    className={cn(
                      "group flex items-center gap-4 rounded-2xl border-2 bg-rb-snow px-4 py-3 transition hover:-translate-y-0.5",
                      h.won
                        ? "border-rb-fox/50 shadow-[0_3px_0_var(--color-rb-fox-wash)]"
                        : "border-rb-swan shadow-[0_3px_0_var(--color-rb-swan)] hover:border-rb-hare"
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-11 shrink-0 place-items-center rounded-full",
                        h.won ? "bg-rb-fox text-white" : "bg-rb-polar text-rb-wolf"
                      )}
                    >
                      <o.icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-rb-display text-base font-extrabold text-rb-eel">
                          {certName(h.certificationId)}
                        </span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase", o.tone)}>
                          {o.label}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs font-semibold text-rb-wolf">
                        {new Date(h.createdAt).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        · {h.rounds ?? 0} round{h.rounds === 1 ? "" : "s"} played
                      </span>
                      {/* How far it went: quarterfinals, semifinals, final, cup */}
                      <span className="mt-2 flex gap-1" aria-label={`Reached ${["nothing", "quarterfinals", "semifinals", "final", "the cup"][steps]}`}>
                        {[1, 2, 3, 4].map((n) => (
                          <span
                            key={n}
                            className={cn("h-1.5 w-8 rounded-full", n <= steps ? (h.won ? "bg-rb-fox" : "bg-rb-feather") : "bg-rb-swan")}
                          />
                        ))}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-rb-display text-2xl font-extrabold tabular-nums text-rb-eel">
                        {h.bestScore != null ? Math.round(h.bestScore) : "—"}
                        <span className="text-sm text-rb-wolf">%</span>
                      </span>
                      <span className="text-[11px] font-bold text-rb-wolf">best score</span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-rb-hare transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                </motion.li>
              )
            })}
          </ol>
        )}
      </div>
    </div>
  )
}
