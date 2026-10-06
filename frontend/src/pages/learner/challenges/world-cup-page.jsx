import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarDays, ChevronRight, Clock, Lock, Loader2, Shield, Sparkles, Trophy, Users, Zap } from "@/components/icons"

import { ProgressBar, TactileButton } from "@/components/rebyu/rebyu-ui.jsx"
import { getWorldCupTracks } from "@/lib/arenas.js"
import { getLearnerPortalData } from "@/services/learnerService.js"
import {
  CHALLENGE_ARENAS_KEY,
  getChallengeArenas,
  joinWorldCupQueue,
  leaveWorldCupQueue,
  getWorldCupQueueStatus,
  getWorldCupBracket,
  getMyWorldCupBracket,
  getWorldCupHistory,
} from "@/services/challengeService.js"

const BLADE_TONE = {
  bee: { bg: "bg-gradient-to-b from-rb-bee via-rb-macaw to-rb-humpback-lip" },
  macaw: { bg: "bg-gradient-to-b from-rb-macaw via-rb-feather to-rb-feather-lip" },
  beetle: { bg: "bg-gradient-to-b from-rb-beetle via-rb-humpback to-rb-humpback-lip" },
}

const TRACK_TONE = {
  bee: { wash: "bg-rb-bee-wash", ink: "text-rb-bee-ink" },
  macaw: { wash: "bg-rb-macaw-wash", ink: "text-rb-macaw-lip" },
  beetle: { wash: "bg-rb-beetle-wash", ink: "text-rb-beetle-lip" },
}

const ROUND_LABELS = {
  QUARTERFINAL: "Quarterfinals",
  SEMIFINAL: "Semifinals",
  FINAL: "Grand Final",
  COMPLETED: "Completed",
  ELIMINATED_QUARTERFINAL: "Quarterfinals",
  ELIMINATED_SEMIFINAL: "Semifinals",
  ELIMINATED_FINAL: "Grand Final",
}

/* ──────────────── lobby standee ──────────────── */

function Standee({ player, index }) {
  if (!player) {
    return (
      <div className="rb-standee rb-standee-empty justify-center">
        <div className="rb-pulse-slot grid size-[clamp(64px,8vh,104px)] place-items-center rounded-full border-2 border-dashed border-rb-swan">
          <Users className="size-7 text-rb-hare" aria-hidden="true" />
        </div>
        <p className="mt-4 text-center text-xs font-bold leading-tight text-rb-hare">
          waiting for
          <br />
          challenger
        </p>
        <span className="rb-numeric mt-auto pt-3 text-sm text-rb-hare">{index + 1}</span>
      </div>
    )
  }

  return (
    <div className={`rb-standee rb-pop-in ${player.you ? "rb-standee-you" : ""}`}>
      <span className="rb-frame border-rb-feather" aria-hidden="true">
        {player.displayName?.substring(0, 2)?.toLowerCase() ?? "??"}
      </span>
      <p className="mt-4 w-full truncate text-center text-base font-extrabold text-rb-eel">
        {player.displayName}
      </p>
      <p className="rb-numeric mt-1 text-xs text-rb-wolf">
        {Math.round(player.points)} pts
      </p>
    </div>
  )
}

/* ──────────────── bracket ──────────────── */

const SEAT_H = 44
const PAIR_GAP = 22
const GROUP_GAP = 40
const SEMI_GAP = 106
const SEAT_W = 168

function Seat({ name, variant = "outer", isWinner, isLoser, isYou }) {
  return (
    <div className={`rb-seat rb-seat-${variant} ${isYou ? "!border-rb-feather !bg-rb-feather-wash" : ""} ${isWinner ? "!font-extrabold" : ""} ${isLoser ? "line-through opacity-50" : ""}`}>
      {isWinner && <Zap className="mr-1.5 size-3.5 shrink-0 text-amber-500" aria-hidden="true" />}
      <span className="truncate">{name ?? "—"}</span>
      {isLoser && <span className="ml-auto text-xs text-red-400" aria-hidden="true">✕</span>}
    </div>
  )
}

function Elbow({ side }) {
  const isLeft = side === "left"
  return (
    <div
      aria-hidden="true"
      style={{ marginTop: SEAT_H / 2, marginBottom: SEAT_H / 2 }}
      className={`relative w-6 shrink-0 ${
        isLeft ? "border-r-2 border-rb-swan" : "border-l-2 border-rb-swan"
      }`}
    >
      <span className={`absolute top-0 h-0.5 w-6 bg-rb-swan ${isLeft ? "-left-6" : "-right-6"}`} />
      <span className={`absolute bottom-0 h-0.5 w-6 bg-rb-swan ${isLeft ? "-left-6" : "-right-6"}`} />
      <span className={`absolute top-1/2 h-0.5 w-6 bg-rb-swan ${isLeft ? "-right-6" : "-left-6"}`} />
    </div>
  )
}

function QuarterPair({ pair, side }) {
  return (
    <div className={`flex items-stretch ${side === "right" ? "flex-row-reverse" : ""}`}>
      <div className="flex shrink-0 flex-col" style={{ width: SEAT_W, gap: PAIR_GAP }}>
        {pair.map((p, i) => (
          <Seat key={i} name={p.name} variant={p.alive ? "outer" : "out"} isWinner={p.isWinner} isLoser={p.isLoser} isYou={p.isYou} />
        ))}
      </div>
      <Elbow side={side} />
    </div>
  )
}

function BranchSide({ side, quarters, semis }) {
  const reverse = side === "right"
  return (
    <div className={`flex items-center ${reverse ? "flex-row-reverse" : ""}`}>
      <div className="flex flex-col" style={{ gap: GROUP_GAP }}>
        {quarters.map((pair, i) => (
          <QuarterPair key={i} pair={pair} side={side} />
        ))}
      </div>
      <div className={`flex items-stretch ${reverse ? "flex-row-reverse" : ""}`}>
        <div className="flex shrink-0 flex-col" style={{ width: SEAT_W, gap: SEMI_GAP }}>
          {semis.map((p, i) => (
            <Seat key={i} name={p.name} variant={p.alive ? "inner" : "out"} isWinner={p.isWinner} isLoser={p.isLoser} isYou={p.isYou} />
          ))}
        </div>
        <Elbow side={side} />
      </div>
    </div>
  )
}

function LiveBracket({ bracket, myLearnerId }) {
  if (!bracket) return null

  const playerMap = {}
  for (const p of bracket.players) {
    playerMap[p.learnerId] = p
  }

  const matchesByRound = {}
  for (const m of bracket.matches) {
    if (!matchesByRound[m.round]) matchesByRound[m.round] = []
    matchesByRound[m.round].push(m)
  }

  const getName = (id) => playerMap[id]?.displayName ?? "—"
  const isYou = (id) => id === myLearnerId
  const qfMatches = (matchesByRound["QUARTERFINAL"] ?? []).sort((a, b) => a.matchIndex - b.matchIndex)
  const sfMatches = (matchesByRound["SEMIFINAL"] ?? []).sort((a, b) => a.matchIndex - b.matchIndex)
  const finalMatches = (matchesByRound["FINAL"] ?? []).sort((a, b) => a.matchIndex - b.matchIndex)

  const seatOf = (match, playerId) => ({
    name: getName(playerId),
    alive: match.status !== "COMPLETED" || match.winnerLearnerId === playerId,
    isWinner: match.status === "COMPLETED" && match.winnerLearnerId === playerId,
    isLoser: match.status === "COMPLETED" && match.winnerLearnerId !== playerId,
    isYou: isYou(playerId),
  })

  // Build QF pairs
  const leftQF = qfMatches.slice(0, 2).map(m => [seatOf(m, m.player1?.learnerId), seatOf(m, m.player2?.learnerId)])
  const rightQF = qfMatches.slice(2, 4).map(m => [seatOf(m, m.player1?.learnerId), seatOf(m, m.player2?.learnerId)])

  // SF
  const leftSF = sfMatches.length > 0
    ? [seatOf(sfMatches[0], sfMatches[0].player1?.learnerId), seatOf(sfMatches[0], sfMatches[0].player2?.learnerId)]
    : [{ name: "—", alive: true }, { name: "—", alive: true }]
  const rightSF = sfMatches.length > 1
    ? [seatOf(sfMatches[1], sfMatches[1].player1?.learnerId), seatOf(sfMatches[1], sfMatches[1].player2?.learnerId)]
    : [{ name: "—", alive: true }, { name: "—", alive: true }]

  // Final
  const finalist1 = finalMatches.length > 0 ? getName(finalMatches[0].player1?.learnerId) : "—"
  const finalist2 = finalMatches.length > 0 ? getName(finalMatches[0].player2?.learnerId) : "—"

  return (
    <div className="flex items-center justify-center gap-3">
      <BranchSide side="left" quarters={leftQF} semis={leftSF} />

      <div className="flex w-[260px] shrink-0 flex-col items-center px-2 lg:w-[300px]">
        <div className="rb-halo relative">
          <Trophy
            className="size-28 text-rb-bee drop-shadow-[0_6px_14px_rgba(255,200,0,0.5)] lg:size-32"
            aria-hidden="true"
          />
        </div>
        <div className="mt-5 font-rb-display text-2xl font-extrabold lowercase text-rb-eel">
          the final
        </div>
        <div className="mt-5 flex w-full items-center gap-2">
          <div className="rb-seat rb-seat-final flex-1 justify-center">{finalist1}</div>
          <span className="font-rb-display text-lg font-extrabold lowercase text-rb-wolf">vs</span>
          <div className="rb-seat rb-seat-final flex-1 justify-center">{finalist2}</div>
        </div>
        {bracket.winnerLearnerId ? (
          <div className="mt-5 rounded-rb-pill bg-rb-bee px-5 py-2 text-sm font-extrabold text-[#4a3600]">
            🏆 {getName(bracket.winnerLearnerId)} wins!
          </div>
        ) : (
          <span className="mt-5 rounded-rb-pill border-2 border-rb-swan bg-rb-polar px-3 py-1.5 text-xs font-bold text-rb-wolf">
            {ROUND_LABELS[bracket.currentRound] ?? bracket.currentRound}
          </span>
        )}
      </div>

      <BranchSide side="right" quarters={rightQF} semis={rightSF} />
    </div>
  )
}

/* ──────────────── page ──────────────── */

export default function WorldCupPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [phase, setPhase] = useState("track")
  const [track, setTrack] = useState(null)
  const [bracket, setBracket] = useState(null)
  const [myLearnerId, setMyLearnerId] = useState(null)
  const pollRef = useRef(null)

  const portalQuery = useQuery({
    queryKey: ["learner-portal-data"],
    queryFn: getLearnerPortalData,
    staleTime: 5 * 60 * 1000,
  })

  const arenasQuery = useQuery({
    queryKey: [CHALLENGE_ARENAS_KEY],
    queryFn: getChallengeArenas,
    staleTime: 60_000,
  })

  const historyQuery = useQuery({
    queryKey: ["worldcup-history"],
    queryFn: getWorldCupHistory,
    staleTime: 60_000,
  })

  const worldCup = (arenasQuery.data ?? []).find((row) => row.arenaId === "worldcup") ?? null
  const locked = arenasQuery.isSuccess && !worldCup?.configured

  const tracks = useMemo(
    () => getWorldCupTracks(portalQuery.data?.enrolledCertifications ?? [], worldCup?.disabledTrackIds),
    [portalQuery.data, worldCup?.disabledTrackIds],
  )

  // Extract learner ID from portal data
  useEffect(() => {
    if (portalQuery.data?.learnerId) {
      setMyLearnerId(portalQuery.data.learnerId)
    }
  }, [portalQuery.data])

  // On mount, check for an active bracket the learner is already in
  useEffect(() => {
    if (!myLearnerId || phase !== "track") return
    getMyWorldCupBracket()
      .then((b) => {
        if (b) {
          setBracket(b)
          setPhase("bracket")
        }
      })
      .catch(() => {})
  }, [myLearnerId])

  const [queueSize, setQueueSize] = useState(0)
  const [queueRequired, setQueueRequired] = useState(8)
  const QUEUE_TIMEOUT = 120
  const [queueTimer, setQueueTimer] = useState(QUEUE_TIMEOUT)
  const timerRef = useRef(null)

  // Join queue mutation
  const joinMutation = useMutation({
    mutationFn: (certId) => joinWorldCupQueue(certId),
    onSuccess: (data) => {
      setQueueSize(data.queueSize)
      setQueueRequired(data.required)
      if (data.activeBracket) {
        setBracket(data.activeBracket)
        setPhase("bracket")
        stopPolling()
      } else {
        setPhase("lobby")
        startPolling(data.certificationId)
        startTimer()
      }
    },
  })

  // Leave queue mutation
  const leaveMutation = useMutation({
    mutationFn: (certId) => leaveWorldCupQueue(certId),
    onSuccess: () => {
      setPhase("track")
      setTrack(null)
      stopPolling()
    },
  })

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    stopTimer()
    setQueueTimer(QUEUE_TIMEOUT)
    timerRef.current = setInterval(() => {
      setQueueTimer(prev => {
        if (prev <= 1) return 0
        return prev - 1
      })
    }, 1000)
  }, [stopTimer])

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    stopTimer()
  }, [stopTimer])

  const startPolling = useCallback((certId) => {
    stopPolling()
    pollRef.current = setInterval(async () => {
      try {
        const status = await getWorldCupQueueStatus(certId)
        setQueueSize(status.queueSize)
        setQueueRequired(status.required)
        if (status.activeBracket) {
          setBracket(status.activeBracket)
          setPhase("found")
          stopPolling()
          // After 3 seconds show bracket
          setTimeout(() => setPhase("bracket"), 3000)
        }
      } catch {
        // ignore polling errors
      }
    }, 3000)
  }, [stopPolling])

  // Auto-cancel queue when timer expires
  useEffect(() => {
    if (phase === "lobby" && queueTimer === 0) {
      handleLeaveQueue()
    }
  }, [queueTimer, phase])

  // Clean up polling on unmount
  useEffect(() => () => stopPolling(), [stopPolling])

  // Refresh bracket data periodically when in bracket phase
  useEffect(() => {
    if (phase !== "bracket" || !bracket?.bracketId) return undefined
    const id = setInterval(async () => {
      try {
        const updated = await getWorldCupBracket(bracket.bracketId)
        setBracket(updated)
      } catch {
        // ignore
      }
    }, 5000)
    return () => clearInterval(id)
  }, [phase, bracket?.bracketId])

  const handleTrackSelect = (item) => {
    setTrack(item)
    joinMutation.mutate(item.id)
  }

  const handleLeaveQueue = () => {
    if (track) leaveMutation.mutate(track.id)
  }

  const thisWeekLabel = useMemo(() => {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    const sunday = new Date(monday)
    sunday.setDate(sunday.getDate() + 6)
    const fmt = (d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    return `${fmt(monday)} – ${fmt(sunday)}, ${sunday.getFullYear()}`
  }, [])

  const SUBTITLE = {
    track: "Choose your certification track",
    lobby: "Matchmaking · 8-player tournament",
    found: "Match found!",
    bracket: bracket?.currentRound ? ROUND_LABELS[bracket.currentRound] ?? "Tournament" : "Tournament bracket",
  }

  // Find the player's current match in the bracket
  const myCurrentMatch = useMemo(() => {
    if (!bracket || !myLearnerId) return null
    const currentRound = bracket.currentRound
    if (currentRound === "COMPLETED") return null
    return bracket.matches.find(
      m => m.round === currentRound && (m.player1?.learnerId === myLearnerId || m.player2?.learnerId === myLearnerId)
    )
  }, [bracket, myLearnerId])

  // Whether the player has already scored in their current match
  const hasSubmittedCurrentRound = useMemo(() => {
    if (!myCurrentMatch || !myLearnerId) return false
    if (myCurrentMatch.player1?.learnerId === myLearnerId) return myCurrentMatch.player1Score != null
    if (myCurrentMatch.player2?.learnerId === myLearnerId) return myCurrentMatch.player2Score != null
    return false
  }, [myCurrentMatch, myLearnerId])

  // Whether the player is eliminated
  const isEliminated = useMemo(() => {
    if (!bracket || !myLearnerId) return false
    if (bracket.currentRound === "COMPLETED") return bracket.winnerLearnerId !== myLearnerId
    // Check if they lost in any completed match
    for (const m of bracket.matches) {
      if (m.status !== "COMPLETED") continue
      const isInMatch = m.player1?.learnerId === myLearnerId || m.player2?.learnerId === myLearnerId
      if (isInMatch && m.winnerLearnerId !== myLearnerId) return true
    }
    return false
  }, [bracket, myLearnerId])

  if (locked) {
    return (
      <div className="rebyu-ds grid min-h-dvh place-items-center px-5 py-12" style={{ background: "#0c1018" }}>
        <div className="w-full max-w-lg text-center">
          <div className="mx-auto grid size-24 place-items-center rounded-full bg-white/[0.06]">
            <Lock className="size-12 text-white/30" aria-hidden="true" />
          </div>
          <h1 className="mt-6 font-rb-display text-3xl font-extrabold lowercase text-white">not open yet</h1>
          <p className="mt-3 text-sm leading-6 text-white/40">
            No Champions Cup week has been published yet. The bracket opens as soon as an
            admin publishes one.
          </p>
          <Link
            to="/learner/challenges"
            className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15"
          >
            back to arenas
          </Link>
        </div>
      </div>
    )
  }

  const TRACK_GLOW = {
    bee: { from: "from-amber-500/20", ring: "ring-amber-400/40", glow: "shadow-amber-500/25" },
    macaw: { from: "from-emerald-500/20", ring: "ring-emerald-400/40", glow: "shadow-emerald-500/25" },
    beetle: { from: "from-cyan-500/20", ring: "ring-cyan-400/40", glow: "shadow-cyan-500/25" },
  }

  return (
    <div className="rebyu-ds rb-arena flex h-dvh flex-col overflow-hidden" style={{ background: "#0c1018" }}>
      {/* Header — all phases */}
      <header className="relative z-10 shrink-0">
        <div className="flex items-center gap-4 px-5 pt-5 pb-4 lg:px-8">
          <Link to="/learner/challenges" className="grid size-9 place-items-center rounded-xl bg-white/[0.06] text-white/50 transition hover:bg-white/10 hover:text-white">
            <ChevronRight className="size-4 rotate-180" aria-hidden="true" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <Trophy className="size-5 text-amber-400" aria-hidden="true" />
              <h1 className="font-rb-display text-lg font-extrabold lowercase tracking-tight text-white sm:text-xl">
                champions cup
              </h1>
            </div>
            <p className="mt-0.5 truncate text-[0.6875rem] font-semibold text-white/40">
              {SUBTITLE[phase]}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {phase === "lobby" ? (
              <>
                <span className="rb-numeric text-sm text-white/50">{queueSize} / {queueRequired}</span>
                <button
                  type="button"
                  onClick={handleLeaveQueue}
                  className="rounded-xl bg-white/[0.06] px-4 py-2 text-xs font-bold text-white/60 transition hover:bg-red-500/20 hover:text-red-400"
                >
                  leave queue
                </button>
              </>
            ) : null}
            {track ? (
              <span className="rounded-xl bg-white/[0.08] px-3.5 py-1.5 text-xs font-bold text-white/70">
                {track.name}
              </span>
            ) : null}
            {phase === "bracket" && bracket?.currentRound === "COMPLETED" ? (
              <button
                type="button"
                onClick={() => { setPhase("track"); setTrack(null); setBracket(null) }}
                className="rounded-xl bg-amber-500/20 px-4 py-2 text-xs font-bold text-amber-300 transition hover:bg-amber-500/30"
              >
                play again
              </button>
            ) : null}
          </div>
        </div>
        <div aria-hidden="true" className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:overflow-hidden">
        {/* ──────── track select ──────── */}
        {phase === "track" && portalQuery.isLoading ? (
          <div className="grid flex-1 place-items-center px-5">
            <Loader2 className="size-6 animate-spin text-white/30" />
          </div>
        ) : null}

        {phase === "track" && !portalQuery.isLoading && tracks.length === 0 ? (
          <div className="grid flex-1 place-items-center px-5 pb-10">
            <div className="max-w-md text-center">
              <Trophy className="mx-auto size-12 text-white/20" aria-hidden="true" />
              <div className="mt-5 font-rb-display text-2xl font-extrabold lowercase text-white">
                no tracks yet
              </div>
              <p className="mt-3 text-sm leading-6 text-white/50">
                The Champions Cup is played on a certification you are enrolled in. Enrol in
                one and its track appears here.
              </p>
              <Link
                to="/learner/certifications"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15"
              >
                browse certifications
              </Link>
            </div>
          </div>
        ) : null}

        {phase === "track" && tracks.length > 0 ? (
          <div className="flex min-h-0 flex-1 flex-col px-5 pt-6 lg:px-8">
            {/* Hero area */}
            <div className="mx-auto mb-8 max-w-2xl text-center">
              <div className="relative mx-auto mb-6 grid size-20 place-items-center">
                <div aria-hidden="true" className="absolute inset-0 animate-pulse rounded-full bg-amber-500/20 blur-xl" />
                <Trophy className="relative size-10 text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]" aria-hidden="true" />
              </div>
              <h2 className="font-rb-display text-3xl font-extrabold lowercase tracking-tight text-white sm:text-4xl">
                choose your arena
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/40">
                Pick your certification track and enter the queue. When 8 challengers are ready,
                the bracket begins.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-1.5 text-[0.6875rem] font-bold text-white/50">
                  <CalendarDays className="size-3.5 text-white/30" aria-hidden="true" />
                  {thisWeekLabel}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-1.5 text-[0.6875rem] font-bold text-white/50">
                  <Users className="size-3.5 text-white/30" aria-hidden="true" />
                  8 players
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-1.5 text-[0.6875rem] font-bold text-white/50">
                  <Zap className="size-3.5 text-white/30" aria-hidden="true" />
                  3 rounds
                </span>
              </div>
            </div>

            {/* Track cards */}
            <div className="mx-auto grid w-full max-w-4xl flex-1 grid-cols-1 gap-4 pb-8 sm:grid-cols-2 lg:grid-cols-3">
              {tracks.map((item) => {
                const glow = TRACK_GLOW[item.tone] ?? TRACK_GLOW.bee
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={joinMutation.isPending}
                    onClick={() => handleTrackSelect(item)}
                    className={`group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-6 text-left transition-all hover:border-white/20 hover:shadow-xl hover:${glow.glow} hover:scale-[1.02] active:scale-[0.98]`}
                  >
                    <div aria-hidden="true" className={`pointer-events-none absolute -top-20 left-1/2 size-40 -translate-x-1/2 rounded-full bg-gradient-to-b ${glow.from} to-transparent blur-3xl transition-opacity group-hover:opacity-100 opacity-50`} />

                    <div className="relative">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.08] px-2.5 py-1 text-[0.625rem] font-extrabold uppercase tracking-widest text-white/40">
                        <Trophy className="size-3" aria-hidden="true" />
                        bracket
                      </span>
                      <h3 className="mt-4 font-rb-display text-2xl font-extrabold lowercase leading-tight tracking-tight text-white lg:text-3xl">
                        {item.name}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/40">
                        {item.blurb}
                      </p>
                    </div>

                    <div className="relative mt-auto flex items-center gap-2 pt-6">
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-extrabold text-white transition group-hover:bg-white group-hover:text-[#0c1018]">
                        enter queue
                        <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Past tournaments */}
            {(historyQuery.data ?? []).length > 0 ? (
              <div className="mx-auto w-full max-w-4xl pb-10">
                <h3 className="mb-4 font-rb-display text-lg font-extrabold lowercase tracking-tight text-white/70">
                  past tournaments
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {historyQuery.data.map((h) => (
                    <div
                      key={h.bracketId}
                      className={`flex flex-col gap-3 rounded-2xl border p-5 ${
                        h.won
                          ? "border-amber-400/30 bg-amber-500/10"
                          : "border-white/[0.08] bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white/40">
                          {new Date(h.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        {h.won ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 px-2 py-0.5 text-[0.625rem] font-extrabold text-amber-300">
                            <Trophy className="size-3" aria-hidden="true" /> champion
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-white/[0.06] px-2 py-0.5 text-[0.625rem] font-bold text-white/40">
                            <Shield className="size-3" aria-hidden="true" /> {h.bestRound ? ROUND_LABELS[h.bestRound] ?? h.bestRound : "—"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="rb-numeric text-2xl font-extrabold text-white">
                            {h.bestScore != null ? Math.round(h.bestScore) : "—"}
                          </p>
                          <p className="text-[0.625rem] font-bold text-white/30">best score</p>
                        </div>
                        <div className="text-right">
                          <p className="rb-numeric text-lg font-extrabold text-white/70">{h.rounds ?? "—"}</p>
                          <p className="text-[0.625rem] font-bold text-white/30">rounds played</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ──────── lobby ──────── */}
        {phase === "lobby" ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 lg:px-8">
            {/* circular countdown */}
            <div className="relative grid size-40 place-items-center">
              <div aria-hidden="true" className={`absolute inset-0 rounded-full blur-2xl transition-colors duration-700 ${queueTimer <= 30 ? "bg-red-500/15" : "bg-amber-500/10"}`} />
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="72" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                <circle
                  cx="80" cy="80" r="72" fill="none"
                  stroke={queueTimer <= 30 ? "#ef4444" : "#f59e0b"}
                  strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 72}
                  strokeDashoffset={2 * Math.PI * 72 * (1 - queueTimer / QUEUE_TIMEOUT)}
                  className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                  style={{ filter: `drop-shadow(0 0 8px ${queueTimer <= 30 ? "rgba(239,68,68,0.5)" : "rgba(245,158,11,0.4)"})` }}
                />
              </svg>
              <div className="relative text-center">
                <span className={`rb-numeric text-4xl font-extrabold ${queueTimer <= 30 ? "text-red-400" : "text-white"}`}>
                  {Math.floor(queueTimer / 60)}:{String(queueTimer % 60).padStart(2, "0")}
                </span>
              </div>
            </div>

            <p className="mt-5 text-sm font-extrabold text-white">Finding opponents…</p>
            <p className="mt-1 text-xs text-white/30">Queue auto-cancels when the timer runs out</p>

            {/* standee grid */}
            <div className="mt-10 grid w-full max-w-2xl grid-cols-4 gap-3 sm:grid-cols-8">
              {Array.from({ length: queueRequired }).map((_, i) => {
                const filled = i < queueSize
                return (
                  <div key={i} className={`flex flex-col items-center gap-2 rounded-2xl border px-2 py-4 transition-all ${filled ? "border-amber-400/30 bg-amber-500/10 rb-pop-in" : "border-dashed border-white/[0.08] bg-white/[0.03]"}`}>
                    <div className={`grid size-10 place-items-center rounded-full ${filled ? "bg-amber-500 text-[#0c1018]" : "bg-white/[0.06] text-white/20"}`}>
                      {filled
                        ? <span className="text-sm font-extrabold">{i + 1}</span>
                        : <Users className="size-4" aria-hidden="true" />}
                    </div>
                    <span className={`text-[0.625rem] font-bold ${filled ? "text-amber-300" : "text-white/20"}`}>
                      {filled ? (i === 0 ? "you" : "ready") : "—"}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 flex items-center gap-2">
              <span className="rb-numeric text-sm font-bold text-white/60">{queueSize} / {queueRequired}</span>
              <span className="text-xs text-white/30">players in queue</span>
            </div>
          </div>
        ) : null}

        {/* ──────── match found overlay ──────── */}
        {phase === "found" ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 px-5">
            <div className="rb-pop-in text-center">
              <div aria-hidden="true" className="mx-auto mb-4 size-24 animate-pulse rounded-full bg-amber-500/20 blur-2xl" />
              <div className="font-rb-display text-4xl font-extrabold lowercase text-amber-400 drop-shadow-[0_0_30px_rgba(245,158,11,0.5)] sm:text-6xl">
                match found!
              </div>
              <p className="mt-4 text-lg text-white/60">Bracket is being formed…</p>
            </div>
          </div>
        ) : null}

        {/* ──────── bracket ──────── */}
        {phase === "bracket" && bracket ? (
          <div className="flex min-h-0 flex-1 flex-col px-5 lg:px-8">
            {/* Action bar for current round */}
            {myCurrentMatch && !isEliminated && !hasSubmittedCurrentRound ? (
              <div className="mx-auto mt-4 flex w-full max-w-lg items-center gap-3 rounded-2xl border-2 border-rb-feather bg-rb-feather-wash p-4">
                <div className="flex-1">
                  <p className="text-sm font-extrabold text-rb-eel">
                    Your {ROUND_LABELS[bracket.currentRound]} match is ready!
                  </p>
                  <p className="mt-1 text-xs text-rb-wolf">
                    {myCurrentMatch.questionCount} questions · vs {
                      myCurrentMatch.player1?.learnerId === myLearnerId
                        ? myCurrentMatch.player2?.displayName
                        : myCurrentMatch.player1?.displayName
                    }
                  </p>
                </div>
                <TactileButton
                  onClick={() => {
                    if (worldCup?.examId) {
                      navigate(`/learner/assessments/${worldCup.examId}?arena=worldcup&matchId=${myCurrentMatch.matchId}`)
                    }
                  }}
                >
                  <Zap className="size-4" aria-hidden="true" />
                  play round
                </TactileButton>
              </div>
            ) : null}

            {isEliminated ? (
              <div className="mx-auto mt-4 flex w-full max-w-lg items-center gap-3 rounded-2xl border-2 border-rb-swan bg-rb-polar p-4">
                <p className="text-sm font-bold text-rb-wolf">
                  You've been eliminated. Watch the rest of the bracket!
                </p>
              </div>
            ) : null}

            {hasSubmittedCurrentRound && !isEliminated ? (
              <div className="mx-auto mt-4 flex w-full max-w-lg items-center gap-3 rounded-2xl border-2 border-rb-swan bg-rb-polar p-4">
                <Loader2 className="size-5 animate-spin text-rb-wolf" aria-hidden="true" />
                <p className="text-sm font-bold text-rb-wolf">
                  Waiting for your opponent to finish…
                </p>
              </div>
            ) : null}

            <div className="grid min-h-0 flex-1 place-items-center overflow-auto py-6">
              <div className="origin-center xl:scale-110 2xl:scale-125">
                <LiveBracket bracket={bracket} myLearnerId={myLearnerId} />
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
