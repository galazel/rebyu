import { ChevronDown } from "@/components/icons"

const KICKER_TONES = {
  // Academic / Pacing / Curriculum / Teaching
  curriculum: "bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40",
  academic: "bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40",
  pacing: "bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40",
  teaching: "bg-teal-50 text-teal-700 border-teal-200/70 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/40",

  // Capacity / Enrolment / Cohort
  capacity: "bg-sky-50 text-sky-700 border-sky-200/70 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40",
  enrolment: "bg-sky-50 text-sky-700 border-sky-200/70 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40",
  cohort: "bg-sky-50 text-sky-700 border-sky-200/70 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40",

  // Signals / Intervention / Risk / Assessment
  risk: "bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40",
  signal: "bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40",
  assessment: "bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40",

  // Health / Scorecard / Credentials / Performance
  health: "bg-indigo-50 text-indigo-700 border-indigo-200/70 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/40",
  scorecard: "bg-indigo-50 text-indigo-700 border-indigo-200/70 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/40",
  performance: "bg-indigo-50 text-indigo-700 border-indigo-200/70 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/40",

  // Roster / Management / Sections / Analytics
  roster: "bg-purple-50 text-purple-700 border-purple-200/70 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40",
  analytics: "bg-blue-50 text-blue-700 border-blue-200/70 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40",
  management: "bg-slate-50 text-slate-700 border-slate-200/70 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-800/40",
}

function resolveKickerTone(kicker, tone) {
  if (tone && KICKER_TONES[tone]) return KICKER_TONES[tone]
  if (!kicker) return KICKER_TONES.curriculum
  const lower = kicker.toLowerCase()
  for (const [key, className] of Object.entries(KICKER_TONES)) {
    if (lower.includes(key)) return className
  }
  return "bg-primary/10 text-primary border-primary/20 dark:bg-primary/15 dark:text-primary dark:border-primary/30"
}

/**
 * CollapsedMetricCard
 * Implements the card preview required for metric tiles when collapsed:
 * - Top row: Refined icon badge (left) + Semantic category kicker pill (right) + subtle expand affordance
 * - Title: Clean sans-serif heading with natural weight and tight tracking
 * - Description: Clear explanation of the metric scope
 * - Preview Metric: Glanceable micro-stats chip displaying live data even when collapsed
 * - Bottom action bar: Sleek, lightweight affordance with "Expand Metrics" label and chevron
 */
export function CollapsedMetricCard({
  icon: Icon,
  kicker,
  tone,
  title,
  description,
  previewMetric = null,
  previewAlert = false,
  onExpand,
  actionLabel = "Expand",
  className = "",
}) {
  const kickerClass = resolveKickerTone(kicker, tone)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onExpand}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onExpand?.()
        }
      }}
      className={`group relative flex w-full min-h-[58px] items-center justify-between gap-3 rounded-[inherit] bg-card p-3 sm:px-4 sm:py-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer select-none transition-all duration-200 hover:bg-muted/30 overflow-hidden ${className}`}
    >
      {/* Left side: Icon badge + Title & Live Metric */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/15 shadow-2xs transition-all duration-200 group-hover:bg-primary/15 group-hover:border-primary/25 group-hover:scale-105">
          {Icon && <Icon className="size-4.5" aria-hidden="true" />}
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="card-title font-sans text-sm font-semibold text-foreground leading-snug tracking-tight group-hover:text-primary transition-colors truncate">
              {title}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {previewMetric ? (
              <span
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-sans text-[11px] font-semibold tabular-nums truncate max-w-full ${
                  previewAlert
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    : "border-border/60 bg-muted/40 text-foreground dark:bg-muted/20"
                }`}
              >
                <span
                  className={`size-1.5 rounded-full shrink-0 ${
                    previewAlert ? "bg-amber-500 animate-pulse" : "bg-primary/70"
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">{previewMetric}</span>
              </span>
            ) : description ? (
              <p className="font-sans text-xs text-muted-foreground truncate leading-normal">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Right side: Kicker pill + Expand Chevron button */}
      <div className="flex items-center gap-2 shrink-0">
        {kicker && (
          <span className={`hidden md:inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${kickerClass}`}>
            {kicker}
          </span>
        )}
        <div
          className="flex h-7.5 items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-2.5 text-[11px] font-semibold text-muted-foreground transition-all duration-200 group-hover:bg-primary/10 group-hover:border-primary/30 group-hover:text-primary shadow-2xs"
          aria-hidden="true"
        >
          <span className="hidden sm:inline">{actionLabel}</span>
          <ChevronDown className="size-3.5 transition-transform duration-200 group-hover:translate-y-0.5" />
        </div>
      </div>
    </div>
  )
}
