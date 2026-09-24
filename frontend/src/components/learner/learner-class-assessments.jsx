import { Link, useLocation } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { CheckCircle2, ClipboardCheck, Clock } from "@/components/icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { returnState } from "@/lib/assessment-return"
import { getAssessmentTypeLabel } from "@/services/assessmentService.js"
import { getMyClassAssessments } from "@/services/learnerService.js"

/**
 * The assessments the learner's department head has published, on the
 * certification they belong to -- the same treatment announcements get, and
 * from the same place: a department publishes, and it appears here.
 *
 * Renders nothing when the learner is in no department, or their department
 * has published nothing. Most learners are in neither case, and an empty
 * "Class assessments" heading on every certification page would be noise.
 */
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
    <section className="space-y-4" aria-labelledby="class-assessments">
      <div>
        <h2 id="class-assessments" className="flex items-center gap-2 text-2xl font-bold">
          <ClipboardCheck className="size-5 text-primary" aria-hidden="true" />
          Class assessments
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
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
            <Card key={assessment.examId}>
              <CardContent className="flex flex-wrap items-center gap-3 p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="min-w-0 font-semibold text-foreground">{assessment.title}</h3>
                    <Badge variant="outline">
                      {getAssessmentTypeLabel(assessment.examType)}
                    </Badge>
                    {taken ? (
                      <Badge variant={passed ? "secondary" : "outline"} className="gap-1">
                        <CheckCircle2 className="size-3" aria-hidden="true" />
                        {score == null ? "Submitted" : `${Math.round(score)}%`}
                      </Badge>
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
                    {/* The clock the attempt will actually run on: the
                        department head sets it on the assessment, and the
                        attempt expires on it. */}
                    {assessment.durationMinutes ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" aria-hidden="true" />
                        {assessment.durationMinutes} min
                      </span>
                    ) : null}
                    {passMark != null ? <span>{Math.round(passMark)}% to pass</span> : null}
                  </p>
                </div>
                <Button asChild variant={taken ? "outline" : "default"} className="shrink-0">
                  <Link
                    to={`/learner/assessments/${assessment.examId}`}
                    state={returnState(location)}
                  >
                    {inProgress ? "Resume" : taken ? "Take again" : "Start"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

export default LearnerClassAssessments
