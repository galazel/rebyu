import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { motion, useReducedMotion } from "framer-motion"

import { ArrowLeft, Check, ChevronRight, Clock, Crown, Loader2, Lock, Shield, Trophy, Zap } from "@/components/icons"
import { TactileButton } from "@/components/rebyu/rebyu-ui.jsx"
import { PathBackdrop, Plinth } from "@/components/challenges/arena-lobby.jsx"
import { ArenaPodium } from "@/components/challenges/arena-podium.jsx"
import { ScoreBreakdown } from "@/components/challenges/score-breakdown.jsx"
import { getLearnerPortalData } from "@/services/learnerService.js"
import { getWorldCupBracketForMatch } from "@/services/challengeService.js"
import { cn } from "@/lib/utils"

/*
 * The end of a challenge run, shown as the end of a game round rather than an
 * assessment report: a headline, the round's score, what it unlocked, and the
 * challenge's podium. Champions Cup compares the learner with their opponent;
 * CodeStrike and Blueprint show the stage and open the next one.
 */

const ARENA = {
  worldcup: { name: "Champions Cup", lobby: "/learner/challenges/world-cup", faceVar: "var(--color-rb-fox)", lipVar: "var(--color-rb-fox-lip)", line: "bg-rb-fox" },
  codestrike: { name: "CodeStrike", lobby: "/learner/challenges/codestrike", faceVar: "var(--color-rb-feather)", lipVar: "var(--color-rb-feather-lip)", line: "bg-rb-feather" },
  blueprint: { name: "Blueprint Arena", lobby: "/learner/challenges/blueprint-arena", faceVar: "var(--color-rb-macaw)", lipVar: "var(--color-rb-macaw-lip)", line: "bg-rb-macaw" },
}

const ROUND_NAMES = { QUARTERFINAL: "Quarterfinals", SEMIFINAL: "Semifinals", FINAL: "Final" }
const NEXT_ROUND = { QUARTERFINAL: "semifinals", SEMIFINAL: "final" }

/** Which arena a result belongs to: from the navigation state, else from its title. */
export function arenaOfResult(result, state) {
  if (state?.isWorldCup) return "worldcup"
  if (state?.arenaId && ARENA[state.arenaId]) return state.arenaId
  const title = String(result?.assessmentTitle ?? "").toLowerCase()
  if (title.includes("world cup") || title.includes("champions")) return "worldcup"
  if (title.includes("blueprint")) return "blueprint"
  return "codestrike"
}

function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.round(Number(totalSeconds) || 0))
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}m ${String(s % 60).padStart(2, "0")}s` : `${s}s`
}

export default function ChallengeResult({ result, state, marking }) {
  const arenaId = arenaOfResult(result, state)
  const arena = ARENA[arenaId]
  const reduceMotion = useReducedMotion()

  const percentage = Math.round(Number(result.percentage ?? 0))
  const correct = Number(result.correctCount ?? 0)
  const total =
    correct + Number(result.incorrectCount ?? 0) + Number(result.pendingCount ?? 0) + Number(result.unansweredCount ?? 0)

  return (
    <div className="rebyu-ds relative isolate min-h-dvh overflow-x-hidden bg-rb-polar">
      <PathBackdrop />
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-5 sm:px-6">
        <TactileButton asChild variant="ghost" size="sm">
          {/* The main challenge page; the round's own button below opens the bracket. */}
          <Link replace to={arena.lobby}>
            <ArrowLeft className="mr-1.5 size-4" aria-hidden="true" />
            {arena.name}
          </Link>
        </TactileButton>

        {arenaId === "worldcup" ? (
          <WorldCupRound
            arena={arena}
            matchId={state?.matchId}
            percentage={percentage}
            correct={correct}
            total={total}
            duration={result.durationSeconds}
            reduceMotion={reduceMotion}
          />
        ) : (
          <StageRound
            arena={arena}
            arenaId={arenaId}
            result={result}
            state={state}
            percentage={percentage}
            correct={correct}
            total={total}
            marking={marking}
            reduceMotion={reduceMotion}
          />
        )}

        {!marking ? <ScoreBreakdown score={result.challengeScore} arena={arena} /> : null}

        <ArenaPodium arenaId={arenaId} title={`${arena.name} rankings`} />
      </div>
    </div>
  )
}

function Headline({ eyebrow, title, sub, arena, reduceMotion }) {
  return (
    <motion.div
      className="mt-8 text-center"
      initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 240, damping: 18 }}
    >
      <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-rb-wolf">{eyebrow}</p>
      <h1 className="mt-1 font-rb-display text-4xl font-extrabold leading-none text-rb-eel sm:text-5xl">{title}</h1>
      <div className={cn("mx-auto mt-3 h-[3px] w-20 rounded-full", arena.line)} />
      {sub ? <p className="mx-auto mt-3 max-w-md text-sm text-rb-wolf">{sub}</p> : null}
    </motion.div>
  )
}

function StatChip({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-rb-swan bg-rb-snow px-3 py-1 text-xs font-bold text-rb-wolf">
      <Icon className="size-3.5" aria-hidden="true" />
      {children}
    </span>
  )
}

/* Champions Cup: the round's scoreboard against the opponent. */
function WorldCupRound({ arena, matchId, percentage, correct, total, duration, reduceMotion }) {
  const meQuery = useQuery({ queryKey: ["learner-portal-data"], queryFn: getLearnerPortalData, staleTime: 5 * 60_000 })
  const myId = meQuery.data?.learnerId
  const bracketQuery = useQuery({
    queryKey: ["worldcup-match-bracket", String(matchId)],
    queryFn: () => getWorldCupBracketForMatch(matchId),
    enabled: matchId != null,
    // Keep checking until the opponent has handed in too.
    refetchInterval: (query) => {
      const match = (query.state.data?.matches ?? []).find((m) => String(m.matchId) === String(matchId))
      return match && match.status !== "COMPLETED" ? 4000 : false
    },
  })
  const match = (bracketQuery.data?.matches ?? []).find((m) => String(m.matchId) === String(matchId)) ?? null
  const meFirst = match ? match.player1?.learnerId === myId : true
  const opponent = match ? (meFirst ? match.player2 : match.player1) : null
  const theirScore = match ? (meFirst ? match.player2Score : match.player1Score) : null
  const done = match?.status === "COMPLETED"
  const won = done && match.winnerLearnerId === myId
  const round = match ? ROUND_NAMES[match.round] ?? "Round" : "Round"
  const champion = done && won && match.round === "FINAL"

  const bracketDone = bracketQuery.data?.currentRound === "COMPLETED"
  const title = !match
    ? bracketQuery.isLoading
      ? "Checking the bracket…"
      : "Round handed in"
    : champion
      ? "Champion!"
      : !done
        ? "Waiting for your opponent"
        : won
          ? "You advance!"
          : "Knocked out"
  const sub = !match
    ? bracketQuery.isLoading
      ? null
      : "Your score is in. Open the bracket to follow the round."
    : champion
      ? "You won this week's Champions Cup."
      : !done
        ? `${opponent?.displayName ?? "Your opponent"} is still answering. This updates on its own.`
        : won
          ? `On to the ${NEXT_ROUND[match.round] ?? "next round"}.`
          : bracketDone
            ? `${opponent?.displayName ?? "Your opponent"} scored higher. The bracket has finished; its full result is under your past tournaments.`
            : `${opponent?.displayName ?? "Your opponent"} scored higher this round. Follow the rest of the bracket.`

  return (
    <>
      <Headline eyebrow={`${arena.name} · ${round}`} title={title} sub={sub} arena={arena} reduceMotion={reduceMotion} />

      <motion.div
        className="mx-auto mt-8 flex max-w-lg items-end justify-center gap-4 sm:gap-8"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
      >
        <ScoreSeat label="You" score={percentage} highlight={!done || won} winner={done && won} tone={arena} />
        <span className="mb-16 font-rb-display text-2xl font-extrabold text-rb-hare">vs</span>
        <ScoreSeat
          label={opponent?.displayName ?? "Opponent"}
          score={theirScore != null ? Math.round(theirScore) : null}
          highlight={done && !won}
          winner={done && !won}
          tone={arena}
          waiting={match != null && theirScore == null}
        />
      </motion.div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <StatChip icon={Check}>
          {correct} of {total} right
        </StatChip>
        <StatChip icon={Clock}>{formatDuration(duration)}</StatChip>
      </div>

      <div className="mt-6 flex justify-center">
        <TactileButton asChild variant="fox">
          <Link replace to={matchId != null ? `${arena.lobby}?match=${matchId}` : arena.lobby}>
            {done && won && !champion ? "play the next round" : "back to bracket"}
            <ChevronRight className="ml-1 size-4" aria-hidden="true" />
          </Link>
        </TactileButton>
      </div>
    </>
  )
}

function ScoreSeat({ label, score, highlight, winner, tone, waiting }) {
  const depth = winner ? 46 : 26
  return (
    <div className="flex w-32 flex-col items-center">
      {winner ? <Crown className="mb-1 size-6 text-[#f5b72f] drop-shadow-[0_2px_0_#c98a12]" aria-hidden="true" /> : null}
      <p className="font-rb-display text-4xl font-extrabold tabular-nums text-rb-eel">
        {waiting ? <Loader2 className="size-7 animate-spin text-rb-hare" aria-label="waiting" /> : score ?? "—"}
        {!waiting && score != null ? <span className="text-lg text-rb-wolf">%</span> : null}
      </p>
      <div className="relative mt-2" style={{ width: 112, height: 56 + depth }}>
        <Plinth
          w={112}
          h={56}
          d={depth}
          lift={0}
          top={highlight ? `color-mix(in oklab, ${tone.faceVar} 84%, white)` : "var(--color-rb-snow)"}
          face={highlight ? tone.faceVar : "var(--color-rb-polar)"}
          lip={highlight ? tone.lipVar : "var(--color-rb-swan)"}
        />
      </div>
      <p className="mt-2 w-full truncate text-center text-sm font-bold text-rb-eel" title={label}>
        {label}
      </p>
    </div>
  )
}

/* CodeStrike / Blueprint: the stage's score and the stage it opened. */
function StageRound({ arena, arenaId, result, state, percentage, correct, total, marking, reduceMotion }) {
  const index = Number.isFinite(Number(state?.questionIndex)) ? Number(state.questionIndex) : null
  const stageCount = Number.isFinite(Number(state?.totalProblems)) ? Number(state.totalProblems) : null
  const stageNo = index != null ? index + 1 : null
  const hasNext = index != null && stageCount != null && index + 1 < stageCount
  const nextTo = hasNext
    ? `/learner/assessments/${result.assessmentId}?q=${index + 1}&total=${stageCount}&arena=${arenaId}`
    : null
  const solved = percentage >= 50

  return (
    <>
      <Headline
        eyebrow={`${arena.name}${stageNo ? ` · stage ${stageNo}` : ""}`}
        title={marking ? "Checking your work…" : solved ? "Stage cleared!" : "Stage handed in"}
        sub={
          marking
            ? "Your answer is being graded. This usually takes under a minute."
            : hasNext
              ? `Stage ${stageNo + 1} is unlocked.`
              : stageCount != null
                ? "That was the last stage. Every stage is open to replay."
                : null
        }
        arena={arena}
        reduceMotion={reduceMotion}
      />

      <motion.div
        className="mx-auto mt-8 flex max-w-sm flex-col items-center"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
      >
        <p className="font-rb-display text-6xl font-extrabold tabular-nums text-rb-eel">
          {marking ? <Loader2 className="size-10 animate-spin text-rb-hare" aria-label="grading" /> : percentage}
          {!marking ? <span className="text-2xl text-rb-wolf">%</span> : null}
        </p>
        <div className="relative mt-3" style={{ width: 128, height: 64 + 30 }}>
          <Plinth
            w={128}
            h={64}
            d={30}
            lift={0}
            top={`color-mix(in oklab, ${arena.faceVar} 84%, white)`}
            face={arena.faceVar}
            lip={arena.lipVar}
          />
          <span className="absolute inset-x-0 top-0 grid place-items-center text-white" style={{ height: 64 }}>
            {solved ? <Trophy className="size-8" aria-hidden="true" /> : <Shield className="size-8" aria-hidden="true" />}
          </span>
        </div>
      </motion.div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <StatChip icon={Check}>
          {correct} of {total} {arenaId === "blueprint" ? "checks met" : "tests passed"}
        </StatChip>
        <StatChip icon={Clock}>{formatDuration(result.durationSeconds)}</StatChip>
        {stageCount != null ? (
          <StatChip icon={hasNext ? Zap : Lock}>
            {stageNo} of {stageCount} stages
          </StatChip>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {nextTo ? (
          <TactileButton asChild>
            <Link to={nextTo}>
              stage {stageNo + 1}
              <ChevronRight className="ml-1 size-4" aria-hidden="true" />
            </Link>
          </TactileButton>
        ) : null}
        <TactileButton asChild variant={nextTo ? "ghost" : "feather"}>
          <Link replace to={arena.lobby}>back to stages</Link>
        </TactileButton>
        <TactileButton asChild variant="ghost">
          <Link
            to={
              index != null
                ? `/learner/assessments/${result.assessmentId}?q=${index}${stageCount ? `&total=${stageCount}` : ""}&arena=${arenaId}`
                : `/learner/assessments/${result.assessmentId}`
            }
          >
            play again
          </Link>
        </TactileButton>
      </div>
    </>
  )
}
