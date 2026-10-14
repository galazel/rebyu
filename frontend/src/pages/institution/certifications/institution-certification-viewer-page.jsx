import { useMemo, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Search,
  X
} from "@/components/icons"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  InstitutionErrorState,
  InstitutionLoadingSkeleton,
} from "@/components/institution/institution-ui.jsx"
import { LessonContent } from "@/components/certifications/lesson-content-renderer.jsx"
import { getCertificationSummary } from "@/services/certificationService.js"
import { getLessonComponent } from "@/services/lessonService.js"

function lessonTitle(lesson) {
  return lesson?.name ?? lesson?.title ?? "Untitled lesson"
}

function flattenLessons(certification) {
  const out = []
  for (const major of certification?.majorCategory ?? []) {
    for (const middle of major.middleCategory ?? []) {
      for (const lesson of middle.lessons ?? []) {
        out.push({ ...lesson, middleTitle: middle.title, majorTitle: major.title })
      }
    }
  }
  return out
}

const OUTLINE_EXAM_LABEL = {
  LESSON_QUIZ: "Quick check",
  MIDDLE_EXAM: "Module exam",
  MODULE_EXAM: "Module exam",
  MAJOR_EXAM: "Major exam",
  MOCK_EXAM: "Mock exam",
  DIAGNOSTIC: "Diagnostic",
}

/** Published review assessments only; challenge arenas are not part of the curriculum. */
function curriculumExams(list) {
  return (list ?? []).filter(
    (exam) => exam && exam.status === "PUBLISHED" && OUTLINE_EXAM_LABEL[exam.examType]
  )
}

/** A read-only assessment line in the outline, as in the learner's view. */
function OutlineExam({ exam, nested = false }) {
  const quick = exam.examType === "LESSON_QUIZ"
  const Icon = quick ? CircleHelp : ClipboardCheck
  return (
    <div
      className={`flex items-center gap-2 rounded-md py-1.5 text-xs font-medium text-muted-foreground ${
        nested ? "pl-7 pr-2" : "px-2"
      }`}
      title={exam.title}
    >
      <span
        className={`grid size-5 shrink-0 place-items-center rounded-full ${
          quick ? "bg-sky-500/10 text-sky-700 dark:text-sky-300" : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
        }`}
      >
        <Icon className="size-3" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 truncate">
        {quick ? OUTLINE_EXAM_LABEL[exam.examType] : exam.title}
        {exam.totalQuestions ? ` · ${exam.totalQuestions} questions` : ""}
      </span>
      {!quick ? (
        <span className="shrink-0 text-[10px] uppercase tracking-wide">{OUTLINE_EXAM_LABEL[exam.examType]}</span>
      ) : null}
    </div>
  )
}

function percent(value) {
  return value == null ? "—" : `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 })}%`
}

const TYPE_LABEL = {
  LESSON_QUIZ: "Lesson quiz",
  MIDDLE_EXAM: "Module exam",
  MODULE_EXAM: "Module exam",
  MAJOR_EXAM: "Major exam",
  MOCK_EXAM: "Mock exam",
  DIAGNOSTIC: "Diagnostic",
}

/** Attempts, learners, average score and pass rate for a list of assessments. */
function AssessmentStatsTable({ assessments, enrolled }) {
  if (assessments.length === 0) {
    return <p className="text-sm text-muted-foreground">None of your learners has taken these yet.</p>
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Assessment</th>
            <th className="px-3 py-2 text-right font-medium">Learners</th>
            <th className="px-3 py-2 text-right font-medium">Attempts</th>
            <th className="px-3 py-2 text-right font-medium">Avg score</th>
            <th className="px-3 py-2 text-right font-medium">Pass rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {assessments.map((exam) => (
            <tr key={exam.examId}>
              <td className="px-3 py-2">
                <p className="font-medium text-foreground">{exam.title}</p>
                <p className="text-xs text-muted-foreground">{TYPE_LABEL[exam.examType] ?? exam.examType}</p>
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {exam.learners}
                {enrolled ? <span className="text-muted-foreground"> / {enrolled}</span> : null}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{exam.attempts}</td>
              <td className="px-3 py-2 text-right tabular-nums">{percent(exam.averageScore)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{percent(exam.passRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function InstitutionCertificationViewerPage() {
  const { certificationId } = useParams()
  const [searchParams] = useSearchParams()
  const departmentId = searchParams.get("departmentId") ? Number(searchParams.get("departmentId")) : undefined
  return (
    <CertificationViewer
      certificationId={Number(certificationId)}
      departmentId={departmentId}
      initialLessonId={searchParams.get("lessonId") ? Number(searchParams.get("lessonId")) : null}
    />
  )
}

/**
 * Course outline beside the open lesson. With `analytics` (the institution's own learners in
 * this certification) the outline shows each lesson's completion and the lesson shows its
 * quiz results; an "All assessments" view lists every assessment's results.
 */
export function CertificationViewer({ certificationId, departmentId, initialLessonId = null, analytics = null, embedded = false }) {
  const certId = Number(certificationId)

  const [outlineQuery, setOutlineQuery] = useState("")
  const [collapsedMajors, setCollapsedMajors] = useState(() => new Set())
  const [activeLessonId, setActiveLessonId] = useState(initialLessonId)
  const [showAssessments, setShowAssessments] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const certificationsQuery = useQuery({
    // Structure only; each lesson's content is fetched when it is opened.
    queryKey: ["certifications", "group", departmentId ?? null, "summary", certId],
    queryFn: () => getCertificationSummary(certId, departmentId),
    enabled: Number.isFinite(certId),
    staleTime: 5 * 60_000,
  })

  const certification = (certificationsQuery.data ?? []).find(
    (item) => item.certificationId === certId
  )

  const allLessons = useMemo(() => flattenLessons(certification), [certification])

  const activeLesson =
    allLessons.find((lesson) => lesson.lessonId === activeLessonId) ?? allLessons[0] ?? null

  const enrolled = analytics?.summary?.enrolled ?? 0
  const completedByLesson = useMemo(
    () => new Map((analytics?.lessons ?? []).map((row) => [row.lessonId, row.completed])),
    [analytics]
  )
  const assessments = analytics?.assessments ?? []

  const lessonQuery = useQuery({
    queryKey: ["lesson-component", activeLesson?.lessonId],
    queryFn: () => getLessonComponent(activeLesson.lessonId),
    enabled: Number.isFinite(activeLesson?.lessonId),
  })

  const toggleMajor = (id) =>
    setCollapsedMajors((current) => {
      const next = new Set(current)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  if (certificationsQuery.isLoading) {
    return <InstitutionLoadingSkeleton />
  }
  if (certificationsQuery.isError) {
    return (
      <InstitutionErrorState
        title="Unable to load this certification"
        onRetry={certificationsQuery.refetch}
      />
    )
  }

  const query = outlineQuery.trim().toLowerCase()
  const majors = certification?.majorCategory ?? []

  return (
    <div className={`flex flex-col ${embedded ? "h-[calc(100vh-8rem)] rounded-xl border border-border" : "h-[calc(100vh-4rem)]"}`}>
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="xl:hidden"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label="Toggle outline"
        >
          {sidebarOpen ? <X className="size-5" /> : <BookOpen className="size-5" />}
        </Button>
        <h1 className="truncate font-heading text-base font-bold text-foreground">
          {embedded ? "Curriculum" : certification?.title ?? "Certification"}
        </h1>
      </div>

      <div className="flex min-h-0 flex-1">
        {sidebarOpen ? (
          <aside className="flex w-full max-w-xs shrink-0 flex-col border-r border-border bg-muted/20">
            <div className="border-b border-border p-3">
              <p className="px-1 pb-2 text-sm font-semibold text-foreground">Course Outline</p>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={outlineQuery}
                  onChange={(e) => setOutlineQuery(e.target.value)}
                  placeholder="Search course outline"
                  className="pl-9"
                />
              </div>
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto p-2">
              {analytics ? (
                <button
                  type="button"
                  onClick={() => setShowAssessments(true)}
                  className={`mb-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-semibold transition ${
                    showAssessments ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                  }`}
                >
                  <BarChart3 className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">All assessments</span>
                  <span className="text-xs font-normal text-muted-foreground">{assessments.length}</span>
                </button>
              ) : null}
              {!query && curriculumExams(certification?.exams).length > 0 ? (
                <div className="mb-2 border-b border-border pb-2">
                  {curriculumExams(certification?.exams).map((exam) => (
                    <OutlineExam key={exam.examId} exam={exam} />
                  ))}
                </div>
              ) : null}
              {majors.map((major, majorIndex) => {
                const middles = major.middleCategory ?? []
                const majorLessons = middles.flatMap((m) => m.lessons ?? [])
                const majorOpen = !collapsedMajors.has(major.majorCategoryId)

                const matchingLessons = majorLessons.filter((lesson) =>
                  lessonTitle(lesson).toLowerCase().includes(query)
                )
                if (query && matchingLessons.length === 0) {
                  return null
                }

                return (
                  <div key={major.majorCategoryId ?? majorIndex} className="mb-1">
                    <button
                      type="button"
                      onClick={() => toggleMajor(major.majorCategoryId)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-semibold text-foreground hover:bg-muted"
                    >
                      {majorOpen || query ? (
                        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="min-w-0 flex-1 truncate">
                        Module {majorIndex + 1}: {major.title}
                      </span>
                    </button>

                    {majorOpen || query ? (
                      <div className="ml-3 border-l border-border pl-2">
                        {middles.map((middle) => {
                          const lessons = (middle.lessons ?? []).filter(
                            (lesson) => !query || lessonTitle(lesson).toLowerCase().includes(query)
                          )
                          if (lessons.length === 0) {
                            return null
                          }
                          return (
                            <div key={middle.middleCategoryId} className="py-1">
                              <p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
                                {middle.title}
                              </p>
                              {lessons.map((lesson) => {
                                const isActive = !showAssessments && activeLesson?.lessonId === lesson.lessonId
                                return (
                                  <button
                                    key={lesson.lessonId}
                                    type="button"
                                    onClick={() => {
                                      setActiveLessonId(lesson.lessonId)
                                      setShowAssessments(false)
                                    }}
                                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition ${
                                      isActive
                                        ? "bg-primary/10 font-medium text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    }`}
                                  >
                                    <BookOpen className="size-3.5 shrink-0" />
                                    <span className="min-w-0 flex-1 truncate">
                                      {lessonTitle(lesson)}
                                    </span>
                                    {analytics ? (
                                      <span
                                        className="shrink-0 text-xs tabular-nums text-muted-foreground"
                                        title={`${completedByLesson.get(lesson.lessonId) ?? 0} of ${enrolled} learners completed this lesson`}
                                      >
                                        {completedByLesson.get(lesson.lessonId) ?? 0}/{enrolled}
                                      </span>
                                    ) : null}
                                  </button>
                                )
                              }).flatMap((row, index) => {
                                const lesson = lessons[index]
                                return [
                                  row,
                                  ...(query
                                    ? []
                                    : curriculumExams(lesson.exams).map((exam) => (
                                        <OutlineExam key={`q-${exam.examId}`} exam={exam} nested />
                                      ))),
                                ]
                              })}
                              {!query
                                ? curriculumExams(middle.exams).map((exam) => (
                                    <OutlineExam key={exam.examId} exam={exam} />
                                  ))
                                : null}
                            </div>
                          )
                        })}
                        {!query
                          ? curriculumExams(major.exams).map((exam) => (
                              <OutlineExam key={exam.examId} exam={exam} />
                            ))
                          : null}
                      </div>
                    ) : null}
                  </div>
                )
              })}

              {majors.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                  No curriculum available yet.
                </p>
              ) : null}
            </nav>
          </aside>
        ) : null}

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-6 py-8">
            {analytics && showAssessments ? (
              <>
                <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">All assessments</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  How your {enrolled} learner{enrolled === 1 ? "" : "s"} did on every assessment in this certification.
                </p>
                <div className="mt-5">
                  <AssessmentStatsTable assessments={assessments} enrolled={enrolled} />
                </div>
              </>
            ) : activeLesson ? (
              <>
                <p className="text-sm font-medium text-primary">{activeLesson.middleTitle}</p>
                <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight text-foreground">
                  {lessonTitle(activeLesson)}
                </h2>
                {analytics ? (
                  <section className="mt-4 space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">Your learners on this lesson</p>
                      <p className="text-sm tabular-nums text-muted-foreground">
                        {completedByLesson.get(activeLesson.lessonId) ?? 0} of {enrolled} completed
                      </p>
                    </div>
                    <AssessmentStatsTable
                      assessments={assessments.filter((exam) => exam.lessonId === activeLesson.lessonId)}
                      enrolled={enrolled}
                    />
                  </section>
                ) : null}
                <div className="mt-6">
                  {lessonQuery.isLoading ? (
                    <InstitutionLoadingSkeleton rows={4} />
                  ) : lessonQuery.isError ? (
                    <InstitutionErrorState
                      title="Unable to load this lesson"
                      onRetry={lessonQuery.refetch}
                    />
                  ) : (
                    <LessonContent structure={lessonQuery.data?.lessonComponentStructure} />
                  )}
                  {!lessonQuery.isLoading &&
                  !lessonQuery.isError &&
                  !lessonQuery.data?.lessonComponentStructure ? (
                    <p className="text-sm text-muted-foreground">
                      This lesson has no content yet.
                    </p>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center py-24 text-center">
                <BookOpen className="size-10 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium text-foreground">Select a lesson</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose a lesson from the outline to start reading.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
