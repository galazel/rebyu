import { useMemo, useState } from "react"
import { ClipboardCheck, EyeIcon, PencilIcon, Plus } from "@/components/icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import AssessmentDialog from "./assessment-dialog.jsx"
import AssessmentPreviewDialog from "./assessment-preview-dialog.jsx"
import ExamFormatPanel from "./exam-format-panel.jsx"
import { useAssessmentData } from "./assessments-tab.jsx"

const EXAMS = [
  {
    type: "DIAGNOSTIC",
    title: "Diagnostic exam",
    blurb:
      "One question from every lesson, sat before studying. It gives every lesson its first mastery tag.",
  },
  {
    type: "MOCK_EXAM",
    title: "Mock exam",
    blurb:
      "A full paper in the real exam's shape — the same number of questions, time and pass mark.",
  },
]

function lessonIdsOf(certification) {
  const ids = []
  ;(certification?.majorCategory ?? []).forEach((major) =>
    (major.middleCategory ?? []).forEach((middle) =>
      (middle.lessons ?? []).forEach((lesson) => {
        const id = lesson.lessonId ?? lesson.id
        if (id != null) ids.push(String(id))
      }),
    ),
  )
  return ids
}

/**
 * The certification's two fixed papers, on the certification page itself.
 * Lesson quizzes and unit/major exams are adaptive -- they draw from the bank as
 * the learner answers and have no question list to manage -- so they are not here.
 */
export default function CertificationExamsSection({ certification }) {
  const certificationId = certification?.certificationId ?? null
  const data = useAssessmentData(certificationId)
  const [createType, setCreateType] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [previewTarget, setPreviewTarget] = useState(null)

  const lessonIds = useMemo(() => lessonIdsOf(certification), [certification])

  const cards = useMemo(
    () =>
      EXAMS.map((config) => {
        const exam =
          data.exams.find(
            (candidate) =>
              data.examTypeByIdText.get(candidate.examTypeId) === config.type &&
              candidate.ownerDepartmentId == null,
          ) ?? null
        const rows = exam
          ? data.examQuestions.filter((row) => row.examId === exam.examId)
          : []
        const covered = new Set(
          rows
            .map((row) => data.questionById.get(row.questionId)?.lessonId)
            .filter((id) => id != null)
            .map(String),
        )
        return {
          ...config,
          exam,
          count: exam?.questionIds?.length ?? rows.length,
          rows,
          lessonsCovered: lessonIds.filter((id) => covered.has(id)).length,
        }
      }),
    [data, lessonIds],
  )

  if (!certificationId) return null

  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-heading text-lg font-bold text-foreground">Certification exams</h3>
        <p className="text-sm text-muted-foreground">
          Fixed papers: every learner sits exactly these questions, and a retake shuffles
          them and their choices. Lesson quizzes and unit exams are adaptive, so they have
          no list to manage.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {cards.map((card) => (
          <article key={card.type} className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                  <h4 className="font-heading text-base font-bold">{card.title}</h4>
                  {card.exam ? (
                    <Badge variant="secondary" className="capitalize">
                      {(card.exam.status ?? "DRAFT").toLowerCase()}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Not created</Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{card.blurb}</p>
              </div>
            </div>

            {data.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : card.exam ? (
              <dl className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Questions</dt>
                  <dd className="font-semibold tabular-nums">{card.count}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Time</dt>
                  <dd className="font-semibold tabular-nums">
                    {card.exam.durationMinutes ? `${card.exam.durationMinutes} min` : "No limit"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Pass mark</dt>
                  <dd className="font-semibold tabular-nums">
                    {card.exam.passingScore != null
                      ? `${Number(card.exam.passingScore).toFixed(0)}%`
                      : "Not set"}
                  </dd>
                </div>
              </dl>
            ) : null}

            {card.type === "DIAGNOSTIC" && card.exam && !data.isDetailLoading ? (
              <p
                className={
                  card.lessonsCovered < lessonIds.length
                    ? "text-xs font-medium text-amber-700 dark:text-amber-300"
                    : "text-xs font-medium text-emerald-700 dark:text-emerald-300"
                }
              >
                {card.lessonsCovered} of {lessonIds.length} lessons covered
                {card.lessonsCovered < lessonIds.length
                  ? " — edit it to add a question for each missing lesson."
                  : "."}
              </p>
            ) : null}

            {card.type === "MOCK_EXAM" ? (
              <ExamFormatPanel
                certificationId={certificationId}
                editable
                selectedCount={card.exam ? card.count : null}
              />
            ) : null}

            <div className="mt-auto flex flex-wrap justify-end gap-2 pt-1">
              {card.exam ? (
                <>
                  <Button type="button" variant="outline" size="sm" onClick={() => setPreviewTarget(card.exam)}>
                    <EyeIcon aria-hidden="true" /> Preview
                  </Button>
                  <Button type="button" size="sm" onClick={() => setEditTarget(card.exam)}>
                    <PencilIcon aria-hidden="true" /> Edit questions
                  </Button>
                </>
              ) : (
                <Button type="button" size="sm" onClick={() => setCreateType(card.type)}>
                  <Plus aria-hidden="true" /> Create {card.title.toLowerCase()}
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>

      <AssessmentDialog
        open={createType != null}
        onOpenChange={(open) => !open && setCreateType(null)}
        mode="create"
        certification={certification}
        initialType={createType ?? "MOCK_EXAM"}
        lockPreset
        questionById={data.questionById}
      />

      <AssessmentDialog
        open={editTarget != null}
        onOpenChange={(open) => !open && setEditTarget(null)}
        mode="edit"
        certification={certification}
        exam={editTarget}
        examTypeByIdText={data.examTypeByIdText}
        existingExamQuestions={
          editTarget ? data.examQuestions.filter((row) => row.examId === editTarget.examId) : []
        }
        questionById={data.questionById}
      />

      <AssessmentPreviewDialog
        open={previewTarget != null}
        onOpenChange={(open) => !open && setPreviewTarget(null)}
        exam={previewTarget}
        examTypeByIdText={data.examTypeByIdText}
        examQuestions={data.examQuestions}
        questionById={data.questionById}
        isLoading={data.isDetailLoading}
      />
    </section>
  )
}
