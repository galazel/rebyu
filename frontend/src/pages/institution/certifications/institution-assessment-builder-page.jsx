import { useMemo, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertCircle, LibraryBig, ListChecks, Loader2, Trash2 } from "@/components/icons"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  InstitutionErrorState,
  InstitutionLoadingSkeleton,
} from "@/components/institution/institution-ui.jsx"
import {
  QUESTION_TYPES,
  QuestionTypeButton,
  cloneQuestionData,
  createLocalId,
  saveAuthoredQuestion,
  validateQuestionData,
} from "@/components/questions/question-editors.jsx"
import ExamFormatPanel from "@/components/assessments/admin/exam-format-panel.jsx"
import AssessmentQuestionPickerDialog from "@/components/assessments/admin/assessment-question-picker-dialog.jsx"
import { getCertificationSummary } from "@/services/certificationService.js"
import { getDepartmentById } from "@/services/institutionService.js"
import {
  getQuestions,
  saveChoices,
  saveDiagramQuestion,
  saveProgrammingQuestion,
  saveQuestion,
  saveTextQuestion,
} from "@/services/questionService.js"
import {
  createExam,
  ensureExamType,
  getExamById,
  getExamQuestions,
  getExamTypes,
  updateExam,
} from "@/services/assessmentService.js"
import { reconstructQuestionData } from "@/components/questions/reconstruct-question.js"

function SectionLabel({ children, className = "" }) {
  return (
    <p className={"text-xs font-semibold uppercase tracking-wide text-muted-foreground " + className}>
      {children}
    </p>
  )
}

function BankQuestionCard({ questionNumber, question, headerExtra, onRemove }) {
  const data = question.data ?? {}
  const typeLabel = QUESTION_TYPES.find((t) => t.id === question.typeId)?.title ?? question.typeId
  return (
    <article className="rounded-xl border border-border bg-background p-4 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Question {questionNumber}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{typeLabel}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            <LibraryBig className="size-3" aria-hidden="true" />
            From question bank
          </span>
        </div>
        <div className="flex items-center gap-2">
          {headerExtra}
          <Button variant="ghost" size="icon-sm" aria-label={`Remove question ${questionNumber}`} onClick={onRemove}>
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </header>
      <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{data.question}</p>
      {Array.isArray(data.choices) && data.choices.length ? (
        <ul className="mt-2 space-y-1">
          {data.choices.map((choice, index) => (
            <li
              key={index}
              className={
                "rounded-md border px-3 py-1.5 text-sm " +
                (choice.isCorrect
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-border text-muted-foreground")
              }
            >
              {choice.isCorrect ? "✓ " : ""}
              {choice.choiceText}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 text-xs text-muted-foreground">
        To change this question, edit it in the Question Bank tab.
      </p>
    </article>
  )
}

const firstQuestionType =
  QUESTION_TYPES.find((type) => type.id === "MULTIPLE_CHOICE") ?? QUESTION_TYPES[0]

const QUESTION_API = { saveQuestion, saveChoices, saveTextQuestion, saveProgrammingQuestion, saveDiagramQuestion }

/** The builder's names for exam types the database stores under another name. */
const STORED_EXAM_TYPE = { QUIZ: "LESSON_QUIZ" }
const BUILDER_EXAM_TYPE = { LESSON_QUIZ: "QUIZ", MIDDLE_EXAM: "MODULE_EXAM" }
/**
 * Questions pick their own lessons, so the assessment's target follows them: one shared
 * lesson (or module, for a module exam) narrows it; a mix of lessons covers the certification.
 * The backend only checks question lessons against the exam when the exam has a lesson.
 */
function deriveTarget(examTypeText, questions, lessonIndex) {
  const chains = questions.map((question) => lessonIndex.get(String(question.lessonId)))
  const shared = (pick) => {
    const values = new Set(chains.map((chain) => (chain ? pick(chain) : null)))
    const [only] = values
    return values.size === 1 && only != null ? Number(only) : null
  }
  const none = { targetScope: "CERTIFICATION", lessonId: null, middleCategoryId: null, majorCategoryId: null }
  if (examTypeText === "MOCK_EXAM") return none
  if (examTypeText === "MODULE_EXAM") {
    const middleCategoryId = shared((chain) => chain.middleId)
    return middleCategoryId != null ? { ...none, targetScope: "MIDDLE_CATEGORY", middleCategoryId } : none
  }
  const lessonId = shared((chain) => chain.lesson.lessonId)
  return lessonId != null ? { ...none, targetScope: "LESSON", lessonId } : none
}

/** One dropdown of every lesson, grouped "Category › Module". */
function LessonPicker({ id, value, onChange, groups, invalid, disabled, label }) {
  return (
    <Select value={value ?? ""} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        id={id}
        aria-label={label}
        aria-invalid={invalid || undefined}
        className={cn(
          "h-10 w-full min-w-0 rounded-lg border-border/80 bg-background px-3 text-sm shadow-xs hover:border-primary/40 focus-visible:border-primary sm:max-w-xl",
          invalid && "border-destructive"
        )}
      >
        <SelectValue placeholder="Choose the lesson this question belongs to" />
      </SelectTrigger>
      <SelectContent
        position="popper"
        align="start"
        className="w-[min(34rem,calc(100vw-2rem))] max-h-[min(26rem,var(--radix-select-content-available-height))] overflow-hidden rounded-xl border border-border/80 bg-popover p-1.5 shadow-xl"
      >
        {groups.map((group) => (
          <SelectGroup key={group.key} className="mb-1 last:mb-0">
            <SelectLabel className="sticky top-0 z-10 rounded-md bg-popover/95 px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
              {group.label}
            </SelectLabel>
            {group.lessons.map((lesson) => (
              <SelectItem
                key={lesson.lessonId}
                value={String(lesson.lessonId)}
                className="min-h-9 rounded-lg px-2.5 py-1.5 text-sm font-medium text-foreground focus:bg-primary/10 focus:text-primary data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary"
              >
                {lesson.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}

function backendMessage(error, fallback) {
  return error?.response?.data?.message ?? fallback
}

function isValidPoints(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0
}

function buildCurriculumTree(certification, departmentId) {
  const own = []
  const official = []
  for (const major of certification?.majorCategory ?? []) {
    const bucket = major.ownerDepartmentId === departmentId ? own : official
    bucket.push({
      majorCategoryId: major.majorCategoryId,
      title: major.title,
      middleCategories: (major.middleCategory ?? []).map((middle) => ({
        middleCategoryId: middle.middleCategoryId,
        title: middle.title,
        lessons: (middle.lessons ?? []).map((lesson) => ({
          lessonId: lesson.lessonId,
          name: lesson.name ?? lesson.title ?? "Untitled lesson",
        })),
      })),
    })
  }
  return { own, official }
}

export default function InstitutionAssessmentBuilderPage() {
  const { departmentId, examId } = useParams()
  const id = Number(departmentId)
  const editingExamId = examId ? Number(examId) : null
  const isEdit = Number.isFinite(editingExamId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const [title, setTitle] = useState("")
  // No exam-type picker: department assessments are lesson quizzes; an edited one keeps its type.
  const [examTypeText, setExamTypeText] = useState("QUIZ")
  const [durationMinutes, setDurationMinutes] = useState("")
  const [passingScore, setPassingScore] = useState("70")

  const [questions, setQuestions] = useState([])
  const [bankPickerOpen, setBankPickerOpen] = useState(false)
  const [addingFromBank, setAddingFromBank] = useState(false)
  const [pointsMode, setPointsMode] = useState("SAME")
  const [samePoints, setSamePoints] = useState("1")
  const [pointsById, setPointsById] = useState({})

  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [questionsHydrated, setQuestionsHydrated] = useState(false)
  const [mobileTab, setMobileTab] = useState("settings")

  const departmentQuery = useQuery({
    queryKey: ["department", id],
    queryFn: () => getDepartmentById(id),
    enabled: Number.isFinite(id),
  })

  const coveredCertifications = (departmentQuery.data?.certifications ?? []).filter(
    (cert) => String(cert?.status ?? "active").toLowerCase() === "active"
  )
  const coveredCertificationIds = coveredCertifications.map((cert) => cert.certificationId)
  const requestedCertificationId = Number(searchParams.get("certificationId"))
  const groupCertificationId = coveredCertificationIds.includes(requestedCertificationId)
    ? requestedCertificationId
    : coveredCertificationIds[0] ?? departmentQuery.data?.certificationId ?? null
  // The selected certification's outline only (no lesson content). Loading every
  // certification here took up to 15 s on a cold cache.
  const certificationsQuery = useQuery({
    queryKey: ["certifications", "group", id, "summary", groupCertificationId],
    queryFn: () => getCertificationSummary(groupCertificationId, id),
    enabled: Number.isFinite(id) && groupCertificationId != null,
    staleTime: 5 * 60_000,
    placeholderData: (previous) => previous,
  })

  const examTypesQuery = useQuery({
    queryKey: ["exam-types"],
    queryFn: getExamTypes,
    staleTime: 5 * 60_000,
  })

  const examQuery = useQuery({
    queryKey: ["exam", editingExamId, id],
    queryFn: () => getExamById(editingExamId, id),
    enabled: isEdit,
  })

  const examQuestionsQuery = useQuery({
    queryKey: ["exam-questions"],
    queryFn: getExamQuestions,
    enabled: isEdit,
  })
  // This department's certification only, not every question on the platform.
  const groupQuestionsQuery = useQuery({
    queryKey: ["questions", "group", id, "editor", groupCertificationId],
    queryFn: () => getQuestions(id, groupCertificationId ?? undefined),
    enabled: isEdit && Number.isFinite(id) && departmentQuery.isSuccess,
  })
  const questionContentQuery = useQuery({
    queryKey: ["exam-question-content", editingExamId],
    queryFn: async () => {
      const rows = examQuestionsQuery.data
        .filter((row) => row.examId === editingExamId)
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      const questionById = new Map(
        groupQuestionsQuery.data.map((question) => [question.questionId, question])
      )

      const reconstructed = []
      for (const row of rows) {
        const question = questionById.get(row.questionId)
        if (!question) continue
        const item = await reconstructQuestionData(question, groupQuestionsQuery.data)
        if (!item) continue
        reconstructed.push({
          key: createLocalId(),
          typeId: item.typeId,
          data: item.data,
          points: row.points != null ? String(row.points) : "1",
          existingQuestionId: question.questionId,
          lessonId: question.lessonId != null ? String(question.lessonId) : "",
        })
      }
      return reconstructed
    },
    enabled: isEdit && Array.isArray(examQuestionsQuery.data) && Array.isArray(groupQuestionsQuery.data),
  })

  const group = departmentQuery.data
  const certification = (certificationsQuery.data ?? []).find(
    (item) =>
      item.certificationId === groupCertificationId
  )

  const { own: ownMajors, official: officialMajors } = useMemo(
    () => buildCurriculumTree(certification, id),
    [certification, id]
  )
  const allMajors = useMemo(() => [...ownMajors, ...officialMajors], [ownMajors, officialMajors])

  const lessonIndex = useMemo(() => {
    const map = new Map()
    for (const major of allMajors) {
      for (const middle of major.middleCategories) {
        for (const lesson of middle.lessons) {
          map.set(String(lesson.lessonId), {
            lesson,
            middleId: String(middle.middleCategoryId),
            majorId: String(major.majorCategoryId),
            middleTitle: middle.title,
            majorTitle: major.title,
          })
        }
      }
    }
    return map
  }, [allMajors])
  const lessonGroups = useMemo(
    () =>
      allMajors.flatMap((major) =>
        major.middleCategories
          .filter((middle) => middle.lessons.length)
          .map((middle) => ({
            key: middle.middleCategoryId,
            label: `${major.title} › ${middle.title}`,
            lessons: middle.lessons,
          }))
      ),
    [allMajors]
  )

  if (isEdit && !hydrated && examQuery.data && Array.isArray(examTypesQuery.data) && certification) {
    const exam = examQuery.data
    const examType = examTypesQuery.data.find((t) => t.examTypeId === exam.examTypeId)
    setTitle(exam.title ?? "")
    const loadedType = examType?.examTypeText
    setExamTypeText(loadedType ? BUILDER_EXAM_TYPE[loadedType] ?? loadedType : examTypeText)
    setDurationMinutes(exam.durationMinutes != null ? String(exam.durationMinutes) : "")
    setPassingScore(exam.passingScore != null ? String(exam.passingScore) : "70")
    setHydrated(true)
  }

  if (isEdit && !questionsHydrated && questionContentQuery.data) {
    setQuestions(
      questionContentQuery.data.map(({ key, typeId, data, existingQuestionId, lessonId }) => ({
        key,
        typeId,
        data,
        existingQuestionId,
        lessonId,
      }))
    )
    setPointsById(
      Object.fromEntries(questionContentQuery.data.map((question) => [question.key, question.points]))
    )
    setQuestionsHydrated(true)
  }
  if (
    isEdit &&
    !questionsHydrated &&
    (examQuestionsQuery.isError || groupQuestionsQuery.isError || questionContentQuery.isError)
  ) {
    setQuestionsHydrated(true)
  }

  const totalPoints = questions.reduce(
    (sum, question) => sum + (Number(pointsById[question.key]) || 0),
    0
  )

  // A new question starts on the lesson the previous one used — most quizzes stay on one lesson.
  const lastLessonId = [...questions].reverse().find((question) => question.lessonId)?.lessonId ?? ""

  const coveredLessons = useMemo(() => {
    const counts = new Map()
    for (const question of questions) {
      if (!question.lessonId) continue
      counts.set(question.lessonId, (counts.get(question.lessonId) ?? 0) + 1)
    }
    return [...counts].map(([lessonId, count]) => ({ lessonId, count, chain: lessonIndex.get(lessonId) }))
  }, [questions, lessonIndex])

  const addQuestion = (questionType) => {
    const key = createLocalId()
    setQuestions((current) => [
      ...current,
      { key, typeId: questionType.id, data: cloneQuestionData(questionType.data), lessonId: lastLessonId },
    ])
    setPointsById((current) => ({
      ...current,
      [key]: pointsMode === "SAME" ? samePoints : "1",
    }))
  }

  const addFromBank = async (picked) => {
    setAddingFromBank(true)
    try {
      const added = []
      for (const question of picked) {
        const item = await reconstructQuestionData(question, picked)
        if (!item) continue
        added.push({
          key: createLocalId(),
          typeId: item.typeId,
          data: item.data,
          existingQuestionId: question.questionId,
          lessonId: question.lessonId != null ? String(question.lessonId) : "",
        })
      }
      setQuestions((current) => [...current, ...added])
      setPointsById((current) => ({
        ...current,
        ...Object.fromEntries(added.map((q) => [q.key, pointsMode === "SAME" ? samePoints : "1"])),
      }))
      setBankPickerOpen(false)
      if (added.length) toast.success(`Added ${added.length} question${added.length === 1 ? "" : "s"} from the bank.`)
    } catch {
      toast.error("Could not add those questions. Try again.")
    } finally {
      setAddingFromBank(false)
    }
  }

  const bankQuestionIds = useMemo(
    () => new Set(questions.map((q) => q.existingQuestionId).filter((qid) => qid != null)),
    [questions]
  )

  const removeQuestion = (key) => {
    setQuestions((current) => current.filter((question) => question.key !== key))
    setPointsById((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  const updateQuestionData = (key, updater) =>
    setQuestions((current) =>
      current.map((question) =>
        question.key === key
          ? { ...question, data: typeof updater === "function" ? updater(question.data) : updater }
          : question
      )
    )

  const setQuestionLesson = (key, lessonId) =>
    setQuestions((current) =>
      current.map((question) => (question.key === key ? { ...question, lessonId } : question))
    )

  const setOnePoint = (key, value) =>
    setPointsById((current) => ({ ...current, [key]: value }))

  const applySamePoints = (value) =>
    setPointsById(() => Object.fromEntries(questions.map((question) => [question.key, value])))

  const handlePointsModeChange = (nextMode) => {
    if (nextMode === pointsMode) return
    setPointsMode(nextMode)
    if (nextMode === "SAME" && isValidPoints(samePoints)) {
      applySamePoints(Number(samePoints))
    }
  }

  const perQuestionErrors = useMemo(() => {
    if (!submitted) return {}
    return Object.fromEntries(
      questions.map((question) => [question.key, validateQuestionData(question.typeId, question.data)])
    )
  }, [submitted, questions])

  const validate = () => {
    if (!title.trim()) return "Give the assessment a name."
    if (questions.length === 0) return "Add at least one question."

    for (const [index, question] of questions.entries()) {
      if (!question.lessonId || !lessonIndex.has(String(question.lessonId))) {
        return `Choose the lesson question ${index + 1} belongs to.`
      }
      const errors = validateQuestionData(question.typeId, question.data)
      if (Object.keys(errors).length > 0) {
        return `Question ${index + 1} has missing or invalid fields.`
      }
      if (!isValidPoints(pointsById[question.key])) {
        return `Question ${index + 1} needs points greater than zero.`
      }
    }
    return ""
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const examType = await ensureExamType(STORED_EXAM_TYPE[examTypeText] ?? examTypeText)

      const finalQuestions = []
      for (const [index, question] of questions.entries()) {
        const points = Number(pointsById[question.key]) || 1
        if (question.existingQuestionId) {
          finalQuestions.push({
            questionId: question.existingQuestionId,
            points,
            displayOrder: index + 1,
          })
          continue
        }
        const saved = await saveAuthoredQuestion(
          question,
          {
            lessonId: Number(question.lessonId),
            certificationId: certification.certificationId,
            ownerDepartmentId: id,
          },
          QUESTION_API
        )
        finalQuestions.push({ questionId: saved.questionId, points, displayOrder: index + 1 })
      }

      const payload = {
        certificationId: certification.certificationId,
        examTypeId: examType.examTypeId,
        title: title.trim(),
        isGenerated: false,
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        passingScore: passingScore ? Number(passingScore) : null,
        releaseAnswersAfterSubmit: true,
        ...deriveTarget(examTypeText, questions, lessonIndex),
        totalQuestions: finalQuestions.length,
        questions: finalQuestions,
      }

      return isEdit
        ? updateExam(editingExamId, { ...payload, examId: editingExamId })
        : createExam(payload, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] })
      queryClient.invalidateQueries({ queryKey: ["exam-questions"] })
      toast.success(isEdit ? "Assessment updated." : "Assessment created.")
      navigate(`/institution/departments?view=assessments&department=${id}&certificationId=${groupCertificationId ?? ""}`)
    },
    onError: (err) => {
      const message = backendMessage(err, "Unable to save this assessment.")
      setError(message)
      toast.error(message)
    },
  })

  const handleSave = () => {
    setSubmitted(true)
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    setError("")
    saveMutation.mutate()
  }

  if (
    departmentQuery.isLoading ||
    certificationsQuery.isLoading ||
    (isEdit && (examQuery.isLoading || examTypesQuery.isLoading || !questionsHydrated))
  ) {
    return <InstitutionLoadingSkeleton />
  }
  if (departmentQuery.isError) {
    return <InstitutionErrorState title="Unable to load this department" onRetry={departmentQuery.refetch} />
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/institution/departments?view=assessments&department=${id}&certificationId=${groupCertificationId ?? ""}`)}
          >
            Cancel
          </Button>
          <div className="min-w-0">
            <h1 className="truncate font-heading text-base font-bold text-foreground">
              {title.trim() || (isEdit ? "Edit assessment" : "New assessment")}
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {isEdit ? "Editing" : "Draft"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium tabular-nums text-muted-foreground">
            {questions.length} question{questions.length === 1 ? "" : "s"} · {totalPoints} pt
            {totalPoints === 1 ? "" : "s"}
          </span>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Saving...
              </>
            ) : isEdit ? (
              "Save changes"
            ) : (
              "Create assessment"
            )}
          </Button>
        </div>
      </div>

      {error ? (
        <p
          className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {isEdit ? (
        <p className="flex items-start gap-1.5 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs leading-5 text-amber-700 dark:text-amber-400">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          You can add, remove, reorder, and repoint existing questions here. To change an existing
          question&apos;s own text or answers, remove it and add a replacement.
        </p>
      ) : null}

      {/* Mobile segmented tabs for switching between Settings, Questions canvas, and Add tools */}
      <div className="flex border-b border-border bg-background p-1.5 md:hidden" role="tablist">
        {[
          ["settings", "Settings"],
          ["questions", `Questions (${questions.length})`],
          ["add", "Add / Bank"],
        ].map(([tabKey, tabTitle]) => (
          <button
            key={tabKey}
            type="button"
            role="tab"
            aria-selected={mobileTab === tabKey}
            onClick={() => setMobileTab(tabKey)}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
              mobileTab === tabKey
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {tabTitle}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 md:grid-cols-[300px_minmax(0,1fr)_264px] xl:grid-cols-[320px_minmax(0,1fr)_280px]">
        <aside
          className={cn(
            "min-h-0 space-y-5 overflow-y-auto overscroll-contain border-b border-border p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:border-b-0 md:border-r md:p-5",
            mobileTab !== "settings" && "hidden md:block"
          )}
        >
          <SectionLabel>Basics</SectionLabel>

          <div className="space-y-1.5">
            <Label htmlFor="a-certification">Certification</Label>
            {isEdit || coveredCertifications.length <= 1 ? (
              <p id="a-certification" className="rounded-md border bg-muted/30 px-3 py-2 text-sm font-medium text-foreground">
                {coveredCertifications.find((cert) => cert.certificationId === groupCertificationId)?.title ?? "—"}
              </p>
            ) : (
              <Select
                value={groupCertificationId != null ? String(groupCertificationId) : undefined}
                onValueChange={(value) => {
                  // Lessons and questions belong to one certification, so a new choice starts them over.
                  setQuestions([])
                  setSearchParams((prev) => {
                    const params = new URLSearchParams(prev)
                    params.set("certificationId", value)
                    return params
                  }, { replace: true })
                }}
              >
                <SelectTrigger id="a-certification">
                  <SelectValue placeholder="Choose a certification" />
                </SelectTrigger>
                <SelectContent>
                  {coveredCertifications.map((cert) => (
                    <SelectItem key={cert.certificationId} value={String(cert.certificationId)}>
                      {cert.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">
              Once published, every learner in this department enrolled in it can take it.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="a-title">Name</Label>
            <Input
              id="a-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Week 1 Quiz"
            />
          </div>

          <SectionLabel className="pt-1">Lessons covered</SectionLabel>

          {lessonGroups.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No categories available yet — add your own in the{" "}
              <Link
                to={`/institution/departments/${id}?tab=content`}
                className="font-medium text-primary hover:underline"
              >
                Content tab
              </Link>
              .
            </p>
          ) : coveredLessons.length === 0 ? (
            <p className="text-xs leading-5 text-muted-foreground">
              Every question picks its own lesson on its card. The lessons you use will be listed here.
            </p>
          ) : (
            <div className="space-y-2">
              <ul className="space-y-1.5">
                {coveredLessons.map(({ lessonId, count, chain }) => (
                  <li key={lessonId} className="flex items-start justify-between gap-2 rounded-lg border bg-background px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {chain?.lesson.name ?? "Lesson not in this certification"}
                      </p>
                      {chain ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {chain.majorTitle} › {chain.middleTitle}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                      {count} Q
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs leading-5 text-muted-foreground">
                {coveredLessons.length === 1
                  ? "All questions are from one lesson, so this assessment attaches to that lesson."
                  : "Questions span several lessons, so this assessment covers the certification."}
              </p>
            </div>
          )}

          <SectionLabel className="pt-1">Marking</SectionLabel>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="a-duration">Duration (min)</Label>
              <Input
                id="a-duration"
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-passing">Passing grade (%)</Label>
              <Input
                id="a-passing"
                type="number"
                min="0"
                max="100"
                value={passingScore}
                onChange={(e) => setPassingScore(e.target.value)}
              />
            </div>
          </div>

          {examTypeText === "MOCK_EXAM" && certification?.certificationId != null ? (
            <ExamFormatPanel
              certificationId={certification.certificationId}
              selectedCount={questions.length}
              onUseTiming={({ durationMinutes: minutes, passingScore: passing }) => {
                if (minutes) setDurationMinutes(String(minutes))
                if (passing) setPassingScore(String(passing))
              }}
            />
          ) : null}

          <p className="text-xs leading-5 text-muted-foreground">
            A learner&apos;s first attempt follows the order in the centre column; a retake
            shuffles the questions and their choices.
          </p>

          <div className="rounded-xl border p-3">
            <h4 className="text-sm font-semibold">Question points</h4>
            <RadioGroup value={pointsMode} onValueChange={handlePointsModeChange} className="mt-3 gap-2">
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="SAME" />
                Same points for all questions
              </label>
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="INDIVIDUAL" />
                Configure points for each question
              </label>
            </RadioGroup>

            {pointsMode === "SAME" ? (
              <div className="mt-3 flex items-end gap-2">
                <div className="space-y-1">
                  <Label htmlFor="a-same-points" className="text-xs">
                    Points per question
                  </Label>
                  <Input
                    id="a-same-points"
                    type="number"
                    min="0.01"
                    step="0.5"
                    value={samePoints}
                    onChange={(e) => {
                      const next = e.target.value
                      setSamePoints(next)
                      if (isValidPoints(next)) applySamePoints(Number(next))
                    }}
                    className="h-9 w-24"
                    aria-invalid={!isValidPoints(samePoints)}
                  />
                </div>
                {!isValidPoints(samePoints) ? (
                  <p className="pb-1 text-xs text-destructive">Points must be greater than zero.</p>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                Set each question&apos;s points in its card in the centre column.
              </p>
            )}
          </div>
        </aside>

        <main
          className={cn(
            "min-h-0 overflow-y-auto overscroll-contain bg-muted/20 p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:p-4 md:p-5",
            mobileTab !== "questions" && "hidden md:block"
          )}
        >
          {questions.length === 0 ? (
            <div className="flex h-full items-center justify-center p-2">
              <div className="w-full max-w-md rounded-2xl border-2 border-dashed border-border bg-background/60 px-6 py-10 text-center">
                <ListChecks className="mx-auto size-10 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium text-foreground">No questions yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick questions from your question bank, or write new ones here.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Button onClick={() => setBankPickerOpen(true)} disabled={!certification}>
                    <LibraryBig className="size-4" aria-hidden="true" />
                    Choose from question bank
                  </Button>
                  <Button variant="outline" onClick={() => addQuestion(firstQuestionType)}>
                    Write a multiple choice question
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-5xl space-y-4">
              {questions.map((question, index) => {
                const questionType = QUESTION_TYPES.find((t) => t.id === question.typeId)
                const Editor = questionType?.component
                if (!Editor && !question.existingQuestionId) return null

                const pointsInput = (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Label htmlFor={`pts-${question.key}`} className="text-xs text-muted-foreground">
                      Points
                    </Label>
                    <Input
                      id={`pts-${question.key}`}
                      type="number"
                      min="0.01"
                      step="0.5"
                      readOnly={pointsMode === "SAME"}
                      disabled={pointsMode === "SAME"}
                      value={pointsById[question.key] ?? ""}
                      onChange={(e) => setOnePoint(question.key, e.target.value)}
                      className="h-8 w-20"
                      aria-label={`Points for question ${index + 1}`}
                    />
                  </div>
                )

                const chain = question.lessonId ? lessonIndex.get(String(question.lessonId)) : null
                const lessonMissing = submitted && !chain
                // A bank question already lives in a lesson; it is shown, not changed, here.
                const lessonBar = (
                  <div
                    className={cn(
                      "flex flex-col gap-1.5 rounded-t-xl border border-b-0 px-4 py-2.5 sm:flex-row sm:items-center sm:gap-3",
                      lessonMissing ? "border-destructive/40 bg-destructive/5" : "border-border bg-primary/5"
                    )}
                  >
                    <Label
                      htmlFor={`lesson-${question.key}`}
                      className="shrink-0 text-xs font-semibold uppercase tracking-wide text-primary"
                    >
                      Lesson
                    </Label>
                    {question.existingQuestionId ? (
                      <p className="min-w-0 truncate text-sm text-foreground">
                        {chain ? (
                          <>
                            <span className="font-medium">{chain.lesson.name}</span>
                            <span className="text-muted-foreground"> · {chain.majorTitle} › {chain.middleTitle}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">Lesson not in this certification</span>
                        )}
                      </p>
                    ) : (
                      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                        <LessonPicker
                          id={`lesson-${question.key}`}
                          label={`Lesson for question ${index + 1}`}
                          value={question.lessonId}
                          onChange={(value) => setQuestionLesson(question.key, value)}
                          groups={lessonGroups}
                          invalid={lessonMissing}
                          disabled={lessonGroups.length === 0}
                        />
                        {chain ? (
                          <span className="min-w-0 truncate text-xs text-muted-foreground">
                            {chain.majorTitle} › {chain.middleTitle}
                          </span>
                        ) : lessonMissing ? (
                          <span className="text-xs text-destructive">Choose a lesson.</span>
                        ) : null}
                      </div>
                    )}
                  </div>
                )

                return (
                  <section
                    key={question.key}
                    className="[&>*:last-child]:rounded-t-none"
                    aria-label={`Question ${index + 1}`}
                  >
                    {lessonBar}
                    {question.existingQuestionId ? (
                      <BankQuestionCard
                        questionNumber={index + 1}
                        question={question}
                        headerExtra={pointsInput}
                        onRemove={() => removeQuestion(question.key)}
                      />
                    ) : (
                      <Editor
                        questionKey={question.key}
                        questionNumber={index + 1}
                        onRemove={() => removeQuestion(question.key)}
                        data={question.data}
                        onDataChange={(updater) => updateQuestionData(question.key, updater)}
                        errors={perQuestionErrors[question.key] ?? {}}
                        headerExtra={pointsInput}
                      />
                    )}
                  </section>
                )
              })}
            </div>
          )}
        </main>

        <aside
          className={cn(
            "min-h-0 space-y-5 overflow-y-auto overscroll-contain border-t border-border p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:border-l md:border-t-0 md:p-5",
            mobileTab !== "add" && "hidden md:block"
          )}
        >
          <div>
            <SectionLabel>From question bank</SectionLabel>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Reuse questions your department wrote in its question bank.
            </p>
            <Button
              className="mt-3 w-full"
              onClick={() => setBankPickerOpen(true)}
              disabled={!certification || addingFromBank}
            >
              {addingFromBank ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <LibraryBig className="size-4" aria-hidden="true" />
              )}
              Choose from question bank
            </Button>
          </div>
          <div>
            <SectionLabel>Write a new question</SectionLabel>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Pick a type, then choose its lesson on the card. It is saved to your question bank
              under that lesson too.
            </p>
          </div>
          <div className="space-y-2">
            {QUESTION_TYPES.map((questionType) => (
              <QuestionTypeButton key={questionType.id} questionType={questionType} onAdd={addQuestion} />
            ))}
          </div>
        </aside>
      </div>

      {certification ? (
        <AssessmentQuestionPickerDialog
          open={bankPickerOpen}
          onOpenChange={setBankPickerOpen}
          certification={certification}
          ownerDepartmentId={id}
          excludeUsedElsewhere={false}
          departmentQuestionsOnly
          alreadySelectedIds={bankQuestionIds}
          currentExamId={editingExamId}
          initialLessonId={lastLessonId ? Number(lastLessonId) : null}
          initialMiddleCategoryId={null}
          onAddQuestions={addFromBank}
        />
      ) : null}
    </div>
  )
}
