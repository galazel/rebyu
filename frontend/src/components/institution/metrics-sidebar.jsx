import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  AlertTriangle,
  Award,
  BarChart3,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDownIcon,
  ClipboardListIcon,
  CreditCard,
  GraduationCap,
  GripHorizontal,
  History,
  Layers,
  MailIcon,
  Search,
  ShieldCheck,
  TargetIcon,
  UsersRound,
  X,
} from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export const METRIC_GROUPS = [
  {
    category: "Academics",
    items: [
      { id: "dept-progress", label: "Progress & Coverage", icon: TargetIcon },
      { id: "dept-completion-spread", label: "Readiness & Spread", icon: Award },
      { id: "dept-hard-topics", label: "Challenging Topics", icon: AlertTriangle },
      { id: "dept-hard-assessments", label: "Assessment Pass Rates", icon: ClipboardListIcon },
      { id: "dept-period-comparison", label: "Period Comparison", icon: History },
    ],
  },
  {
    category: "Programs & Cohorts",
    items: [
      { id: "dept-programme-enrolment", label: "Program Enrolment", icon: GraduationCap },
      { id: "dept-programme-table", label: "Program Breakdown", icon: Layers },
      { id: "dept-section-breakdown", label: "Sections & Cohorts", icon: Layers },
    ],
  },
  {
    category: "Management & Directory",
    items: [
      { id: "dept-learner-table", label: "Learner Directory", icon: UsersRound },
      { id: "dept-co-authorities", label: "Co-Authorities", icon: ShieldCheck },
      { id: "dept-announcements", label: "Announcements", icon: MailIcon },
      { id: "dept-invoices", label: "Invoices & Seats", icon: CreditCard },
    ],
  },
]

export function MetricsSidebar({
  activeTileId = null,
  collapsedTiles = {},
  onExpandTile,
  areAllCollapsed = false,
  onToggleAllCollapse,
  rearranging = false,
  onStartRearranging,
  onFinishRearranging,
  activeCategory = "all",
  onSelectCategory,
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

  const handleTileClick = (tileId) => {
    if (collapsedTiles[tileId] && onExpandTile) {
      onExpandTile(tileId)
    }
    const element = document.getElementById(tileId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" })
      element.classList.add("ring-2", "ring-primary", "ring-offset-2")
      setTimeout(() => {
        element.classList.remove("ring-2", "ring-primary", "ring-offset-2")
      }, 1500)
    }
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
                12 Analytical Cards
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggleAllCollapse}
            className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground font-semibold gap-1"
            title={areAllCollapsed ? "Expand all tiles" : "Collapse all tiles"}
          >
            <ChevronsUpDownIcon className="size-3" aria-hidden="true" />
            <span>{areAllCollapsed ? "Expand" : "Collapse"}</span>
          </Button>
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
          {["all", "Academics", "Programs & Cohorts", "Management & Directory"].map((cat) => {
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

      {/* Metric Items List: Horizontal scroll on mobile, grouped vertical on desktop */}
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
                    const isCollapsed = Boolean(collapsedTiles[item.id])
                    const isFocused = activeTileId === item.id

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleTileClick(item.id)}
                        className={cn(
                          "group flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs font-medium transition-all min-h-[38px] lg:min-h-0",
                          isFocused
                            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                            : "text-foreground hover:bg-muted/70"
                        )}
                        title={`Jump to ${item.label}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon
                            className={cn(
                              "size-3.5 shrink-0 transition-opacity",
                              isFocused ? "text-primary-foreground opacity-90" : "text-muted-foreground opacity-70 group-hover:opacity-100"
                            )}
                            aria-hidden="true"
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "hidden xl:inline-flex text-[9px] px-1 py-0 h-3.5 uppercase tracking-wider font-semibold border-border/50",
                            isCollapsed
                              ? "bg-muted/40 text-muted-foreground"
                              : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                          )}
                        >
                          {isCollapsed ? "closed" : "active"}
                        </Badge>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Right fade indicator on mobile scroll */}
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-card via-card/70 to-transparent lg:hidden"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Board Layout Controls in Sidebar */}
      <div className="hidden lg:block rounded-2xl border border-border/60 bg-muted/20 p-3 space-y-2 text-xs">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Board Customization
        </p>
        {rearranging ? (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onFinishRearranging}
            className="w-full h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 justify-center"
          >
            <Check className="size-3.5" aria-hidden="true" />
            <span>Save Tile Order</span>
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onStartRearranging}
            className="w-full h-8 text-xs font-semibold gap-1.5 justify-center hover:bg-muted"
          >
            <GripHorizontal className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <span>Rearrange Dashboard</span>
          </Button>
        )}
      </div>

      {/* Quick Links */}
      <div className="hidden lg:block rounded-2xl border border-border/60 bg-card/60 p-3 space-y-1.5 text-xs">
        <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Department Portal
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
        <Link
          to="/institution/programs"
          className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors font-medium"
        >
          <div className="flex items-center gap-2">
            <GraduationCap className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <span>Programs</span>
          </div>
          <ChevronRight className="size-3 text-muted-foreground/60" aria-hidden="true" />
        </Link>
      </div>
    </aside>
  )
}
