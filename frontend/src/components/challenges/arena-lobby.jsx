import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { motion, useReducedMotion } from "framer-motion"

import { ArrowLeft, Check, ChevronRight, Clock, Code2, Loader2, Lock, Network, Trophy, Zap } from "@/components/icons"
import { TactileButton } from "@/components/rebyu/rebyu-ui.jsx"
import { CHALLENGE_ARENAS_KEY, getChallengeArenas, getArenaProblems, getArenaProgress } from "@/services/challengeService.js"
import { cn } from "@/lib/utils"
import { ArenaPodium } from "@/components/challenges/arena-podium.jsx"

/*
 * The arena lobby is drawn in the learning path's own language: isometric plinths
 * in one tone, plain text labels, a thin trail and the dotted backdrop. On wider
 * screens the stages run left to right and the trail scrolls sideways; on phones
 * it runs top to bottom like the learning path.
 */

const INK = "#2c2a26"
const PAPER = "#fdfcf8"

const TONES = {
  codestrike: {
    faceVar: "var(--color-rb-feather)",
    lipVar: "var(--color-rb-feather-lip)",
    face: "bg-rb-feather",
    ink: "text-rb-feather-ink",
  },
  blueprint: {
    faceVar: "var(--color-rb-macaw)",
    lipVar: "var(--color-rb-macaw-lip)",
    face: "bg-rb-macaw",
    ink: "text-rb-macaw-lip",
  },
}

const DIFFICULTY = {
  EASY: { label: "easy", chip: "bg-rb-bee-wash text-rb-bee-ink" },
  AVERAGE: { label: "average", chip: "bg-rb-fox-wash text-rb-fox-lip" },
  HARD: { label: "hard", chip: "bg-rb-cardinal-wash text-rb-cardinal-lip" },
}

const LANGUAGE_LABELS = { PYTHON: "Python", JAVA: "Java", "C++": "C++", C: "C", JAVASCRIPT: "JavaScript", "C#": "C#" }

/* Plinth sizes follow the learning path's nodes, a little smaller. */
const PLINTH_W = 128
const PLINTH_H = 64
const PLINTH_D = 20
const LIFT = 30
const NODE_H = LIFT + PLINTH_H + PLINTH_D

/* Sideways trail (tablet and up). */
const COL = 240
const PAD_X = 160
const TOP_HIGH = 130
const TOP_LOW = 210
const MAP_H = 470

/* Top-to-bottom trail (phones). */
const V_WIDTH = 320
const V_OFFSET = 52
const V_TOP = 64
const V_ROW = 248

function useWideScreen() {
  const query = "(min-width: 768px)"
  const [wide, setWide] = useState(() => (typeof window === "undefined" ? true : window.matchMedia(query).matches))
  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setWide(media.matches)
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [])
  return wide
}

export function ArenaLobby({ arenaId, name, blurb }) {
  const location = useLocation()
  const navigate = useNavigate()
  const tone = TONES[arenaId] ?? TONES.codestrike
  const arenasQuery = useQuery({ queryKey: [CHALLENGE_ARENAS_KEY], queryFn: getChallengeArenas, staleTime: 60_000 })

  const arena = (arenasQuery.data ?? []).find((row) => row.arenaId === arenaId) ?? null
  const configured = Boolean(arena?.configured)
  const settings = arena?.settings ?? {}
  const timePerProblem =
    settings.timePerProblem ??
    (settings.timeLimit > 0 && arena?.problemCount > 0 ? Math.round(settings.timeLimit / arena.problemCount) : 10)

  const problemsQuery = useQuery({
    queryKey: ["arena-problems", arenaId],
    queryFn: () => getArenaProblems(arenaId),
    enabled: configured,
    staleTime: 60_000,
  })

  // Stages unlock in order: each opens once the one before it has been handed in.
  // Refetched every visit so a finished stage opens the next one on return.
  const progressQuery = useQuery({
    queryKey: ["arena-progress", arenaId],
    queryFn: () => getArenaProgress(arenaId),
    enabled: configured,
    staleTime: 0,
    refetchOnMount: "always",
  })
  const completed = new Set((progressQuery.data ?? []).map(Number))

  const problems = problemsQuery.data ?? []
  const problemCount = arena?.problemCount ?? problems.length
  const pointsPerProblem = Number(settings.pointsPerProblem) || 10
  const stages = problems.length ? problems : Array.from({ length: problemCount }, () => null)
  const totalPoints = stages.reduce((sum, p) => sum + Number(p?.points ?? pointsPerProblem), 0)
  const locked = !configured && arenasQuery.isSuccess

  // Back returns to wherever the learner came from (e.g. their learning path); the
  // link target is only the fallback when the page was opened directly.
  const goBack = (event) => {
    if (location.key !== "default") {
      event.preventDefault()
      navigate(-1)
    }
  }

  return (
    <div className="rebyu-ds relative isolate min-h-dvh overflow-x-hidden bg-rb-polar">
      <PathBackdrop />

      <div className="mx-auto max-w-5xl px-4 pb-16 pt-5 sm:px-6 lg:px-8">
        <TactileButton asChild variant="ghost" size="sm">
          <Link to="/learner/challenges" onClick={goBack}>
            <ArrowLeft className="mr-1.5 size-4" aria-hidden="true" />
            back
          </Link>
        </TactileButton>

        <section className="mt-6 grid items-center gap-6 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-rb-wolf">challenge</p>
            <h1 className="mt-1 font-rb-display text-4xl font-extrabold leading-none text-rb-eel sm:text-5xl">{name}</h1>
            <div className={cn("mt-3 h-[3px] w-24 rounded-full", tone.face)} />
            <p className="mt-3 max-w-md text-sm leading-6 text-rb-wolf">{blurb}</p>
            {configured ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-rb-wolf">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rb-swan bg-rb-snow px-2.5 py-1">
                  {arenaId === "blueprint" ? (
                    <Network className="size-3.5" aria-hidden="true" />
                  ) : (
                    <Code2 className="size-3.5" aria-hidden="true" />
                  )}
                  {problemCount} stage{problemCount === 1 ? "" : "s"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rb-swan bg-rb-snow px-2.5 py-1">
                  <Clock className="size-3.5" aria-hidden="true" />
                  {timePerProblem} min each
                </span>
                <PointsPill amount={totalPoints} />
              </div>
            ) : null}
          </div>
          <div className="relative mx-auto aspect-[4/3] w-full max-w-[16rem] md:max-w-[18rem]">
            {arenaId === "blueprint" ? <BlueprintArt tone={tone} locked={locked} /> : <CodeArt tone={tone} locked={locked} />}
          </div>
        </section>

        {arenasQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm font-semibold text-rb-wolf">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Loading arena…
          </div>
        ) : !configured ? (
          <div className="mx-auto mt-12 max-w-sm text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-rb-swan">
              <Lock className="size-7 text-rb-wolf" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-rb-display text-2xl font-extrabold text-rb-eel">Not open yet</h2>
            <p className="mt-2 text-sm text-rb-wolf">
              This arena has no problems set up yet. It opens as soon as an admin adds them.
            </p>
          </div>
        ) : (
          <StageTrail
            stages={stages}
            completed={completed}
            tone={tone}
            arenaId={arenaId}
            examId={arena.examId}
            timePerProblem={timePerProblem}
            pointsPerProblem={pointsPerProblem}
            totalPoints={totalPoints}
          />
        )}

        {configured ? <ArenaPodium arenaId={arenaId} title={`${name} rankings`} /> : null}
      </div>
    </div>
  )
}

function PointsPill({ amount }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rb-bee-wash px-2.5 py-1 text-xs font-extrabold tabular-nums text-rb-bee-lip">
      <Zap className="size-3" aria-hidden="true" />
      {amount} pts
    </span>
  )
}

/* Where each node sits: its centre x, the top of its box and which side its label is on. */
function trailLayout(count, wide) {
  const nodes = []
  for (let i = 0; i <= count; i++) {
    if (wide) {
      nodes.push({ cx: PAD_X + i * COL, top: i % 2 === 0 ? TOP_LOW : TOP_HIGH, labelBelow: i % 2 === 0 })
    } else {
      const offset = i === count ? 0 : i % 2 === 0 ? -V_OFFSET : V_OFFSET
      nodes.push({ cx: V_WIDTH / 2 + offset, top: V_TOP + i * V_ROW, labelBelow: true })
    }
  }
  const width = wide ? PAD_X * 2 + count * COL : V_WIDTH
  const height = wide ? MAP_H : V_TOP + count * V_ROW + NODE_H + 110
  return { nodes, width, height }
}

function stageStates(stages, completed) {
  const done = stages.map((p) => p != null && completed.has(Number(p.questionId)))
  const unlocked = stages.map((_, i) => i === 0 || done[i - 1])
  const currentIndex = stages.findIndex((_, i) => unlocked[i] && !done[i])
  return stages.map((_, i) => (done[i] ? "done" : i === currentIndex ? "current" : unlocked[i] ? "open" : "locked"))
}

function StageTrail({ stages, completed, tone, arenaId, examId, timePerProblem, pointsPerProblem, totalPoints }) {
  const wide = useWideScreen()
  const reduceMotion = useReducedMotion()
  const scrollerRef = useRef(null)
  const [edges, setEdges] = useState({ start: true, end: false })
  const count = stages.length
  const { nodes, width, height } = trailLayout(count, wide)
  const states = stageStates(stages, completed)
  const doneCount = states.filter((s) => s === "done").length

  const points = nodes.map(({ cx, top }) => [cx, top + LIFT + PLINTH_H / 2])
  const d = points
    .map(([x, y], i) => {
      if (i === 0) return `M ${x} ${y}`
      const [px, py] = points[i - 1]
      if (wide) {
        const mid = (px + x) / 2
        return `C ${mid} ${py}, ${mid} ${y}, ${x} ${y}`
      }
      const mid = (py + y) / 2
      return `C ${px} ${mid}, ${x} ${mid}, ${x} ${y}`
    })
    .join(" ")

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 })
  }, [])
  useEffect(() => {
    if (!wide) return undefined
    updateEdges()
    window.addEventListener("resize", updateEdges)
    return () => window.removeEventListener("resize", updateEdges)
  }, [count, wide, updateEdges])

  const scrollBy = (dir) =>
    scrollerRef.current?.scrollBy({ left: dir * COL * 2, behavior: reduceMotion ? "auto" : "smooth" })

  const map = (
    <div className={cn("relative", !wide && "mx-auto")} style={{ width, height }}>
      <svg className="pointer-events-none absolute inset-0" width={width} height={height} aria-hidden="true">
        <path
          d={d}
          fill="none"
          stroke="color-mix(in oklab, var(--color-rb-hare) 55%, var(--color-rb-swan))"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      {stages.map((problem, i) => (
        <StageNode
          key={problem?.questionId ?? i}
          index={i}
          {...nodes[i]}
          state={states[i]}
          tone={tone}
          problem={problem}
          arenaId={arenaId}
          to={`/learner/assessments/${examId}?q=${i}&total=${count}&arena=${arenaId}`}
          timePerProblem={timePerProblem}
          points={Number(problem?.points ?? pointsPerProblem)}
          reduceMotion={reduceMotion}
        />
      ))}

      <FinishNode {...nodes[count]} totalPoints={totalPoints} cleared={count > 0 && doneCount === count} />
    </div>
  )

  return (
    <section className="mt-12">
      <div className="flex items-end justify-between gap-3 border-b-2 border-rb-swan pb-2">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-rb-wolf">stages</p>
          <h2 className="font-rb-display text-2xl font-extrabold text-rb-eel">Clear them in order</h2>
          <p className="mt-0.5 text-xs font-bold text-rb-wolf">
            {doneCount} of {count} done · each stage unlocks the next
          </p>
        </div>
        {wide ? (
          <div className="flex gap-2">
            <ScrollButton label="Scroll left" onClick={() => scrollBy(-1)} disabled={edges.start} flip />
            <ScrollButton label="Scroll right" onClick={() => scrollBy(1)} disabled={edges.end} />
          </div>
        ) : null}
      </div>

      {wide ? (
        <div className="relative">
          <div
            ref={scrollerRef}
            onScroll={updateEdges}
            className="snap-x overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {map}
          </div>
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-rb-polar to-transparent transition-opacity",
              edges.end ? "opacity-0" : "opacity-100"
            )}
          />
        </div>
      ) : (
        <div className="mt-2">{map}</div>
      )}
    </section>
  )
}

function ScrollButton({ label, onClick, disabled, flip = false }) {
  return (
    <TactileButton
      variant="ghost"
      size="sm"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="rb-btn-icon disabled:opacity-40"
    >
      <ChevronRight className={cn("size-4", flip && "rotate-180")} aria-hidden="true" />
    </TactileButton>
  )
}

export function Plinth({ top, face, lip, w = PLINTH_W, h = PLINTH_H, d = PLINTH_D, lift = LIFT }) {
  return (
    <svg className="absolute left-0" style={{ top: lift }} width={w} height={h + d} viewBox={`0 0 ${w} ${h + d}`} aria-hidden="true">
      <path d={`M 0 ${h / 2} L ${w / 2} ${h} L ${w / 2} ${h + d} L 0 ${h / 2 + d} Z`} fill={lip} />
      <path d={`M ${w} ${h / 2} L ${w / 2} ${h} L ${w / 2} ${h + d} L ${w} ${h / 2 + d} Z`} fill={face} />
      <path d={`M ${w / 2} 0 L ${w} ${h / 2} L ${w / 2} ${h} L 0 ${h / 2} Z`} fill={top} />
    </svg>
  )
}

function NodeLabel({ labelBelow, children }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute left-1/2 w-[176px] -translate-x-1/2 text-center",
        labelBelow ? "top-full mt-2" : "bottom-full mb-1"
      )}
    >
      {children}
    </div>
  )
}

/* The first stage is drawn as the path's "current" node (filled, start bubble);
   the rest as open nodes, exactly like an unstarted topic on the learning path. */
function StageNode({ index, cx, top, labelBelow, state, tone, problem, arenaId, to, timePerProblem, points, reduceMotion }) {
  const q = problem?.question
  const difficulty = DIFFICULTY[q?.difficultyLevel] ?? DIFFICULTY.AVERAGE
  const language = q?.programmingQuestionConfig?.language
  const Icon = arenaId === "blueprint" ? Network : Code2
  // Same faces as the learning path: filled when done or current, open when
  // playable, grey when locked.
  const current = state === "current"
  const locked = state === "locked"
  const filled = state === "done" || current
  const faces = locked
    ? {
        top: "var(--color-rb-swan)",
        face: "color-mix(in oklab, var(--color-rb-swan) 78%, var(--color-rb-hare))",
        lip: "var(--color-rb-hare)",
      }
    : filled
      ? { top: `color-mix(in oklab, ${tone.faceVar} 84%, white)`, face: tone.faceVar, lip: tone.lipVar }
      : { top: "var(--color-rb-snow)", face: "var(--color-rb-polar)", lip: "var(--color-rb-swan)" }
  const NodeTag = locked ? "div" : Link
  const kind =
    arenaId === "blueprint" ? "Diagram" : language ? LANGUAGE_LABELS[language.toUpperCase()] ?? language : "Coding"

  return (
    <div className="absolute snap-center" style={{ left: cx - PLINTH_W / 2, top, width: PLINTH_W, height: NODE_H }}>
      {current ? <StartBubble tone={tone} reduceMotion={reduceMotion} /> : null}
      {current && !reduceMotion ? (
        <motion.span
          aria-hidden="true"
          className={cn("pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-[50%] opacity-25", tone.face)}
          style={{ top: LIFT - 6, width: PLINTH_W + 24, height: PLINTH_H + 18 }}
          animate={{ scale: [1, 1.14, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}

      <NodeTag
        {...(locked
          ? { role: "img", title: `Finish stage ${index} to unlock this one` }
          : { to })}
        aria-label={`Stage ${index + 1}, ${difficulty.label}, ${points} points${
          locked ? " (locked)" : state === "done" ? " (done)" : ""
        }`}
        className={cn(
          "group absolute inset-0 block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rb-macaw",
          locked ? "cursor-not-allowed" : "transition-transform duration-100 active:translate-y-[5px]"
        )}
      >
        <Plinth {...faces} />
        <span
          className={cn(
            "absolute left-0 grid place-items-center drop-shadow-[0_6px_3px_rgb(0_0_0/0.18)]",
            !locked && "transition-transform duration-200 group-hover:-translate-y-1",
            locked ? "text-rb-hare" : filled ? "text-white" : tone.ink
          )}
          style={{ top: 0, width: PLINTH_W, height: LIFT + PLINTH_H / 2 }}
        >
          {locked ? <Lock className="size-10" aria-hidden="true" /> : <Icon className="size-10" aria-hidden="true" />}
        </span>
        {state === "done" ? (
          <span
            className="absolute right-3 grid size-8 place-items-center rounded-full bg-rb-snow text-rb-leaf shadow-[0_2px_4px_rgb(0_0_0/0.18)]"
            style={{ top: LIFT - 10 }}
            title="Done"
          >
            <Check className="size-4" aria-hidden="true" />
          </span>
        ) : null}
      </NodeTag>

      <NodeLabel labelBelow={labelBelow}>
        <p className={cn("font-rb-display text-[15px] font-extrabold leading-tight", locked ? "text-rb-wolf" : "text-rb-eel")}>
          Stage {index + 1}
        </p>
        <p className="mt-0.5 text-[12px] font-bold text-rb-wolf">
          {kind} · {String(timePerProblem).padStart(2, "0")}:00
        </p>
        <div className="mt-1 flex items-center justify-center gap-1.5">
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase", difficulty.chip)}>
            {difficulty.label}
          </span>
          <PointsPill amount={points} />
        </div>
        {locked ? (
          <p className="mt-1 text-[11px] font-bold text-rb-wolf">Finish stage {index} to unlock</p>
        ) : state === "done" ? (
          <p className="mt-1 text-[11px] font-bold text-rb-leaf">Done · play again any time</p>
        ) : null}
      </NodeLabel>
    </div>
  )
}

function StartBubble({ tone, reduceMotion }) {
  return (
    <motion.span
      className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2"
      animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden="true"
    >
      <span
        className={cn(
          "block whitespace-nowrap rounded-rb-control px-4 py-1.5 font-rb-display text-sm font-extrabold lowercase text-white",
          tone.face
        )}
        style={{ boxShadow: `0 3px 0 ${tone.lipVar}` }}
      >
        start
      </span>
      <span
        className="absolute left-1/2 top-full size-0 -translate-x-1/2 border-x-8 border-t-8 border-x-transparent"
        style={{ borderTopColor: tone.lipVar }}
      />
    </motion.span>
  )
}

function FinishNode({ cx, top, labelBelow, totalPoints, cleared }) {
  return (
    <div className="absolute snap-center" style={{ left: cx - PLINTH_W / 2, top, width: PLINTH_W, height: NODE_H }}>
      {cleared ? (
        <Plinth
          top="color-mix(in oklab, var(--color-rb-fox) 84%, white)"
          face="var(--color-rb-fox)"
          lip="var(--color-rb-fox-lip)"
        />
      ) : (
        <Plinth top="var(--color-rb-snow)" face="var(--color-rb-polar)" lip="var(--color-rb-swan)" />
      )}
      <span
        className={cn(
          "absolute left-0 grid place-items-center drop-shadow-[0_6px_3px_rgb(0_0_0/0.18)]",
          cleared ? "text-white" : "text-rb-fox-lip"
        )}
        style={{ top: 0, width: PLINTH_W, height: LIFT + PLINTH_H / 2 }}
      >
        <Trophy className="size-10" aria-hidden="true" />
      </span>
      <NodeLabel labelBelow={labelBelow}>
        <p className="font-rb-display text-[15px] font-extrabold leading-tight text-rb-eel">Finish</p>
        <p className="mt-0.5 text-[12px] font-bold text-rb-wolf">{cleared ? "Every stage cleared" : "Clear every stage"}</p>
        <div className="mt-1 flex justify-center">
          <PointsPill amount={totalPoints} />
        </div>
      </NodeLabel>
    </div>
  )
}

/* Hero illustrations, inked like the learning path's books and clipboards. */
function CodeArt({ tone, locked }) {
  const reduceMotion = useReducedMotion()
  const screen = locked ? "color-mix(in oklab, var(--color-rb-swan) 78%, var(--color-rb-hare))" : tone.faceVar
  const widths = [44, 62, 38, 50, 28]
  const indents = [0, 12, 12, 24, 0]
  return (
    <svg viewBox="0 0 220 165" className="size-full" aria-hidden="true">
      <ellipse cx="110" cy="152" rx="88" ry="8" fill="rgb(0 0 0 / 0.12)" />
      <g stroke={INK} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <rect x="40" y="14" width="140" height="98" rx="8" fill={screen} />
        <rect x="50" y="24" width="120" height="78" rx="3" fill="#1f2a26" strokeWidth="2" />
        <path d="M 20 118 L 200 118 L 212 138 Q 213 142 208 142 L 12 142 Q 7 142 8 138 Z" fill="#f4efe2" />
        <path d="M 88 126 L 132 126" stroke="#c9bfa6" strokeWidth="2.2" />
      </g>
      {widths.map((w, i) => (
        <motion.rect
          key={i}
          x={60 + indents[i]}
          y={34 + i * 12}
          height="4.5"
          rx="2.25"
          fill={i === 0 || i === 4 ? "var(--color-rb-bee)" : "#c9bfa6"}
          opacity={locked ? 0.4 : 1}
          initial={reduceMotion ? false : { width: 0 }}
          animate={{ width: w }}
          transition={{ duration: 0.45, delay: 0.2 + i * 0.12 }}
        />
      ))}
      <motion.rect
        x={92}
        y={86}
        width="7"
        height="8"
        fill={PAPER}
        animate={reduceMotion || locked ? undefined : { opacity: [1, 0, 1] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
      />
      <g stroke={INK} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <circle cx="182" cy="104" r="15" fill={locked ? "var(--color-rb-swan)" : "var(--color-rb-bee)"} />
        {locked ? (
          <path d="M 176 104 L 188 104" stroke={INK} strokeWidth="2.6" />
        ) : (
          <path d="M 175 104 L 180 109 L 189 99" fill="none" stroke={PAPER} strokeWidth="3" />
        )}
      </g>
    </svg>
  )
}

function BlueprintArt({ tone, locked }) {
  const reduceMotion = useReducedMotion()
  const sheet = locked ? "color-mix(in oklab, var(--color-rb-swan) 78%, var(--color-rb-hare))" : tone.lipVar
  const draw = (delay) =>
    reduceMotion ? {} : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.6, delay } }
  const boxes = [
    [40, 30, 50],
    [130, 30, 50],
    [40, 96, 50],
    [130, 96, 50],
  ]
  return (
    <svg viewBox="0 0 220 165" className="size-full" aria-hidden="true">
      <ellipse cx="110" cy="154" rx="88" ry="8" fill="rgb(0 0 0 / 0.12)" />
      <g transform="rotate(-3 110 82)">
        <rect x="22" y="14" width="176" height="130" rx="6" fill={sheet} stroke={INK} strokeWidth="2.5" />
        <g stroke="rgb(255 255 255 / 0.12)" strokeWidth="1">
          {Array.from({ length: 7 }, (_, i) => (
            <path key={`v${i}`} d={`M ${44 + i * 22} 18 L ${44 + i * 22} 140`} />
          ))}
          {Array.from({ length: 5 }, (_, i) => (
            <path key={`h${i}`} d={`M 26 ${36 + i * 22} L 194 ${36 + i * 22}`} />
          ))}
        </g>
        <g fill="none" stroke={PAPER} strokeWidth="2.2" strokeLinecap="round">
          <motion.path d="M 90 48 L 128 48" {...draw(0.3)} />
          <motion.path d="M 65 66 L 65 94" {...draw(0.5)} />
          <motion.path d="M 155 66 L 155 94" strokeDasharray="4 5" {...draw(0.7)} />
        </g>
        <path d="M 122 44 L 129 48 L 122 52" fill="none" stroke={PAPER} strokeWidth="2.2" strokeLinejoin="round" />
        {boxes.map(([x, y, w], i) => (
          <g key={i}>
            <rect x={x} y={y} width={w} height="36" rx="3" fill={PAPER} stroke={INK} strokeWidth="2.2" />
            <path d={`M ${x} ${y + 11} L ${x + w} ${y + 11}`} stroke={INK} strokeWidth="1.8" />
            <path
              d={`M ${x + 7} ${y + 6} L ${x + w - 16} ${y + 6} M ${x + 7} ${y + 19} L ${x + w - 10} ${y + 19} M ${x + 7} ${y + 27} L ${x + w - 20} ${y + 27}`}
              stroke="#b3a88f"
              strokeWidth="2"
            />
          </g>
        ))}
      </g>
      <g transform="rotate(38 196 110)" stroke={INK} strokeWidth="2.2" strokeLinejoin="round">
        <rect x="190" y="70" width="11" height="46" rx="2" fill="#f5b72f" />
        <path d="M 190 116 L 195.5 128 L 201 116 Z" fill="#f4e3c3" />
        <rect x="190" y="64" width="11" height="7" rx="1.5" fill="#e0506a" />
      </g>
    </svg>
  )
}

/* Same backdrop as the learning path. */
export function PathBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <svg className="size-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="arena-dots" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="var(--color-rb-eel)" opacity="0.06" />
          </pattern>
          <radialGradient id="arena-wash-a">
            <stop offset="0%" stopColor="var(--color-rb-macaw)" stopOpacity="0.10" />
            <stop offset="100%" stopColor="var(--color-rb-macaw)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="arena-wash-b">
            <stop offset="0%" stopColor="var(--color-rb-bee)" stopOpacity="0.09" />
            <stop offset="100%" stopColor="var(--color-rb-bee)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="arena-wash-c">
            <stop offset="0%" stopColor="var(--color-rb-beetle)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="var(--color-rb-beetle)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#arena-dots)" />
        <circle cx="8%" cy="18%" r="320" fill="url(#arena-wash-a)" />
        <circle cx="94%" cy="52%" r="380" fill="url(#arena-wash-b)" />
        <circle cx="14%" cy="88%" r="300" fill="url(#arena-wash-c)" />
      </svg>
    </div>
  )
}

export default ArenaLobby
