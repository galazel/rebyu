import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { motion, useReducedMotion } from "framer-motion"

import { ArrowLeft, Check, ChevronRight, Clock, Code2, Info, Loader2, Lock, Network, Trophy, Zap } from "@/components/icons"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TactileButton } from "@/components/rebyu/rebyu-ui.jsx"
import { useAuth } from "@/context/auth-context.jsx"
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

/* Plinth sizes (the exported Plinth is shared with other pages). */
const PLINTH_W = 128
const PLINTH_H = 64
const PLINTH_D = 20
const LIFT = 30

export function ArenaLobby({ arenaId, name, blurb }) {
  const tone = TONES[arenaId] ?? TONES.codestrike
  const arenasQuery = useQuery({ queryKey: [CHALLENGE_ARENAS_KEY], queryFn: getChallengeArenas, staleTime: 60_000 })

  const arena = (arenasQuery.data ?? []).find((row) => row.arenaId === arenaId) ?? null
  const configured = Boolean(arena?.configured)
  const settings = arena?.settings ?? {}
  const timePerProblem = Number(settings.timePerProblem) || 10

  // The problem list carries answers, so only admins may read it; learners see
  // placeholder stages and their progress is matched by position.
  const { user } = useAuth()
  const isAdmin = String(user?.role ?? "").toUpperCase() === "ADMIN"
  const problemsQuery = useQuery({
    queryKey: ["arena-problems", arenaId],
    queryFn: () => getArenaProblems(arenaId),
    enabled: configured && isAdmin,
    staleTime: 60_000,
    retry: false,
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
  const completed = {
    ids: new Set((progressQuery.data?.questionIds ?? []).map(Number)),
    indexes: new Set((progressQuery.data?.stageIndexes ?? []).map(Number)),
  }

  const problems = problemsQuery.data ?? []
  const problemCount = arena?.problemCount ?? problems.length
  const pointsPerProblem = Number(settings.pointsPerProblem) || 10
  const stages = problems.length ? problems : Array.from({ length: problemCount }, () => null)
  const totalPoints = stages.reduce((sum, p) => sum + Number(p?.points ?? pointsPerProblem), 0)
  const locked = !configured && arenasQuery.isSuccess
  const [aboutOpen, setAboutOpen] = useState(false)

  return (
    <div className="rebyu-ds relative isolate min-h-dvh overflow-x-hidden bg-rb-polar">
      <PathBackdrop />

      <div className="mx-auto max-w-5xl px-4 pb-16 pt-5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TactileButton asChild variant="ghost" size="sm">
            <Link replace to="/learner/learning">
              <ArrowLeft className="mr-1.5 size-4" aria-hidden="true" />
              back
            </Link>
          </TactileButton>
          <div className="flex items-center gap-2">
            <TactileButton
              variant="ghost"
              size="sm"
              aria-label={`About ${name}`}
              title={`About ${name}`}
              onClick={() => setAboutOpen(true)}
            >
              <Info className="size-4" aria-hidden="true" />
              <span className="ml-1.5 hidden sm:inline">about</span>
            </TactileButton>
          </div>
        </div>

        <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
          <DialogContent className="rebyu-ds max-w-md">
            <DialogHeader>
              <DialogTitle className="font-rb-display text-2xl font-extrabold text-rb-eel">About {name}</DialogTitle>
              <DialogDescription>{blurb}</DialogDescription>
            </DialogHeader>
            <ul className="space-y-2.5 text-sm leading-6 text-rb-eel">
              <li className="flex gap-2.5">
                {arenaId === "blueprint" ? (
                  <Network className="mt-1 size-4 shrink-0 text-rb-wolf" aria-hidden="true" />
                ) : (
                  <Code2 className="mt-1 size-4 shrink-0 text-rb-wolf" aria-hidden="true" />
                )}
                <span>
                  {problemCount || "Several"} stage{problemCount === 1 ? "" : "s"}, one{" "}
                  {arenaId === "blueprint" ? "diagram" : "coding problem"} each. Clear them in order: each stage
                  unlocks the next.
                </span>
              </li>
              <li className="flex gap-2.5">
                <Clock className="mt-1 size-4 shrink-0 text-rb-wolf" aria-hidden="true" />
                <span>{timePerProblem} minutes per stage. When the timer runs out, your answer is handed in as it is.</span>
              </li>
              <li className="flex gap-2.5">
                <Zap className="mt-1 size-4 shrink-0 text-rb-wolf" aria-hidden="true" />
                <span>
                  Each stage is worth its points times your score (80% on a 10-point stage gives 8). Replays only count
                  if you beat your best, so the most you can earn here is {totalPoints} pts.
                </span>
              </li>
              <li className="flex gap-2.5">
                <Trophy className="mt-1 size-4 shrink-0 text-rb-wolf" aria-hidden="true" />
                <span>Rankings add up your best points across every stage. Ties share a place.</span>
              </li>
            </ul>
          </DialogContent>
        </Dialog>

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

function stageStates(stages, completed) {
  // Learners never get the problem list (it is admin-only: it carries answers), so their
  // stages are placeholders and are matched by position; admins match by question id.
  const done = stages.map((p, i) =>
    p != null ? completed.ids.has(Number(p.questionId)) : completed.indexes.has(i)
  )
  const unlocked = stages.map((_, i) => i === 0 || done[i - 1])
  const currentIndex = stages.findIndex((_, i) => unlocked[i] && !done[i])
  return stages.map((_, i) => (done[i] ? "done" : i === currentIndex ? "current" : unlocked[i] ? "open" : "locked"))
}

function stageKind(arenaId, problem) {
  if (arenaId === "blueprint") return "Diagram"
  const language = problem?.question?.programmingQuestionConfig?.language
  return language ? LANGUAGE_LABELS[language.toUpperCase()] ?? language : "Coding"
}

function StageTrail({ stages, completed, tone, arenaId, examId, timePerProblem, pointsPerProblem, totalPoints }) {
  const count = stages.length
  const states = stageStates(stages, completed)
  const doneCount = states.filter((s) => s === "done").length
  const nextIndex = states.indexOf("current")
  const cleared = count > 0 && doneCount === count
  const linkFor = (i) => `/learner/assessments/${examId}?q=${i}&total=${count}&arena=${arenaId}`
  const percent = count ? Math.round((doneCount / count) * 100) : 0

  return (
    <section className="mt-10 space-y-8">
      <div className="rounded-rb-card border-2 border-rb-swan bg-rb-snow p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-rb-wolf">your run</p>
            <p className="mt-0.5 font-rb-display text-2xl font-extrabold text-rb-eel">
              {cleared ? "Every stage cleared" : `${doneCount} of ${count} stages done`}
            </p>
            <div
              className="mt-3 h-3 overflow-hidden rounded-full bg-rb-swan"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              aria-label="Stages done"
            >
              <div className={cn("h-full rounded-full transition-[width] duration-500", tone.face)} style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-2 text-xs font-bold text-rb-wolf">
              Each stage unlocks the next · {timePerProblem} min per stage · up to {totalPoints} pts
            </p>
          </div>
          {nextIndex >= 0 ? (
            <TactileButton asChild size="lg" className="shrink-0">
              <Link to={linkFor(nextIndex)}>
                {doneCount === 0 ? "Start stage 1" : `Continue: stage ${nextIndex + 1}`}
                <ChevronRight className="ml-1.5 size-4" aria-hidden="true" />
              </Link>
            </TactileButton>
          ) : cleared ? (
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-rb-fox-wash px-4 py-2 font-rb-display text-sm font-extrabold text-rb-fox-lip">
              <Trophy className="size-4" aria-hidden="true" />
              Replay any stage to beat your best
            </span>
          ) : null}
        </div>
      </div>

      <div>
        <div className="border-b-2 border-rb-swan pb-2">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-rb-wolf">stages</p>
          <h2 className="font-rb-display text-2xl font-extrabold text-rb-eel">Clear them in order</h2>
        </div>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stages.map((problem, i) => (
            <StageCard
              key={problem?.questionId ?? i}
              index={i}
              state={states[i]}
              tone={tone}
              kind={stageKind(arenaId, problem)}
              difficulty={DIFFICULTY[problem?.question?.difficultyLevel] ?? null}
              Icon={arenaId === "blueprint" ? Network : Code2}
              to={linkFor(i)}
              timePerProblem={timePerProblem}
              points={Number(problem?.points ?? pointsPerProblem)}
            />
          ))}
        </ol>
      </div>
    </section>
  )
}

function StageCard({ index, state, tone, kind, difficulty, Icon, to, timePerProblem, points }) {
  const locked = state === "locked"
  const done = state === "done"
  const current = state === "current"
  const Tag = locked ? "div" : Link
  return (
    <li>
      <Tag
        {...(locked ? { "aria-disabled": true, title: `Finish stage ${index} to unlock this one` } : { to })}
        aria-label={`Stage ${index + 1}, ${kind}, ${timePerProblem} minutes, ${points} points${
          locked ? " (locked)" : done ? " (done)" : current ? " (next up)" : ""
        }`}
        className={cn(
          "group flex h-full items-center gap-3 rounded-rb-card border-2 bg-rb-snow p-3 transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rb-macaw",
          locked
            ? "cursor-not-allowed border-rb-swan opacity-60"
            : current
              ? "border-rb-hare shadow-[0_4px_0_var(--color-rb-swan)] hover:-translate-y-0.5"
              : "border-rb-swan hover:-translate-y-0.5 hover:border-rb-hare"
        )}
      >
        <span
          className={cn(
            "relative grid size-12 shrink-0 place-items-center rounded-rb-control",
            locked ? "bg-rb-swan text-rb-hare" : done || current ? cn(tone.face, "text-white") : "bg-rb-polar text-rb-wolf"
          )}
        >
          {locked ? <Lock className="size-5" aria-hidden="true" /> : <Icon className="size-5" aria-hidden="true" />}
          {done ? (
            <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-rb-snow text-rb-leaf shadow">
              <Check className="size-3" aria-hidden="true" />
            </span>
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="font-rb-display text-base font-extrabold text-rb-eel">Stage {index + 1}</span>
            {current ? (
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase text-white", tone.face)}>next</span>
            ) : null}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold text-rb-wolf">
            <span>{kind}</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" aria-hidden="true" />
              {timePerProblem} min
            </span>
            {difficulty ? (
              <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-extrabold uppercase", difficulty.chip)}>
                {difficulty.label}
              </span>
            ) : null}
          </span>
          <span className="mt-1 block text-[11px] font-bold">
            {locked ? (
              <span className="text-rb-wolf">Finish stage {index} to unlock</span>
            ) : done ? (
              <span className="text-rb-leaf">Done · replay to beat your best</span>
            ) : (
              <span className="text-rb-wolf">Ready to play</span>
            )}
          </span>
        </span>
        <PointsPill amount={points} />
      </Tag>
    </li>
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
