import { useMemo, useState } from "react"
import { Clock } from "@/components/icons"

import { BackButton, TactileButton } from "@/components/rebyu/rebyu-ui.jsx"
import QuestionNavigator from "@/components/assessments/attempt/question-navigator.jsx"

export default function ArenaRun({
  arenaName,
  problems,
  initialIndex = 0,
  clock,
  onExit,
  onFinish,
  renderProblem,
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [answers, setAnswers] = useState({})

  const problem = problems[currentIndex]
  const answer = answers[problem?.attemptQuestionId] ?? null

  function patchAnswer(patch) {
    setAnswers((current) => ({
      ...current,
      [problem.attemptQuestionId]: {
        ...(current[problem.attemptQuestionId] ?? {}),
        ...patch,
      },
    }))
  }

  const navItems = useMemo(
    () =>
      problems.map((item) => {
        const saved = answers[item.attemptQuestionId]
        const answered = Boolean(
          saved?.submittedCode?.trim() || saved?.diagramSubmissionData?.trim(),
        )
        return {
          attemptQuestionId: item.attemptQuestionId,
          points: item.points,
          answered,
          subQuestionCount: item.subQuestions?.length ?? 0,
          subAnsweredCount: Object.keys(saved?.subAnswers ?? {}).length,
        }
      }),
    [problems, answers],
  )

  const navigator = (
    <QuestionNavigator
      items={navItems}
      currentIndex={currentIndex}
      onJump={setCurrentIndex}
      onFinish={onFinish}
    />
  )

  const answeredCount = navItems.filter((item) => item.answered).length

  return (
    <div className="rebyu-ds flex h-dvh flex-col overflow-hidden bg-rb-polar">
      <header className="flex h-20 shrink-0 items-center gap-4 border-b-2 border-rb-swan bg-rb-snow px-5 lg:px-8">
        <BackButton label="Back to problem list" onClick={onExit} />
        <div className="min-w-0">
          <div className="font-rb-display text-xl font-extrabold lowercase text-rb-eel">
            {arenaName}
          </div>
          <div className="text-xs font-semibold text-rb-wolf">
            Problem {currentIndex + 1} of {problems.length} · {answeredCount} attempted
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-rb-pill border-2 border-rb-swan bg-rb-polar px-3 py-1.5 text-sm font-bold tabular-nums text-rb-eel">
            <Clock className="size-4" aria-hidden="true" />
            {clock}
          </span>
          <TactileButton size="sm" variant="ghost" onClick={onFinish}>
            finish run
          </TactileButton>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 lg:p-5">
        <div className="min-h-0 flex-1 overflow-hidden">
          {renderProblem({
            key: problem.attemptQuestionId,
            problem,
            index: currentIndex,
            answer,
            onAnswer: patchAnswer,
            navigator,
          })}
        </div>
      </div>
    </div>
  )
}
