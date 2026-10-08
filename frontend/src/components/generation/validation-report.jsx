import { AlertTriangle, CheckCircle2, Info } from "@/components/icons"
import { Badge } from "@/components/ui/badge"

export function ValidationReport({ report }) {
  if (!report) return null

  const issues = report.issues ?? []
  const errors = issues.filter((issue) => issue.severity === "ERROR")
  const warnings = issues.filter((issue) => issue.severity === "WARNING")

  if (!issues.length) {
    return (
      <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="size-4" />
        Automated checks passed.
      </p>
    )
  }

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Automated checks</span>
        {errors.length ? <Badge variant="destructive">{errors.length} error{errors.length > 1 ? "s" : ""}</Badge> : null}
        {warnings.length ? <Badge variant="outline">{warnings.length} warning{warnings.length > 1 ? "s" : ""}</Badge> : null}
        <span className="text-xs text-muted-foreground">advisory — you can still approve</span>
      </div>
      <ul className="space-y-1.5">
        {[...errors, ...warnings].map((issue, i) => (
          <li key={`${issue.code}-${i}`} className="flex items-start gap-2 text-xs">
            {issue.severity === "ERROR" ? (
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
            ) : (
              <Info className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            )}
            <span>
              <span className="font-mono text-[11px] text-muted-foreground">{issue.code}</span>{" "}
              {issue.message}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
