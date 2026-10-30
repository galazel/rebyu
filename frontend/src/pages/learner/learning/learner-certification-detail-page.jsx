import { useEffect, useMemo } from "react"
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  BookOpen,
  Clock,
  GraduationCap,
  Layers3,
  LockKeyhole,
  Target,
  PlayCircle,
} from "@/components/icons"
import { toast } from "sonner"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import { Button } from "@/components/ui/button"

import { BentoHeading } from "@/components/commons/bento.jsx"

import { BUBBLE_TONES } from "@/components/commons/bubble-card.jsx"
import { LearnerEmptyState, toneForCertification } from "@/components/learner/learner-ui.jsx"
import { LearnerAnnouncements } from "@/components/learner/learner-announcements.jsx"
import { LearnerClassAssessments } from "@/components/learner/learner-class-assessments.jsx"
import { announceRewards, prefetchRewards, snapshotRewards } from "@/components/learner/xp-award-modal.jsx"

import { getCertificationModules } from "@/services/learnerService.js"
import { hasSatDiagnostic } from "./curriculum-model.js"

import {
  confirmPurchase,
  getExamTypes,
  getExams,
  getLearnerEnrollments,
  purchaseCertification,
} from "@/services/assessmentService.js"

function getLessonDurationMinutes(lesson) {
  const possibleValues = [
    lesson?.durationMinutes,
    lesson?.estimatedMinutes,
    lesson?.minutes,
    lesson?.duration,
  ]

  for (const value of possibleValues) {
    const parsedValue = Number(value)

    if (Number.isFinite(parsedValue) && parsedValue > 0) {
      return parsedValue
    }
  }

  return 0
}

function formatDuration(minutes) {
  const safeMinutes = Number(minutes ?? 0)

  if (!Number.isFinite(safeMinutes) || safeMinutes <= 0) {
    return "Self-paced"
  }

  const hours = Math.floor(safeMinutes / 60)
  const remainingMinutes = safeMinutes % 60

  if (hours <= 0) {
    return `${remainingMinutes} min`
  }

  if (remainingMinutes === 0) {
    return `${hours} hr`
  }

  return `${hours} hr ${remainingMinutes} min`
}

function SyllabusFigure({ icon: Icon, value, label }) {
  const isNumber = /^\d/.test(String(value))

  return (
      <div className="flex min-w-0 items-center gap-3 rounded-[1rem] border border-[var(--tg-line)] bg-card p-4 shadow-[0_3px_0_var(--tg-line)]">
        {Icon ? <span className="tg-badge-icon !size-11 !rounded-xl"><Icon className="size-5" aria-hidden="true" /></span> : null}
        <div className="min-w-0">
          <p
              className={`font-rb-display font-extrabold leading-none tabular-nums text-foreground ${
                  isNumber ? "text-3xl" : "text-xl"
              }`}
          >
            {value}
          </p>
          <p className="mt-1 text-xs font-bold text-muted-foreground">{label}</p>
        </div>
      </div>
  )
}

function RouteStep({ index, icon: Icon, title, children, tone, done }) {
  return (
      <li className="flex min-w-0 gap-3">
        <span
            className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl text-xs font-extrabold ${
              done ? "tg-solid-soft" : "bg-[var(--tg-soft)] text-[var(--tg-ink)]"
            }`}
        >
          {index}
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-extrabold text-foreground">
            <Icon className="size-3.5 shrink-0" aria-hidden="true" />
            {title}
          </p>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{children}</p>
        </div>
      </li>
  )
}

export default function LearnerCertificationDetailPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  useEffect(() => {
    prefetchRewards(queryClient).catch(() => {})
  }, [queryClient])
  const { certificationId } = useParams()

  const outletContext = useOutletContext()
  const data = outletContext?.data ?? {}

  const learnerId = data.learnerId ?? null
  const certifications = data.certifications ?? []
  const enrolledCertifications = data.enrolledCertifications ?? []

  const enrollmentsQuery = useQuery({
    queryKey: ["learner-enrollments", learnerId],
    queryFn: () => getLearnerEnrollments(learnerId),
    enabled: learnerId != null,
    retry: 1,
  })

  const enrollment = useMemo(() => {
    const enrollmentList = Array.isArray(enrollmentsQuery.data)
        ? enrollmentsQuery.data
        : []

    return (
        enrollmentList.find(
            (item) =>
                String(item.certificationId) === String(certificationId) &&
                item.status === "ACTIVE"
        ) ?? null
    )
  }, [enrollmentsQuery.data, certificationId])

  const examsQuery = useQuery({
    queryKey: ["exams"],
    queryFn: () => getExams(),
  })

  const examTypesQuery = useQuery({
    queryKey: ["exam-types"],
    queryFn: getExamTypes,
  })


  const publishedDiagnostic = useMemo(() => {
    const typeById = new Map(
        (Array.isArray(examTypesQuery.data) ? examTypesQuery.data : []).map(
            (type) => [type.examTypeId, type.examTypeText]
        )
    )

    return (
        (Array.isArray(examsQuery.data) ? examsQuery.data : []).find(
            (exam) =>
                String(exam.certificationId) === String(certificationId) &&
                exam.status === "PUBLISHED" &&
                typeById.get(exam.examTypeId) === "DIAGNOSTIC"
        ) ?? null
    )
  }, [certificationId, examsQuery.data, examTypesQuery.data])

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const transaction = await purchaseCertification(
          certificationId,
          learnerId,
          crypto.randomUUID()
      )

      if (transaction?.requiresPayment && transaction?.transactionId) {
        await confirmPurchase(
            transaction.transactionId,
            learnerId,
            `AUTO-${transaction.transactionReference ?? transaction.transactionId}`
        )
      }

      return transaction
    },

    onMutate: () => snapshotRewards(queryClient),
    onSuccess: async (_result, _variables, before) => {
      queryClient.invalidateQueries({
        queryKey: ["learner-enrollments"],
      })
      // My Learning reads enrolled certifications from the portal query, so
      // refresh it before navigating there or the new card won't appear.
      await queryClient.invalidateQueries({
        queryKey: ["learner-portal-data"],
      })

      toast.success(
          "You are now enrolled. This certification was added to My Learning."
      )
      await announceRewards({
        queryClient,
        before,
        title: "Enrolled",
        silentXp: true,
      })
      navigate("/learner/learning")
    },

    onError: (error) => {
      toast.error(
          error?.response?.data?.message ??
          "The enrollment could not be completed. Please try again."
      )
    },
  })

  const certification =
      certifications.find(
          (item) => String(item.certificationId) === String(certificationId)
      ) ??
      enrolledCertifications.find(
          (item) => String(item.certificationId) === String(certificationId)
      )

  if (!certification) {
    return (
        <LearnerEmptyState
            icon={BookOpen}
            title="Certification not found"
            description="The requested certification is not available from the backend."
            action={
              <Button onClick={() => navigate("/learner/certifications")}>
                Go to Certifications
              </Button>
            }
        />
    )
  }

  const enrolled =
      enrollment != null ||
      enrolledCertifications.some(
          (item) => String(item.certificationId) === String(certificationId)
      )

  const diagnosticDone =
      Boolean(enrollment?.diagnosticCompletedAt) ||
      hasSatDiagnostic({
        diagnostic: publishedDiagnostic,
        examResults: data.examResults ?? [],
        certificationId,
      })

  const diagnosticRequired =
      enrolled && publishedDiagnostic != null && !diagnosticDone

  const toneKey = toneForCertification(certification)
  const tone = BUBBLE_TONES[toneKey] ?? BUBBLE_TONES.macaw

  const modules = getCertificationModules(certification) ?? []

  const allLessons = modules.flatMap((major) =>
      (major.middleCategory ?? []).flatMap((middle) => middle.lessons ?? [])
  )

  const moduleCount = modules.reduce(
      (total, major) => total + (major.middleCategory?.length ?? 0),
      0
  )
  const lessonCount = allLessons.length

  const totalMinutes = allLessons.reduce(
      (total, lesson) => total + getLessonDurationMinutes(lesson),
      0
  )

  const primaryButtonLabel = enrolled
      ? diagnosticRequired
          ? "Start Diagnostic"
          : "Continue Learning"
      : learnerId == null
          ? "Sign In to Enroll"
          : enrollMutation.isPending
              ? "Enrolling..."
              : "REBYU Certificate"

  function handlePrimaryAction() {
    if (enrolled) {
      if (diagnosticRequired && publishedDiagnostic) {
        navigate(`/learner/assessments/${publishedDiagnostic.examId}`)
        return
      }

      navigate(`/learner/learning/${certificationId}`)
      return
    }

    if (learnerId == null) {
      toast.info("Sign in to enroll in this certification.")
      navigate("/login")
      return
    }

    enrollMutation.mutate()
  }

  return (

      <div className="rebyu-ds tg-cat-explain min-h-[calc(100dvh-4rem)] w-full min-w-0 bg-card pb-20">
        <div className="mx-auto w-full max-w-[1600px] px-5 lg:px-8">

          <div className="flex items-center gap-3 py-6">
            <button type="button" className="tg-btn" onClick={() => navigate("/learner/certifications")}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Certifications
            </button>
          </div>

          <header className="tg-frame relative p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
              <p className="rb-eyebrow min-w-0 break-words">
                {certification.department || "certification program"}
              </p>

              <span className="tg-chip shrink-0 !px-3 !py-1">
                {enrolled ? "Enrolled" : "Free to study"}
              </span>
            </div>

            <h1 className="mt-3 max-w-4xl break-words font-rb-display text-[clamp(2rem,5vw,3.75rem)] font-extrabold leading-[1.05] text-foreground [overflow-wrap:anywhere]">
              {certification.title}
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              {certification.description ||
                  "A comprehensive certification review designed to build your expertise, prepare you for the examination, and accelerate your career."}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <button
                  type="button"
                  className="tg-btn tg-btn-primary !px-6 !py-3 !text-base"
                  onClick={handlePrimaryAction}
                  disabled={enrollMutation.isPending}
              >
                {diagnosticRequired ? <Target className="size-4" aria-hidden="true" /> : <PlayCircle className="size-4" aria-hidden="true" />}
                {primaryButtonLabel}
              </button>

              {(diagnosticRequired || (publishedDiagnostic && !enrolled)) && (
                  <span className="inline-flex min-w-0 items-center gap-2 rounded-full bg-[var(--tg-softer)] px-3 py-1.5 text-xs font-bold text-[var(--tg-ink)]">
                    {diagnosticRequired ? (
                        <Target className="size-4 shrink-0" aria-hidden="true" />
                    ) : (
                        <LockKeyhole className="size-4 shrink-0" aria-hidden="true" />
                    )}
                    {diagnosticRequired
                        ? "Complete the diagnostic to unlock your learning path."
                        : "A short placement test runs once you enrol."}
                  </span>
              )}
            </div>
          </header>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <SyllabusFigure
                  icon={Layers3}
                  value={modules.length}
                  label={modules.length === 1 ? "major category" : "major categories"}
              />
            </div>
            <div>
              <SyllabusFigure icon={GraduationCap} value={moduleCount} label={moduleCount === 1 ? "module" : "modules"} />
            </div>
            <div>
              <SyllabusFigure icon={BookOpen} value={lessonCount} label={lessonCount === 1 ? "lesson" : "lessons"} />
            </div>
            <div>
              {totalMinutes > 0 ? (
                  <SyllabusFigure icon={Clock} value={formatDuration(totalMinutes)} label="total length" />
              ) : (
                  <SyllabusFigure icon={Clock} value="Self-paced" label="study at your own pace" />
              )}
            </div>
          </div>

          <main className="mt-10 grid min-w-0 items-start gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,1.9fr)_minmax(280px,1fr)]">

            <div className="min-w-0">
              <div className="mb-6">
                <h2 className="flex items-center gap-2.5 text-lg font-bold text-foreground">
                  <span className="tg-badge-icon !size-8 !rounded-lg"><BookOpen className="size-4" aria-hidden="true" /></span>
                  Course content
                </h2>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  One mark per lesson, so you can see where the weight of this
                  certification sits before you open anything.
                </p>
              </div>

              {modules.length === 0 ? (
                  <LearnerEmptyState
                      icon={BookOpen}
                      title="No curriculum available"
                      description="This certification does not have modules or lessons yet."
                  />
              ) : (
                  <ol className="min-w-0">
                    {modules.map((major, majorIndex) => {
                      const middleCategories = major.middleCategory ?? []
                      const categoryLessons = middleCategories.reduce(
                          (total, middle) => total + (middle.lessons?.length ?? 0),
                          0
                      )
                      const isLast = majorIndex === modules.length - 1

                      return (
                          <li
                              key={major.majorCategoryId ?? majorIndex}
                              className="relative min-w-0 pb-10 pl-11 last:pb-0 sm:pl-14"
                          >
                            {!isLast && (
                                <span
                                    aria-hidden="true"
                                    className="absolute left-[15px] top-9 bottom-0 w-0.5 sm:left-[19px]"
                                    style={{ background: "var(--tg-soft)" }}
                                />
                            )}

                            <span
                                aria-hidden="true"
                                className="tg-solid-soft absolute left-0 top-0 grid size-8 place-items-center rounded-xl font-rb-display text-sm font-extrabold shadow-[0_3px_0_color-mix(in_oklab,var(--tg)_55%,#000)] sm:size-10 sm:text-base"
                            >
                              {majorIndex + 1}
                            </span>

                            <h3 className="min-w-0 break-words font-rb-display text-xl font-extrabold leading-tight text-foreground sm:text-2xl">
                              {major.title ?? "Untitled"}
                            </h3>


                            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                              <span
                                  className="flex min-w-0 flex-wrap gap-1"
                                  aria-hidden="true"
                              >
                                {Array.from({ length: categoryLessons }).map((_, mark) => (
                                    <span
                                        key={mark}
                                        className="h-1.5 w-4 rounded-full bg-[var(--tg)]"
                                    />
                                ))}
                              </span>
                              <span className="shrink-0 text-xs font-extrabold text-muted-foreground">
                                {categoryLessons} {categoryLessons === 1 ? "lesson" : "lessons"}
                                {" · "}
                                {middleCategories.length}{" "}
                                {middleCategories.length === 1 ? "module" : "modules"}
                              </span>
                            </div>

                            {middleCategories.length === 0 ? (
                                <p className="mt-4 text-sm text-muted-foreground">
                                  No modules under this category yet.
                                </p>
                            ) : (
                                <Accordion type="multiple" className="mt-4 space-y-2">
                                  {middleCategories.map((middle, middleIndex) => {
                                    const middleLessons = middle.lessons ?? []
                                    const middleMinutes = middleLessons.reduce(
                                        (total, lesson) => total + getLessonDurationMinutes(lesson),
                                        0
                                    )
                                    const itemValue = String(
                                        middle.middleCategoryId ?? `${majorIndex}-${middleIndex}`
                                    )
                                    return (
                                        <AccordionItem
                                            key={itemValue}
                                            value={itemValue}
                                            className="overflow-hidden rounded-[1rem] border border-[var(--tg-line)] bg-card data-[state=open]:border-[var(--tg)] data-[state=open]:shadow-[0_3px_0_var(--tg-line)]"
                                        >
                                          <AccordionTrigger className="px-4 py-3.5 transition-colors hover:bg-[var(--tg-softer)] hover:no-underline">
                                            <div className="flex min-w-0 flex-col items-start text-left">
                                              <span className="min-w-0 break-words font-rb-display text-lg font-extrabold text-foreground">
                                                {middle.title ?? "Untitled Module"}
                                              </span>
                                              <span className="mt-0.5 text-xs font-bold text-muted-foreground">
                                                {middleLessons.length}{" "}
                                                {middleLessons.length === 1 ? "lesson" : "lessons"}
                                                {middleMinutes > 0
                                                    ? ` · ${formatDuration(middleMinutes)}`
                                                    : ""}
                                              </span>
                                            </div>
                                          </AccordionTrigger>
                                          <AccordionContent className="border-t border-[var(--tg-line)] bg-[var(--tg-softer)] px-2 pb-2 pt-2">
                                            {middleLessons.length === 0 ? (
                                                <p className="px-3 py-2 text-sm text-muted-foreground">
                                                  No lessons have been added yet.
                                                </p>
                                            ) : (
                                                <ul>
                                                  {middleLessons.map((lesson) => (
                                                      <li
                                                          key={lesson.lessonId}
                                                          className="flex items-center justify-between gap-4 rounded-xl px-3 py-2.5 hover:bg-card"
                                                      >
                                                        <span className="flex min-w-0 items-center gap-3">
                                                          <PlayCircle
                                                              className="size-4 shrink-0 text-[var(--tg)]"
                                                              aria-hidden="true"
                                                          />
                                                          <span className="min-w-0 truncate text-sm font-bold text-foreground">
                                                            {lesson.name}
                                                          </span>
                                                        </span>
                                                        <span className="shrink-0 text-xs font-bold text-muted-foreground">
                                                          {getLessonDurationMinutes(lesson) > 0
                                                              ? formatDuration(
                                                                  getLessonDurationMinutes(lesson)
                                                              )
                                                              : "Self-paced"}
                                                        </span>
                                                      </li>
                                                  ))}
                                                </ul>
                                            )}
                                          </AccordionContent>
                                        </AccordionItem>
                                    )
                                  })}
                                </Accordion>
                            )}
                          </li>
                      )
                    })}
                  </ol>
              )}
            </div>

            <aside className="flex min-w-0 flex-col gap-9 self-start lg:sticky lg:top-6">
              <LearnerAnnouncements certificationId={certificationId} />

              <LearnerClassAssessments certificationId={certificationId} />

              <section className="tg-frame p-5">
                <BentoHeading title="How this works" hint="The route from here to the exam." />
                <ol className="space-y-4">
                  {publishedDiagnostic && (
                      <RouteStep
                          index={1}
                          icon={Target}
                          title="Sit the diagnostic"
                          tone={tone}
                          done={diagnosticDone}
                      >
                        A short placement test. What you already know is what
                        decides the order of everything below.
                      </RouteStep>
                  )}
                  <RouteStep
                      index={publishedDiagnostic ? 2 : 1}
                      icon={BookOpen}
                      title="Work the lessons"
                      tone={tone}
                  >
                      {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"} across{" "}
                      {modules.length} {modules.length === 1 ? "category" : "categories"},
                      in whatever order your path puts them.
                  </RouteStep>
                  <RouteStep
                      index={publishedDiagnostic ? 3 : 2}
                      icon={Layers3}
                      title="Practise what slips"
                      tone={tone}
                  >
                    Quizzes and flashcards are generated from the lessons you
                    have covered, and mistakes come back around.
                  </RouteStep>
                  <RouteStep
                      index={publishedDiagnostic ? 4 : 3}
                      icon={GraduationCap}
                      title="Sit a mock exam"
                      tone={tone}
                  >
                    A full-length paper under exam conditions, marked with a
                    breakdown of where the marks went.
                  </RouteStep>
                </ol>
              </section>

              <section className="tg-frame p-5">
                <BentoHeading title="What it asks of you" />
                <ul className="space-y-2 text-sm font-semibold text-muted-foreground [&>li]:flex [&>li]:items-center [&>li]:gap-2 [&>li]:before:size-1.5 [&>li]:before:shrink-0 [&>li]:before:rounded-full [&>li]:before:bg-[var(--tg)] [&>li]:before:content-['']">
                  <li>No prior experience.</li>
                  <li>A stable internet connection.</li>
                  <li>English is the language of the material.</li>
                  {publishedDiagnostic ? (
                      <li>The diagnostic, before the path opens.</li>
                  ) : null}
                </ul>
              </section>
            </aside>
          </main>
        </div>
      </div>
  )
}
