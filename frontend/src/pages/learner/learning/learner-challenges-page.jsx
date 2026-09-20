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

/* The three IT Olympics arenas, and only those three.

   The two solo arenas draw from the whole published bank, so there is nothing to
   be enrolled in and nothing to unlock. World Cup is the exception -- see
   `worldCupTracks` below.

   Laid out side by side, all three at once, each with its own way in. The
   swipe carousel before this hid two of the three at any moment and stacked
   the neighbours half under the middle card; a learner picking an arena
   should see the whole choice. */
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
    title: "World Cup",
    role: "Exam readiness",
    format: "8-player bracket",
    description:
      "An eight-player bracket on one of your certification tracks — quarterfinals, semis, and a timed final.",
    icon: Trophy,
    route: "/learner/challenges/world-cup",
    // The bracket is played on one certification's question bank, so it opens
    // only for a learner who is enrolled in at least one.
    needsEnrollment: true,
  },
]

/* No preview data. The board and the record come from endpoints scoped to the
   caller, and empty means empty: a board nobody is on says so, and says that
   finishing a challenge puts you top of it. */

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

/* Paper stays paper in dark mode, so ink on it is literal rather than a token
   that turns light at night. */
const INK = "text-[#2c3a33]"
const INK_SOFT = "text-[#6b706c]"

export default function LearnerChallengesPage() {
  const navigate = useNavigate()
  const outletContext = useOutletContext()
  const learnerId = outletContext?.data?.learnerId ?? null
  const { isFree } = useLearnerEntitlements()

  /* The learner's own tracks. Enrolled in TOPCIT and nothing else? TOPCIT is
     the only track the World Cup can put you in. */
  const worldCupTracks = useMemo(
    () => getWorldCupTracks(outletContext?.data?.enrolledCertifications ?? []),
    [outletContext?.data?.enrolledCertifications],
  )

  /* Which arenas an admin has actually put problems into. An arena with no
     problems is a run that opens onto nothing, and finding that out after
     stepping in is worse than being told up front. */
  const arenaQuery = useQuery({
    queryKey: [CHALLENGE_ARENAS_KEY],
    queryFn: getChallengeArenas,
    staleTime: 60_000,
  })

  const configuredArenas = useMemo(() => {
    const map = new Map()
    for (const arena of arenaQuery.data ?? []) {
      map.set(arena.arenaId, arena)
    }
    return map
  }, [arenaQuery.data])

  /* The industries this learner is actually in, taken from what they are
     enrolled in. A certification carries one; an arena is assigned a set. */
  const learnerIndustries = useMemo(() => {
    const set = new Set()
    for (const certification of outletContext?.data?.enrolledCertifications ?? []) {
      if (certification?.industry) set.add(certification.industry)
    }
    return set
  }, [outletContext?.data?.enrolledCertifications])

  const challenges = useMemo(
    () =>
      CHALLENGES.map((challenge) => {
        const arena = configuredArenas.get(challenge.id)
        const configured = Boolean(arena?.configured)

        /* Unknown is not unconfigured. While the lookup is in flight -- or if it
           failed -- every arena would otherwise read as locked. */
        const known = arenaQuery.isSuccess
        const ready = !known || configured

        const enrolled = !challenge.needsEnrollment || worldCupTracks.length > 0

        /* An arena with no industries assigned is open to everyone. Once an
           admin assigns industries, only learners enrolled in a certification
           from one of them belong there. */
        const restricted = (arena?.industries ?? []).length > 0
        const inIndustry =
          !known ||
          !restricted ||
          (arena.industries ?? []).some((industry) => learnerIndustries.has(industry))

        /* Free: World Cup is Pro, and the solo arenas stop after the first few problems. */
        const proLocked = isFree && challenge.id === "worldcup"
        const freeCapped = isFree && challenge.id !== "worldcup"

        return {
          ...challenge,
          ...(challenge.needsEnrollment ? { tracks: worldCupTracks } : null),
          problemCount: arena?.problemCount ?? 0,
          unconfigured: known && !configured,
          inIndustry,
          proLocked,
          freeCapped,
          available: ready && enrolled && !proLocked,
        }
      }),
    [worldCupTracks, configuredArenas, arenaQuery.isSuccess, learnerIndustries, isFree],
  )

  /* Arenas for someone else's industry are not shown at all, rather than shown
     locked: that padlock never opens for this learner. */
  const visibleChallenges = useMemo(
    () => challenges.filter((challenge) => challenge.inIndustry),
    [challenges],
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
    /* Two reasons an arena can be shut, and they need different answers: one
       is on the learner to fix, the other is not theirs at all. */
    if (challenge.unconfigured) {
      toast.info(`${challenge.title} is not ready yet`, {
        description:
          "This arena has no problems set up yet. It unlocks as soon as an admin adds them.",
      })
      return
    }
    toast.info("Enrol in a certification first", {
      description:
        "The World Cup bracket runs on one certification's question bank. Enrol in a certification to unlock it.",
    })
  }

  const statusLabel = (challenge) =>
    challenge.proLocked
      ? "pro"
      : challenge.available
        ? challenge.freeCapped
          ? `free · ${FREE_ARENA_PROBLEM_LIMIT} problems`
          : "ready"
        : challenge.unconfigured
          ? "not open yet"
          : "enrol to unlock"

  return (
    <>
      <div className="mx-auto w-full max-w-6xl space-y-8 pb-10 sm:space-y-10">
        {/* The board at the front of the room: what this is, and where you
            stand. The record used to sit below the fold on its own sheet;
            up here it is the first thing read, next to the arenas it is
            earned in. */}
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

        {visibleChallenges.length > 0 ? (
          <section aria-label="Arenas" className="grid gap-5 md:grid-cols-3">
            {visibleChallenges.map((challenge) => {
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

                  {/* Your tracks, named here. "Choose your certification track" on
                      the next screen is no help if you cannot tell which are yours. */}
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
                          : "how to unlock"}
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </TactileButton>
                  </div>
                </article>
              )
            })}
          </section>
        ) : (
          <div className="rb-sticky-yellow mx-auto max-w-md p-6 text-center">
            <p className="rb-sticky-title">No arenas for you yet</p>
            <p className="rb-sticky-body mt-2">
              Arenas are opened to particular industries. None currently covers a certification
              you are enrolled in.
            </p>
          </div>
        )}

        <section className="grid gap-6 pt-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
          {/* The class leaderboard, on a sheet of notebook paper. */}
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

          {/* Your own record and last few runs. */}
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

        {/* The XP board: a different standing (XP, not challenge points), so its
            own sheet on the same desk. */}
        <section className="rb-graded-sheet rb-paper-ink p-5 sm:p-6">
          <XpRankingsPanel />
        </section>
      </div>
    </>
  )
}
