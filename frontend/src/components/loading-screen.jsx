import { useEffect, useId, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

/**
 * Boot screen — a comic page.
 *
 * The whole window is one printed page of four panels, and the same character
 * (the REBYU study hero -- the same pop-art face as the eye in the logo) plays a
 * different scene in each: studying at a desk, the lightbulb moment, the dash
 * to the exam, the win. The panels light up in reading order, one per status
 * message, so the wait reads as a story being told rather than a bar filling.
 *
 * Every panel is on screen from the first frame — only which one is "live"
 * changes — because a boot screen is often seen for a quarter of a second, and
 * a page that has to build itself first would be blank for most of those.
 *
 * The character is drawn here in SVG rather than shipped as artwork: four
 * poses of one figure stay consistent with each other, scale to any panel, and
 * cost no network request on the one screen that exists because the network is
 * slow.
 */

/* Each list has four stages, one per panel. A list of a different length still
   works -- the panel is picked modulo four. */
const MESSAGES = [
  { tag: "confidence", text: "Building your confidence...", tone: "macaw" },
  { tag: "mastery", text: "Syncing your mastery...", tone: "bee" },
  { tag: "study plan", text: "Leveling up your study plan...", tone: "beetle" },
  { tag: "challenge", text: "Loading your next challenge...", tone: "fox" },
]

/**
 * Copy for the wait after submitting an assessment. Names the real grading
 * stages, in the order the server runs them.
 */
export const GRADING_MESSAGES = [
  { tag: "answers", text: "Checking your answers...", tone: "macaw" },
  { tag: "written", text: "Marking your written responses...", tone: "beetle" },
  { tag: "code", text: "Running your code against the tests...", tone: "fox" },
  { tag: "score", text: "Totalling your score...", tone: "bee" },
]

/**
 * Copy for the wait before an attempt opens: the server creates the attempt,
 * snapshots the questions, picks the set and restores autosaved answers.
 */
export const ATTEMPT_MESSAGES = [
  { tag: "paper", text: "Setting out your paper...", tone: "macaw" },
  { tag: "questions", text: "Picking your questions...", tone: "beetle" },
  { tag: "answers", text: "Restoring any answers you saved...", tone: "bee" },
  { tag: "ready", text: "Almost ready...", tone: "fox" },
]

/* ----------------------------------------------------------------- the hero */

const INK = "#17182b"
const SKIN = "#f6c9a0"
const SKIN_DOT = "#e2a576"
const HAIR = "#f7d85c"
const HAIR_SHADE = "#d49a2a"
const IRIS = "#2f9e8f"
const LIPS = "#d7263d"
const SHIRT = "#2f5fd0"
const PANTS = "#1b1f3b"
const BAND = "#ef4136"

/** An inked limb: a fat ink stroke with the colour laid down its middle. */
function Limb({ d, color }) {
  return (
    <>
      <path d={d} stroke={INK} strokeWidth={15} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={d} stroke={color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  )
}

function Hand({ x, y }) {
  return <circle cx={x} cy={y} r={6.5} fill={SKIN} stroke={INK} strokeWidth={2.5} />
}

function Shoe({ x, y }) {
  return <ellipse cx={x} cy={y} rx={12} ry={6} fill={INK} />
}

const MOUTHS = {
  smile: <path d="M92 96 Q100 102 108 96 Q100 99 92 96 Z" fill={LIPS} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />,
  focus: <path d="M94 97 Q100 100 106 97" stroke={LIPS} strokeWidth={3} strokeLinecap="round" fill="none" />,
  open: <path d="M91 94 Q100 108 109 94 Q100 97 91 94 Z" fill={LIPS} stroke={INK} strokeWidth={2} strokeLinejoin="round" />,
}

/**
 * The hero's head, drawn to match the brand mark: the same pop-art face as
 * the eye in the logo -- blonde hair, a heavy black brow, a teal iris under a
 * thick lash line, and peach skin printed with a halftone dot screen.
 */
function Head({ mouth = "smile", tails = false, lookDown = false }) {
  // One dot pattern per head. `useId` output contains characters that are not
  // valid in a `url(#…)` reference, so it is reduced to a safe token.
  const dotsId = `rb-skin-dots-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
  const irisY = lookDown ? 85 : 83

  return (
    <g>
      <defs>
        <pattern id={dotsId} width={6} height={6} patternUnits="userSpaceOnUse">
          <rect width={6} height={6} fill={SKIN} />
          <circle cx={3} cy={3} r={1.5} fill={SKIN_DOT} opacity={0.6} />
        </pattern>
      </defs>

      {/* Ponytail: streams out behind when the hero is running, hangs otherwise. */}
      {tails ? (
        <path d="M126 52 Q162 40 184 56 Q158 62 132 72 Z" fill={HAIR} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      ) : (
        <path d="M124 48 Q152 58 146 106 Q138 88 124 80 Z" fill={HAIR} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      )}

      <circle cx={100} cy={74} r={32} fill={`url(#${dotsId})`} stroke={INK} strokeWidth={3} />

      {/* Side-swept blonde fringe, with two shade strokes for the pop-art sheen. */}
      <path
        d="M66 76 Q60 30 102 30 Q142 32 136 74 Q128 52 110 46 Q92 58 70 62 Z"
        fill={HAIR}
        stroke={INK}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path d="M104 34 Q96 46 84 56 M122 40 Q118 48 112 47" stroke={HAIR_SHADE} strokeWidth={2} strokeLinecap="round" fill="none" />

      {/* The logo's brows: thick, black, angled in -- determined. */}
      <path d="M77 70 L96 74 L95 79 L78 75 Z" fill={INK} />
      <path d="M104 74 L123 69 L122 75 L105 79 Z" fill={INK} />

      <path d="M80 84 Q88 78 97 84 Q88 90 80 84 Z" fill="#fff" stroke={INK} strokeWidth={1.5} />
      <path d="M103 84 Q112 78 120 84 Q112 90 103 84 Z" fill="#fff" stroke={INK} strokeWidth={1.5} />
      <circle cx={89} cy={irisY} r={4} fill={IRIS} stroke={INK} strokeWidth={1.2} />
      <circle cx={111} cy={irisY} r={4} fill={IRIS} stroke={INK} strokeWidth={1.2} />
      <circle cx={89} cy={irisY} r={1.7} fill={INK} />
      <circle cx={111} cy={irisY} r={1.7} fill={INK} />
      <path d="M78 83 Q88 75 98 83 M102 83 Q112 75 122 83" stroke={INK} strokeWidth={3} strokeLinecap="round" fill="none" />

      <ellipse cx={79} cy={92} rx={5} ry={2.5} fill="#ff8fa3" opacity={0.5} />
      <ellipse cx={121} cy={92} rx={5} ry={2.5} fill="#ff8fa3" opacity={0.5} />
      {MOUTHS[mouth]}
    </g>
  )
}

function Torso() {
  return (
    <>
      <path d="M72 172 Q70 122 100 108 Q130 122 128 172 Z" fill={SHIRT} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d="M88 110 L100 126 L112 110" fill="#fff" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
    </>
  )
}

/** Exported for the landing hero, which casts the same character. */
export function ComicHero({ pose, active, still, className = "" }) {
  const animateProps = !active || still
  const pulse = animateProps
    ? { scale: 1 }
    : { scale: [1, 1.18, 1] }

  return (
    <svg viewBox="0 0 200 220" className={className} aria-hidden="true" role="presentation">
      {pose === "read" ? (
        <g>
          <Torso />
          <Limb d="M80 124 Q68 146 84 150" color={SHIRT} />
          <Limb d="M120 124 Q132 146 116 150" color={SHIRT} />
          <Head mouth="focus" lookDown />
          <rect x={18} y={160} width={164} height={12} rx={3} fill="#c98b4b" stroke={INK} strokeWidth={3} />
          <rect x={30} y={172} width={140} height={46} fill="#8a5a2b" stroke={INK} strokeWidth={3} />
          <path d="M100 138 L62 132 L64 158 L100 162 Z" fill="#fff" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <path d="M100 138 L138 132 L136 158 L100 162 Z" fill="#fff" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <path d="M70 140 L94 144 M70 147 L94 151 M106 144 L130 140 M106 151 L130 147" stroke={INK} strokeWidth={1.5} opacity={0.5} />
          <Hand x={84} y={150} />
          <Hand x={116} y={150} />
          {/* Mug, with steam that rises while the panel is live. */}
          <rect x={148} y={140} width={20} height={20} rx={3} fill="#f8e05a" stroke={INK} strokeWidth={3} />
          <path d="M168 145 Q178 150 168 156" stroke={INK} strokeWidth={3} fill="none" />
          <motion.path
            d="M154 134 Q150 126 156 120 M162 134 Q158 126 164 118"
            stroke={INK}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
            animate={animateProps ? { opacity: 0.4, y: 0 } : { opacity: [0, 0.7, 0], y: [4, -4, -8] }}
            transition={animateProps ? { duration: 0 } : { duration: 1.4, repeat: Infinity }}
          />
        </g>
      ) : null}

      {pose === "idea" ? (
        <g>
          <Limb d="M90 170 L86 204" color={PANTS} />
          <Limb d="M110 170 L114 204" color={PANTS} />
          <Shoe x={82} y={210} />
          <Shoe x={118} y={210} />
          <Torso />
          <Limb d="M78 124 Q56 142 76 160" color={SHIRT} />
          <Limb d="M122 124 Q146 104 150 76" color={SHIRT} />
          <Head mouth="open" />
          <Hand x={76} y={160} />
          <Hand x={150} y={72} />
          <motion.g
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            animate={pulse}
            transition={animateProps ? { duration: 0 } : { duration: 0.8, repeat: Infinity }}
          >
            <path d="M150 4 L150 -4 M131 12 L125 6 M169 12 L175 6 M126 30 L118 30 M174 30 L182 30" stroke={INK} strokeWidth={3} strokeLinecap="round" transform="translate(0 6)" />
            <circle cx={150} cy={34} r={15} fill="#fff3a8" stroke={INK} strokeWidth={3} />
            <rect x={144} y={48} width={12} height={8} rx={2} fill="#9aa3b5" stroke={INK} strokeWidth={2.5} />
          </motion.g>
        </g>
      ) : null}

      {pose === "run" ? (
        <g>
          <path d="M4 100 L40 100 M0 124 L34 124 M10 148 L44 148" stroke={INK} strokeWidth={3} strokeLinecap="round" opacity={0.55} />
          <g transform="rotate(12 100 140)">
            <Limb d="M104 170 Q86 186 66 180" color={PANTS} />
            <Shoe x={62} y={178} />
            <Limb d="M80 124 Q62 140 52 128" color={SHIRT} />
            <Hand x={50} y={126} />
            <Torso />
            <Limb d="M96 170 Q118 184 128 202" color={PANTS} />
            <Shoe x={132} y={206} />
            <Head mouth="smile" tails />
            <Limb d="M120 124 Q142 138 150 124" color={SHIRT} />
            <Hand x={152} y={122} />
          </g>
        </g>
      ) : null}

      {pose === "win" ? (
        <g>
          <Limb d="M90 170 L76 204" color={PANTS} />
          <Limb d="M110 170 L124 204" color={PANTS} />
          <Shoe x={72} y={210} />
          <Shoe x={128} y={210} />
          <Torso />
          <Limb d="M80 122 Q62 96 60 68" color={SHIRT} />
          <Limb d="M120 122 Q138 96 140 68" color={SHIRT} />
          <Head mouth="open" />
          {/* The certificate, held overhead. */}
          <rect x={50} y={34} width={100} height={28} rx={4} fill="#fff" stroke={INK} strokeWidth={3} />
          <text x={96} y={55} textAnchor="middle" fontFamily="Bangers, Impact, sans-serif" fontSize={20} fill={INK}>
            PASS!
          </text>
          <circle cx={134} cy={55} r={7} fill={BAND} stroke={INK} strokeWidth={2} />
          <Hand x={58} y={62} />
          <Hand x={142} y={62} />
          <motion.g
            animate={animateProps ? { opacity: 1 } : { opacity: [0.3, 1, 0.3], y: [0, 6, 12] }}
            transition={animateProps ? { duration: 0 } : { duration: 1, repeat: Infinity }}
          >
            <rect x={28} y={20} width={8} height={5} fill="#f8e05a" stroke={INK} strokeWidth={1.5} transform="rotate(20 32 22)" />
            <rect x={166} y={16} width={8} height={5} fill="#22bfee" stroke={INK} strokeWidth={1.5} transform="rotate(-25 170 18)" />
            <rect x={20} y={70} width={7} height={5} fill={BAND} stroke={INK} strokeWidth={1.5} transform="rotate(40 24 72)" />
            <rect x={174} y={80} width={7} height={5} fill="#b6d334" stroke={INK} strokeWidth={1.5} transform="rotate(-10 178 82)" />
          </motion.g>
        </g>
      ) : null}
    </svg>
  )
}

/* ------------------------------------------------------------------- scenes */

const SCENES = [
  {
    pose: "read",
    sfx: "scribble!",
    sfxTone: "",
    surface: "bg-[url('/brand/sky-1280.webp')] bg-cover bg-[center_65%]",
    motion: { y: [0, -4, 0] },
    duration: 1.2,
  },
  {
    pose: "idea",
    sfx: "ding!",
    sfxTone: "",
    surface: "rb-sunburst bg-rb-sun",
    motion: { y: [0, -8, 0] },
    duration: 0.9,
  },
  {
    pose: "run",
    sfx: "whoosh!",
    sfxTone: "",
    surface: "rb-speedlines bg-rb-cyan",
    motion: { x: [-5, 5, -5], y: [0, -10, 0] },
    duration: 0.45,
  },
  {
    pose: "win",
    sfx: "yes!!",
    sfxTone: "",
    surface: "rb-sunburst bg-rb-magenta",
    motion: { y: [0, -18, 0] },
    duration: 0.7,
  },
]

/* Slanted gutters from md up: panels 1|2 lean one way, 3|4 the other, and the
   right-hand panel of each row is pulled under its neighbour's slant. */
const PLACEMENT = [
  "md:col-span-7 md:[clip-path:polygon(0_0,100%_0,calc(100%_-_1.5rem)_100%,0_100%)]",
  "md:col-span-5 md:-ml-6 md:[clip-path:polygon(1.5rem_0,100%_0,100%_100%,0_100%)]",
  "md:col-span-5 md:[clip-path:polygon(0_0,calc(100%_-_1.5rem)_0,100%_100%,0_100%)]",
  "md:col-span-7 md:-ml-6 md:[clip-path:polygon(0_0,100%_0,100%_100%,1.5rem_100%)]",
]

function ScenePanel({ scene, index, active, still, message }) {
  const live = active && !still

  return (
    <div className={`rb-panel relative min-h-0 overflow-hidden ${scene.surface} ${PLACEMENT[index]}`}>
      <motion.div
        className="absolute inset-x-0 bottom-0 flex h-[74%] justify-center"
        animate={live ? scene.motion : { x: 0, y: 0 }}
        transition={live ? { duration: scene.duration, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
      >
        <ComicHero pose={scene.pose} active={active} still={still} className="h-full w-auto" />
      </motion.div>

      {/* The page is read one panel at a time: the others sit back under a
          paper veil rather than disappearing. */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-white"
        initial={false}
        animate={{ opacity: active || still ? 0 : 0.5 }}
        transition={{ duration: 0.3 }}
      />

      <AnimatePresence>
        {active ? (
          <motion.div
            key="overlay"
            aria-hidden="true"
            className="absolute inset-0"
            initial={still ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.span
              className="rb-burst absolute right-[6%] top-[6%]"
              initial={still ? false : { scale: 0.4, rotate: -20 }}
              animate={{ scale: 1, rotate: 6 }}
              transition={{ type: "spring", stiffness: 420, damping: 16 }}
            >
              <span className="text-base md:text-2xl">{scene.sfx}</span>
            </motion.span>

            <motion.div
              className="rb-bubble rb-bubble-tail-left absolute left-[6%] top-[8%] hidden max-w-[55%] px-5 py-3 md:block"
              initial={still ? false : { y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="rb-display text-[clamp(1.1rem,1.8vw,1.75rem)] !leading-[1.1]">{message.text}</p>
            </motion.div>

            {/* Wrapped: `.rb-caption-box` sets its own display, and that unlayered
                rule would beat a `hidden` utility on the same element. */}
            <div className="absolute bottom-[6%] left-[6%] hidden md:block">
              <p className="rb-caption-box">{message.tag}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

/**
 * @param messages  Optional replacement for the boot copy -- e.g.
 *                  `GRADING_MESSAGES` while a submission is being marked. The
 *                  comic page is unchanged; only the words it tells change.
 */
export function LoadingScreen({ messages = MESSAGES }) {
  const [messageIndex, setMessageIndex] = useState(0)
  const reduced = useReducedMotion()
  // Modulo'd rather than indexed directly: the interval keeps counting against
  // the list that was current when it was scheduled, so a shorter list arriving
  // mid-cycle must not read past its end.
  const list = messages?.length ? messages : MESSAGES
  const current = list[messageIndex % list.length]
  const activePanel = messageIndex % SCENES.length

  useEffect(() => {
    if (reduced) return undefined
    const id = setInterval(() => {
      setMessageIndex((value) => (value + 1) % list.length)
    }, 1900)
    return () => clearInterval(id)
  }, [reduced, list.length])

  return (
    <div className="rebyu-ds rb-light-only flex h-svh w-full flex-col bg-white p-2 sm:p-3">
      {/* The live region is a stable, visually hidden node: the visible bubble
          moves from panel to panel and remounts, which a screen reader would
          not reliably announce. */}
      <p className="sr-only" role="status" aria-live="polite">
        {current.text}
      </p>

      <div className="rb-comic-page grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-2 sm:gap-3 md:grid-cols-12">
        {SCENES.map((scene, index) => (
          <ScenePanel
            key={scene.pose}
            scene={scene}
            index={index}
            active={index === activePanel}
            still={reduced}
            message={current}
          />
        ))}
      </div>

      {/* Below md the panels are too small to letter a sentence into, so the
          narration runs under the page instead. */}
      <div aria-hidden="true" className="mt-3 flex min-h-14 items-center gap-3 md:hidden">
        <span className="rb-caption-box shrink-0">{current.tag}</span>
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            className="font-rb-display text-lg leading-tight text-rb-eel"
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {current.text}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
