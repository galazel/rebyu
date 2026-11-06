import { useQuery } from "@tanstack/react-query"
import { motion, useReducedMotion } from "framer-motion"

import { Crown, Loader2, Trophy } from "@/components/icons"
import { Plinth } from "@/components/challenges/arena-lobby.jsx"
import { getChallengeLeaderboard } from "@/services/challengeService.js"
import { cn } from "@/lib/utils"

/*
 * A challenge's ranking: the top three on podium plinths (second, first, third, the
 * first one tallest), everyone after them in a list. Drawn in the learning path's
 * plinth style. Points are the sum of the scores a learner handed in on this challenge.
 */

const PODIUM = {
  1: {
    top: "color-mix(in oklab, #f5b72f 80%, white)",
    face: "#f5b72f",
    lip: "#c98a12",
    depth: 76,
    ring: "ring-[#f5b72f]",
    chip: "bg-[#fdf0cf] text-[#8a5b00]",
  },
  2: {
    top: "var(--color-rb-snow)",
    face: "color-mix(in oklab, var(--color-rb-swan) 70%, var(--color-rb-hare))",
    lip: "var(--color-rb-hare)",
    depth: 52,
    ring: "ring-rb-hare",
    chip: "bg-rb-polar text-rb-wolf",
  },
  3: {
    top: "color-mix(in oklab, var(--color-rb-fox) 80%, white)",
    face: "var(--color-rb-fox)",
    lip: "var(--color-rb-fox-lip)",
    depth: 34,
    ring: "ring-rb-fox",
    chip: "bg-rb-fox-wash text-rb-fox-lip",
  },
}

const BLOCK_W = 104
const BLOCK_H = 52

function initials(name) {
  const parts = String(name ?? "?").trim().split(/\s+/).filter(Boolean)
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : String(name ?? "?").slice(0, 2)).toUpperCase()
}

export function ArenaPodium({ arenaId, title = "Rankings", limit = 20 }) {
  const reduceMotion = useReducedMotion()
  const query = useQuery({
    queryKey: ["challenge-leaderboard", arenaId ?? "all", limit],
    queryFn: () => getChallengeLeaderboard(limit, arenaId),
    staleTime: 60_000,
  })
  const rows = Array.isArray(query.data) ? query.data : []
  const top = [rows.find((r) => r.rank === 2), rows.find((r) => r.rank === 1), rows.find((r) => r.rank === 3)]
  const rest = rows.filter((r) => r.rank > 3)

  return (
    <section className="mt-12">
      <div className="border-b-2 border-rb-swan pb-2">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-rb-wolf">leaderboard</p>
        <h2 className="font-rb-display text-2xl font-extrabold text-rb-eel">{title}</h2>
      </div>

      {query.isLoading ? (
        <p className="flex items-center justify-center gap-2 py-12 text-sm font-semibold text-rb-wolf">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Loading rankings…
        </p>
      ) : rows.length === 0 ? (
        <div className="mx-auto max-w-sm py-10 text-center">
          <Trophy className="mx-auto size-9 text-rb-hare" aria-hidden="true" />
          <p className="mt-3 font-rb-display text-lg font-extrabold text-rb-eel">No rankings yet</p>
          <p className="mt-1 text-sm text-rb-wolf">Hand in a stage to put your name on the board.</p>
        </div>
      ) : (
        <div className="mx-auto mt-6 max-w-xl">
          {/* Podium: second, first, third */}
          <div className="flex items-end justify-center gap-2 sm:gap-5" role="list" aria-label="Top three">
            {top.map((row, slot) =>
              row ? (
                <PodiumSeat key={row.rank} row={row} index={slot} reduceMotion={reduceMotion} />
              ) : (
                <div key={`empty-${slot}`} style={{ width: BLOCK_W }} aria-hidden="true" />
              )
            )}
          </div>

          {/* Everyone after the podium */}
          {rest.length > 0 ? (
            <ol className="mt-6 space-y-2">
              {rest.map((row, i) => (
                <motion.li
                  key={`${row.rank}-${row.name}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.3 + i * 0.04 }}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border-2 px-3 py-2.5",
                    row.you
                      ? "border-rb-feather/50 bg-rb-feather-wash"
                      : "border-rb-swan bg-rb-snow shadow-[0_2px_0_var(--color-rb-swan)]"
                  )}
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-rb-polar font-rb-display text-sm font-extrabold tabular-nums text-rb-wolf">
                    {row.rank}
                  </span>
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-rb-macaw-wash text-[11px] font-extrabold text-rb-macaw-lip">
                    {initials(row.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-rb-eel">
                      {row.name}
                      {row.you ? <span className="ml-1.5 text-[11px] font-extrabold text-rb-feather-ink">you</span> : null}
                    </span>
                    <span className="block text-[11px] font-semibold text-rb-wolf">
                      {row.completed} run{row.completed === 1 ? "" : "s"} · best {row.bestScore}%
                    </span>
                  </span>
                  <span className="shrink-0 font-rb-display text-base font-extrabold tabular-nums text-rb-eel">
                    {row.points.toLocaleString()}
                    <span className="ml-0.5 text-[11px] font-bold text-rb-wolf">pts</span>
                  </span>
                </motion.li>
              ))}
            </ol>
          ) : null}
        </div>
      )}
    </section>
  )
}

function PodiumSeat({ row, index, reduceMotion }) {
  const style = PODIUM[row.rank] ?? PODIUM[3]
  const first = row.rank === 1
  const height = BLOCK_H + style.depth

  return (
    <motion.div
      role="listitem"
      className="flex flex-col items-center"
      style={{ width: BLOCK_W }}
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 18, delay: [0.15, 0, 0.3][index] }}
    >
      {/* Avatar, with a bobbing crown on first place */}
      <div className="relative mb-2 flex flex-col items-center">
        {first ? (
          <motion.span
            aria-hidden="true"
            className="mb-0.5 text-[#f5b72f] drop-shadow-[0_2px_0_#c98a12]"
            animate={reduceMotion ? undefined : { y: [0, -4, 0], rotate: [0, -6, 6, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Crown className="size-6" />
          </motion.span>
        ) : null}
        <span
          className={cn(
            "grid place-items-center rounded-full bg-rb-snow font-rb-display font-extrabold text-rb-eel ring-4",
            style.ring,
            first ? "size-16 text-xl" : "size-12 text-base",
            row.you && "outline outline-2 outline-offset-2 outline-rb-feather"
          )}
        >
          {initials(row.name)}
        </span>
      </div>

      {/* Podium block with the rank on its front */}
      <div className="relative" style={{ width: BLOCK_W, height }}>
        <Plinth w={BLOCK_W} h={BLOCK_H} d={style.depth} lift={0} top={style.top} face={style.face} lip={style.lip} />
        <span
          className="absolute inset-x-0 grid place-items-center font-rb-display text-3xl font-extrabold text-white drop-shadow-[0_2px_0_rgb(0_0_0/0.18)]"
          style={{ top: BLOCK_H / 2 + 4, height: BLOCK_H / 2 + style.depth - 8 }}
        >
          {row.rank}
        </span>
      </div>

      {/* Name and points */}
      <p className="mt-2 w-full truncate text-center text-sm font-bold text-rb-eel" title={row.name}>
        {row.name}
      </p>
      <span className={cn("mt-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold tabular-nums", style.chip)}>
        {row.points.toLocaleString()} pts
      </span>
      {row.you ? <span className="mt-1 text-[10px] font-extrabold uppercase text-rb-feather-ink">you</span> : null}
    </motion.div>
  )
}

export default ArenaPodium
