import { useMemo, useState } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Award,
  BookOpen,
  ClipboardCheck,
  CheckCircle2,
  CirclePlay,
  Grid2X2,
  List,
  LockKeyhole,
  Search,
  Trophy,
} from "@/components/icons"

import {
  certificationProgressPercent,
  findCertificationProgress,
} from "@/lib/certification-progress.js"
import { getLearnerCertificationProgress, getMyAwards } from "@/services/learnerService.js"
import EarnedStrip from "@/components/learner/earned-strip.jsx"
import { certificationBadgeUrl } from "@/services/certificationService.js"
import { useStudyPlanGate } from "@/components/learner/use-study-plan-gate.jsx"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { achievementBadge } from "@/lib/achievements.js"
import {
  LearnerEmptyState,
  LearnerPageHeader,
} from "@/components/learner/learner-ui.jsx"
import { ProgressBar as GameProgressBar } from "@/components/learner/tutor-game-kit.jsx"
import { BubbleCard } from "@/components/commons/bubble-card.jsx"

const VIEW_MODE_KEY = "rebyu-my-learning-view"

function readViewMode() {
  try {
    return window.localStorage.getItem(VIEW_MODE_KEY) === "LIST" ? "LIST" : "GRID"
  } catch {
    return "GRID"
  }
}

function storeViewMode(mode) {
  try {
    window.localStorage.setItem(VIEW_MODE_KEY, mode)
  } catch {
  }
}

function getCertificationTitle(certification) {
  return certification?.title ?? "Untitled Certification"
}

function getCertificationDescription(certification) {
  return (
      certification?.description ??
      "Continue learning and prepare for your certification assessment."
  )
}

function getAchievementTitle(achievement) {
  return (
      achievement?.title ??
      achievement?.achievementTitle ??
      achievement?.name ??
      "Achievement"
  )
}

function getAchievementDescription(achievement) {
  return (
      achievement?.description ??
      achievement?.achievementDescription ??
      achievement?.earnedAt ??
      "Keep learning to unlock more achievements."
  )
}

function getCourseStatus(progress, completedLessons) {
  if (progress != null && progress >= 100) {
    return "COMPLETED"
  }

  if (completedLessons > 0) {
    return "IN PROGRESS"
  }

  return "READY TO START"
}

function getCertificationId(certification) {
  return String(
      certification?.certificationId ??
      certification?.id ??
      certification?.certification?.certificationId ??
      ""
  )
}

function collectArrays(...sources) {
  return sources.flatMap((source) => (Array.isArray(source) ? source : []))
}

function getAssessmentTypeText(assessment) {
  return String(
      assessment?.assessmentType ??
      assessment?.assessmentTypeText ??
      assessment?.assessmentTypeName ??
      assessment?.examType ??
      assessment?.examTypeText ??
      assessment?.type ??
      assessment?.typeText ??
      assessment?.category ??
      ""
  ).toLowerCase()
}

function assessmentBelongsToCertification(assessment, certificationId) {
  if (!certificationId) {
    return true
  }

  const assessmentCertificationId = String(
      assessment?.certificationId ??
      assessment?.certification?.certificationId ??
      assessment?.courseId ??
      ""
  )

  return !assessmentCertificationId || assessmentCertificationId === certificationId
}

function isDiagnosticAssessment(assessment) {
  const typeText = getAssessmentTypeText(assessment)
  const titleText = String(
      assessment?.title ??
      assessment?.name ??
      assessment?.examName ??
      assessment?.assessmentTitle ??
      ""
  ).toLowerCase()

  return typeText.includes("diagnostic") || titleText.includes("diagnostic")
}

function getDiagnosticAssessment(certification, data) {
  const certificationId = getCertificationId(certification)

  const assessments = collectArrays(
      certification?.assessments,
      certification?.exams,
      certification?.diagnosticExams,
      data?.assessments,
      data?.exams,
      data?.diagnosticExams,
      data?.learnerAssessments,
      data?.availableAssessments
  )

  return (
      assessments.find(
          (assessment) =>
              assessmentBelongsToCertification(assessment, certificationId) &&
              isDiagnosticAssessment(assessment)
      ) ?? null
  )
}

export function isDiagnosticCompleted(certification, data) {
  const certificationId = getCertificationId(certification)

  if (
      certification?.diagnosticCompleted ||
      certification?.hasCompletedDiagnostic ||
      certification?.diagnosticTaken
  ) {
    return true
  }

  const completedEnrollment = collectArrays(data?.enrollments).some(
      (enrollment) =>
          String(enrollment?.certificationId ?? "") === certificationId &&
          Boolean(
              enrollment?.diagnosticCompletedAt ??
              enrollment?.diagnosticAttemptId ??
              enrollment?.diagnosticCompleted
          )
  )
  if (completedEnrollment) {
    return true
  }

  const results = collectArrays(
      certification?.assessmentResults,
      certification?.examResults,
      certification?.diagnosticResults,
      data?.assessmentResults,
      data?.examResults,
      data?.diagnosticResults,
      data?.learnerExamResults
  )

  return results.some((result) => {
    const resultCertificationId = String(
        result?.certificationId ??
        result?.certification?.certificationId ??
        result?.courseId ??
        ""
    )

    const matchesCertification =
        !certificationId || !resultCertificationId || resultCertificationId === certificationId

    const typeText = getAssessmentTypeText(result)
    const titleText = String(
        result?.title ??
        result?.name ??
        result?.examName ??
        result?.assessmentTitle ??
        ""
    ).toLowerCase()

    const diagnostic =
        typeText.includes("diagnostic") || titleText.includes("diagnostic")

    const completed = Boolean(
        result?.completed ??
        result?.submitted ??
        result?.submittedAt ??
        result?.dateTaken ??
        result?.finishedAt ??
        result?.score !== undefined
    )

    return matchesCertification && diagnostic && completed
  })
}


/** What a course card says and does, from where the learner is in it. */
function courseState(course) {
  const { progress, completedLessons, nextLesson, diagnosticCompleted, diagnosticAssessment, award } = course
  const needsDiagnostic = !diagnosticCompleted
  const completed = progress != null && progress >= 100
  const badgeEarned = Boolean(award?.badgeAwardedAt)
  const status = needsDiagnostic ? "Diagnostic required" : getCourseStatus(progress, completedLessons).toLowerCase().replace(/^./, (c) => c.toUpperCase())
  return {
    needsDiagnostic,
    completed,
    badgeEarned,
    status,
    StateIcon: needsDiagnostic ? LockKeyhole : completed ? Award : CirclePlay,
    action: needsDiagnostic ? "Start with the diagnostic" : badgeEarned ? "Review complete" : completed ? "Review" : completedLessons > 0 ? "Continue" : "Start learning",
    ActionIcon: needsDiagnostic ? ClipboardCheck : badgeEarned ? CheckCircle2 : CirclePlay,
    line: needsDiagnostic
        ? diagnosticAssessment
            ? "Take the diagnostic before learning"
            : "Diagnostic exam is not configured yet"
        : nextLesson
            ? `Next: ${nextLesson.name ?? nextLesson.title}`
            : completed
                ? "Course completed"
                : "Start learning",
  }
}

function CourseAction({ state, onOpen, onViewBadge, className = "" }) {
  return (
      <button
          type="button"
          className={`tg-btn !py-2.5 ${state.badgeEarned ? "" : "tg-btn-primary"} ${className}`}
          onClick={state.badgeEarned ? onViewBadge : onOpen}
      >
        <state.ActionIcon className="size-4" aria-hidden="true" />
        {state.action}
      </button>
  )
}

function CourseProgress({ progress, completedLessons, totalLessons }) {
  return (
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          {progress == null ? (
              <span className="h-6 w-16 animate-pulse rounded-full bg-[var(--tg-soft)]" aria-label="Progress loading" />
          ) : (
              <span className="font-rb-display text-3xl font-extrabold leading-none tabular-nums text-[var(--tg-ink)]">
                {progress}%
              </span>
          )}
          <span className="text-xs font-bold text-muted-foreground">
            {completedLessons} of {totalLessons} lessons
          </span>
        </div>
        <GameProgressBar value={progress ?? 0} total={100} label="Course progress" />
      </div>
  )
}

// The original bubble card (a coloured cap with the certification's name as a
// wordmark), kept in one green and with game-kit buttons.
function CourseCard({ course, onOpen, onViewBadge }) {
  const { certification, totalLessons, completedLessons, progress, award } = course
  const state = courseState(course)

  return (
      <BubbleCard
          tone="feather"
          cap="flat"
          body="card"
          icon={state.StateIcon}
          wordmark={getCertificationTitle(certification)}
          eyebrow={certification.department ?? "REBYU Certification Review"}
          className="tg-cat-explain h-full"
          title={
            <button
                type="button"
                onClick={onOpen}
                className="rounded-sm text-left hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tg)]"
            >
              {getCertificationTitle(certification)}
            </button>
          }
          chips={[
            { label: state.status },
            ...(state.badgeEarned ? [{ label: "Badge earned", side: "right" }] : []),
          ]}
          footer={<CourseAction state={state} onOpen={onOpen} onViewBadge={onViewBadge} className="w-full" />}
      >
        <p className="mt-2 line-clamp-2 min-h-[40px] text-sm leading-5 text-muted-foreground">
          {getCertificationDescription(certification)}
        </p>

        <div className="mt-4">
          <CourseProgress progress={progress} completedLessons={completedLessons} totalLessons={totalLessons} />
        </div>

        {state.badgeEarned ? (
            <div className="mt-4 border-t border-[var(--tg-line)] pt-3">
              <EarnedStrip certificationId={certification.certificationId} award={award} onView={onViewBadge} className="" />
            </div>
        ) : (
            <p className="mt-4 flex items-center gap-1.5 truncate border-t border-[var(--tg-line)] pt-3 text-xs font-semibold text-muted-foreground">
              <state.StateIcon className="size-3.5 shrink-0 text-[var(--tg)]" aria-hidden="true" />
              <span className="truncate">{state.line}</span>
            </p>
        )}
      </BubbleCard>
  )
}

/** The row's left tile: the earned badge once there is one, otherwise the state icon. */
function CourseTile({ course, state }) {
  const [badgeFailed, setBadgeFailed] = useState(false)
  const award = course.award
  if (state.badgeEarned && award?.hasBadgeImage !== false && !badgeFailed) {
    return (
        <img
            src={`${certificationBadgeUrl(course.certification.certificationId)}?v=${encodeURIComponent(award.badgeAwardedAt)}`}
            alt={`${getCertificationTitle(course.certification)} badge`}
            onError={() => setBadgeFailed(true)}
            className="hidden size-16 rounded-full border-[3px] border-white bg-white object-cover shadow-[0_0_0_2px_var(--tg),0_6px_14px_-6px_rgba(16,42,37,0.45)] sm:block"
        />
    )
  }
  return (
      <div className="relative hidden size-16 place-items-center overflow-hidden rounded-2xl tg-solid sm:grid">
        <state.StateIcon className="relative size-7 text-white" aria-hidden="true" />
      </div>
  )
}

function CourseRow({ course, onOpen, onViewBadge }) {
  const { certification, totalLessons, completedLessons, progress } = course
  const state = courseState(course)

  return (
      <article className="tg-cat-explain group grid gap-4 rounded-rb-card border-2 border-border bg-card p-4 transition-colors hover:border-[var(--tg)] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-5 sm:p-5">
        <CourseTile course={course} state={state} />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="tg-chip">{state.status}</span>
            {state.badgeEarned ? <span className="tg-pill">Badge earned</span> : null}
            {certification.department ? (
                <span className="truncate text-[11px] font-semibold text-muted-foreground">{certification.department}</span>
            ) : null}
          </div>

          <button
              type="button"
              onClick={onOpen}
              className="mt-1.5 block max-w-full truncate rounded-sm text-left font-rb-display text-2xl font-extrabold leading-tight text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tg)]"
          >
            {getCertificationTitle(certification)}
          </button>

          <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <span className="shrink-0 font-bold text-foreground">{completedLessons} of {totalLessons} lessons</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{state.line}</span>
          </p>

          <div className="mt-2.5 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <GameProgressBar value={progress ?? 0} total={100} label="Course progress" />
            </div>
            {progress == null ? (
                <span className="h-4 w-10 animate-pulse rounded-full bg-[var(--tg-soft)]" aria-label="Progress loading" />
            ) : (
                <span className="w-12 shrink-0 text-right text-sm font-black tabular-nums text-[var(--tg-ink)]">{progress}%</span>
            )}
          </div>

        </div>

        <CourseAction state={state} onOpen={onOpen} onViewBadge={onViewBadge} className="w-full whitespace-nowrap sm:w-48" />
      </article>
  )
}

function AchievementItem({ achievement }) {
  const badge = achievementBadge(achievement)

  return (
      <div className="flex gap-3 py-3">
        <div className="grid size-11 shrink-0 place-items-center overflow-hidden">
          {badge ? (
              <img src={badge} alt="" className="size-full object-contain p-0.5" />
          ) : (
              <Award className="size-5 text-[var(--tg)]" />
          )}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{getAchievementTitle(achievement)}</p>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{getAchievementDescription(achievement)}</p>
        </div>
      </div>
  )
}

export default function LearnerLearningPage() {
  const navigate = useNavigate()
  const { data, searchValue } = useOutletContext()

  const enrolledCertifications = data?.enrolledCertifications ?? []
  const allLessons = data?.lessons ?? []


  const progressQuery = useQuery({
    queryKey: ["learner-certification-progress"],
    queryFn: getLearnerCertificationProgress,
    staleTime: 60_000,
    retry: 1,
  })
  const progressRows = progressQuery.data ?? data?.certificationProgress ?? []

  // Same cache as the badge page, so opening it after this is instant.
  const awardsQuery = useQuery({
    queryKey: ["learner-awards"],
    queryFn: getMyAwards,
    staleTime: 60_000,
    retry: 1,
  })
  const awardByCertification = useMemo(
      () => new Map(
          (Array.isArray(awardsQuery.data) ? awardsQuery.data : [])
              .filter((award) => award?.badgeAwardedAt)
              .map((award) => [String(award.certificationId), award])
      ),
      [awardsQuery.data],
  )

  const achievements = (Array.isArray(data?.achievements) ? data.achievements : [])
      .filter((achievement) => achievement.earned)
      .sort((a, b) => new Date(b.earnedAt ?? 0) - new Date(a.earnedAt ?? 0))

  const [localSearch, setLocalSearch] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("ALL")
  const [selectedStatus, setSelectedStatus] = useState("ALL")
  const [viewMode, setViewMode] = useState(readViewMode)

  const chooseViewMode = (mode) => {
    setViewMode(mode)
    storeViewMode(mode)
  }

  const queryClient = useQueryClient()
  const { openCertification, studyPlanDialog } = useStudyPlanGate()

  const query = (localSearch || searchValue || "").trim().toLowerCase()

  const departments = useMemo(() => {
    return [
      ...new Set(
          enrolledCertifications
              .map((certification) => certification.department)
              .filter(Boolean)
      ),
    ]
  }, [enrolledCertifications])

  const courses = useMemo(() => {
    return enrolledCertifications.map((certification) => {
      const lessons = allLessons.filter(
          (lesson) =>
              String(lesson.certificationId) ===
              String(certification.certificationId)
      )


      const progressRow = findCertificationProgress(
          progressRows,
          certification.certificationId,
      )

      const completedLessons = progressRow?.completedLessons ?? lessons.filter((lesson) => lesson.completed).length
      const totalLessons = progressRow?.totalLessons ?? lessons.length

      const progress = certificationProgressPercent({
        completedLessons,
        totalLessons,
        passedAssessments: progressRow?.passedAssessments ?? 0,
        totalAssessments: progressRow?.totalAssessments ?? 0,
      })


      const knownProgress = progressRow ? progress : null

      const nextLesson =
          lessons.find((lesson) => !lesson.completed) ?? lessons[0] ?? null

      const diagnosticAssessment = getDiagnosticAssessment(certification, data)
      const diagnosticCompleted = isDiagnosticCompleted(certification, data)

      return {
        certification,
        lessons,
        completedLessons,
        totalLessons,
        progress: knownProgress,
        nextLesson,
        diagnosticAssessment,
        diagnosticCompleted,
        award: awardByCertification.get(String(certification.certificationId)) ?? null,
        status: diagnosticCompleted
            ? getCourseStatus(knownProgress, completedLessons)
            : "DIAGNOSTIC REQUIRED",
      }
    })
  }, [allLessons, enrolledCertifications, data, progressRows, awardByCertification])


  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const certification = course.certification

      const matchesSearch =
          !query ||
          getCertificationTitle(certification).toLowerCase().includes(query) ||
          getCertificationDescription(certification).toLowerCase().includes(query) ||
          certification.department?.toLowerCase().includes(query)

      const matchesDepartment =
          selectedDepartment === "ALL" ||
          certification.department === selectedDepartment

      const matchesStatus =
          selectedStatus === "ALL" || course.status === selectedStatus

      return matchesSearch && matchesDepartment && matchesStatus
    })
  }, [courses, query, selectedDepartment, selectedStatus])

  return (
      <div className="rb-hub space-y-6">
        <LearnerPageHeader
            title="My Learning"
        />
        {enrolledCertifications.length === 0 ? (
            <LearnerEmptyState
                icon={BookOpen}
                title="No enrolled certifications yet"
                description="Browse the Certifications page and enroll in a certification review to start learning."
                action={
                  <button type="button" className="tg-btn tg-btn-primary" onClick={() => navigate("/learner/certifications")}>
                    <Search className="size-4" aria-hidden="true" />
                    Browse certifications
                  </button>
                }
            />
        ) : (
            <>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
              <main className="min-w-0 space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <h2 className="text-base font-semibold text-foreground">Enrolled certifications</h2>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-full sm:w-64">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                          value={localSearch}
                          onChange={(event) => setLocalSearch(event.target.value)}
                          placeholder="Search your certifications"
                          aria-label="Search your certifications"
                          className="pl-10"
                      />
                    </div>

                    {departments.length > 1 ? (
                        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                          <SelectTrigger className="min-w-[170px]" aria-label="Department"><SelectValue placeholder="All departments" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">All departments</SelectItem>
                            {departments.map((department) => <SelectItem key={department} value={department}>{department}</SelectItem>)}
                          </SelectContent>
                        </Select>
                    ) : null}

                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="min-w-[170px]" aria-label="Status"><SelectValue placeholder="All statuses" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All statuses</SelectItem>
                        <SelectItem value="DIAGNOSTIC REQUIRED">Diagnostic required</SelectItem>
                        <SelectItem value="IN PROGRESS">In progress</SelectItem>
                        <SelectItem value="READY TO START">Ready to start</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="tg-cat-explain flex gap-1.5" role="group" aria-label="Layout">
                      {[["GRID", Grid2X2, "Grid view"], ["LIST", List, "List view"]].map(([mode, Icon, label]) => (
                          <button
                              key={mode}
                              type="button"
                              onClick={() => chooseViewMode(mode)}
                              aria-pressed={viewMode === mode}
                              aria-label={label}
                              data-tip={label}
                              className={`tg-btn tg-icon-btn ${viewMode === mode ? "tg-btn-primary" : ""}`}
                          >
                            <Icon className="size-4" />
                          </button>
                      ))}
                    </div>
                  </div>
                </div>

                {filteredCourses.length === 0 ? (
                    <LearnerEmptyState
                        icon={Search}
                        title="No certifications found"
                        description="Try another keyword or change your filters."
                        action={
                          <button type="button" className="tg-btn" onClick={() => { setLocalSearch(""); setSelectedDepartment("ALL"); setSelectedStatus("ALL") }}>
                            Clear filters
                          </button>
                        }
                    />
                ) : (
                    <div className={viewMode === "GRID" ? "grid gap-5 sm:grid-cols-2 2xl:grid-cols-3" : "grid gap-3"}>
                      {filteredCourses.map((course) => {
                        const Card = viewMode === "GRID" ? CourseCard : CourseRow
                        return (
                            <Card
                                key={course.certification.certificationId}
                                course={course}
                                onOpen={() => openCertification(course.certification, { diagnosticCompleted: course.diagnosticCompleted })}
                                onViewBadge={() => navigate(`/learner/certifications/${course.certification.certificationId}/certificate`)}
                            />
                        )
                      })}
                    </div>
                )}
              </main>

              <aside className="tg-cat-explain h-fit">
                <section>
                  <header className="flex items-center gap-2.5 pb-1">
                    <span className="tg-badge-icon !size-8"><Trophy className="size-4" aria-hidden="true" /></span>
                    <span className="flex-1 text-base font-semibold text-foreground">Latest achievements</span>
                    <button type="button" className="tg-btn !px-3 !py-1 !text-xs" onClick={() => navigate("/learner/account")}>
                      Show all
                    </button>
                  </header>
                  <div className="divide-y divide-border">
                    {achievements.length > 0 ? (
                        achievements.slice(0, 5).map((achievement, index) => (
                            <AchievementItem
                                key={achievement.code ?? achievement.achievementId ?? `${getAchievementTitle(achievement)}-${index}`}
                                achievement={achievement}
                            />
                        ))
                    ) : (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                          Complete lessons, quizzes and exams to earn achievements.
                        </p>
                    )}
                  </div>
                </section>
              </aside>
            </div>
            </>
        )}

        {studyPlanDialog}
      </div>
  )
}
