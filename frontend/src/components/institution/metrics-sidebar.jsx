import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  AlertTriangle,
  Award,
  BarChart3,
  Building2,
  Check,
  ChevronRight,
  ChevronsUpDownIcon,
  ClipboardListIcon,
  GraduationCap,
  GripHorizontal,
  History,
  Layers,
  Search,
  TargetIcon,
  X,
} from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export const METRIC_GROUPS = [
  {
    category: "Curriculum Pacing",
    items: [
      { id: "dept-progress", label: "Progress & Coverage", icon: TargetIcon },
      { id: "dept-period-comparison", label: "Period Comparison", icon: History },
    ],
  },
  {
    category: "Programme Health",
    items: [
      { id: "dept-programme-enrolment", label: "Programme Enrolment", icon: GraduationCap },
      { id: "dept-programme-table", label: "Programme Scorecard", icon: Layers },
    ],
  },
  {
    category: "Teaching Signals",
    items: [
      { id: "dept-completion-spread", label: "Readiness & Spread", icon: Award },
      { id: "dept-hard-topics", label: "Challenging Topics", icon: AlertTriangle },
      { id: "dept-hard-assessments", label: "Assessment Pass Rates", icon: ClipboardListIcon },
    ],
  },
]

export function MetricsSidebar({
  activeFeature = "dept-progress",
  onSelectFeature,
  activeCategory = "all",
  onSelectCategory = () => {},
}) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredGroups = useMemo(() => {
    return METRIC_GROUPS.map((group) => {
      if (activeCategory !== "all" && group.category !== activeCategory) {
        return { ...group, items: [] }
      }
      if (!searchQuery.trim()) return group
      const q = searchQuery.toLowerCase()
      const items = group.items.filter((item) => item.label.toLowerCase().includes(q))
      return { ...group, items }
    }).filter((group) => group.items.length > 0)
  }, [activeCategory, searchQuery])

  const handleItemClick = (featureId) => {
    onSelectFeature?.(featureId)
  }

  return (
    <aside aria-label="Metrics navigation sidebar" className="space-y-4 lg:sticky lg:top-20 lg:self-start">
      {/* Sidebar Header Card */}
      <div className="rounded-2xl border border-border/60 bg-card/80 p-3.5 shadow-xs backdrop-blur-xs space-y-3">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <BarChart3 className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Metrics Index
              </h2>
              <p className="text-[11px] text-muted-foreground/80 font-medium">
                7 Analytics Features
              </p>
            </div>
          </div>
        </div>

        {/* Quick Search inside metrics */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/70" />
          <Input
            type="text"
            placeholder="Find metric..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 pr-7 text-xs bg-muted/20 border-border/60 focus-visible:bg-background"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              aria-label="Clear search"
            >
              <X className="size-3" />
            </button>
          ) : null}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1 text-[11px]">
          {["all", "Curriculum Pacing", "Programme Health", "Teaching Signals"].map((cat) => {
            const label = cat === "all" ? "All" : cat.split(" ")[0]
            const active = activeCategory === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={cn(
                  "px-2 py-0.5 rounded-md font-medium transition-colors",
                  active
                    ? "bg-foreground/10 text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Metric Items List */}
      <div className="rounded-2xl border border-border/60 bg-card/80 p-2 shadow-xs backdrop-blur-xs">
        <div className="relative">
          <div className="flex gap-1.5 overflow-x-auto whitespace-nowrap pb-2 lg:flex-col lg:space-y-3 lg:overflow-visible lg:pb-0 scrollbar-none pr-8 lg:pr-0">
            {filteredGroups.map((group) => (
              <div key={group.category} className="space-y-1">
                <p className="hidden lg:block px-2.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  {group.category}
                </p>
                <div className="flex gap-1.5 lg:flex-col lg:space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const isActive = activeFeature === item.id

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleItemClick(item.id)}
                        className={cn(
                          "group flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs font-medium transition-all min-h-[38px] lg:min-h-0",
                          isActive
                            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                            : "text-foreground hover:bg-muted/70"
                        )}
                        title={`Open ${item.label}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon
                            className={cn(
                              "size-3.5 shrink-0 transition-opacity",
                              isActive ? "text-primary-foreground opacity-100" : "text-muted-foreground opacity-70 group-hover:opacity-100"
                            )}
                            aria-hidden="true"
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {isActive && (
                          <ChevronRight className="size-3.5 shrink-0 opacity-80" aria-hidden="true" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div
            className="pointer-events-none absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-card via-card/70 to-transparent lg:hidden"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="hidden lg:block rounded-2xl border border-border/60 bg-card/60 p-3 space-y-1.5 text-xs">
        <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Management
        </p>
        <Link
          to="/institution/departments"
          className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors font-medium"
        >
          <div className="flex items-center gap-2">
            <Building2 className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <span>Department Management</span>
          </div>
          <ChevronRight className="size-3 text-muted-foreground/60" aria-hidden="true" />
        </Link>
      </div>
    </aside>
  )
}
