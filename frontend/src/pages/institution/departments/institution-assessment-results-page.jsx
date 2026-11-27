import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"

import { ChevronRight, Search, X } from "@/components/icons"
import MemberAttemptReviewSheet from "@/components/institution/member-attempt-review-sheet.jsx"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { getDepartmentAssessmentResults } from "@/services/institutionService.js"

function percent(value) {
  return value == null ? "—" : `${Math.round(Number(value))}%`
}

function StatTile({ label, value, hint }) {
  return (
    <div className="flex min-h-[76px] flex-col justify-between rounded-xl border bg-card px-4 py-3">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      </div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function memberStatus(member) {
  if (member.passed) return { key: "passed", label: "Passed", className: "bg-emerald-600 text-white" }
  if (member.attempts.some((a) => a.status === "SUBMITTED")) {
    return { key: "not_passed", label: "Not passed", className: "bg-rose-600 text-white" }
  }
  if (member.attempts.some((a) => a.status === "IN_PROGRESS")) {
    return { key: "in_progress", label: "In progress", className: "bg-amber-500 text-white" }
  }
  return { key: "not_taken", label: "Not taken", className: "bg-muted text-muted-foreground" }
}

/**
 * A learner can occasionally be returned once for each matching membership record.
 * Results should show a person once, preserving every distinct attempt they have made.
 */
function uniqueMembers(rawMembers) {
  const byMember = new Map()

  rawMembers.forEach((member, index) => {
    const learnerKey = member.learnerId != null
      ? `id:${member.learnerId}`
      : member.email
        ? `email:${String(member.email).trim().toLowerCase()}`
        : `row:${index}`
    const current = byMember.get(learnerKey)

    if (!current) {
      byMember.set(learnerKey, { ...member, attempts: member.attempts ?? [] })
      return
    }

    const attempts = new Map()
    for (const attempt of [...current.attempts, ...(member.attempts ?? [])]) {
      const attemptKey = attempt.attemptId ?? `${attempt.attemptNumber}-${attempt.status}-${attempt.submittedAt ?? ""}`
      attempts.set(attemptKey, attempt)
    }
    const currentBest = Number(current.bestPercentage)
    const nextBest = Number(member.bestPercentage)
    const bestPercentage = Number.isFinite(nextBest) && (!Number.isFinite(currentBest) || nextBest > currentBest)
      ? member.bestPercentage
      : current.bestPercentage

    byMember.set(learnerKey, {
      ...current,
      attempts: [...attempts.values()],
      passed: Boolean(current.passed || member.passed),
      bestPercentage,
    })
  })

  return [...byMember.values()]
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
            ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
            : "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/50"
          : "cursor-default border-dashed text-muted-foreground dark:border-muted-foreground/30"
      )}
    >
      #{attempt.attemptNumber} {submitted ? percent(attempt.percentage) : "…"}
    </button>
  )
}

export default function InstitutionAssessmentResultsPage() {
  const { departmentId, examId } = useParams()
  const [reviewing, setReviewing] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const resultsQuery = useQuery({
    queryKey: ["department-assessment-results", departmentId, examId],
    queryFn: () => getDepartmentAssessmentResults(departmentId, examId),
    staleTime: 30_000,
  })
  const results = resultsQuery.data
  const rawMembers = results?.members ?? []
  const members = useMemo(() => uniqueMembers(rawMembers), [rawMembers])
  const hasDuplicateMembers = members.length !== rawMembers.length
  const metrics = useMemo(() => {
    if (!hasDuplicateMembers) return results

    const attemptedMembers = members.filter((member) =>
      member.attempts.some((attempt) => attempt.status === "SUBMITTED")
    )
    const scores = members
      .map((member) => Number(member.bestPercentage))
      .filter(Number.isFinite)

    return {
      ...results,
      memberCount: members.length,
      attemptedCount: attemptedMembers.length,
      passedCount: members.filter((member) => member.passed).length,
      averageBestPercentage: scores.length
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : null,
    }
  }, [hasDuplicateMembers, members, results])

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return members.filter((member) => {
      if (statusFilter !== "all") {
        const status = memberStatus(member)
        if (status.key !== statusFilter) return false
      }
      if (!q) return true
      const nameMatch = member.name?.toLowerCase().includes(q)
      const emailMatch = member.email?.toLowerCase().includes(q)
      const sectionMatch = member.sectionName?.toLowerCase().includes(q)
      return Boolean(nameMatch || emailMatch || sectionMatch)
    })
  }, [members, searchQuery, statusFilter])

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <div>
        <Link
          to={`/institution/departments?view=assessments&department=${departmentId}`}
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
            <StatTile label="Students" value={metrics.memberCount} />
            <StatTile
              label="Took it"
              value={metrics.attemptedCount}
              hint={`${metrics.memberCount - metrics.attemptedCount} not yet`}
            />
            <StatTile
              label="Passed"
              value={metrics.passedCount}
              hint={metrics.attemptedCount ? `${Math.round((metrics.passedCount / metrics.attemptedCount) * 100)}% of takers` : null}
            />
            <StatTile label="Average best score" value={percent(metrics.averageBestPercentage)} />
          </>
        ) : null}
      </div>

      {!resultsQuery.isLoading && members.length > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">Students</h2>
            <p className="text-xs text-muted-foreground">
              {searchQuery || statusFilter !== "all"
                ? `Showing ${filteredMembers.length} of ${members.length} enrolled student${members.length === 1 ? "" : "s"}`
                : `${members.length} enrolled student${members.length === 1 ? "" : "s"}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1 sm:w-64 sm:flex-initial">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search student, email, section..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-8 text-sm"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[130px] text-xs">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="not_passed">Not passed</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="not_taken">Not taken</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || statusFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                }}
                className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      ) : null}

      <section className="relative overflow-hidden rounded-xl border bg-card">
        <div
          className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-8 bg-gradient-to-l from-card to-transparent sm:hidden"
          aria-hidden="true"
        />

        {resultsQuery.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : members.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">This department has no students yet.</p>
        ) : filteredMembers.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium text-foreground">No students found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {searchQuery
                ? `No students matching "${searchQuery}"${statusFilter !== "all" ? ` with status "${statusFilter.replace("_", " ")}"` : ""}.`
                : `No students with status "${statusFilter.replace("_", " ")}".`}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("")
                setStatusFilter("all")
              }}
              className="mt-3 text-xs"
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            <div className="divide-y sm:hidden">
              {filteredMembers.map((member) => {
                const status = memberStatus(member)
                const latestSubmitted = [...member.attempts].reverse().find((a) => a.status === "SUBMITTED")
                return (
                  <div key={member.learnerId} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          to={`/institution/departments/${departmentId}/learners/${member.learnerId}`}
                          className="truncate text-sm font-semibold text-foreground hover:underline"
                        >
                          {member.name}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          {[member.sectionName, member.email].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <span className={cn("shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold", status.className)}>
                        {status.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs">
                      <span className="text-muted-foreground">Best score</span>
                      <span className="font-bold text-foreground text-sm">{percent(member.bestPercentage)}</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Attempts</span>
                        {latestSubmitted ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline min-h-[32px]"
                            onClick={() =>
                              setReviewing({ learnerId: member.learnerId, name: member.name, attemptId: latestSubmitted.attemptId })
                            }
                          >
                            Latest review <ChevronRight className="size-3.5" />
                          </button>
                        ) : null}
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
                          <span className="text-xs text-muted-foreground">No attempts taken</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="hidden sm:block overflow-x-auto">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_6rem_9.5rem] gap-3 border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
                  <span>Student</span>
                  <span>Attempts (select one to see every answer)</span>
                  <span>Best score</span>
                  <span>Status</span>
                </div>
                <ul className="divide-y">
                  {filteredMembers.map((member) => {
                    const status = memberStatus(member)
                    const latestSubmitted = [...member.attempts].reverse().find((a) => a.status === "SUBMITTED")
                    return (
                      <li
                        key={member.learnerId}
                        className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_6rem_9.5rem] items-center gap-3 px-4 py-3"
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
                              className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:size-7"
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
              </div>
            </div>
          </>
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
