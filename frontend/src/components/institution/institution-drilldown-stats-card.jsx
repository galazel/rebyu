import { useMemo, useState } from "react"
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  GraduationCap,
  RotateCcw,
  TicketIcon,
  Users,
  BookOpen,
} from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useChartTheme } from "@/components/charts/rebyu-charts.jsx"
import { getLearnerDisplayName } from "@/hooks/use-institution-data.js"

// Slots Allotted Palette (Navy / Slate palette matching user's reference)
const SLOTS_PALETTE = [
  "#1e3a5f", // Deep Navy Blue
  "#204b77", // Marine Slate
  "#28536b", // Deep Cerulean
  "#1b4965", // Ocean Navy
  "#2b4162", // Indigo Slate
  "#385070", // Midnight Steel
  "#1e5631", // Deep Pine Green
  "#334155", // Slate 700
]

const REACH_COLOR = "#0284c7" // Vibrant Sky / Cyan Blue (exclusive reach arc)

function getInitials(name = "") {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "L"
  )
}

function CustomDualPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  if (!item || item.isRemaining) return null

  return (
    <div className="rounded-xl border border-border bg-popover/95 px-3.5 py-2.5 text-popover-foreground shadow-lg backdrop-blur-md">
      <div className="max-w-[220px] truncate text-xs font-bold text-foreground">
        {item.deptName || item.certTitle || item.name}
      </div>
      <div className="mt-1.5 space-y-1 text-xs">
        <div className="flex items-center justify-between gap-3 text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: item.deptFill || item.certFill || item.fill || "#1e3a5f" }}
            />
            Allotted Slots:
          </span>
          <span className="font-bold tabular-nums text-foreground">
            {item.allottedSlots ?? item.value}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#0284c7]" />
            Enrolled Learners:
          </span>
          <span className="font-bold tabular-nums text-foreground">
            {item.enrolled ?? 0}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-muted-foreground">
          <span>Capacity Reach:</span>
          <span className="font-extrabold tabular-nums text-[#0284c7]">
            {item.reachPct ?? 0}%
          </span>
        </div>
      </div>
      <div className="mt-2 border-t border-border/60 pt-1 text-[10px] font-medium text-muted-foreground/80">
        Click to drill down →
      </div>
    </div>
  )
}

export default function InstitutionDrilldownStatsCard({
  data,
  groupStats = [],
  departments = [],
  members = [],
  summary = {},
  failed = false,
}) {
  const chartTheme = useChartTheme()

  // Navigation state: Level 1 (Departments) -> 2 (Certifications) -> 3 (Slots vs Enrolled) -> 4 (Learner Progress)
  const [currentLevel, setCurrentLevel] = useState(1)
  const [selectedDepartment, setSelectedDepartment] = useState(null)
  const [selectedCertification, setSelectedCertification] = useState(null)

  // Interactive Hover state for Dual Rings
  const [hoveredDept, setHoveredDept] = useState(null)
  const [hoveredCert, setHoveredCert] = useState(null)

  // Fast lookups
  const membersMap = useMemo(() => {
    return new Map((members || []).map((m) => [m.learnerId, m]))
  }, [members])

  // -------------------------------------------------------------------------
  // LEVEL 1: Aggregated Slots & Enrolled Learners per Department
  // Inner Pie = Total Slots Allotted | Outer Ring = Enrolled Reach % exclusive to each dept
  // -------------------------------------------------------------------------
  const level1Data = useMemo(() => {
    const deptMap = new Map()

    // 1. Seed from departments prop
    departments.forEach((dept) => {
      const deptId = String(dept.departmentId ?? dept.id ?? "")
      if (!deptId) return
      deptMap.set(deptId, {
        id: dept.departmentId ?? dept.id,
        name: dept.departmentName || dept.name || `Department #${deptId}`,
        allottedSlots: Number(dept.totalSlots ?? 0),
        usedSlots: Number(dept.usedSlots ?? 0),
        learnerIds: new Set(),
        assignmentCount: 0,
      })
    })

    // 2. Seed from groupStats
    groupStats.forEach((group) => {
      if (group?.departmentId != null) {
        const deptId = String(group.departmentId)
        if (!deptMap.has(deptId)) {
          deptMap.set(deptId, {
            id: group.departmentId,
            name: group.departmentName || `Department #${group.departmentId}`,
            allottedSlots: 0,
            usedSlots: Number(group.learners ?? 0),
            learnerIds: new Set(),
            assignmentCount: 0,
          })
        }
      }
    })

    // 3. Map assignments to find enrolled learners per department
    data?.assignments?.forEach((assignment) => {
      const membership = data.groupByInstitutionCertLearnerId?.get(
        assignment.institutionCertLearnerId
      )
      const deptId =
        membership?.departmentId != null
          ? String(membership.departmentId)
          : "unassigned"
      const deptName = membership?.departmentName || "General / Unassigned"

      if (!deptMap.has(deptId)) {
        deptMap.set(deptId, {
          id: deptId === "unassigned" ? null : membership.departmentId,
          name: deptName,
          allottedSlots: 0,
          usedSlots: 0,
          learnerIds: new Set(),
          assignmentCount: 0,
        })
      }

      const entry = deptMap.get(deptId)
      entry.learnerIds.add(assignment.learnerId)
      entry.assignmentCount += 1
    })

    // Fallback if no departments existed yet but summary/assignments exist
    if (deptMap.size === 0 && (summary?.seatsTotal || data?.assignments?.length)) {
      deptMap.set("general", {
        id: null,
        name: "General",
        allottedSlots: Number(summary?.seatsTotal ?? 10),
        usedSlots: Number(summary?.seatsUsed ?? data?.assignments?.length ?? 0),
        learnerIds: new Set((data?.assignments || []).map((a) => a.learnerId)),
        assignmentCount: data?.assignments?.length ?? 0,
      })
    }

    return Array.from(deptMap.values())
      .map((entry, index) => {
        const enrolled = entry.learnerIds.size || entry.usedSlots || 0
        let slots = entry.allottedSlots
        if (!slots || slots <= 0) {
          slots = enrolled > 0 ? Math.max(enrolled, 10) : (entry.id ? 10 : 0)
        }

        const reachPct =
          slots > 0 ? Math.min(Math.round((enrolled / slots) * 100), 100) : 0

        return {
          id: entry.id,
          name: entry.name,
          value: slots, // Inner pie slice size = allotted slots!
          allottedSlots: slots,
          enrolled,
          reachPct,
          assignmentCount: entry.assignmentCount,
          fill: SLOTS_PALETTE[index % SLOTS_PALETTE.length],
        }
      })
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [
    departments,
    groupStats,
    data?.assignments,
    data?.groupByInstitutionCertLearnerId,
    summary?.seatsTotal,
    summary?.seatsUsed,
  ])

  const totalLevel1Slots = useMemo(() => {
    return level1Data.reduce((sum, item) => sum + item.allottedSlots, 0)
  }, [level1Data])

  const totalLevel1Enrolled = useMemo(() => {
    return level1Data.reduce((sum, item) => sum + item.enrolled, 0)
  }, [level1Data])

  const overallLevel1ReachPct = useMemo(() => {
    return totalLevel1Slots > 0
      ? Math.min(Math.round((totalLevel1Enrolled / totalLevel1Slots) * 100), 100)
      : 0
  }, [totalLevel1Slots, totalLevel1Enrolled])

  // Outer indicator reach data exclusive to each department's inner slice
  const level1OuterData = useMemo(() => {
    const segments = []
    level1Data.forEach((dept) => {
      const slots = dept.allottedSlots
      const enrolled = Math.min(dept.enrolled, slots)
      const remaining = Math.max(slots - enrolled, 0)
      const isHovered = hoveredDept ? hoveredDept.id === dept.id : true

      // Enrolled arc segment (exclusive to this department)
      if (enrolled > 0) {
        segments.push({
          id: dept.id,
          name: dept.name,
          deptName: dept.name,
          allottedSlots: slots,
          enrolled: dept.enrolled,
          reachPct: dept.reachPct,
          value: enrolled,
          isRemaining: false,
          fill: hoveredDept && !isHovered ? "rgba(2, 132, 199, 0.4)" : REACH_COLOR,
          deptFill: dept.fill,
        })
      }

      // Unfilled remaining slots segment (transparent, reserving department's angle)
      if (remaining > 0) {
        segments.push({
          id: dept.id,
          name: `${dept.name} Remaining`,
          deptName: dept.name,
          allottedSlots: slots,
          enrolled: dept.enrolled,
          reachPct: dept.reachPct,
          value: remaining,
          isRemaining: true,
          fill: "transparent",
          deptFill: dept.fill,
        })
      }
    })
    return segments
  }, [level1Data, hoveredDept])

  // Center display values
  const activeLevel1ReachPct = hoveredDept
    ? hoveredDept.reachPct
    : overallLevel1ReachPct
  const activeLevel1Slots = hoveredDept
    ? hoveredDept.allottedSlots
    : totalLevel1Slots

  // -------------------------------------------------------------------------
  // LEVEL 2: Certifications in the Selected Department
  // -------------------------------------------------------------------------
  const level2Data = useMemo(() => {
    if (!selectedDepartment || !data?.assignments?.length) return []

    const deptIdStr =
      selectedDepartment.id != null ? String(selectedDepartment.id) : "unassigned"
    const certMap = new Map()

    data.assignments.forEach((assignment) => {
      const membership = data.groupByInstitutionCertLearnerId?.get(
        assignment.institutionCertLearnerId
      )
      const currentDeptId =
        membership?.departmentId != null
          ? String(membership.departmentId)
          : "unassigned"

      if (currentDeptId === deptIdStr) {
        const instCert = data.institutionCertById?.get(
          assignment.institutionCertId
        )
        const cert = instCert
          ? data.certificationById?.get(instCert.certificationId)
          : null
        const certKey = String(assignment.institutionCertId)
        const title =
          cert?.title ||
          `Certification #${instCert?.certificationId || assignment.institutionCertId}`

        if (!certMap.has(certKey)) {
          certMap.set(certKey, {
            institutionCertId: assignment.institutionCertId,
            certificationId: instCert?.certificationId,
            title,
            totalSlots: instCert?.totalSlots ?? 0,
            assignments: [],
            learnerIds: new Set(),
          })
        }

        const entry = certMap.get(certKey)
        entry.assignments.push(assignment)
        entry.learnerIds.add(assignment.learnerId)
      }
    })

    return Array.from(certMap.values())
      .map((entry, index) => {
        const enrolled = entry.learnerIds.size
        let slots = entry.totalSlots
        if (!slots || slots <= 0) {
          slots = Math.max(enrolled, 10)
        }
        const reachPct =
          slots > 0 ? Math.min(Math.round((enrolled / slots) * 100), 100) : 0

        return {
          ...entry,
          name: entry.title,
          value: slots, // Slices represent allotted slots!
          allottedSlots: slots,
          enrolled,
          reachPct,
          fill: SLOTS_PALETTE[(index + 1) % SLOTS_PALETTE.length],
        }
      })
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [
    selectedDepartment,
    data?.assignments,
    data?.groupByInstitutionCertLearnerId,
    data?.institutionCertById,
    data?.certificationById,
  ])

  const totalLevel2Slots = useMemo(() => {
    return level2Data.reduce((sum, c) => sum + c.allottedSlots, 0)
  }, [level2Data])

  const totalLevel2Enrolled = useMemo(() => {
    return level2Data.reduce((sum, c) => sum + c.enrolled, 0)
  }, [level2Data])

  const overallLevel2ReachPct = useMemo(() => {
    return totalLevel2Slots > 0
      ? Math.min(Math.round((totalLevel2Enrolled / totalLevel2Slots) * 100), 100)
      : 0
  }, [totalLevel2Slots, totalLevel2Enrolled])

  // Outer indicator reach data exclusive to each certification's inner slice
  const level2OuterData = useMemo(() => {
    const segments = []
    level2Data.forEach((cert) => {
      const slots = cert.allottedSlots
      const enrolled = Math.min(cert.enrolled, slots)
      const remaining = Math.max(slots - enrolled, 0)
      const isHovered = hoveredCert
        ? hoveredCert.institutionCertId === cert.institutionCertId
        : true

      if (enrolled > 0) {
        segments.push({
          id: cert.institutionCertId || cert.certificationId,
          name: cert.name,
          certTitle: cert.name,
          allottedSlots: slots,
          enrolled: cert.enrolled,
          reachPct: cert.reachPct,
          value: enrolled,
          isRemaining: false,
          fill: hoveredCert && !isHovered ? "rgba(2, 132, 199, 0.4)" : REACH_COLOR,
          certFill: cert.fill,
        })
      }

      if (remaining > 0) {
        segments.push({
          id: cert.institutionCertId || cert.certificationId,
          name: `${cert.name} Remaining`,
          certTitle: cert.name,
          allottedSlots: slots,
          enrolled: cert.enrolled,
          reachPct: cert.reachPct,
          value: remaining,
          isRemaining: true,
          fill: "transparent",
          certFill: cert.fill,
        })
      }
    })
    return segments
  }, [level2Data, hoveredCert])

  const activeLevel2ReachPct = hoveredCert
    ? hoveredCert.reachPct
    : overallLevel2ReachPct
  const activeLevel2Slots = hoveredCert
    ? hoveredCert.allottedSlots
    : totalLevel2Slots

  // -------------------------------------------------------------------------
  // LEVEL 3 & 4: Selected Certification Stats & Learners
  // -------------------------------------------------------------------------
  const level3Data = useMemo(() => {
    if (!selectedCertification) return null
    const totalSlots = Number(
      selectedCertification.allottedSlots ?? selectedCertification.totalSlots ?? 0
    )
    const enrolledInDept = Number(
      selectedCertification.enrolled ??
        selectedCertification.assignments?.length ??
        0
    )
    const remainingSlots = Math.max(totalSlots - enrolledInDept, 0)
    const percentFilled =
      totalSlots > 0
        ? Math.min(Math.round((enrolledInDept / totalSlots) * 100), 100)
        : 0

    return {
      totalSlots,
      enrolledInDept,
      remainingSlots,
      percentFilled,
    }
  }, [selectedCertification])

  const level4Learners = useMemo(() => {
    if (!selectedCertification?.assignments?.length) return []

    return selectedCertification.assignments
      .map((assignment) => {
        const learner = data.learnerById?.get(assignment.learnerId)
        const member = membersMap.get(assignment.learnerId)
        const name = getLearnerDisplayName(learner)
        const email = learner?.email || learner?.username || ""

        let progress = Number(
          assignment.progressPercentage ?? member?.averageProgress ?? 0
        )
        if (isNaN(progress)) progress = 0
        progress = Math.min(Math.max(Math.round(progress), 0), 100)

        return {
          learnerId: assignment.learnerId,
          assignmentId: assignment.institutionCertLearnerId,
          name,
          email,
          progress,
          status: assignment.status || "active",
        }
      })
      .sort((a, b) => b.progress - a.progress)
  }, [selectedCertification, data.learnerById, membersMap])

  // Distribution buckets for Option C (Level 4)
  const progressBuckets = useMemo(() => {
    const buckets = [
      { label: "0–25%", min: 0, max: 25, color: "#c8553d", count: 0 },
      { label: "26–50%", min: 26, max: 50, color: "#c9962b", count: 0 },
      { label: "51–75%", min: 51, max: 75, color: "#3B82F6", count: 0 },
      { label: "76–100%", min: 76, max: 100, color: "#2f6b4f", count: 0 },
    ]

    level4Learners.forEach((l) => {
      const bucket = buckets.find(
        (b) => l.progress >= b.min && l.progress <= b.max
      )
      if (bucket) bucket.count += 1
      else if (l.progress > 100) buckets[3].count += 1
    })

    return buckets
  }, [level4Learners])

  const avgLearnerProgress = useMemo(() => {
    if (!level4Learners.length) return 0
    const total = level4Learners.reduce((sum, l) => sum + l.progress, 0)
    return Math.round(total / level4Learners.length)
  }, [level4Learners])

  // -------------------------------------------------------------------------
  // Summary Stats for Level 1 (Original Mockup Metrics)
  // -------------------------------------------------------------------------
  const level1SummaryStats = useMemo(() => {
    const deptCount = level1Data.length || 1
    const avgEnrollees = Math.round(totalLevel1Enrolled / deptCount)

    // Certified learners: completed certifications > 0 or progress >= 100%
    const certifiedCount = members.filter(
      (m) =>
        Number(m.completedCertifications ?? 0) > 0 ||
        Number(m.averageProgress ?? 0) >= 100
    ).length
    const avgCertified = Math.round(certifiedCount / deptCount)

    // In-progress learners: 0 < progress < 100%
    const inProgressCount = members.filter(
      (m) =>
        Number(m.averageProgress ?? 0) > 0 && Number(m.averageProgress ?? 0) < 100
    ).length
    const avgInProgress = Math.round(inProgressCount / deptCount)

    const avgScore =
      summary?.averageScore != null
        ? `${Math.round(Number(summary.averageScore))}%`
        : summary?.averageProgress != null
        ? `${Math.round(Number(summary.averageProgress))}%`
        : "—"

    return {
      avgEnrollees,
      avgCertified,
      avgInProgress,
      avgScore,
    }
  }, [level1Data, totalLevel1Enrolled, members, summary])

  // -------------------------------------------------------------------------
  // Summary Stats for Level 2 (Original Certifications & Dept Averages)
  // -------------------------------------------------------------------------
  const level2SummaryStats = useMemo(() => {
    if (!level2Data.length) {
      return {
        avgEnrollees: 0,
        certified: 0,
        inProgress: 0,
        avgProgress: "—",
      }
    }
    const certCount = level2Data.length || 1
    const deptTotalLearners = level2Data.reduce((sum, c) => sum + c.enrolled, 0)
    const avgEnrollees = Math.round(deptTotalLearners / certCount)

    const deptLearnerIds = new Set()
    level2Data.forEach((c) => {
      c.learnerIds?.forEach((id) => deptLearnerIds.add(id))
    })

    const deptMembers = members.filter((m) => deptLearnerIds.has(m.learnerId))
    const certified = deptMembers.filter(
      (m) =>
        Number(m.completedCertifications ?? 0) > 0 ||
        Number(m.averageProgress ?? 0) >= 100
    ).length
    const inProgress = deptMembers.filter(
      (m) =>
        Number(m.averageProgress ?? 0) > 0 && Number(m.averageProgress ?? 0) < 100
    ).length

    const avgProgressVal =
      deptMembers.length > 0
        ? Math.round(
            deptMembers.reduce(
              (sum, m) => sum + Number(m.averageProgress ?? 0),
              0
            ) / deptMembers.length
          )
        : 0

    return {
      avgEnrollees,
      certified,
      inProgress,
      avgProgress: `${avgProgressVal}%`,
    }
  }, [level2Data, members])

  // -------------------------------------------------------------------------
  // Dynamic Remarks Content per Level (Original Narrative)
  // -------------------------------------------------------------------------
  const remarksText = useMemo(() => {
    if (currentLevel === 1) {
      if (!level1Data.length) {
        return "No learner enrollments have been recorded across departments yet."
      }
      const topDept = level1Data[0]
      const topPct =
        totalLevel1Enrolled > 0
          ? Math.round((topDept.enrolled / totalLevel1Enrolled) * 100)
          : 0
      if (level1Data.length === 1) {
        return `${topDept.name} holds 100% of currently enrolled learners (${topDept.enrolled} enrollees). Institutional average progress is ${level1SummaryStats.avgScore} across active curriculum.`
      }
      return `${topDept.name} leads institutional enrollment with ${topDept.enrolled} learners (${topPct}% of total). An average of ${level1SummaryStats.avgEnrollees} learners are enrolled per department across ${level1Data.length} departments.`
    }

    if (currentLevel === 2) {
      if (!level2Data.length) {
        return `No active certification assignments found for ${selectedDepartment?.name || "this department"}.`
      }
      const topCert = level2Data[0]
      const deptTotal = level2Data.reduce((sum, c) => sum + c.enrolled, 0)
      const topPct =
        deptTotal > 0 ? Math.round((topCert.enrolled / deptTotal) * 100) : 0
      return `${topCert.name} represents ${topPct}% of certifications in ${selectedDepartment?.name} with ${topCert.enrolled} learner(s). Click any certification to inspect slots capacity.`
    }

    if (currentLevel === 3) {
      if (!level3Data) return "No slot allocation details available."
      return `${selectedDepartment?.name || "Department"} has utilized ${level3Data.percentFilled}% of the total certification slot pool (${level3Data.enrolledInDept} of ${level3Data.totalSlots} slots). Click the enrolled bar to view learner progress.`
    }

    if (currentLevel === 4) {
      const completedCount = level4Learners.filter(
        (l) => l.progress === 100
      ).length
      return `Cohort average progress for ${selectedCertification?.title || "Certification"} is ${avgLearnerProgress}%. ${completedCount} of ${level4Learners.length} learner(s) have reached 100% completion.`
    }

    return "All department statistics are current."
  }, [
    currentLevel,
    level1Data,
    totalLevel1Enrolled,
    level1SummaryStats,
    level2Data,
    selectedDepartment,
    level3Data,
    level4Learners,
    selectedCertification,
    avgLearnerProgress,
  ])

  // -------------------------------------------------------------------------
  // Handlers for Drill-Down
  // -------------------------------------------------------------------------
  const handleSelectDepartment = (dept) => {
    setSelectedDepartment(dept)
    setHoveredDept(null)
    setCurrentLevel(2)
  }

  const handleSelectCertification = (cert) => {
    setSelectedCertification(cert)
    setHoveredCert(null)
    setCurrentLevel(3)
  }

  const handleGoBack = () => {
    if (currentLevel === 4) setCurrentLevel(3)
    else if (currentLevel === 3) setCurrentLevel(2)
    else if (currentLevel === 2) {
      setSelectedDepartment(null)
      setHoveredDept(null)
      setCurrentLevel(1)
    }
  }

  const handleReset = () => {
    setSelectedDepartment(null)
    setSelectedCertification(null)
    setHoveredDept(null)
    setHoveredCert(null)
    setCurrentLevel(1)
  }

  return (
    <div className="flex h-full min-h-[320px] w-full flex-col justify-between">
      {/* ----------------- Header & Breadcrumbs ----------------- */}
      <div className="space-y-1.5 border-b border-border/60 pb-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-sky-500/15 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
              <Building2 className="size-4" />
            </span>
            <div>
              <h3 className="text-[10px] font-bold uppercase leading-tight tracking-wider text-muted-foreground">
                Learner Statistics
              </h3>
              <p className="text-xs font-extrabold leading-snug text-foreground sm:text-sm">
                {currentLevel === 1 && "Department Enrollment & Slots"}
                {currentLevel === 2 &&
                  `${selectedDepartment?.name || "Department"} Certifications`}
                {currentLevel === 3 && "Slots vs. Enrolled Learners"}
                {currentLevel === 4 && "Learner Progress Breakdown"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {currentLevel > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGoBack}
                  className="h-7 px-2 text-xs font-medium hover:bg-muted"
                  title="Go back one step"
                >
                  <ArrowLeft className="mr-1 size-3.5" /> Back
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-7 px-2 text-xs text-muted-foreground hover:bg-muted"
                  title="Reset to Departments"
                >
                  <RotateCcw className="size-3" />
                </Button>
              </>
            )}
            <Badge
              variant="outline"
              className="bg-background/80 px-2 py-0.5 text-[10px] font-bold"
            >
              L{currentLevel}/4
            </Badge>
          </div>
        </div>

        {/* Breadcrumb Trail */}
        <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
          <button
            type="button"
            onClick={handleReset}
            className={`transition hover:text-foreground ${
              currentLevel === 1
                ? "font-bold text-foreground"
                : "underline-offset-2 hover:underline"
            }`}
          >
            Departments
          </button>

          {currentLevel >= 2 && selectedDepartment && (
            <>
              <ChevronRight className="size-3 shrink-0 text-muted-foreground/60" />
              <button
                type="button"
                onClick={() => setCurrentLevel(2)}
                className={`max-w-[120px] truncate transition hover:text-foreground ${
                  currentLevel === 2
                    ? "font-bold text-foreground"
                    : "underline-offset-2 hover:underline"
                }`}
                title={selectedDepartment.name}
              >
                {selectedDepartment.name}
              </button>
            </>
          )}

          {currentLevel >= 3 && selectedCertification && (
            <>
              <ChevronRight className="size-3 shrink-0 text-muted-foreground/60" />
              <button
                type="button"
                onClick={() => setCurrentLevel(3)}
                className={`max-w-[120px] truncate transition hover:text-foreground ${
                  currentLevel === 3
                    ? "font-bold text-foreground"
                    : "underline-offset-2 hover:underline"
                }`}
                title={selectedCertification.title}
              >
                {selectedCertification.title}
              </button>
            </>
          )}

          {currentLevel === 4 && (
            <>
              <ChevronRight className="size-3 shrink-0 text-muted-foreground/60" />
              <span className="font-bold text-foreground">Learners</span>
            </>
          )}
        </div>
      </div>

      {/* ----------------- Body Content Per Level ----------------- */}
      <div className="min-h-0 flex-1 py-2">
        {failed ? (
          <div className="flex h-full flex-col items-center justify-center p-4 text-center">
            <p className="text-xs text-muted-foreground">
              Could not load department statistics.
            </p>
          </div>
        ) : currentLevel === 1 ? (
          /* ========================================================= */
          /* LEVEL 1: Dual-Ring Concentric Pie (Slots + Enrolled Reach) */
          /* ========================================================= */
          <div className="flex h-full flex-col justify-center">
            {level1Data.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Users className="mb-2 size-8 text-muted-foreground/40" />
                <p className="text-xs font-medium text-muted-foreground">
                  No departments or learner slots recorded yet.
                </p>
              </div>
            ) : (
              <div className="grid h-full grid-cols-1 items-center gap-5 sm:grid-cols-12">
                {/* Left Column: Concentric Dual-Ring Chart (Prominent Centerpiece) */}
                <div className="relative flex h-[255px] w-full shrink-0 items-center justify-center sm:h-[275px] sm:col-span-7">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomDualPieTooltip />} />

                      {/* Outer Indicator Pie (Exclusive to each department's inner slice) */}
                      <Pie
                        data={level1OuterData}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        innerRadius="80%"
                        outerRadius="96%"
                        stroke="none"
                        isAnimationActive={true}
                        className="outline-none"
                        onClick={(entry) => {
                          if (!entry.isRemaining) {
                            const dept = level1Data.find((d) => d.id === entry.id)
                            if (dept) handleSelectDepartment(dept)
                          }
                        }}
                        onMouseEnter={(entry) => {
                          if (!entry.isRemaining) {
                            const dept = level1Data.find((d) => d.id === entry.id)
                            if (dept) setHoveredDept(dept)
                          }
                        }}
                        onMouseLeave={() => setHoveredDept(null)}
                      >
                        {level1OuterData.map((entry, idx) => (
                          <Cell
                            key={`outer-l1-${entry.name}-${idx}`}
                            fill={entry.fill}
                            className={
                              entry.isRemaining
                                ? "pointer-events-none"
                                : "cursor-pointer transition-opacity hover:opacity-85"
                            }
                          />
                        ))}
                      </Pie>

                      {/* Inner Pie: Total Slots Allotted to Departments */}
                      <Pie
                        data={level1Data}
                        dataKey="value"
                        nameKey="name"
                        startAngle={90}
                        endAngle={-270}
                        innerRadius="48%"
                        outerRadius="75%"
                        stroke={chartTheme.surface}
                        strokeWidth={2}
                        className="cursor-pointer outline-none"
                        onClick={(entry) => handleSelectDepartment(entry)}
                        onMouseEnter={(entry) => setHoveredDept(entry)}
                        onMouseLeave={() => setHoveredDept(null)}
                      >
                        {level1Data.map((entry) => {
                          const isHovered = hoveredDept
                            ? hoveredDept.id === entry.id
                            : true
                          return (
                            <Cell
                              key={entry.name}
                              fill={entry.fill}
                              opacity={hoveredDept && !isHovered ? 0.55 : 1}
                              className="transition-all duration-200 hover:opacity-90"
                            />
                          )
                        })}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Donut Center Count & Reach Indicator */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-1 text-center">
                    <span className="font-rb-display text-3xl font-black leading-none tabular-nums tracking-tight text-foreground sm:text-4xl">
                      {activeLevel1Slots}
                    </span>
                    <span className="mt-1 max-w-[95px] text-center text-[10px] font-extrabold uppercase leading-tight tracking-wider text-muted-foreground sm:text-[11px]">
                      {hoveredDept ? "Allotted Slots" : "Total Slots"}
                    </span>
                    <div className="mt-1.5 flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-bold text-sky-600 dark:text-sky-400">
                      <span className="size-1.5 rounded-full bg-[#0284c7]" />
                      <span>{activeLevel1ReachPct}% reach</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Original Stats Layout (Enrolled per Dept + Averages) */}
                <div className="flex flex-col justify-center pl-1 sm:col-span-5">
                  <h4 className="font-rb-display text-base font-bold text-foreground">
                    Stats
                  </h4>
                  <p className="mb-2 mt-0.5 text-xs font-semibold text-muted-foreground">
                    Enrolled per Department
                  </p>

                  {/* Departments List (Number on Left, Name on Right) */}
                  <div className="max-h-[130px] space-y-1.5 overflow-y-auto pr-1">
                    {level1Data.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => handleSelectDepartment(item)}
                        onMouseEnter={() => setHoveredDept(item)}
                        onMouseLeave={() => setHoveredDept(null)}
                        className="group flex w-full items-center justify-between text-left text-xs transition hover:text-primary"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="w-10 text-left font-black tabular-nums text-foreground group-hover:text-primary">
                            {item.enrolled}
                          </span>
                          <span className="truncate font-semibold text-foreground/90 group-hover:text-primary">
                            {item.name}
                          </span>
                        </div>
                        <ChevronRight className="size-3 text-muted-foreground opacity-0 transition group-hover:opacity-100 group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="my-2.5 border-t border-border/50" />

                  {/* Averages Section */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-10 text-left font-black tabular-nums text-foreground">
                        {level1SummaryStats.avgEnrollees}
                      </span>
                      <span className="text-muted-foreground">Avg Enrollees</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-10 text-left font-black tabular-nums text-foreground">
                        {level1SummaryStats.avgCertified}
                      </span>
                      <span className="text-muted-foreground">Avg Certified</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-10 text-left font-black tabular-nums text-foreground">
                        {level1SummaryStats.avgInProgress}
                      </span>
                      <span className="text-muted-foreground">Avg In-Progress</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-10 text-left font-black tabular-nums text-foreground">
                        {level1SummaryStats.avgScore}
                      </span>
                      <span className="text-muted-foreground">Avg Score</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : currentLevel === 2 ? (
          /* ========================================================= */
          /* LEVEL 2: Department Certifications Dual-Ring Chart        */
          /* ========================================================= */
          <div className="flex h-full flex-col justify-center">
            {level2Data.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <BookOpen className="mb-2 size-8 text-muted-foreground/40" />
                <p className="text-xs font-medium text-muted-foreground">
                  No active certifications for this department.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGoBack}
                  className="mt-3 text-xs"
                >
                  Back to Departments
                </Button>
              </div>
            ) : (
              <div className="grid h-full grid-cols-1 items-center gap-5 sm:grid-cols-12">
                {/* Left Column: Concentric Dual-Ring Chart (Prominent Centerpiece) */}
                <div className="relative flex h-[255px] w-full shrink-0 items-center justify-center sm:h-[275px] sm:col-span-7">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomDualPieTooltip />} />

                      {/* Outer Indicator Pie (Exclusive to each certification's inner slice) */}
                      <Pie
                        data={level2OuterData}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        innerRadius="80%"
                        outerRadius="96%"
                        stroke="none"
                        isAnimationActive={true}
                        className="outline-none"
                        onClick={(entry) => {
                          if (!entry.isRemaining) {
                            const cert = level2Data.find(
                              (c) =>
                                (c.institutionCertId || c.certificationId) ===
                                entry.id
                            )
                            if (cert) handleSelectCertification(cert)
                          }
                        }}
                        onMouseEnter={(entry) => {
                          if (!entry.isRemaining) {
                            const cert = level2Data.find(
                              (c) =>
                                (c.institutionCertId || c.certificationId) ===
                                entry.id
                            )
                            if (cert) setHoveredCert(cert)
                          }
                        }}
                        onMouseLeave={() => setHoveredCert(null)}
                      >
                        {level2OuterData.map((entry, idx) => (
                          <Cell
                            key={`outer-l2-${entry.name}-${idx}`}
                            fill={entry.fill}
                            className={
                              entry.isRemaining
                                ? "pointer-events-none"
                                : "cursor-pointer transition-opacity hover:opacity-85"
                            }
                          />
                        ))}
                      </Pie>

                      {/* Inner Pie: Allotted Slots per Certification */}
                      <Pie
                        data={level2Data}
                        dataKey="value"
                        nameKey="name"
                        startAngle={90}
                        endAngle={-270}
                        innerRadius="48%"
                        outerRadius="75%"
                        stroke={chartTheme.surface}
                        strokeWidth={2}
                        className="cursor-pointer outline-none"
                        onClick={(entry) => handleSelectCertification(entry)}
                        onMouseEnter={(entry) => setHoveredCert(entry)}
                        onMouseLeave={() => setHoveredCert(null)}
                      >
                        {level2Data.map((entry) => {
                          const isHovered = hoveredCert
                            ? (hoveredCert.institutionCertId ||
                                hoveredCert.certificationId) ===
                              (entry.institutionCertId || entry.certificationId)
                            : true
                          return (
                            <Cell
                              key={entry.name}
                              fill={entry.fill}
                              opacity={hoveredCert && !isHovered ? 0.55 : 1}
                              className="transition-all duration-200 hover:opacity-90"
                            />
                          )
                        })}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Donut Center Count & Reach Indicator */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-1 text-center">
                    <span className="font-rb-display text-3xl font-black leading-none tabular-nums tracking-tight text-foreground sm:text-4xl">
                      {activeLevel2Slots}
                    </span>
                    <span className="mt-1 max-w-[95px] text-center text-[10px] font-extrabold uppercase leading-tight tracking-wider text-muted-foreground sm:text-[11px]">
                      {hoveredCert ? "Cert Slots" : "Dept Slots"}
                    </span>
                    <div className="mt-1.5 flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-bold text-sky-600 dark:text-sky-400">
                      <span className="size-1.5 rounded-full bg-[#0284c7]" />
                      <span>{activeLevel2ReachPct}% reach</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Original Stats Layout (Enrolled per Cert + Dept Averages) */}
                <div className="flex flex-col justify-center pl-1 sm:col-span-5">
                  <h4 className="font-rb-display text-base font-bold text-foreground">
                    Stats
                  </h4>
                  <p className="mb-2 mt-0.5 truncate text-xs font-semibold text-muted-foreground">
                    Enrolled per Certification
                  </p>

                  {/* Certifications List (Number on Left, Name on Right) */}
                  <div className="max-h-[130px] space-y-1.5 overflow-y-auto pr-1">
                    {level2Data.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => handleSelectCertification(item)}
                        onMouseEnter={() => setHoveredCert(item)}
                        onMouseLeave={() => setHoveredCert(null)}
                        className="group flex w-full items-center justify-between text-left text-xs transition hover:text-primary"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="w-10 text-left font-black tabular-nums text-foreground group-hover:text-primary">
                            {item.enrolled}
                          </span>
                          <span className="truncate font-semibold text-foreground/90 group-hover:text-primary">
                            {item.name}
                          </span>
                        </div>
                        <ChevronRight className="size-3 text-muted-foreground opacity-0 transition group-hover:opacity-100 group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="my-2.5 border-t border-border/50" />

                  {/* Dept Averages */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-10 text-left font-black tabular-nums text-foreground">
                        {level2SummaryStats.avgEnrollees}
                      </span>
                      <span className="text-muted-foreground">Avg Enrollees</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-10 text-left font-black tabular-nums text-foreground">
                        {level2SummaryStats.certified}
                      </span>
                      <span className="text-muted-foreground">Avg Certified</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-10 text-left font-black tabular-nums text-foreground">
                        {level2SummaryStats.inProgress}
                      </span>
                      <span className="text-muted-foreground">Avg In-Progress</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-10 text-left font-black tabular-nums text-foreground">
                        {level2SummaryStats.avgProgress}
                      </span>
                      <span className="text-muted-foreground">Avg Progress</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : currentLevel === 3 ? (
          /* ========================================================= */
          /* LEVEL 3: Slots Allocated vs. Enrolled Learners Bar Graph  */
          /* ========================================================= */
          <div className="flex h-full flex-col justify-between space-y-3">
            {/* Overview Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/40 p-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <TicketIcon className="size-4" />
                </span>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Slots Pool
                  </div>
                  <div className="text-lg font-black tabular-nums text-foreground">
                    {level3Data?.totalSlots ?? 0}
                  </div>
                </div>
              </div>

              <div
                onClick={() => setCurrentLevel(4)}
                className="group flex cursor-pointer items-center gap-2.5 rounded-xl border border-primary/30 bg-primary/5 p-2.5 transition hover:border-primary hover:bg-primary/10"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-primary/20 text-primary">
                  <Users className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-primary">
                    Dept Enrolled
                  </div>
                  <div className="text-lg font-black tabular-nums text-foreground">
                    {level3Data?.enrolledInDept ?? 0}
                  </div>
                </div>
                <ChevronRight className="size-4 text-primary transition group-hover:translate-x-0.5" />
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/40 p-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <GraduationCap className="size-4" />
                </span>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Pool Remaining
                  </div>
                  <div className="text-lg font-black tabular-nums text-foreground">
                    {level3Data?.remainingSlots ?? 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Visual Bar Comparison */}
            <div className="space-y-3 rounded-xl border border-border bg-card/70 p-3.5">
              {/* Allocated Slots Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-2 font-semibold text-muted-foreground">
                    <span className="size-2.5 rounded-full bg-amber-500" />
                    Allocated Slots (Overall Institution Pool)
                  </span>
                  <span className="font-bold tabular-nums text-foreground">
                    {level3Data?.totalSlots ?? 0} slots
                  </span>
                </div>
                <div className="h-3.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-500"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              {/* Enrolled Students Bar (Interactive) */}
              <button
                type="button"
                onClick={() => setCurrentLevel(4)}
                className="group block w-full text-left transition"
              >
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-2 font-bold text-primary group-hover:underline">
                    <span className="size-2.5 rounded-full bg-primary" />
                    Enrolled by {selectedDepartment?.name} (Click to view progress) →
                  </span>
                  <span className="font-extrabold tabular-nums text-foreground">
                    {level3Data?.enrolledInDept ?? 0} learners ({level3Data?.percentFilled}%)
                  </span>
                </div>
                <div className="mt-1 h-3.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500 group-hover:bg-primary/90"
                    style={{
                      width: `${Math.max(
                        Math.min(
                          level3Data?.totalSlots
                            ? (level3Data.enrolledInDept / level3Data.totalSlots) * 100
                            : 100,
                          100
                        ),
                        6
                      )}%`,
                    }}
                  />
                </div>
              </button>
            </div>

            {/* Action CTA */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentLevel(4)}
              className="w-full justify-center text-xs font-bold text-primary hover:bg-primary/10"
            >
              <GraduationCap className="mr-1.5 size-4" />
              View Learner Progress ({level3Data?.enrolledInDept ?? 0}) →
            </Button>
          </div>
        ) : (
          /* ========================================================= */
          /* LEVEL 4: Learner Progress Breakdown (Option C)            */
          /* ========================================================= */
          <div className="flex h-full flex-col justify-between space-y-2.5">
            {/* Top Summary: Segmented Distribution Bar */}
            <div className="rounded-xl border border-border bg-muted/40 p-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Cohort Progress Distribution
                </span>
                <span className="text-xs font-extrabold text-foreground">
                  Cohort Average: {avgLearnerProgress}%
                </span>
              </div>

              {/* Segmented Distribution Bar */}
              <div className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                {progressBuckets.map((bucket) => {
                  const pct =
                    level4Learners.length > 0
                      ? (bucket.count / level4Learners.length) * 100
                      : 0
                  if (pct === 0) return null
                  return (
                    <div
                      key={bucket.label}
                      style={{
                        width: `${pct}%`,
                        backgroundColor: bucket.color,
                      }}
                      className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                      title={`${bucket.label}: ${bucket.count} learner(s)`}
                    />
                  )
                })}
              </div>

              {/* Distribution Legend */}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
                {progressBuckets.map((b) => (
                  <span key={b.label} className="flex items-center gap-1 font-medium">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: b.color }}
                    />
                    {b.label}: <strong className="text-foreground">{b.count}</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* Scrollable Learner Roster */}
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {level4Learners.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  No learners found for this certificate.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {level4Learners.map((learner) => (
                    <div
                      key={learner.assignmentId || learner.learnerId}
                      className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-2.5 shadow-xs transition hover:border-primary/40"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {getInitials(learner.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-foreground">
                            {learner.name}
                          </div>
                          {learner.email ? (
                            <div className="truncate text-[10px] text-muted-foreground">
                              {learner.email}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="ml-3 flex shrink-0 items-center gap-2">
                        <div className="w-20">
                          <Progress value={learner.progress} className="h-1.5" />
                        </div>
                        <span className="w-8 text-right text-xs font-bold tabular-nums text-foreground">
                          {learner.progress}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ----------------- Remarks Box (Matching User Mockup) ----------------- */}
      <div className="mt-2.5 rounded-2xl border border-[#c7dcb8] bg-[#e3ecda] px-3.5 py-2.5 text-xs shadow-xs dark:border-[#2f5e3e] dark:bg-[#1a3826]/50">
        <span className="font-bold text-[#1b4329] dark:text-[#a8e6b8]">Remarks: </span>
        <span className="text-[#2a5c37] dark:text-emerald-100/90 leading-relaxed">
          {remarksText}
        </span>
      </div>
    </div>
  )
}
