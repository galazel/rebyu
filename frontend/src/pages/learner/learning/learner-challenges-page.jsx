import React, { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate, useOutletContext } from "react-router-dom"
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Code2,
  Crown,
  Lock,
  Medal,
  Network,
  Target,
  Trophy,
} from "@/components/icons"
import { toast } from "sonner"

import { TactileButton } from "@/components/rebyu/rebyu-ui.jsx"
import { Button } from "@/components/ui/button"
import { BubbleCard } from "@/components/commons/bubble-card.jsx"
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

   Laid out the way the landing page shows them: a trophy in the middle and the
   arenas around it as icons with labels, not a swipe carousel of cards. The
   carousel hid two of the three at any moment and, on a phone, clipped the
   neighbours off both edges. Each arena takes a classroom colour -- green,
   sage, orange -- rather than the blue and violet glows the page used to sit on. */
const CHALLENGES = [
  {
    id: "codestrike",
    title: "CodeStrike",
    role: "Coding skills",
    format: "Coding problems · unit tests",
    description:
      "Ten stages of coding problems, judged against real unit tests and scored on time complexity.",
    icon: Code2,
    color: "var(--color-rb-feather)",
    tone: "macaw",
    area: "left",
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
    color: "var(--color-rb-macaw)",
    tone: "beetle",
    area: "right",
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
    color: "var(--color-rb-fox)",
    tone: "fox",
    area: "bottom",
    route: "/learner/challenges/world-cup",
    // The bracket is played on one certification's question bank, so it opens
    // only for a learner who is enrolled in at least one.
    needsEnrollment: true,
  },
]

/* No preview data. The board and the record come from endpoints scoped to the
   caller, and empty means empty: a board nobody is on says so, and says that
   finishing a challenge puts you top of it. */

function relativePosition(index, activeIndex, total) {
  let difference = index - activeIndex
  const midpoint = Math.floor(total / 2)
  if (difference > midpoint) difference -= total
  if (difference < -midpoint) difference += total
  return difference
}

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
  const [activeIndex, setActiveIndex] = useState(0)
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

  // Clamped: filtering can shorten the list under a selection already made.
  const safeIndex = visibleChallenges.length
    ? Math.min(activeIndex, visibleChallenges.length - 1)
    : 0
  const activeChallenge = visibleChallenges[safeIndex] ?? null

  const move = (direction) => {
    if (visibleChallenges.length === 0) return
    setActiveIndex((current) => (current + direction + visibleChallenges.length) % visibleChallenges.length)
  }

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
      <div className="mx-auto w-full max-w-6xl space-y-10 pb-10 sm:space-y-12">
        <header className="text-center">
          <p className="rb-chalk-label mx-auto">it olympics</p>
          <h1 className="mt-4 font-rb-display text-3xl font-extrabold text-rb-eel sm:text-4xl">
            pick your arena
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-rb-wolf">
            Tap an arena to see what it is, then step in.
          </p>
        </header>

        {visibleChallenges.length > 0 ? (
          <section
            className="relative"
            aria-label="Arena carousel"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") move(-1)
              if (event.key === "ArrowRight") move(1)
            }}
          >
            <div className="relative h-[380px] sm:h-[400px]">
              {visibleChallenges.map((challenge, index) => {
                const position = relativePosition(index, safeIndex, visibleChallenges.length)
                const isActive = position === 0
                const Icon = challenge.icon
                return (
                  <BubbleCard
                    key={challenge.id}
                    as="button"
                    type="button"
                    tone={challenge.tone}
                    icon={Icon}
                    title={challenge.title}
                    active={isActive}
                    capHeight="h-40"
                    chips={[
                      { label: challenge.role },
                      { label: challenge.format, side: "right" },
                    ]}
                    onClick={() => (isActive ? startChallenge(challenge) : setActiveIndex(index))}
                    aria-current={isActive ? "true" : undefined}
                    aria-label={`${challenge.title}${isActive ? ", selected" : ", select"}`}
                    className={`absolute left-1/2 top-1/2 h-[350px] w-[250px] transition-all duration-500 ease-out sm:w-[280px] ${
                      isActive
                        ? "shadow-[0_26px_65px_-18px_rgba(18,49,38,0.45)]"
                        : "shadow-[0_22px_55px_-18px_rgba(18,49,38,0.3)]"
                    }`}
                    style={{
                      transform: `translate(calc(-50% + ${position * 200}px), -50%) scale(${isActive ? 1 : Math.abs(position) === 1 ? 0.84 : 0.68})`,
                      zIndex: 10 - Math.abs(position),
                      opacity: Math.abs(position) > 1 ? 0.5 : 1,
                    }}
                    footer={
                      <span
                        className={`inline-flex w-fit items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          challenge.available
                            ? "border-rb-leaf/40 bg-rb-leaf-wash text-rb-leaf-lip"
                            : "border-rb-swan bg-white/70 text-rb-wolf"
                        }`}
                      >
                        {!challenge.available ? <Lock className="size-2.5" aria-hidden="true" /> : null}
                        {statusLabel(challenge)}
                      </span>
                    }
                  >
                    <p className="text-sm leading-6 text-rb-wolf">{challenge.description}</p>
                  </BubbleCard>
                )
              })}
            </div>

            {visibleChallenges.length > 1 ? (
              <div className="mt-2 flex items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Previous arena"
                  onClick={() => move(-1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  {visibleChallenges.map((challenge, index) => (
                    <span
                      key={challenge.id}
                      className={`h-1.5 rounded-full transition-all ${
                        index === safeIndex ? "w-6 bg-rb-feather" : "w-1.5 bg-rb-swan"
                      }`}
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Next arena"
                  onClick={() => move(1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            ) : null}
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

        {/* The chosen arena, written up on the board. */}
        {activeChallenge ? (
          <section
            className="rb-chalkboard mx-auto max-w-3xl px-5 py-6 sm:px-8 sm:py-7"
            aria-live="polite"
            aria-label={`${activeChallenge.title} details`}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="rb-chalk text-sm uppercase tracking-[0.14em] opacity-80">
                  {activeChallenge.role}
                </p>
                <h2 className="rb-chalk mt-1 text-3xl leading-tight sm:text-4xl">
                  {activeChallenge.title}
                </h2>
                <p className="rb-chalk-body mt-2 text-sm leading-6">{activeChallenge.description}</p>

                {/* Your tracks, named here. "Choose your certification track" on
                    the next screen is no help if you cannot tell which are yours. */}
                {activeChallenge.tracks ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {activeChallenge.tracks.length > 0 ? (
                      activeChallenge.tracks.map((track) => (
                        <span
                          key={track.id}
                          className="max-w-full truncate rounded-full border border-white/30 px-2.5 py-0.5 text-xs font-semibold text-white/85"
                        >
                          {track.name}
                        </span>
                      ))
                    ) : (
                      <span className="rb-chalk-body text-xs">No certification enrolled</span>
                    )}
                  </div>
                ) : null}

                <p className="rb-chalk-body mt-3 text-xs">
                  {activeChallenge.proLocked
                    ? "World Cup is part of REBYU Pro. Upgrade to queue for the bracket."
                    : activeChallenge.available && activeChallenge.freeCapped
                    ? `Free plan: the first ${Math.min(FREE_ARENA_PROBLEM_LIMIT, activeChallenge.problemCount || FREE_ARENA_PROBLEM_LIMIT)} of ${activeChallenge.problemCount || "its"} problems. Pro opens every one.`
                    : activeChallenge.available
                    ? activeChallenge.problemCount
                      ? `${activeChallenge.problemCount} problem${activeChallenge.problemCount === 1 ? "" : "s"} waiting.`
                      : "Ready to play."
                    : activeChallenge.unconfigured
                      ? "This arena is not set up yet."
                      : "Enrol in a certification to queue for the World Cup bracket."}
                </p>
              </div>

              <TactileButton
                variant={activeChallenge.available || activeChallenge.proLocked ? "feather" : "ghost"}
                className="w-full shrink-0 sm:w-auto"
                onClick={() => startChallenge(activeChallenge)}
              >
                {activeChallenge.proLocked ? <ProBadge /> : null}
                {activeChallenge.proLocked
                  ? "upgrade to pro"
                  : activeChallenge.available
                    ? "start challenge"
                    : "how to unlock"}
                <ChevronRight className="size-4" aria-hidden="true" />
              </TactileButton>
            </div>
          </section>
        ) : null}

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
              <Target className="size-5 shrink-0 text-[#2f7d55]" aria-hidden="true" />
              your record
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4">
              <div className="rb-grade-tally is-leaf">
                <dt>Rank</dt>
                <dd>{record?.rank ? `#${record.rank}` : "—"}</dd>
              </div>
              <div className="rb-grade-tally is-fox">
                <dt>Points</dt>
                <dd>{(record?.points ?? 0).toLocaleString()}</dd>
              </div>
              <div className="rb-grade-tally is-cardinal">
                <dt>Streak</dt>
                <dd>
                  {record?.streakDays ?? 0}
                  <span className="rb-grade-tally-caption ml-1">{record?.streakDays === 1 ? "day" : "days"}</span>
                </dd>
              </div>
              <div className="rb-grade-tally">
                <dt>Best</dt>
                <dd>{(record?.bestScore ?? 0).toLocaleString()}</dd>
              </div>
            </dl>

            <p className={`mt-6 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide ${INK_SOFT}`}>
              <Activity className="size-3.5" aria-hidden="true" />
              Recent runs
            </p>
            {recentSessions.length === 0 ? (
              <p className={`mt-2 text-sm leading-6 ${INK_SOFT}`}>Your finished challenges will appear here.</p>
            ) : (
              <ul className="mt-1">
                {recentSessions.slice(0, 4).map((session) => (
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
