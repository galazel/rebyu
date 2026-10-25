import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  AlertTriangle,
  Award,
  Building2,
  CheckCheck,
  ClipboardListIcon,
  CreditCard,
  Download,
  GraduationCap,
  History,
  Layers,
  Loader2,
  MailIcon,
  MoreVertical,
  Pencil,
  PinIcon,
  Plus,
  Search,
  ShieldCheck,
  TargetIcon,
  Trash2,
  UserCheck,
  UserPlus,
  UsersRoundIcon,
} from "@/components/icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  InstitutionEmptyState,
  InstitutionErrorState,
  InstitutionLoadingSkeleton,
  InstitutionStatusBadge,
  formatDate,
  formatDateTime,
} from "@/components/institution/institution-ui.jsx"
import {
  archiveDepartmentAnnouncement,
  createDepartmentAnnouncement,
  deleteGroupSection,
  getDepartmentAnnouncements,
  getDepartmentHeadAssignments,
  getDepartmentHeadCodeInvitations,
  getDepartmentPrograms,
  getDepartments,
  getGroupLearnerRoster,
  getGroupSections,
  getMyInstitutionInvoices,
  removeLearnerFromGroup,
  startInvoiceCheckout,
  updateDepartmentAnnouncement,
} from "@/services/institutionService.js"
import { SectionDialog } from "@/components/institution/sections-tab.jsx"
import { CoAuthoritiesDialog } from "@/components/institution/co-authorities-dialog.jsx"
import {
  DepartmentAlertStrip,
  useDepartmentAlerts,
} from "@/components/institution/department-alert-strip.jsx"
import {
  PeriodComparisonTile,
  PeriodDeltaBadge,
  usePeriodComparison,
} from "@/components/institution/department-period-comparison.jsx"
import { isInstitutionOwner, useAuth } from "@/context/auth-context.jsx"
import { DateRangeNavigator } from "@/components/commons/date-range-navigator.jsx"
import { DashboardRearrangeControls } from "@/components/commons/dashboard-rearrange-controls.jsx"
import { DashboardBoard } from "@/components/commons/dashboard-board.jsx"
import { BentoTile } from "@/components/commons/bento.jsx"
import { useDashboardLayout } from "@/hooks/use-dashboard-layout.js"
import {
  getDepartmentStats,
  getInstitutionLearningStats,
} from "@/services/institutionLearningStatsService.js"
import { useInstitutionData } from "@/hooks/use-institution-data.js"
import { downloadCsv, timestampedFilename, toCsv } from "@/lib/csv.js"
import {
  BarBreakdownChart,
  BeadedRadialGauge,
  RadialGauge,
  StackedBarChart,
  TrendLineChart,
  readinessColor,
  useChartTheme,
} from "@/components/charts/rebyu-charts.jsx"

/* The trend tile's icon. Declared here rather than added to the shared icon
   barrel: it is used on this page only. */
const TrendingUpIconSafe = ({ className = "", "aria-hidden": ariaHidden }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden={ariaHidden}
  >
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
)

/* #3 Readiness & Mastery Analytics: the four readiness bands, in the order the
   backend names them, with the labels a head reads them by. */
const READINESS_TIERS = [
  { band: "needs_review", label: "Needs review" },
  { band: "developing", label: "Developing" },
  { band: "nearly_ready", label: "Nearly ready" },
  { band: "exam_ready", label: "Exam ready" },
]

const MASTERY_LABELS = {
  WEAK: "Weak",
  DEVELOPING: "Developing",
  GOOD: "Good",
  MASTERED: "Mastered",
}

const PREDICTED_BANDS = {
  unlikely: "unlikely",
  borderline: "borderline",
  likely: "likely",
  very_likely: "very likely",
}

const PROGRESS_TIERS = [
  { label: "Not started", min: 0, max: 0 },
  { label: "1-25%", min: 1, max: 25 },
  { label: "26-50%", min: 26, max: 50 },
  { label: "51-75%", min: 51, max: 75 },
  { label: "76-100%", min: 76, max: 100 },
]

function money(value, currency = "PHP") {
  if (value == null) return "—"
  return Number(value).toLocaleString("en-PH", { style: "currency", currency, maximumFractionDigits: 2 })
}

function passMarkFor(assessments) {
  const marks = new Set(
    assessments.map((exam) => exam.passingScore).filter((mark) => mark != null)
  )
  return marks.size === 1 ? [...marks][0] : null
}

function isoDate(date) {
  if (!date) return null
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")
}

function count(value) {
  return value == null ? "—" : Number(value).toLocaleString()
}

function percent(value, digits = 0) {
  return value == null ? "—" : `${Number(value).toFixed(digits)}%`
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
    <div
      className={`flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-border/60 pb-2.5 mb-3 ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {Icon ? (
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        ) : null}
        <div className="min-w-0">
          {kicker ? (
            <h3 className="text-[10px] font-bold uppercase leading-tight tracking-wider text-emerald-700 dark:text-emerald-400">
              {kicker}
            </h3>
          ) : null}
          <p className="truncate text-xs font-extrabold leading-snug text-foreground sm:text-sm">
            {title}
          </p>
          {hint ? (
            <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground">
              {hint}
            </p>
          ) : null}
        </div>
      </div>
      {(chip || action) && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {chip}
          {action}
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value, icon: Icon, iconClass = "", alert = false, delta = null, subtext = null, className = "" }) {
  return (
    <div
      className={`rounded-lg border p-2.5 transition-colors ${
        alert
          ? "border-rb-fox-lip/40 bg-rb-fox-lip/5 ring-1 ring-inset ring-rb-fox-lip/30"
          : "border-border/70 bg-muted/30"
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <span className="truncate">{label}</span>
        {Icon ? <Icon className={`size-3.5 shrink-0 ${iconClass}`} aria-hidden="true" /> : null}
      </div>
      <div className="mt-1.5 flex items-baseline justify-between gap-1">
        <div
          className={`font-rb-display tabular-nums ${
            alert ? "text-xl font-black text-rb-fox-lip" : "text-lg font-bold text-foreground"
          }`}
        >
          {value}
        </div>
        {delta}
      </div>
      {subtext ? (
        <div className="mt-0.5 text-[10px] text-muted-foreground tabular-nums truncate">
          {subtext}
        </div>
      ) : null}
    </div>
  )
}

function formatRelativeTime(dateValue) {
  if (!dateValue) return null
  const date = new Date(dateValue)
  const time = date.getTime()
  if (Number.isNaN(time)) return null
  const diffSec = Math.floor((Date.now() - time) / 1000)
  if (diffSec < 60) return "Just now"
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}h ago`
  const diffDays = Math.floor(diffHour / 24)
  if (diffDays === 1) return "1 day ago"
  if (diffDays < 30) return `${diffDays} days ago`
  return formatDate(dateValue)
}

export default function DepartmentHeadDashboardPage() {
  const { user } = useAuth()
  const isOwner = isInstitutionOwner(user)
  const chartTheme = useChartTheme()
  const layout = useDashboardLayout("department-head")
  const [range, setRange] = useState(null)
  const [comparisonType, setComparisonType] = useState("previous_period")
  const [isMediumScreen, setIsMediumScreen] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches
  )

  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(min-width: 768px)")
    const handler = (e) => setIsMediumScreen(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const from = isoDate(range?.from)
  const to = isoDate(range?.to)

  const departmentsQuery = useQuery({
    queryKey: ["my-institution-groups"],
    queryFn: () => getDepartments(),
    retry: 1,
  })

  const statsQuery = useQuery({
    queryKey: ["department-head-learning-stats", from, to],
    queryFn: () => getInstitutionLearningStats({ from, to }),
    placeholderData: (previous) => previous,
    retry: 1,
  })

  const periodComp = usePeriodComparison({
    range,
    enabled: true,
    comparisonType,
    currentStats: statsQuery.data,
  })

  const hardestTopics = statsQuery.data?.hardestTopics ?? []
  const hardestAssessments = statsQuery.data?.hardestAssessments ?? []

  /* #3 Readiness & Mastery Analytics. Every one of these is a cohort-scoped
     reading the backend does not aggregate yet (see Gaps in the checklist):
     the fixtures carry them under `institution/me/learning-stats` so the
     widgets have something to draw, and a real endpoint would return the same
     shapes. */
  const cohortMastery = useMemo(
    () => (Array.isArray(statsQuery.data?.cohortMastery) ? statsQuery.data.cohortMastery : []),
    [statsQuery.data]
  )
  const weakAreas = useMemo(
    () => (Array.isArray(statsQuery.data?.weakAreas) ? statsQuery.data.weakAreas : []),
    [statsQuery.data]
  )
  const predictedPass = useMemo(
    () => (Array.isArray(statsQuery.data?.predictedPass) ? statsQuery.data.predictedPass : []),
    [statsQuery.data]
  )
  const cohortPredictedPass = statsQuery.data?.cohortPredictedPass ?? 0
  const masteryTrend = useMemo(
    () => (Array.isArray(statsQuery.data?.masteryTrend) ? statsQuery.data.masteryTrend : []),
    [statsQuery.data]
  )
  const benchmarks = useMemo(
    () => (Array.isArray(statsQuery.data?.benchmarks) ? statsQuery.data.benchmarks : []),
    [statsQuery.data]
  )

  const readinessDistribution = useMemo(() => {
    const counts = statsQuery.data?.readinessDistribution ?? {}
    return READINESS_TIERS.map((tier) => ({
      tier: tier.label,
      learners: Number(counts[tier.band] ?? 0),
    }))
  }, [statsQuery.data])

  const readinessTarget = benchmarks[0]?.readinessTarget ?? 70

  const programmes = useMemo(
    () => (statsQuery.data?.certifications ?? []).filter((row) => row.enrolled > 0),
    [statsQuery.data]
  )

  const flagFor = useMemo(() => {
    const now = Date.now()
    const STALE_DAYS = 14

    return (member) => {
      const daysSince = member.lastActivityAt
        ? Math.floor((now - new Date(member.lastActivityAt).getTime()) / 86_400_000)
        : null

      if (!member.gradedAttempts && !member.lessonsCompleted) {
        return "Has not started"
      }
      if (daysSince != null && daysSince >= STALE_DAYS) {
        return `No activity in ${daysSince} days`
      }
      if (member.averageScore != null && member.averageScore < 50) {
        return `Averaging ${member.averageScore}% across ${member.gradedAttempts} attempt${member.gradedAttempts === 1 ? "" : "s"}`
      }
      if (member.passRate != null && member.passRate < 50 && member.gradedAttempts > 0) {
        return `Passing ${member.passRate}% of attempts`
      }
      return null
    }
  }, [])

  const departmentStatsQuery = useQuery({
    queryKey: ["department-head-group-stats", to],
    queryFn: () => getDepartmentStats({ to }),
    placeholderData: (previous) => previous,
    retry: 1,
  })

  const rawDepts = departmentsQuery.data
  const deptList = Array.isArray(rawDepts)
    ? rawDepts
    : Array.isArray(rawDepts?.departments)
      ? rawDepts.departments
      : Array.isArray(rawDepts?.content)
        ? rawDepts.content
        : []

  const groups = deptList.filter((group) => (group?.status ?? "active").toLowerCase() === "active")
  const assignedDeptIds = useMemo(
    () => new Set(groups.map((g) => String(g.departmentId ?? g.id))),
    [groups]
  )

  const instData = useInstitutionData(deptList[0]?.institutionId)

  /* The overview strip's own facts: the allocation behind the first active
     department (its access window), and the certification it studies. Both
     come from data the page already fetches -- no new endpoint. */
  const queryClient = useQueryClient()
  const [selectedDeptId, setSelectedDeptId] = useState(null)
  const activeSelectedDeptId = selectedDeptId ?? (groups[0]?.departmentId ?? groups[0]?.id)
  const overviewGroup = useMemo(
    () => groups.find((g) => String(g.departmentId ?? g.id) === String(activeSelectedDeptId)) ?? groups[0] ?? null,
    [groups, activeSelectedDeptId]
  )
  const primaryDeptId = overviewGroup?.departmentId ?? overviewGroup?.id
  const [createSectionOpen, setCreateSectionOpen] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [archivingSection, setArchivingSection] = useState(null)
  const [coAuthoritiesOpen, setCoAuthoritiesOpen] = useState(false)
  const [selectedSectionFilter, setSelectedSectionFilter] = useState("all")
  const [rosterStatusFilter, setRosterStatusFilter] = useState("all")
  const [rosterSearch, setRosterSearch] = useState("")
  const [removingLearner, setRemovingLearner] = useState(null)

  const removeSectionMutation = useMutation({
    mutationFn: (sectionId) => deleteGroupSection(primaryDeptId, sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-sections", primaryDeptId] })
      queryClient.invalidateQueries({ queryKey: ["department-learner-roster", primaryDeptId] })
      toast.success("Section archived. Its learners remain in the department.")
      setArchivingSection(null)
    },
    onError: (err) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Unable to archive this section."
      toast.error(msg)
    },
  })

  const removeLearnerMutation = useMutation({
    mutationFn: (learnerId) => removeLearnerFromGroup(primaryDeptId, learnerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-learner-roster", primaryDeptId] })
      queryClient.invalidateQueries({ queryKey: ["department-head-learning-stats"] })
      toast.success("Learner removed from department.")
      setRemovingLearner(null)
    },
    onError: (err) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Unable to remove this learner."
      toast.error(msg)
    },
  })

  const headCodesQuery = useQuery({
    queryKey: ["department-head-codes", primaryDeptId],
    queryFn: () => getDepartmentHeadCodeInvitations(primaryDeptId),
    enabled: primaryDeptId != null,
    retry: 1,
  })
  const headAssignmentsQuery = useQuery({
    queryKey: ["department-head-assignments", primaryDeptId],
    queryFn: () => getDepartmentHeadAssignments({ departmentId: primaryDeptId }),
    enabled: primaryDeptId != null,
    retry: 1,
  })
  const pendingHeadInvitations = useMemo(
    () => (Array.isArray(headCodesQuery.data) ? headCodesQuery.data : []).filter(
      (inv) => (inv?.status ?? "").toUpperCase() === "PENDING"
    ),
    [headCodesQuery.data]
  )
  const activeHeadAssignments = useMemo(
    () => (Array.isArray(headAssignmentsQuery.data) ? headAssignmentsQuery.data : []).filter(
      (a) => (a?.status ?? "active") === "active"
    ),
    [headAssignmentsQuery.data]
  )

  const [selectedProgramId, setSelectedProgramId] = useState("all")

  const programsQuery = useQuery({
    queryKey: ["department-programs", primaryDeptId],
    queryFn: () => getDepartmentPrograms(primaryDeptId),
    enabled: primaryDeptId != null,
  })
  const programs = useMemo(
    () => (Array.isArray(programsQuery.data) ? programsQuery.data : []),
    [programsQuery.data]
  )

  const sectionsQuery = useQuery({
    queryKey: ["department-sections", primaryDeptId],
    queryFn: () => getGroupSections(primaryDeptId),
    enabled: primaryDeptId != null,
  })
  const sections = useMemo(() => {
    const raw = Array.isArray(sectionsQuery.data) ? sectionsQuery.data : []
    if (selectedProgramId === "all") return raw
    return raw.filter((s) => String(s.programId ?? s.departmentProgramId) === String(selectedProgramId))
  }, [sectionsQuery.data, selectedProgramId])

  const rosterQuery = useQuery({
    queryKey: ["department-learner-roster", primaryDeptId],
    queryFn: () => getGroupLearnerRoster(primaryDeptId),
    enabled: primaryDeptId != null,
  })
  const sectionByLearnerId = useMemo(() => {
    const map = new Map()
    if (Array.isArray(rosterQuery.data)) {
      for (const row of rosterQuery.data) {
        if (row.learnerId != null) {
          map.set(row.learnerId, {
            sectionId: row.sectionId,
            sectionName: row.sectionName,
            departmentLearnerId: row.departmentLearnerId,
            mockExamPassed: row.mockExamPassed,
            bestMockExamScore: row.bestMockExamScore,
            mockExamPassedAt: row.mockExamPassedAt,
          })
        }
      }
    }
    return map
  }, [rosterQuery.data])

  const overviewCert = overviewGroup
    ? instData.certificationById.get(
        instData.institutionCertById.get(overviewGroup.institutionCertId)?.certificationId
      )
    : null

  const summary = statsQuery.data?.summary ?? {}
  const allMembers = useMemo(
    () => (Array.isArray(statsQuery.data?.members) ? statsQuery.data.members : []),
    [statsQuery.data]
  )

  const groupStats = useMemo(
    () =>
      (Array.isArray(departmentStatsQuery.data) ? departmentStatsQuery.data : []).filter((g) =>
        assignedDeptIds.has(String(g.departmentId))
      ),
    [departmentStatsQuery.data, assignedDeptIds]
  )

  const deptLearners = useMemo(() => {
    const deptLookup = new Map()
    instData.assignments?.forEach((assignment) => {
      const membership = instData.groupByInstitutionCertLearnerId?.get(
        assignment.institutionCertLearnerId
      )
      if (membership?.departmentId != null) {
        const dId = String(membership.departmentId)
        if (assignedDeptIds.has(dId)) {
          const activeDept = groups.find((d) => String(d.departmentId ?? d.id) === dId)
          const dName = membership.departmentName || activeDept?.departmentName || `Department #${dId}`
          deptLookup.set(assignment.learnerId, {
            departmentId: dId,
            departmentName: dName,
          })
        }
      }
    })

    return allMembers
      .map((m) => {
        const dept = deptLookup.get(m.learnerId)
        const sectionInfo = sectionByLearnerId.get(m.learnerId)
        return {
          ...m,
          departmentId: dept?.departmentId,
          departmentName: dept?.departmentName,
          sectionId: sectionInfo?.sectionId ?? null,
          sectionName: sectionInfo?.sectionName ?? null,
          departmentLearnerId: sectionInfo?.departmentLearnerId ?? null,
          lastActivityAt: m.lastActivityAt ?? null,
          mockExamPassed: sectionInfo?.mockExamPassed ?? m.mockExamPassed ?? false,
          bestMockExamScore: sectionInfo?.bestMockExamScore ?? m.bestMockExamScore ?? null,
          mockExamPassedAt: sectionInfo?.mockExamPassedAt ?? m.mockExamPassedAt ?? null,
          flag: flagFor(m),
        }
      })
      .filter((m) => m.departmentId != null)
      .sort((a, b) => {
        if (Boolean(a.flag) !== Boolean(b.flag)) return a.flag ? -1 : 1
        return Number(a.averageProgress ?? 0) - Number(b.averageProgress ?? 0)
      })
  }, [allMembers, instData.assignments, instData.groupByInstitutionCertLearnerId, assignedDeptIds, groups, flagFor, sectionByLearnerId])

  const flaggedCount = useMemo(
    () => deptLearners.filter((learner) => learner.flag).length,
    [deptLearners]
  )

  const certAllocation = overviewGroup?.institutionCertId
    ? instData.institutionCertById?.get(overviewGroup.institutionCertId)
    : null

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

  const checkoutMutation = useMutation({
    mutationFn: (invoiceId) => startInvoiceCheckout(invoiceId),
    onSuccess: ({ checkoutUrl }) => {
      window.location.assign(checkoutUrl)
    },
    onError: (error) => {
      const msg = error?.response?.data?.message ?? error?.message ?? "Could not open PayMongo checkout."
      toast.error(msg)
    },
  })

  // Checklist 15.2: Announcements quick-compose tile queries and mutations
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

  const [announcementTitle, setAnnouncementTitle] = useState("")
  const [announcementBody, setAnnouncementBody] = useState("")
  const [announcementPinned, setAnnouncementPinned] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState(null)
  const [deletingAnnouncement, setDeletingAnnouncement] = useState(null)

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
      const msg = err?.response?.data?.message ?? err?.message ?? "Unable to save this announcement."
      toast.error(msg)
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
      const msg = err?.response?.data?.message ?? err?.message ?? "Unable to update pin status."
      toast.error(msg)
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
      const msg = err?.response?.data?.message ?? err?.message ?? "Unable to archive this announcement."
      toast.error(msg)
    },
  })

  const handleInspectFlaggedRoster = useCallback(() => {
    setRosterStatusFilter("flagged")
    const el = document.getElementById("dept-learner-table")
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [])

  const handleInspectDormantRoster = useCallback(() => {
    setRosterStatusFilter("dormant")
    const el = document.getElementById("dept-learner-table")
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [])

  const alerts = useDepartmentAlerts({
    allocation: certAllocation,
    summary,
    overviewGroup,
    deptLearners,
    flaggedCount,
    invoices,
    pendingHeadInvitations,
    isOwner,
    onOpenCoAuthorities: () => setCoAuthoritiesOpen(true),
    onInspectFlaggedRoster: handleInspectFlaggedRoster,
    onInspectDormantRoster: handleInspectDormantRoster,
  })

  const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000
  const dormantCount = useMemo(() => {
    const now = Date.now()
    return deptLearners.filter((l) => {
      if (!l.lastActivityAt) return true
      const time = new Date(l.lastActivityAt).getTime()
      return !Number.isNaN(time) && now - time > FOURTEEN_DAYS_MS
    }).length
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
      const query = rosterSearch.trim().toLowerCase()
      list = list.filter((l) => {
        const nameMatch = (l.name || "").toLowerCase().includes(query)
        const usernameMatch = (l.username || "").toLowerCase().includes(query)
        return nameMatch || usernameMatch
      })
    }

    return list
  }, [deptLearners, selectedSectionFilter, rosterStatusFilter, rosterSearch])

  /* Each learner's weakest lesson against the cohort average for that same
     lesson and the benchmark -- the "is this one learner or the whole class"
     question the checklist asks for, in one row per learner. Declared here,
     after `deptLearners`, because it reads it: a useMemo dependency is
     evaluated during render, and a `const` read before its declaration throws
     `ReferenceError: Cannot access 'deptLearners' before initialization`. */
  const benchmarkRows = useMemo(() => {
    if (!predictedPass.length || !cohortMastery.length) return []
    const cohortByLesson = new Map(cohortMastery.map((row) => [row.lessonTitle, row.cohortMastery]))
    return predictedPass
      .map((learner) => {
        const member = deptLearners.find((row) => row.learnerId === learner.learnerId)
        const weakest = member?.weakLesson ?? null
        return {
          learnerId: learner.learnerId,
          name: learner.name,
          weakLesson: weakest,
          learnerMastery: weakest != null ? cohortByLesson.get(weakest) ?? null : null,
          departmentAverage: member?.averageScore ?? null,
          readinessScore: learner.readinessScore,
          predictedPassProbability: learner.predictedPassProbability,
        }
      })
      .slice(0, 8)
  }, [predictedPass, cohortMastery, deptLearners])

  const spread = useMemo(
    () =>
      PROGRESS_TIERS.map((tier) => ({
        tier: tier.label,
        learners: deptLearners.filter((member) => {
          const progress = Math.round(Number(member.averageProgress ?? 0))
          return progress >= tier.min && progress <= tier.max
        }).length,
      })),
    [deptLearners]
  )

  const needingSupport = useMemo(
    () =>
      deptLearners.filter(
        (member) => member.activeCertifications > 0 && Number(member.averageProgress ?? 0) < 30
      ).length,
    [deptLearners]
  )

  const buildCsv = () =>
    toCsv([
      {
        title: `REBYU department dashboard — ${groups.map((g) => g.departmentName).join(", ") || "my department"}`,
        columns: ["Exported", new Date().toISOString(), "Period", from ?? "all time", to ?? ""],
      },
      {
        title: "Summary",
        columns: ["Metric", "Value"],
        rows: [
          ["Students", deptLearners.length],
          ["Average completion (%)", summary.averageProgress],
          ["Pass rate (%)", summary.passRate],
          ["Average score (%)", summary.averageScore],
          ["Graded attempts", summary.gradedAttempts],
          ["Lessons completed", summary.lessonsCompleted],
          ["Needing support", needingSupport],
          ["Seats used", summary.seatsUsed],
          ["Seats total", summary.seatsTotal],
        ],
      },
      {
        title: `Period-over-period comparison (${periodComp.comparisonRange.current.fromStr} to ${periodComp.comparisonRange.current.toStr} vs ${periodComp.comparisonRange.previous.fromStr} to ${periodComp.comparisonRange.previous.toStr})`,
        columns: ["Metric", "Current Period", "Baseline Period", "Delta", "Direction"],
        rows: [
          ["Average progress (%)", periodComp.deltas.averageProgress.current, periodComp.deltas.averageProgress.previous, periodComp.deltas.averageProgress.formattedDelta, periodComp.deltas.averageProgress.delta >= 0 ? "Favorable" : "Unfavorable"],
          ["Pass rate (%)", periodComp.deltas.passRate.current, periodComp.deltas.passRate.previous, periodComp.deltas.passRate.formattedDelta, periodComp.deltas.passRate.delta >= 0 ? "Favorable" : "Unfavorable"],
          ["Average score (%)", periodComp.deltas.averageScore.current, periodComp.deltas.averageScore.previous, periodComp.deltas.averageScore.formattedDelta, periodComp.deltas.averageScore.delta >= 0 ? "Favorable" : "Unfavorable"],
          ["Graded attempts", periodComp.deltas.gradedAttempts.current, periodComp.deltas.gradedAttempts.previous, periodComp.deltas.gradedAttempts.formattedDelta, periodComp.deltas.gradedAttempts.delta >= 0 ? "Increased" : "Decreased"],
          ["Lessons completed", periodComp.deltas.lessonsCompleted.current, periodComp.deltas.lessonsCompleted.previous, periodComp.deltas.lessonsCompleted.formattedDelta, periodComp.deltas.lessonsCompleted.delta >= 0 ? "Increased" : "Decreased"],
          ["Active students", periodComp.deltas.activeMembers.current, periodComp.deltas.activeMembers.previous, periodComp.deltas.activeMembers.formattedDelta, periodComp.deltas.activeMembers.delta >= 0 ? "Increased" : "Decreased"],
        ],
      },
      {
        title: "Programme period comparison",
        columns: ["Programme", "Current Pass Rate (%)", "Baseline Pass Rate (%)", "Delta Pass Rate", "Current Avg Score (%)", "Baseline Avg Score (%)", "Delta Score", "Current Attempts", "Baseline Attempts"],
        rows: periodComp.certificationsComparison.map((c) => [
          c.title,
          c.currentPassRate,
          c.prevPassRate,
          c.deltaPassRate > 0 ? `+${c.deltaPassRate}%` : `${c.deltaPassRate}%`,
          c.currentAvgScore,
          c.prevAvgScore,
          c.deltaAvgScore > 0 ? `+${c.deltaAvgScore}%` : `${c.deltaAvgScore}%`,
          c.currentAttempts,
          c.prevAttempts,
        ]),
      },
      {
        title: "Programmes",
        columns: [
          "Programme", "Enrolled", "Passed", "In progress", "Not started",
          "Seats used", "Seats total", "Avg completion (%)", "Avg score (%)",
          "Graded attempts", "Attempt pass rate (%)",
        ],
        rows: programmes.map((row) => [
          row.title, row.enrolled, row.passed, row.inProgress, row.notStarted,
          row.seatsUsed, row.seatsTotal,
          row.averageProgress == null ? null : Math.round(Number(row.averageProgress)),
          row.averageScore, row.gradedAttempts, row.attemptPassRate,
        ]),
      },
      {
        title: "Completion spread",
        columns: ["Band", "Students"],
        rows: spread.map((band) => [band.tier, band.learners]),
      },
      {
        title: "Weakest topics",
        columns: ["Programme", "Topic", "Accuracy (%)", "Answers", "Learners"],
        rows: hardestTopics.flatMap((programme) =>
          programme.topics.map((topic) => [
            programme.certificationTitle, topic.lessonTitle,
            topic.accuracy, topic.answered, topic.learners,
          ])
        ),
      },
      {
        title: "Hardest assessments",
        columns: [
          "Programme", "Assessment", "Attempts", "Passed", "Pass rate (%)",
          "Learners", "Avg score (%)", "Pass mark (%)",
        ],
        rows: hardestAssessments.flatMap((programme) =>
          programme.assessments.map((exam) => [
            programme.certificationTitle, exam.title, exam.attempts,
            exam.passedAttempts, exam.passRate, exam.learners,
            exam.averageScore, exam.passingScore,
          ])
        ),
      },
      {
        title: "Cohort mastery by lesson",
        columns: ["Lesson", "Category", "Cohort mastery (%)", "Band", "Learners assessed"],
        rows: cohortMastery.map((row) => [
          row.lessonTitle, row.categoryTitle, row.cohortMastery, row.band, row.learnersAssessed,
        ]),
      },
      {
        title: "Weak areas",
        columns: ["Lesson", "Accuracy (%)", "Correct", "Incorrect", "Answered", "Severity", "Learners"],
        rows: weakAreas.map((row) => [
          row.lessonTitle, row.accuracyRate, row.correctCount, row.incorrectCount,
          row.answeredCount, row.severity, row.learners,
        ]),
      },
      {
        title: "Readiness distribution",
        columns: ["Band", "Students"],
        rows: readinessDistribution.map((row) => [row.tier, row.learners]),
      },
      {
        title: "Predicted pass",
        columns: ["Learner", "Readiness (%)", "Predicted pass (%)", "Band"],
        rows: predictedPass.map((row) => [
          row.name, row.readinessScore, row.predictedPassProbability, row.band,
        ]),
      },
      {
        title: "Mastery trend",
        columns: ["Week", "Cohort mastery (%)", "Benchmark (%)"],
        rows: masteryTrend.map((row) => [row.week, row.cohortMastery, row.benchmark]),
      },
      {
        title: "Sections",
        columns: ["Section", "Learners", "Finished", "Avg completion (%)"],
        rows: groupStats.map((group) => [
          group.departmentName, group.learners, group.completedLearners,
          Math.round(Number(group.averageProgress ?? 0)),
        ]),
      },
      {
        title: "Roster",
        columns: [
          "Learner", "Needs attention", "Completion (%)", "Lessons",
          "Attempts", "Avg score (%)",
        ],
        rows: deptLearners.map((learner) => [
          learner.name, learner.flag,
          Math.round(Number(learner.averageProgress ?? 0)),
          learner.lessonsCompleted, learner.gradedAttempts, learner.averageScore,
        ]),
      },
    ])

  const tiles = useMemo(() => {
    const failed = statsQuery.isError
    const totalEnrolled = programmes.reduce((sum, row) => sum + row.enrolled, 0)
    const seatsTotal = Number(summary.seatsTotal ?? 0)

    return [
      {
        id: "dept-progress",
        col: 3,
        row: 2,
        x: 0,
        y: 0,
        element: (
          <BentoTile tone="plain" col={3} row={2}>
            <div className="flex h-full flex-col justify-between gap-3">
              <DashboardCardHeader
                icon={TargetIcon}
                kicker="Department Performance"
                title="Department Progress & Pass Rate"
              />

              <div className="my-auto grid grid-cols-1 items-center gap-4 sm:grid-cols-12 py-1">
                <div className="sm:col-span-5 flex min-h-[130px] sm:min-h-[180px] items-center justify-center sm:pl-4 min-w-0">
                  <div className="w-full max-w-[130px] sm:max-w-none mx-auto flex items-center justify-center">
                    <BeadedRadialGauge
                      value={failed ? 0 : Number(summary.averageProgress) || 0}
                      label="Department Completion"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:col-span-7">
                  <StatBox
                    label="Students"
                    value={count(deptLearners.length)}
                    icon={UsersRoundIcon}
                    iconClass="text-sky-600 dark:text-sky-400"
                    delta={<PeriodDeltaBadge delta={periodComp.deltas.activeMembers.delta} size="xs" />}
                  />
                  <StatBox
                    label="Pass Rate"
                    value={failed ? "—" : percent(summary.passRate)}
                    icon={CheckCheck}
                    iconClass="text-emerald-600 dark:text-emerald-400"
                    delta={<PeriodDeltaBadge delta={periodComp.deltas.passRate.delta} unit="%" size="xs" />}
                  />
                  <StatBox
                    label="Avg Score"
                    value={failed ? "—" : percent(summary.averageScore)}
                    icon={TargetIcon}
                    iconClass="text-amber-600 dark:text-amber-400"
                    delta={<PeriodDeltaBadge delta={periodComp.deltas.averageScore.delta} unit="%" size="xs" />}
                  />
                  <StatBox
                    label="Needs Support"
                    value={failed ? "—" : count(needingSupport)}
                    icon={UserCheck}
                    iconClass="text-rb-fox-lip"
                    alert={!failed && needingSupport > 0}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
                <span>
                  <strong className="text-foreground tabular-nums">{totalEnrolled}</strong>{" "}
                  enrolments on {programmes.length} programme
                  {programmes.length === 1 ? "" : "s"}
                  {seatsTotal > 0 ? (
                    <>
                      {" "}
                      · <strong className="text-foreground tabular-nums">{seatsTotal}</strong> seats
                    </>
                  ) : null}
                </span>
                <span className="flex items-center gap-1.5">
                  <strong className="text-foreground tabular-nums">
                    {failed ? "—" : count(summary.gradedAttempts)}
                  </strong>{" "}
                  graded attempts
                  {periodComp.deltas.gradedAttempts.delta !== 0 ? (
                    <PeriodDeltaBadge delta={periodComp.deltas.gradedAttempts.delta} size="xs" />
                  ) : null}
                </span>
              </div>
            </div>
          </BentoTile>
        ),
      },
      {
        id: "dept-programme-enrolment",
        col: 3,
        row: 2,
        x: 3,
        y: 0,
        element: (
          <BentoTile col={3} row={2} className="!p-0">
            <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
              <DashboardCardHeader
                icon={GraduationCap}
                kicker="Enrolment by Programme"
                title="Who is on each certification"
                hint="Your department's learners only — a programme nobody here is on is not listed."
                chip={
                  totalEnrolled > 0 ? (
                    <Badge
                      variant="secondary"
                      className="border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      {totalEnrolled} enrolled
                    </Badge>
                  ) : null
                }
              />
              {programmes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  None of your learners are assigned to a certification yet.
                </p>
              ) : (
                <div className="relative min-h-0 flex-1">
                  <div className="-mx-2 overflow-x-auto overflow-y-auto px-2 min-h-0 h-full">
                    <StackedBarChart
                      data={programmes.map((row) => ({
                        programme: row.title,
                        passed: row.passed,
                        inProgress: row.inProgress,
                        notStarted: row.notStarted,
                      }))}
                      categoryKey="programme"
                      series={[
                        { key: "passed", name: "Passed" },
                        { key: "inProgress", name: "In progress" },
                        { key: "notStarted", name: "Not started" },
                      ]}
                      height={Math.max(130, programmes.length * 56)}
                      categoryWidth={isMediumScreen ? 140 : 110}
                      note="Passed counts awarded credentials, not assignments marked complete."
                    />
                  </div>
                  {/* Faint right-fade gradient overlay to signal horizontal overflow on small screens */}
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background/80 to-transparent sm:hidden" />
                </div>
              )}
            </div>
          </BentoTile>
        ),
      },
      {
        id: "dept-programme-table",
        col: 3,
        row: 2,
        x: 0,
        y: 2,
        element: (
          <BentoTile col={3} row={2} className="!p-0">
            <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
              <DashboardCardHeader
                icon={Award}
                kicker="Programme Scorecard"
                title="Seats, completion and marks"
                hint="Your department's learners on each programme, with their marks."
              />
              {programmes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  None of your learners are assigned to a certification yet.
                </p>
              ) : (
                <div className="-mr-2 min-h-0 flex-1 overflow-x-auto overflow-y-auto pr-2">
                  <table className="w-full text-xs" style={{ minWidth: 400 }}>
                    <thead className="sticky top-0 z-10 bg-background">
                      <tr className="border-b border-border/60 text-[11px] font-semibold text-muted-foreground">
                        <th className="py-2 pr-3 text-left">Programme</th>
                        <th className="px-2 py-2 text-center">Enrolled</th>
                        <th className="px-2 py-2 text-center">Seats</th>
                        <th className="px-2 py-2 text-center">Passed</th>
                        <th className="px-2 py-2 text-center">Avg done</th>
                        <th className="px-2 py-2 text-center">Avg score</th>
                        <th className="hidden py-2 pl-2 text-center sm:table-cell">Attempts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {programmes.map((row) => (
                        <tr
                          key={row.certificationId}
                          className="border-b border-border/40 transition-colors hover:bg-muted/40"
                        >
                          <td className="max-w-[180px] overflow-hidden text-ellipsis truncate py-2 pr-3 font-bold text-foreground">
                            {row.title}
                          </td>
                          <td className="px-2 py-2 text-center tabular-nums font-semibold text-foreground">
                            {count(row.enrolled)}
                          </td>
                          <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">
                            {row.seatsTotal > 0 ? `${row.seatsUsed}/${row.seatsTotal}` : "—"}
                          </td>
                          <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">
                            {count(row.passed)}
                            {row.passRate != null ? (
                              <span className="ml-1 text-[10px]">({row.passRate}%)</span>
                            ) : null}
                          </td>
                          <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">
                            {row.averageProgress == null
                              ? "—"
                              : `${Math.round(Number(row.averageProgress))}%`}
                          </td>
                          <td
                            className={`px-2 py-2 text-center tabular-nums font-semibold ${
                              row.averageScore != null && row.averageScore < 50
                                ? "text-destructive"
                                : "text-foreground"
                            }`}
                          >
                            {row.averageScore == null ? "—" : `${row.averageScore}%`}
                          </td>
                          <td className="hidden py-2 pl-2 text-center tabular-nums text-muted-foreground sm:table-cell">
                            {count(row.gradedAttempts)}
                            {row.attemptPassRate != null ? (
                              <span className="ml-1 text-[10px]">({row.attemptPassRate}%)</span>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </BentoTile>
        ),
      },
      {
        id: "dept-completion-spread",
        col: 3,
        row: 2,
        x: 3,
        y: 2,
        element: (
          <BentoTile col={3} row={2}>
            <DashboardCardHeader
              icon={Layers}
              kicker="Progress Distribution"
              title="How far the cohort has got"
              hint="Students per completion band — a headcount, not a share."
            />
            {deptLearners.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No learners assigned to your department yet.
              </p>
            ) : (
              <BarBreakdownChart
                data={spread}
                categoryKey="tier"
                valueKey="learners"
                horizontal={false}
                height={186}
              />
            )}
          </BentoTile>
        ),
      },
      {
        id: "dept-hard-topics",
        col: 3,
        row: 2,
        x: 0,
        y: 4,
        element: (
          <BentoTile col={3} row={2} className="!p-0">
            <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
              <DashboardCardHeader
                icon={TargetIcon}
                kicker="Teaching Signal"
                title="Topics the department is failing"
                hint="Lowest accuracy across everyone's marked answers."
              />
              {hardestTopics.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <InstitutionEmptyState
                    icon={TargetIcon}
                    title="No topic data yet"
                    description="Not enough marked answers yet to rank topics."
                  />
                </div>
              ) : (
                <div className="-mr-2 min-h-0 flex-1 space-y-5 overflow-y-auto pr-2">
                  {hardestTopics.map((programme) => (
                    <div key={programme.certificationId}>
                      <p className="mb-2 truncate text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {programme.certificationTitle}
                      </p>
                      <BarBreakdownChart
                        data={programme.topics.map((topic) => ({
                          topic: topic.lessonTitle,
                          accuracy: topic.accuracy,
                        }))}
                        categoryKey="topic"
                        valueKey="accuracy"
                        unit="%"
                        target={50}
                        domainMax={100}
                        height={Math.max(120, programme.topics.length * 34)}
                        categoryWidth={150}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </BentoTile>
        ),
      },
      {
        id: "dept-hard-assessments",
        col: 3,
        row: 2,
        x: 3,
        y: 4,
        element: (
          <BentoTile col={3} row={2} className="!p-0">
            <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
              <DashboardCardHeader
                icon={ClipboardListIcon}
                kicker="Assessment Signal"
                title="Hardest assessments"
                hint="Lowest pass rate first, per programme — a paper nobody passes is worth a look."
              />
              {hardestAssessments.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <InstitutionEmptyState
                    icon={ClipboardListIcon}
                    title="No graded assessments"
                    description="No assessment has been graded in this department yet."
                  />
                </div>
              ) : (
                <div className="-mr-2 min-h-0 flex-1 space-y-5 overflow-y-auto pr-2">
                  {hardestAssessments.map((programme) => (
                    <div key={programme.certificationId}>
                      <p className="mb-2 truncate text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {programme.certificationTitle}
                      </p>
                      <BarBreakdownChart
                        data={programme.assessments.map((exam) => ({
                          exam: exam.title,
                          averageScore: exam.averageScore ?? 0,
                          passRate: exam.passRate,
                          passedAttempts: exam.passedAttempts,
                          attempts: exam.attempts,
                          learners: exam.learners,
                          passingScore: exam.passingScore,
                        }))}
                        categoryKey="exam"
                        valueKey="averageScore"
                        unit="%"
                        target={passMarkFor(programme.assessments)}
                        domainMax={100}
                        height={Math.max(120, programme.assessments.length * 36)}
                        categoryWidth={150}
                        tooltipContent={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null
                          const item = payload[0]?.payload
                          if (!item) return null
                          return (
                            <div className="rounded-xl border-2 border-border bg-popover px-3 py-2 text-popover-foreground shadow-md">
                              <div className="text-xs font-bold text-muted-foreground">{label}</div>
                              <ul className="mt-1 space-y-1 text-xs">
                                <li className="flex items-center justify-between gap-4">
                                  <span className="text-muted-foreground">Average score</span>
                                  <span className="font-bold tabular-nums">
                                    {item.averageScore}%
                                  </span>
                                </li>
                                <li className="flex items-center justify-between gap-4">
                                  <span className="text-muted-foreground">Pass rate</span>
                                  <span
                                    className={`font-bold tabular-nums ${
                                      item.passRate === 0 ? "text-destructive" : ""
                                    }`}
                                  >
                                    {item.passRate != null ? `${item.passRate}%` : "—"}
                                    {item.attempts != null
                                      ? ` (${item.passedAttempts ?? 0}/${item.attempts} passed)`
                                      : ""}
                                  </span>
                                </li>
                                <li className="flex items-center justify-between gap-4">
                                  <span className="text-muted-foreground">Learners</span>
                                  <span className="font-semibold tabular-nums">
                                    {item.learners ?? 0} learner{item.learners === 1 ? "" : "s"}
                                  </span>
                                </li>
                                {item.passingScore != null ? (
                                  <li className="flex items-center justify-between gap-4">
                                    <span className="text-muted-foreground">Pass mark</span>
                                    <span className="font-medium tabular-nums text-muted-foreground">
                                      {item.passingScore}%
                                    </span>
                                  </li>
                                ) : null}
                              </ul>
                            </div>
                          )
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </BentoTile>
        ),
      },
      // Period-over-period comparison using /learning-stats?from=&to=
      {
        id: "dept-period-comparison",
        col: 6,
        row: 3,
        x: 0,
        y: 11,
        element: (
          <PeriodComparisonTile
            comparisonRange={periodComp.comparisonRange}
            deltas={periodComp.deltas}
            certificationsComparison={periodComp.certificationsComparison}
            learnerMomentum={periodComp.learnerMomentum}
            insights={periodComp.insights}
            comparisonType={comparisonType}
            onComparisonTypeChange={setComparisonType}
            isLoading={periodComp.isLoading}
            isError={periodComp.isError}
          />
        ),
      },
      // Section management & cohort breakdown
      {
        id: "dept-section-breakdown",
        col: 6,
        row: 2,
        x: 0,
        y: 14,
        element: (
          <BentoTile col={6} row={2} className="!p-0">
            <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
              <DashboardCardHeader
                icon={Layers}
                kicker="Section Management"
                title="Sections & Cohorts"
                hint="Active classes, learner headcount, pending invitations, and benchmark progress."
                action={
                  primaryDeptId ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => setCreateSectionOpen(true)}
                      >
                        <Plus className="size-3.5" aria-hidden="true" />
                        New section
                      </Button>
                      <Button asChild size="sm" variant="ghost" className="h-7 text-xs gap-1">
                        <Link to={`/institution/departments/${primaryDeptId}?tab=learners`}>
                          <Layers className="size-3.5" aria-hidden="true" />
                          Manage in workspace
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
                    <Button
                      size="sm"
                      onClick={() => setCreateSectionOpen(true)}
                      className="gap-1.5"
                    >
                      <Plus className="size-3.5" aria-hidden="true" />
                      Create first section
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div className="-mr-2 min-h-0 flex-1 space-y-3 overflow-y-auto pr-2">
                  {sections.map((section) => {
                    const sectionLearners = deptLearners.filter(
                      (l) => l.sectionId === section.sectionId
                    )
                    const totalInSection =
                      section.learnerCount != null
                        ? Number(section.learnerCount)
                        : sectionLearners.length
                    const progress = sectionLearners.length
                      ? Math.round(
                          sectionLearners.reduce(
                            (sum, l) => sum + Number(l.averageProgress ?? 0),
                            0
                          ) / sectionLearners.length
                        )
                      : 0
                    const scoredLearners = sectionLearners.filter(
                      (l) => l.averageScore != null
                    )
                    const avgScore = scoredLearners.length
                      ? Math.round(
                          scoredLearners.reduce(
                            (sum, l) => sum + Number(l.averageScore),
                            0
                          ) / scoredLearners.length
                        )
                      : null
                    const pendingCount = Number(section.pendingInvitationCount ?? 0)

                    return (
                      <div
                        key={section.sectionId}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border/40 bg-muted/20 px-3.5 py-2.5 transition-colors hover:bg-muted/40"
                      >
                        {/* Row 1 on mobile: section info + pending badge */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/institution/departments/${primaryDeptId}?tab=learners`}
                              className="font-bold text-xs text-foreground hover:underline truncate"
                            >
                              {section.sectionName}
                            </Link>
                            {pendingCount > 0 ? (
                              <Badge
                                variant="secondary"
                                className="gap-1 border-amber-500/20 bg-amber-500/10 text-[10px] text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                              >
                                <MailIcon className="size-3" aria-hidden="true" />
                                {pendingCount} pending
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {section.programName ? `${section.programName} · ` : ""}
                            {section.certificationTitle || "General"}
                            {section.description ? ` · ${section.description}` : ""}
                          </p>
                        </div>

                        {/* Row 2 on mobile: progress + chips + actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                          <div className="flex items-center gap-2 flex-1 sm:flex-initial sm:w-36">
                            <Progress value={progress} className="h-1.5 flex-1" />
                            <span className="w-8 text-right text-xs font-bold tabular-nums text-foreground">
                              {progress}%
                            </span>
                          </div>
                          {avgScore != null ? (
                            <Badge
                              variant="secondary"
                              className="text-[10px] shrink-0 font-medium tabular-nums bg-primary/10 text-primary border-primary/20"
                            >
                              avg {avgScore}%
                            </Badge>
                          ) : null}
                          <Badge variant="outline" className="text-xs shrink-0">
                            {count(totalInSection)} {totalInSection === 1 ? "student" : "students"}
                          </Badge>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs">
                              <Link to={`/institution/departments/${primaryDeptId}?tab=learners`}>
                                Open
                              </Link>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-muted-foreground hover:text-foreground"
                                  aria-label={`Actions for section ${section.sectionName}`}
                                >
                                  <MoreVertical className="size-3.5" aria-hidden="true" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36">
                                <DropdownMenuItem
                                  onClick={() => setEditingSection(section)}
                                  className="gap-2 text-xs"
                                >
                                  <Pencil className="size-3.5" aria-hidden="true" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setArchivingSection(section)}
                                  className="gap-2 text-xs text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="size-3.5" aria-hidden="true" />
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
        ),
      },
      {
        id: "dept-co-authorities",
        col: 6,
        row: 2,
        x: 0,
        y: 10,
        element: (
          <BentoTile tone="plain" col={6} row={2}>
            <div className="flex h-full flex-col justify-between gap-3">
              <DashboardCardHeader
                icon={ShieldCheck}
                kicker="Delegation & Faculty Leadership"
                title="Co-Authorities & Pending Invitations"
                hint={`${activeHeadAssignments.length} active authority${activeHeadAssignments.length === 1 ? "" : "ies"} · ${pendingHeadInvitations.length} pending code invitation${pendingHeadInvitations.length === 1 ? "" : "s"}`}
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCoAuthoritiesOpen(true)}
                    className="h-8 gap-1.5 text-xs font-semibold"
                  >
                    <UserPlus className="size-3.5" aria-hidden="true" />
                    Manage Co-Authorities
                  </Button>
                }
              />

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                  iconClass={
                    pendingHeadInvitations.length > 0
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground"
                  }
                />
                <StatBox
                  label="Assigned Department"
                  value={overviewGroup?.departmentName || overviewGroup?.name || "Department"}
                  icon={Building2}
                  iconClass="text-sky-600 dark:text-sky-400"
                  className="hidden sm:block"
                />
              </div>

              {pendingHeadInvitations.length > 0 ? (
                <div className="space-y-1.5 rounded-lg border border-border/70 bg-muted/20 p-2.5">
                  <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-muted-foreground">
                    <span>Recent Pending Invitations</span>
                    {pendingHeadInvitations.length > 2 && (
                      <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                        +{pendingHeadInvitations.length - 2} more
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {pendingHeadInvitations.slice(0, 2).map((inv) => (
                      <div
                        key={inv.invitationId || inv.email}
                        className="flex items-center justify-between gap-2 rounded-md bg-background/60 px-2.5 py-1.5 text-xs border border-border/40"
                      >
                        <span className="truncate font-mono text-[11px] font-medium text-foreground max-w-[200px] sm:max-w-[280px]">
                          {inv.email}
                        </span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {formatDate(inv.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/20 px-3.5 py-2.5 text-xs text-muted-foreground">
                  <span className="truncate">
                    No pending invitations. Faculty can co-manage curricula and assessments.
                  </span>
                </div>
              )}
            </div>
          </BentoTile>
        ),
      },
      {
        id: "dept-invoices",
        col: 3,
        row: 2,
        x: 0,
        y: 12,
        element: (
          <BentoTile tone="plain" col={3} row={2}>
            <div className="flex h-full flex-col justify-between gap-3">
              <DashboardCardHeader
                icon={CreditCard}
                kicker="Billing & Payments"
                title="Invoices Summary"
                hint={`${invoices.length} total invoice${invoices.length === 1 ? "" : "s"}`}
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
                  <div className="h-10 w-full animate-pulse rounded-lg bg-muted/50" />
                </div>
              ) : invoices.length === 0 ? (
                <div className="my-auto flex flex-col items-center justify-center p-4 text-center text-xs text-muted-foreground">
                  <CreditCard className="size-8 text-muted-foreground/40 mb-2" aria-hidden="true" />
                  <p className="font-semibold text-foreground">No invoices</p>
                  <p className="mt-0.5">Your institution has no billing records yet.</p>
                </div>
              ) : (
                <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1">
                  {invoices.slice(0, 5).map((inv) => {
                    const isPayable = inv.status !== "paid" && (inv.payable ?? true)
                    const isOverdue = inv.status === "overdue" || (inv.dueAt && new Date(inv.dueAt) < new Date() && inv.status !== "paid")
                    const statusLabel = isOverdue ? "OVERDUE" : (inv.status || "PENDING").toUpperCase()

                    return (
                      <div
                        key={inv.institutionInvoiceId}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-border/70 bg-card p-2.5 transition-colors hover:border-primary/30"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link
                              to={`/institution/invoices/${inv.institutionInvoiceId}`}
                              className="font-mono text-xs font-bold text-foreground hover:underline"
                            >
                              {inv.invoiceNumber || `Invoice #${inv.institutionInvoiceId}`}
                            </Link>
                            <Badge
                              variant={
                                inv.status === "paid"
                                  ? "default"
                                  : isOverdue
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="text-[10px] uppercase font-bold px-1.5 py-0"
                            >
                              {statusLabel}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {formatDate(inv.issuedAt)} {inv.dueAt ? `· Due ${formatDate(inv.dueAt)}` : ""}
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                          <span className="font-bold text-xs text-foreground tabular-nums">
                            {money(inv.totalAmount, inv.currency)}
                          </span>
                          {isPayable ? (
                            <Button
                              size="sm"
                              className="h-7 px-2.5 text-xs font-semibold"
                              onClick={() => checkoutMutation.mutate(inv.institutionInvoiceId)}
                              disabled={checkoutMutation.isPending}
                            >
                              {checkoutMutation.isPending ? (
                                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                              ) : (
                                "Pay now"
                              )}
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs text-muted-foreground">
                              <Link to={`/institution/invoices/${inv.institutionInvoiceId}`}>View</Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="border-t border-border/50 pt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Invoices are issued on partnership approvals</span>
                <Link to="/institution/invoices" className="font-semibold text-primary hover:underline">
                  Go to Invoices →
                </Link>
              </div>
            </div>
          </BentoTile>
        ),
      },
      {
        id: "dept-announcements",
        col: 3,
        row: 2,
        x: 3,
        y: 12,
        element: (
          <BentoTile tone="plain" col={3} row={2}>
            <div className="flex h-full flex-col justify-between gap-3">
              <DashboardCardHeader
                icon={PinIcon}
                kicker="Department Communications"
                title="Announcements & Quick-Compose"
                hint={`${announcements.length} announcement${announcements.length === 1 ? "" : "s"}`}
                action={
                  <Button variant="ghost" size="sm" asChild className="h-7 text-xs font-semibold text-primary">
                    <Link to={`/institution/departments/${primaryDeptId}?tab=announcements`}>
                      Workspace view
                    </Link>
                  </Button>
                }
              />

              {/* Inline Quick Compose Form (Checklist 15.2) */}
              <div className="rounded-lg border border-border/70 bg-muted/20 p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-foreground">
                    {editingAnnouncement ? "Edit Announcement" : "Quick Compose"}
                  </span>
                  {editingAnnouncement ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAnnouncement(null)
                        setAnnouncementTitle("")
                        setAnnouncementBody("")
                        setAnnouncementPinned(false)
                      }}
                      className="text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
                <Input
                  placeholder="Announcement title..."
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="h-7 text-xs bg-background"
                  maxLength={200}
                />
                <Textarea
                  placeholder="Share a message or reminder..."
                  value={announcementBody}
                  onChange={(e) => setAnnouncementBody(e.target.value)}
                  rows={2}
                  className="text-xs min-h-[48px] bg-background resize-none py-1.5"
                />
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                    <Switch
                      checked={announcementPinned}
                      onCheckedChange={setAnnouncementPinned}
                      className="scale-75"
                    />
                    <span>Pin to top</span>
                  </label>
                  <Button
                    size="sm"
                    className="h-7 px-3 text-xs"
                    disabled={!announcementTitle.trim() || !announcementBody.trim() || saveAnnouncementMutation.isPending}
                    onClick={() => saveAnnouncementMutation.mutate()}
                  >
                    {saveAnnouncementMutation.isPending ? (
                      <Loader2 className="size-3 animate-spin mr-1" aria-hidden="true" />
                    ) : null}
                    {editingAnnouncement ? "Save" : "Post"}
                  </Button>
                </div>
              </div>

              {/* Recent Announcements List */}
              <div className="space-y-1.5 overflow-y-auto max-h-[160px] pr-1">
                {announcementsQuery.isLoading ? (
                  <div className="space-y-1.5 py-1">
                    <div className="h-8 w-full animate-pulse rounded bg-muted/50" />
                    <div className="h-8 w-full animate-pulse rounded bg-muted/50" />
                  </div>
                ) : announcements.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-2">
                    No announcements posted for this department yet.
                  </p>
                ) : (
                  sortedAnnouncements.slice(0, 3).map((item) => (
                    <div
                      key={item.departmentAnnouncementId}
                      className="flex items-start justify-between gap-2 rounded-lg border border-border/50 bg-card p-2 text-xs transition-colors hover:border-primary/30"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          {item.pinned ? (
                            <Badge
                              variant="secondary"
                              className="gap-1 px-1 py-0 text-[10px] font-bold text-primary bg-primary/10 border-primary/20"
                            >
                              <PinIcon className="size-2.5" aria-hidden="true" />
                              Pinned
                            </Badge>
                          ) : null}
                          <p className="font-bold text-foreground truncate">{item.title}</p>
                        </div>
                        <p className="line-clamp-1 text-[11px] text-muted-foreground">{item.body}</p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-6 shrink-0 text-muted-foreground">
                            <MoreVertical className="size-3.5" aria-hidden="true" />
                            <span className="sr-only">Announcement options</span>
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
                            <Pencil className="mr-2 size-3.5" aria-hidden="true" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => pinAnnouncementMutation.mutate(item)}>
                            <PinIcon className="mr-2 size-3.5" aria-hidden="true" />
                            {item.pinned ? "Unpin" : "Pin"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletingAnnouncement(item)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 size-3.5" aria-hidden="true" />
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))
                )}
              </div>

              {/* Mobile / Footer Link */}
              <div className="border-t border-border/50 pt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Pinned items display first</span>
                <Link
                  to={`/institution/departments/${primaryDeptId}?tab=announcements`}
                  className="font-semibold text-primary hover:underline"
                >
                  View all ({announcements.length}) →
                </Link>
              </div>
            </div>
          </BentoTile>
        ),
      },
      {
        id: "dept-learner-table",
        col: 6,
        row: 2,
        x: 0,
        y: 15,
        element: (
          <BentoTile col={6} row={2} className="!p-0">
            <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
              <DashboardCardHeader
                icon={Building2}
                kicker="Department Roster"
                title="Student roster & who needs a conversation"
                hint="Anyone flagged sits at the top, with the reason beside their name."
              />

              {/* Dedicated filter bar: Search + Section + Status pills (Checklist 10.1) */}
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-border/50">
                <div className="relative w-full sm:w-64">
                  <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    type="search"
                    placeholder="Search by student name or username..."
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    className="h-8 pl-8 text-xs bg-background"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {sections.length > 0 && (
                    <div className="w-full sm:w-44">
                      <Select
                        value={selectedSectionFilter}
                        onValueChange={setSelectedSectionFilter}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue placeholder="All sections" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All sections ({deptLearners.length})</SelectItem>
                          {sections.map((s) => {
                            const c = deptLearners.filter((l) => l.sectionId === s.sectionId).length
                            return (
                              <SelectItem key={s.sectionId} value={String(s.sectionId)}>
                                {s.sectionName} ({c})
                              </SelectItem>
                            )
                          })}
                          <SelectItem value="none">
                            Unassigned ({deptLearners.filter((l) => l.sectionId == null).length})
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRosterStatusFilter("all")}
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                        rosterStatusFilter === "all"
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      All ({deptLearners.length})
                    </button>
                    {flaggedCount > 0 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setRosterStatusFilter(rosterStatusFilter === "flagged" ? "all" : "flagged")
                        }
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                          rosterStatusFilter === "flagged"
                            ? "border border-amber-500/50 bg-amber-500/20 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500/40"
                            : "border border-amber-500/20 bg-amber-500/10 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-500/20"
                        }`}
                      >
                        <AlertTriangle className="size-3 shrink-0" aria-hidden="true" />
                        <span>{flaggedCount} flagged</span>
                      </button>
                    ) : null}
                    {dormantCount > 0 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setRosterStatusFilter(rosterStatusFilter === "dormant" ? "all" : "dormant")
                        }
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                          rosterStatusFilter === "dormant"
                            ? "border border-sky-500/50 bg-sky-500/20 text-sky-800 dark:text-sky-300 ring-1 ring-sky-500/40"
                            : "border border-sky-500/20 bg-sky-500/10 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 hover:bg-sky-500/20"
                        }`}
                      >
                        <UsersRoundIcon className="size-3 shrink-0" aria-hidden="true" />
                        <span>{dormantCount} dormant</span>
                      </button>
                    ) : null}
                    {(rosterStatusFilter !== "all" || rosterSearch) ? (
                      <button
                        type="button"
                        onClick={() => {
                          setRosterStatusFilter("all")
                          setRosterSearch("")
                        }}
                        className="text-[11px] text-muted-foreground underline hover:text-foreground ml-1"
                      >
                        Reset filters
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              {statsQuery.isError ? (
                <p className="text-sm text-muted-foreground mt-3">
                  Department learners could not be loaded.
                </p>
              ) : deptLearners.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground">
                  <Building2 className="mb-2 size-8 text-muted-foreground/40" />
                  <p>No learners assigned to your department yet.</p>
                </div>
              ) : (
                <div className="relative min-h-0 flex-1">
                  {/* Right-fade gradient to hint horizontal scroll affordance (Checklist 10.2) */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent z-20"
                  />
                  <div className="min-h-0 h-full overflow-x-auto">
                    <table className="w-full text-sm border-separate border-spacing-0" style={{ minWidth: 560 }}>
                      <thead className="sticky top-0 bg-background z-10">
                        <tr className="border-b border-border/40 text-xs font-semibold text-muted-foreground">
                          <th className="py-2.5 pl-2 pr-3 text-left sticky left-0 bg-background z-20 border-r border-border/40 shadow-xs">
                            Student Name
                          </th>
                          <th className="py-2.5 px-3 text-left">Section</th>
                          <th className="hidden sm:table-cell py-2.5 px-3 text-left">Last active</th>
                          <th className="py-2.5 px-3 text-left">Needs attention</th>
                          <th className="py-2.5 px-3 text-left">Progress</th>
                          <th className="hidden sm:table-cell py-2.5 px-2 text-center">Lessons</th>
                          <th className="hidden sm:table-cell py-2.5 px-2 text-center">Attempts</th>
                          <th className="py-2.5 px-2 text-center">Avg Score</th>
                          <th className="hidden sm:table-cell py-2.5 px-2 text-center">Mock</th>
                          <th className="py-2.5 pl-2 pr-3 text-right">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLearners.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="py-6 text-center text-xs text-muted-foreground">
                              {rosterSearch.trim() ? (
                                <div className="space-y-1">
                                  <p>No students match “{rosterSearch}”.</p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-primary"
                                    onClick={() => setRosterSearch("")}
                                  >
                                    Clear search
                                  </Button>
                                </div>
                              ) : rosterStatusFilter === "flagged" ? (
                                <div className="space-y-1">
                                  <p>No flagged learners found in this view.</p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-primary"
                                    onClick={() => setRosterStatusFilter("all")}
                                  >
                                    View all students
                                  </Button>
                                </div>
                              ) : rosterStatusFilter === "dormant" ? (
                                <div className="space-y-1">
                                  <p>No dormant learners found in this view.</p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-primary"
                                    onClick={() => setRosterStatusFilter("all")}
                                  >
                                    View all students
                                  </Button>
                                </div>
                              ) : (
                                "No students in this section."
                              )}
                            </td>
                          </tr>
                        ) : (
                          filteredLearners.map((learner) => {
                            const lastActive = formatRelativeTime(learner.lastActivityAt)
                            return (
                              <tr
                                key={learner.learnerId}
                                className="border-b border-border/40 hover:bg-muted/40 transition-colors"
                              >
                                <td className="py-2.5 pl-2 pr-3 sticky left-0 bg-background z-10 border-r border-border/40 shadow-xs">
                                  <Link
                                    to={`/institution/departments/${learner.departmentId || groups[0]?.departmentId || groups[0]?.id}/learners/${learner.learnerId}`}
                                    className="font-bold text-foreground hover:underline text-xs"
                                  >
                                    {learner.name || `Learner #${learner.learnerId}`}
                                  </Link>
                                </td>
                                <td className="py-2.5 px-3">
                                  {learner.sectionName ? (
                                    <Badge variant="outline" className="text-[11px] font-medium border-border/80">
                                      {learner.sectionName}
                                    </Badge>
                                  ) : (
                                    <span className="text-xs text-muted-foreground/60 italic">Unassigned</span>
                                  )}
                                </td>
                                <td className="hidden sm:table-cell py-2.5 px-3">
                                  {lastActive ? (
                                    <span className="text-xs text-muted-foreground">{lastActive}</span>
                                  ) : (
                                    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
                                      Never
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  {learner.flag ? (
                                    <span className="flex items-center gap-1.5 text-xs font-semibold text-rb-fox-lip">
                                      <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
                                      <span className="truncate">{learner.flag}</span>
                                    </span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-2 max-w-[140px]">
                                    <Progress
                                      value={Number(learner.averageProgress ?? 0)}
                                      className="h-2 flex-1 rounded-full"
                                    />
                                    <span className="shrink-0 tabular-nums text-xs font-bold text-foreground">
                                      {percent(learner.averageProgress)}
                                    </span>
                                  </div>
                                </td>
                                <td className="hidden sm:table-cell py-2.5 px-2 text-center tabular-nums text-xs text-muted-foreground">
                                  {count(learner.lessonsCompleted)}
                                </td>
                                <td className="hidden sm:table-cell py-2.5 px-2 text-center tabular-nums text-xs text-muted-foreground">
                                  {count(learner.gradedAttempts)}
                                </td>
                                <td className="py-2.5 px-2 text-center tabular-nums text-xs font-semibold text-foreground">
                                  {percent(learner.averageScore)}
                                </td>
                                <td className="hidden sm:table-cell py-2.5 px-2 text-center tabular-nums text-xs">
                                  {learner.mockExamPassed ? (
                                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-0 text-[10px] font-semibold">
                                      Pass{Number.isFinite(Number(learner.bestMockExamScore)) ? ` (${Math.round(Number(learner.bestMockExamScore))}%)` : ""}
                                    </Badge>
                                  ) : Number.isFinite(Number(learner.bestMockExamScore)) ? (
                                    <span className="text-[11px] text-muted-foreground">
                                      {Math.round(Number(learner.bestMockExamScore))}%
                                    </span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </td>
                                <td className="py-2.5 pl-2 pr-3 text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:size-7 text-muted-foreground hover:text-foreground"
                                      >
                                        <MoreVertical className="size-3.5" aria-hidden="true" />
                                        <span className="sr-only">Student actions</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuItem asChild>
                                        <Link
                                          to={`/institution/departments/${learner.departmentId || groups[0]?.departmentId || groups[0]?.id}/learners/${learner.learnerId}`}
                                        >
                                          View analytics
                                        </Link>
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => setRemovingLearner(learner)}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="mr-2 size-3.5" aria-hidden="true" />
                                        Remove from department
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </BentoTile>
        ),
      },
    ]
  }, [
    summary,
    spread,
    needingSupport,
    programmes,
    hardestTopics,
    hardestAssessments,
    cohortMastery,
    weakAreas,
    readinessDistribution,
    predictedPass,
    cohortPredictedPass,
    masteryTrend,
    benchmarkRows,
    readinessTarget,
    benchmarks,
    flaggedCount,
    dormantCount,
    rosterStatusFilter,
    rosterSearch,
    groupStats,
    deptLearners,
    filteredLearners,
    selectedSectionFilter,
    sections,
    sectionsQuery.isLoading,
    sectionsQuery.isError,
    primaryDeptId,
    groups,
    statsQuery.isError,
    statsQuery.data,
    departmentStatsQuery.isError,
    activeHeadAssignments,
    pendingHeadInvitations,
    overviewGroup,
    periodComp.deltas,
    periodComp.certificationsComparison,
    periodComp.learnerMomentum,
    periodComp.insights,
    periodComp.comparisonRange,
    periodComp.isLoading,
    periodComp.isError,
    invoices,
    invoicesQuery.isLoading,
    checkoutMutation.isPending,
    announcements,
    sortedAnnouncements,
    announcementsQuery.isLoading,
    announcementTitle,
    announcementBody,
    announcementPinned,
    editingAnnouncement,
    saveAnnouncementMutation.isPending,
    pinAnnouncementMutation.isPending,
    comparisonType,
  ])

  if (departmentsQuery.isLoading) return <InstitutionLoadingSkeleton />
  if (departmentsQuery.isError)
    return <InstitutionErrorState title="Unable to load your departments" onRetry={departmentsQuery.refetch} />

  return (
    <div className="space-y-6">
      {/* Mobile Alert Banner (Item 2.1) */}
      {alerts.length > 0 ? (
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById("dept-alert-strip")
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
          }}
          className={`sm:hidden w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold shadow-xs transition-colors ${
            alerts.some((a) => a.severity === "critical")
              ? "border-rose-500/50 bg-rose-500/10 text-rose-800 dark:text-rose-300 ring-1 ring-rose-500/30 animate-pulse"
              : "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300"
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <span className="truncate">
              {alerts.length} department alert{alerts.length === 1 ? "" : "s"} require attention
            </span>
          </div>
          <span className="shrink-0 text-[11px] underline">View</span>
        </button>
      ) : null}

      {/* Controls & Header Navigation (Checklist 1) */}
      <div className="relative z-30 flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2.5">
        {/* Left semantic group: Context selectors (Dept Selector + DateRangeNavigator) */}
        <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="w-full sm:w-[220px] shrink-0">
            <Select
              value={selectedProgramId}
              onValueChange={setSelectedProgramId}
              disabled={programs.length === 0}
            >
              <SelectTrigger className="h-9 w-full bg-background" id="dept-header-program-picker">
                <SelectValue placeholder="Select Program" />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="all">All Programs ({programs.length})</SelectItem>
                {programs.map((prog) => {
                  const idStr = String(prog.programId ?? prog.id)
                  const code = prog.programCode ? `${prog.programCode} - ` : ""
                  return (
                    <SelectItem key={idStr} value={idStr}>
                      {code}{prog.programName || prog.name || `Program #${idStr}`}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:max-w-[320px]">
            <DateRangeNavigator className="w-full" onRangeChange={setRange} />
          </div>
        </div>

        {/* Right semantic group: Action buttons & alerts */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 md:border-l md:border-border/30 md:pl-3">
          {/* 1.3: Alert badge as first item in right-side group */}
          {alerts.length > 0 ? (
            <Badge
              variant="outline"
              className={`hidden sm:inline-flex h-9 px-3 gap-1.5 cursor-pointer font-bold transition-all rounded-full select-none ${
                alerts.some((a) => a.severity === "critical")
                  ? "border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-400 ring-2 ring-rose-500/40 ring-offset-1 hover:bg-rose-500/20 animate-pulse"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
              }`}
              onClick={() => {
                const el = document.getElementById("dept-alert-strip")
                if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
              }}
              title="Click to view alerts"
            >
              <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
              <span>{alerts.length} Alert{alerts.length === 1 ? "" : "s"}</span>
            </Badge>
          ) : null}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const el = document.getElementById("dept-period-comparison")
              if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
            }}
            className="gap-1.5 h-9 justify-center w-full sm:w-auto"
            id="dept-header-period-comparison-btn"
            title="Jump to period comparison analysis"
          >
            <History className="size-3.5 text-primary" aria-hidden="true" />
            <span className="hidden sm:inline">Compare:</span>
            <span className="font-bold text-xs">
              {comparisonType === "prior_year" ? "YoY" : "vs Baseline"}
            </span>
            {periodComp.deltas.passRate.hasData ? (
              <PeriodDeltaBadge delta={periodComp.deltas.passRate.delta} unit="%" size="xs" />
            ) : null}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCoAuthoritiesOpen(true)}
            className="gap-2 h-9 justify-center w-full sm:w-auto"
            id="dept-header-co-authorities-btn"
          >
            <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span className="text-xs sm:text-sm">Co-Authorities</span>
            {pendingHeadInvitations.length > 0 ? (
              <Badge
                variant="secondary"
                className="ml-1 h-5 px-1.5 text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold"
              >
                {pendingHeadInvitations.length}
              </Badge>
            ) : null}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 justify-center w-full sm:w-auto text-xs sm:text-sm"
            onClick={() => downloadCsv(timestampedFilename("rebyu-department-dashboard"), buildCsv())}
            disabled={statsQuery.isLoading || statsQuery.isError}
          >
            <Download className="size-4" aria-hidden="true" />
            Export CSV
          </Button>

          <div className="flex items-center justify-center sm:justify-start">
            <DashboardRearrangeControls
              rearranging={layout.rearranging}
              onStart={layout.startRearranging}
              onFinish={layout.finishRearranging}
              onCancel={layout.cancelRearranging}
              onReset={layout.resetLayout}
            />
          </div>
        </div>
      </div>

      {/* Mobile Sticky Rearrange Bottom Bar */}
      {layout.rearranging ? (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-50 flex items-center justify-between gap-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur shadow-lg animate-in slide-in-from-bottom-2">
          <span className="text-xs font-semibold text-muted-foreground">Rearranging tiles</span>
          <DashboardRearrangeControls
            rearranging={layout.rearranging}
            onStart={layout.startRearranging}
            onFinish={layout.finishRearranging}
            onCancel={layout.cancelRearranging}
            onReset={layout.resetLayout}
          />
        </div>
      ) : null}

      {/* Alert Strip: Expiring Access, Seat Budget, Dormant/At-Risk Learners, Unpaid Invoices, Pending Invites */}
      <DepartmentAlertStrip alerts={alerts} />

      <DashboardBoard
        tiles={tiles}
        layout={layout.tileLayout}
        editing={layout.rearranging}
        onLayoutChange={layout.handleLayoutChange}
      />

      {createSectionOpen && primaryDeptId ? (
        <SectionDialog
          key="create-section"
          open={createSectionOpen}
          onOpenChange={setCreateSectionOpen}
          departmentId={primaryDeptId}
          institutionCertId={overviewGroup?.institutionCertId ?? null}
          certifications={overviewGroup?.certifications ?? []}
        />
      ) : null}

      {editingSection && primaryDeptId ? (
        <SectionDialog
          key={`edit-${editingSection.sectionId}`}
          open={Boolean(editingSection)}
          onOpenChange={(open) => !open && setEditingSection(null)}
          departmentId={primaryDeptId}
          section={editingSection}
          institutionCertId={editingSection.institutionCertId ?? overviewGroup?.institutionCertId ?? null}
          certifications={overviewGroup?.certifications ?? []}
        />
      ) : null}

      <AlertDialog
        open={archivingSection != null}
        onOpenChange={(open) => !open && setArchivingSection(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive “{archivingSection?.sectionName}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Its learners remain in the department under “Not in a section”, and any pending invitations
              continue to bring learners into the department. You can reassign learners to another section at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeSectionMutation.isPending}>
              Cancel
            </AlertDialogCancel>
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

      <AlertDialog
        open={removingLearner != null}
        onOpenChange={(open) => !open && setRemovingLearner(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove “{removingLearner?.name || `Learner #${removingLearner?.learnerId}`}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the learner from this department. Their account, subscription, and historical progress remain unaffected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeLearnerMutation.isPending}>
              Cancel
            </AlertDialogCancel>
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
          departmentName={overviewGroup?.departmentName || overviewGroup?.name}
        />
      ) : null}

      <AlertDialog
        open={deletingAnnouncement != null}
        onOpenChange={(open) => !open && setDeletingAnnouncement(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deletingAnnouncement?.title}” will no longer be visible to department members.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiveAnnouncementMutation.isPending}>
              Cancel
            </AlertDialogCancel>
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
