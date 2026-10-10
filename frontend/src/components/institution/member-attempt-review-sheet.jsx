import { useQuery } from "@tanstack/react-query"
import { CheckCircle2, Clock, MinusCircleIcon, XCircle } from "@/components/icons"

import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { AuthedImage } from "@/lib/authed-media.jsx"
import { cn } from "@/lib/utils"
import { getMemberAttemptResult } from "@/services/institutionService.js"

function formatDuration(totalSeconds) {
  if (totalSeconds == null) return "—"
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return minutes ? `${minutes}m ${seconds}s` : `${seconds}s`
}

function formatPoints(value) {
  if (value == null) return "—"
  const number = Number(value)
  return Number.isInteger(number) ? String(number) : number.toFixed(1)
}

function answerState(answer) {
  if (answer.pendingManualEvaluation) return "pending"
  if (!answer.learnerAnswer && answer.selectedChoiceId == null && !answer.submittedCode && !answer.diagramSubmitted) {
    return "unanswered"
  }
  if (answer.isCorrect === true) return "correct"
  if (answer.isCorrect === false) return "incorrect"
  return "pending"
}

const STATE = {
  correct: { label: "Correct", icon: CheckCircle2, tone: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  incorrect: { label: "Incorrect", icon: XCircle, tone: "text-rose-700 bg-rose-50 border-rose-200" },
  pending: { label: "Awaiting grading", icon: Clock, tone: "text-amber-700 bg-amber-50 border-amber-200" },
  unanswered: { label: "Not answered", icon: MinusCircleIcon, tone: "text-muted-foreground bg-muted/40 border-border" },
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-semibold text-foreground">{value}</p>
    </div>
  )
}

function AnswerCard({ answer, index }) {
  const state = answerState(answer)
  const { label, icon: Icon, tone } = STATE[state]
  const learnerAnswer = answer.selectedChoiceText ?? answer.learnerAnswer
  return (
    <li className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold text-muted-foreground">
          Question {answer.displayOrder ?? index + 1}
          {answer.difficultyLevel ? ` · ${answer.difficultyLevel.toLowerCase()}` : ""}
        </p>
        <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", tone)}>
          <Icon className="size-3.5" aria-hidden="true" />
          {label}
        </span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{answer.question}</p>
      {answer.questionImageKey ? (
        <AuthedImage imageKey={answer.questionImageKey} alt="" className="mt-3 max-h-56 rounded-md" zoomable />
      ) : null}

      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Student's answer</dt>
          <dd className={cn("mt-0.5 whitespace-pre-wrap", learnerAnswer ? "text-foreground" : "italic text-muted-foreground")}>
            {learnerAnswer || "No answer"}
          </dd>
        </div>
        {answer.submittedCode ? (
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              Submitted code{answer.programmingLanguage ? ` (${answer.programmingLanguage})` : ""}
            </dt>
            <dd>
              <pre className="mt-1 max-h-64 overflow-auto rounded-md bg-muted/50 p-3 text-xs">{answer.submittedCode}</pre>
            </dd>
          </div>
        ) : null}
        {answer.correctChoiceText && state !== "correct" ? (
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Correct answer</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-emerald-800">{answer.correctChoiceText}</dd>
          </div>
        ) : null}
        {answer.explanation ? (
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Explanation</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-muted-foreground">{answer.explanation}</dd>
          </div>
        ) : null}
        {answer.feedback ? (
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Feedback</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-muted-foreground">{answer.feedback}</dd>
          </div>
        ) : null}
      </dl>

      {answer.subQuestionAnswers?.length ? (
        <ul className="mt-3 space-y-2 border-t pt-3">
          {answer.subQuestionAnswers.map((sub) => (
            <li key={sub.subQuestionId} className="text-sm">
              <p className="text-foreground">{sub.questionText}</p>
              <p className="mt-0.5 text-muted-foreground">
                {sub.learnerAnswer || "No answer"} · {formatPoints(sub.earnedPoints)}/{formatPoints(sub.maxPoints)} pts
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-3 text-xs text-muted-foreground">
        {formatPoints(answer.credit != null && answer.points != null ? Number(answer.credit) * Number(answer.points) : null)}
        {" / "}
        {formatPoints(answer.points)} pts
      </p>
    </li>
  )
}

/** A member's attempt, question by question with the correct answers, for the department head. */
export default function MemberAttemptReviewSheet({ departmentId, learnerId, learnerName, attemptId, onOpenChange }) {
  const open = attemptId != null
  const resultQuery = useQuery({
    queryKey: ["member-attempt-result", departmentId, learnerId, attemptId],
    queryFn: () => getMemberAttemptResult(departmentId, learnerId, attemptId),
    enabled: open && departmentId != null && learnerId != null,
    staleTime: 60_000,
  })
  const result = resultQuery.data

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-2xl">
        <SheetHeader className="border-b p-5">
          <SheetTitle>{learnerName ?? "Student"}</SheetTitle>
          <SheetDescription>
            {result
              ? `${result.assessmentTitle} · attempt ${result.attemptNumber ?? "—"}${
                  result.submittedAt ? ` · ${new Date(result.submittedAt).toLocaleString()}` : ""
                }`
              : "Attempt details"}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 p-5">
          {resultQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : resultQuery.isError ? (
            <p className="text-sm text-destructive">This attempt could not be loaded.</p>
          ) : result ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-3xl font-bold text-foreground">
                  {result.percentage != null ? `${Math.round(Number(result.percentage))}%` : "—"}
                </span>
                {result.gradingPending ? (
                  <Badge variant="outline">Grading pending</Badge>
                ) : result.passed ? (
                  <Badge className="bg-emerald-600 text-white">Passed</Badge>
                ) : (
                  <Badge variant="destructive">Not passed</Badge>
                )}
                {result.passingScore != null ? (
                  <span className="text-xs text-muted-foreground">{Number(result.passingScore)}% to pass</span>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="Correct" value={result.correctCount ?? 0} />
                <Stat label="Incorrect" value={result.incorrectCount ?? 0} />
                <Stat label="Unanswered" value={result.unansweredCount ?? 0} />
                <Stat label="Time taken" value={formatDuration(result.durationSeconds)} />
                <Stat label="Points" value={`${formatPoints(result.earnedPoints)} / ${formatPoints(result.totalPoints)}`} />
                {result.pendingCount ? <Stat label="Awaiting grading" value={result.pendingCount} /> : null}
                {result.proficiency?.label ? <Stat label="Proficiency" value={result.proficiency.label} /> : null}
              </div>

              {result.lessonBreakdown?.length ? (
                <section>
                  <h3 className="text-sm font-semibold text-foreground">By lesson</h3>
                  <ul className="mt-2 divide-y rounded-lg border">
                    {result.lessonBreakdown.map((lesson) => (
                      <li key={lesson.lessonId ?? lesson.lessonTitle} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                        <span className="min-w-0 truncate text-foreground">{lesson.lessonTitle ?? "Lesson"}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {lesson.correctCount ?? 0}/{lesson.itemCount ?? 0}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section>
                <h3 className="text-sm font-semibold text-foreground">Answers</h3>
                <ol className="mt-2 space-y-3">
                  {(result.answers ?? []).map((answer, index) => (
                    <AnswerCard key={answer.attemptQuestionId ?? index} answer={answer} index={index} />
                  ))}
                </ol>
              </section>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
