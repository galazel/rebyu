import { cn } from "@/lib/utils"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  AlertTriangle,
  Award,
  Building2,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronsUpDownIcon,
  ClipboardListIcon,
  CreditCard,
  Download,
  GraduationCap,
  GripHorizontal,
  History,
  Layers,
  Loader2,
  MailIcon,
  MoreVertical,
  Pencil,
  PinIcon,
  Plus,
  RotateCcw,
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
import { MetricsSidebar, METRIC_GROUPS } from "@/components/institution/metrics-sidebar.jsx"
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
// Average completion a section should reach; same 60% line the original section tile used.
const SECTION_BENCHMARK = 60

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
    <div className={`border-b border-border/50 pb-3 mb-4 transition-all ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon ? (
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/15 shadow-2xs">
              <Icon className="size-4.5" aria-hidden="true" />
            </span>
          ) : null}
          <div className="min-w-0">
            {kicker ? (
              <h3 className="text-[10px] font-bold uppercase leading-tight tracking-wider text-primary dark:text-emerald-400">
                {kicker}
              </h3>
            ) : null}
            <p className="truncate text-sm font-bold leading-snug text-foreground sm:text-base font-sans tracking-tight">
              {title}
            </p>
            {hint ? (
              <p className="mt-0.5 truncate text-xs font-normal text-muted-foreground font-sans">
                {hint}
              </p>
            ) : null}
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

function StatBox({ label, value, icon: Icon, iconClass = "", alert = false, delta = null, subtext = null, className = "" }) {
  return (
    <div
      className={`rounded-xl border p-2.5 sm:p-3.5 flex flex-col justify-between transition-all hover:border-border/80 ${
        alert
          ? "border-amber-500/30 bg-amber-500/5 ring-1 ring-inset ring-amber-500/20"
          : "border-border/60 bg-background/60 hover:bg-muted/30"
      } ${className}`}
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
    const [activeFeature, setActiveFeature] = useState("dept-progress")
  const [range, setRange] = useState(null)

  const ALL_METRIC_IDS = useMemo(() => [
    "dept-progress",
    "dept-period-comparison",
    "dept-programme-enrolment",
    "dept-programme-table",
    "dept-completion-spread",
    "dept-hard-topics",
    "dept-hard-assessments",
  ], [])

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace("#", "")
      if (ALL_METRIC_IDS.includes(id)) {
        setActiveFeature(id)
      }
    }
  }, [ALL_METRIC_IDS])
  const [comparisonType, setComparisonType] = useState("previous_period")
  const [activeMetricsCategory, setActiveMetricsCategory] = useState("all")
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

  const allTileIds = useMemo(
    () => [
      "dept-progress",
      "dept-programme-enrolment",
      "dept-programme-table",
      "dept-completion-spread",
      "dept-hard-topics",
      "dept-hard-assessments",
      "dept-period-comparison",
    ],
    []
  )

  const [collapsedTiles, setCollapsedTiles] = useState(() => {
    try {
      const saved = localStorage.getItem("rebyu:dept-head-collapsed-tiles-v2")
      if (saved) return JSON.parse(saved)
      const initial = {}
      for (const id of allTileIds) {
        initial[id] = true
      }
      return initial
    } catch {
      const initial = {}
      for (const id of allTileIds) {
        initial[id] = true
      }
      return initial
    }
  })

  const toggleTileCollapse = useCallback((tileId) => {
    setCollapsedTiles((prev) => {
      const next = { ...prev, [tileId]: !prev[tileId] }
      try {
        localStorage.setItem("rebyu:dept-head-collapsed-tiles-v2", JSON.stringify(next))
      } catch {
        // no-op
      }
      return next
    })
  }, [])

  const areAllCollapsed = useMemo(() => {
    return allTileIds.length > 0 && allTileIds.every((id) => Boolean(collapsedTiles[id]))
  }, [allTileIds, collapsedTiles])

  const toggleAllCollapse = useCallback(() => {
    setCollapsedTiles((prev) => {
      const targetState = !allTileIds.every((id) => Boolean(prev[id]))
      const next = {}
      for (const id of allTileIds) {
        next[id] = targetState
      }
      try {
        localStorage.setItem("rebyu:dept-head-collapsed-tiles-v2", JSON.stringify(next))
      } catch {
        // no-op
      }
      return next
    })
  }, [allTileIds])

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
  /* Points are days (yyyy-MM-dd) for a week or a month, months (yyyy-MM)
     for a year or longer; the backend picks from the window's length. */
  const monthlyTrend = useMemo(() => {
    const rows = Array.isArray(statsQuery.data?.monthlyTrend) ? statsQuery.data.monthlyTrend : []
    const daily = String(rows[0]?.month ?? "").length === 10
    const spansYears = rows[0]?.month?.slice(0, 4) !== rows.at(-1)?.month?.slice(0, 4)
    return rows.map((row) => {
      const [year, month, day = 1] = String(row.month).split("-").map(Number)
      const date = new Date(year, month - 1, day)
      return {
        ...row,
        label: date.toLocaleDateString(
          undefined,
          daily
            ? { month: "short", day: "numeric" }
            : { month: "short", ...(spansYears ? { year: "2-digit" } : {}) }
        ),
      }
    })
  }, [statsQuery.data])
  // The export's "mastery trend" sheet reads the same monthly series.
  const masteryTrend = useMemo(
    () =>
      monthlyTrend.map((row) => ({
        week: row.month,
        cohortMastery: row.averageScore,
        benchmark: SECTION_BENCHMARK,
      })),
    [monthlyTrend]
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
      // A learner who already earned every assigned credential is done; a low
      // lifetime attempt average from practice runs is not a reason to call them.
      const finished =
        Number(member.assignedCertifications ?? 0) > 0 &&
        Number(member.completedCertifications ?? 0) >= Number(member.assignedCertifications)
      if (finished) {
        return null
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
    // Only the institution owner may list invitation codes; anyone else gets 403.
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
  const deptProgramsQuery = programsQuery
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
    onOpenCoAuthorities: () => { window.location.assign("/institution/departments#dept-co-authorities") },
    onInspectFlaggedRoster: () => { window.location.assign("/institution/departments#dept-learner-table") },
    onInspectDormantRoster: () => { window.location.assign("/institution/departments#dept-learner-table") },
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

  // Same definition as the roster's "flagged" pill and the alert strip.
  const needingSupport = flaggedCount

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
          ["Attempt pass rate (%)", summary.passRate],
          ["Average score (%)", summary.averageScore],
          ["Graded attempts", summary.gradedAttempts],
          ["Lessons completed", summary.lessonsCompleted],
          ["Needing support (flagged)", needingSupport],
          ["Dormant (no activity in 14+ days)", dormantCount],
          ["Sections", sections.length],
          ["Seats used", summary.seatsUsed],
          ["Seats total", summary.seatsTotal],
        ],
      },
      {
        title: `Period-over-period comparison (${periodComp?.comparisonRange?.current?.fromStr ?? ""} to ${periodComp?.comparisonRange?.current?.toStr ?? ""} vs ${periodComp?.comparisonRange?.previous?.fromStr ?? ""} to ${periodComp?.comparisonRange?.previous?.toStr ?? ""})`,
        columns: ["Metric", "Current Period", "Baseline Period", "Delta", "Direction"],
        rows: [
          ["Average progress (%)", periodComp?.deltas?.averageProgress?.current ?? 0, periodComp?.deltas?.averageProgress?.previous ?? 0, periodComp?.deltas?.averageProgress?.formattedDelta ?? "—", (periodComp?.deltas?.averageProgress?.delta ?? 0) >= 0 ? "Favorable" : "Unfavorable"],
          ["Pass rate (%)", periodComp?.deltas?.passRate?.current ?? 0, periodComp?.deltas?.passRate?.previous ?? 0, periodComp?.deltas?.passRate?.formattedDelta ?? "—", (periodComp?.deltas?.passRate?.delta ?? 0) >= 0 ? "Favorable" : "Unfavorable"],
          ["Average score (%)", periodComp?.deltas?.averageScore?.current ?? 0, periodComp?.deltas?.averageScore?.previous ?? 0, periodComp?.deltas?.averageScore?.formattedDelta ?? "—", (periodComp?.deltas?.averageScore?.delta ?? 0) >= 0 ? "Favorable" : "Unfavorable"],
          ["Graded attempts", periodComp?.deltas?.gradedAttempts?.current ?? 0, periodComp?.deltas?.gradedAttempts?.previous ?? 0, periodComp?.deltas?.gradedAttempts?.formattedDelta ?? "—", (periodComp?.deltas?.gradedAttempts?.delta ?? 0) >= 0 ? "Increased" : "Decreased"],
          ["Lessons completed", periodComp?.deltas?.lessonsCompleted?.current ?? 0, periodComp?.deltas?.lessonsCompleted?.previous ?? 0, periodComp?.deltas?.lessonsCompleted?.formattedDelta ?? "—", (periodComp?.deltas?.lessonsCompleted?.delta ?? 0) >= 0 ? "Increased" : "Decreased"],
          ["Active students", periodComp?.deltas?.activeMembers?.current ?? 0, periodComp?.deltas?.activeMembers?.previous ?? 0, periodComp?.deltas?.activeMembers?.formattedDelta ?? "—", (periodComp?.deltas?.activeMembers?.delta ?? 0) >= 0 ? "Increased" : "Decreased"],
        ],
      },
      {
        title: "Programme period comparison",
        columns: ["Programme", "Current Certified (%)", "Baseline Certified (%)", "Delta Certified", "Current Avg Score (%)", "Baseline Avg Score (%)", "Delta Score", "Current Attempts", "Baseline Attempts"],
        rows: (periodComp?.certificationsComparison ?? []).map((c) => [
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
        title: "Readiness distribution",
        columns: ["Band", "Students"],
        rows: readinessDistribution.map((row) => [row.tier, row.learners]),
      },
      {
        title: `Over time (${monthlyTrend[0]?.month?.length === 10 ? "by day" : "by month"})`,
        columns: ["Period", "Graded attempts", "Avg score (%)", "Pass rate (%)", "Lessons done", "Active students"],
        rows: monthlyTrend.map((row) => [
          row.month, row.gradedAttempts, row.averageScore, row.passRate, row.lessonsCompleted, row.activeLearners,
        ]),
      },
      {
        title: "Sections",
        columns: ["Section", "Program", "Certification", "Students", "Finished", "Need help", "Avg completion (%)", "Pending invites"],
        rows: sections.map((section) => {
          const members = deptLearners.filter((l) => l.sectionId === section.sectionId)
          const finished = members.filter(
            (l) =>
              Number(l.assignedCertifications ?? 0) > 0 &&
              Number(l.completedCertifications ?? 0) >= Number(l.assignedCertifications)
          ).length
          return [
            section.sectionName,
            section.programName ?? "",
            section.certificationTitle ||
              (deptProgramsQuery.data ?? []).find((p) => p.programId === section.programId)?.certifications?.map((c) => c.title).join(" / ") ||
              "",
            Number(section.learnerCount ?? members.length),
            finished,
            members.filter((l) => l.flag).length,
            members.length
              ? Math.round(members.reduce((sum, l) => sum + Number(l.averageProgress ?? 0), 0) / members.length)
              : 0,
            Number(section.pendingInvitationCount ?? 0),
          ]
        }),
      },
      {
        title: "Roster",
        columns: [
          "Learner", "Section", "Needs attention", "Completion (%)", "Lessons",
          "Attempts", "Avg score (%)", "Last activity",
        ],
        rows: deptLearners.map((learner) => [
          learner.name, learner.sectionName ?? "Unassigned", learner.flag ?? "",
          Math.round(Number(learner.averageProgress ?? 0)),
          learner.lessonsCompleted, learner.gradedAttempts, learner.averageScore,
          learner.lastActivityAt ? String(learner.lastActivityAt).slice(0, 10) : "",
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
        element: (
          <div id="dept-progress" className="rounded-2xl border border-border/70 bg-card p-4 sm:p-6 shadow-xs space-y-6 animate-in fade-in-50 duration-200">
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

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-border/40 pt-2.5 mt-auto text-xs text-muted-foreground font-sans">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 font-medium text-foreground tabular-nums">
                    <strong>{totalEnrolled}</strong> enrolments
                  </span>
                  <span>·</span>
                  <span>{programmes.length} programme{programmes.length === 1 ? "" : "s"}</span>
                  {seatsTotal > 0 ? (
                    <>
                      <span>·</span>
                      <span className="tabular-nums"><strong>{seatsTotal}</strong> seats</span>
                    </>
                  ) : null}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/40 px-2 py-0.5 text-foreground tabular-nums font-medium">
                    <strong className="text-foreground">
                      {failed ? "—" : count(summary.gradedAttempts)}
                    </strong>
                    graded attempts
                  </span>
                  {periodComp.deltas.gradedAttempts.delta !== 0 ? (
                    <PeriodDeltaBadge delta={periodComp.deltas.gradedAttempts.delta} size="xs" />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "dept-programme-enrolment",
        element: (
          <div id="dept-programme-enrolment" className="rounded-2xl border border-border/70 bg-card p-4 sm:p-6 shadow-xs space-y-6 animate-in fade-in-50 duration-200">
            <div className="flex h-full min-h-0 flex-1 flex-col justify-between p-3.5 sm:p-5">
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
                <p className="text-sm text-muted-foreground my-auto">
                  None of your learners are assigned to a certification yet.
                </p>
              ) : (
                <div className="relative min-h-0 flex-1 my-auto py-2">
                  <div className="-mx-2 overflow-x-auto overflow-y-hidden px-2 min-h-0 h-full">
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

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-border/40 pt-2.5 mt-auto text-xs text-muted-foreground font-sans">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 font-medium text-foreground tabular-nums">
                    <strong>{programmes.reduce((sum, r) => sum + (r.passed ?? 0), 0)}</strong> credentials awarded
                  </span>
                  <span>·</span>
                  <span>{programmes.reduce((sum, r) => sum + (r.inProgress ?? 0), 0)} in progress</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 text-foreground tabular-nums font-medium">
                    {programmes.length} track{programmes.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "dept-programme-table",
        element: (
          <div id="dept-programme-table" className="rounded-2xl border border-border/70 bg-card p-4 sm:p-6 shadow-xs space-y-6 animate-in fade-in-50 duration-200">
            <div className="flex h-full min-h-0 flex-1 flex-col justify-between p-3.5 sm:p-5">
              <DashboardCardHeader
                icon={Award}
                kicker="Programme Scorecard"
                title="Seats, completion and marks"
                hint="Your department's learners on each programme, with their marks."
              />
              {programmes.length === 0 ? (
                <p className="text-sm text-muted-foreground my-auto">
                  None of your learners are assigned to a certification yet.
                </p>
              ) : (
                <div className="-mr-2 min-h-0 flex-1 overflow-x-auto overflow-y-hidden pr-2 my-auto">
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

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-border/40 pt-2.5 mt-auto text-xs text-muted-foreground font-sans">
                <span className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 font-medium text-foreground tabular-nums">
                  {programmes.length} active programme{programmes.length === 1 ? "" : "s"}
                </span>
                <span className="text-muted-foreground">
                  {totalEnrolled} total enrolled
                </span>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "dept-completion-spread",
        element: (
          <div id="dept-completion-spread" className="rounded-2xl border border-border/70 bg-card p-4 sm:p-6 shadow-xs space-y-6 animate-in fade-in-50 duration-200">
            <div className="flex h-full flex-col justify-between gap-3">
              <DashboardCardHeader
                icon={Layers}
                kicker="Progress Distribution"
                title="How far the cohort has got"
                hint="Students per completion band — a headcount, not a share."
              />
              {deptLearners.length === 0 ? (
                <p className="text-sm text-muted-foreground my-auto">
                  No learners assigned to your department yet.
                </p>
              ) : (
                <div className="my-auto py-1">
                  <BarBreakdownChart
                    data={spread}
                    categoryKey="tier"
                    valueKey="learners"
                    horizontal={false}
                    height={186}
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-border/40 pt-2.5 mt-auto text-xs text-muted-foreground font-sans">
                <span className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 font-medium text-foreground tabular-nums">
                  {deptLearners.length} total students
                </span>
                <span className={needingSupport > 0 ? "font-semibold text-amber-600 dark:text-amber-400" : "text-muted-foreground"}>
                  {needingSupport > 0 ? `${needingSupport} needing intervention` : "Cohort pacing healthy"}
                </span>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "dept-monthly-trend",
        col: 6,
        row: 2,
        x: 0,
        y: 6,
        element: (
          <BentoTile col={6} row={2}>
            <DashboardCardHeader
              icon={TrendingUpIconSafe}
              kicker="Over Time"
              title="How the department worked across the period"
              hint="Follows the date picker at the top: a year shows months, a month or week shows days."
            />
            {monthlyTrend.every((row) => !row.gradedAttempts && !row.lessonsCompleted) ? (
              <p className="text-sm text-muted-foreground">No graded work or finished lessons in this period.</p>
            ) : (
              <div className="grid min-w-0 gap-6 md:grid-cols-2">
                <div className="min-w-0">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">Marks (%)</p>
                  <TrendLineChart
                    data={monthlyTrend}
                    xKey="label"
                    height={200}
                    unit="%"
                    dot
                    series={[
                      { key: "averageScore", name: "Average score" },
                      { key: "passRate", name: "Pass rate" },
                    ]}
                  />
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">Activity (count)</p>
                  <TrendLineChart
                    data={monthlyTrend}
                    xKey="label"
                    height={200}
                    dot
                    domain={[
                      0,
                      Math.max(
                        1,
                        Math.ceil(
                          Math.max(
                            ...monthlyTrend.map((row) => Math.max(row.gradedAttempts, row.lessonsCompleted))
                          ) * 1.15
                        )
                      ),
                    ]}
                    series={[
                      { key: "gradedAttempts", name: "Graded attempts" },
                      { key: "lessonsCompleted", name: "Lessons done" },
                      { key: "activeLearners", name: "Active students" },
                    ]}
                  />
                </div>
              </div>
            )}
          </BentoTile>
        ),
      },
      {
        id: "dept-hard-topics",
        element: (
          <div id="dept-hard-topics" className="rounded-2xl border border-border/70 bg-card p-4 sm:p-6 shadow-xs space-y-6 animate-in fade-in-50 duration-200">
            <div className="flex h-full min-h-0 flex-1 flex-col justify-between p-3.5 sm:p-5">
              <DashboardCardHeader
                icon={TargetIcon}
                kicker="Teaching Signal"
                title="Topics the department is failing"
                hint="Lowest accuracy across everyone's marked answers."
              />
              {hardestTopics.length === 0 ? (
                <div className="flex flex-1 items-center justify-center my-auto">
                  <InstitutionEmptyState
                    icon={TargetIcon}
                    title="No topic data yet"
                    description="Not enough marked answers yet to rank topics."
                  />
                </div>
              ) : (
                <div className="space-y-5 min-w-0 my-auto py-2">
                  {hardestTopics.map((programme) => (
                    <div key={programme.certificationId}>
                      <p className="mb-2 truncate text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {programme.certificationTitle}
                      </p>
                      <BarBreakdownChart
                        data={programme.topics.map((topic, i) => {
                          const isDupe = programme.topics.filter((t) => t.lessonTitle === topic.lessonTitle).length > 1
                          const uniqueTitle = isDupe && topic.lessonId ? `${topic.lessonTitle} (#${topic.lessonId})` : isDupe ? `${topic.lessonTitle} (${i + 1})` : topic.lessonTitle
                          return {
                            topic: uniqueTitle,
                            accuracy: topic.accuracy,
                          }
                        })}
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

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-border/40 pt-2.5 mt-auto text-xs text-muted-foreground font-sans">
                <span className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 font-medium text-foreground tabular-nums">
                  50% accuracy threshold benchmark
                </span>
                <span className="text-muted-foreground">
                  Targeted for remedial review
                </span>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "dept-hard-assessments",
        element: (
          <div id="dept-hard-assessments" className="rounded-2xl border border-border/70 bg-card p-4 sm:p-6 shadow-xs space-y-6 animate-in fade-in-50 duration-200">
            <div className="flex h-full min-h-0 flex-1 flex-col justify-between p-3.5 sm:p-5">
              <DashboardCardHeader
                icon={ClipboardListIcon}
                kicker="Assessment Signal"
                title="Hardest assessments"
                hint="Lowest pass rate first, per programme — a paper nobody passes is worth a look."
              />
              {hardestAssessments.length === 0 ? (
                <div className="flex flex-1 items-center justify-center my-auto">
                  <InstitutionEmptyState
                    icon={ClipboardListIcon}
                    title="No graded assessments"
                    description="No assessment has been graded in this department yet."
                  />
                </div>
              ) : (
                <div className="space-y-5 min-w-0 my-auto py-2">
                  {hardestAssessments.map((programme) => (
                    <div key={programme.certificationId}>
                      <p className="mb-2 truncate text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {programme.certificationTitle}
                      </p>
                      <BarBreakdownChart
                        data={programme.assessments.map((exam, i) => {
                          const isDupe = programme.assessments.filter((e) => e.title === exam.title).length > 1
                          const uniqueTitle = isDupe && exam.examId ? `${exam.title} (#${exam.examId})` : isDupe ? `${exam.title} (${i + 1})` : exam.title
                          return {
                            exam: uniqueTitle,
                            averageScore: exam.averageScore ?? 0,
                            passRate: exam.passRate,
                            passedAttempts: exam.passedAttempts,
                            attempts: exam.attempts,
                            learners: exam.learners,
                            passingScore: exam.passingScore,
                          }
                        })}
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

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-border/40 pt-2.5 mt-auto text-xs text-muted-foreground font-sans">
                <span className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 font-medium text-foreground tabular-nums">
                  Sorted by lowest pass rate first
                </span>
                <span className="text-muted-foreground">
                  {hardestAssessments.length} assessment{hardestAssessments.length === 1 ? "" : "s"} analyzed
                </span>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "dept-period-comparison",
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
            collapsible={false}
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
            <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
              <DashboardCardHeader
                icon={Layers}
                kicker="Section Management"
                title="Sections & Cohorts"
                hint="Click a class to see its students in the roster below. Manage opens it to add or move students."
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
                    const pendingCount = Number(section.pendingInvitationCount ?? 0)
                    const finishedCount = sectionLearners.filter(
                      (l) =>
                        Number(l.assignedCertifications ?? 0) > 0 &&
                        Number(l.completedCertifications ?? 0) >= Number(l.assignedCertifications)
                    ).length
                    const needHelpCount = sectionLearners.filter((l) => l.flag).length
                    const gap = SECTION_BENCHMARK - progress
                    const showInRoster = () => {
                      setSelectedSectionFilter(String(section.sectionId))
                      setRosterStatusFilter("all")
                      document
                        .getElementById("dept-learner-table")
                        ?.scrollIntoView({ behavior: "smooth", block: "start" })
                    }

                    return (
                      <div
                        key={section.sectionId}
                        role="button"
                        tabIndex={0}
                        title="Show this class in the roster below"
                        onClick={(event) => {
                          if (!event.target.closest("a")) showInRoster()
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            showInRoster()
                          }
                        }}
                        className="cursor-pointer space-y-2 rounded-lg border border-border/40 bg-muted/20 px-3.5 py-3 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 sm:min-w-[180px]">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground truncate">
                              {section.sectionName}
                            </span>
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
                            {section.certificationTitle ||
                              (deptProgramsQuery.data ?? [])
                                .find((program) => program.programId === section.programId)
                                ?.certifications?.map((cert) => cert.title)
                                .join(", ") ||
                              "General"}
                            {section.description ? ` · ${section.description}` : ""}
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs">
                            <Link
                              to={`/institution/departments/${primaryDeptId}?tab=learners${section.programId ? `&programId=${section.programId}` : ""}`}
                            >
                              Manage
                            </Link>
                          </Button>
                        </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="h-2 flex-1" />
                          <span className="w-10 text-right text-xs font-bold tabular-nums text-foreground">
                            {progress}%
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                          <span>
                            <strong className="text-foreground tabular-nums">{count(totalInSection)}</strong>{" "}
                            {totalInSection === 1 ? "student" : "students"}
                          </span>
                          <span>
                            <strong className="text-foreground tabular-nums">{finishedCount}</strong> finished
                          </span>
                          <span className={needHelpCount ? "text-amber-700 dark:text-amber-400" : undefined}>
                            <strong className="tabular-nums">{needHelpCount}</strong> need help
                          </span>
                          <span
                            className={`ml-auto font-semibold ${totalInSection > 0 && gap <= 0 ? "text-rb-leaf" : "text-muted-foreground"}`}
                          >
                            {totalInSection === 0
                              ? "No students yet"
                              : gap <= 0
                                ? `On track (goal ${SECTION_BENCHMARK}%)`
                                : `${gap} pts below the ${SECTION_BENCHMARK}% goal`}
                          </span>
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
                hint={`${activeHeadAssignments.length} active ${activeHeadAssignments.length === 1 ? "authority" : "authorities"}${isOwner ? ` · ${pendingHeadInvitations.length} pending code invitation${pendingHeadInvitations.length === 1 ? "" : "s"}` : ""}`}
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

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatBox
                  label="Active Authorities"
                  value={count(activeHeadAssignments.length)}
                  icon={ShieldCheck}
                  iconClass="text-emerald-600 dark:text-emerald-400"
                />
                <StatBox
                  label="Pending Invitations"
                  value={isOwner ? count(pendingHeadInvitations.length) : "—"}
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
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/20 px-3.5 py-2.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                  <span className="font-medium text-foreground">
                    {pendingHeadInvitations.length > 0
                      ? `${pendingHeadInvitations.length} invitation code${pendingHeadInvitations.length === 1 ? "" : "s"} waiting to be claimed by faculty`
                      : "Faculty and assistant deans can co-manage curricula, cohorts, and assessments."}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setCoAuthoritiesOpen(true)}
                    className="h-7 text-xs font-semibold text-primary hover:text-primary"
                  >
                    Open Delegation Flow
                  </Button>
                </div>
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
        y: 16,
        element: (
          <BentoTile col={6} row={2} className="!p-0">
            <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
              <DashboardCardHeader
                icon={Building2}
                kicker="Department Roster"
                title="Student roster & who needs a conversation"
                hint="Anyone flagged sits at the top, with the reason beside their name."
                action={
                  sections.length > 1 || selectedSectionFilter !== "all" || deptLearners.some((l) => l.sectionId == null) ? (
                    <div className="w-48">
                      <Select
                        value={selectedSectionFilter}
                        onValueChange={setSelectedSectionFilter}
                      >
                        <SelectTrigger className="h-7 text-xs bg-background">
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
                  ) : null
                }
                chip={
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRosterStatusFilter("all")}
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold transition-colors ${
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
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold transition-colors ${
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
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold transition-colors ${
                          rosterStatusFilter === "dormant"
                            ? "border border-sky-500/50 bg-sky-500/20 text-sky-800 dark:text-sky-300 ring-1 ring-sky-500/40"
                            : "border border-sky-500/20 bg-sky-500/10 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 hover:bg-sky-500/20"
                        }`}
                      >
                        <UsersRoundIcon className="size-3 shrink-0" aria-hidden="true" />
                        <span>{dormantCount} dormant</span>
                      </button>
                    ) : null}
                    {rosterStatusFilter !== "all" ? (
                      <button
                        type="button"
                        onClick={() => setRosterStatusFilter("all")}
                        className="text-[11px] text-muted-foreground underline hover:text-foreground ml-1"
                      >
                        Reset filter
                      </button>
                    ) : null}
                  </div>
                }
              />

              {statsQuery.isError ? (
                <p className="text-sm text-muted-foreground">
                  Department learners could not be loaded.
                </p>
              ) : deptLearners.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground">
                  <Building2 className="mb-2 size-8 text-muted-foreground/40" />
                  <p>No learners assigned to your department yet.</p>
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-x-auto">
                  <table className="w-full text-sm" style={{ minWidth: 680 }}>
                    <colgroup>
                      <col style={{ width: "22%" }} />
                      <col style={{ width: "16%" }} />
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "18%" }} />
                      <col style={{ width: "8%" }} />
                      <col style={{ width: "8%" }} />
                      <col style={{ width: "8%" }} />
                    </colgroup>
                    <thead className="sticky top-0 bg-background z-10">
                      <tr className="border-b border-transparent text-xs font-semibold text-muted-foreground">
                        <th className="py-2.5 pl-2 pr-3 text-left">Student Name</th>
                        <th className="py-2.5 px-3 text-left">Section</th>
                        <th className="py-2.5 px-3 text-left">Needs attention</th>
                        <th className="py-2.5 px-3 text-left">Progress</th>
                        <th className="py-2.5 px-2 text-center">Lessons</th>
                        <th className="py-2.5 px-2 text-center">Attempts</th>
                        <th className="py-2.5 px-2 text-center">Avg Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLearners.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-xs text-muted-foreground">
                            {rosterStatusFilter === "flagged" ? (
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
                        filteredLearners.map((learner) => (
                          <tr
                            key={learner.learnerId}
                            className="border-b border-border/40 hover:bg-muted/40 transition-colors"
                          >
                            <td className="py-2.5 pl-2 pr-3">
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
                            <td className="py-2.5 px-2 text-center tabular-nums text-xs text-muted-foreground">
                              {count(learner.lessonsCompleted)}
                            </td>
                            <td className="py-2.5 px-2 text-center tabular-nums text-xs text-muted-foreground">
                              {count(learner.gradedAttempts)}
                            </td>
                            <td className="py-2.5 px-2 text-center tabular-nums text-xs font-semibold text-foreground">
                              {percent(learner.averageScore)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
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
    monthlyTrend,
    benchmarkRows,
    readinessTarget,
    benchmarks,
    primaryDeptId,
    groups,
    statsQuery.isError,
    statsQuery.data,
    departmentStatsQuery.isError,
    overviewGroup,
    periodComp.deltas,
    periodComp.certificationsComparison,
    periodComp.learnerMomentum,
    periodComp.insights,
    deptProgramsQuery.data,
    periodComp.comparisonRange,
    periodComp.isLoading,
    periodComp.isError,
    comparisonType,
    activeFeature,
  ])

  const activeTile = useMemo(() => {
    return tiles.find((t) => t.id === activeFeature) || tiles[0]
  }, [tiles, activeFeature])

  if (departmentsQuery.isLoading) return <InstitutionLoadingSkeleton />
  if (departmentsQuery.isError)
    return <InstitutionErrorState title="Unable to load your departments" onRetry={departmentsQuery.refetch} />

  return (
    <div className="space-y-6">

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
              <SelectTrigger className="min-h-[44px] sm:min-h-0 sm:h-9 w-full bg-background" id="dept-header-program-picker">
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

          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveFeature("dept-period-comparison")}
            className="gap-1.5 min-h-[44px] sm:min-h-0 sm:h-9 justify-center w-full sm:w-auto text-xs sm:text-sm"
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
            asChild
            variant="outline"
            size="sm"
            className="gap-2 min-h-[44px] sm:min-h-0 sm:h-9 justify-center w-full sm:w-auto text-xs sm:text-sm"
            id="dept-header-co-authorities-btn"
          >
            <Link to="/institution/departments#dept-co-authorities">
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
          </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px] sm:min-h-0 sm:h-9 gap-1.5 justify-center w-full sm:w-auto text-xs sm:text-sm"
            onClick={() => downloadCsv(timestampedFilename("rebyu-department-dashboard"), buildCsv())}
            disabled={statsQuery.isLoading || statsQuery.isError}
          >
            <Download className="size-4" aria-hidden="true" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Mobile Sticky Rearrange Floating Card */}
      

      {createSectionOpen && primaryDeptId ? (
        <SectionDialog
          open={createSectionOpen}
          onOpenChange={setCreateSectionOpen}
          departmentId={primaryDeptId}
          institutionCertId={overviewGroup?.institutionCertId ?? null}
          certifications={overviewGroup?.certifications ?? []}
          programs={Array.isArray(deptProgramsQuery.data) ? deptProgramsQuery.data : []}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)] items-start">
        <MetricsSidebar
          activeFeature={activeFeature}
          onSelectFeature={setActiveFeature}
          activeCategory={activeMetricsCategory}
          onSelectCategory={setActiveMetricsCategory}
        />

        <div className="min-w-0 space-y-6">
          {/* Mobile View Switcher */}
          <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-border/40">
            {METRIC_GROUPS.flatMap((g) => g.items).map((item) => {
              const Icon = item.icon
              const isActive = activeFeature === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveFeature(item.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shrink-0",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>

          {/* Alert Strip */}
          <DepartmentAlertStrip alerts={alerts} />

          {/* Active Metric Expanded Feature View */}
          {activeTile ? activeTile.element : null}
        </div>
      </div>

    </div>
  )
}
