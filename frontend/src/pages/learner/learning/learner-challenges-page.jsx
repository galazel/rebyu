import React, { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate, useOutletContext } from "react-router-dom"
import {
  Activity,
  ChevronRight,
  Code2,
  Crown,
  Lock,
  Medal,
  Network,
  Trophy,
} from "@/components/icons"
import { toast } from "sonner"

import { TactileButton } from "@/components/rebyu/rebyu-ui.jsx"
import {
  CHALLENGE_ARENAS_KEY,
  getChallengeArenas,
  getChallengeLeaderboard,
  getMyChallengeRecord,
} from "@/services/challengeService.js"
import ProBadge from "@/components/learner/pro-badge.jsx"
import { useLearnerEntitlements } from "@/hooks/use-learner-entitlements.js"
import { XpRankingsPanel } from "@/components/learner/xp-rankings-panel.jsx"
import { FREE_ARENA_PROBLEM_LIMIT } from "@/services/subscriptionService.js"
import { getWorldCupTracks } from "@/lib/arenas.js"
import { getMyRewards } from "@/services/learnerService.js"



const CHALLENGES = [
  {
    id: "codestrike",
    title: "CodeStrike",
    role: "Coding skills",
    format: "Coding problems · unit tests",
    description:
      "Ten stages of coding problems, judged against real unit tests and scored on time complexity.",
    icon: Code2,
    route: "/learner/challenges/codestrike",
  },
  {
    id: "blueprint",
    title: "Blueprint Arena",
    role: "Design skills",
    format: "UML & system design",
    description:
      "Ten stages of UML and system design on a drag-and-drop canvas, checked against structural rules.",
    icon: Network,
    route: "/learner/challenges/blueprint-arena",
  },
  {
    id: "worldcup",
    title: "Champions Cup",
    role: "Exam readiness",
    format: "8-player bracket",
    description:
      "An eight-player bracket on one of your certification tracks — quarterfinals, semis, and a timed final.",
    icon: Trophy,
    route: "/learner/challenges/world-cup",
    needsEnrollment: true,
  },
]


function formatSessionDate(value) {
  if (!value) return "Date unavailable"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Date unavailable"
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

const INK = "text-[#2c3a33]"
const INK_SOFT = "text-[#6b706c]"

export default function LearnerChallengesPage() {
  const navigate = useNavigate()
  const outletContext = useOutletContext()
  const learnerId = outletContext?.data?.learnerId ?? null
  const { isFree } = useLearnerEntitlements()

  const arenaQuery = useQuery({
    queryKey: [CHALLENGE_ARENAS_KEY],
    queryFn: getChallengeArenas,
    staleTime: 60_000,
  })

  const disabledTrackIds = (arenaQuery.data ?? []).find((arena) => arena.arenaId === "worldcup")
    ?.disabledTrackIds
  const worldCupTracks = useMemo(
    () => getWorldCupTracks(outletContext?.data?.enrolledCertifications ?? [], disabledTrackIds),
    [outletContext?.data?.enrolledCertifications, disabledTrackIds],
  )

  const configuredArenas = useMemo(() => {
    const map = new Map()
    for (const arena of arenaQuery.data ?? []) {
      map.set(arena.arenaId, arena)
    }
    return map
  }, [arenaQuery.data])

  const rewardsQuery = useQuery({
    queryKey: ["learner-rewards"],
    queryFn: getMyRewards,
    staleTime: 60_000,
  })
  const myXp = Number(rewardsQuery.data?.totalXp ?? 0)

  const challenges = useMemo(
    () =>
      CHALLENGES.map((challenge) => {
        const arena = configuredArenas.get(challenge.id)
        const configured = Boolean(arena?.configured)

        const known = arenaQuery.isSuccess
        const ready = !known || configured

        const enrolled = !challenge.needsEnrollment || worldCupTracks.length > 0

        const proLocked = isFree && challenge.id === "worldcup"
        const freeCapped = isFree && challenge.id !== "worldcup"

        const entryXp = Number(arena?.settings?.entryXp ?? 0)
        const xpShortfall = known && entryXp > 0 ? Math.max(0, entryXp - myXp) : 0

        return {
          ...challenge,
          ...(challenge.needsEnrollment ? { tracks: worldCupTracks } : null),
          problemCount: arena?.problemCount ?? 0,
          unconfigured: known && !configured,
          paused: known && arena?.live === false,
          proLocked,
          freeCapped,
          entryXp,
          xpShortfall,
          available: ready && enrolled && !proLocked && xpShortfall === 0,
        }
      }),
    [worldCupTracks, configuredArenas, arenaQuery.isSuccess, isFree, myXp],
  )

  const leaderboardQuery = useQuery({
    queryKey: ["challenge-leaderboard"],
    queryFn: () => getChallengeLeaderboard(10),
    staleTime: 60_000,
  })

  const recordQuery = useQuery({
    queryKey: ["challenge-record", learnerId],
    queryFn: getMyChallengeRecord,
    enabled: learnerId != null,
    staleTime: 60_000,
  })

  const leaderboard = Array.isArray(leaderboardQuery.data) ? leaderboardQuery.data : []
  const record = recordQuery.data ?? null
  const recentSessions = Array.isArray(record?.recent) ? record.recent : []

  const startChallenge = (challenge) => {
    if (challenge.proLocked) {
      navigate("/learner/subscription")
      return
    }
    if (challenge.available) {
      navigate(challenge.route)
      return
    }
    if (challenge.xpShortfall > 0) {
      toast.info(`${challenge.title} opens at ${challenge.entryXp.toLocaleString()} XP`, {
        description: `You have ${myXp.toLocaleString()} XP — earn ${challenge.xpShortfall.toLocaleString()} more from lessons, practice and assessments to unlock this arena.`,
      })
      return
    }
    if (challenge.unconfigured) {
      toast.info(`${challenge.title} is ${challenge.paused ? "closed for now" : "not ready yet"}`, {
        description: challenge.paused
          ? "An admin has paused this arena. Check back later."
          : "This arena has no problems set up yet. It unlocks as soon as an admin adds them.",
      })
      return
    }
    toast.info("Enrol in a certification first", {
      description:
        "The Champions Cup bracket runs on one certification's question bank. Enrol in a certification to unlock it.",
    })
  }

  const statusLabel = (challenge) =>
    challenge.proLocked
      ? "pro"
      : challenge.available
        ? challenge.freeCapped
          ? `free · ${FREE_ARENA_PROBLEM_LIMIT} problems`
          : "ready"
        : challenge.xpShortfall > 0
          ? `${challenge.entryXp.toLocaleString()} xp to enter`
          : challenge.unconfigured
            ? "not open yet"
            : "enrol to unlock"

  return (
    <>
      <div className="mx-auto w-full max-w-6xl space-y-8 pb-10 sm:space-y-10">
        <header className="rb-chalkboard px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="rb-chalk-label">it olympics</p>
              <h1 className="rb-chalk mt-3 text-4xl leading-none sm:text-5xl">pick your arena</h1>
              <p className="rb-chalk-body mt-2 max-w-md text-sm leading-6">
                Three arenas, one board. Coding, design, and a bracket against seven others on
                your own track.
              </p>
            </div>
            <dl className="grid shrink-0 grid-cols-4 gap-x-5 gap-y-1 border-t border-white/20 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              {[
                ["rank", record?.rank ? `#${record.rank}` : "\u2014"],
                ["points", (record?.points ?? 0).toLocaleString()],
                ["streak", `${record?.streakDays ?? 0}d`],
                ["best", (record?.bestScore ?? 0).toLocaleString()],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="rb-chalk-body text-[11px] uppercase tracking-[0.14em] opacity-80">{label}</dt>
                  <dd className="rb-chalk truncate text-2xl sm:text-3xl">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </header>

        <section aria-label="Arenas" className="grid gap-5 md:grid-cols-3">
            {arenaQuery.isLoading ? [1, 2, 3].map(i => (
              <div key={i} className="flex animate-pulse flex-col rounded-2xl border-2 border-rb-swan bg-white p-5 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="size-14 rounded-2xl bg-rb-polar" />
                  <div className="h-6 w-24 rounded-full bg-rb-polar" />
                </div>
                <div className="mt-5 space-y-2">
                  <div className="h-3 w-20 rounded bg-rb-polar" />
                  <div className="h-7 w-40 rounded bg-rb-polar" />
                  <div className="h-4 w-full rounded bg-rb-polar" />
                  <div className="h-4 w-3/4 rounded bg-rb-polar" />
                </div>
                <div className="mt-3 h-4 w-32 rounded bg-rb-polar" />
                <div className="mt-auto pt-5">
                  <div className="h-11 w-full rounded-xl bg-rb-polar" />
                </div>
              </div>
            )) : challenges.map((challenge) => {
              const Icon = challenge.icon
              const open = challenge.available
              return (
                <article
                  key={challenge.id}
                  className={`group flex min-w-0 flex-col rounded-2xl border-2 bg-white p-5 transition-[transform,box-shadow] duration-200 sm:p-6 ${
                    open
                      ? "border-rb-swan hover:-translate-y-0.5 hover:border-rb-feather hover:shadow-[0_18px_40px_-18px_rgba(18,49,38,0.35)]"
                      : "border-dashed border-rb-swan"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`grid size-14 shrink-0 place-items-center rounded-2xl ${
                        open ? "bg-rb-feather-wash text-rb-feather-ink" : "bg-rb-polar text-rb-wolf"
                      }`}
                    >
                      <Icon className="size-7" aria-hidden="true" />
                    </span>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        open
                          ? "border-rb-leaf/40 bg-rb-leaf-wash text-rb-leaf-lip"
                          : "border-rb-swan bg-rb-polar text-rb-wolf"
                      }`}
                    >
                      {!open ? <Lock className="size-2.5" aria-hidden="true" /> : null}
                      {statusLabel(challenge)}
                    </span>
                  </div>

                  <p className="mt-5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-rb-wolf">
                    {challenge.role}
                  </p>
                  <h2 className="mt-1 font-rb-display text-2xl font-extrabold leading-tight text-rb-eel">
                    {challenge.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-rb-wolf">{challenge.description}</p>

                  <p className="mt-4 text-xs text-rb-wolf">
                    <span className="font-semibold text-rb-eel">{challenge.format}</span>
                    {challenge.problemCount ? (
                      <>
                        {" \u00b7 "}
                        {challenge.freeCapped
                          ? `${Math.min(FREE_ARENA_PROBLEM_LIMIT, challenge.problemCount)} of ${challenge.problemCount} on free`
                          : `${challenge.problemCount} problem${challenge.problemCount === 1 ? "" : "s"}`}
                      </>
                    ) : null}
                  </p>

                  {challenge.tracks ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {challenge.tracks.length > 0 ? (
                        challenge.tracks.map((track) => (
                          <span
                            key={track.id}
                            className="max-w-full truncate rounded-full bg-rb-polar px-2.5 py-0.5 text-xs font-semibold text-rb-eel"
                          >
                            {track.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-rb-wolf">No certification enrolled yet</span>
                      )}
                    </div>
                  ) : null}

                  {challenge.xpShortfall > 0 ? (
                    <div className="mt-3 rounded-xl bg-rb-bee-wash px-3 py-2">
                      <p className="text-xs font-bold text-rb-eel">
                        Opens at {challenge.entryXp.toLocaleString()} XP
                      </p>
                      <p className="mt-0.5 text-xs text-rb-wolf">
                        You have {myXp.toLocaleString()} — {challenge.xpShortfall.toLocaleString()} to go
                      </p>
                      <div
                        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/70"
                        role="progressbar"
                        aria-valuenow={Math.min(100, Math.round((myXp / challenge.entryXp) * 100))}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${challenge.title} entry progress`}
                      >
                        <div
                          className="h-full rounded-full bg-rb-bee-ink"
                          style={{ width: `${Math.min(100, (myXp / challenge.entryXp) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-auto pt-5">
                    <TactileButton
                      variant={open || challenge.proLocked ? "feather" : "ghost"}
                      className="w-full"
                      onClick={() => startChallenge(challenge)}
                    >
                      {challenge.proLocked ? <ProBadge /> : null}
                      {challenge.proLocked
                        ? "upgrade to pro"
                        : open
                          ? "start challenge"
                          : challenge.xpShortfall > 0
                            ? "keep earning xp"
                            : "how to unlock"}
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </TactileButton>
                  </div>
                </article>
              )
            })}
          </section>

        <section className="grid gap-6 pt-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
          <div className="rb-graded-sheet min-w-0 p-5 sm:p-6">
            <div className="flex items-end justify-between gap-3 border-b border-[#d9e1e6] pb-3">
              <div className="min-w-0">
                <p className={`rb-graded-heading flex items-center gap-2 !text-2xl ${INK}`}>
                  <Crown className="size-5 shrink-0 text-[#c97a1e]" aria-hidden="true" />
                  class leaderboard
                </p>
                <p className={`mt-0.5 text-xs ${INK_SOFT}`}>Ranked by points from finished challenges.</p>
              </div>
              <span className={`shrink-0 text-xs font-bold ${INK_SOFT}`}>{leaderboard.length} ranked</span>
            </div>

            {leaderboardQuery.isLoading ? (
              <p className={`py-10 text-center text-sm ${INK_SOFT}`}>Loading the board…</p>
            ) : leaderboard.length === 0 ? (
              <div className="py-10 text-center">
                <Crown className="mx-auto size-7 text-[#c97a1e]" aria-hidden="true" />
                <p className={`mt-2 font-rb-display text-lg ${INK}`}>Nobody is on the board yet</p>
                <p className={`mt-1 text-sm ${INK_SOFT}`}>Finish a challenge and you take first place.</p>
              </div>
            ) : (
              <ol className="mt-1">
                {leaderboard.map((entry) => (
                  <li
                    key={`${entry.rank}-${entry.name}`}
                    className={`grid grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-3 rounded-md px-1.5 py-2.5 ${
                      entry.you ? "bg-[#e7f2e9]" : ""
                    }`}
                  >
                    <span className={`grid size-8 place-items-center font-rb-display text-lg ${INK_SOFT}`}>
                      {entry.rank <= 3 ? (
                        <Medal
                          className={`size-5 ${
                            entry.rank === 1 ? "text-[#d99a1e]" : entry.rank === 2 ? "text-[#8f9793]" : "text-[#b0703a]"
                          }`}
                          aria-label={`Rank ${entry.rank}`}
                        />
                      ) : (
                        entry.rank
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className={`block truncate text-sm font-bold ${INK}`}>
                        {entry.name}
                        {entry.you ? " (you)" : ""}
                      </span>
                      <span className={`block text-xs ${INK_SOFT}`}>
                        {entry.completed} finished · best {entry.bestScore.toLocaleString()}
                      </span>
                    </span>
                    <span className="font-rb-display text-lg tabular-nums text-[#2f7d55]">
                      {entry.points.toLocaleString()}
                      <span className={`ml-1 text-xs ${INK_SOFT}`}>pts</span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="rb-graded-sheet min-w-0 p-5 sm:p-6">
            <p className={`rb-graded-heading flex items-center gap-2 !text-2xl ${INK}`}>
              <Activity className="size-5 shrink-0 text-[#2f7d55]" aria-hidden="true" />
              recent runs
            </p>
            <p className={`mt-0.5 text-xs ${INK_SOFT}`}>Your last few challenges, newest first.</p>
            {recentSessions.length === 0 ? (
              <p className={`mt-2 text-sm leading-6 ${INK_SOFT}`}>Your finished challenges will appear here.</p>
            ) : (
              <ul className="mt-1">
                {recentSessions.slice(0, 6).map((session) => (
                  <li key={session.challengeSessionId} className="flex items-center justify-between gap-3 py-2">
                    <span className="min-w-0">
                      <span className={`block truncate text-sm font-bold ${INK}`}>{session.mode ?? "Challenge"}</span>
                      <span className={`block text-xs ${INK_SOFT}`}>
                        {formatSessionDate(session.startedAt)} · {String(session.status ?? "").replace("_", " ").toLowerCase()}
                      </span>
                    </span>
                    <span className={`shrink-0 font-rb-display text-base tabular-nums ${INK}`}>
                      {session.score == null ? "—" : Number(session.score).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="rb-graded-sheet rb-paper-ink p-5 sm:p-6">
          <XpRankingsPanel />
        </section>
      </div>
    </>
  )
}
