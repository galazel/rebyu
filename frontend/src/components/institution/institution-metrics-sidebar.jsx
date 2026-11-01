import { useState } from "react"
import { Link } from "react-router-dom"
import {
  Activity,
  Award,
  BarChart3,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  CreditCard,
  GripHorizontal,
  Mail,
  Search,
  TrendingUp,
  Users,
  X,
} from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const OWNER_METRIC_ITEMS = [
  { id: "ent-members", label: "Members & Certifications", icon: Users, category: "Core" },
  { id: "ent-seats", label: "Seat Allocations", icon: CreditCard, category: "Core" },
  { id: "ent-activity", label: "Live Activity", icon: Activity, category: "Activity" },
  { id: "ent-progress-spread", label: "Readiness Spread", icon: Award, category: "Academics" },
  { id: "ent-departments", label: "Department Benchmarks", icon: Building2, category: "Academics" },
  { id: "ent-trend", label: "Activity Trends", icon: TrendingUp, category: "Activity" },
  { id: "ent-expiring", label: "Access Windows", icon: CalendarDays, category: "Administration" },
  { id: "ent-invites", label: "Invitations", icon: Mail, category: "Administration" },
]

export function InstitutionMetricsSidebar({
  rearranging = false,
  onStartRearranging,
  onFinishRearranging,
}) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredItems = OWNER_METRIC_ITEMS.filter((item) => {
    if (!searchQuery.trim()) return true
    return item.label.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const handleTileClick = (tileId) => {
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
    <aside aria-label="Institution metrics sidebar" className="space-y-4 lg:sticky lg:top-20 lg:self-start">
      {/* Header */}
      <div className="rounded-2xl border border-border/60 bg-card/80 p-3.5 shadow-xs backdrop-blur-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-border/40">
          <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
            <BarChart3 className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Institution Metrics
            </h2>
            <p className="text-[11px] text-muted-foreground/80 font-medium">
              8 Analytical Tiles
            </p>
          </div>
        </div>

        {/* Search */}
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
      </div>

      {/* Tiles navigation list */}
      <div className="rounded-2xl border border-border/60 bg-card/80 p-2 shadow-xs backdrop-blur-xs">
        <div className="relative">
          <div className="flex gap-1.5 overflow-x-auto whitespace-nowrap pb-2 lg:flex-col lg:space-y-1 lg:overflow-visible lg:pb-0 scrollbar-none pr-8 lg:pr-0">
            {filteredItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTileClick(item.id)}
                  className="group flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs font-medium text-foreground hover:bg-muted/70 transition-all min-h-[38px] lg:min-h-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon
                      className="size-3.5 shrink-0 text-muted-foreground opacity-70 group-hover:opacity-100"
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <ChevronRight
                    className="size-3 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all"
                    aria-hidden="true"
                  />
                </button>
              )
            })}
          </div>

          <div
            className="pointer-events-none absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-card via-card/70 to-transparent lg:hidden"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Board Controls */}
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
          Quick Links
        </p>
        <Link
          to="/institution/certifications"
          className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors font-medium"
        >
          <div className="flex items-center gap-2">
            <Award className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <span>Certifications</span>
          </div>
          <ChevronRight className="size-3 text-muted-foreground/60" aria-hidden="true" />
        </Link>
      </div>
    </aside>
  )
}
