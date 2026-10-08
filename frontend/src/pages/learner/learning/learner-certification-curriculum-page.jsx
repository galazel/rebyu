import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom"
import { returnState } from "@/lib/assessment-return"
import { CurriculumDock } from "@/components/learner/curriculum-dock.jsx"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  CircleHelp,
  Loader2,
  Lock,
  RotateCcw,
  Trophy,
  Zap,
} from "@/components/icons"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TactileButton } from "@/components/rebyu/rebyu-ui.jsx"
import {
  Reveal,
  StaggerItem,
  StaggerList,
  fadeUp,
  motion,
  popIn,
  useAnimationControls,
} from "@/components/motion/rebyu-motion.jsx"
import { LearnerEmptyState } from "@/components/learner/learner-ui.jsx"
import { useCertificationStudyPlan } from "@/components/learner/use-certification-study-plan.js"
import { ASSESSMENT_MAX_XP } from "@/lib/xp.js"
import {
  certificationProgressPercent,
  findCertificationProgress,
} from "@/lib/certification-progress.js"
import { getExams, getExamTypes } from "@/services/assessmentService.js"
import { getProgressAnalytics } from "@/services/learnerAnalyticsService.js"
import { PROFICIENT_RATING, buildCurriculum, examStanding, hasSatDiagnostic } from "./curriculum-model.js"
import { LoadingSignal } from "@/components/loading-overlay.jsx"


const TONE = {
  macaw: {
    face: "bg-rb-macaw",
    faceVar: "var(--color-rb-macaw)",
    lipVar: "var(--color-rb-macaw-lip)",
    wash: "bg-rb-macaw-wash",
    chip: "bg-rb-macaw-wash text-rb-macaw-lip",
    ink: "text-rb-macaw-lip",
    btn: "macaw",
    bar: "macaw",
  },
  bee: {
    face: "bg-rb-bee",
    faceVar: "var(--color-rb-bee)",
    lipVar: "var(--color-rb-bee-lip)",
    wash: "bg-rb-bee-wash",
    chip: "bg-rb-bee-wash text-rb-bee-ink",
    ink: "text-rb-bee-ink",
    btn: "fox",
    bar: "bee",
  },
  beetle: {
    face: "bg-rb-beetle",
    faceVar: "var(--color-rb-beetle)",
    lipVar: "var(--color-rb-beetle-lip)",
    wash: "bg-rb-beetle-wash",
    chip: "bg-rb-beetle-wash text-rb-beetle-lip",
    ink: "text-rb-beetle-lip",
    btn: "beetle",
    bar: "beetle",
  },
  cardinal: {
    face: "bg-rb-cardinal",
    faceVar: "var(--color-rb-cardinal)",
    lipVar: "var(--color-rb-cardinal-lip)",
    wash: "bg-rb-cardinal-wash",
    chip: "bg-rb-cardinal-wash text-rb-cardinal-lip",
    ink: "text-rb-cardinal-lip",
    btn: "cardinal",
    bar: "mask",
  },
  feather: {
    face: "bg-rb-feather",
    faceVar: "var(--color-rb-feather)",
    lipVar: "var(--color-rb-feather-lip)",
    wash: "bg-rb-feather-wash",
    chip: "bg-rb-feather-wash text-rb-feather-ink",
    ink: "text-rb-feather-ink",
    btn: "feather",
    bar: "feather",
  },
  fox: {
    face: "bg-rb-fox",
    faceVar: "var(--color-rb-fox)",
    lipVar: "var(--color-rb-fox-lip)",
    wash: "bg-rb-fox-wash",
    chip: "bg-rb-fox-wash text-rb-fox-lip",
    ink: "text-rb-fox-lip",
    btn: "fox",
    bar: "fox",
  },
}


function XpPill({ amount, earned, upTo = false }) {
  const label = earned
    ? (upTo ? "XP earned" : `${amount} XP`)
    : (upTo ? `up to ${amount} XP` : `+${amount} XP`)

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-extrabold tabular-nums ${
        earned ? "bg-rb-swan text-rb-wolf" : "bg-rb-bee-wash text-rb-bee-lip"
      }`}
      title={
        earned
          ? "Already earned"
          : upTo
            ? "30 XP for finishing, 100 for passing, 200 for a perfect score"
            : "Earned once, the first time you finish this"
      }
    >
      <Zap className="size-3" aria-hidden="true" />
      {label}
    </span>
  )
}


const MASTERY_POLL_MS = 10_000
const MASTERY_POLL_WINDOW_MS = 3 * 60_000

const PATH_WIDTH = 480
const PATH_ROW = 188

const NODE_W = 160
const PLINTH_H = 80
const PLINTH_D = 24
const ICON_LIFT = 36
const NODE_H = PLINTH_H + PLINTH_D + ICON_LIFT


const NODE_SCALE_GRAND = 1.34
const PATH_ROW_GRAND = 238

function nodeDims(node, narrow = false) {
  const scale = (node?.grand ? NODE_SCALE_GRAND : 1) * (narrow ? NARROW_NODE_SCALE : 1)
  const plinthH = Math.round(PLINTH_H * scale)
  const plinthD = Math.round(PLINTH_D * scale)
  const lift = Math.round(ICON_LIFT * scale)

  return {
    w: Math.round(NODE_W * scale),
    plinthH,
    plinthD,
    lift,
    h: plinthH + plinthD + lift,
  }
}

function rowHeight(node, narrow = false) {
  const base = node?.grand ? PATH_ROW_GRAND : PATH_ROW
  if (!narrow) return base
  const dims = nodeDims(node, true)
  return Math.round(dims.h + NARROW_LABEL_H + 34)
}

function stretchHeight(nodes, narrow = false) {
  return nodes.reduce((total, node) => total + rowHeight(node, narrow), 0)
}


const PATH_OFFSETS = [104, -104]


const NARROW_PATH_WIDTH = 288
const NARROW_OFFSETS = [50, -50]
const NARROW_NODE_SCALE = 0.92
const NARROW_LABEL_H = 84

function pathWidthOf(narrow) {
  return narrow ? NARROW_PATH_WIDTH : PATH_WIDTH
}

function offsetAt(index, narrow = false) {
  const offsets = narrow ? NARROW_OFFSETS : PATH_OFFSETS
  return offsets[index % offsets.length]
}

function labelSideAt(index, narrow = false) {
  if (narrow) return "below"
  return offsetAt(index) > 0 ? "right" : "left"
}

const NarrowRoadContext = createContext(false)

function useNarrowRoad() {
  return useContext(NarrowRoadContext)
}

const ROAD_LABEL_W = 210
const ROAD_LABEL_GAP = 16
const ROAD_WIDE_MIN_WIDTH =
  2 * (Math.max(...PATH_OFFSETS.map(Math.abs)) + NODE_W / 2 + ROAD_LABEL_GAP + ROAD_LABEL_W) + 40

function useIsNarrowViewport() {
  const query = `(max-width: ${ROAD_WIDE_MIN_WIDTH - 1}px)`
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  )

  useEffect(() => {
    if (typeof window === "undefined") return undefined
    const media = window.matchMedia(query)
    const onChange = (event) => setNarrow(event.matches)
    setNarrow(media.matches)
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [query])

  return narrow
}

function PathTrail({ items, start = 0 }) {
  const narrow = useNarrowRoad()
  if (items.length < 2) return null


  let top = 0
  const points = items.map((node, index) => {
    const dims = nodeDims(node, narrow)
    const row = rowHeight(node, narrow)
    const nodeTop = narrow ? top + 16 : top + (row - dims.h) / 2
    const y = nodeTop + dims.lift + dims.plinthH / 2
    top += row

    return [pathWidthOf(narrow) / 2 + offsetAt(start + index, narrow), y]
  })

  const d = points
    .map(([x, y], index) => {
      if (index === 0) return `M ${x} ${y}`
      const [px, py] = points[index - 1]
      const midY = (py + y) / 2
      return `C ${px} ${midY}, ${x} ${midY}, ${x} ${y}`
    })
    .join(" ")

  return (
    <svg
      className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
      width={pathWidthOf(narrow)}
      height={stretchHeight(items, narrow)}
      aria-hidden="true"
    >
      <path
        d={d}
        fill="none"
        stroke="color-mix(in oklab, var(--color-rb-hare) 55%, var(--color-rb-swan))"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function StartBubble({ tone }) {
  return (
    <motion.span
      className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden="true"
    >
      <span
        className={`block whitespace-nowrap rounded-rb-control px-4 py-1.5 font-rb-display text-sm font-extrabold lowercase text-white shadow-[0_3px_0_var(--bubble-lip)] ${tone.face}`}
        style={{ "--bubble-lip": tone.lipVar }}
      >
        start
      </span>

      <span
        className="absolute left-1/2 top-full size-0 -translate-x-1/2 border-x-8 border-x-transparent border-t-8"
        style={{ borderTopColor: tone.lipVar }}
      />
    </motion.span>
  )
}

function Plinth({ face, lip, top, w, h, d }) {
  return (
    <svg
      className="absolute left-1/2 -translate-x-1/2"
      style={{ top: ICON_LIFT }}
      width={w}
      height={h + d}
      viewBox={`0 0 ${w} ${h + d}`}
      aria-hidden="true"
    >
      <path d={`M 0 ${h / 2} L ${w / 2} ${h} L ${w / 2} ${h + d} L 0 ${h / 2 + d} Z`} fill={lip} />
      <path
        d={`M ${w} ${h / 2} L ${w / 2} ${h} L ${w / 2} ${h + d} L ${w} ${h / 2 + d} Z`}
        fill={face}
      />
      <path d={`M ${w / 2} 0 L ${w} ${h / 2} L ${w / 2} ${h} L 0 ${h / 2} Z`} fill={top} />
    </svg>
  )
}

const BOOK_INK = "#2c2a26"

export function TopicBook({ state, face, lip, reading = false }) {
  const open = state === "done"

  return (
    <svg
      className="absolute inset-0 size-full transition-transform duration-200 group-hover:-translate-y-1"
      viewBox="0 0 132 116"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
    >
      <ellipse cx="66" cy="104" rx="54" ry="8" fill="rgb(0 0 0 / 0.12)" />

      {open ? (
        <g transform="rotate(-6 66 66)" strokeLinejoin="round" strokeLinecap="round">
          <path
            d="M 4 42 C 28 36 50 38 66 48 C 82 38 104 36 128 42 L 129 90 C 106 84 84 86 66 96 C 48 86 26 84 3 90 Z"
            fill={face}
            stroke={BOOK_INK}
            strokeWidth="2.5"
          />
          <path d="M 9 84 C 28 78 50 80 64 90 L 64 94 C 50 84 28 82 9 88 Z" fill="#e4ddcb" />
          <path d="M 123 84 C 104 78 82 80 68 90 L 68 94 C 82 84 104 82 123 88 Z" fill="#e4ddcb" />
          <path
            d="M 64 44 C 50 34 28 32 9 38 L 9 84 C 28 78 50 80 64 90 Z"
            fill="#fdfcf8"
            stroke={BOOK_INK}
            strokeWidth="2.5"
          />
          <path
            d="M 68 44 C 82 34 104 32 123 38 L 123 84 C 104 78 82 80 68 90 Z"
            fill="#fdfcf8"
            stroke={BOOK_INK}
            strokeWidth="2.5"
          />
          <path d="M 56 42 L 66 46 L 66 90 L 56 84 Z" fill="rgb(44 42 38 / 0.08)" />
          <g stroke="#b3a88f" strokeWidth="2.4" fill="none">
            <path d="M 18 46 C 30 42 44 43 55 49" />
            <path d="M 18 55 C 30 51 44 52 55 58" />
            <path d="M 18 64 C 28 61 38 61 48 65" />
            <path d="M 18 73 C 30 69 44 70 55 76" />
            <path d="M 77 49 C 88 43 102 42 114 46" />
            <path d="M 77 58 C 88 52 102 51 114 55" />
            <path d="M 84 65 C 94 61 104 61 114 64" />
            <path d="M 77 76 C 88 70 102 69 114 73" />
          </g>
          <path d="M 86 86 L 95 83 L 95 104 L 90.5 99 L 86 105 Z" fill="#e0506a" stroke={BOOK_INK} strokeWidth="2" />
        </g>
      ) : (
        <g strokeLinejoin="round" strokeLinecap="round">
          <path d="M 6 62 L 66 92 L 126 62 L 126 76 L 66 106 L 6 76 Z" fill={lip} stroke={BOOK_INK} strokeWidth="2.5" />
          <path d="M 12 58 L 66 85 L 120 58 L 120 72 L 66 99 L 12 72 Z" fill="#f4efe2" stroke={BOOK_INK} strokeWidth="2" />
          <g stroke="#d6ccb4" strokeWidth="1.2">
            <path d="M 16 63 L 66 88" />
            <path d="M 16 67 L 66 92" />
            <path d="M 116 63 L 66 88" />
            <path d="M 116 67 L 66 92" />
          </g>
          {reading ? (
            <path d="M 84 80 L 93 76 L 93 104 L 88.5 99 L 84 105 Z" fill="#e0506a" stroke={BOOK_INK} strokeWidth="2" />
          ) : null}
          <path d="M 6 50 L 66 80 L 126 50 L 126 56 L 66 86 L 6 56 Z" fill={lip} stroke={BOOK_INK} strokeWidth="2.5" />
          <path d="M 6 50 L 66 20 L 126 50 L 66 80 Z" fill={face} stroke={BOOK_INK} strokeWidth="2.5" />
          <path d="M 44 50 L 70 37 L 88 46 L 62 59 Z" fill="rgb(255 255 255 / 0.4)" />
        </g>
      )}
    </svg>
  )
}

function NodeProgress({ value }) {
  const pct = Math.max(0, Math.min(100, value))

  return (
    <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-rb-pill bg-rb-swan">
      <motion.span
        className="block h-full rounded-rb-pill bg-rb-bee"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
    </span>
  )
}

function PathNode({ node, index, onSelect, onLocked }) {
  const shake = useAnimationControls()
  const tone = TONE[node.tone]
  const Icon = node.icon
  const { state } = node

  const locked = state === "locked"
  const done = state === "done"
  const current = state === "current"
  const narrow = useNarrowRoad()
  const dims = nodeDims(node, narrow)

  const retakeable = done && node.kind === "exam"
  const bookish = node.kind === "topic" && !node.grand

  function press() {
    if (locked) {
      shake.start({ x: [0, -8, 8, -6, 6, -3, 3, 0], transition: { duration: 0.45 } })
      onLocked(node)
      return
    }
    onSelect(node)
  }


  const filled = done || current
  const faces = locked
    ? {
        top: "var(--color-rb-swan)",
        face: "color-mix(in oklab, var(--color-rb-swan) 78%, var(--color-rb-hare))",
        lip: "var(--color-rb-hare)",
      }
    : filled
      ? {
          top: `color-mix(in oklab, ${tone.faceVar} 84%, white)`,
          face: tone.faceVar,
          lip: tone.lipVar,
        }
      : {
          top: "var(--color-rb-snow)",
          face: "var(--color-rb-polar)",
          lip: "var(--color-rb-swan)",
        }

  const iconInk = locked
    ? "text-rb-hare"
    : filled
      ? "text-white"
      : tone.ink

  const side = labelSideAt(index, narrow)

  return (
    <div className="relative" style={{ height: rowHeight(node, narrow) }}>

      <div
        className={narrow ? "absolute left-1/2 top-4" : "absolute left-1/2 top-1/2"}
        style={{
          width: dims.w,
          height: dims.h,
          transform: narrow
            ? `translateX(calc(-50% + ${offsetAt(index, narrow)}px))`
            : `translate(calc(-50% + ${offsetAt(index)}px), -50%)`,
        }}
      >
        <motion.div animate={shake} className="relative h-full">
          {current ? <StartBubble tone={tone} /> : null}


          {current ? (
            <motion.span
              className={`pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-[50%] ${tone.face} opacity-25`}
              style={{ top: dims.lift - 6, width: dims.w + 26, height: dims.plinthH + 20 }}
              animate={{ scale: [1, 1.14, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden="true"
            />
          ) : null}

          <button
            type="button"
            onClick={press}
            aria-label={`${node.label}${
              locked ? " (locked)" : retakeable ? " (already sat -- retake)" : ""
            }`}
            className="group absolute inset-0 block transition-transform duration-100 active:translate-y-[5px]"
          >
            {bookish ? (
              <TopicBook
                state={state}
                face={locked ? faces.top : tone.faceVar}
                lip={locked ? faces.lip : tone.lipVar}
                reading={!locked && !done && node.progress > 0}
              />
            ) : (
              <Plinth
                top={faces.top}
                face={faces.face}
                lip={faces.lip}
                w={dims.w}
                h={dims.plinthH}
                d={dims.plinthD}
              />
            )}


            {bookish ? (
              locked ? (
                <span
                  className="absolute left-1/2 grid size-9 -translate-x-1/2 place-items-center rounded-full bg-rb-snow text-rb-hare shadow-[0_2px_4px_rgb(0_0_0/0.18)]"
                  style={{ top: dims.lift - 18 }}
                >
                  <Lock className="size-5" aria-hidden="true" />
                </span>
              ) : null
            ) : (
            <span
              className={`absolute left-1/2 grid -translate-x-1/2 place-items-center drop-shadow-[0_6px_3px_rgb(0_0_0/0.18)] ${iconInk}`}
              style={{ top: 0, width: dims.w, height: dims.lift + dims.plinthH / 2 }}
            >
              {node.grand ? (
                <span className="relative grid place-items-center">
                  <Icon className="size-14" aria-hidden="true" />

                  {locked || retakeable || done ? (
                    <span
                      className={`absolute -bottom-1.5 -right-3 grid size-7 place-items-center rounded-full border-2 border-rb-snow bg-rb-snow shadow-[0_2px_4px_rgb(0_0_0/0.18)] ${
                        locked
                          ? "text-rb-hare"
                          : retakeable
                            ? "text-rb-macaw"
                            : "text-rb-leaf"
                      }`}
                    >
                      {locked ? (
                        <Lock className="size-4" aria-hidden="true" />
                      ) : retakeable ? (
                        <RotateCcw className="size-4" aria-hidden="true" />
                      ) : (
                        <Check className="size-4" aria-hidden="true" />
                      )}
                    </span>
                  ) : null}
                </span>
              ) : locked ? (
                <Lock className="size-11" aria-hidden="true" />
              ) : retakeable ? (
                <RotateCcw className="size-11" aria-hidden="true" />
              ) : done ? (
                <Check className="size-12" aria-hidden="true" />
              ) : (
                <Icon className="size-11" aria-hidden="true" />
              )}

              {node.art && !locked ? (
                <img
                  src={node.art}
                  alt=""
                  className={`absolute object-contain ${node.grand ? "size-20" : "size-14"}`}
                  onError={(event) => {
                    event.currentTarget.style.display = "none"
                  }}
                />
              ) : null}
            </span>
            )}

            {node.urgent && !locked ? (
              <motion.span
                className="absolute right-1 size-5 rounded-full bg-rb-cardinal ring-4 ring-rb-polar"
                style={{ top: dims.lift - 4 }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              />
            ) : null}
          </button>
        </motion.div>


        <div
          className={`pointer-events-none absolute ${
            side === "below"
              ? "left-1/2 w-[168px] -translate-x-1/2 text-center"
              : side === "right"
                ? "left-full ml-4 w-[210px] text-left"
                : "right-full mr-4 w-[210px] text-right"
          }`}
          style={
            side === "below"
              ?
                { top: dims.lift + dims.plinthH + dims.plinthD + 10 }
              : { top: dims.lift, height: dims.plinthH, display: "grid", alignContent: "center" }
          }
        >
          <p className="font-rb-display text-[15px] font-extrabold leading-tight text-rb-eel">
            {node.label}
          </p>

          {node.meta ? (
            <p className="mt-1 text-[12px] font-bold text-rb-wolf">{node.meta}</p>
          ) : null}

          {node.progress != null && node.progress > 0 && node.progress < 100 ? (
            <NodeProgress value={node.progress} />
          ) : null}

          {node.xp && !locked ? (
            <span className={`mt-1 inline-flex ${side === "below" ? "justify-center" : ""}`}>
              <XpPill amount={node.xp} earned={done} upTo />
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function PathBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <svg className="size-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="rb-dots" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="var(--color-rb-eel)" opacity="0.06" />
          </pattern>

          <radialGradient id="rb-wash-a">
            <stop offset="0%" stopColor="var(--color-rb-macaw)" stopOpacity="0.10" />
            <stop offset="100%" stopColor="var(--color-rb-macaw)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="rb-wash-b">
            <stop offset="0%" stopColor="var(--color-rb-bee)" stopOpacity="0.09" />
            <stop offset="100%" stopColor="var(--color-rb-bee)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="rb-wash-c">
            <stop offset="0%" stopColor="var(--color-rb-beetle)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="var(--color-rb-beetle)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#rb-dots)" />

        <circle cx="8%" cy="18%" r="320" fill="url(#rb-wash-a)" />
        <circle cx="94%" cy="52%" r="380" fill="url(#rb-wash-b)" />
        <circle cx="14%" cy="88%" r="300" fill="url(#rb-wash-c)" />
      </svg>
    </div>
  )
}

function UnitMarker({ major, locked, complete, exam, examTaken, wipes }) {
  const tone = TONE[major.tone]

  return (
    <div className="sticky top-[4.25rem] z-20 bg-rb-polar pb-2 pt-4">

      {wipes ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-full h-full bg-rb-polar"
        />
      ) : null}

      <div className="flex items-end gap-4">
        <div className="min-w-0 flex-1">
          <p
            className={`text-[11px] font-extrabold uppercase tracking-[0.18em] ${
              locked ? "text-rb-hare" : tone.ink
            }`}
          >
            unit {major.index}
          </p>

          <h2
            className={`mt-0.5 truncate font-rb-display text-xl font-extrabold lowercase leading-tight sm:text-2xl ${
              locked ? "text-rb-hare" : "text-rb-eel"
            }`}
          >
            {major.name}
          </h2>
        </div>

        <div className="shrink-0 text-right">
          <p
            className={`flex items-center justify-end gap-1.5 text-xs font-extrabold ${
              locked ? "text-rb-hare" : complete ? tone.ink : "text-rb-wolf"
            }`}
          >
            {locked ? (
              <>
                <Lock className="size-3.5" aria-hidden="true" />
                locked
              </>
            ) : complete ? (
              <>
                <Check className="size-3.5" aria-hidden="true" />
                unit complete
              </>
            ) : (
              `${major.doneCount}/${major.lessonCount} lessons`
            )}
          </p>

          {exam && examTaken && !locked ? (
            <Link
              to={`/learner/assessments/${exam.examId}/history`}
              className="mt-0.5 inline-block rounded-rb-pill text-[11px] font-bold text-rb-macaw-lip underline decoration-dotted underline-offset-4 hover:text-rb-macaw"
            >
              unit exam attempts
            </Link>
          ) : null}
        </div>
      </div>

      <span
        className={`mt-2 block h-[3px] rounded-rb-pill ${locked ? "bg-rb-swan" : tone.face}`}
      />
    </div>
  )
}

function attemptsSuffix(attemptsByExamId, examId) {
  const count = attemptsByExamId?.get(String(examId)) ?? 0
  if (count <= 0) return ""
  return ` · ${count} ${count === 1 ? "attempt" : "attempts"}`
}

function standingSuffix(standing) {
  if (!standing?.taken || standing.cleared) return ""
  if (!standing.passed) return " · not passed yet"
  return ` · proficiency ${Math.round(standing.rating)}, need ${PROFICIENT_RATING}`
}

function unitNodes(major, takenExamIds, attemptsByExamId, examResults) {
  const nodes = major.middles.map((middle, index) => {
    const total = middle.lessons.length
    const done = total > 0 && middle.cleared

    return {
      key: `topic-${middle.id}`,
      kind: "topic",
      middle,
      tone: major.tone,
      icon: BookOpen,
      label: middle.name,
      meta: total === 0 ? "no lessons yet" : `${middle.done}/${total} lessons`,
      progress: total === 0 ? null : (middle.done / total) * 100,
      done,
      empty: total === 0,
      urgent: middle.lessons.some(
        (lesson) => lesson.priorityTag === "CRITICAL_PRIORITY",
      ),
      index,
    }
  })

  if (major.assessment) {
    nodes.push({
      key: `exam-${major.assessment.examId}`,
      kind: "exam",
      exam: major.assessment,
      tone: "fox",
      icon: ClipboardCheck,
      label: major.assessment.title,
      meta: `unit exam · ${major.assessment.totalQuestions} questions${attemptsSuffix(
        attemptsByExamId,
        major.assessment.examId,
      )}${standingSuffix(examStanding(examResults, major.assessment.examId))}`,
      xp: ASSESSMENT_MAX_XP,
      done: examStanding(examResults, major.assessment.examId).cleared,
      standing: examStanding(examResults, major.assessment.examId),
    })
  }

  return nodes
}


function CurriculumSkeleton() {
  return <LoadingSignal />
}

export default function LearnerCertificationCurriculumPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const narrowRoad = useIsNarrowViewport()
  const { certificationId } = useParams()
  const { data } = useOutletContext()

  const [lock, setLock] = useState(null)

  function openLock(node) {
    if (node?.blockedByNode) setLock({ kind: "node", node: node.blockedByNode, target: node })
    else setLock(node?.blockedBy ? { kind: "unit", unit: node.blockedBy } : { kind: "diagnostic" })
  }

  const certification = (data?.enrolledCertifications ?? []).find(
    (item) => String(item.certificationId) === String(certificationId),
  )

  const examsQuery = useQuery({ queryKey: ["exams"], queryFn: () => getExams(), staleTime: 60_000 })
  const examTypesQuery = useQuery({
    queryKey: ["exam-types"],
    queryFn: getExamTypes,
    staleTime: 5 * 60_000,
  })

  const examTypesById = useMemo(
    () =>
      new Map(
        (examTypesQuery.data ?? []).map((type) => [
          String(type.examTypeId),
          String(type.examTypeText ?? "").toUpperCase(),
        ]),
      ),
    [examTypesQuery.data],
  )

  const lessonById = useMemo(
    () => new Map((data?.lessons ?? []).map((lesson) => [String(lesson.lessonId), lesson])),
    [data?.lessons],
  )

  const certificationExams = useMemo(
    () =>
      (examsQuery.data ?? []).filter(
        (exam) => String(exam.certificationId) === String(certificationId),
      ),
    [examsQuery.data, certificationId],
  )

  const masteryPoll = useRef({ enabled: false, startedAt: 0 })
  const masteryQuery = useQuery({
    queryKey: ["learner-progress-analytics", certificationId],
    queryFn: () => getProgressAnalytics(certificationId),
    enabled: Boolean(certificationId),
    staleTime: 0,
    refetchInterval: (query) => {
      const poll = masteryPoll.current
      if (query.state.data?.bktAvailable || !poll.enabled) return false
      if (!poll.startedAt) poll.startedAt = Date.now()
      return Date.now() - poll.startedAt < MASTERY_POLL_WINDOW_MS ? MASTERY_POLL_MS : false
    },
  })

  const lessonPriorityById = useMemo(() => {
    const map = new Map()
    for (const topic of masteryQuery.data?.lessonPriorities ?? []) {
      if (topic.lessonId != null) map.set(String(topic.lessonId), topic.priorityTag)
    }
    return map
  }, [masteryQuery.data])

  const queryClient = useQueryClient()
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["learner-portal-data"] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const curriculum = useMemo(() => {
    if (!certification) return null
    return buildCurriculum({
      certification,
      lessonById,
      exams: certificationExams,
      examTypesById,
      lessonPriorityById,
      examResults: data?.examResults ?? [],
    })
  }, [certification, lessonById, certificationExams, examTypesById, lessonPriorityById, data?.examResults])

  const diagnosticDone = useMemo(() => {
    if (!curriculum) return false
    return hasSatDiagnostic({
      diagnostic: curriculum.diagnostic,
      examResults: data?.examResults ?? [],
      certificationId,
    })
  }, [curriculum, data?.examResults, certificationId])

  useEffect(() => {
    masteryPoll.current = { enabled: diagnosticDone, startedAt: 0 }
    if (diagnosticDone && masteryQuery.data && !masteryQuery.data.bktAvailable) masteryQuery.refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagnosticDone, certificationId])

  const takenExamIds = useMemo(
    () =>
      new Set(
        (data?.examResults ?? [])
          .map((result) => (result.examId == null ? null : String(result.examId)))
          .filter(Boolean),
      ),
    [data?.examResults],
  )

  const attemptsByExamId = useMemo(() => {
    const counts = new Map()
    for (const result of data?.examResults ?? []) {
      if (result?.examId == null) continue
      const key = String(result.examId)
      const attemptNo = Number(result.attemptNo)
      const seen = Number.isFinite(attemptNo) && attemptNo > 0 ? attemptNo : 1
      counts.set(key, Math.max(counts.get(key) ?? 0, seen))
    }
    return counts
  }, [data?.examResults])

  const { sections, finalNode, finalIndex } = useMemo(() => {
    const built = (curriculum?.majors ?? []).map((major) => ({
      major,
      nodes: unitNodes(major, takenExamIds, attemptsByExamId, data?.examResults),
    }))

    const mock = curriculum?.mockExam
      ? {
          key: `mock-${curriculum.mockExam.examId}`,
          kind: "exam",
          exam: curriculum.mockExam,
          tone: "fox",
          icon: Trophy,
          grand: true,
          label: curriculum.mockExam.title,
          meta: `final · ${curriculum.mockExam.totalQuestions} questions${attemptsSuffix(
            attemptsByExamId,
            curriculum.mockExam.examId,
          )}`,
          xp: ASSESSMENT_MAX_XP,
          done: Boolean(takenExamIds?.has(String(curriculum.mockExam.examId))),
        }
      : null

    let index = 0
    let currentTaken = false
    let previousUnitsComplete = true
    let blocker = null

    for (const section of built) {
      section.start = index
      index += section.nodes.length

      section.complete = section.nodes.every((node) => node.done || node.empty)
      section.locked = !diagnosticDone || !previousUnitsComplete
      section.blockedBy = blocker

      let previousNode = null
      for (const node of section.nodes) {
        if (section.locked) {
          node.state = "locked"
          node.blockedBy = blocker
          continue
        }
        if (node.done) {
          node.state = "done"
          previousNode = node
          continue
        }
        const gate = node.kind === "exam"
            ? section.nodes.find((other) => other.kind === "topic" && !other.done && !other.empty) ?? null
            : previousNode && !previousNode.done && !previousNode.empty ? previousNode : null
        if (gate) {
          node.state = "locked"
          node.blockedByNode = gate
          previousNode = node
          continue
        }
        previousNode = node
        if (!currentTaken && !node.empty) {
          node.state = "current"
          currentTaken = true
          continue
        }
        node.state = "open"
      }

      if (!section.complete && !blocker) blocker = section.major
      previousUnitsComplete = previousUnitsComplete && section.complete
    }

    if (mock) {
      if (!diagnosticDone || !previousUnitsComplete) {
        mock.state = "locked"
        mock.blockedBy = blocker
      } else if (mock.done) {
        mock.state = "done"
      } else if (!currentTaken) {
        mock.state = "current"
        currentTaken = true
      } else {
        mock.state = "open"
      }
    }

    return { sections: built, finalNode: mock, finalIndex: index }
  }, [curriculum, takenExamIds, attemptsByExamId, diagnosticDone])

  const progressRow = findCertificationProgress(data?.certificationProgress, certificationId)
  const headerProgress = progressRow
    ? certificationProgressPercent(progressRow)
    : (curriculum?.progress ?? 0)

  const [skippedMasteryWait, setSkippedMasteryWait] = useState(false)
  const masteryReady =
    !diagnosticDone || skippedMasteryWait || masteryQuery.data?.bktAvailable === true

  const {
    plan: activePlan,
    isLoading: planLoading,
    isError: planLookupFailed,
    hasAnyPlan,
  } = useCertificationStudyPlan(certificationId)
  const hasPlan = Boolean(activePlan?.planId)

  if (!certification) {
    return (
      <LearnerEmptyState
        icon={BookOpen}
        title="Certification not found"
        description="You are not enrolled in this certification, or it is no longer published."
        action={
          <TactileButton variant="macaw" size="sm" onClick={() => navigate("/learner/learning")}>
            Back to my learning
          </TactileButton>
        }
      />
    )
  }

  if (examsQuery.isLoading || examTypesQuery.isLoading || !curriculum) {
    return <CurriculumSkeleton />
  }

  if (diagnosticDone && !masteryReady) {
    return (
      <div className="rebyu-ds flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-rb-polar px-5">
        <div className="w-full max-w-md rounded-rb-card border-2 border-rb-swan bg-rb-snow p-8 text-center shadow-[var(--comic-shadow-sm)]">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-rb-macaw-wash text-rb-macaw-lip">
            <Brain className="size-7" aria-hidden="true" />
          </span>

          <h1 className="mt-5 font-rb-display text-xl font-extrabold text-rb-eel">
            Processing your mastery
          </h1>

          <p className="mt-2 text-sm leading-6 text-rb-wolf">
            We're turning your diagnostic answers into a priority-ordered study plan. This
            usually takes a few seconds.
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-rb-macaw-lip">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Analyzing results…
          </div>

          <button
            type="button"
            onClick={() => setSkippedMasteryWait(true)}
            className="mt-6 text-xs font-bold text-rb-hare underline decoration-dotted underline-offset-4 hover:text-rb-wolf"
          >
            Taking too long? Continue without waiting
          </button>
        </div>
      </div>
    )
  }

  if (diagnosticDone && !planLoading && !planLookupFailed && !hasAnyPlan) {
    const returnTo = `/learner/learning/${certificationId}`
    return (
      <Navigate
        to={`/learner/analytics?certification=${certificationId}`
          + `&plan=1&returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    )
  }

  function openTopic(middle) {
    navigate(`/learner/learning/${certificationId}/topics/${middle.id}`)
  }

  function openNode(node) {
    if (node.kind === "exam") {
      navigate(`/learner/assessments/${node.exam.examId}`, {
        state: returnState(location),
      })
      return
    }
    if (node.empty) return
    openTopic(node.middle)
  }

  function openDiagnostic() {
    setLock(null)
    navigate(
      curriculum.diagnostic
        ? `/learner/assessments/${curriculum.diagnostic.examId}`
        : `/learner/learning/${certificationId}/diagnostic`,
      { state: { certification, ...returnState(location) } },
    )
  }

  return (
    <div className="rebyu-ds relative isolate min-h-dvh w-full bg-rb-polar pb-20">
      <PathBackdrop />

      <div className="mx-auto flex max-w-[1600px] items-center gap-2 px-4 pb-1 pt-4 sm:gap-3 sm:px-5 lg:px-8">

        <h1 className="sr-only">{certification.title ?? "Certification"}</h1>

      </div>

      {!diagnosticDone ? (
        <Reveal
          variants={popIn}
          amount={0}
          className="mx-auto mt-6 flex max-w-[720px] flex-col gap-4 rounded-rb-card border-2 border-rb-swan bg-rb-fox-wash p-5 sm:flex-row sm:items-center"
        >
          <motion.span
            className="grid size-12 shrink-0 place-items-center rounded-2xl bg-rb-fox text-white"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Lock className="size-5" aria-hidden="true" />
          </motion.span>

          <div className="min-w-0 flex-1">
            <p className="font-rb-display text-base font-extrabold text-rb-eel">
              Take your diagnostic to unlock the curriculum
            </p>
            <p className="mt-1 text-sm font-medium text-rb-wolf">
              It decides which topics your study plan puts first.
            </p>
          </div>

          <TactileButton variant="fox" size="sm" onClick={() => setLock({ kind: "diagnostic" })}>
            <ClipboardCheck className="size-4" />
            take diagnostic
          </TactileButton>
        </Reveal>
      ) : null}

      <CurriculumDock
        certificationId={certificationId}
        progress={headerProgress}
        showCalendar={diagnosticDone && hasPlan}
      />

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-5 sm:py-10 lg:px-8">
        {curriculum.majors.length === 0 ? (
          <LearnerEmptyState
            icon={BookOpen}
            title="No curriculum published yet"
            description="This certification has no units with published lessons. Check back once content is released."
          />
        ) : (
          <NarrowRoadContext.Provider value={narrowRoad}>
          <StaggerList className="space-y-6" stagger={0.09} amount={0}>
            <StaggerItem variants={fadeUp}>
              <div className="mx-auto max-w-[820px]">
                {sections.map((section, sectionIndex) => {
                  const isLast = sectionIndex === sections.length - 1
                  const stops =
                    isLast && finalNode ? [...section.nodes, finalNode] : section.nodes

                  return (
                    <section
                      key={section.major.id}
                      id={`unit-${section.major.id}`}
                      className="scroll-mt-24"
                    >
                      <UnitMarker
                        wipes={sectionIndex > 0}
                        major={section.major}
                        exam={section.major.assessment}
                        locked={section.locked}
                        complete={section.complete}
                        examTaken={Boolean(
                          section.major.assessment
                          && takenExamIds.has(String(section.major.assessment.examId)),
                        )}
                      />

                      <div
                        className="relative mx-auto mt-6 mb-24 sm:mb-32"
                        style={{
                          width: pathWidthOf(narrowRoad),
                          height: stretchHeight(stops, narrowRoad),
                        }}
                      >
                        <PathTrail items={stops} start={section.start} />

                        {stops.map((node, nodeIndex) => (
                          <PathNode
                            key={node.key}
                            node={node}
                            index={section.start + nodeIndex}
                            onSelect={openNode}
                            onLocked={openLock}
                          />
                        ))}
                      </div>
                    </section>
                  )
                })}

                {finalNode && sections.length === 0 ? (
                  <div
                    className="relative mx-auto mt-6"
                    style={{
                      width: pathWidthOf(narrowRoad),
                      height: stretchHeight([finalNode], narrowRoad),
                    }}
                  >
                    <PathNode
                      node={finalNode}
                      index={finalIndex}
                      onSelect={openNode}
                      onLocked={openLock}
                    />
                  </div>
                ) : null}
              </div>
            </StaggerItem>

          </StaggerList>
          </NarrowRoadContext.Provider>
        )}
      </main>

      <Dialog open={lock != null} onOpenChange={(open) => !open && setLock(null)}>
        <DialogContent className="rebyu-ds sm:max-w-md">
          {lock?.kind === "node" ? (
            <>
              <DialogHeader>
                <div className="mb-2 grid size-14 place-items-center rounded-2xl bg-rb-swan text-rb-wolf">
                  <Lock className="size-7" aria-hidden="true" />
                </div>

                <DialogTitle>{lock.node.label} comes first</DialogTitle>

                <DialogDescription>
                  {lock.node.kind === "exam"
                    ? `Every topic in this unit opens the unit exam, and the exam has to be passed at a proficient level (${PROFICIENT_RATING}+) before the next unit opens.`
                    : lock.target?.kind === "exam"
                      ? `Finish every topic in this unit — read each lesson and clear its quiz — and the unit exam opens.`
                      : `Finish ${lock.node.label} — read every lesson in it and pass each quiz at a proficient level — and ${lock.target?.label ?? "the next topic"} opens on its own.`}
                </DialogDescription>
              </DialogHeader>

              {lock.node.kind === "topic" && lock.node.meta ? (
                <p className="text-sm font-bold text-rb-eel">{lock.node.meta} in that topic.</p>
              ) : null}
              {lock.node.kind === "exam" && lock.node.standing?.reason ? (
                <p className="text-sm font-bold text-rb-eel">Unit exam: {lock.node.standing.reason}.</p>
              ) : null}

              <DialogFooter>
                <TactileButton variant="ghost" size="sm" onClick={() => setLock(null)}>
                  close
                </TactileButton>
              </DialogFooter>
            </>
          ) : lock?.kind === "unit" ? (
            <>
              <DialogHeader>
                <div className="mb-2 grid size-14 place-items-center rounded-2xl bg-rb-swan text-rb-wolf">
                  <Lock className="size-7" aria-hidden="true" />
                </div>

                <DialogTitle>Unit {lock.unit.index} comes first</DialogTitle>

                <DialogDescription>
                  The road is walked in order. Finish {lock.unit.name} — every topic in it, and
                  its unit exam passed at a proficient level — and the next unit opens on its own.
                </DialogDescription>
              </DialogHeader>

              <p className="text-sm font-bold text-rb-eel">
                {lock.unit.doneCount}/{lock.unit.lessonCount} lessons read in that unit.
              </p>

              <DialogFooter>
                <TactileButton variant="ghost" size="sm" onClick={() => setLock(null)}>
                  close
                </TactileButton>

                <TactileButton
                  variant="macaw"
                  size="sm"
                  onClick={() => {
                    const target = document.getElementById(`unit-${lock.unit.id}`)
                    setLock(null)
                    target?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }}
                >
                  go to unit {lock.unit.index}
                  <ArrowRight className="size-4" />
                </TactileButton>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <div className="mb-2 grid size-14 place-items-center rounded-2xl bg-rb-fox-wash text-rb-fox-lip">
                  <ClipboardCheck className="size-7" aria-hidden="true" />
                </div>

                <DialogTitle>Diagnostic exam</DialogTitle>

                <DialogDescription>
                  The curriculum stays locked until we know where you are starting from. The
                  diagnostic samples every unit, so the result decides the order you study them
                  in.
                </DialogDescription>
              </DialogHeader>

              <ul className="space-y-2 rounded-rb-card border-2 border-rb-swan bg-rb-polar p-4">
                {[
                  [
                    Clock,
                    curriculum.diagnostic?.durationMinutes
                      ? `About ${curriculum.diagnostic.durationMinutes} minutes`
                      : "Self-paced",
                  ],
                  [
                    CircleHelp,
                    curriculum.diagnostic
                      ? `${curriculum.diagnostic.totalQuestions} questions across the certification`
                      : "Questions across the certification",
                  ],
                  [CheckCircle2, "No pass mark — it only sets your plan"],
                ].map(([Icon, text]) => (
                  <li key={text} className="flex items-center gap-3 text-sm font-bold text-rb-eel">
                    <Icon className="size-4 shrink-0 text-rb-wolf" aria-hidden="true" />
                    {text}
                  </li>
                ))}
              </ul>

              <DialogFooter>
                <TactileButton variant="ghost" size="sm" onClick={() => setLock(null)}>
                  not now
                </TactileButton>

                <TactileButton variant="fox" size="sm" onClick={openDiagnostic}>
                  start diagnostic
                  <ArrowRight className="size-4" />
                </TactileButton>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
