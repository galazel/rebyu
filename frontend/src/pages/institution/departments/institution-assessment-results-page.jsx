import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"

import { ChevronRight } from "@/components/icons"
import MemberAttemptReviewSheet from "@/components/institution/member-attempt-review-sheet.jsx"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { getDepartmentAssessmentResults } from "@/services/institutionService.js"

function percent(value) {
  return value == null ? "—" : `${Math.round(Number(value))}%`
}

function StatTile({ label, value, hint }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function memberStatus(member) {
  if (member.passed) return { label: "Passed", className: "bg-emerald-600 text-white" }
  if (member.attempts.some((a) => a.status === "SUBMITTED")) {
    return { label: "Not passed", className: "bg-rose-600 text-white" }
  }
  if (member.attempts.some((a) => a.status === "IN_PROGRESS")) {
    return { label: "In progress", className: "bg-amber-500 text-white" }
  }
  return { label: "Not taken", className: "bg-muted text-muted-foreground" }
}

function AttemptChip({ attempt, onOpen }) {
  const submitted = attempt.status === "SUBMITTED"
  return (
    <button
      type="button"
      disabled={!submitted}
      onClick={onOpen}
      title={
        submitted
          ? `Attempt ${attempt.attemptNumber}: ${attempt.correctCount ?? 0} of ${attempt.itemCount ?? 0} correct${
              attempt.submittedAt ? ` · ${new Date(attempt.submittedAt).toLocaleString()}` : ""
            }`
          : `Attempt ${attempt.attemptNumber}: ${attempt.status.toLowerCase().replace("_", " ")}`
      }
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition",
        submitted
          ? attempt.passed
            ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            : "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100"
          : "cursor-default border-dashed text-muted-foreground"
      )}
    >
      #{attempt.attemptNumber} {submitted ? percent(attempt.percentage) : "…"}
    </button>
  )
}

export default function InstitutionAssessmentResultsPage() {
  const { departmentId, examId } = useParams()
  const [reviewing, setReviewing] = useState(null)

  const resultsQuery = useQuery({
    queryKey: ["department-assessment-results", departmentId, examId],
    queryFn: () => getDepartmentAssessmentResults(departmentId, examId),
    staleTime: 30_000,
  })
  const results = resultsQuery.data
  const members = results?.members ?? []

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <div>
        <Link
          to={`/institution/departments/${departmentId}?tab=assessments`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to assessments
        </Link>
        {resultsQuery.isLoading ? (
          <Skeleton className="mt-3 h-8 w-80" />
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-bold text-foreground">{results?.title ?? "Assessment results"}</h1>
            {results?.examType ? <Badge variant="outline">{results.examType.replaceAll("_", " ")}</Badge> : null}
            {results?.status && results.status !== "PUBLISHED" ? (
              <Badge variant="secondary">{results.status.toLowerCase()}</Badge>
            ) : null}
          </div>
        )}
        {results ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {results.totalQuestions ?? 0} questions
            {results.durationMinutes ? ` · ${results.durationMinutes} min` : ""}
            {results.passingScore != null ? ` · ${Number(results.passingScore)}% to pass` : ""}
          </p>
        ) : null}
      </div>

      {resultsQuery.isError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          These results could not be loaded.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {resultsQuery.isLoading ? (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-20 w-full" />)
        ) : results ? (
          <>
            <StatTile label="Students" value={results.memberCount} />
            <StatTile
              label="Took it"
              value={results.attemptedCount}
              hint={`${results.memberCount - results.attemptedCount} not yet`}
            />
            <StatTile
              label="Passed"
              value={results.passedCount}
              hint={results.attemptedCount ? `${Math.round((results.passedCount / results.attemptedCount) * 100)}% of takers` : null}
            />
            <StatTile label="Average best score" value={percent(results.averageBestPercentage)} />
          </>
        ) : null}
      </div>

      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,2fr)_6rem_9.5rem] gap-3 border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground md:grid">
          <span>Student</span>
          <span>Attempts (select one to see every answer)</span>
          <span>Best score</span>
          <span>Status</span>
        </div>
        {resultsQuery.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : members.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">This department has no students yet.</p>
        ) : (
          <ul className="divide-y">
            {members.map((member) => {
              const status = memberStatus(member)
              const latestSubmitted = [...member.attempts].reverse().find((a) => a.status === "SUBMITTED")
              return (
                <li
                  key={member.learnerId}
                  className="grid gap-2 px-4 py-3 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_6rem_9.5rem] md:items-center md:gap-3"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/institution/departments/${departmentId}/learners/${member.learnerId}`}
                      className="truncate text-sm font-medium text-foreground hover:underline"
                    >
                      {member.name}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {[member.sectionName, member.email].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {member.attempts.length ? (
                      member.attempts.map((attempt) => (
                        <AttemptChip
                          key={attempt.attemptId}
                          attempt={attempt}
                          onOpen={() => setReviewing({ learnerId: member.learnerId, name: member.name, attemptId: attempt.attemptId })}
                        />
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">No attempts</span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-foreground">{percent(member.bestPercentage)}</div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", status.className)}>{status.label}</span>
                    {latestSubmitted ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`See ${member.name}'s latest attempt`}
                        onClick={() =>
                          setReviewing({ learnerId: member.learnerId, name: member.name, attemptId: latestSubmitted.attemptId })
                        }
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <MemberAttemptReviewSheet
        departmentId={departmentId}
        learnerId={reviewing?.learnerId}
        learnerName={reviewing?.name}
        attemptId={reviewing?.attemptId ?? null}
        onOpenChange={(open) => {
          if (!open) setReviewing(null)
        }}
      />
    </div>
  )
}
