import { useEffect, useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowDown, ArrowUp, Plus, Trash2 } from "@/components/icons"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createExam,
  ensureExamType,
  updateExam,
} from "@/services/assessmentService.js"
import AssessmentQuestionPickerDialog from "./assessment-question-picker-dialog.jsx"

/* Served by the IRT + BKT engine one question at a time; mirrors AdaptivePolicy. */
const ADAPTIVE_TYPES = new Set(["LESSON_QUIZ", "MIDDLE_EXAM", "MAJOR_EXAM", "MOCK_EXAM", "DIAGNOSTIC"])

const ASSESSMENT_CREATE_TYPES = [
  {
    value: "DIAGNOSTIC",
    label: "Diagnostic Exam",
    examTypeText: "DIAGNOSTIC",
    scope: "CERTIFICATION",
    targetLabel: "Certification",
  },
  {
    value: "LESSON_QUIZ",
    label: "Lesson Quiz",
    examTypeText: "LESSON_QUIZ",
    scope: "LESSON",
    targetLabel: "Lesson",
  },
  {
    value: "MIDDLE_EXAM",
    label: "Middle Exam",
    examTypeText: "MIDDLE_EXAM",
    scope: "MIDDLE_CATEGORY",
    targetLabel: "Middle Category",
  },
  {
    value: "MAJOR_EXAM",
    label: "Major Exam",
    examTypeText: "MAJOR_EXAM",
    scope: "MAJOR_CATEGORY",
    targetLabel: "Major Category",
  },
  {
    value: "MOCK_EXAM",
    label: "Mock Exam",
    examTypeText: "MOCK_EXAM",
    scope: "CERTIFICATION",
    targetLabel: "Certification",
  },
]
function getCreateTypeConfig(value) {
  return (
      ASSESSMENT_CREATE_TYPES.find((item) => item.value === value) ??
      ASSESSMENT_CREATE_TYPES[0]
  )
}

function normalizeCreateType(value, fallback = "MOCK_EXAM") {
  const text = String(value ?? "").trim().toUpperCase()

  if (text === "DIAGNOSTIC" || text === "DIAGNOSTIC_EXAM") {
    return "DIAGNOSTIC"
  }

  if (text === "QUIZ" || text === "LESSON_QUIZ") {
    return "LESSON_QUIZ"
  }

  if (
      text === "MODULE_EXAM" ||
      text === "MIDDLE_EXAM" ||
      text === "MIDDLE_CATEGORY_QUIZ"
  ) {
    return "MIDDLE_EXAM"
  }

  if (
      text === "MAJOR_EXAM" ||
      text === "MAJOR_CATEGORY_QUIZ" ||
      text === "MAJOR_CATEGORY_EXAM"
  ) {
    return "MAJOR_EXAM"
  }

  if (text === "MOCK_EXAM" || text === "MOCK") return "MOCK_EXAM"

  return fallback
}

function getLessonTitle(lesson) {
  return lesson?.name ?? lesson?.title ?? "Untitled lesson"
}

function getMajorId(majorCategory) {
  return majorCategory?.majorCategoryId ?? majorCategory?.id
}

function getMiddleId(middleCategory) {
  return middleCategory?.middleCategoryId ?? middleCategory?.id
}

function getLessonId(lesson) {
  return lesson?.lessonId ?? lesson?.id
}

function buildAssessmentTargets(certification) {
  const majorCategories = certification?.majorCategory ?? []

  const majors = []
  const middles = []
  const lessons = []

  majorCategories.forEach((majorCategory) => {
    const majorId = getMajorId(majorCategory)

    if (majorId != null) {
      majors.push({
        id: String(majorId),
        title: majorCategory.title ?? "Untitled major category",
        majorCategory,
      })
    }

    ;(majorCategory.middleCategory ?? []).forEach((middleCategory) => {
      const middleId = getMiddleId(middleCategory)

      if (middleId != null) {
        middles.push({
          id: String(middleId),
          title: middleCategory.title ?? "Untitled middle category",
          subtitle: majorCategory.title ?? "Major category",
          middleCategory,
          majorCategory,
        })
      }

      ;(middleCategory.lessons ?? []).forEach((lesson) => {
        const lessonId = getLessonId(lesson)

        if (lessonId != null) {
          lessons.push({
            id: String(lessonId),
            title: getLessonTitle(lesson),
            subtitle: `${middleCategory.title ?? "Middle category"} · ${
                majorCategory.title ?? "Major category"
            }`,
            lesson,
            middleCategory,
            majorCategory,
          })
        }
      })
    })
  })

  return {
    majors,
    middles,
    lessons,
  }
}

function getTargetOptionsByScope(targets, scope) {
  if (scope === "LESSON") return targets.lessons
  if (scope === "MIDDLE_CATEGORY") return targets.middles
  if (scope === "MAJOR_CATEGORY") return targets.majors
  return []
}

function getDefaultTitle({ createTypeConfig, selectedTarget, certification }) {
  if (createTypeConfig.scope === "CERTIFICATION") {
    return `${certification?.title ?? "Certification"} ${createTypeConfig.label}`
  }

  return `${selectedTarget?.title ?? createTypeConfig.targetLabel} ${
      createTypeConfig.label
  }`
}

export default function AssessmentDialog({
                                           open,
                                           onOpenChange,
                                           mode = "create",
                                           certification,
                                           exam = null,
                                           examTypeByIdText = new Map(),
                                           existingExamQuestions = [],
                                           questionById = new Map(),
                                           initialType = "MOCK_EXAM",
                                           initialLessonId = null,
                                           initialMiddleCategoryId = null,
                                           initialMajorCategoryId = null,
                                           initialTitle = "",
                                           lockPreset = false,
                                           // When set, a newly created exam is owned by this
                                           // Institution group (member-authored) instead of being
                                           // official, platform-wide content. See ExamController.
                                           ownerDepartmentId = null,
                                         }) {
  const queryClient = useQueryClient()
  const isEdit = mode === "edit"

  const [title, setTitle] = useState("")
  const [createType, setCreateType] = useState(
      normalizeCreateType(initialType, "MOCK_EXAM")
  )
  const [targetId, setTargetId] = useState("")
  const [durationMinutes, setDurationMinutes] = useState("")
  const [passingScore, setPassingScore] = useState("")
  const [releaseAnswersAfterSubmit, setReleaseAnswersAfterSubmit] = useState(true)
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [error, setError] = useState("")

  const targets = useMemo(
      () => buildAssessmentTargets(certification),
      [certification]
  )

  const createTypeConfig = useMemo(
      () => getCreateTypeConfig(createType),
      [createType]
  )

  const targetOptions = useMemo(
      () => getTargetOptionsByScope(targets, createTypeConfig.scope),
      [targets, createTypeConfig.scope]
  )

  const selectedTarget = useMemo(() => {
    return targetOptions.find((item) => item.id === targetId) ?? null
  }, [targetOptions, targetId])

  const typeLabel = createTypeConfig.label

  useEffect(() => {
    if (!open) return

    if (isEdit && exam) {
      const fallbackType = normalizeCreateType(initialType, "MOCK_EXAM")
      const currentTypeText = examTypeByIdText.get(exam.examTypeId) ?? fallbackType
      const currentCreateType = normalizeCreateType(currentTypeText, fallbackType)

      setTitle(exam.title ?? "")
      setCreateType(currentCreateType)
      setTargetId(
          exam.lessonId != null
              ? String(exam.lessonId)
              : exam.middleCategoryId != null
                  ? String(exam.middleCategoryId)
                  : exam.majorCategoryId != null
                      ? String(exam.majorCategoryId)
                      : ""
      )
      setDurationMinutes(
          exam.durationMinutes != null ? String(exam.durationMinutes) : ""
      )
      setPassingScore(
          exam.passingScore != null ? String(exam.passingScore) : ""
      )
      setReleaseAnswersAfterSubmit(
          exam.releaseAnswersAfterSubmit == null
              ? true
              : Boolean(exam.releaseAnswersAfterSubmit)
      )

      const orderedExamQuestions = [...existingExamQuestions].sort(
          (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
      )
      const ordered = orderedExamQuestions
          .map((examQuestion) => questionById.get(examQuestion.questionId))
          .filter(Boolean)
    } else {
      const nextType = normalizeCreateType(initialType, "MOCK_EXAM")
      const nextConfig = getCreateTypeConfig(nextType)
      const nextTargetId =
          nextConfig.scope === "LESSON" && initialLessonId != null
              ? String(initialLessonId)
              : nextConfig.scope === "MIDDLE_CATEGORY" &&
              initialMiddleCategoryId != null
                  ? String(initialMiddleCategoryId)
                  : nextConfig.scope === "MAJOR_CATEGORY" &&
                  initialMajorCategoryId != null
                      ? String(initialMajorCategoryId)
                      : ""
      const nextTargetOptions = getTargetOptionsByScope(
          targets,
          nextConfig.scope
      )
      const nextTarget =
          nextTargetOptions.find((item) => item.id === nextTargetId) ?? null
      const presetTitle = String(initialTitle ?? "").trim()

      setCreateType(nextType)
      setTargetId(nextTargetId)
      setTitle(
          presetTitle ||
          getDefaultTitle({
            createTypeConfig: nextConfig,
            selectedTarget: nextTarget,
            certification,
          })
      )
      setDurationMinutes("")
      setPassingScore("")
      setReleaseAnswersAfterSubmit(true)
      setSelectedQuestions([])
    }

    setError("")
    setPickerOpen(false)

    // Keep dependencies limited to dialog lifecycle.
    // This prevents selected questions from resetting while the picker is closing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, exam?.examId, mode])

  const alreadySelectedIds = useMemo(
      () => new Set(selectedQuestions.map((question) => question.questionId)),
      [selectedQuestions]
  )

  const saveMutation = useMutation({
    mutationFn: async () => {
      const examType = await ensureExamType(createTypeConfig.examTypeText)

      const questionIds = selectedQuestions.map(
          (question) => question.questionId
      )

      // The admin's selection, in order, is the single source of truth
      // persisted for this assessment. Every question counts the same.
      const questions = selectedQuestions.map((question, index) => ({
        questionId: question.questionId,
        displayOrder: index + 1,
      }))

      const payload = {
        certificationId: certification.certificationId,
        examTypeId: examType.examTypeId,
        title: title.trim(),
        isGenerated: exam?.isGenerated ?? false,
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        totalQuestions: questionIds.length,
        passingScore: passingScore ? Number(passingScore) : null,
        releaseAnswersAfterSubmit,
        questions,
        questionIds,

        targetScope: createTypeConfig.scope,
        assessmentScope: createTypeConfig.scope,
        lessonId:
            createTypeConfig.scope === "LESSON" && targetId
                ? Number(targetId)
                : null,
        middleCategoryId:
            createTypeConfig.scope === "MIDDLE_CATEGORY" && targetId
                ? Number(targetId)
                : null,
        majorCategoryId:
            createTypeConfig.scope === "MAJOR_CATEGORY" && targetId
                ? Number(targetId)
                : null,
      }

      const savedExam = isEdit
          ? await updateExam(exam.examId, {
            ...payload,
            examId: exam.examId,
          })
          : await createExam(payload, ownerDepartmentId)

      return {
        savedExam,
        questionIds,
        questions,
      }
    },

    onSuccess: async ({ savedExam, questionIds, questions }) => {
      queryClient.setQueryData(["exams"], (current) => {
        const list = Array.isArray(current) ? [...current] : []
        const next = list.filter((item) => item.examId !== savedExam.examId)

        next.unshift({
          ...savedExam,
          questionIds,
          totalQuestions: questionIds.length,
        })

        return next
      })

      queryClient.setQueryData(["exam-questions"], (current) => {
        const list = Array.isArray(current) ? [...current] : []

        const filtered = list.filter((item) => item.examId !== savedExam.examId)

        const restored = questions.map((question, index) => ({
          examQuestionId: `${savedExam.examId}-${question.questionId}`,
          examId: savedExam.examId,
          questionId: question.questionId,
          displayOrder: question.displayOrder ?? index + 1,
        }))

        return [...filtered, ...restored]
      })

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["exams"] }),
        queryClient.invalidateQueries({ queryKey: ["exam-questions"] }),
        queryClient.invalidateQueries({ queryKey: ["exam-types"] }),
        queryClient.invalidateQueries({
          queryKey: [
            "certification-publishing-requirements",
            certification.certificationId,
          ],
        }),
      ])

      await Promise.all([
        queryClient.refetchQueries({
          queryKey: ["exams"],
          type: "active",
        }),
        queryClient.refetchQueries({
          queryKey: ["exam-questions"],
          type: "active",
        }),
        queryClient.refetchQueries({
          queryKey: ["exam-types"],
          type: "active",
        }),
      ])

      toast.success(
          isEdit
              ? "Assessment updated successfully."
              : "Assessment created successfully."
      )

      onOpenChange(false)
    },

    onError: (error) => {
      const message =
          error?.response?.data?.message ??
          (isEdit
              ? "Unable to save changes. Please try again."
              : "Assessment could not be created.")

      setError(message)
      toast.error(message)
    },
  })

  const handleAssessmentDialogOpenChange = (nextOpen) => {
    if (!nextOpen && pickerOpen) {
      return
    }

    if (!nextOpen && saveMutation.isPending) {
      return
    }

    onOpenChange(nextOpen)
  }

  const handleCreateTypeChange = (nextType) => {
    const nextConfig = getCreateTypeConfig(nextType)

    setCreateType(nextType)
    setTargetId("")
    setSelectedQuestions([])
    setError("")

    setTitle(
        getDefaultTitle({
          createTypeConfig: nextConfig,
          selectedTarget: null,
          certification,
        })
    )
  }

  const handleTargetChange = (nextTargetId) => {
    const nextTarget = targetOptions.find((item) => item.id === nextTargetId)

    setTargetId(nextTargetId)
    setSelectedQuestions([])
    setError("")

    // The admin never has to type an assessment name. Changing the selected
    // lesson, middle category, or major category immediately regenerates it.
    if (!isEdit) {
      setTitle(
          getDefaultTitle({
            createTypeConfig,
            selectedTarget: nextTarget,
            certification,
          })
      )
    }
  }

  const handleAddQuestions = (questions) => {
    const newlyAddedIds = []

    setSelectedQuestions((current) => {
      const existingIds = new Set(
          current.map((question) => question.questionId)
      )

      const newQuestions = questions.filter(
          (question) => !existingIds.has(question.questionId)
      )

      newQuestions.forEach((question) => newlyAddedIds.push(question.questionId))

      return [...current, ...newQuestions]
    })


    setError("")
    setPickerOpen(false)
  }

  const handleSubmit = () => {
    if (!title.trim()) {
      setError("Enter a title for this assessment.")
      return
    }

    if (createTypeConfig.scope !== "CERTIFICATION" && !targetId) {
      setError(`Select a ${createTypeConfig.targetLabel.toLowerCase()}.`)
      return
    }

    /* Adaptive assessments draw from the whole scope bank; an assigned
       list is only an optional seed, so an empty one is fine. */
    if (selectedQuestions.length === 0 && !isAdaptiveType) {
      setError("Add at least one question.")
      return
    }

    if (
        passingScore &&
        (Number(passingScore) < 0 || Number(passingScore) > 100)
    ) {
      setError("Passing score must be between 0 and 100.")
      return
    }

    setError("")
    saveMutation.mutate()
  }

  const moveQuestion = (index, delta) => {
    setSelectedQuestions((current) => {
      const next = [...current]
      const target = index + delta

      if (target < 0 || target >= next.length) {
        return current
      }

      ;[next[index], next[target]] = [next[target], next[index]]

      return next
    })
  }

  const removeQuestion = (questionId) => {
    setSelectedQuestions((current) =>
        current.filter((item) => item.questionId !== questionId)
    )
  }

  const isAdaptiveType = ADAPTIVE_TYPES.has(createTypeConfig?.examTypeText)

  const canOpenQuestionPicker =
      createTypeConfig.scope === "CERTIFICATION" || Boolean(targetId)

  return (
      <Dialog open={open} onOpenChange={handleAssessmentDialogOpenChange}>
        <DialogContent
            onInteractOutside={(event) => {
              if (pickerOpen || saveMutation.isPending) {
                event.preventDefault()
              }
            }}
            onEscapeKeyDown={(event) => {
              if (pickerOpen || saveMutation.isPending) {
                event.preventDefault()
              }
            }}
            className="h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-none overflow-hidden rounded-2xl p-0 sm:h-[calc(100dvh-4rem)] sm:w-[80vw] sm:max-w-[80vw] md:w-[65vw] md:max-w-[65vw] lg:h-[min(700px,calc(100dvh-4rem))] lg:w-[55vw] lg:max-w-[55vw]"
        >
          <div className="flex h-full min-h-0 flex-col">
            <DialogHeader className="border-b px-6 py-5">
              <DialogTitle className="text-xl font-semibold">
                {isEdit ? "Edit Assessment" : `Create ${typeLabel}`}
              </DialogTitle>

              <DialogDescription className="text-sm text-muted-foreground">
                Certification: {certification?.title}
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-6">
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Assessment details
                  </h3>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="assessment-title">
                        Assessment Name
                        {!isEdit ? (
                            <span className="ml-1 text-xs font-normal text-muted-foreground">
                              (automatically generated)
                            </span>
                        ) : null}
                      </Label>

                      <Input
                          id="assessment-title"
                          value={title}
                          onChange={(event) => setTitle(event.target.value)}
                          placeholder="Assessment name"
                          readOnly={!isEdit}
                          className={!isEdit ? "bg-muted" : undefined}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Exam Type</Label>

                      <Select
                          value={createType}
                          onValueChange={handleCreateTypeChange}
                          disabled={isEdit || lockPreset}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select exam type" />
                        </SelectTrigger>

                        <SelectContent>
                          {ASSESSMENT_CREATE_TYPES.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {createTypeConfig.scope !== "CERTIFICATION" ? (
                        <div className="space-y-2">
                          <Label>Select {createTypeConfig.targetLabel}</Label>

                          <Select
                              value={targetId}
                              onValueChange={handleTargetChange}
                              disabled={isEdit || lockPreset}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue
                                  placeholder={`Choose ${createTypeConfig.targetLabel}`}
                              />
                            </SelectTrigger>

                            <SelectContent>
                              {targetOptions.length === 0 ? (
                                  <SelectItem value="none" disabled>
                                    No {createTypeConfig.targetLabel.toLowerCase()} available
                                  </SelectItem>
                              ) : (
                                  targetOptions.map((target) => (
                                      <SelectItem key={target.id} value={target.id}>
                                        {target.title}
                                        {target.subtitle ? ` — ${target.subtitle}` : ""}
                                      </SelectItem>
                                  ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                    ) : null}

                    <div className="space-y-2">
                      <Label htmlFor="assessment-duration">
                        Duration (minutes)
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                        (optional)
                      </span>
                      </Label>

                      <Input
                          id="assessment-duration"
                          type="number"
                          min="1"
                          value={durationMinutes}
                          onChange={(event) =>
                              setDurationMinutes(event.target.value)
                          }
                          placeholder="60"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assessment-passing">
                        Passing score (%)
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                        (optional)
                      </span>
                      </Label>

                      <Input
                          id="assessment-passing"
                          type="number"
                          min="0"
                          max="100"
                          value={passingScore}
                          onChange={(event) => setPassingScore(event.target.value)}
                          placeholder="70"
                      />
                    </div>

                    <div className="flex items-start gap-2.5 md:col-span-2">
                      <Checkbox
                          id="assessment-release-answers"
                          checked={releaseAnswersAfterSubmit}
                          onCheckedChange={(checked) =>
                              setReleaseAnswersAfterSubmit(Boolean(checked))
                          }
                          className="mt-0.5"
                      />

                      <Label
                          htmlFor="assessment-release-answers"
                          className="cursor-pointer text-sm font-normal"
                      >
                        Release correct answers and explanations to learners
                        after they submit
                        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                          Turn off to hide the answer key in attempt review —
                          useful for assessments learners can retake.
                        </span>
                      </Label>
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      {isAdaptiveType ? "Seed questions (optional)" : "Questions"} ({selectedQuestions.length} selected)
                    </h3>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!canOpenQuestionPicker) {
                            setError(
                                `Select a ${createTypeConfig.targetLabel.toLowerCase()} first.`
                            )
                            return
                          }

                          setPickerOpen(true)
                        }}
                    >
                      <Plus aria-hidden="true" />
                      Add Questions
                    </Button>
                  </div>
                  {isAdaptiveType ? (
                      <p className="text-xs leading-5 text-muted-foreground">
                        This assessment is adaptive: the engine picks each question from the whole
                        question bank in scope as the learner answers, so it needs no fixed list.
                        Questions added here are only a seed the engine may draw on first.
                      </p>
                  ) : null}

                  {selectedQuestions.length === 0 ? (
                      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                        No questions selected yet. Use Add Questions to pick from
                        this certification&apos;s question bank.
                      </div>
                  ) : (
                      <>
                        <ul className="space-y-2">
                          {selectedQuestions.map((question, index) => {
                            return (
                                <li
                                    key={question.questionId}
                                    className="flex items-center gap-3 rounded-xl border p-3"
                                >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                          {index + 1}
                        </span>

                                  <div className="min-w-0 flex-1">
                                    <p className="line-clamp-1 text-sm font-medium">
                                      {question.questionText}
                                    </p>

                                    <div className="mt-1 flex items-center gap-1.5">
                                      <Badge variant="secondary" className="text-[10px]">
                                        {question.questionType}
                                      </Badge>

                                      <Badge variant="outline" className="text-[10px]">
                                        {question.difficultyLevel}
                                      </Badge>
                                    </div>
                                  </div>

                                  <div className="flex shrink-0 items-center gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Move question up"
                                        disabled={index === 0}
                                        onClick={() => moveQuestion(index, -1)}
                                    >
                                      <ArrowUp />
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Move question down"
                                        disabled={index === selectedQuestions.length - 1}
                                        onClick={() => moveQuestion(index, 1)}
                                    >
                                      <ArrowDown />
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Remove question"
                                        onClick={() => removeQuestion(question.questionId)}
                                    >
                                      <Trash2 />
                                    </Button>
                                  </div>
                                </li>
                            )
                          })}
                        </ul>

                      </>
                  )}
                </section>

                <section className="space-y-2 rounded-xl bg-muted/40 p-4 text-sm">
                  <h3 className="font-semibold text-muted-foreground">Summary</h3>

                  <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Certification</dt>

                      <dd className="truncate font-medium">
                        {certification?.title}
                      </dd>
                    </div>

                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Type</dt>

                      <dd className="font-medium">{typeLabel}</dd>
                    </div>

                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Scope</dt>

                      <dd className="truncate font-medium">
                        {createTypeConfig.scope === "CERTIFICATION"
                            ? "Overall certification"
                            : selectedTarget?.title ?? "Not selected"}
                      </dd>
                    </div>

                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Questions</dt>

                      <dd className="font-medium">{selectedQuestions.length}</dd>
                    </div>


                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Duration</dt>

                      <dd className="font-medium">
                        {durationMinutes ? `${durationMinutes} min` : "No limit"}
                      </dd>
                    </div>

                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Passing score</dt>

                      <dd className="font-medium">
                        {passingScore ? `${passingScore}%` : "Not set"}
                      </dd>
                    </div>
                  </dl>
                </section>

                {error ? (
                    <p className="text-sm text-destructive" role="alert">
                      {error}
                    </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
              <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={saveMutation.isPending}
              >
                Cancel
              </Button>

              <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saveMutation.isPending}
              >
                {saveMutation.isPending
                    ? "Saving..."
                    : isEdit
                        ? "Save Changes"
                        : `Create ${typeLabel}`}
              </Button>
            </div>
          </div>

          <AssessmentQuestionPickerDialog
              open={pickerOpen}
              onOpenChange={setPickerOpen}
              certification={certification}
              alreadySelectedIds={alreadySelectedIds}
              currentExamId={exam?.examId ?? null}
              initialLessonId={createTypeConfig.scope === "LESSON" ? targetId : null}
              initialMiddleCategoryId={
                createTypeConfig.scope === "MIDDLE_CATEGORY" ? targetId : null
              }
              initialMajorCategoryId={
                createTypeConfig.scope === "MAJOR_CATEGORY" ? targetId : null
              }
              onAddQuestions={handleAddQuestions}
              ownerDepartmentId={ownerDepartmentId}
          />
        </DialogContent>
      </Dialog>
  )
}
