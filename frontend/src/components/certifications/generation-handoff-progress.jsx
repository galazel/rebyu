import { CheckCircle2, Loader2, Sparkles } from "@/components/icons"
import { cn } from "@/lib/utils"

export function GenerationHandoffProgress({ phase, uploadPercent, fileCount }) {
  if (phase === "idle") return null

  const steps = [
    {
      key: "upload",
      label:
        uploadPercent > 0 && uploadPercent < 100
          ? `Uploading ${fileCount} ${fileCount === 1 ? "document" : "documents"} — ${uploadPercent}%`
          : `Uploading ${fileCount} ${fileCount === 1 ? "document" : "documents"}`,
      done: phase !== "uploading",
      active: phase === "uploading",
    },
    {
      key: "processing",
      label: "Storing and indexing your source material",
      done: phase === "queued",
      active: phase === "processing",
    },
    {
      key: "queued",
      label: "Queuing the curriculum build",
      done: false,
      active: phase === "queued",
    },
  ]

  return (
    <div className="rounded-xl border bg-muted/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <span className="text-sm font-medium">Starting AI generation</span>
      </div>

      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        {phase === "uploading" ? (
          <div
            className="h-full rounded-full bg-primary transition-all duration-200"
            style={{ width: `${uploadPercent}%` }}
          />
        ) : (
          <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
        )}
      </div>

      <ul className="space-y-1.5">
        {steps.map((step) => (
          <li key={step.key} className="flex items-center gap-2 text-xs">
            {step.done ? (
              <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : step.active ? (
              <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />
            ) : (
              <span className="size-3.5 shrink-0 rounded-full border border-muted-foreground/40" />
            )}
            <span
              className={cn(
                step.active && "font-medium text-foreground",
                !step.active && !step.done && "text-muted-foreground",
                step.done && "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-muted-foreground">
        Generation itself runs in the background — you'll be taken to its live
        timeline, and you can leave that page and come back at any time.
      </p>
    </div>
  )
}
