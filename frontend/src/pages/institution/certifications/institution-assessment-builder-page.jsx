import { useMemo, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertCircle, LibraryBig, ListChecks, Loader2, Trash2 } from "@/components/icons"
import { toast } from "sonner"

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
import { getAllCertifications } from "@/services/certificationService.js"
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
  INSTITUTION_ASSESSMENT_TYPES,
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

const EXAM_TYPE_SCOPES = {
  QUIZ: "LESSON",
  MODULE_EXAM: "MIDDLE_CATEGORY",
  MOCK_EXAM: "CERTIFICATION",
  PRACTICE_TEST: "LESSON",
  ASSIGNMENT: "LESSON",
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
  const [searchParams] = useSearchParams()

  const [title, setTitle] = useState("")
  const [examTypeText, setExamTypeText] = useState(searchParams.get("type") ?? "QUIZ")
  const [durationMinutes, setDurationMinutes] = useState("")
  const [passingScore, setPassingScore] = useState("70")

  const [scopeMajorId, setScopeMajorId] = useState("")
  const [scopeMiddleId, setScopeMiddleId] = useState("")
  const [scopeLessonId, setScopeLessonId] = useState("")

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

  const departmentQuery = useQuery({
    queryKey: ["department", id],
    queryFn: () => getDepartmentById(id),
    enabled: Number.isFinite(id),
  })

  // Structure only -- no lesson content, which is most of the full list's ~7 MB.
  const certificationsQuery = useQuery({
    queryKey: ["certifications", "group", id, "summary"],
    queryFn: () => getAllCertifications(id, { summary: true }),
    enabled: Number.isFinite(id),
    staleTime: 5 * 60_000,
  })
  const groupCertificationId =
    departmentQuery.data?.certificationId ??
    departmentQuery.data?.institutionCert?.certificationId ??
    null

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
        })
      }
      return reconstructed
    },
    enabled: isEdit && Array.isArray(examQuestionsQuery.data) && Array.isArray(groupQuestionsQuery.data),
  })

  const group = departmentQuery.data
  const certification = (certificationsQuery.data ?? []).find(
    (item) =>
      item.certificationId === group?.certificationId ||
      item.certificationId === group?.institutionCert?.certificationId
  )

  const { own: ownMajors, official: officialMajors } = useMemo(
    () => buildCurriculumTree(certification, id),
    [certification, id]
  )
  const allMajors = useMemo(() => [...ownMajors, ...officialMajors], [ownMajors, officialMajors])

  const majorById = useMemo(
    () => new Map(allMajors.map((major) => [String(major.majorCategoryId), major])),
    [allMajors]
  )
  const middleIndex = useMemo(() => {
    const map = new Map()
    for (const major of allMajors) {
      for (const middle of major.middleCategories) {
        map.set(String(middle.middleCategoryId), { middle, majorId: String(major.majorCategoryId) })
      }
    }
    return map
  }, [allMajors])
  const lessonIndex = useMemo(() => {
    const map = new Map()
    for (const major of allMajors) {
      for (const middle of major.middleCategories) {
        for (const lesson of middle.lessons) {
          map.set(String(lesson.lessonId), {
            lesson,
            middleId: String(middle.middleCategoryId),
            majorId: String(major.majorCategoryId),
          })
        }
      }
    }
    return map
  }, [allMajors])

  const middleOptions = scopeMajorId ? majorById.get(scopeMajorId)?.middleCategories ?? [] : []
  const lessonOptions = scopeMiddleId ? middleIndex.get(scopeMiddleId)?.middle.lessons ?? [] : []

  const handleMajorChange = (value) => {
    setScopeMajorId(value)
    setScopeMiddleId("")
    setScopeLessonId("")
  }
  const handleMiddleChange = (value) => {
    setScopeMiddleId(value)
    setScopeLessonId("")
  }

  const scope = EXAM_TYPE_SCOPES[examTypeText] ?? "LESSON"

  if (isEdit && !hydrated && examQuery.data && Array.isArray(examTypesQuery.data) && certification) {
    const exam = examQuery.data
    const examType = examTypesQuery.data.find((t) => t.examTypeId === exam.examTypeId)
    setTitle(exam.title ?? "")
    setExamTypeText(examType?.examTypeText ?? examTypeText)
    setDurationMinutes(exam.durationMinutes != null ? String(exam.durationMinutes) : "")
    setPassingScore(exam.passingScore != null ? String(exam.passingScore) : "70")

    if (exam.lessonId != null) {
      const chain = lessonIndex.get(String(exam.lessonId))
      setScopeLessonId(String(exam.lessonId))
      setScopeMiddleId(chain?.middleId ?? "")
      setScopeMajorId(chain?.majorId ?? "")
    } else if (exam.middleCategoryId != null) {
      const chain = middleIndex.get(String(exam.middleCategoryId))
      setScopeMiddleId(String(exam.middleCategoryId))
      setScopeMajorId(chain?.majorId ?? "")
    } else if (exam.majorCategoryId != null) {
      setScopeMajorId(String(exam.majorCategoryId))
    }
    setHydrated(true)
  }

  if (isEdit && !questionsHydrated && questionContentQuery.data) {
    setQuestions(
      questionContentQuery.data.map(({ key, typeId, data, existingQuestionId }) => ({
        key,
        typeId,
        data,
        existingQuestionId,
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

  const addQuestion = (questionType) => {
    const key = createLocalId()
    setQuestions((current) => [
      ...current,
      { key, typeId: questionType.id, data: cloneQuestionData(questionType.data) },
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
    if (!scopeMajorId) return "Choose a category."
    if (!scopeMiddleId) return "Choose a module."
    if (!scopeLessonId) return "Choose a lesson to attach your questions to."
    if (questions.length === 0) return "Add at least one question."

    for (const [index, question] of questions.entries()) {
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
      const examType = await ensureExamType(examTypeText)

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
            lessonId: Number(scopeLessonId),
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
        targetScope: scope,
        lessonId: scope === "LESSON" ? Number(scopeLessonId) : null,
        middleCategoryId: scope === "MIDDLE_CATEGORY" ? Number(scopeMiddleId) : null,
        majorCategoryId: scope === "MAJOR_CATEGORY" ? Number(scopeMajorId) : null,
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
      navigate(`/institution/departments/${id}?tab=assessments`)
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

  const scopeHint =
    scope === "MIDDLE_CATEGORY"
      ? "This assessment targets the whole module. The lesson below is only used to attach your questions."
      : scope === "CERTIFICATION"
        ? "This assessment covers the whole certification. The lesson below is only used to attach your questions."
        : "This assessment and its questions attach to the lesson you pick."

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/institution/departments/${id}?tab=assessments`)}
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

      <div className="grid min-h-0 flex-1 md:grid-cols-[320px_minmax(0,1fr)_268px] xl:grid-cols-[360px_minmax(0,1fr)_288px]">
        <aside className="min-h-0 space-y-5 overflow-y-auto border-b border-border p-4 md:border-b-0 md:border-r">
          <SectionLabel>Basics</SectionLabel>

          <div className="space-y-1.5">
            <Label htmlFor="a-title">Name</Label>
            <Input
              id="a-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Week 1 Quiz"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="a-type">Exam type</Label>
            <Select value={examTypeText} onValueChange={setExamTypeText}>
              <SelectTrigger id="a-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {INSTITUTION_ASSESSMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <SectionLabel className="pt-1">Where it attaches</SectionLabel>

          {allMajors.length === 0 ? (
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
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="a-major">Category</Label>
                <Select value={scopeMajorId} onValueChange={handleMajorChange}>
                  <SelectTrigger id="a-major">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {ownMajors.length ? (
                      <SelectGroup>
                        <SelectLabel>Your categories</SelectLabel>
                        {ownMajors.map((major) => (
                          <SelectItem key={major.majorCategoryId} value={String(major.majorCategoryId)}>
                            {major.title}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ) : null}
                    {officialMajors.length ? (
                      <SelectGroup>
                        <SelectLabel>Curriculum categories</SelectLabel>
                        {officialMajors.map((major) => (
                          <SelectItem key={major.majorCategoryId} value={String(major.majorCategoryId)}>
                            {major.title}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ) : null}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="a-middle">Module</Label>
                <Select
                  value={scopeMiddleId}
                  onValueChange={handleMiddleChange}
                  disabled={!scopeMajorId || middleOptions.length === 0}
                >
                  <SelectTrigger id="a-middle">
                    <SelectValue placeholder="Select a module" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {middleOptions.map((middle) => (
                      <SelectItem key={middle.middleCategoryId} value={String(middle.middleCategoryId)}>
                        {middle.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {scopeMajorId && middleOptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">This category has no modules yet.</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="a-lesson">Lesson</Label>
                <Select
                  value={scopeLessonId}
                  onValueChange={setScopeLessonId}
                  disabled={!scopeMiddleId || lessonOptions.length === 0}
                >
                  <SelectTrigger id="a-lesson">
                    <SelectValue placeholder="Select a lesson" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {lessonOptions.map((lesson) => (
                      <SelectItem key={lesson.lessonId} value={String(lesson.lessonId)}>
                        {lesson.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {scopeMiddleId && lessonOptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">This module has no lessons yet.</p>
                ) : (
                  <p className="text-xs text-muted-foreground">{scopeHint}</p>
                )}
              </div>
            </>
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

        <main className="min-h-0 overflow-y-auto bg-muted/20 p-4">
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
            <div className="space-y-4">
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

                if (question.existingQuestionId) {
                  return (
                    <BankQuestionCard
                      key={question.key}
                      questionNumber={index + 1}
                      question={question}
                      headerExtra={pointsInput}
                      onRemove={() => removeQuestion(question.key)}
                    />
                  )
                }

                return (
                  <Editor
                    key={question.key}
                    questionKey={question.key}
                    questionNumber={index + 1}
                    onRemove={() => removeQuestion(question.key)}
                    data={question.data}
                    onDataChange={(updater) => updateQuestionData(question.key, updater)}
                    errors={perQuestionErrors[question.key] ?? {}}
                    headerExtra={pointsInput}
                  />
                )
              })}
            </div>
          )}
        </main>

        <aside className="min-h-0 space-y-4 overflow-y-auto border-t border-border p-4 md:border-l md:border-t-0">
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
              Pick a type to write it here. It is saved to your question bank too.
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
          initialLessonId={scope === "LESSON" && scopeLessonId ? Number(scopeLessonId) : null}
          initialMiddleCategoryId={scope === "MIDDLE_CATEGORY" && scopeMiddleId ? Number(scopeMiddleId) : null}
          onAddQuestions={addFromBank}
        />
      ) : null}
    </div>
  )
}
