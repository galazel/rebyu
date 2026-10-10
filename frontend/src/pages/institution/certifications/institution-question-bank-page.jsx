import { useEffect, useMemo, useState } from "react"
import { Link, useOutletContext } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FileQuestionIcon, Loader2, Pencil, Plus, Search, Trash2, Upload } from "@/components/icons"
import { toast } from "sonner"

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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  InstitutionEmptyState,
  InstitutionLoadingSkeleton,
} from "@/components/institution/institution-ui.jsx"
import { useAuth } from "@/context/auth-context.jsx"
import { useInstitutionData } from "@/hooks/use-institution-data.js"
import { getAllCertifications } from "@/services/certificationService.js"
import {
  deleteQuestion,
  getDepartmentQuestions,
  getQuestionsByLesson,
  saveQuestion,
  updateQuestion,
} from "@/services/questionService.js"

const QUESTION_TYPES = [
  { value: "MCQ", label: "Multiple Choice" },
  { value: "SHORT_ANSWER", label: "Short Answer" },
  { value: "DESCRIPTIVE", label: "Descriptive" },
  { value: "CRITICAL_THINKING", label: "Critical Thinking" },
]

const DIFFICULTIES = [
  { value: "easy", label: "Easy" },
  { value: "average", label: "Average" },
  { value: "hard", label: "Hard" },
]

const ALL_LESSONS = "all"

/** Stored difficulties mix cases ("EASY", "average"); compare them lowercased. */
function difficultyKey(value) {
  return (value ?? "").toString().trim().toLowerCase()
}

function backendMessage(error, fallback) {
  return error?.response?.data?.message ?? fallback
}

function emptyChoice() {
  return { choiceText: "", correct: false, explanation: "" }
}

function QuestionFormDialog({
  open,
  onOpenChange,
  defaultLessonId,
  lessonOptions,
  editingQuestion,
  departmentId,
}) {
  const queryClient = useQueryClient()
  const isEditing = editingQuestion != null

  const [lessonId, setLessonId] = useState("")
  const [questionType, setQuestionType] = useState("MCQ")
  const [difficultyLevel, setDifficultyLevel] = useState("average")
  const [questionText, setQuestionText] = useState("")
  const [choices, setChoices] = useState([emptyChoice(), emptyChoice()])
  const [explanation, setExplanation] = useState("")
  const [error, setError] = useState("")

  const reset = () => {
    setLessonId("")
    setQuestionType("MCQ")
    setDifficultyLevel("average")
    setQuestionText("")
    setChoices([emptyChoice(), emptyChoice()])
    setExplanation("")
    setError("")
  }

  useEffect(() => {
    if (!open) return
    if (editingQuestion) {
      setLessonId(editingQuestion.lessonId != null ? String(editingQuestion.lessonId) : "")
      setQuestionType(editingQuestion.questionType ?? "MCQ")
      setDifficultyLevel(difficultyKey(editingQuestion.difficultyLevel) || "average")
      setQuestionText(editingQuestion.questionText ?? "")
      setChoices(
        editingQuestion.choices?.length
          ? editingQuestion.choices.map((c) => ({
              choiceId: c.choiceId,
              choiceText: c.choiceText ?? "",
              correct: Boolean(c.correct),
              imageKey: c.imageKey ?? null,
            }))
          : [emptyChoice(), emptyChoice()]
      )
      setExplanation(
        editingQuestion.choices?.find((c) => c.correct && c.explanation)?.explanation ?? ""
      )
    } else {
      setLessonId(defaultLessonId ? String(defaultLessonId) : "")
    }
     
  }, [editingQuestion, open])

  const saveMutation = useMutation({
    mutationFn: () => {
      const note = explanation.trim()
      const payload = {
        questionType,
        difficultyLevel: difficultyLevel.toUpperCase(),
        questionText: questionText.trim(),
        lessonId: Number(lessonId),
        choices:
          questionType === "MCQ"
            ? choices
                .filter((c) => c.choiceText.trim())
                .map((c) => ({
                  ...(c.choiceId != null ? { choiceId: c.choiceId } : {}),
                  choiceText: c.choiceText.trim(),
                  correct: c.correct,
                  imageKey: c.imageKey ?? null,
                  explanation: c.correct && note ? note : null,
                }))
            : [],
      }
      return isEditing
        ? updateQuestion(editingQuestion.questionId, payload)
        : saveQuestion(payload, departmentId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institution-questions"] })
      toast.success(isEditing ? "Question updated." : "Question added.")
      reset()
      onOpenChange(false)
    },
    onError: (err) => {
      const message = backendMessage(err, "Unable to save this question.")
      setError(message)
      toast.error(message)
    },
  })

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!lessonId) {
      setError("Choose the lesson this question belongs to.")
      return
    }
    if (!questionText.trim()) {
      setError("Enter the question text.")
      return
    }
    if (questionType === "MCQ") {
      const filled = choices.filter((c) => c.choiceText.trim())
      if (filled.length < 2) {
        setError("Add at least two answer choices.")
        return
      }
      if (!filled.some((c) => c.correct)) {
        setError("Mark at least one choice as correct.")
        return
      }
    }
    saveMutation.mutate()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit question" : "Add question"}</DialogTitle>
          <DialogDescription>
            {departmentId
              ? "Only your department's learners and assessments see this question."
              : "This question is added to your institution's copy of the question bank."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Lesson</Label>
            <Select value={lessonId} onValueChange={setLessonId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a lesson" />
              </SelectTrigger>
              <SelectContent>
                {lessonOptions.map((lesson) => (
                  <SelectItem key={lesson.lessonId} value={String(lesson.lessonId)}>
                    {lesson.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Question type</Label>
              <Select value={questionType} onValueChange={setQuestionType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="question-text">Question</Label>
            <Textarea
              id="question-text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={3}
              placeholder="What does..."
            />
          </div>

          {questionType === "MCQ" ? (
            <div className="space-y-2">
              <Label>Answer choices</Label>
              {choices.map((choice, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Checkbox
                    checked={choice.correct}
                    onCheckedChange={(checked) =>
                      setChoices((current) =>
                        current.map((c, i) =>
                          i === index ? { ...c, correct: Boolean(checked) } : c
                        )
                      )
                    }
                    className="mt-2.5"
                    aria-label="Correct answer"
                  />
                  <Input
                    value={choice.choiceText}
                    onChange={(e) =>
                      setChoices((current) =>
                        current.map((c, i) =>
                          i === index ? { ...c, choiceText: e.target.value } : c
                        )
                      )
                    }
                    placeholder={`Choice ${index + 1}`}
                  />
                  {choices.length > 2 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setChoices((current) => current.filter((_, i) => i !== index))
                      }
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              ))}
              {choices.length < 6 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setChoices((current) => [...current, emptyChoice()])}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Add choice
                </Button>
              ) : null}
              <p className="text-xs text-muted-foreground">Tick the correct answer.</p>
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="question-explanation">Explanation</Label>
                <Textarea
                  id="question-explanation"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  rows={2}
                  placeholder="Why the correct answer is right. Learners see this after submitting."
                />
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                onOpenChange(false)
              }}
              disabled={saveMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Saving...
                </>
              ) : isEditing ? (
                "Save changes"
              ) : (
                "Add question"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function InstitutionQuestionBankPanel({
  certificationId = null,
  initialCertificationId = "",
  initialLessonId = "",
  autoOpenAdd = false,
  departmentId,
}) {
  const { institution } = useOutletContext()
  const { user } = useAuth()
  const institutionId = institution?.institutionId
  const data = useInstitutionData(institutionId)

  const lockedCertId = certificationId ? String(certificationId) : ""
  const isLockedToCertification = Boolean(lockedCertId)
  const startingCertId =
    lockedCertId || (initialCertificationId ? String(initialCertificationId) : "")

  const [selectedCertId, setSelectedCertId] = useState(startingCertId)
  const [selectedLessonId, setSelectedLessonId] = useState(
    initialLessonId ? String(initialLessonId) : departmentId ? ALL_LESSONS : ""
  )
  const [sourceFilter, setSourceFilter] = useState("all")
  const [formOpen, setFormOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (startingCertId) {
      setSelectedCertId(startingCertId)
    }
    if (initialLessonId) {
      setSelectedLessonId(String(initialLessonId))
    }
    if (autoOpenAdd && initialLessonId) {
      setEditingQuestion(null)
      setFormOpen(true)
    }
     
  }, [startingCertId, initialLessonId, autoOpenAdd])

  const certificationsQuery = useQuery({
    queryKey: ["certifications", "summary"],
    queryFn: () => getAllCertifications(undefined, { summary: true }),
    staleTime: 5 * 60 * 1000,
  })

  const accessibleCertifications = useMemo(() => {
    const certById = new Map(
      (certificationsQuery.data ?? []).map((c) => [c.certificationId, c])
    )
    return data.institutionCerts
      .map((institutionCert) => certById.get(institutionCert.certificationId))
      .filter(Boolean)
  }, [certificationsQuery.data, data.institutionCerts])

  const lessonOptions = useMemo(() => {
    const cert = accessibleCertifications.find(
      (c) => String(c.certificationId) === selectedCertId
    )
    if (!cert) return []
    const options = []
    for (const major of cert.majorCategory ?? []) {
      for (const middle of major.middleCategory ?? []) {
        for (const lesson of middle.lessons ?? []) {
          options.push({
            lessonId: lesson.lessonId,
            label: `${major.title} / ${middle.title} / ${lesson.name}`,
          })
        }
      }
    }
    return options
  }, [accessibleCertifications, selectedCertId])

  const showingAllLessons = selectedLessonId === ALL_LESSONS
  const departmentIdNumber = departmentId != null ? Number(departmentId) : null

  const questionsQuery = useQuery({
    queryKey: ["institution-questions", selectedLessonId, departmentId ?? null],
    queryFn: () =>
      showingAllLessons
        ? getDepartmentQuestions(departmentId)
        : getQuestionsByLesson(selectedLessonId, departmentId),
    enabled: !!selectedLessonId && (!showingAllLessons || departmentId != null),
    staleTime: 30_000,
  })

  const questions = Array.isArray(questionsQuery.data) ? questionsQuery.data : []
  const isOurs = (question) =>
    (departmentIdNumber != null && question.ownerDepartmentId === departmentIdNumber) ||
    question.createdByUserId === user?.userId
  const lessonLabelById = useMemo(
    () => new Map(lessonOptions.map((lesson) => [lesson.lessonId, lesson.label])),
    [lessonOptions]
  )
  const ourCount = questions.filter(isOurs).length

  const visibleQuestions = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return questions.filter((question) => {
      if (typeFilter !== "all" && question.questionType !== typeFilter) return false
      if (difficultyFilter !== "all" && difficultyKey(question.difficultyLevel) !== difficultyFilter) {
        return false
      }
      if (sourceFilter === "ours" && !isOurs(question)) return false
      if (sourceFilter === "official" && question.ownerDepartmentId != null) return false
      if (!needle) return true
      const haystack = [
        question.questionText,
        ...(question.choices ?? []).map((choice) => choice.choiceText),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return haystack.includes(needle)
    })
     
  }, [questions, search, typeFilter, difficultyFilter, sourceFilter])

  const deleteMutation = useMutation({
    mutationFn: (questionId) => deleteQuestion(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institution-questions"] })
      toast.success("Question deleted.")
      setDeleteTarget(null)
    },
    onError: (err) => {
      toast.error(backendMessage(err, "Unable to delete this question."))
      setDeleteTarget(null)
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-background p-3">
        {isLockedToCertification ? null : (
          <div className="min-w-52 flex-1 space-y-1.5">
            <Label>Certification</Label>
            <Select
              value={selectedCertId}
              onValueChange={(value) => {
                setSelectedCertId(value)
                setSelectedLessonId("")
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a certification" />
              </SelectTrigger>
              <SelectContent>
                {accessibleCertifications.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No certification access yet
                  </SelectItem>
                ) : (
                  accessibleCertifications.map((cert) => (
                    <SelectItem key={cert.certificationId} value={String(cert.certificationId)}>
                      {cert.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="min-w-64 flex-1 space-y-1.5">
          <Label>Lesson</Label>
          <Select
            value={selectedLessonId}
            onValueChange={(value) => {
              setSelectedLessonId(value)
              setSourceFilter("all")
            }}
            disabled={!selectedCertId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a lesson" />
            </SelectTrigger>
            <SelectContent>
              {departmentId != null ? (
                <SelectItem value={ALL_LESSONS}>All lessons — our questions</SelectItem>
              ) : null}
              {lessonOptions.length === 0 ? (
                <SelectItem value="none" disabled>
                  No lessons available
                </SelectItem>
              ) : (
                lessonOptions.map((lesson) => (
                  <SelectItem key={lesson.lessonId} value={String(lesson.lessonId)}>
                    {lesson.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {selectedLessonId ? (
          <>
            <div className="min-w-48 flex-1 space-y-1.5">
              <Label htmlFor="qb-search">Search</Label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="qb-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Question or choice text"
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-40 space-y-1.5">
              <Label>Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {QUESTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {departmentId != null && !showingAllLessons ? (
              <div className="w-36 space-y-1.5">
                <Label>Source</Label>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="ours">Ours</SelectItem>
                    <SelectItem value="official">Official</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="w-36 space-y-1.5">
              <Label>Difficulty</Label>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  {DIFFICULTIES.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => {
                setEditingQuestion(null)
                setFormOpen(true)
              }}
            >
              <Plus className="size-4" aria-hidden="true" />
              Add question
            </Button>
            {departmentId != null ? (
              <Button asChild variant="outline">
                <Link to={`/institution/departments/${departmentId}/question-bank/import`}>
                  <Upload className="size-4" aria-hidden="true" />
                  Import from PDF/Word
                </Link>
              </Button>
            ) : null}
          </>
        ) : null}
      </div>

      {!selectedLessonId ? (
        <InstitutionEmptyState
          icon={FileQuestionIcon}
          title={
            isLockedToCertification ? "Select a lesson" : "Select a certification and lesson"
          }
          description="Questions are added within a specific lesson."
        />
      ) : (
        <>
          {questionsQuery.isLoading ? (
            <InstitutionLoadingSkeleton rows={3} />
          ) : questionsQuery.isError ? (
            <InstitutionEmptyState
              icon={FileQuestionIcon}
              title="Questions could not be loaded"
              description="Try again in a moment."
            />
          ) : questions.length === 0 ? (
            <InstitutionEmptyState
              icon={FileQuestionIcon}
              title={showingAllLessons ? "Your department has no questions yet" : "No questions yet"}
              description={
                showingAllLessons
                  ? "Add questions to any lesson; they appear here and in your assessment builder."
                  : "Add the first question for this lesson."
              }
            />
          ) : visibleQuestions.length === 0 ? (
            <InstitutionEmptyState
              icon={FileQuestionIcon}
              title="Nothing matches those filters"
              description="Clear the search or widen the type and difficulty."
            />
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Showing {visibleQuestions.length} of {questions.length} question
                {questions.length === 1 ? "" : "s"}
                {departmentId != null && !showingAllLessons ? ` · ${ourCount} written by your department` : ""}
              </p>
              <div className="overflow-x-auto rounded-xl border border-border bg-background">
                <Table>
                  <TableHeader className="text-xs">
                    <TableRow className="bg-muted/50">
                      <TableHead className="h-9 py-2">Question</TableHead>
                      <TableHead className="h-9 w-36 py-2">Type</TableHead>
                      <TableHead className="h-9 w-28 py-2">Difficulty</TableHead>
                      <TableHead className="h-9 w-48 py-2">Source</TableHead>
                      <TableHead className="h-9 w-0 py-2 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-[13px]">
                    {visibleQuestions.map((question) => {
                      const isMine = isOurs(question)
                      const correct = (question.choices ?? []).find((choice) => choice.correct)
                      return (
                        <TableRow key={question.questionId} className="align-top">
                          <TableCell className="min-w-72 whitespace-normal break-words py-2.5">
                            <p className="font-medium text-foreground">{question.questionText}</p>
                            {showingAllLessons && lessonLabelById.get(question.lessonId) ? (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {lessonLabelById.get(question.lessonId)}
                              </p>
                            ) : null}
                            {correct ? (
                              <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                                &#10003; {correct.choiceText}
                              </p>
                            ) : null}
                          </TableCell>
                          <TableCell className="py-2.5 text-muted-foreground">
                            {QUESTION_TYPES.find((t) => t.value === question.questionType)?.label ??
                              question.questionType}
                          </TableCell>
                          <TableCell className="py-2.5">
                            <Badge variant="outline">
                              {DIFFICULTIES.find((d) => d.value === difficultyKey(question.difficultyLevel))
                                ?.label ?? question.difficultyLevel}
                            </Badge>
                          </TableCell>
                          <TableCell className="w-48 max-w-48 py-2.5 text-xs text-muted-foreground">
                            {question.ownerDepartmentId != null ? (
                              <>
                                <span className="block truncate font-medium text-foreground">
                                  {question.ownerDepartmentName ?? "Department"}
                                </span>
                                {question.createdByEmail ? (
                                  <span className="block truncate">added by {question.createdByEmail}</span>
                                ) : null}
                              </>
                            ) : (
                              "Official"
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap py-2.5 text-right">
                            {isMine ? (
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label="Edit question"
                                  onClick={() => {
                                    setEditingQuestion(question)
                                    setFormOpen(true)
                                  }}
                                >
                                  <Pencil className="size-4" aria-hidden="true" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label="Delete question"
                                  onClick={() => setDeleteTarget(question)}
                                >
                                  <Trash2 className="size-4" aria-hidden="true" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Read only</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}

      <QuestionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultLessonId={showingAllLessons ? "" : selectedLessonId}
        lessonOptions={lessonOptions}
        editingQuestion={editingQuestion}
        departmentId={departmentId}
      />

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this question?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Questions already used in a published exam can't be
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                deleteMutation.mutate(deleteTarget.questionId)
              }}
              disabled={deleteMutation.isPending}
              variant="destructive"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete question"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
