import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ClipboardCheckIcon, Plus, Trash2 } from "@/components/icons"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  InstitutionEmptyState,
  InstitutionLoadingSkeleton,
  InstitutionStatusBadge,
} from "@/components/institution/institution-ui.jsx"
import {
  archiveExam,
  deleteExam,
  getExamQuestions,
  getExamTypes,
  getExams,
  publishExam,
} from "@/services/assessmentService.js"
import { getQuestions } from "@/services/questionService.js"
import { InstitutionQuestionBankPanel } from "@/pages/institution/certifications/institution-question-bank-page.jsx"
import AssessmentPreviewDialog from "@/components/assessments/admin/assessment-preview-dialog.jsx"
import { cn } from "@/lib/utils"

function asArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.content)) return value.content
  if (Array.isArray(value?.data)) return value.data
  return []
}

function backendMessage(error, fallback) {
  return error?.response?.data?.message ?? fallback
}

/**
 * The department's certifications and which one is selected (?certificationId=), so
 * the assessments and question bank tabs remember it and agree with each other.
 */
function useSelectedCertification(department) {
  const [searchParams, setSearchParams] = useSearchParams()
  const certifications = asArray(department?.certifications).filter(
    (cert) => String(cert?.status ?? "active").toLowerCase() === "active"
  )
  const requested = Number(searchParams.get("certificationId"))
  const selected = certifications.find((cert) => cert.certificationId === requested) ?? certifications[0] ?? null
  const select = (certificationId) =>
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      params.set("certificationId", String(certificationId))
      return params
    })
  return { certifications, selected, select }
}

function CertificationPicker({ certifications, selected, onSelect }) {
  if (certifications.length <= 1) return null
  return (
    <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Certification">
      <span className="text-xs font-medium text-muted-foreground">Certification</span>
      {certifications.map((cert) => {
        const active = cert.certificationId === selected?.certificationId
        return (
          <button
            key={cert.certificationId}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(cert.certificationId)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-muted"
            )}
          >
            {cert.title}
          </button>
        )
      })}
    </div>
  )
}

/** Every assessment the department made, one certification at a time. */
export function DepartmentAssessmentsPanel({ department }) {
  const id = department?.departmentId
  const queryClient = useQueryClient()
  const { certifications, selected, select } = useSelectedCertification(department)
  const certificationId = selected?.certificationId ?? null
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [previewExam, setPreviewExam] = useState(null)

  const examsQuery = useQuery({
    queryKey: ["exams", "group", id, certificationId],
    queryFn: () => getExams(id, certificationId ?? undefined),
    enabled: id != null && certificationId != null,
    placeholderData: (previous) => previous,
    staleTime: 60_000,
  })
  const examTypesQuery = useQuery({ queryKey: ["exam-types"], queryFn: getExamTypes, staleTime: 5 * 60_000 })
  // Both feed only the preview, so they load when one is opened.
  const examQuestionsQuery = useQuery({
    queryKey: ["exam-questions"],
    queryFn: getExamQuestions,
    enabled: previewExam != null,
    staleTime: 60_000,
  })
  const questionsQuery = useQuery({
    queryKey: ["questions", "group", id, certificationId],
    queryFn: () => getQuestions(id, certificationId ?? undefined),
    enabled: id != null && previewExam != null,
    staleTime: 60_000,
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["exams"] })
  const remove = useMutation({
    mutationFn: (examId) => deleteExam(examId),
    onSuccess: () => {
      refresh()
      toast.success("Assessment deleted.")
      setDeleteTarget(null)
    },
    onError: (err) => toast.error(backendMessage(err, "Unable to delete this assessment.")),
  })
  const publish = useMutation({
    mutationFn: (examId) => publishExam(examId),
    onSuccess: () => {
      refresh()
      toast.success("Assessment published. Learners can now access it.")
    },
    onError: (err) => toast.error(backendMessage(err, "Unable to publish this assessment.")),
  })
  const unpublish = useMutation({
    mutationFn: (examId) => archiveExam(examId),
    onSuccess: () => {
      refresh()
      toast.success("Assessment unpublished. Learners can no longer open it.")
    },
    onError: (err) => toast.error(backendMessage(err, "Unable to unpublish this assessment.")),
  })

  if (certifications.length === 0) {
    return (
      <InstitutionEmptyState
        icon={ClipboardCheckIcon}
        title="No certification yet"
        description="Assessments appear here once your institution gives this department a certification."
      />
    )
  }

  const examTypeById = new Map(asArray(examTypesQuery.data).map((type) => [type?.examTypeId, type?.examTypeText]))
  const questionById = new Map(asArray(questionsQuery.data).map((question) => [question?.questionId, question]))
  const exams = asArray(examsQuery.data).filter(
    (exam) => exam && exam.ownerDepartmentId === id && exam.certificationId === certificationId
  )
  const published = exams.filter((exam) => exam.status === "PUBLISHED").length
  const certQuery = `certificationId=${certificationId ?? ""}`

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <CertificationPicker certifications={certifications} selected={selected} onSelect={select} />
          <p className="text-xs text-muted-foreground">
            <strong className="tabular-nums text-foreground">{exams.length}</strong> assessment{exams.length === 1 ? "" : "s"} ·{" "}
            <strong className="tabular-nums text-foreground">{published}</strong> published
          </p>
        </div>
        <Button asChild size="sm" className="h-9 gap-1 text-xs">
          <Link to={`/institution/departments/${id}/assessments/new?${certQuery}`}>
            <Plus className="size-3.5" aria-hidden="true" />
            Create assessment
          </Link>
        </Button>
      </div>

      {examsQuery.isLoading ? (
        <InstitutionLoadingSkeleton rows={3} />
      ) : exams.length ? (
        <ul className="divide-y rounded-xl border bg-card">
          {exams.map((exam) => (
            <li key={exam.examId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <button type="button" onClick={() => setPreviewExam(exam)} className="min-w-0 flex-1 text-left">
                <p className="break-words text-sm font-semibold text-foreground hover:underline sm:text-base">{exam.title}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[10px]">
                    {examTypeById.get(exam.examTypeId) ?? "Assessment"}
                  </Badge>
                  <InstitutionStatusBadge status={exam.status} />
                  <span>
                    {exam.totalQuestions ?? 0} question{(exam.totalQuestions ?? 0) === 1 ? "" : "s"}
                    {exam.durationMinutes ? ` · ${exam.durationMinutes} min` : ""}
                    {exam.passingScore != null ? ` · ${exam.passingScore}% to pass` : ""}
                  </span>
                </p>
              </button>
              <div className="flex flex-wrap items-center gap-2">
                {exam.status === "PUBLISHED" ? (
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => unpublish.mutate(exam.examId)} disabled={unpublish.isPending}>
                    Unpublish
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => publish.mutate(exam.examId)} disabled={publish.isPending}>
                    {exam.status === "ARCHIVED" ? "Republish" : "Publish"}
                  </Button>
                )}
                <Button asChild variant="outline" size="sm" className="text-xs">
                  <Link to={`/institution/departments/${id}/assessments/${exam.examId}/results?${certQuery}`}>Results</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="text-xs">
                  <Link to={`/institution/departments/${id}/assessments/${exam.examId}/edit?${certQuery}`}>Edit</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${exam.title}`}
                  onClick={() => setDeleteTarget(exam)}
                  className="size-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <ClipboardCheckIcon className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-foreground">No {selected?.title} assessments yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create one to see it listed here.</p>
        </div>
      )}

      <AlertDialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this assessment?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.title}&quot; will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => remove.mutate(deleteTarget.examId)} disabled={remove.isPending}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AssessmentPreviewDialog
        open={previewExam != null}
        onOpenChange={(open) => !open && setPreviewExam(null)}
        exam={previewExam}
        examTypeByIdText={examTypeById}
        examQuestions={asArray(examQuestionsQuery.data)}
        questionById={questionById}
        isLoading={examQuestionsQuery.isLoading || questionsQuery.isLoading}
      />
    </section>
  )
}

/** The department's own questions plus the official ones, one certification at a time. */
export function DepartmentQuestionBankPanel({ department }) {
  const { certifications, selected, select } = useSelectedCertification(department)
  if (!selected) {
    return (
      <InstitutionEmptyState
        title="No certification yet"
        description="The question bank appears here once your institution gives this department a certification."
      />
    )
  }
  return (
    <section className="space-y-4">
      <CertificationPicker certifications={certifications} selected={selected} onSelect={select} />
      <InstitutionQuestionBankPanel
        key={selected.certificationId}
        certificationId={String(selected.certificationId)}
        departmentId={department.departmentId}
      />
    </section>
  )
}
