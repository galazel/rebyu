import AssessmentTimerSettings from "@/components/assessments/admin/assessment-timer-settings.jsx"

export default function AssessmentTimersPage() {
  return (
    <main className="h-full overflow-y-auto bg-muted/20 px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <header>
          <h1 className="text-xl font-bold">Assessment timers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage timing for lesson quizzes, middle exams, and major exams.
          </p>
        </header>
        <AssessmentTimerSettings />
      </div>
    </main>
  )
}
