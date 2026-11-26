import { withInlineMath } from "@/components/certifications/math.jsx"
import { AuthedImage } from "@/lib/authed-media.jsx"
import { cn } from "@/lib/utils"

const statusStyles = {
  "Full credit": "bg-rb-leaf-wash text-rb-leaf-lip",
  "Partial credit": "bg-rb-fox-wash text-rb-fox-lip",
  "No credit": "bg-rb-cardinal-wash text-rb-cardinal-lip",
  "Awaiting review": "bg-rb-fox-wash text-rb-fox-lip",
  "Marking…": "bg-rb-fox-wash text-rb-fox-lip",
}

export default function SubQuestionReview({ subQuestions, pending, marking, invalid, showUnanswered = true }) {
  if (!subQuestions?.length) return null

  return (
    <section aria-label="Sub-questions" className="space-y-2 text-sm">
      <h3 className="font-bold text-foreground">Sub-questions</h3>
      <ol className="space-y-2.5">
        {subQuestions.map((sub, index) => {
          const earned = Number(sub.earnedPoints)
          const max = Number(sub.maxPoints)
          const scored = !invalid && sub.earnedPoints != null && Number.isFinite(earned) && Number.isFinite(max) && max > 0
          const response = sub.learnerAnswer?.trim()
          let status = "Not graded"
          if (invalid) status = "Voided"
          else if (scored) status = earned >= max ? "Full credit" : earned > 0 ? "Partial credit" : "No credit"
          else if (pending && response) status = marking ? "Marking…" : "Awaiting review"

          return (
            <li key={sub.subQuestionId} className="space-y-2 rounded-xl border border-[var(--tg-line)] bg-card p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="min-w-0 flex-1 basis-56 font-semibold text-foreground">
                  <span className="mr-1.5 text-muted-foreground">{index + 1}.</span>
                  {withInlineMath(sub.questionText)}
                </p>
                <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", statusStyles[status] ?? "bg-muted text-muted-foreground")}>
                    {status}
                  </span>
                  {scored && <span className="text-xs font-semibold tabular-nums text-muted-foreground">{earned} / {max} pts</span>}
                </div>
              </div>
              <AuthedImage imageKey={sub.questionImageKey} alt="Sub-question reference" zoomable className="max-h-64 w-auto rounded-lg border bg-white" />
              {(response || showUnanswered || scored) && (
                <div className="whitespace-pre-wrap break-words rounded-lg bg-muted/50 p-2.5">
                  {response ? <><p className="font-medium">Your answer</p><p>{withInlineMath(response)}</p></> : "No answer submitted."}
                </div>
              )}
              {sub.feedback && <p className="whitespace-pre-wrap text-muted-foreground">{withInlineMath(sub.feedback)}</p>}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
