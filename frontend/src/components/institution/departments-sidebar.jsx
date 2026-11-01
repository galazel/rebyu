import { useMemo } from "react"
import { Link } from "react-router-dom"
import {
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronRight,
  Filter,
  GraduationCap,
  Layers,
  Search,
  UsersRound,
  X,
} from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export function DepartmentsSidebar({
  departments = [],
  selectedDepartmentId = null,
  onSelectDepartment,
  searchQuery = "",
  onSearchChange,
  statusFilter = "all",
  onStatusFilterChange,
}) {
  const stats = useMemo(() => {
    const totalDepartments = departments.length
    const totalSlots = departments.reduce((acc, d) => acc + (d.totalSlots ?? 0), 0)
    const usedSlots = departments.reduce((acc, d) => acc + (d.usedSlots ?? 0), 0)
    const utilizationRate = totalSlots > 0 ? Math.round((usedSlots / totalSlots) * 100) : 0
    return { totalDepartments, totalSlots, usedSlots, utilizationRate }
  }, [departments])

  const itemClass = (active) =>
    cn(
      "group relative flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition-all min-h-[44px] lg:min-h-0",
      active
        ? "bg-primary text-primary-foreground shadow-xs font-semibold"
        : "text-foreground hover:bg-muted/70 hover:text-foreground"
    )

  return (
    <aside aria-label="Departments sidebar" className="space-y-4 lg:sticky lg:top-20 lg:self-start">
      {/* Sidebar Header */}
      <div className="rounded-2xl border border-border/60 bg-card/80 p-3.5 shadow-xs backdrop-blur-xs space-y-3">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Departments
              </h2>
              <p className="text-[11px] text-muted-foreground/80 font-medium">
                {departments.length} assigned
              </p>
            </div>
          </div>
          {selectedDepartmentId != null ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectDepartment(null)}
              className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
              title="View all departments"
            >
              Reset
            </Button>
          ) : null}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/70" />
          <Input
            type="text"
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 pl-8 pr-7 text-xs bg-muted/20 border-border/60 focus-visible:bg-background"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              aria-label="Clear search"
            >
              <X className="size-3" />
            </button>
          ) : null}
        </div>

        {/* Quick filter pills */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={() => onStatusFilterChange("all")}
            className={cn(
              "px-2 py-0.5 rounded-md font-medium transition-colors",
              statusFilter === "all"
                ? "bg-foreground/10 text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange("available")}
            className={cn(
              "px-2 py-0.5 rounded-md font-medium transition-colors",
              statusFilter === "available"
                ? "bg-foreground/10 text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            Available slots
          </button>
        </div>
      </div>

      {/* Navigation List: Horizontal scroll on mobile, vertical on desktop */}
      <div className="rounded-2xl border border-border/60 bg-card/80 p-2 shadow-xs backdrop-blur-xs">
        <div className="relative">
          <div className="flex gap-1.5 overflow-x-auto whitespace-nowrap pb-2 lg:flex-col lg:space-y-1 lg:overflow-visible lg:pb-0 scrollbar-none pr-8 lg:pr-0">
            {/* "All Departments" option */}
            <button
              type="button"
              onClick={() => onSelectDepartment(null)}
              className={itemClass(selectedDepartmentId === null)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <UsersRound className="size-3.5 shrink-0 opacity-70" aria-hidden="true" />
                <span className="truncate">All Departments</span>
              </div>
              <Badge
                variant={selectedDepartmentId === null ? "outline" : "secondary"}
                className={cn(
                  "text-[10px] px-1.5 py-0 h-4 shrink-0",
                  selectedDepartmentId === null && "border-primary-foreground/30 text-primary-foreground"
                )}
              >
                {departments.length}
              </Badge>
            </button>

            {/* Department items */}
            {departments.map((dept) => {
              const active = selectedDepartmentId === dept.departmentId
              const total = dept.totalSlots ?? 0
              const used = dept.usedSlots ?? 0
              const certCount = Array.isArray(dept.certifications) ? dept.certifications.length : 0

              return (
                <button
                  key={dept.departmentId}
                  type="button"
                  onClick={() => onSelectDepartment(active ? null : dept.departmentId)}
                  className={itemClass(active)}
                >
                  <div className="flex flex-col min-w-0 text-left">
                    <span className="truncate font-medium">{dept.departmentName}</span>
                    <span
                      className={cn(
                        "text-[10px] truncate",
                        active ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}
                    >
                      {certCount} cert{certCount === 1 ? "" : "s"} · {used}/{total} slots
                    </span>
                  </div>
                  <ChevronRight
                    className={cn(
                      "size-3.5 shrink-0 transition-transform",
                      active ? "rotate-90 text-primary-foreground" : "opacity-40 group-hover:opacity-100"
                    )}
                    aria-hidden="true"
                  />
                </button>
              )
            })}
          </div>

          {/* Right fade indicator on mobile scroll */}
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-card via-card/70 to-transparent lg:hidden"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Capacity & Usage Summary Card */}
      <div className="hidden lg:block rounded-2xl border border-border/60 bg-muted/20 p-3.5 text-xs space-y-2.5">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="font-semibold text-foreground">Capacity summary</span>
          <span className="tabular-nums font-bold text-foreground">
            {stats.utilizationRate}%
          </span>
        </div>
        <Progress value={stats.utilizationRate} className="h-2" />
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{stats.usedSlots} used</span>
          <span>{stats.totalSlots} total slots</span>
        </div>
      </div>

      {/* Portal Quick Links */}
      <div className="hidden lg:block rounded-2xl border border-border/60 bg-card/60 p-3 space-y-1.5 text-xs">
        <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Related Pages
        </p>
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
        <Link
          to="/institution/metrics"
          className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors font-medium"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <span>Metrics & Analytics</span>
          </div>
          <ChevronRight className="size-3 text-muted-foreground/60" aria-hidden="true" />
        </Link>
      </div>
    </aside>
  )
}
