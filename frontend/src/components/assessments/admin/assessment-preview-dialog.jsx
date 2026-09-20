import { useMemo } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { getAssessmentTypeLabel } from "@/services/assessmentService.js"

export default function AssessmentPreviewDialog({
                                                  open,
                                                  onOpenChange,
                                                  exam,
                                                  examTypeByIdText,
                                                  examQuestions,
                                                  questionById,
                                                }) {
  const orderedQuestions = useMemo(() => {
    if (!exam) return []

    return [...examQuestions]
        .filter((examQuestion) => examQuestion.examId === exam.examId)
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
        .map((examQuestion) => {
          const question = questionById.get(examQuestion.questionId)

          if (!question) return null

          return { examQuestion, question }
        })
        .filter(Boolean)
  }, [exam, examQuestions, questionById])

  if (!exam) return null

  const typeText = examTypeByIdText.get(exam.examTypeId)

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-none overflow-hidden rounded-2xl p-0 sm:h-[calc(100dvh-4rem)] sm:w-[70vw] sm:max-w-[70vw] lg:h-[min(640px,calc(100dvh-4rem))] lg:w-[50vw] lg:max-w-[50vw]">
          <div className="flex h-full min-h-0 flex-col">
            <DialogHeader className="border-b px-6 py-5">
              <DialogTitle className="text-xl font-semibold">
                {exam.title}
              </DialogTitle>

              <DialogDescription className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">
                  {getAssessmentTypeLabel(typeText)}
                </Badge>

                <span>{orderedQuestions.length} question(s)</span>

                {exam.durationMinutes ? (
                    <span>· {exam.durationMinutes} min</span>
                ) : null}

                {exam.passingScore != null ? (
                    <span>· Passing {Number(exam.passingScore).toFixed(0)}%</span>
                ) : null}
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {orderedQuestions.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    This assessment has no questions yet.
                  </p>
              ) : (
                  <ol className="space-y-3">
                    {orderedQuestions.map(({ question }, index) => (
                        <li
                            key={question.questionId}
                            className="rounded-xl border p-4"
                        >
                          <div className="flex items-start gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                        {index + 1}
                      </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <p className="min-w-0 text-sm font-medium">
                                  {question.questionText}
                                </p>
                              </div>

                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <Badge variant="secondary" className="text-[10px]">
                                  {question.questionType}
                                </Badge>

                                <Badge variant="outline" className="text-[10px]">
                                  {question.difficultyLevel}
                                </Badge>
                              </div>

                              {(question.questionType === "MULTIPLE_CHOICE" ||
                                  question.questionType === "MCQ") &&
                              Array.isArray(question.choices) &&
                              question.choices.length > 0 ? (
                                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                                    {question.choices.map((choice, choiceIndex) => {
                                      const correct = Boolean(
                                          choice.correct ?? choice.isCorrect
                                      )

                                      return (
                                          <li
                                              key={choice.choiceId ?? choiceIndex}
                                              className={
                                                correct
                                                    ? "font-medium text-foreground"
                                                    : undefined
                                              }
                                          >
                                            {String.fromCharCode(65 + choiceIndex)}.{" "}
                                            {choice.choiceText}
                                            {correct ? " ✓" : ""}
                                          </li>
                                      )
                                    })}
                                  </ul>
                              ) : null}
                            </div>
                          </div>
                        </li>
                    ))}
                  </ol>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
  )
}