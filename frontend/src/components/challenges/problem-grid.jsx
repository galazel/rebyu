import { useEffect, useRef } from "react"
import { Check, Lock } from "@/components/icons"

import { ProgressBar } from "@/components/rebyu/rebyu-ui.jsx"


export function buildProblems(count, titles, solvedCount) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: titles[i % titles.length],
    difficulty: i < count * 0.3 ? "easy" : i < count * 0.7 ? "average" : "hard",
    state: i < solvedCount ? "solved" : i === solvedCount ? "current" : "locked",
  }))
}


const VB_WIDTH = 1200
const PAD_X = 110
const PAD_Y = 175
const ROW_H = 330
const COLS = 5

const NODE_R = 42
const STEM = 96

const WAVE = 24

function layout(count) {
  const cols = Math.min(COLS, count)
  const rows = Math.ceil(count / cols)
  const stepX = cols > 1 ? (VB_WIDTH - PAD_X * 2) / (cols - 1) : 0
  const height = PAD_Y * 2 + (rows - 1) * ROW_H

  const points = Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / cols)
    const col = i % cols
    const x = PAD_X + (row % 2 === 0 ? col : cols - 1 - col) * stepX
    const y = PAD_Y + row * ROW_H + (col % 2 === 0 ? -WAVE : WAVE)
    return { x, y, dir: i % 2 === 0 ? -1 : 1 }
  })

  return { points, height, cols, rows }
}

function roadPath(points) {
  if (points.length < 2) return ""

  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? points[i + 1]

    d += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}, ${
      p2.x - (p3.x - p1.x) / 6
    } ${p2.y - (p3.y - p1.y) / 6}, ${p2.x} ${p2.y}`
  }
  return d
}


const DIFFICULTY_STROKE = {
  easy: "var(--color-rb-feather)",
  average: "var(--color-rb-fox)",
  hard: "var(--color-rb-cardinal)",
}

const DIFFICULTY_NODE = {
  easy: "border-rb-feather bg-rb-feather text-white shadow-[var(--comic-shadow-sm)]",
  average: "border-rb-fox bg-rb-fox text-white shadow-[var(--comic-shadow-sm)]",
  hard: "border-rb-cardinal bg-rb-cardinal text-white shadow-[var(--comic-shadow-sm)]",
}

const DIFFICULTY_NODE_LOCKED = {
  easy: "border-rb-feather/40 bg-rb-feather-wash text-rb-feather-lip shadow-[var(--comic-shadow-sm)]",
  average: "border-rb-fox/40 bg-rb-fox-wash text-rb-fox-lip shadow-[var(--comic-shadow-sm)]",
  hard: "border-rb-cardinal/40 bg-rb-cardinal-wash text-rb-cardinal-lip shadow-[var(--comic-shadow-sm)]",
}

const DIFFICULTY_TAG = {
  easy: "bg-rb-feather text-white",
  average: "bg-rb-fox text-white",
  hard: "bg-rb-cardinal text-white",
}

export const DIFFICULTY_CHIP = {
  easy: "bg-rb-feather-wash text-rb-feather-ink",
  average: "bg-rb-fox-wash text-rb-fox-lip",
  hard: "bg-rb-cardinal-wash text-rb-cardinal-lip",
}

const ROAD_W = 44
const CENTRE_W = 5

function Road({ points, height, travelled, roadDone = "var(--color-rb-feather-lip)" }) {
  const d = roadPath(points)

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      width={VB_WIDTH}
      height={height}
      viewBox={`0 0 ${VB_WIDTH} ${height}`}
      fill="none"
    >
      <path
        d={d}
        stroke="rgb(0 0 0 / 0.10)"
        strokeWidth={ROAD_W + 8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={d}
        stroke="var(--color-rb-hare)"
        strokeWidth={ROAD_W}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {travelled > 0 ? (
        <path
          d={d}
          pathLength="1"
          strokeDasharray={`${travelled} 1`}
          stroke={roadDone}
          strokeWidth={ROAD_W}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}

      <path
        d={d}
        stroke="white"
        strokeWidth={CENTRE_W}
        strokeDasharray="20 22"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  )
}

function Stems({ points, height, problems }) {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      width={VB_WIDTH}
      height={height}
      viewBox={`0 0 ${VB_WIDTH} ${height}`}
      fill="none"
    >
      {points.map((p, i) => {
        const problem = problems[i]
        const colour =
          problem.state === "locked"
            ? "var(--color-rb-hare)"
            : DIFFICULTY_STROKE[problem.difficulty] ?? DIFFICULTY_STROKE.easy
        const endY = p.y + p.dir * (STEM - NODE_R)

        return (
          <g key={i}>
            <line x1={p.x} y1={p.y} x2={p.x} y2={endY} stroke={colour} strokeWidth="4" />
            <circle cx={p.x} cy={p.y} r="10" fill="white" stroke={colour} strokeWidth="4" />
          </g>
        )
      })}
    </svg>
  )
}

function Cell({ problem, onOpen, tone, nodeRef }) {
  const locked = problem.state === "locked"
  const solved = problem.state === "solved"
  const current = problem.state === "current"

  return (
    <button
      ref={nodeRef}
      type="button"
      onClick={() => onOpen(problem.id)}
      aria-label={`Problem ${problem.id} — ${problem.title} — ${problem.state}`}
      className={`relative z-10 grid size-20 shrink-0 place-items-center rounded-full border-2 transition active:translate-y-[3px] active:shadow-none ${
        solved
          ? DIFFICULTY_NODE[problem.difficulty] ?? DIFFICULTY_NODE.easy
          : current
            ? `${tone.border} ${tone.face} text-white shadow-[var(--comic-shadow-sm)]`
            : DIFFICULTY_NODE_LOCKED[problem.difficulty] ?? DIFFICULTY_NODE_LOCKED.easy
      }`}
      style={{ width: NODE_R * 2, height: NODE_R * 2 }}
    >
      <span className="rb-numeric text-3xl leading-none sm:text-4xl">{problem.id}</span>

      <span className="absolute right-2.5 top-2.5">
        {solved ? <Check className="size-4" aria-hidden="true" /> : null}
        {locked ? <Lock className="size-3.5 opacity-60" aria-hidden="true" /> : null}
      </span>

      <span
        className={`absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-rb-pill px-2 py-0.5 text-[0.625rem] font-extrabold uppercase tracking-wide ${DIFFICULTY_TAG[problem.difficulty] ?? DIFFICULTY_TAG.easy}`}
      >
        {problem.difficulty}
      </span>

      {current ? (
        <span className="absolute -bottom-px left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-white/80" />
      ) : null}
    </button>
  )
}

export default function ProblemGrid({ problems, onOpen, tone }) {
  const solved = problems.filter((p) => p.state === "solved").length
  const currentRef = useRef(null)
  const trackRef = useRef(null)

  const { points, height } = layout(problems.length)
  const travelled = problems.length > 1 ? solved / (problems.length - 1) : 0

  useEffect(() => {
    const node = currentRef.current
    const track = trackRef.current
    if (!node || !track) return undefined
    let frame = 0
    let tries = 0
    const place = () => {
      if (track.clientWidth === 0 || track.scrollWidth === 0) {
        if (tries++ > 30) return
        frame = requestAnimationFrame(place)
        return
      }
      const nodeBox = node.getBoundingClientRect()
      const trackBox = track.getBoundingClientRect()
      const centre = nodeBox.left - trackBox.left + track.scrollLeft + nodeBox.width / 2
      const target = centre - track.clientWidth / 2
      track.scrollLeft = Math.max(0, Math.min(target, track.scrollWidth - track.clientWidth))
    }
    frame = requestAnimationFrame(place)
    return () => cancelAnimationFrame(frame)
  }, [solved])

  return (
    <div className="flex min-h-full w-full flex-col justify-center px-2 py-10 sm:px-3">

      <div
        ref={trackRef}
        className="hidden [&::-webkit-scrollbar]:hidden sm:block sm:overflow-x-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        onWheel={(event) => {
          const frame = event.currentTarget
          if (frame.scrollWidth <= frame.clientWidth) return
          if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
          frame.scrollLeft += event.deltaY
        }}
      >
        <div
          className="relative mx-auto"
          style={{ width: VB_WIDTH, height }}
        >
          <Road points={points} height={height} travelled={travelled} roadDone={tone.road} />
          <Stems points={points} height={height} problems={problems} />

          <ol className="contents" aria-label="Problem roadmap">
            {problems.map((problem, i) => (
              <li
                key={problem.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: points[i].x,
                  top: points[i].y + points[i].dir * STEM,
                }}
              >
                <Cell
                  problem={problem}
                  onOpen={onOpen}
                  tone={tone}
                  nodeRef={problem.state === "current" ? currentRef : undefined}
                />
              </li>
            ))}
          </ol>
        </div>
      </div>

      <ol
        className="relative flex flex-col items-center gap-6 py-4 sm:hidden"
        aria-label="Problem roadmap"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-full w-11 -translate-x-1/2 rounded-full bg-rb-hare"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-full w-[5px] -translate-x-1/2 rounded-full bg-white/90"
          style={{
            maskImage: "repeating-linear-gradient(to bottom, black 0 20px, transparent 20px 42px)",
            WebkitMaskImage:
              "repeating-linear-gradient(to bottom, black 0 20px, transparent 20px 42px)",
          }}
        />
        {problems.map((problem) => (
          <li key={problem.id} className="relative">
            <Cell problem={problem} onOpen={onOpen} tone={tone} />
          </li>
        ))}
      </ol>

      <div className="mx-auto mt-10 w-full max-w-2xl px-3">
        <div className="flex items-baseline justify-between">
          <span className="rb-eyebrow">Progress</span>
          <span className="rb-numeric text-base text-rb-wolf">
            {solved} / {problems.length} solved
          </span>
        </div>
        <ProgressBar value={(solved / problems.length) * 100} label="Run progress" className="mt-3 !h-5" />
      </div>
    </div>
  )
}
