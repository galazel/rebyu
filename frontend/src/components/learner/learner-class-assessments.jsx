import { Link, useLocation } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { CheckCircle2, ClipboardCheck, Clock } from "@/components/icons"

import { returnState } from "@/lib/assessment-return"
import { getAssessmentTypeLabel } from "@/services/assessmentService.js"
import { getMyClassAssessments } from "@/services/learnerService.js"

export function LearnerClassAssessments({ certificationId }) {
  const location = useLocation()
  const query = useQuery({
    queryKey: ["learner-class-assessments", certificationId ?? "all"],
    queryFn: () => getMyClassAssessments(certificationId),
    enabled: certificationId == null || Number.isFinite(Number(certificationId)),
    staleTime: 60_000,
    retry: 1,
  })

  const assessments = Array.isArray(query.data) ? query.data : []
  if (query.isLoading || query.isError || assessments.length === 0) {
    return null
  }

  return (
    <section className="tg-cat-explain space-y-3" aria-labelledby="class-assessments">
      <div>
        <h2 id="class-assessments" className="flex items-center gap-2.5 text-lg font-bold text-foreground">
          <span className="tg-badge-icon !size-8 !rounded-lg"><ClipboardCheck className="size-4" aria-hidden="true" /></span>
          Class assessments
        </h2>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Set by your department for this course.
        </p>
      </div>

      <div className="space-y-3">
        {assessments.map((assessment) => {
          const taken = assessment.lastAttemptStatus === "SUBMITTED"
          const inProgress = assessment.lastAttemptStatus === "IN_PROGRESS"
          const score = assessment.lastScore == null ? null : Number(assessment.lastScore)
          const passMark =
            assessment.passingScore == null ? null : Number(assessment.passingScore)
          const passed = taken && score != null && passMark != null && score >= passMark
          return (
            <article key={assessment.examId} className="flex flex-wrap items-center gap-3 rounded-[1rem] border border-[var(--tg-line)] bg-card p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="min-w-0 font-semibold text-foreground">{assessment.title}</h3>
                    <span className="tg-chip">
                      {getAssessmentTypeLabel(assessment.examType)}
                    </span>
                    {taken ? (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${passed ? "bg-[var(--tg)] text-white" : "bg-muted text-muted-foreground"}`}>
                        <CheckCircle2 className="size-3" aria-hidden="true" />
                        {score == null ? "Submitted" : `${Math.round(score)}%`}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {assessment.departmentName ? <span>{assessment.departmentName}</span> : null}
                    {assessment.totalQuestions ? (
                      <span>
                        {assessment.totalQuestions} question
                        {assessment.totalQuestions === 1 ? "" : "s"}
                      </span>
                    ) : null}
                    {assessment.durationMinutes ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" aria-hidden="true" />
                        {assessment.durationMinutes} min
                      </span>
                    ) : null}
                    {passMark != null ? <span>{Math.round(passMark)}% to pass</span> : null}
                  </p>
                </div>
                <Link
                  to={`/learner/assessments/${assessment.examId}`}
                  state={returnState(location)}
                  className={`tg-btn shrink-0 ${taken ? "" : "tg-btn-primary"}`}
                >
                  {inProgress ? "Resume" : taken ? "Take again" : "Start"}
                </Link>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default LearnerClassAssessments
