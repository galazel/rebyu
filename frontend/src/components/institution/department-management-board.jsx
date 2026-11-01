import { useCallback, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  AlertTriangle,
  Building2,
  Check,
  ChevronDown,
  CreditCard,
  Layers,
  Loader2,
  MailIcon,
  MoreVertical,
  Pencil,
  PinIcon,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  UsersRoundIcon,
} from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BentoTile } from "@/components/commons/bento.jsx"
import { CollapsedMetricCard } from "@/components/institution/collapsed-metric-card.jsx"
import { SectionDialog } from "@/components/institution/sections-tab.jsx"
import { CoAuthoritiesDialog } from "@/components/institution/co-authorities-dialog.jsx"
import { formatDate } from "@/components/institution/institution-ui.jsx"
import {
  archiveDepartmentAnnouncement,
  createDepartmentAnnouncement,
  deleteGroupSection,
  getDepartmentAnnouncements,
  getDepartmentHeadAssignments,
  getDepartmentHeadCodeInvitations,
  getDepartmentPrograms,
  getGroupLearnerRoster,
  getGroupSections,
  getMyInstitutionInvoices,
  removeLearnerFromGroup,
  startInvoiceCheckout,
  updateDepartmentAnnouncement,
} from "@/services/institutionService.js"

function count(value) {
  return value == null ? "—" : Number(value).toLocaleString()
}

function percent(value, digits = 0) {
  return value == null ? "—" : `${Number(value).toFixed(digits)}%`
}

function money(amount, currency = "PHP") {
  if (amount == null) return "—"
  const val = Number(amount)
  if (Number.isNaN(val)) return "—"
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: currency || "PHP",
    maximumFractionDigits: 2,
  }).format(val)
}

function formatRelativeTime(dateValue) {
  if (!dateValue) return null
  const now = Date.now()
  const then = new Date(dateValue).getTime()
  if (Number.isNaN(then)) return null
  const diffSec = Math.floor((now - then) / 1000)
  if (diffSec < 60) return "Just now"
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(dateValue)
}

function DashboardCardHeader({
  icon: Icon,
  kicker,
  title,
  hint,
  chip,
  action,
  className = "",
  collapsible = false,
  onToggleCollapse = null,
}) {
  return (
    <div className={`border-b border-border/50 pb-2.5 mb-3 transition-all ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon ? (
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/15 shadow-2xs">
              <Icon className="size-4" aria-hidden="true" />
            </span>
          ) : null}
          <div className="min-w-0">
            {kicker ? (
              <h3 className="text-[10px] font-bold uppercase leading-tight tracking-wider text-primary dark:text-emerald-400">
                {kicker}
              </h3>
            ) : null}
            <p className="truncate text-xs font-semibold leading-snug text-foreground sm:text-sm font-sans tracking-tight">
              {title}
            </p>
            {hint ? (
              <p className="mt-0.5 truncate text-[11px] font-normal text-muted-foreground font-sans">
                {hint}
              </p>
            ) : null}
          </div>
        </div>
        {(chip || action || collapsible) && (
          <div className="flex shrink-0 items-center gap-2">
            {chip}
            {action}
            {collapsible && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleCollapse?.()
                }}
                className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-bold rounded-xl border border-border/80 bg-muted/70 text-foreground hover:bg-primary/15 hover:text-primary active:scale-95 transition-all cursor-pointer shadow-xs"
                aria-label={`Collapse ${title}`}
                title="Collapse card"
              >
                <span>Collapse</span>
                <ChevronDown className="size-3.5 rotate-180 transition-transform duration-200" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatBox({ label, value, icon: Icon, iconClass = "", alert = false }) {
  return (
    <div
      className={`rounded-xl border p-2.5 sm:p-3.5 flex flex-col justify-between transition-all hover:border-border/80 ${
        alert
          ? "border-amber-500/30 bg-amber-500/5 ring-1 ring-inset ring-amber-500/20"
          : "border-border/60 bg-background/60 hover:bg-muted/30"
      }`}
    >
      <div className="flex items-center justify-between gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <span className="truncate">{label}</span>
        {Icon ? <Icon className={`size-3.5 shrink-0 ${iconClass}`} aria-hidden="true" /> : null}
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-1.5">
        <div
          className={`font-sans tabular-nums text-xl sm:text-2xl font-bold tracking-tight ${
            alert ? "text-amber-600 dark:text-amber-400" : "text-foreground"
          }`}
        >
          {value}
        </div>
      </div>
    </div>
  )
}

export function DepartmentManagementBoard({
  departmentId,
  department = null,
  isOwner = false,
  collapsedTiles = {},
  onToggleCollapse = () => {},
  activeCategory = "all",
}) {
  const queryClient = useQueryClient()
  const primaryDeptId = departmentId ?? department?.departmentId ?? department?.id

  // Section Management States
  const [createSectionOpen, setCreateSectionOpen] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [archivingSection, setArchivingSection] = useState(null)

  // Co-Authorities States
  const [coAuthoritiesOpen, setCoAuthoritiesOpen] = useState(false)

  // Learner Roster States
  const [selectedSectionFilter, setSelectedSectionFilter] = useState("all")
  const [rosterStatusFilter, setRosterStatusFilter] = useState("all")
  const [rosterSearch, setRosterSearch] = useState("")
  const [removingLearner, setRemovingLearner] = useState(null)

  // Announcements States
  const [announcementTitle, setAnnouncementTitle] = useState("")
  const [announcementBody, setAnnouncementBody] = useState("")
  const [announcementPinned, setAnnouncementPinned] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState(null)
  const [deletingAnnouncement, setDeletingAnnouncement] = useState(null)

  // Queries
  const sectionsQuery = useQuery({
    queryKey: ["department-sections", primaryDeptId],
    queryFn: () => getGroupSections(primaryDeptId),
    enabled: primaryDeptId != null,
  })
  const sections = useMemo(() => {
    return Array.isArray(sectionsQuery.data) ? sectionsQuery.data : []
  }, [sectionsQuery.data])

  const rosterQuery = useQuery({
    queryKey: ["department-learner-roster", primaryDeptId],
    queryFn: () => getGroupLearnerRoster(primaryDeptId),
    enabled: primaryDeptId != null,
  })
  const deptLearners = useMemo(() => {
    return Array.isArray(rosterQuery.data) ? rosterQuery.data : []
  }, [rosterQuery.data])

  const headCodesQuery = useQuery({
    queryKey: ["department-head-codes", primaryDeptId],
    queryFn: () => getDepartmentHeadCodeInvitations(primaryDeptId),
    enabled: primaryDeptId != null && isOwner,
    retry: 1,
  })
  const headAssignmentsQuery = useQuery({
    queryKey: ["department-head-assignments", primaryDeptId],
    queryFn: () => getDepartmentHeadAssignments({ departmentId: primaryDeptId }),
    enabled: primaryDeptId != null,
    retry: 1,
  })
  const pendingHeadInvitations = useMemo(
    () =>
      (Array.isArray(headCodesQuery.data) ? headCodesQuery.data : []).filter(
        (inv) => (inv?.status ?? "").toUpperCase() === "PENDING"
      ),
    [headCodesQuery.data]
  )
  const activeHeadAssignments = useMemo(
    () =>
      (Array.isArray(headAssignmentsQuery.data) ? headAssignmentsQuery.data : []).filter(
        (a) => (a?.status ?? "active") === "active"
      ),
    [headAssignmentsQuery.data]
  )

  const announcementsQuery = useQuery({
    queryKey: ["department-announcements", primaryDeptId],
    queryFn: () => getDepartmentAnnouncements(primaryDeptId),
    enabled: primaryDeptId != null,
    staleTime: 30_000,
  })
  const announcements = useMemo(
    () => (Array.isArray(announcementsQuery.data) ? announcementsQuery.data : []),
    [announcementsQuery.data]
  )
  const sortedAnnouncements = useMemo(() => {
    return [...announcements].sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1
      return new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0)
    })
  }, [announcements])

  const invoicesQuery = useQuery({
    queryKey: ["institution-invoices"],
    queryFn: getMyInstitutionInvoices,
    staleTime: 5 * 60_000,
    retry: 1,
  })
  const invoices = useMemo(
    () => (Array.isArray(invoicesQuery.data) ? invoicesQuery.data : []),
    [invoicesQuery.data]
  )

  // Mutations
  const removeSectionMutation = useMutation({
    mutationFn: (sectionId) => deleteGroupSection(primaryDeptId, sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-sections", primaryDeptId] })
      queryClient.invalidateQueries({ queryKey: ["department-learner-roster", primaryDeptId] })
      toast.success("Section archived. Its learners remain in the department.")
      setArchivingSection(null)
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? err?.message ?? "Unable to archive this section.")
    },
  })

  const removeLearnerMutation = useMutation({
    mutationFn: (learnerId) => removeLearnerFromGroup(primaryDeptId, learnerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-learner-roster", primaryDeptId] })
      toast.success("Learner removed from department.")
      setRemovingLearner(null)
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? err?.message ?? "Unable to remove this learner.")
    },
  })

  const saveAnnouncementMutation = useMutation({
    mutationFn: () => {
      const payload = {
        title: announcementTitle.trim(),
        body: announcementBody.trim(),
        pinned: announcementPinned,
      }
      return editingAnnouncement
        ? updateDepartmentAnnouncement(primaryDeptId, editingAnnouncement.departmentAnnouncementId, payload)
        : createDepartmentAnnouncement(primaryDeptId, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-announcements", primaryDeptId] })
      toast.success(editingAnnouncement ? "Announcement updated." : "Announcement posted.")
      setAnnouncementTitle("")
      setAnnouncementBody("")
      setAnnouncementPinned(false)
      setEditingAnnouncement(null)
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? err?.message ?? "Unable to save this announcement.")
    },
  })

  const pinAnnouncementMutation = useMutation({
    mutationFn: (item) =>
      updateDepartmentAnnouncement(primaryDeptId, item.departmentAnnouncementId, {
        title: item.title,
        body: item.body,
        pinned: !item.pinned,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-announcements", primaryDeptId] })
      toast.success("Pin status updated.")
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? err?.message ?? "Unable to update pin status.")
    },
  })

  const archiveAnnouncementMutation = useMutation({
    mutationFn: (announcementId) => archiveDepartmentAnnouncement(primaryDeptId, announcementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-announcements", primaryDeptId] })
      toast.success("Announcement archived.")
      setDeletingAnnouncement(null)
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? err?.message ?? "Unable to archive this announcement.")
    },
  })

  const checkoutMutation = useMutation({
    mutationFn: (invoiceId) => startInvoiceCheckout(invoiceId),
    onSuccess: ({ checkoutUrl }) => {
      window.location.assign(checkoutUrl)
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? error?.message ?? "Could not open PayMongo checkout.")
    },
  })

  // Learner filtering
  const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000
  const dormantCount = useMemo(() => {
    const now = Date.now()
    return deptLearners.filter((l) => {
      if (!l.lastActivityAt) return true
      const time = new Date(l.lastActivityAt).getTime()
      return !Number.isNaN(time) && now - time > FOURTEEN_DAYS_MS
    }).length
  }, [deptLearners])

  const flaggedCount = useMemo(() => {
    return deptLearners.filter((l) => l.flag).length
  }, [deptLearners])

  const filteredLearners = useMemo(() => {
    let list = deptLearners
    if (selectedSectionFilter === "none") {
      list = list.filter((l) => l.sectionId == null)
    } else if (selectedSectionFilter !== "all") {
      const targetSectionId = Number(selectedSectionFilter)
      list = list.filter((l) => l.sectionId === targetSectionId)
    }

    if (rosterStatusFilter === "flagged") {
      list = list.filter((l) => Boolean(l.flag))
    } else if (rosterStatusFilter === "dormant") {
      const now = Date.now()
      list = list.filter((l) => {
        if (!l.lastActivityAt) return true
        const time = new Date(l.lastActivityAt).getTime()
        return !Number.isNaN(time) && now - time > FOURTEEN_DAYS_MS
      })
    }

    if (rosterSearch.trim()) {
      const q = rosterSearch.toLowerCase()
      list = list.filter((l) => {
        const name = (l.name || "").toLowerCase()
        const email = (l.email || "").toLowerCase()
        return name.includes(q) || email.includes(q)
      })
    }

    return list
  }, [deptLearners, selectedSectionFilter, rosterStatusFilter, rosterSearch])

  // Category visibility
  const showSection = activeCategory === "all" || activeCategory === "Cohorts"
  const showRoster = activeCategory === "all" || activeCategory === "Roster" || activeCategory === "Cohorts"
  const showAuthorities = activeCategory === "all" || activeCategory === "Faculty" || activeCategory === "Administration"
  const showAnnouncements = activeCategory === "all" || activeCategory === "Announcements" || activeCategory === "Administration"
  const showInvoices = activeCategory === "all" || activeCategory === "Billing" || activeCategory === "Administration"

  return (
    <div className="space-y-6">
      {/* 1. Sections & Cohorts Tile */}
      {showSection ? (
        <div id="dept-section-breakdown" className="scroll-mt-24 transition-all">
          {collapsedTiles["dept-section-breakdown"] ? (
            <BentoTile col={6} row={1} className="!p-0" isCollapsed>
              <CollapsedMetricCard
                icon={Layers}
                kicker="Cohort Management"
                title="Section Breakdown & Cohort Progress"
                description="Provides granular progress tracking, student distribution, and average performance comparison across assigned department sections."
                previewMetric={`${sections.length} active section${sections.length === 1 ? "" : "s"} · ${deptLearners.length} enrolled`}
                onExpand={() => onToggleCollapse("dept-section-breakdown")}
              />
            </BentoTile>
          ) : (
            <BentoTile col={6} row={5} className="!p-0" collapsible onToggleCollapse={() => onToggleCollapse("dept-section-breakdown")}>
              <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
                <DashboardCardHeader
                  icon={Layers}
                  kicker="Section Management"
                  title="Sections & Cohorts"
                  hint="Active classes, learner headcount, pending invitations, and benchmark progress."
                  collapsible
                  onToggleCollapse={() => onToggleCollapse("dept-section-breakdown")}
                  action={
                    primaryDeptId ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1"
                          onClick={() => setCreateSectionOpen(true)}
                        >
                          <Plus className="size-3.5" aria-hidden="true" />
                          New section
                        </Button>
                        <Button asChild size="sm" variant="ghost" className="h-8 text-xs gap-1">
                          <Link to={`/institution/departments/${primaryDeptId}?tab=learners`}>
                            <Layers className="size-3.5" aria-hidden="true" />
                            Workspace
                          </Link>
                        </Button>
                      </div>
                    ) : null
                  }
                />

                {sectionsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                    <p>Loading sections...</p>
                  </div>
                ) : sectionsQuery.isError ? (
                  <p className="text-sm text-muted-foreground">Section stats could not be loaded.</p>
                ) : sections.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-sm text-muted-foreground">
                    <Layers className="mb-2 size-8 text-muted-foreground/40" />
                    <p>No sections created yet in this department.</p>
                    <p className="text-xs text-muted-foreground/70 mb-3">
                      Create classes or cohorts to organize learners into groups.
                    </p>
                    {primaryDeptId ? (
                      <Button size="sm" onClick={() => setCreateSectionOpen(true)} className="gap-1.5">
                        <Plus className="size-3.5" aria-hidden="true" />
                        Create first section
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {sections.map((section) => {
                      const sectionLearners = deptLearners.filter((l) => l.sectionId === section.sectionId)
                      const totalInSection =
                        section.learnerCount != null ? Number(section.learnerCount) : sectionLearners.length
                      const pendingCount = Number(section.pendingInvitationCount ?? 0)

                      return (
                        <div
                          key={section.sectionId}
                          className="flex flex-col justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-3.5 transition-colors hover:bg-muted/30 hover:border-border/80"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <Link
                                to={`/institution/departments/${primaryDeptId}?tab=learners`}
                                className="font-bold text-xs text-foreground hover:underline truncate"
                              >
                                {section.sectionName}
                              </Link>
                              {pendingCount > 0 ? (
                                <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-700">
                                  {pendingCount} pending
                                </Badge>
                              ) : null}
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {section.description || "Active department cohort"}
                            </p>
                          </div>

                          <div className="flex items-center justify-between border-t border-border/40 pt-2 text-xs">
                            <span className="font-semibold text-muted-foreground">
                              {totalInSection} {totalInSection === 1 ? "student" : "students"}
                            </span>
                            <div className="flex items-center gap-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="size-7 text-muted-foreground">
                                    <MoreVertical className="size-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-36">
                                  <DropdownMenuItem onClick={() => setEditingSection(section)} className="gap-2 text-xs">
                                    <Pencil className="size-3.5" />
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setArchivingSection(section)}
                                    className="gap-2 text-xs text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="size-3.5" />
                                    Archive
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </BentoTile>
          )}
        </div>
      ) : null}

      {/* 2. Student Roster Tile */}
      {showRoster ? (
        <div id="dept-learner-table" className="scroll-mt-24 transition-all">
          {collapsedTiles["dept-learner-table"] ? (
            <BentoTile col={6} row={1} className="!p-0" isCollapsed>
              <CollapsedMetricCard
                icon={UsersRoundIcon}
                kicker="Department Roster"
                title="Student Roster & Conversation Flags"
                description="Searchable student directory highlighting flagged learners, recent activity, mock exam scores, and direct analytics access."
                previewMetric={`${deptLearners.length} enrolled learner${deptLearners.length === 1 ? "" : "s"} · ${flaggedCount} flagged`}
                previewAlert={flaggedCount > 0}
                onExpand={() => onToggleCollapse("dept-learner-table")}
              />
            </BentoTile>
          ) : (
            <BentoTile col={6} row={7} className="!p-0" collapsible onToggleCollapse={() => onToggleCollapse("dept-learner-table")}>
              <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
                <DashboardCardHeader
                  icon={Building2}
                  kicker="Department Roster"
                  title="Student Roster & Directory"
                  hint="Flagged students appear at the top with intervention context."
                  collapsible
                  onToggleCollapse={() => onToggleCollapse("dept-learner-table")}
                />

                {/* Filter bar */}
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-border/50">
                  <div className="relative w-full sm:w-64">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search student..."
                      value={rosterSearch}
                      onChange={(e) => setRosterSearch(e.target.value)}
                      className="h-8 pl-8 text-xs bg-background/80"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {sections.length > 0 && (
                      <div className="w-full sm:w-44">
                        <Select value={selectedSectionFilter} onValueChange={setSelectedSectionFilter}>
                          <SelectTrigger className="h-8 text-xs bg-background/80">
                            <SelectValue placeholder="All sections" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All sections ({deptLearners.length})</SelectItem>
                            {sections.map((s) => (
                              <SelectItem key={s.sectionId} value={String(s.sectionId)}>
                                {s.sectionName}
                              </SelectItem>
                            ))}
                            <SelectItem value="none">Unassigned</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setRosterStatusFilter("all")}
                        className={`h-8 px-2.5 text-xs font-semibold rounded-lg transition-all ${
                          rosterStatusFilter === "all"
                            ? "bg-foreground text-background"
                            : "border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        All ({deptLearners.length})
                      </button>
                      {flaggedCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => setRosterStatusFilter(rosterStatusFilter === "flagged" ? "all" : "flagged")}
                          className={`h-8 px-2.5 text-xs font-semibold rounded-lg gap-1.5 inline-flex items-center ${
                            rosterStatusFilter === "flagged"
                              ? "bg-amber-500/20 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500/40"
                              : "border border-amber-500/30 bg-amber-500/10 text-amber-700"
                          }`}
                        >
                          <AlertTriangle className="size-3 text-amber-600" />
                          {flaggedCount} flagged
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="min-h-0 max-h-[360px] overflow-x-auto overflow-y-auto mt-3">
                  <table className="w-full text-xs border-separate border-spacing-0">
                    <thead className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
                      <tr className="text-muted-foreground uppercase tracking-wider text-[10px]">
                        <th className="py-2 pl-3 pr-2 text-left">Student</th>
                        <th className="py-2 px-2 text-left">Section</th>
                        <th className="py-2 px-2 text-left">Last Active</th>
                        <th className="py-2 px-2 text-left">Status</th>
                        <th className="py-2 pr-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLearners.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-xs text-muted-foreground">
                            No learners match the current filter.
                          </td>
                        </tr>
                      ) : (
                        filteredLearners.map((learner) => (
                          <tr key={learner.learnerId} className="border-b border-border/40 hover:bg-muted/30">
                            <td className="py-2.5 pl-3 pr-2">
                              <span className="font-semibold text-foreground">
                                {learner.name || `Learner #${learner.learnerId}`}
                              </span>
                            </td>
                            <td className="py-2.5 px-2">
                              <Badge variant="outline" className="text-[10px]">
                                {learner.sectionName || "Unassigned"}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-2 text-muted-foreground">
                              {formatRelativeTime(learner.lastActivityAt) || "Never"}
                            </td>
                            <td className="py-2.5 px-2">
                              {learner.flag ? (
                                <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 text-[10px]">
                                  {learner.flag}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="py-2.5 pr-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRemovingLearner(learner)}
                                className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                              >
                                Remove
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </BentoTile>
          )}
        </div>
      ) : null}

      {/* 3. Co-Authorities Tile */}
      {showAuthorities ? (
        <div id="dept-co-authorities" className="scroll-mt-24 transition-all">
          {collapsedTiles["dept-co-authorities"] ? (
            <BentoTile col={6} row={1} className="!p-0" isCollapsed>
              <CollapsedMetricCard
                icon={ShieldCheck}
                kicker="Faculty Leadership"
                title="Co-Authorities & Pending Invitations"
                description="Manages delegated faculty roles, collaborative curriculum authorities, and pending department invitation codes."
                previewMetric={`${activeHeadAssignments.length} active authorit${activeHeadAssignments.length === 1 ? "y" : "ies"}`}
                onExpand={() => onToggleCollapse("dept-co-authorities")}
              />
            </BentoTile>
          ) : (
            <BentoTile col={6} row={4} collapsible onToggleCollapse={() => onToggleCollapse("dept-co-authorities")}>
              <div className="flex h-full flex-col justify-between gap-3 p-4 sm:p-5">
                <DashboardCardHeader
                  icon={ShieldCheck}
                  kicker="Delegation & Leadership"
                  title="Co-Authorities & Faculty Roles"
                  hint={`${activeHeadAssignments.length} active · ${pendingHeadInvitations.length} pending`}
                  collapsible
                  onToggleCollapse={() => onToggleCollapse("dept-co-authorities")}
                  action={
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCoAuthoritiesOpen(true)}
                      className="h-8 gap-1.5 text-xs font-semibold"
                    >
                      <UserPlus className="size-3.5" aria-hidden="true" />
                      Manage
                    </Button>
                  }
                />

                <div className="grid grid-cols-2 gap-3 my-2">
                  <StatBox
                    label="Active Authorities"
                    value={count(activeHeadAssignments.length)}
                    icon={ShieldCheck}
                    iconClass="text-emerald-600 dark:text-emerald-400"
                  />
                  <StatBox
                    label="Pending Invitations"
                    value={count(pendingHeadInvitations.length)}
                    icon={MailIcon}
                    iconClass={pendingHeadInvitations.length > 0 ? "text-amber-600" : "text-muted-foreground"}
                  />
                </div>

                <div className="flex items-center justify-between border-t border-border/40 pt-2.5 mt-auto text-xs text-muted-foreground">
                  <span>Authorized department managers</span>
                  <button
                    type="button"
                    onClick={() => setCoAuthoritiesOpen(true)}
                    className="font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Manage invites →
                  </button>
                </div>
              </div>
            </BentoTile>
          )}
        </div>
      ) : null}

      {/* 4. Announcements Tile */}
      {showAnnouncements ? (
        <div id="dept-announcements" className="scroll-mt-24 transition-all">
          {collapsedTiles["dept-announcements"] ? (
            <BentoTile col={6} row={1} className="!p-0" isCollapsed>
              <CollapsedMetricCard
                icon={PinIcon}
                kicker="Department Communications"
                title="Announcements & Quick-Compose"
                description="Enables posting, pinning, and managing vital department bulletins, reminders, and updates for students and faculty."
                previewMetric={`${announcements.length} active announcement${announcements.length === 1 ? "" : "s"}`}
                onExpand={() => onToggleCollapse("dept-announcements")}
              />
            </BentoTile>
          ) : (
            <BentoTile col={6} row={5} collapsible onToggleCollapse={() => onToggleCollapse("dept-announcements")}>
              <div className="flex h-full flex-col justify-between gap-4 p-4 sm:p-5">
                <DashboardCardHeader
                  icon={PinIcon}
                  kicker="Department Communications"
                  title="Announcements & Quick-Compose"
                  hint={`${announcements.length} announcement${announcements.length === 1 ? "" : "s"} · Direct bulletins`}
                  collapsible
                  onToggleCollapse={() => onToggleCollapse("dept-announcements")}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start my-auto">
                  {/* Left: Compose */}
                  <div className="lg:col-span-5 rounded-xl border border-border/70 bg-muted/20 p-3 space-y-2.5">
                    <span className="text-xs font-bold text-foreground">
                      {editingAnnouncement ? "Edit Announcement" : "Quick Compose"}
                    </span>
                    <Input
                      placeholder="Announcement title..."
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                      className="h-8 text-xs bg-background"
                      maxLength={200}
                    />
                    <Textarea
                      placeholder="Share a message or reminder with department learners..."
                      value={announcementBody}
                      onChange={(e) => setAnnouncementBody(e.target.value)}
                      rows={3}
                      className="text-xs min-h-[64px] bg-background resize-none py-1.5"
                    />
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                        <Switch checked={announcementPinned} onCheckedChange={setAnnouncementPinned} className="scale-75" />
                        <span>Pin to top</span>
                      </label>
                      <Button
                        size="sm"
                        className="h-8 px-3.5 text-xs font-semibold"
                        disabled={!announcementTitle.trim() || !announcementBody.trim() || saveAnnouncementMutation.isPending}
                        onClick={() => saveAnnouncementMutation.mutate()}
                      >
                        {saveAnnouncementMutation.isPending ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                        {editingAnnouncement ? "Save" : "Post"}
                      </Button>
                    </div>
                  </div>

                  {/* Right: Feed */}
                  <div className="lg:col-span-7 space-y-2">
                    <div className="flex items-center justify-between px-0.5 text-xs font-semibold text-muted-foreground">
                      <span>Recent Department Bulletins</span>
                      <span>{announcements.length} total</span>
                    </div>
                    <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1">
                      {announcementsQuery.isLoading ? (
                        <div className="space-y-2 py-1">
                          <div className="h-10 w-full animate-pulse rounded-lg bg-muted/50" />
                          <div className="h-10 w-full animate-pulse rounded-lg bg-muted/50" />
                        </div>
                      ) : announcements.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground border border-dashed border-border/70 rounded-xl">
                          <PinIcon className="size-6 text-muted-foreground/40 mb-1.5" aria-hidden="true" />
                          <p>No announcements posted for this department yet.</p>
                        </div>
                      ) : (
                        sortedAnnouncements.slice(0, 5).map((item) => (
                          <div
                            key={item.departmentAnnouncementId}
                            className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-card p-3 text-xs"
                          >
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {item.pinned ? (
                                  <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[10px] font-bold text-primary bg-primary/10">
                                    <PinIcon className="size-2.5" />
                                    Pinned
                                  </Badge>
                                ) : null}
                                <p className="font-bold text-foreground truncate">{item.title}</p>
                              </div>
                              <p className="line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-7 text-muted-foreground">
                                  <MoreVertical className="size-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingAnnouncement(item)
                                    setAnnouncementTitle(item.title)
                                    setAnnouncementBody(item.body)
                                    setAnnouncementPinned(Boolean(item.pinned))
                                  }}
                                >
                                  <Pencil className="mr-2 size-3.5" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => pinAnnouncementMutation.mutate(item)}>
                                  <PinIcon className="mr-2 size-3.5" />
                                  {item.pinned ? "Unpin" : "Pin"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeletingAnnouncement(item)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 size-3.5" />
                                  Archive
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </BentoTile>
          )}
        </div>
      ) : null}

      {/* 5. Invoices & Billing Tile */}
      {showInvoices ? (
        <div id="dept-invoices" className="scroll-mt-24 transition-all">
          {collapsedTiles["dept-invoices"] ? (
            <BentoTile col={6} row={1} className="!p-0" isCollapsed>
              <CollapsedMetricCard
                icon={CreditCard}
                kicker="Billing & Invoices"
                title="Invoices & Billing Summary"
                description="Summarizes partnership billing records, payment statuses, due dates, and pending institutional invoices."
                previewMetric={`${invoices.length} invoice${invoices.length === 1 ? "" : "s"} on file`}
                onExpand={() => onToggleCollapse("dept-invoices")}
              />
            </BentoTile>
          ) : (
            <BentoTile col={6} row={4} collapsible onToggleCollapse={() => onToggleCollapse("dept-invoices")}>
              <div className="flex h-full flex-col justify-between gap-3 p-4 sm:p-5">
                <DashboardCardHeader
                  icon={CreditCard}
                  kicker="Billing & Payments"
                  title="Invoices Summary"
                  hint={`${invoices.length} total invoice${invoices.length === 1 ? "" : "s"}`}
                  collapsible
                  onToggleCollapse={() => onToggleCollapse("dept-invoices")}
                  action={
                    <Button variant="ghost" size="sm" asChild className="h-7 text-xs font-semibold text-primary">
                      <Link to="/institution/invoices">View all</Link>
                    </Button>
                  }
                />

                {invoicesQuery.isLoading ? (
                  <div className="space-y-2 py-2">
                    <div className="h-10 w-full animate-pulse rounded-lg bg-muted/50" />
                    <div className="h-10 w-full animate-pulse rounded-lg bg-muted/50" />
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="my-auto flex flex-col items-center justify-center p-4 text-center text-xs text-muted-foreground">
                    <CreditCard className="size-8 text-muted-foreground/40 mb-2" />
                    <p className="font-semibold text-foreground">No invoices</p>
                    <p className="mt-0.5">Your institution has no billing records yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2 my-auto">
                    {invoices.slice(0, 4).map((inv) => {
                      const isPayable = inv.status !== "paid" && (inv.payable ?? true)
                      return (
                        <div
                          key={inv.institutionInvoiceId}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-border/70 bg-card p-2.5 text-xs"
                        >
                          <div className="min-w-0">
                            <span className="font-mono font-bold text-foreground">
                              {inv.invoiceNumber || `Invoice #${inv.institutionInvoiceId}`}
                            </span>
                            <span className="ml-2 text-muted-foreground">
                              {formatDate(inv.issuedAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold tabular-nums">
                              {money(inv.totalAmount, inv.currency)}
                            </span>
                            {isPayable ? (
                              <Button
                                size="sm"
                                className="h-7 px-2.5 text-xs font-semibold"
                                onClick={() => checkoutMutation.mutate(inv.institutionInvoiceId)}
                                disabled={checkoutMutation.isPending}
                              >
                                Pay now
                              </Button>
                            ) : (
                              <Badge variant="outline" className="text-[10px] uppercase font-bold">
                                {inv.status || "PAID"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </BentoTile>
          )}
        </div>
      ) : null}

      {/* Modal Dialogs */}
      {createSectionOpen && primaryDeptId ? (
        <SectionDialog
          key="create-section"
          open={createSectionOpen}
          onOpenChange={setCreateSectionOpen}
          departmentId={primaryDeptId}
          institutionCertId={department?.institutionCertId ?? null}
          certifications={department?.certifications ?? []}
        />
      ) : null}

      {editingSection && primaryDeptId ? (
        <SectionDialog
          key={`edit-${editingSection.sectionId}`}
          open={Boolean(editingSection)}
          onOpenChange={(open) => !open && setEditingSection(null)}
          departmentId={primaryDeptId}
          section={editingSection}
          institutionCertId={editingSection.institutionCertId ?? department?.institutionCertId ?? null}
          certifications={department?.certifications ?? []}
        />
      ) : null}

      <AlertDialog open={archivingSection != null} onOpenChange={(open) => !open && setArchivingSection(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive “{archivingSection?.sectionName}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Its learners remain in the department under “Not in a section”.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeSectionMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => removeSectionMutation.mutate(archivingSection.sectionId)}
              disabled={removeSectionMutation.isPending}
            >
              {removeSectionMutation.isPending ? "Archiving..." : "Archive section"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={removingLearner != null} onOpenChange={(open) => !open && setRemovingLearner(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove “{removingLearner?.name || `Learner #${removingLearner?.learnerId}`}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the learner from this department.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeLearnerMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => removeLearnerMutation.mutate(removingLearner.learnerId)}
              disabled={removeLearnerMutation.isPending}
            >
              {removeLearnerMutation.isPending ? "Removing..." : "Remove learner"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {coAuthoritiesOpen && primaryDeptId ? (
        <CoAuthoritiesDialog
          open={coAuthoritiesOpen}
          onOpenChange={setCoAuthoritiesOpen}
          departmentId={primaryDeptId}
          departmentName={department?.departmentName || department?.name}
        />
      ) : null}

      <AlertDialog open={deletingAnnouncement != null} onOpenChange={(open) => !open && setDeletingAnnouncement(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deletingAnnouncement?.title}” will no longer be visible to department members.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiveAnnouncementMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => archiveAnnouncementMutation.mutate(deletingAnnouncement.departmentAnnouncementId)}
              disabled={archiveAnnouncementMutation.isPending}
            >
              {archiveAnnouncementMutation.isPending ? "Archiving..." : "Archive announcement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
