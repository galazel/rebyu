import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowLeft, CalendarDays, ChevronRight, Crown, HistoryIcon, Loader2, Shield, Trophy, Users, Zap } from "@/components/icons"
import { PathBackdrop, Plinth } from "@/components/challenges/arena-lobby.jsx"
import { ArenaPodium } from "@/components/challenges/arena-podium.jsx"

import { TactileButton } from "@/components/rebyu/rebyu-ui.jsx"
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
  getWorldCupActiveEdition,
  fillWorldCupWithBots,
  getWorldCupBracketForMatch,
} from "@/services/challengeService.js"

const ROUND_LABELS = {
  QUARTERFINAL: "Quarterfinals",
  SEMIFINAL: "Semifinals",
  FINAL: "Grand Final",
  COMPLETED: "Completed",
  ELIMINATED_QUARTERFINAL: "Quarterfinals",
  ELIMINATED_SEMIFINAL: "Semifinals",
  ELIMINATED_FINAL: "Grand Final",
}


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


const SEAT_H = 44
const PAIR_GAP = 22
const GROUP_GAP = 40
const SEMI_GAP = 106
const SEAT_W = 176

/*
 * One seat in the bracket. Every state reads at a glance:
 * you (solid green), a winner (orange, with their score), knocked out (faded and
 * struck through), still to play (white), or a round not drawn yet (dashed "TBD").
 */
function Seat({ seat }) {
  if (!seat || seat.empty) {
    return (
      <div
        className="flex items-center justify-center rounded-full border-2 border-dashed border-rb-swan text-xs font-bold text-rb-hare"
        style={{ height: SEAT_H }}
      >
        TBD
      </div>
    )
  }
  const tone = seat.loser
    ? "border-2 border-rb-swan bg-rb-polar text-rb-hare"
    : seat.you
      ? "bg-rb-feather text-white shadow-[0_4px_0_var(--color-rb-feather-lip)]"
      : seat.winner
        ? "bg-rb-fox text-white shadow-[0_4px_0_var(--color-rb-fox-lip)]"
        : "border-2 border-rb-swan bg-rb-snow text-rb-eel shadow-[0_3px_0_var(--color-rb-swan)]"
  return (
    <div
      className={`flex items-center gap-2 rounded-full px-3.5 text-sm font-extrabold ${tone} ${
        seat.you && seat.winner ? "ring-2 ring-rb-fox ring-offset-2" : ""
      }`}
      style={{ height: SEAT_H }}
      title={seat.name}
    >
      {seat.winner ? <Zap className="size-3.5 shrink-0" aria-hidden="true" /> : null}
      <span className={`min-w-0 flex-1 truncate ${seat.loser ? "line-through" : ""}`}>{seat.name}</span>
      {seat.you ? (
        <span className="shrink-0 rounded-full bg-white/25 px-1.5 text-[10px] font-extrabold uppercase">you</span>
      ) : null}
      {seat.score != null ? (
        <span className="shrink-0 font-rb-display text-base tabular-nums">{Math.round(seat.score)}</span>
      ) : null}
    </div>
  )
}

function Elbow({ side }) {
  const isLeft = side === "left"
  return (
    <div
      aria-hidden="true"
      style={{ marginTop: SEAT_H / 2, marginBottom: SEAT_H / 2 }}
      className={`relative w-6 shrink-0 ${isLeft ? "border-r-2 border-rb-swan" : "border-l-2 border-rb-swan"}`}
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
        {pair.map((seat, i) => (
          <Seat key={i} seat={seat} />
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
          {semis.map((seat, i) => (
            <Seat key={i} seat={seat} />
          ))}
        </div>
        <Elbow side={side} />
      </div>
    </div>
  )
}

const ROUND_HEADINGS = ["Quarterfinals", "Semifinals"]

function initialsOf(name) {
  const parts = String(name ?? "?").trim().split(/\s+/).filter(Boolean)
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : String(name ?? "?").slice(0, 2)).toUpperCase()
}

/* The learner's next match, as a face-off: you, the opponent, and one play button. */
function FaceOff({ round, questionCount, you, opponent, onPlay }) {
  const reduceMotion = useReducedMotion()
  const side = (name, mine) => (
    <motion.div
      className="flex w-28 flex-col items-center sm:w-36"
      initial={reduceMotion ? false : { opacity: 0, x: mine ? -24 : 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
    >
      <span
        className={`grid size-16 place-items-center rounded-full font-rb-display text-xl font-extrabold sm:size-20 sm:text-2xl ${
          mine
            ? "bg-rb-feather text-white shadow-[0_4px_0_var(--color-rb-feather-lip)]"
            : "bg-rb-snow text-rb-eel ring-2 ring-rb-swan shadow-[0_4px_0_var(--color-rb-swan)]"
        }`}
      >
        {initialsOf(name)}
      </span>
      <span className="mt-2 w-full truncate text-center text-sm font-extrabold text-rb-eel" title={name}>
        {name}
      </span>
      <span className="text-[11px] font-bold uppercase text-rb-wolf">{mine ? "you" : "opponent"}</span>
    </motion.div>
  )
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-rb-fox-lip">your match is ready</p>
      <p className="font-rb-display text-3xl font-extrabold text-rb-eel">{round}</p>
      <div className="mt-4 flex items-center justify-center gap-4 sm:gap-8">
        {side(you, true)}
        <motion.span
          className="font-rb-display text-3xl font-extrabold text-rb-fox"
          animate={reduceMotion ? undefined : { scale: [1, 1.15, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          vs
        </motion.span>
        {side(opponent, false)}
      </div>
      <p className="mt-3 text-xs font-bold text-rb-wolf">
        {questionCount} question{questionCount === 1 ? "" : "s"} · higher score goes through
      </p>
      <TactileButton variant="fox" className="mt-4 w-full sm:w-auto sm:px-10" onClick={onPlay}>
        <Zap className="mr-1.5 size-4" aria-hidden="true" />
        play round
      </TactileButton>
    </div>
  )
}

function LiveBracket({ bracket, myLearnerId }) {
  if (!bracket) return null

  const playerMap = {}
  for (const p of bracket.players) playerMap[p.learnerId] = p

  const byRound = {}
  for (const m of bracket.matches) (byRound[m.round] ??= []).push(m)
  const sorted = (round) => (byRound[round] ?? []).slice().sort((a, b) => a.matchIndex - b.matchIndex)
  const qf = sorted("QUARTERFINAL")
  const sf = sorted("SEMIFINAL")
  const fin = sorted("FINAL")

  const seatOf = (match, playerId) => {
    if (!match || playerId == null) return { empty: true }
    const done = match.status === "COMPLETED"
    const first = match.player1?.learnerId === playerId
    return {
      name: playerMap[playerId]?.displayName ?? (first ? match.player1 : match.player2)?.displayName ?? "Player",
      you: playerId === myLearnerId,
      winner: done && match.winnerLearnerId === playerId,
      loser: done && match.winnerLearnerId !== playerId,
      score: first ? match.player1Score : match.player2Score,
    }
  }
  const pairOf = (match) => [seatOf(match, match?.player1?.learnerId), seatOf(match, match?.player2?.learnerId)]

  const leftQF = [qf[0], qf[1]].map(pairOf)
  const rightQF = [qf[2], qf[3]].map(pairOf)
  const leftSF = pairOf(sf[0])
  const rightSF = pairOf(sf[1])
  const [final1, final2] = pairOf(fin[0])
  const champion = bracket.winnerLearnerId != null ? playerMap[bracket.winnerLearnerId] : null

  return (
    <div>
      {/* Round labels over each column */}
      <div className="mb-3 flex items-center justify-center gap-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-rb-wolf">
        <div className="flex">
          {ROUND_HEADINGS.map((label) => (
            <span key={label} className="text-center" style={{ width: SEAT_W + 24 }}>
              {label}
            </span>
          ))}
        </div>
        <span className="w-[260px] text-center lg:w-[300px]">Final</span>
        <div className="flex flex-row-reverse">
          {ROUND_HEADINGS.map((label) => (
            <span key={label} className="text-center" style={{ width: SEAT_W + 24 }}>
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <BranchSide side="left" quarters={leftQF} semis={leftSF} />

        <div className="flex w-[260px] shrink-0 flex-col items-center px-2 lg:w-[300px]">
          <div className="relative aspect-[4/3] w-44">
            <TrophyArt />
          </div>
          <div className="mt-1 font-rb-display text-2xl font-extrabold text-rb-eel">The final</div>
          <div className="mt-4 flex w-full items-center gap-2">
            <div className="min-w-0 flex-1">
              <Seat seat={final1} />
            </div>
            <span className="font-rb-display text-lg font-extrabold text-rb-hare">vs</span>
            <div className="min-w-0 flex-1">
              <Seat seat={final2} />
            </div>
          </div>
          {champion ? (
            <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-rb-fox px-5 py-2 text-sm font-extrabold text-white shadow-[0_3px_0_var(--color-rb-fox-lip)]">
              <Crown className="size-4" aria-hidden="true" />
              {champion.learnerId === myLearnerId ? "You won the cup" : `${champion.displayName} won the cup`}
            </div>
          ) : (
            <span className="mt-5 rounded-full border-2 border-rb-swan bg-rb-snow px-3 py-1.5 text-xs font-extrabold text-rb-wolf">
              Now playing: {ROUND_LABELS[bracket.currentRound] ?? bracket.currentRound}
            </span>
          )}
        </div>

        <BranchSide side="right" quarters={rightQF} semis={rightSF} />
      </div>
    </div>
  )
}


export default function WorldCupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  // Back returns to wherever the learner came from (e.g. their learning path);
  // the link target is only the fallback when the page was opened directly.
  const goBack = (event) => {
    // A past tournament goes back to the history list it was opened from.
    if (phase === "review") {
      event.preventDefault()
      if (location.key !== "default") navigate(-1)
      else navigate("/learner/challenges/world-cup/history", { replace: true })
      return
    }
    // From a live bracket, back is the main Champions Cup page.
    if (phase === "bracket") {
      event.preventDefault()
      setBracket(null)
      setPhase("track")
      navigate("/learner/challenges/world-cup", { replace: true })
      return
    }
    // The main page goes back to the certification's learning path, never to
    // another Champions Cup screen still in the browser history.
    event.preventDefault()
    const certificationId = activeEditionRef.current ?? searchParams.get("track")
    navigate(certificationId ? `/learner/learning/${certificationId}` : "/learner/challenges")
  }
  const queryClient = useQueryClient()
  const activeEditionRef = useRef(null)
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

  // Each week has one weekly exam on one certification, so that is the only open track.
  const activeEditionQuery = useQuery({
    queryKey: ["worldcup-active-edition"],
    queryFn: getWorldCupActiveEdition,
    staleTime: 60_000,
  })
  const activeEdition = activeEditionQuery.data ?? null
  activeEditionRef.current = activeEdition?.certificationId ?? null

  const worldCup = (arenasQuery.data ?? []).find((row) => row.arenaId === "worldcup") ?? null
  const locked =
    (arenasQuery.isSuccess && !worldCup?.configured) || (activeEditionQuery.isSuccess && !activeEdition)

  const [searchParams] = useSearchParams()
  const preferredTrack = searchParams.get("track")
  // Coming back from a round's result: open that match's bracket, live or finished.
  const openMatch = searchParams.get("match")
  const openBracketId = searchParams.get("bracket")
  useEffect(() => {
    if (!openBracketId) return
    let cancelled = false
    getWorldCupBracket(openBracketId)
      .then((view) => {
        if (cancelled || !view) return
        setBracket(view)
        setPhase(view.currentRound === "COMPLETED" ? "review" : "bracket")
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [openBracketId])
  useEffect(() => {
    if (!openMatch) return
    let cancelled = false
    getWorldCupBracketForMatch(openMatch)
      .then((view) => {
        if (cancelled || !view) return
        setBracket(view)
        setPhase(view.currentRound === "COMPLETED" ? "review" : "bracket")
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [openMatch])
  const tracks = useMemo(() => {
    if (!activeEdition) return []
    return getWorldCupTracks(portalQuery.data?.enrolledCertifications ?? [], worldCup?.disabledTrackIds).filter(
      (t) => t.id === String(activeEdition.certificationId)
    )
  }, [portalQuery.data, worldCup?.disabledTrackIds, activeEdition])

  useEffect(() => {
    if (portalQuery.data?.learnerId) {
      setMyLearnerId(portalQuery.data.learnerId)
    }
  }, [portalQuery.data])

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
          setTimeout(() => setPhase("bracket"), 3000)
        }
      } catch {
      }
    }, 3000)
  }, [stopPolling])

  useEffect(() => {
    // Nobody else joined within 2 minutes: bots fill the empty seats and the bracket starts.
    if (phase === "lobby" && queueTimer === 0 && track) {
      stopPolling()
      fillWorldCupWithBots(track.id)
        .then((data) => {
          if (data?.activeBracket) {
            setBracket(data.activeBracket)
            setPhase("found")
            setTimeout(() => setPhase("bracket"), 2000)
          } else {
            handleLeaveQueue()
          }
        })
        .catch(() => handleLeaveQueue())
    }
  }, [queueTimer, phase])

  useEffect(() => () => stopPolling(), [stopPolling])

  // Leaving the matchmaking screen (back, exit, any other page) cancels the queue
  // spot, so nobody is drawn into a bracket they have walked away from.
  const queuedTrackRef = useRef(null)
  useEffect(() => {
    queuedTrackRef.current = phase === "lobby" && track ? track.id : null
  }, [phase, track])
  useEffect(() => {
    const cancel = () => {
      if (queuedTrackRef.current) {
        leaveWorldCupQueue(queuedTrackRef.current).catch(() => {})
        queuedTrackRef.current = null
      }
    }
    window.addEventListener("pagehide", cancel)
    return () => {
      window.removeEventListener("pagehide", cancel)
      cancel()
    }
  }, [])

  useEffect(() => {
    if (phase !== "bracket" || !bracket?.bracketId) return undefined
    const id = setInterval(async () => {
      try {
        const updated = await getWorldCupBracket(bracket.bracketId)
        setBracket(updated)
      } catch {
      }
    }, 5000)
    return () => clearInterval(id)
  }, [phase, bracket?.bracketId])

  // A past tournament opens read-only: its whole bracket plus the learner's own results.
  const [reviewLoading, setReviewLoading] = useState(null)
  const openReview = async (bracketId) => {
    setReviewLoading(bracketId)
    try {
      const view = await getWorldCupBracket(bracketId)
      setBracket(view)
      setTrack(null)
      setPhase("review")
      window.scrollTo({ top: 0 })
    } catch {
      // stays on the list
    } finally {
      setReviewLoading(null)
    }
  }

  const handleTrackSelect = (item) => {
    setTrack(item)
    joinMutation.mutate(item.id)
  }

  const handleLeaveQueue = () => {
    if (track) leaveMutation.mutate(track.id)
  }

  // Only this certification's tournaments (each week's cup is on one certification).
  const focusCertification = String(activeEdition?.certificationId ?? preferredTrack ?? "")
  const myHistory = (historyQuery.data ?? []).filter(
    (h) => h.certificationId == null || !focusCertification || String(h.certificationId) === focusCertification
  )
  const daysLeft = useMemo(() => {
    const [y, m, d] = String(activeEdition?.weekStart ?? "").split("-").map(Number)
    if (!y) return null
    const end = new Date(y, m - 1, d + 6, 23, 59, 59)
    return Math.max(0, Math.floor((end - new Date()) / 86_400_000))
  }, [activeEdition?.weekStart])

  const thisWeekLabel = useMemo(() => {
    // The active edition's week (it can be last published week when this one has none).
    const [y, m, d] = String(activeEdition?.weekStart ?? "").split("-").map(Number)
    const monday = y ? new Date(y, m - 1, d) : new Date()
    if (!y) monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    const sunday = new Date(monday)
    sunday.setDate(sunday.getDate() + 6)
    const fmt = (d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    return `${fmt(monday)} – ${fmt(sunday)}, ${sunday.getFullYear()}`
  }, [activeEdition?.weekStart])

  const SUBTITLE = {
    track: "Choose your certification track",
    review: "Past tournament",
    lobby: "Matchmaking · 8-player tournament",
    found: "Match found!",
    bracket: bracket?.currentRound ? ROUND_LABELS[bracket.currentRound] ?? "Tournament" : "Tournament bracket",
  }

  const myCurrentMatch = useMemo(() => {
    if (!bracket || !myLearnerId) return null
    const currentRound = bracket.currentRound
    if (currentRound === "COMPLETED") return null
    return bracket.matches.find(
      m => m.round === currentRound && (m.player1?.learnerId === myLearnerId || m.player2?.learnerId === myLearnerId)
    )
  }, [bracket, myLearnerId])

  const hasSubmittedCurrentRound = useMemo(() => {
    if (!myCurrentMatch || !myLearnerId) return false
    if (myCurrentMatch.player1?.learnerId === myLearnerId) return myCurrentMatch.player1Score != null
    if (myCurrentMatch.player2?.learnerId === myLearnerId) return myCurrentMatch.player2Score != null
    return false
  }, [myCurrentMatch, myLearnerId])

  const isEliminated = useMemo(() => {
    if (!bracket || !myLearnerId) return false
    if (bracket.currentRound === "COMPLETED") return bracket.winnerLearnerId !== myLearnerId
    for (const m of bracket.matches) {
      if (m.status !== "COMPLETED") continue
      const isInMatch = m.player1?.learnerId === myLearnerId || m.player2?.learnerId === myLearnerId
      if (isInMatch && m.winnerLearnerId !== myLearnerId) return true
    }
    return false
  }, [bracket, myLearnerId])

  const backLink = (
    <TactileButton asChild variant="ghost" size="sm">
      <Link to="/learner/challenges" onClick={goBack}>
        <ArrowLeft className="mr-1.5 size-4" aria-hidden="true" />
        back
      </Link>
    </TactileButton>
  )

  if (locked) {
    return (
      <div className="rebyu-ds rb-arena relative isolate min-h-dvh overflow-x-hidden">
        <PathBackdrop />
        <div className="mx-auto max-w-5xl px-4 pb-16 pt-5 sm:px-6 lg:px-8">
          {backLink}
          <div className="mx-auto mt-10 max-w-sm text-center">
            <div className="relative mx-auto aspect-[4/3] w-full max-w-[14rem]">
              <TrophyArt locked />
            </div>
            <h1 className="mt-4 font-rb-display text-2xl font-extrabold text-rb-eel">Not open yet</h1>
            <p className="mt-2 text-sm text-rb-wolf">
              There is no Champions Cup this week. Each week's exam closes when the week ends; the next bracket
              opens as soon as an admin publishes this week's exam.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rebyu-ds rb-arena relative isolate min-h-dvh overflow-x-hidden">
      <PathBackdrop />

      <div
        className={`mx-auto px-4 pb-16 pt-5 sm:px-6 lg:px-8 ${phase === "bracket" || phase === "review" ? "max-w-[1600px]" : "max-w-5xl"}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          {backLink}
          <div className="flex flex-wrap items-center gap-2">
            {phase === "track" ? (
              <TactileButton asChild variant="ghost" size="sm">
                <Link to="/learner/challenges/world-cup/history" aria-label="Your tournament history" title="Your tournament history">
                  <HistoryIcon className="size-4" aria-hidden="true" />
                  <span className="ml-1.5 hidden sm:inline">history</span>
                  {(historyQuery.data ?? []).length > 0 ? (
                    <span className="ml-1.5 rounded-full bg-rb-fox px-1.5 text-[10px] font-extrabold tabular-nums text-white">
                      {historyQuery.data.length}
                    </span>
                  ) : null}
                </Link>
              </TactileButton>
            ) : null}
            {track ? (
              <span className="rounded-full border border-rb-swan bg-rb-snow px-3 py-1 text-xs font-bold text-rb-eel">
                {track.name}
              </span>
            ) : null}
            {phase === "lobby" ? (
              <TactileButton variant="ghost" size="sm" onClick={handleLeaveQueue} disabled={leaveMutation.isPending}>
                leave queue
              </TactileButton>
            ) : null}
            {phase === "bracket" && bracket?.currentRound === "COMPLETED" ? (
              <TactileButton
                variant="fox"
                size="sm"
                onClick={() => {
                  setPhase("track")
                  setTrack(null)
                  setBracket(null)
                }}
              >
                play again
              </TactileButton>
            ) : null}
          </div>
        </div>

        {phase === "track" ? (
          <section className="mt-6 grid items-center gap-6 md:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-rb-wolf">
                weekly challenge · {thisWeekLabel}
              </p>
              <h1 className="mt-1 font-rb-display text-4xl font-extrabold leading-none text-rb-eel sm:text-5xl">
                Champions Cup
              </h1>
              {activeEdition?.certificationTitle ? (
                <p className="mt-1 font-rb-display text-xl font-extrabold text-rb-fox-lip sm:text-2xl">
                  {activeEdition.certificationTitle}
                </p>
              ) : null}
              <div className="mt-3 h-[3px] w-24 rounded-full bg-rb-fox" />
              <p className="mt-3 max-w-md text-sm leading-6 text-rb-wolf">
                This week's knockout on {activeEdition?.certificationTitle ?? "your certification"}. Eight players,
                three rounds, each with its own questions. If nobody else joins within two minutes, bots take the
                empty seats.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-rb-wolf">
                <InfoChip icon={Users}>8 players</InfoChip>
                <InfoChip icon={Shield}>3 knockout rounds</InfoChip>
                {daysLeft != null ? (
                  <InfoChip icon={CalendarDays}>
                    {daysLeft === 0 ? "last day" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
                  </InfoChip>
                ) : null}
              </div>
              {tracks.length > 0 ? (
                <TactileButton
                  variant="fox"
                  className="mt-6 w-full sm:w-auto"
                  disabled={joinMutation.isPending}
                  onClick={() => handleTrackSelect(tracks[0])}
                >
                  {joinMutation.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Zap className="mr-2 size-4" aria-hidden="true" />
                  )}
                  enter the queue
                </TactileButton>
              ) : null}
            </div>
            <div className="relative mx-auto aspect-[4/3] w-full max-w-[16rem] md:max-w-[18rem]">
              <TrophyArt />
            </div>
          </section>
        ) : (
          <div className="mt-6 border-b-2 border-rb-swan pb-2">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-rb-wolf">champions cup</p>
            <h1 className="font-rb-display text-2xl font-extrabold text-rb-eel sm:text-3xl">{SUBTITLE[phase]}</h1>
          </div>
        )}

        {phase === "track" && portalQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm font-semibold text-rb-wolf">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Loading tracks…
          </div>
        ) : null}

        {phase === "track" && !portalQuery.isLoading && activeEdition && tracks.length === 0 ? (
          <div className="mx-auto mt-12 max-w-sm text-center">
            <h2 className="font-rb-display text-2xl font-extrabold text-rb-eel">Not your track this week</h2>
            <p className="mt-2 text-sm text-rb-wolf">
              This week's Champions Cup is played on {activeEdition.certificationTitle ?? "another certification"}.
              Enrol in it to enter the bracket.
            </p>
            <TactileButton asChild variant="fox" size="sm" className="mt-5">
              <Link to="/learner/certifications">browse certifications</Link>
            </TactileButton>
          </div>
        ) : null}

        {phase === "track" && tracks.length > 0 ? (
          <>
            <section className="mt-12">
              <SectionHeading eyebrow="how it runs" title="Three rounds to the cup" />
              <ol className="mx-auto mt-5 grid max-w-2xl grid-cols-3 gap-2 sm:gap-6">
                {[
                  { name: "Quarterfinals", note: "8 players · 4 matches", depth: 14 },
                  { name: "Semifinals", note: "4 players · 2 matches", depth: 26 },
                  { name: "Final", note: "2 players · 1 match", depth: 40, final: true },
                ].map((round, i) => (
                  <li key={round.name} className="flex flex-col items-center text-center">
                    <div className="relative" style={{ width: 96, height: 48 + round.depth }}>
                      <Plinth
                        w={96}
                        h={48}
                        d={round.depth}
                        lift={0}
                        top={round.final ? "color-mix(in oklab, var(--color-rb-fox) 84%, white)" : "var(--color-rb-snow)"}
                        face={round.final ? "var(--color-rb-fox)" : "var(--color-rb-polar)"}
                        lip={round.final ? "var(--color-rb-fox-lip)" : "var(--color-rb-swan)"}
                      />
                      <span
                        className={`absolute inset-x-0 top-0 grid place-items-center font-rb-display text-xl font-extrabold ${
                          round.final ? "text-white" : "text-rb-fox-lip"
                        }`}
                        style={{ height: 48 }}
                      >
                        {round.final ? <Trophy className="size-6" aria-hidden="true" /> : i + 1}
                      </span>
                    </div>
                    <p className="mt-2 font-rb-display text-sm font-extrabold text-rb-eel sm:text-base">{round.name}</p>
                    <p className="text-[11px] font-semibold text-rb-wolf">{round.note}</p>
                  </li>
                ))}
              </ol>
            </section>

            <ArenaPodium arenaId="worldcup" title="Champions Cup rankings" />
          </>
        ) : null}

        {phase === "review" && bracket ? (
          <section className="mt-6">
            <MyResults bracket={bracket} myLearnerId={myLearnerId} />
            <FitToWidth className="mt-6">
              <LiveBracket bracket={bracket} myLearnerId={myLearnerId} />
            </FitToWidth>
          </section>
        ) : null}

        {phase === "lobby" ? (
          <section className="mx-auto flex min-h-[calc(100dvh-14rem)] w-full max-w-5xl flex-col items-center justify-center py-8">
            <div className="relative grid size-56 place-items-center sm:size-64">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 160 160" aria-hidden="true">
                <circle cx="80" cy="80" r="70" fill="none" stroke="var(--color-rb-swan)" strokeWidth="8" />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke={queueTimer <= 30 ? "var(--color-rb-cardinal)" : "var(--color-rb-fox)"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 70}
                  strokeDashoffset={2 * Math.PI * 70 * (1 - queueTimer / QUEUE_TIMEOUT)}
                  className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                />
              </svg>
              <span
                className={`font-rb-display text-6xl font-extrabold tabular-nums sm:text-7xl ${
                  queueTimer <= 30 ? "text-rb-cardinal-lip" : "text-rb-eel"
                }`}
              >
                {Math.floor(queueTimer / 60)}:{String(queueTimer % 60).padStart(2, "0")}
              </span>
            </div>

            <p className="mt-6 font-rb-display text-3xl font-extrabold text-rb-eel sm:text-4xl">Finding opponents…</p>
            <p className="mt-2 max-w-md text-center text-sm font-semibold text-rb-wolf">If nobody else joins before the timer runs out, bots fill the empty seats.</p>

            <div className="mt-12 grid w-full max-w-4xl grid-cols-4 gap-x-3 gap-y-6 sm:grid-cols-8">
              {Array.from({ length: queueRequired }).map((_, i) => {
                const filled = i < queueSize
                // Smaller seats on phones so four fit across.
                const seat = typeof window !== "undefined" && window.innerWidth < 640 ? 64 : 92
                return (
                  <div key={i} className="flex flex-col items-center">
                    <div className="relative" style={{ width: seat, height: seat * 0.98 }}>
                      <Plinth
                        w={seat}
                        h={seat / 2}
                        d={Math.round(seat * 0.17)}
                        lift={Math.round(seat * 0.3)}
                        top={filled ? "color-mix(in oklab, var(--color-rb-fox) 84%, white)" : "var(--color-rb-snow)"}
                        face={filled ? "var(--color-rb-fox)" : "var(--color-rb-polar)"}
                        lip={filled ? "var(--color-rb-fox-lip)" : "var(--color-rb-swan)"}
                      />
                      <span
                        className={`absolute inset-x-0 top-0 grid place-items-center ${filled ? "rb-pop-in text-white" : "text-rb-hare"}`}
                        style={{ height: Math.round(seat * 0.3 + seat / 4) }}
                      >
                        {filled ? (
                          <span className="font-rb-display text-2xl font-extrabold drop-shadow-[0_2px_1px_rgb(0_0_0/0.2)]">
                            {i + 1}
                          </span>
                        ) : (
                          <Users className="size-6" aria-hidden="true" />
                        )}
                      </span>
                    </div>
                    <span className={`mt-1.5 text-sm font-bold ${filled ? "text-rb-fox-lip" : "text-rb-hare"}`}>
                      {filled ? (i === 0 ? "you" : "ready") : "open"}
                    </span>
                  </div>
                )
              })}
            </div>

            <p className="mt-8 text-base font-bold text-rb-wolf">
              <span className="tabular-nums text-rb-eel">
                {queueSize} / {queueRequired}
              </span>{" "}
              players in the queue
            </p>
          </section>
        ) : null}

        {phase === "found" ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-rb-eel/50 px-5 backdrop-blur-sm">
            <div className="rb-pop-in w-full max-w-sm rounded-3xl border-2 border-rb-swan bg-rb-snow p-8 text-center shadow-[0_6px_0_var(--color-rb-swan)]">
              <div className="relative mx-auto aspect-[4/3] w-40">
                <TrophyArt />
              </div>
              <p className="mt-2 font-rb-display text-3xl font-extrabold text-rb-eel">Match found!</p>
              <p className="mt-2 text-sm text-rb-wolf">The bracket is being drawn…</p>
            </div>
          </div>
        ) : null}

        {phase === "bracket" && bracket ? (
          <section className="mt-6">
            {myCurrentMatch && !isEliminated && !hasSubmittedCurrentRound ? (
              <FaceOff
                round={ROUND_LABELS[bracket.currentRound] ?? "Your match"}
                questionCount={myCurrentMatch.questionCount}
                you={
                  (myCurrentMatch.player1?.learnerId === myLearnerId ? myCurrentMatch.player1 : myCurrentMatch.player2)
                    ?.displayName ?? "You"
                }
                opponent={
                  (myCurrentMatch.player1?.learnerId === myLearnerId ? myCurrentMatch.player2 : myCurrentMatch.player1)
                    ?.displayName ?? "Opponent"
                }
                onPlay={() => {
                  if (worldCup?.examId) {
                    navigate(`/learner/assessments/${worldCup.examId}?arena=worldcup&matchId=${myCurrentMatch.matchId}`)
                  }
                }}
              />
            ) : null}

            {isEliminated ? (
              <p className="mx-auto w-full max-w-lg rounded-2xl border-2 border-rb-swan bg-rb-snow p-4 text-sm font-bold text-rb-wolf">
                You're out of this bracket. You can still follow the rest of it here.
              </p>
            ) : null}

            {hasSubmittedCurrentRound && !isEliminated ? (
              <div className="mx-auto flex w-full max-w-lg items-center gap-3 rounded-2xl border-2 border-rb-swan bg-rb-snow p-4">
                <Loader2 className="size-5 animate-spin text-rb-wolf" aria-hidden="true" />
                <p className="text-sm font-bold text-rb-wolf">Waiting for your opponent to finish…</p>
              </div>
            ) : null}

            <FitToWidth className="mt-6">
              <LiveBracket bracket={bracket} myLearnerId={myLearnerId} />
            </FitToWidth>
          </section>
        ) : null}
      </div>
    </div>
  )
}

/* Scales its content down to the available width (never up), so a wide bracket
   always shows whole instead of behind a scrollbar. */
function FitToWidth({ children, className = "" }) {
  const outerRef = useRef(null)
  const innerRef = useRef(null)
  const [fit, setFit] = useState({ scale: 1, height: undefined })

  useEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return undefined
    const measure = () => {
      const natural = inner.scrollWidth
      const scale = natural > 0 ? Math.min(1, outer.clientWidth / natural) : 1
      setFit({ scale, height: inner.scrollHeight * scale })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(outer)
    observer.observe(inner)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={outerRef} className={`w-full overflow-hidden ${className}`} style={{ height: fit.height }}>
      <div
        ref={innerRef}
        className="relative left-1/2 w-max py-4"
        style={{ transform: `translateX(-50%) scale(${fit.scale})`, transformOrigin: "top center" }}
      >
        {children}
      </div>
    </div>
  )
}

/* The learner's own matches in a tournament, round by round. */
function MyResults({ bracket, myLearnerId }) {
  const mine = (bracket.matches ?? [])
    .filter((m) => m.player1?.learnerId === myLearnerId || m.player2?.learnerId === myLearnerId)
    .sort((a, b) => ["QUARTERFINAL", "SEMIFINAL", "FINAL"].indexOf(a.round) - ["QUARTERFINAL", "SEMIFINAL", "FINAL"].indexOf(b.round))
  const champion = bracket.winnerLearnerId != null && bracket.winnerLearnerId === myLearnerId
  const winner = (bracket.players ?? []).find((p) => p.learnerId === bracket.winnerLearnerId)
  const when = bracket.createdAt
    ? new Date(bracket.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : null

  return (
    <div className="mx-auto w-full max-w-2xl rounded-3xl border-2 border-rb-swan bg-rb-snow p-5 shadow-[0_4px_0_var(--color-rb-swan)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-rb-wolf">your results{when ? ` · ${when}` : ""}</p>
          <p className="font-rb-display text-xl font-extrabold text-rb-eel">
            {champion ? "You won the cup" : winner ? `${winner.displayName} won the cup` : "Not finished"}
          </p>
        </div>
        {champion ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-rb-fox px-3 py-1 text-xs font-extrabold text-white">
            <Trophy className="size-3.5" aria-hidden="true" /> champion
          </span>
        ) : null}
      </div>

      {mine.length === 0 ? (
        <p className="mt-3 text-sm text-rb-wolf">You did not play a match in this bracket.</p>
      ) : (
        <ol className="mt-4 space-y-2">
          {mine.map((m) => {
            const meFirst = m.player1?.learnerId === myLearnerId
            const myScore = meFirst ? m.player1Score : m.player2Score
            const theirScore = meFirst ? m.player2Score : m.player1Score
            const opponent = meFirst ? m.player2 : m.player1
            const done = m.status === "COMPLETED"
            const won = done && m.winnerLearnerId === myLearnerId
            return (
              <li
                key={m.matchId}
                className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-2.5 ${
                  !done ? "border-rb-swan bg-rb-polar" : won ? "border-rb-feather/40 bg-rb-feather-wash" : "border-rb-cardinal/30 bg-rb-cardinal-wash"
                }`}
              >
                <span className="w-24 shrink-0 text-xs font-extrabold text-rb-wolf">{ROUND_LABELS[m.round] ?? m.round}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-rb-eel">vs {opponent?.displayName ?? "—"}</span>
                <span className="shrink-0 font-rb-display text-base font-extrabold tabular-nums text-rb-eel">
                  {myScore != null ? Math.round(myScore) : "—"}
                  <span className="mx-1 text-rb-hare">–</span>
                  {theirScore != null ? Math.round(theirScore) : "—"}
                </span>
                <span
                  className={`w-12 shrink-0 text-right text-[11px] font-extrabold uppercase ${
                    !done ? "text-rb-wolf" : won ? "text-rb-feather-ink" : "text-rb-cardinal-lip"
                  }`}
                >
                  {!done ? "open" : won ? "won" : "lost"}
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

const TRACK_TONES = {
  bee: { faceVar: "var(--color-rb-bee)", lipVar: "var(--color-rb-bee-lip)" },
  macaw: { faceVar: "var(--color-rb-macaw)", lipVar: "var(--color-rb-macaw-lip)" },
  beetle: { faceVar: "var(--color-rb-beetle)", lipVar: "var(--color-rb-beetle-lip)" },
}

function InfoChip({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-rb-swan bg-rb-snow px-2.5 py-1">
      <Icon className="size-3.5" aria-hidden="true" />
      {children}
    </span>
  )
}

function SectionHeading({ eyebrow, title }) {
  return (
    <div className="border-b-2 border-rb-swan pb-2">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-rb-wolf">{eyebrow}</p>
      <h2 className="font-rb-display text-2xl font-extrabold text-rb-eel">{title}</h2>
    </div>
  )
}

function TrackCard({ item, preferred, weekLabel, disabled, onSelect }) {
  const tone = TRACK_TONES[item.tone] ?? TRACK_TONES.macaw
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`group flex flex-col rounded-2xl border-2 bg-rb-snow p-4 text-left transition hover:-translate-y-0.5 active:translate-y-[3px] disabled:opacity-60 ${
        preferred
          ? "border-rb-fox/50 shadow-[0_4px_0_var(--color-rb-fox-wash)]"
          : "border-rb-swan shadow-[0_4px_0_var(--color-rb-swan)] hover:border-rb-hare"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0" style={{ width: 76, height: 66 }}>
          <Plinth
            w={76}
            h={38}
            d={12}
            lift={16}
            top={`color-mix(in oklab, ${tone.faceVar} 84%, white)`}
            face={tone.faceVar}
            lip={tone.lipVar}
          />
          <span
            className="absolute inset-x-0 top-0 grid place-items-center text-white drop-shadow-[0_4px_2px_rgb(0_0_0/0.18)] transition-transform duration-200 group-hover:-translate-y-1"
            style={{ height: 35 }}
          >
            <Trophy className="size-7" aria-hidden="true" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          {preferred ? (
            <span className="mb-1 inline-block rounded-full bg-rb-fox-wash px-2 py-0.5 text-[10px] font-extrabold uppercase text-rb-fox-lip">
              your learning path
            </span>
          ) : null}
          <h3 className="font-rb-display text-lg font-extrabold leading-tight text-rb-eel">{item.name}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-rb-wolf">{item.blurb}</p>
        </div>
      </div>
      <div className="mt-4 space-y-3 border-t border-rb-swan pt-3">
        <span className="flex items-center gap-1 text-[11px] font-bold text-rb-wolf">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          {weekLabel} · 8-player bracket
        </span>
        <span className="flex w-full items-center justify-center gap-1 rounded-xl bg-rb-fox px-4 py-2.5 font-rb-display text-sm font-extrabold lowercase text-white shadow-[0_3px_0_var(--color-rb-fox-lip)] transition group-hover:brightness-105 group-active:translate-y-[2px] group-active:shadow-[0_1px_0_var(--color-rb-fox-lip)]">
          enter queue
          <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </button>
  )
}

/* Inked trophy on a plinth, in the learning path's style. */
function TrophyArt({ locked = false }) {
  const reduceMotion = useReducedMotion()
  const INK = "#2c2a26"
  const gold = locked ? "color-mix(in oklab, var(--color-rb-swan) 78%, var(--color-rb-hare))" : "#f5b72f"
  const goldLip = locked ? "var(--color-rb-hare)" : "#c98a12"
  return (
    <svg viewBox="0 0 220 165" className="size-full" aria-hidden="true">
      <ellipse cx="110" cy="154" rx="78" ry="8" fill="rgb(0 0 0 / 0.12)" />
      {/* plinth */}
      <path d="M 40 122 L 110 140 L 110 152 L 40 134 Z" fill={locked ? "var(--color-rb-hare)" : "var(--color-rb-fox-lip)"} />
      <path d="M 180 122 L 110 140 L 110 152 L 180 134 Z" fill={locked ? "var(--color-rb-swan)" : "var(--color-rb-fox)"} />
      <path
        d="M 110 104 L 180 122 L 110 140 L 40 122 Z"
        fill={locked ? "var(--color-rb-snow)" : "color-mix(in oklab, var(--color-rb-fox) 84%, white)"}
      />
      <g stroke={INK} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        {/* base and stem */}
        <rect x="88" y="104" width="44" height="14" rx="3" fill={goldLip} />
        <path d="M 102 88 L 118 88 L 114 104 L 106 104 Z" fill={gold} />
        {/* handles */}
        <path d="M 74 34 Q 52 34 54 52 Q 56 68 80 70" fill="none" strokeWidth="5" stroke={INK} />
        <path d="M 74 34 Q 52 34 54 52 Q 56 68 80 70" fill="none" strokeWidth="2.4" stroke={gold} />
        <path d="M 146 34 Q 168 34 166 52 Q 164 68 140 70" fill="none" strokeWidth="5" stroke={INK} />
        <path d="M 146 34 Q 168 34 166 52 Q 164 68 140 70" fill="none" strokeWidth="2.4" stroke={gold} />
        {/* cup */}
        <path d="M 70 24 L 150 24 Q 150 82 110 88 Q 70 82 70 24 Z" fill={gold} />
        <path d="M 70 24 L 150 24" strokeWidth="3" />
        {/* star plate */}
        <path
          d="M 110 38 L 114 47 L 124 48 L 116.5 54.5 L 119 64 L 110 59 L 101 64 L 103.5 54.5 L 96 48 L 106 47 Z"
          fill={locked ? "var(--color-rb-snow)" : PAPER_TINT}
          strokeWidth="2"
        />
      </g>
      {/* cup sheen */}
      <path d="M 82 32 Q 82 62 96 76" fill="none" stroke="rgb(255 255 255 / 0.45)" strokeWidth="3" strokeLinecap="round" />
      {/* pennant */}
      {locked ? null : (
        <g>
          <path d="M 176 30 L 176 104" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
          <motion.path
            d="M 176 32 L 204 40 L 176 50 Z"
            fill="#e0506a"
            stroke={INK}
            strokeWidth="2.2"
            strokeLinejoin="round"
            style={{ originX: "176px", originY: "41px" }}
            animate={reduceMotion ? undefined : { scaleX: [1, 0.82, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </g>
      )}
    </svg>
  )
}

const PAPER_TINT = "#fdfcf8"
