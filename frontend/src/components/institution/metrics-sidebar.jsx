import {
  AlertTriangle,
  Award,
  ChevronRight,
  ClipboardListIcon,
  GraduationCap,
  History,
  Layers,
  TargetIcon,
} from "@/components/icons"
import { cn } from "@/lib/utils"

function TrendIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  )
}

export const METRIC_GROUPS = [
  {
    category: "Pacing",
    items: [
      { id: "dept-progress", label: "Progress & pass rate", icon: TargetIcon },
      { id: "dept-monthly-trend", label: "Activity over time", icon: TrendIcon },
      { id: "dept-period-comparison", label: "Period comparison", icon: History },
    ],
  },
  {
    category: "Programmes",
    items: [
      { id: "dept-programme-enrolment", label: "Enrolment", icon: GraduationCap },
      { id: "dept-programme-table", label: "Scorecard", icon: Layers },
    ],
  },
  {
    category: "Teaching signals",
    items: [
      { id: "dept-completion-spread", label: "Readiness & spread", icon: Award },
      { id: "dept-hard-topics", label: "Challenging topics", icon: AlertTriangle },
      { id: "dept-hard-assessments", label: "Hardest assessments", icon: ClipboardListIcon },
    ],
  },
]

export function MetricsSidebar({ activeFeature = "dept-progress", onSelectFeature }) {
  return (
    <aside aria-label="Metrics" className="lg:sticky lg:top-20 lg:self-start">
      <nav className="rounded-2xl border border-border/60 bg-card/80 p-2 shadow-xs">
        <div className="flex gap-1.5 overflow-x-auto whitespace-nowrap pb-1 scrollbar-none lg:flex-col lg:space-y-3 lg:overflow-visible lg:pb-0">
          {METRIC_GROUPS.map((group) => (
            <div key={group.category} className="space-y-1">
              <p className="hidden px-2.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 lg:block">
                {group.category}
              </p>
              <div className="flex gap-1.5 lg:flex-col lg:gap-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = activeFeature === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => onSelectFeature?.(item.id)}
                      className={cn(
                        "group flex min-h-[38px] items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-medium transition-all lg:min-h-0",
                        isActive
                          ? "bg-primary font-semibold text-primary-foreground shadow-xs"
                          : "text-foreground hover:bg-muted/70"
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Icon
                          className={cn("size-3.5 shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground")}
                          aria-hidden="true"
                        />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {isActive ? <ChevronRight className="hidden size-3.5 shrink-0 opacity-80 lg:block" aria-hidden="true" /> : null}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </aside>
  )
}
