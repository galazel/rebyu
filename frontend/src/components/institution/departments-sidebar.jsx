import { CircleHelp, ClipboardCheckIcon, Layers, MailIcon, ShieldCheck } from "@/components/icons"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

/** The department's views, in the order they appear in the tab bar. */
export const DEPARTMENT_VIEWS = [
  { id: "dept-programs", label: "Programs & sections", short: "Programs", icon: Layers },
  { id: "dept-assessments", label: "Assessments", short: "Tests", icon: ClipboardCheckIcon },
  { id: "dept-question-bank", label: "Question bank", short: "Questions", icon: CircleHelp },
  { id: "dept-co-authorities", label: "Co-authorities", short: "Heads", icon: ShieldCheck },
  { id: "dept-announcements", label: "Announcements", short: "News", icon: MailIcon },
]

/** The URL names of each view, so links from the dashboard open the right one. */
export const DEPARTMENT_VIEW_IDS = {
  programs: "dept-programs",
  roster: "dept-learner-table",
  assessments: "dept-assessments",
  "question-bank": "dept-question-bank",
  heads: "dept-co-authorities",
  announcements: "dept-announcements",
}

/** Older links: the separate Sections view is now part of Programs & sections. */
export const DEPARTMENT_VIEW_ALIASES = {
  sections: "programs",
  department: "programs",
  students: "roster",
  authorities: "heads",
  questions: "question-bank",
}

/**
 * One tab bar for the whole department: its four views, and, for a head of
 * several departments, which department they are looking at.
 */
export function DepartmentTabs({
  departments = [],
  selectedDepartmentId = null,
  onSelectDepartment,
  activeFeature = DEPARTMENT_VIEW_IDS.programs,
  onSelectFeature,
}) {
  return (
    <div className="flex flex-col-reverse gap-3 border-b border-border/70 sm:flex-row sm:items-end sm:justify-between">
      <nav aria-label="Department" className="-mb-px flex gap-1 overflow-x-auto scrollbar-none">
        {DEPARTMENT_VIEWS.map((view) => {
          const Icon = view.icon
          const active = activeFeature === view.id
          return (
            <button
              key={view.id}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onSelectFeature?.(view.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span className="sm:hidden">{view.short}</span>
              <span className="hidden sm:inline">{view.label}</span>
            </button>
          )
        })}
      </nav>

      {departments.length > 1 ? (
        <div className="flex items-center gap-2 pb-2">
          <span className="text-xs font-medium text-muted-foreground">Department</span>
          <Select
            value={selectedDepartmentId != null ? String(selectedDepartmentId) : undefined}
            onValueChange={(value) => onSelectDepartment?.(Number(value))}
          >
            <SelectTrigger className="h-9 w-full min-w-48 sm:w-auto" aria-label="Department">
              <SelectValue placeholder="Choose a department" />
            </SelectTrigger>
            <SelectContent position="popper">
              {departments.map((dept) => (
                <SelectItem key={dept.departmentId} value={String(dept.departmentId)}>
                  {dept.departmentName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </div>
  )
}
