import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"

import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Eye,
  Search,
} from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  InstitutionErrorState,
  InstitutionLoadingSkeleton,
} from "@/components/institution/institution-ui.jsx"
import { ExportButton } from "@/components/commons/export-button.jsx"
import { LessonContent } from "@/components/certifications/lesson-content-renderer.jsx"
import { getCertificationSummary } from "@/services/certificationService.js"
import { getCertificationAnalytics } from "@/services/institutionService.js"
import { getLessonComponent } from "@/services/lessonService.js"
import { cn } from "@/lib/utils"

const EXAM_LABEL = {
  LESSON_QUIZ: "Quick check",
  MIDDLE_EXAM: "Topic exam",
  MODULE_EXAM: "Module exam",
  MAJOR_EXAM: "Major exam",
  MOCK_EXAM: "Mock exam",
  DIAGNOSTIC: "Diagnostic",
}

/** Published review assessments only; challenge arenas are not part of the curriculum. */
function published(list) {
  return (list ?? []).filter((exam) => exam && exam.status === "PUBLISHED" && EXAM_LABEL[exam.examType])
}

function lessonTitle(lesson) {
  return lesson?.name ?? lesson?.title ?? "Untitled lesson"
}

function questions(exams) {
  return exams.reduce((sum, exam) => sum + Number(exam.totalQuestions ?? 0), 0)
}

function pct(value) {
  return value == null ? "—" : `${Math.round(Number(value))}%`
}

/** Counts for one module (or the whole certification when given every module). */
function tally(majors) {
  let topics = 0
  let lessons = 0
  let quickChecks = 0
  let exams = 0
  let questionCount = 0
  for (const major of majors) {
    const majorExams = published(major.exams)
    exams += majorExams.length
    questionCount += questions(majorExams)
    for (const middle of major.middleCategory ?? []) {
      topics += 1
      const middleExams = published(middle.exams)
      exams += middleExams.length
      questionCount += questions(middleExams)
      for (const lesson of middle.lessons ?? []) {
        lessons += 1
        const lessonExams = published(lesson.exams)
        quickChecks += lessonExams.filter((e) => e.examType === "LESSON_QUIZ").length
        exams += lessonExams.filter((e) => e.examType !== "LESSON_QUIZ").length
        questionCount += questions(lessonExams)
      }
    }
  }
  return { topics, lessons, quickChecks, exams, questions: questionCount }
}

function StatTile({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card px-4 py-3 shadow-xs">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums text-foreground">{value}</p>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function ExamChip({ exam, stat }) {
  const quick = exam.examType === "LESSON_QUIZ"
  const Icon = quick ? CircleHelp : ClipboardCheck
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium",
        quick
          ? "border-primary/25 bg-primary/5 text-primary"
          : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
      )}
      title={exam.title}
    >
      <Icon className="size-3" aria-hidden="true" />
      {quick ? EXAM_LABEL[exam.examType] : exam.title}
      {exam.totalQuestions ? <span className="opacity-70">· {exam.totalQuestions}q</span> : null}
      {stat && stat.attempts > 0 ? <span className="opacity-70">· {pct(stat.passRate)} pass</span> : null}
    </span>
  )
}

/** One lesson's content and its class numbers, beside the outline. */
function LessonDetailsSheet({ lesson, enrolled, completed, quiz, quizStat, onOpenChange }) {
  const lessonQuery = useQuery({
    queryKey: ["lesson-component", lesson?.lessonId],
    queryFn: () => getLessonComponent(lesson.lessonId),
    enabled: Number.isFinite(lesson?.lessonId),
  })
  return (
    <Sheet open={lesson != null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        {lesson ? (
          <>
            <SheetHeader className="space-y-1 border-b border-border/60 pb-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                {lesson.majorTitle} · {lesson.middleTitle}
              </p>
              <SheetTitle className="text-xl">{lessonTitle(lesson)}</SheetTitle>
              <SheetDescription>Lesson details and how your learners are doing on it.</SheetDescription>
            </SheetHeader>

            <div className="grid grid-cols-3 gap-2 px-4">
              <StatTile
                label="Completed"
                value={enrolled ? `${completed}/${enrolled}` : "—"}
                hint={enrolled ? `${Math.round((completed / enrolled) * 100)}% of learners` : "No learners yet"}
              />
              <StatTile label="Quick check" value={quiz ? `${quiz.totalQuestions ?? 0}q` : "None"} hint={quiz ? "questions" : null} />
              <StatTile
                label="Quiz pass rate"
                value={quizStat?.attempts ? pct(quizStat.passRate) : "—"}
                hint={quizStat?.attempts ? `${quizStat.attempts} attempts · avg ${pct(quizStat.averageScore)}` : "Not taken yet"}
              />
            </div>

            <div className="px-4 pb-8">
              {lessonQuery.isLoading ? (
                <InstitutionLoadingSkeleton rows={4} />
              ) : lessonQuery.isError ? (
                <InstitutionErrorState title="Unable to load this lesson" onRetry={lessonQuery.refetch} />
              ) : lessonQuery.data?.lessonComponentStructure ? (
                <LessonContent structure={lessonQuery.data.lessonComponentStructure} />
              ) : (
                <p className="text-sm text-muted-foreground">This lesson has no content yet.</p>
              )}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

/**
 * The curriculum as a head reads it: a summary of what is in the certification,
 * each module's size and how far learners have got, and a lesson's full content
 * one click away ("View details") instead of on the page.
 */
export function CurriculumOverview({ certificationId, departmentId }) {
  const certId = Number(certificationId)
  const [search, setSearch] = useState("")
  const [openMajors, setOpenMajors] = useState(() => new Set())
  const [detailLesson, setDetailLesson] = useState(null)

  const outlineQuery = useQuery({
    queryKey: ["certifications", "group", departmentId ?? null, "summary", certId],
    queryFn: () => getCertificationSummary(certId, departmentId),
    enabled: Number.isFinite(certId),
    staleTime: 5 * 60_000,
  })
  const analyticsQuery = useQuery({
    queryKey: ["certification-analytics", certId],
    queryFn: () => getCertificationAnalytics(certId),
    enabled: Number.isFinite(certId),
    staleTime: 60_000,
    retry: 1,
  })

  const certification = (outlineQuery.data ?? []).find((item) => item.certificationId === certId)
  const majors = useMemo(() => certification?.majorCategory ?? [], [certification])
  const analytics = analyticsQuery.data
  const enrolled = analytics?.summary?.enrolled ?? 0
  const completedByLesson = useMemo(
    () => new Map((analytics?.lessons ?? []).map((row) => [row.lessonId, row.completed])),
    [analytics]
  )
  const statByExam = useMemo(
    () => new Map((analytics?.assessments ?? []).map((row) => [row.examId, row])),
    [analytics]
  )
  const totals = useMemo(() => tally(majors), [majors])
  const certExams = published(certification?.exams)

  const lessonCompletion = (lessons) => {
    if (!enrolled || lessons.length === 0) return null
    const done = lessons.reduce((sum, lesson) => sum + (completedByLesson.get(lesson.lessonId) ?? 0), 0)
    return (done / (lessons.length * enrolled)) * 100
  }
  const allLessons = majors.flatMap((major) => (major.middleCategory ?? []).flatMap((m) => m.lessons ?? []))
  const overallCompletion = lessonCompletion(allLessons)

  const query = search.trim().toLowerCase()
  const toggle = (id) =>
    setOpenMajors((current) => {
      const next = new Set(current)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  if (outlineQuery.isLoading) return <InstitutionLoadingSkeleton />
  if (outlineQuery.isError) {
    return <InstitutionErrorState title="Unable to load the curriculum" onRetry={outlineQuery.refetch} />
  }
  if (!certification) {
    return <p className="text-sm text-muted-foreground">Choose a certification to see its curriculum.</p>
  }

  const csv = () => [
    {
      title: "Summary",
      columns: ["Metric", "Value"],
      rows: [
        ["Modules", majors.length],
        ["Topics", totals.topics],
        ["Lessons", totals.lessons],
        ["Quick checks", totals.quickChecks],
        ["Exams", totals.exams + certExams.length],
        ["Questions in all assessments", totals.questions + questions(certExams)],
        ["Learners on the certification", enrolled],
        ["Lessons finished on average (%)", overallCompletion == null ? null : Math.round(overallCompletion)],
      ],
    },
    {
      title: "Lessons",
      columns: ["Module", "Topic", "Lesson", "Quick check questions", "Learners completed", "Learners enrolled", "Quiz pass rate (%)"],
      rows: majors.flatMap((major, i) =>
        (major.middleCategory ?? []).flatMap((middle) =>
          (middle.lessons ?? []).map((lesson) => {
            const quiz = published(lesson.exams).find((e) => e.examType === "LESSON_QUIZ")
            const stat = quiz ? statByExam.get(quiz.examId) : null
            return [
              `Module ${i + 1}: ${major.title}`, middle.title, lessonTitle(lesson), quiz?.totalQuestions ?? "",
              completedByLesson.get(lesson.lessonId) ?? 0, enrolled,
              stat?.attempts ? Math.round(Number(stat.passRate)) : "",
            ]
          })
        )
      ),
    },
    {
      title: "Assessments",
      columns: ["Assessment", "Type", "Learners", "Attempts", "Average score (%)", "Pass rate (%)"],
      rows: (analytics?.assessments ?? []).map((a) => [
        a.title, EXAM_LABEL[a.examType] ?? a.examType, a.learners, a.attempts,
        a.averageScore == null ? "" : Math.round(Number(a.averageScore)),
        a.passRate == null ? "" : Math.round(Number(a.passRate)),
      ]),
    },
  ]

  const detail = detailLesson
  const detailQuiz = detail ? published(detail.exams).find((e) => e.examType === "LESSON_QUIZ") : null

  return (
    <div className="space-y-5">
      {/* Summary */}
      <section className="space-y-3 rounded-2xl border border-border/70 bg-card p-5 shadow-xs">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Curriculum summary</p>
            <h2 className="text-lg font-bold text-foreground">{certification.title}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {majors.length} module{majors.length === 1 ? "" : "s"}, {totals.topics} topics and {totals.lessons} lessons,
              with {totals.quickChecks} quick checks and {totals.exams + certExams.length} exams (
              {totals.questions + questions(certExams)} questions in all).
              {enrolled
                ? ` ${enrolled} learner${enrolled === 1 ? " is" : "s are"} on it and have finished ${pct(overallCompletion)} of the lessons on average.`
                : " No learners are on it yet."}
            </p>
          </div>
          <ExportButton
            filename="rebyu-curriculum"
            report="Curriculum"
            details={[["Certification", certification.title], ["Learners counted", "Every learner your institution has on this certification"]]}
            className="h-9 shrink-0 text-xs"
            sections={csv}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <StatTile label="Modules" value={majors.length} />
          <StatTile label="Topics" value={totals.topics} />
          <StatTile label="Lessons" value={totals.lessons} />
          <StatTile label="Quick checks" value={totals.quickChecks} />
          <StatTile label="Exams" value={totals.exams + certExams.length} />
          <StatTile
            label="Lessons finished"
            value={pct(overallCompletion)}
            hint={enrolled ? `avg across ${enrolled} learners` : "no learners yet"}
          />
        </div>

        {certExams.length ? (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-muted-foreground">Whole-certification exams:</span>
            {certExams.map((exam) => (
              <ExamChip key={exam.examId} exam={exam} stat={statByExam.get(exam.examId)} />
            ))}
          </div>
        ) : null}
      </section>

      {/* Modules */}
      <section className="space-y-3">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <h3 className="text-base font-bold text-foreground">Modules</h3>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find a lesson"
                className="h-9 pl-8 text-sm"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 shrink-0 text-xs"
              onClick={() =>
                setOpenMajors((current) =>
                  current.size === majors.length ? new Set() : new Set(majors.map((m) => m.majorCategoryId))
                )
              }
            >
              {openMajors.size === majors.length ? "Collapse all" : "Expand all"}
            </Button>
          </div>
        </div>

        {majors.map((major, index) => {
          const middles = major.middleCategory ?? []
          const lessons = middles.flatMap((m) => m.lessons ?? [])
          const matches = lessons.filter((lesson) => lessonTitle(lesson).toLowerCase().includes(query))
          if (query && matches.length === 0) return null
          const open = Boolean(query) || openMajors.has(major.majorCategoryId)
          const counts = tally([major])
          const completion = lessonCompletion(lessons)
          const majorExams = published(major.exams)
          return (
            <article key={major.majorCategoryId ?? index} className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
              <button
                type="button"
                onClick={() => toggle(major.majorCategoryId)}
                aria-expanded={open}
                className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/30"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-sm font-extrabold text-primary-foreground">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{major.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {counts.topics} topics · {counts.lessons} lessons · {counts.quickChecks} quick checks
                    {counts.exams ? ` · ${counts.exams} exams` : ""} · {counts.questions} questions
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Progress value={completion ?? 0} className="h-1.5 max-w-xs flex-1" aria-label={`${major.title} completion`} />
                    <span className="text-[11px] tabular-nums text-muted-foreground">{pct(completion)} finished</span>
                  </div>
                </div>
                {open ? (
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                )}
              </button>

              {open ? (
                <div className="space-y-4 border-t border-border/60 bg-muted/10 p-4">
                  {middles.map((middle) => {
                    const list = (middle.lessons ?? []).filter(
                      (lesson) => !query || lessonTitle(lesson).toLowerCase().includes(query)
                    )
                    if (list.length === 0) return null
                    const middleExams = published(middle.exams)
                    return (
                      <div key={middle.middleCategoryId} className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{middle.title}</p>
                          {middleExams.map((exam) => (
                            <ExamChip key={exam.examId} exam={exam} stat={statByExam.get(exam.examId)} />
                          ))}
                        </div>
                        <ul className="divide-y divide-border/50 overflow-hidden rounded-xl border border-border/60 bg-card">
                          {list.map((lesson) => {
                            const done = completedByLesson.get(lesson.lessonId) ?? 0
                            const share = enrolled ? Math.round((done / enrolled) * 100) : null
                            const quiz = published(lesson.exams).find((e) => e.examType === "LESSON_QUIZ")
                            return (
                              <li key={lesson.lessonId} className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center">
                                <BookOpen className="hidden size-4 shrink-0 text-muted-foreground sm:block" aria-hidden="true" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-foreground">{lessonTitle(lesson)}</p>
                                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                    {quiz ? <ExamChip exam={quiz} stat={statByExam.get(quiz.examId)} /> : null}
                                    <span className="text-[11px] text-muted-foreground">
                                      {enrolled ? `${done}/${enrolled} learners finished` : "No learners yet"}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 sm:w-56">
                                  <Progress value={share ?? 0} className="h-1.5 flex-1" aria-label={`${lessonTitle(lesson)} completion`} />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 shrink-0 gap-1.5 text-xs"
                                    onClick={() =>
                                      setDetailLesson({ ...lesson, majorTitle: major.title, middleTitle: middle.title })
                                    }
                                  >
                                    <Eye className="size-3.5" aria-hidden="true" />
                                    View details
                                  </Button>
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )
                  })}
                  {majorExams.length ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-muted-foreground">Module exams:</span>
                      {majorExams.map((exam) => (
                        <ExamChip key={exam.examId} exam={exam} stat={statByExam.get(exam.examId)} />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </article>
          )
        })}
      </section>

      <LessonDetailsSheet
        lesson={detail}
        enrolled={enrolled}
        completed={detail ? completedByLesson.get(detail.lessonId) ?? 0 : 0}
        quiz={detailQuiz}
        quizStat={detailQuiz ? statByExam.get(detailQuiz.examId) : null}
        onOpenChange={(open) => !open && setDetailLesson(null)}
      />
    </div>
  )
}
