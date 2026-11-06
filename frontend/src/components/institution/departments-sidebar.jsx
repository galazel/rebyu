import {
  ChevronRight,
  Layers,
  MailIcon,
  ShieldCheck,
  UsersRound,
} from "@/components/icons"
import { cn } from "@/lib/utils"

export const DEPARTMENT_FUNCTIONAL_GROUPS = [
  {
    category: "Classes",
    items: [
      { id: "dept-programs", label: "Programs & sections", icon: Layers },
      { id: "dept-learner-table", label: "Student roster", icon: UsersRound },
    ],
  },
  {
    category: "Administration",
    items: [
      { id: "dept-co-authorities", label: "Co-authorities", icon: ShieldCheck },
      { id: "dept-announcements", label: "Announcements", icon: MailIcon },
    ],
  },
]

/** The URL names of each view, so links from the dashboard open the right one. */
export const DEPARTMENT_VIEW_IDS = {
  programs: "dept-programs",
  roster: "dept-learner-table",
  heads: "dept-co-authorities",
  announcements: "dept-announcements",
}

/** Older links: the separate Sections view is now part of Programs & sections. */
export const DEPARTMENT_VIEW_ALIASES = { sections: "programs", department: "programs" }

export function DepartmentsSidebar({
  departments = [],
  selectedDepartmentId = null,
  onSelectDepartment,
  activeFeature = "dept-learner-table",
  onSelectFeature,
}) {
  return (
    <aside aria-label="Department management" className="space-y-4">
      <nav className="rounded-2xl border border-border/60 bg-card/80 p-2 shadow-xs">
        <div className="flex gap-1.5 overflow-x-auto whitespace-nowrap pb-1 scrollbar-none lg:flex-col lg:space-y-3 lg:overflow-visible lg:pb-0">
          {DEPARTMENT_FUNCTIONAL_GROUPS.map((group) => (
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
                          className={cn(
                            "size-3.5 shrink-0",
                            isActive ? "text-primary-foreground" : "text-muted-foreground"
                          )}
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

      {departments.length > 1 ? (
        <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/20 p-3 text-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Department</p>
          <div className="space-y-1">
            {departments.map((dept) => {
              const active = String(selectedDepartmentId) === String(dept.departmentId)
              return (
                <button
                  key={dept.departmentId}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelectDepartment?.(dept.departmentId)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors",
                    active
                      ? "bg-primary font-semibold text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span className="truncate">{dept.departmentName}</span>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </aside>
  )
}
