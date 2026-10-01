import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"

import {
  ChevronRight,
  Clock,
  Code2,
  Loader2,
  Lock,
  Network,
  Star,
  Trophy,
  Zap,
} from "@/components/icons"
import { TactileButton } from "@/components/rebyu/rebyu-ui.jsx"
import {
  CHALLENGE_ARENAS_KEY,
  getChallengeArenas,
  getArenaProblems,
} from "@/services/challengeService.js"

const DIFFICULTY_COLORS = {
  EASY: "bg-emerald-500",
  AVERAGE: "bg-amber-500",
  HARD: "bg-red-500",
}

const DIFFICULTY_BG = {
  EASY: "bg-emerald-50 text-emerald-700 border-emerald-200",
  AVERAGE: "bg-amber-50 text-amber-700 border-amber-200",
  HARD: "bg-red-50 text-red-700 border-red-200",
}

const LANGUAGE_LABELS = {
  PYTHON: "Python",
  JAVA: "Java",
  "C++": "C++",
  C: "C",
  JAVASCRIPT: "JavaScript",
  "C#": "C#",
}

export function ArenaLobby({ arenaId, name, blurb, icon: Icon = Trophy, tone }) {
  const arenasQuery = useQuery({
    queryKey: [CHALLENGE_ARENAS_KEY],
    queryFn: getChallengeArenas,
    staleTime: 60_000,
  })

  const arena = (arenasQuery.data ?? []).find((row) => row.arenaId === arenaId) ?? null
  const configured = Boolean(arena?.configured)
  const settings = arena?.settings ?? {}
  const timePerProblem = settings.timePerProblem
    ?? (settings.timeLimit > 0 && arena?.problemCount > 0
      ? Math.round(settings.timeLimit / arena.problemCount)
      : 10)

  const problemsQuery = useQuery({
    queryKey: ["arena-problems", arenaId],
    queryFn: () => getArenaProblems(arenaId),
    enabled: configured,
    staleTime: 60_000,
  })

  const problems = problemsQuery.data ?? []
  const problemCount = arena?.problemCount ?? problems.length
  const pointsPerProblem = Number(settings.pointsPerProblem) || 10

  return (
    <div className="rebyu-ds min-h-dvh bg-rb-polar">
      {/* Hero header */}
      <div className="relative overflow-hidden border-b border-rb-swan bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 lg:px-8">
          <div className="flex items-center gap-4">
            <span
              className={`grid size-14 place-items-center rounded-2xl shadow-sm ${
                tone?.face ?? "bg-rb-macaw"
              }`}
            >
              <Icon className="size-7 text-white" aria-hidden="true" />
            </span>
            <div>
              <h1 className="font-rb-display text-2xl font-extrabold lowercase text-rb-eel">
                {name.toLowerCase()}
              </h1>
              <p className="mt-0.5 max-w-lg text-sm text-rb-wolf">{blurb}</p>
            </div>
          </div>
          <TactileButton asChild variant="ghost" size="sm">
            <Link to="/learner/challenges">back to arenas</Link>
          </TactileButton>
        </div>
        {/* Summary pills */}
        {configured && (
          <div className="mx-auto flex max-w-5xl gap-2 px-5 pb-5 lg:px-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rb-polar px-3 py-1.5 text-xs font-bold text-rb-eel">
              <Zap className="size-3.5" aria-hidden="true" />
              {problemCount} problems
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rb-polar px-3 py-1.5 text-xs font-bold text-rb-eel">
              <Clock className="size-3.5" aria-hidden="true" />
              {timePerProblem} min each
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rb-polar px-3 py-1.5 text-xs font-bold text-rb-eel">
              <Star className="size-3.5" aria-hidden="true" />
              {problemCount * pointsPerProblem} pts total
            </span>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
        {arenasQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm font-semibold text-rb-wolf">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Loading arena...
          </div>
        ) : !configured ? (
          <div className="mx-auto max-w-md py-16 text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-rb-swan">
              <Lock className="size-8 text-rb-wolf" aria-hidden="true" />
            </span>
            <h2 className="mt-5 font-rb-display text-2xl font-extrabold text-rb-eel">
              not open yet
            </h2>
            <p className="mt-2 text-sm text-rb-wolf">
              This arena has no problems set up yet. It opens as soon as an admin adds them.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-xs font-extrabold uppercase tracking-[0.14em] text-rb-wolf">
              Choose a problem
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {problems.length > 0
                ? problems.map((problem, i) => (
                    <ProblemCard
                      key={problem.questionId}
                      index={i}
                      arenaId={arenaId}
                      examId={arena.examId}
                      timePerProblem={timePerProblem}
                      pointsPerProblem={pointsPerProblem}
                      problem={problem}
                      totalProblems={problems.length}
                    />
                  ))
                : Array.from({ length: problemCount }, (_, i) => (
                    <ProblemCard
                      key={i}
                      index={i}
                      arenaId={arenaId}
                      examId={arena.examId}
                      timePerProblem={timePerProblem}
                      pointsPerProblem={pointsPerProblem}
                      totalProblems={problemCount}
                    />
                  ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ProblemCard({ index, arenaId, examId, timePerProblem, pointsPerProblem, problem, totalProblems }) {
  const q = problem?.question
  const difficulty = q?.difficultyLevel ?? "AVERAGE"
  const points = problem?.points ?? pointsPerProblem
  const language = q?.programmingQuestionConfig?.language
  const typeLabel = arenaId === "codestrike" ? "Coding" : arenaId === "blueprint" ? "Diagram" : "Quiz"
  const mm = String(timePerProblem).padStart(2, "0")

  return (
    <Link
      to={`/learner/assessments/${examId}?q=${index}&total=${totalProblems}&arena=${arenaId}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border-2 border-rb-swan bg-white transition hover:border-rb-feather/50 hover:shadow-md"
    >
      {/* Difficulty indicator bar */}
      <div className={`h-1 w-full ${DIFFICULTY_COLORS[difficulty] ?? DIFFICULTY_COLORS.AVERAGE}`} />

      <div className="flex flex-1 flex-col p-4">
        {/* Top row: number + difficulty badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-rb-polar font-rb-display text-base font-extrabold text-rb-wolf">
              {index + 1}
            </span>
            <span className="font-rb-display text-sm font-extrabold text-rb-eel">
              Problem {index + 1}
            </span>
          </div>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
              DIFFICULTY_BG[difficulty] ?? DIFFICULTY_BG.AVERAGE
            }`}
          >
            {difficulty.toLowerCase()}
          </span>
        </div>

        {/* Stats row */}
        <div className="mt-3 flex items-center gap-3 text-[11px] font-semibold text-rb-wolf">
          <span className="inline-flex items-center gap-1">
            {arenaId === "codestrike" ? (
              <Code2 className="size-3" aria-hidden="true" />
            ) : (
              <Network className="size-3" aria-hidden="true" />
            )}
            {typeLabel}
          </span>
          {language ? (
            <span className="inline-flex items-center gap-1">
              <Code2 className="size-3" aria-hidden="true" />
              {LANGUAGE_LABELS[language.toUpperCase()] ?? language}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Star className="size-3" aria-hidden="true" />
            {Number(points)} pts
          </span>
        </div>

        {/* Timer */}
        <div className="mt-3 flex items-center justify-between rounded-xl bg-rb-polar px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rb-wolf">
            <Clock className="size-3.5" aria-hidden="true" />
            Time limit
          </div>
          <span className="font-rb-display text-lg font-extrabold tabular-nums text-rb-eel">
            {mm}:00
          </span>
        </div>

        {/* CTA hint */}
        <div className="mt-3 flex items-center justify-center gap-1 text-[11px] font-bold text-rb-wolf opacity-0 transition group-hover:opacity-100">
          Start solving
          <ChevronRight className="size-3" aria-hidden="true" />
        </div>
      </div>
    </Link>
  )
}

export default ArenaLobby
