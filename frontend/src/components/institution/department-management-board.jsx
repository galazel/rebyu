import { Table } from "@/components/ui/table"
import { useCallback, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Building2,
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
import { SectionDialog } from "@/components/institution/sections-tab.jsx"
import { CoAuthoritiesDialog } from "@/components/institution/co-authorities-dialog.jsx"
import {
  archiveDepartmentAnnouncement,
  createDepartmentAnnouncement,
  deleteGroupSection,
  getDepartmentAnnouncements,
  getDepartmentHeadAssignments,
  getDepartmentHeadCodeInvitations,
  getGroupSections,
  removeLearnerFromGroup,
  updateDepartmentAnnouncement,
} from "@/services/institutionService.js"
import { LEARNER_STATUS, relativeDays, useDepartmentOverview } from "@/hooks/use-my-department.js"
import { cn } from "@/lib/utils"
import { ExportButton } from "@/components/commons/export-button.jsx"
import {
  ANNOUNCEMENT_COLUMNS,
  FORMER_LEARNER_COLUMNS,
  LEARNER_COLUMNS,
  SECTION_COLUMNS,
  announcementRow,
  formerLearnerRow,
  learnerRow,
  sectionRow,
} from "@/lib/department-export.js"

const ROSTER_FILTERS = [
  { id: "all", label: "All" },
  { id: "at_risk", label: "At risk" },
  { id: "dormant", label: "Gone quiet" },
  { id: "not_started", label: "Not started" },
  { id: "unsectioned", label: "No section" },
]

function count(value) {
  return value == null ? "—" : Number(value).toLocaleString()
}

function DashboardCardHeader({
  icon: Icon,
  kicker,
  title,
  hint,
  chip,
  action,
  className = "",
}) {
  return (
    <div className={`border-b border-border/50 pb-3 mb-4 transition-all ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon ? (
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/15 shadow-2xs">
              <Icon className="size-4.5" aria-hidden="true" />
            </span>
          ) : null}
          {/* The tab names the view, so no kicker or intro hint here. */}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-snug text-foreground sm:text-base font-sans tracking-tight">
              {title}
            </p>
          </div>
        </div>
        {(chip || action) && (
          <div className="flex shrink-0 items-center gap-2">
            {chip}
            {action}
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
  activeFeature = "dept-section-breakdown",
  initialRosterFilter = "all",
  initialSectionFilter = "all",
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
  const [selectedSectionFilter, setSelectedSectionFilter] = useState(String(initialSectionFilter ?? "all"))
  const [rosterStatusFilter, setRosterStatusFilter] = useState(
    ROSTER_FILTERS.some((f) => f.id === initialRosterFilter) ? initialRosterFilter : "all"
  )
  const [rosterSearch, setRosterSearch] = useState("")
  const [removingLearner, setRemovingLearner] = useState(null)

  // Announcements States
  const [announcementTitle, setAnnouncementTitle] = useState("")
  const [announcementBody, setAnnouncementBody] = useState("")
  const [announcementPinned, setAnnouncementPinned] = useState(false)
  // Certification ids whose learners see the announcement; empty = everyone in the department.
  const [announcementCertIds, setAnnouncementCertIds] = useState([])
  const announcementCerts = (department?.certifications ?? []).filter(
    (cert) => cert?.certificationId != null && String(cert?.status ?? "active").toLowerCase() === "active"
  )
  const certTitleById = new Map(announcementCerts.map((cert) => [cert.certificationId, cert.title]))
  const toggleAnnouncementCert = (id) =>
    setAnnouncementCertIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]))
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

  // Learner status, reason and last activity are decided by the backend once,
  // so the roster here agrees with the dashboard's alerts and watchlist.
  const overviewQuery = useDepartmentOverview(primaryDeptId)
  const deptLearners = useMemo(
    () => (Array.isArray(overviewQuery.data?.learners) ? overviewQuery.data.learners : []),
    [overviewQuery.data]
  )
  const formerLearners = useMemo(
    () => (Array.isArray(overviewQuery.data?.formerLearners) ? overviewQuery.data.formerLearners : []),
    [overviewQuery.data]
  )
  const sectionStatsById = useMemo(
    () => new Map((overviewQuery.data?.sections ?? []).map((row) => [row.sectionId, row])),
    [overviewQuery.data]
  )
  const invalidateOverview = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["department-overview", primaryDeptId] }),
    [queryClient, primaryDeptId]
  )

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

  // Mutations
  const removeSectionMutation = useMutation({
    mutationFn: (sectionId) => deleteGroupSection(primaryDeptId, sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-sections", primaryDeptId] })
      queryClient.invalidateQueries({ queryKey: ["department-learner-roster", primaryDeptId] })
      invalidateOverview()
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
      invalidateOverview()
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
        certificationIds: announcementCertIds,
      }
      return editingAnnouncement
        ? updateDepartmentAnnouncement(primaryDeptId, editingAnnouncement.departmentAnnouncementId, payload)
        : createDepartmentAnnouncement(primaryDeptId, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-announcements", primaryDeptId] })
      invalidateOverview()
      toast.success(editingAnnouncement ? "Announcement updated." : "Announcement posted.")
      setAnnouncementTitle("")
      setAnnouncementBody("")
      setAnnouncementPinned(false)
      setAnnouncementCertIds([])
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
      invalidateOverview()
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
      invalidateOverview()
      toast.success("Announcement archived.")
      setDeletingAnnouncement(null)
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? err?.message ?? "Unable to archive this announcement.")
    },
  })

  // Learner filtering
  const statusCounts = useMemo(() => {
    const counts = { all: deptLearners.length, unsectioned: 0 }
    for (const learner of deptLearners) {
      counts[learner.status] = (counts[learner.status] ?? 0) + 1
      if (learner.sectionId == null) counts.unsectioned += 1
    }
    return counts
  }, [deptLearners])

  const filteredLearners = useMemo(() => {
    let list = deptLearners
    if (selectedSectionFilter === "none") {
      list = list.filter((l) => l.sectionId == null)
    } else if (selectedSectionFilter !== "all") {
      const targetSectionId = Number(selectedSectionFilter)
      list = list.filter((l) => l.sectionId === targetSectionId)
    }

    if (rosterStatusFilter === "unsectioned") {
      list = list.filter((l) => l.sectionId == null)
    } else if (rosterStatusFilter !== "all") {
      list = list.filter((l) => l.status === rosterStatusFilter)
    }

    if (rosterSearch.trim()) {
      const q = rosterSearch.trim().toLowerCase()
      list = list.filter((l) =>
        [l.name, l.username].some((value) => String(value ?? "").toLowerCase().includes(q))
      )
    }

    return list
  }, [deptLearners, selectedSectionFilter, rosterStatusFilter, rosterSearch])

    return (
    <div className="space-y-6">
      {/* 1. Sections & Cohorts Page View */}
      {activeFeature === "dept-section-breakdown" && (
        <div id="dept-section-breakdown" className="rounded-2xl border border-border/70 bg-card p-4 sm:p-6 shadow-xs space-y-5 animate-in fade-in-50 duration-200">
          <DashboardCardHeader
                  icon={Layers}
                  kicker="Section Management"
                  title="Sections & Cohorts"
                  hint="Active classes, learner headcount, pending invitations, and benchmark progress."
                  action={
                    primaryDeptId ? (
                      <div className="flex items-center gap-2">
                        <ExportButton
                          filename="rebyu-department-sections"
                          report="Department sections"
                          details={[["Department", department?.departmentName]]}
                          className="h-8 text-xs"
                          disabled={sections.length === 0}
                          sections={() => [
                            {
                              title: "Sections",
                              columns: SECTION_COLUMNS,
                              rows: sections.map((section) => sectionRow(section, sectionStatsById.get(section.sectionId))),
                            },
                          ]}
                        />
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
                      const stats = sectionStatsById.get(section.sectionId)
                      const totalInSection =
                        section.learnerCount != null ? Number(section.learnerCount) : Number(stats?.learners ?? 0)
                      const pendingCount = Number(section.pendingInvitationCount ?? 0)
                      const sectionProgress =
                        stats?.averageProgress == null ? null : Math.round(Number(stats.averageProgress))
                      const needCheckIn = Number(stats?.atRisk ?? 0) + Number(stats?.dormant ?? 0)

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
                              {[section.programName, section.certificationTitle].filter(Boolean).join(" · ") ||
                                "No program"}
                            </p>
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                <span>Completion</span>
                                <span className="font-semibold tabular-nums text-foreground">
                                  {sectionProgress == null ? "—" : `${sectionProgress}%`}
                                </span>
                              </div>
                              <Progress value={sectionProgress ?? 0} className="h-1.5" />
                              {needCheckIn > 0 ? (
                                <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                                  {needCheckIn} need{needCheckIn === 1 ? "s" : ""} a check-in
                                </p>
                              ) : null}
                            </div>
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
      )}

      {/* 2. Student Roster Page View */}
      {activeFeature === "dept-learner-table" && (
        <div id="dept-learner-table" className="rounded-2xl border border-border/70 bg-card p-4 sm:p-6 shadow-xs space-y-5 animate-in fade-in-50 duration-200">
          <DashboardCardHeader
                  icon={Building2}
                  kicker="Department Roster"
                  title="Student Roster & Directory"
                  hint="Learners who need a check-in are listed first, with the reason."
                  action={
                    <ExportButton
                      filename="rebyu-department-roster"
                      report="Department roster"
                      details={() => [
                        ["Department", department?.departmentName],
                        ["Status filter", ROSTER_FILTERS.find((f) => f.id === rosterStatusFilter)?.label ?? "All"],
                        [
                          "Section filter",
                          selectedSectionFilter === "all"
                            ? "All sections"
                            : selectedSectionFilter === "none"
                              ? "No section"
                              : sections.find((s) => String(s.sectionId) === selectedSectionFilter)?.sectionName,
                        ],
                        ["Search", rosterSearch.trim() || null],
                        ["Learners in file", `${filteredLearners.length} of ${deptLearners.length}`],
                      ]}
                      className="h-8 text-xs"
                      disabled={filteredLearners.length === 0}
                      sections={() => [
                        { title: "Learners", columns: LEARNER_COLUMNS, rows: filteredLearners.map(learnerRow) },
                        {
                          title: "Former learners (removed; figures as they stood when they left)",
                          columns: FORMER_LEARNER_COLUMNS,
                          rows: formerLearners.map(formerLearnerRow),
                        },
                      ]}
                    />
                  }
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

                    <div className="flex flex-wrap items-center gap-1">
                      {ROSTER_FILTERS.map((filter) => {
                        const total = statusCounts[filter.id] ?? 0
                        if (filter.id !== "all" && total === 0 && rosterStatusFilter !== filter.id) return null
                        return (
                          <button
                            key={filter.id}
                            type="button"
                            aria-pressed={rosterStatusFilter === filter.id}
                            onClick={() => setRosterStatusFilter(filter.id)}
                            className={cn(
                              "h-8 rounded-lg px-2.5 text-xs font-semibold transition-all",
                              rosterStatusFilter === filter.id
                                ? "bg-foreground text-background"
                                : "border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted"
                            )}
                          >
                            {filter.label} ({total})
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="min-h-0 max-h-[560px] overflow-x-auto overflow-y-auto mt-3">
                  <Table className="w-full text-xs border-separate border-spacing-0">
                    <thead className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
                      <tr className="text-muted-foreground uppercase tracking-wider text-[10px]">
                        <th className="py-2 pl-3 pr-2 text-left">Student</th>
                        <th className="py-2 px-2 text-left">Section</th>
                        <th className="py-2 px-2 text-right">Completion</th>
                        <th className="py-2 px-2 text-left">Last active</th>
                        <th className="py-2 px-2 text-left">Status</th>
                        <th className="py-2 pr-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLearners.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-xs text-muted-foreground">
                            No learners match the current filter.
                          </td>
                        </tr>
                      ) : (
                        filteredLearners.map((learner) => (
                          <tr key={learner.learnerId} className="border-b border-border/40 hover:bg-muted/30">
                            <td className="py-2.5 pl-3 pr-2">
                              <Link
                                to={`/institution/departments/${primaryDeptId}/learners/${learner.learnerId}`}
                                className="font-semibold text-foreground hover:underline"
                              >
                                {learner.name || `Learner #${learner.learnerId}`}
                              </Link>
                            </td>
                            <td className="py-2.5 px-2">
                              <Badge variant="outline" className="text-[10px]">
                                {learner.sectionName || "Unassigned"}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-2 text-right font-semibold tabular-nums">
                              {learner.averageProgress == null ? "—" : `${Math.round(Number(learner.averageProgress))}%`}
                            </td>
                            <td className="py-2.5 px-2 text-muted-foreground">
                              {relativeDays(learner.daysInactive)}
                            </td>
                            <td className="py-2.5 px-2">
                              <div className="space-y-0.5">
                                <Badge
                                  variant="outline"
                                  className={cn("text-[10px]", LEARNER_STATUS[learner.status]?.className)}
                                >
                                  {LEARNER_STATUS[learner.status]?.label ?? learner.status}
                                </Badge>
                                {learner.reason && learner.status !== "completed" ? (
                                  <p className="text-[10px] text-muted-foreground">{learner.reason}</p>
                                ) : null}
                              </div>
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
                  </Table>
                </div>

                {formerLearners.length > 0 ? (
                  <details className="mt-4 rounded-xl border border-border/60 bg-muted/10">
                    <summary className="cursor-pointer px-3 py-2.5 text-xs font-semibold text-foreground">
                      Former learners ({formerLearners.length}) — removed from the department; their history stays in exports
                    </summary>
                    <div className="overflow-x-auto px-3 pb-3">
                      <Table className="w-full text-xs">
                        <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          <tr>
                            <th className="py-2 pr-2 text-left">Learner</th>
                            <th className="py-2 px-2 text-left">Section</th>
                            <th className="py-2 px-2 text-left">Joined</th>
                            <th className="py-2 px-2 text-left">Removed</th>
                            <th className="py-2 px-2 text-right">Completion</th>
                            <th className="py-2 pl-2 text-right">Avg score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formerLearners.map((l) => (
                            <tr key={l.learnerId} className="border-t border-border/40">
                              <td className="py-2 pr-2 font-medium text-foreground">{l.name}</td>
                              <td className="py-2 px-2 text-muted-foreground">{l.sectionName ?? "No section"}</td>
                              <td className="py-2 px-2 text-muted-foreground">{l.joinedAt ? String(l.joinedAt).slice(0, 10) : "—"}</td>
                              <td className="py-2 px-2 text-muted-foreground">{l.removedAt ? String(l.removedAt).slice(0, 10) : "—"}</td>
                              <td className="py-2 px-2 text-right tabular-nums">
                                {l.averageProgress == null ? "—" : `${Math.round(Number(l.averageProgress))}%`}
                              </td>
                              <td className="py-2 pl-2 text-right tabular-nums">{l.averageScore == null ? "—" : `${l.averageScore}%`}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </details>
                ) : null}
        </div>
      )}

      {/* 3. Co-Authorities Page View */}
      {activeFeature === "dept-co-authorities" && (
        <div id="dept-co-authorities" className="rounded-2xl border border-border/70 bg-card p-4 sm:p-6 shadow-xs space-y-5 animate-in fade-in-50 duration-200">
          <DashboardCardHeader
                  icon={ShieldCheck}
                  kicker="Delegation & Leadership"
                  title="Co-Authorities & Faculty Roles"
                  hint={`${activeHeadAssignments.length} active · ${pendingHeadInvitations.length} pending`}
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
      )}

      {/* 4. Announcements Page View */}
      {activeFeature === "dept-announcements" && (
        <div id="dept-announcements" className="rounded-2xl border border-border/70 bg-card p-4 sm:p-6 shadow-xs space-y-5 animate-in fade-in-50 duration-200">
          <DashboardCardHeader
                  icon={PinIcon}
                  kicker="Department Communications"
                  title="Announcements & Quick-Compose"
                  hint={`${announcements.length} announcement${announcements.length === 1 ? "" : "s"} · Direct bulletins`}
                  action={
                    <ExportButton
                      filename="rebyu-department-announcements"
                      report="Department announcements"
                      details={[["Department", department?.departmentName]]}
                      className="h-8 text-xs"
                      disabled={announcements.length === 0}
                      sections={() => [
                        { title: "Announcements", columns: ANNOUNCEMENT_COLUMNS, rows: sortedAnnouncements.map(announcementRow) },
                      ]}
                    />
                  }
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
                    {announcementCerts.length > 1 ? (
                      <div className="space-y-1.5" role="group" aria-label="Who sees this announcement">
                        <span className="text-[11px] font-semibold text-muted-foreground">Who sees it</span>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            aria-pressed={announcementCertIds.length === 0}
                            onClick={() => setAnnouncementCertIds([])}
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                              announcementCertIds.length === 0
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background text-foreground hover:bg-muted"
                            }`}
                          >
                            All certifications
                          </button>
                          {announcementCerts.map((cert) => {
                            const on = announcementCertIds.includes(cert.certificationId)
                            return (
                              <button
                                key={cert.certificationId}
                                type="button"
                                aria-pressed={on}
                                onClick={() => toggleAnnouncementCert(cert.certificationId)}
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                  on
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-background text-foreground hover:bg-muted"
                                }`}
                              >
                                {cert.title}
                              </button>
                            )
                          })}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {announcementCertIds.length === 0
                            ? "Every learner in this department sees it."
                            : "Only learners enrolled in the selected certifications see it."}
                        </p>
                      </div>
                    ) : null}
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
                    <div className="space-y-2 overflow-y-auto max-h-[480px] pr-1">
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
                        sortedAnnouncements.map((item) => (
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
                              <p className="text-[10px] font-semibold text-primary">
                                {(item.certificationIds ?? []).length === 0
                                  ? "All certifications"
                                  : item.certificationIds.map((cid) => certTitleById.get(cid) ?? "Certification").join(" · ")}
                              </p>
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
                                    setAnnouncementCertIds(item.certificationIds ?? [])
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
      )}

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
              They leave {department?.departmentName ?? "the department"} and the institution: their section,
              department assessments and announcements are removed and their seat is freed. They keep their own
              enrolment in the certification and all their progress. Their history stays in this department's
              exports under “Former learners”.
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
