import { useMemo } from "react"
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  BookOpen,
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
import { BackButton, TactileButton } from "@/components/rebyu/rebyu-ui.jsx"

import { BUBBLE_TONES } from "@/components/commons/bubble-card.jsx"
import { LearnerEmptyState, toneForCertification } from "@/components/learner/learner-ui.jsx"
import { LearnerAnnouncements } from "@/components/learner/learner-announcements.jsx"
import { announceRewards, snapshotRewards } from "@/components/learner/xp-award-modal.jsx"

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

/**
 * One figure from the syllabus, set as a figure.
 *
 * <p>These were three 12px chips with icons, lost along the bottom edge of the
 * old banner. The size of a certification is the first thing a learner wants
 * from this page — how much is there, and how long is it — so the numerals are
 * given the display face at a size you read before the sentence beside them.
 */
function SyllabusFigure({ value, label }) {
  /* A word set at numeral size is not a figure, it is a headline that has
     wandered into a row of them -- "Self-paced" at 36px was half again as wide
     as the three numbers put together and pulled the whole row to the right.
     Words step down a size and keep the same baseline. */
  const isNumber = /^\d/.test(String(value))

  return (
      <div className="min-w-0">
        <p
            className={`rb-numeric font-rb-display font-extrabold leading-none text-rb-eel ${
                isNumber ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl"
            }`}
        >
          {value}
        </p>
        <p className="rb-nav-label mt-2">{label}</p>
      </div>
  )
}

/**
 * One step of the actual route through a certification.
 *
 * <p>Numbered because this genuinely is a sequence: the diagnostic decides the
 * path, the path is what you study, and the mock exam is what you sit at the
 * end of it. The four bullets this replaces ("a structured diagnostic
 * assessment to pinpoint your learning gaps immediately") were the same four
 * sentences under every certification in the catalog, which is the definition
 * of copy that has stopped carrying information.
 */
function RouteStep({ index, icon: Icon, title, children, tone, done }) {
  return (
      <li className="flex min-w-0 gap-3">
        <span
            className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full font-rb-display text-xs font-extrabold"
            style={
              done
                  ? { background: tone.solid, color: "#fff" }
                  : { boxShadow: `inset 0 0 0 2px ${tone.solid}33`, color: tone.solid }
            }
        >
          {index}
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-extrabold text-rb-eel">
            <Icon className="size-3.5 shrink-0" aria-hidden="true" />
            {title}
          </p>
          <p className="mt-0.5 text-xs leading-5 text-rb-wolf">{children}</p>
        </div>
      </li>
  )
}

export default function LearnerCertificationDetailPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
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

  /* No BKT here. This page describes the certification -- what is in it and
     what it asks of you -- and nothing about how the reader is doing at it.
     Priority tags, mastery and progress are readings of a learner, they change
     under the same content from one day to the next, and they already have two
     homes (the analytics board and My Learning). Carrying them here also meant
     this page could not be shown to somebody who is not enrolled without
     showing them an empty version of somebody else's dashboard. */

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

  // Enrollment is free: any payment transaction the backend still creates is
  // confirmed automatically so the learner is enrolled in a single click.
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

    // Enrolling can unlock "Knowledge Seeker" server-side, so this flow diffs
    // the portal payload too -- snapshot before, announce after.
    onMutate: () => snapshotRewards(queryClient),
    onSuccess: async (_result, _variables, before) => {
      queryClient.invalidateQueries({
        queryKey: ["learner-enrollments"],
      })

      toast.success(
          "You are now enrolled. This certification was added to My Learning."
      )
      // `silentXp`: enrolling pays no XP, and the "nothing was credited" toast
      // would contradict the success toast just shown. This also refetches the
      // portal payload, which is what the invalidate here used to do.
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

  /* Two pieces of evidence, and the flag is only one of them.
     `diagnosticCompletedAt` is stamped on whichever enrollment row was active
     when the diagnostic was submitted, so anything that produces a different
     active row afterwards -- re-enrolling, an organization re-issuing a seat, a
     self-enrollment added beside a sponsored one -- leaves a learner who has
     demonstrably sat it being told to sit it again. Their own submitted result
     is the fact; the flag is a cache of it, and `hasSatDiagnostic` is the same
     check the curriculum page gates on. */
  const diagnosticDone =
      Boolean(enrollment?.diagnosticCompletedAt) ||
      hasSatDiagnostic({
        diagnostic: publishedDiagnostic,
        examResults: data.examResults ?? [],
        certificationId,
      })

  const diagnosticRequired =
      enrolled && publishedDiagnostic != null && !diagnosticDone

  /* The same tone the catalog card used for this certification, so opening a
     card lands on a page in that card's colour instead of on a page that looks
     the same for every certification. */
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
              : "Rebyu Certificate"

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
      /* One white ground, and the certification's colour used as punctuation.

         This page was a ~350px flat blue slab with the title and three 12px
         chips on it, and everything that mattered below the fold underneath.
         The slab is gone: the colour is now a rule, the station numerals and
         the weight bars, which is roughly a sixth of the ink and marks things
         instead of filling space. What was carrying the page visually is now
         the display type and the syllabus itself. */
      <div className="rebyu-ds min-h-[calc(100dvh-4rem)] w-full min-w-0 bg-rb-snow pb-20">
        {/* The layout hands this route the full window (see
            `isCertificationDetailPage` in learner-layout), so the gutters and
            the cap are set here and nowhere else. */}
        <div className="mx-auto w-full max-w-[1600px] px-5 lg:px-8">

          <div className="flex items-center gap-3 py-6">
            <BackButton asChild label="Back to certifications">
              <Link to="/learner/certifications" />
            </BackButton>
            <span className="font-rb-display text-sm font-extrabold lowercase text-rb-wolf">
              back to certifications
            </span>
          </div>

          {/* The masthead. The rule down its left edge is the only large piece
              of colour on the page, and it is 6px wide rather than the width
              of the window. */}
          <header className="relative border-l-[6px] pl-5 sm:pl-7" style={{ borderColor: tone.solid }}>
            <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
              <p className="rb-eyebrow min-w-0 break-words">
                {certification.industry || "certification program"}
              </p>

              <span
                  className="shrink-0 rounded-rb-pill px-3 py-1 font-rb-display text-[10px] font-extrabold uppercase tracking-wide"
                  style={{ background: `${tone.solid}14`, color: tone.solid }}
              >
                {enrolled ? "Enrolled" : "Free to study"}
              </span>
            </div>

            {/* The title is the hero now. It is set at the size the banner
                used to occupy, so the page still opens with something large --
                just something that is the certification's own name rather than
                a rectangle. */}
            <h1 className="mt-3 max-w-4xl break-words font-rb-display text-[clamp(2rem,5vw,3.75rem)] font-extrabold leading-[1.05] text-rb-eel [overflow-wrap:anywhere]">
              {certification.title}
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-rb-wolf">
              {certification.description ||
                  "A comprehensive certification review designed to build your expertise, prepare you for the examination, and accelerate your career."}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <TactileButton
                  type="button"
                  size="lg"
                  onClick={handlePrimaryAction}
                  disabled={enrollMutation.isPending}
              >
                {primaryButtonLabel}
              </TactileButton>

              {(diagnosticRequired || (publishedDiagnostic && !enrolled)) && (
                  <span className="inline-flex min-w-0 items-center gap-2 text-xs font-bold text-rb-wolf">
                    {diagnosticRequired ? (
                        <Target className="size-4 shrink-0" style={{ color: tone.solid }} aria-hidden="true" />
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

          {/* The size of the thing, in figures rather than chips. Hairlines
              rather than boxes: four numbers in a row need separating, not
              containing. */}
          <div className="mt-10 grid grid-cols-2 gap-y-6 border-y border-rb-swan py-6 sm:grid-cols-4 sm:divide-x sm:divide-rb-swan">
            <div className="sm:pr-6">
              <SyllabusFigure
                  value={modules.length}
                  label={modules.length === 1 ? "major category" : "major categories"}
              />
            </div>
            <div className="sm:px-6">
              <SyllabusFigure value={moduleCount} label={moduleCount === 1 ? "module" : "modules"} />
            </div>
            <div className="sm:px-6">
              <SyllabusFigure value={lessonCount} label={lessonCount === 1 ? "lesson" : "lessons"} />
            </div>
            <div className="sm:pl-6">
              {/* A certification with no authored durations has no hours to
                  quote, and "Self-paced" is the honest answer rather than a
                  zero dressed up as one. */}
              {totalMinutes > 0 ? (
                  <SyllabusFigure value={formatDuration(totalMinutes)} label="total length" />
              ) : (
                  <SyllabusFigure value="Self-paced" label="study at your own pace" />
              )}
            </div>
          </div>

          <main className="mt-10 grid min-w-0 items-start gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,1.9fr)_minmax(280px,1fr)]">

            {/* THE SYLLABUS SPINE */}
            <div className="min-w-0">
              <div className="mb-6">
                <h2 className="font-rb-display text-sm font-extrabold lowercase text-rb-eel">
                  course content
                </h2>
                <p className="mt-1 text-xs text-rb-wolf">
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
                            {/* The rail. It stops at the last station rather
                                than running off the end of the list. */}
                            {!isLast && (
                                <span
                                    aria-hidden="true"
                                    className="absolute left-[15px] top-9 bottom-0 w-0.5 sm:left-[19px]"
                                    style={{ background: `${tone.solid}22` }}
                                />
                            )}

                            {/* The station. */}
                            <span
                                aria-hidden="true"
                                className="absolute left-0 top-0 grid size-8 place-items-center rounded-full font-rb-display text-sm font-extrabold text-white sm:size-10 sm:text-base"
                                style={{ background: tone.solid }}
                            >
                              {majorIndex + 1}
                            </span>

                            <h3 className="min-w-0 break-words font-rb-display text-xl font-extrabold leading-tight text-rb-eel sm:text-2xl">
                              {major.title ?? "Untitled"}
                            </h3>

                            {/* The weight of the category, one mark per lesson.

                                This was a filled bar, and a filled bar on a
                                course page means one thing to a learner: how
                                far through it they are. A category they had not
                                opened was drawing a full-width blue bar and
                                reading as finished. Marks cannot be misread
                                that way -- there is no "empty" portion to
                                complete -- and they are countable, so the
                                heaviest category is obvious at a glance and
                                exact on a second look. */}
                            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                              <span
                                  className="flex min-w-0 flex-wrap gap-1"
                                  aria-hidden="true"
                              >
                                {Array.from({ length: categoryLessons }).map((_, mark) => (
                                    <span
                                        key={mark}
                                        className="h-1.5 w-4 rounded-full"
                                        style={{ background: tone.solid }}
                                    />
                                ))}
                              </span>
                              <span className="shrink-0 text-xs font-extrabold text-rb-wolf">
                                {categoryLessons} {categoryLessons === 1 ? "lesson" : "lessons"}
                                {" · "}
                                {middleCategories.length}{" "}
                                {middleCategories.length === 1 ? "module" : "modules"}
                              </span>
                            </div>

                            {middleCategories.length === 0 ? (
                                <p className="mt-4 text-sm text-rb-wolf">
                                  No modules under this category yet.
                                </p>
                            ) : (
                                <Accordion type="multiple" className="mt-4 border-t border-rb-swan">
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
                                            className="border-rb-swan"
                                        >
                                          <AccordionTrigger className="rounded-rb-tile px-3 py-3.5 transition-colors hover:bg-rb-polar hover:no-underline">
                                            <div className="flex min-w-0 flex-col items-start text-left">
                                              <span className="min-w-0 break-words font-rb-display text-base font-extrabold text-rb-eel">
                                                {middle.title ?? "Untitled Module"}
                                              </span>
                                              <span className="mt-0.5 text-xs font-bold text-rb-wolf">
                                                {middleLessons.length}{" "}
                                                {middleLessons.length === 1 ? "lesson" : "lessons"}
                                                {middleMinutes > 0
                                                    ? ` · ${formatDuration(middleMinutes)}`
                                                    : ""}
                                              </span>
                                            </div>
                                          </AccordionTrigger>
                                          <AccordionContent className="pb-3 pt-1">
                                            {middleLessons.length === 0 ? (
                                                <p className="px-3 py-2 text-sm text-rb-wolf">
                                                  No lessons have been added yet.
                                                </p>
                                            ) : (
                                                <ul>
                                                  {middleLessons.map((lesson) => (
                                                      <li
                                                          key={lesson.lessonId}
                                                          className="flex items-center justify-between gap-4 rounded-rb-tile px-3 py-2.5 hover:bg-rb-polar"
                                                      >
                                                        <span className="flex min-w-0 items-center gap-3">
                                                          <PlayCircle
                                                              className="size-4 shrink-0 text-rb-hare"
                                                              aria-hidden="true"
                                                          />
                                                          <span className="min-w-0 truncate text-sm font-bold text-rb-eel">
                                                            {lesson.name}
                                                          </span>
                                                        </span>
                                                        <span className="shrink-0 text-xs font-bold text-rb-hare">
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

            {/* THE RAIL — the route through, and what it asks of you.
                Sticky because it explains the shape of the thing you are
                scrolling. It carries no counts: the figures above already
                give those, and "12 comprehensive lessons" under a page that
                has just said 12 is the sentence that made this page feel
                like a brochure. */}
            <aside className="flex min-w-0 flex-col gap-9 self-start lg:sticky lg:top-6">
              <LearnerAnnouncements certificationId={certificationId} />

              <section>
                <BentoHeading title="how this works" hint="The route from here to the exam." />
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

              <section className="border-t border-rb-swan pt-6">
                <BentoHeading title="what it asks of you" />
                <ul className="space-y-2 text-sm font-semibold text-rb-wolf">
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
