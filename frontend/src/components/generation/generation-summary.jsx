import { CheckCircle2 } from "@/components/icons"

/** The summary a finished run reports on its `workflow.completed` event. */
export function findGenerationSummary(events) {
  for (let index = (events?.length ?? 0) - 1; index >= 0; index -= 1) {
    const event = events[index]
    if (event?.event_type === "workflow.completed") return event.payload?.summary ?? null
  }
  return null
}

function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`
}

/**
 * What the run built, shown once it completes: the outline, each assessment
 * with its question count, what the duplicate review did, and what was saved.
 */
export function GenerationSummary({ summary }) {
  if (!summary) return null
  const { outline = {}, assessments = [], duplicates = {}, saved = {} } = summary
  const built = assessments.filter((row) => row.items > 0 || row.questions > 0)

  return (
    <section className="space-y-4 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.05] p-4">
      <header className="flex items-start gap-2.5">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">Generation summary</h3>
          <p className="text-sm text-muted-foreground">
            {plural(outline.majors ?? 0, "major category")} · {plural(outline.middles ?? 0, "middle category")} ·{" "}
            {plural(outline.lessons ?? 0, "lesson")} · {plural(summary.total_questions ?? 0, "question")} in all
          </p>
        </div>
      </header>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th className="pb-1.5 font-medium">Assessment</th>
            <th className="pb-1.5 text-right font-medium">Count</th>
            <th className="pb-1.5 text-right font-medium">Questions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {built.map((row) => (
            <tr key={row.label}>
              <td className="py-1.5 text-foreground">{row.label}</td>
              <td className="py-1.5 text-right font-mono tabular-nums text-muted-foreground">{row.items}</td>
              <td className="py-1.5 text-right font-mono tabular-nums text-foreground">
                {row.questions}
                {row.target && row.target !== row.questions ? (
                  <span className="ml-1 text-xs text-amber-600 dark:text-amber-400">of {row.target}</span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Duplicate groups found</dt>
          <dd className="font-mono tabular-nums">{duplicates.groups ?? 0}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Replaced / kept</dt>
          <dd className="font-mono tabular-nums">
            {duplicates.replaced ?? 0} / {duplicates.kept ?? 0}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Saved as drafts</dt>
          <dd className="text-right">
            {plural(saved.exams ?? 0, "assessment")}, {plural(saved.bank_questions ?? 0, "bank question")}
          </dd>
        </div>
        {saved.warnings ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Save warnings</dt>
            <dd className="font-mono tabular-nums text-amber-600 dark:text-amber-400">{saved.warnings}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  )
}
