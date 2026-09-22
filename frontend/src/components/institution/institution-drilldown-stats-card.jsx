import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
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
  Sparkles,
  TicketIcon,
  Users,
  BookOpen,
} from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useChartTheme } from "@/components/charts/rebyu-charts.jsx"
import { getLearnerDisplayName } from "@/hooks/use-institution-data.js"
import { useIsMobile } from "@/hooks/use-mobile"
import { getDepartmentAbbreviation } from "@/constants/departments.js"

// Warm & natural Earth Tone Palette
const EARTH_TONE_PALETTE = [
  "#2f6b4f", // Deep Forest Green
  "#c8553d", // Rust Terracotta
  "#c9962b", // Warm Ochre Amber
  "#8b5f7d", // Muted Plum / Earth Violet
  "#4a7c59", // Moss Green
  "#b06d3b", // Warm Clay
  "#5c6b73", // Slate Mineral Grey
  "#bc4749", // Brick Red
  "#606c38", // Olive Earth
  "#b08968", // Sand Taupe
]

const DEPARTMENT_PALETTE = EARTH_TONE_PALETTE
const SLOTS_PALETTE = EARTH_TONE_PALETTE
const REACH_COLOR = "#2f6b4f" // Earth forest green base

// Smooth directional slide & cross-fade variants for drill-down levels
const levelVariants = {
  enter: (dir = 1) => ({
    opacity: 0,
    x: dir > 0 ? 20 : -20,
  }),
  center: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.26,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: (dir = 1) => ({
    opacity: 0,
    x: dir > 0 ? -20 : 20,
    transition: {
      duration: 0.16,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
}

function hexToRgba(hex, alpha = 0.18) {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) {
    return `rgba(47, 107, 79, ${alpha})`
  }
  const cleanHex = hex.replace("#", "")
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

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

function getProgressTierColor(val) {
  const p = Number(val) || 0
  if (p <= 25) return "#eb6b56" // Coral Red for 0–25%
  if (p <= 50) return "#f5a623" // Amber for 26–50%
  if (p <= 75) return "#3898c6" // Blue for 51–75%
  return "#3caea3" // Emerald/Teal for 76–100%
}

function DepartmentDetailsFixedCard({ item, onClick, onMouseEnter, onMouseLeave }) {
  if (!item) return null

  const rawTitle = (item.deptName || item.certTitle || item.name || "")
    .replace(/\s+/g, " ")
    .trim()

  // Remove "College of " prefix to maximize space for the department name
  const title = rawTitle.replace(/^College of\s+/i, "")

  const sliceFill = item.fill || item.deptFill || item.certFill || "#2f6b4f"

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="group flex w-[142px] sm:w-[150px] flex-col rounded-xl border border-border/70 bg-card/95 p-2 sm:p-2.5 text-left shadow-md backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:shadow-lg cursor-pointer"
    >
      <div className="flex w-full items-center gap-1.5 border-b border-border/50 pb-1.5">
        <span
          className="size-2 shrink-0 rounded-full ring-1 ring-background"
          style={{ backgroundColor: sliceFill }}
        />
        <span
          className="line-clamp-2 text-[11px] font-bold leading-tight text-foreground transition-colors group-hover:text-primary"
          title={rawTitle}
        >
          {title}
        </span>
      </div>
      <div className="mt-1.5 w-full space-y-1 text-[11px]">
        <div className="flex items-center justify-between gap-1 text-muted-foreground">
          <span className="text-[10px]">Allotted Slots:</span>
          <span className="font-bold tabular-nums text-foreground">
            {item.allottedSlots ?? item.value ?? 0}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1 text-muted-foreground">
          <span className="text-[10px]">Enrolled:</span>
          <span className="font-bold tabular-nums text-foreground">
            {item.enrolled ?? 0}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1 text-muted-foreground">
          <span className="text-[10px]">Capacity Reach:</span>
          <span
            className="font-extrabold tabular-nums"
            style={{ color: sliceFill }}
          >
            {item.reachPct ?? 0}%
          </span>
        </div>
      </div>
      <div className="mt-1.5 flex w-full items-center justify-between border-t border-border/50 pt-1 text-[9px] font-medium text-muted-foreground/80 transition-colors group-hover:text-primary">
        <span>Click to drill down</span>
        <ChevronRight className="size-2.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
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
  const isMobile = useIsMobile()

  // Navigation state: Level 1 (Departments) -> 2 (Certifications) -> 3 (Slots vs Enrolled) -> 4 (Learner Progress)
  const [currentLevel, setCurrentLevel] = useState(1)
  const prevLevelRef = useRef(1)
  const direction = currentLevel >= prevLevelRef.current ? 1 : -1

  useEffect(() => {
    prevLevelRef.current = currentLevel
  }, [currentLevel])

  const [selectedDepartment, setSelectedDepartment] = useState(null)
  const [selectedCertification, setSelectedCertification] = useState(null)

  // Interactive Hover state for Dual Rings
  const [hoveredDept, setHoveredDept] = useState(null)
  const [hoveredCert, setHoveredCert] = useState(null)
  const [hoveredStatDept, setHoveredStatDept] = useState(null)
  const [hoveredStatCert, setHoveredStatCert] = useState(null)
  const [hoveredStatMetric, setHoveredStatMetric] = useState(null)
  const [isCardHovered, setIsCardHovered] = useState(false)

  // Exit grace timers to prevent micro-flicker
  const deptHoverTimeoutRef = useRef(null)
  const certHoverTimeoutRef = useRef(null)

  const handleDeptMouseEnter = (item) => {
    if (deptHoverTimeoutRef.current) {
      clearTimeout(deptHoverTimeoutRef.current)
      deptHoverTimeoutRef.current = null
    }
    setHoveredDept(item)
    setHoveredStatDept(item)
  }

  const handleDeptMouseLeave = () => {
    if (deptHoverTimeoutRef.current) {
      clearTimeout(deptHoverTimeoutRef.current)
    }
    deptHoverTimeoutRef.current = setTimeout(() => {
      setHoveredDept(null)
      setHoveredStatDept(null)
      deptHoverTimeoutRef.current = null
    }, 120)
  }

  const handleCertMouseEnter = (item) => {
    if (certHoverTimeoutRef.current) {
      clearTimeout(certHoverTimeoutRef.current)
      certHoverTimeoutRef.current = null
    }
    setHoveredCert(item)
    setHoveredStatCert(item)
  }

  const handleCertMouseLeave = () => {
    if (certHoverTimeoutRef.current) {
      clearTimeout(certHoverTimeoutRef.current)
    }
    certHoverTimeoutRef.current = setTimeout(() => {
      setHoveredCert(null)
      setHoveredStatCert(null)
      certHoverTimeoutRef.current = null
    }, 120)
  }

  useEffect(() => {
    return () => {
      if (deptHoverTimeoutRef.current) clearTimeout(deptHoverTimeoutRef.current)
      if (certHoverTimeoutRef.current) clearTimeout(certHoverTimeoutRef.current)
    }
  }, [])

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

    // 0. Only consider active, non-archived departments
    const activeDepartments = (departments || []).filter((dept) => {
      const status = (dept?.status || "active").toLowerCase()
      return status === "active"
    })

    const activeDeptIdSet = new Set(
      activeDepartments
        .map((dept) => String(dept.departmentId ?? dept.id ?? ""))
        .filter(Boolean)
    )

    // 1. Seed from active departments prop
    activeDepartments.forEach((dept) => {
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

    // 2. Seed from groupStats - ONLY if active and not archived
    groupStats.forEach((group) => {
      const status = (group?.status || "active").toLowerCase()
      if (status !== "active") return

      if (group?.departmentId != null) {
        const deptId = String(group.departmentId)
        // If we have registered active departments, don't resurrect unlisted/deleted ones
        if (activeDeptIdSet.size > 0 && !activeDeptIdSet.has(deptId)) {
          return
        }

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

      // Do NOT resurrect archived / deleted departments
      if (deptId !== "unassigned" && activeDeptIdSet.size > 0 && !activeDeptIdSet.has(deptId)) {
        return
      }

      if (deptMap.has(deptId)) {
        const entry = deptMap.get(deptId)
        entry.learnerIds.add(assignment.learnerId)
        entry.assignmentCount += 1
      }
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

        const deptLearnerIds = entry.learnerIds
        const deptMembers = members.filter((m) => deptLearnerIds.has(m.learnerId))

        const certified = deptMembers.filter(
          (m) =>
            Number(m.completedCertifications ?? 0) > 0 ||
            Number(m.averageProgress ?? 0) >= 100
        ).length

        const inProgress = deptMembers.filter(
          (m) =>
            Number(m.averageProgress ?? 0) > 0 &&
            Number(m.averageProgress ?? 0) < 100
        ).length

        const avgScoreVal =
          deptMembers.length > 0
            ? Math.round(
                deptMembers.reduce(
                  (sum, m) =>
                    sum + Number(m.averageProgress ?? m.score ?? 0),
                  0
                ) / deptMembers.length
              )
            : summary?.averageScore != null
            ? Math.round(Number(summary.averageScore))
            : summary?.averageProgress != null
            ? Math.round(Number(summary.averageProgress))
            : 0

        return {
          id: entry.id,
          name: entry.name,
          value: slots, // Inner pie slice size = allotted slots!
          allottedSlots: slots,
          enrolled,
          reachPct,
          certified,
          inProgress,
          avgScore: avgScoreVal,
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
    members,
    summary?.averageScore,
    summary?.averageProgress,
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

  // Outer indicator reach data exclusive to hovered department's inner slice
  // OR displays outer arcs across ALL departments when hovering an average metric (e.g. Avg Enrollees)
  const level1OuterData = useMemo(() => {
    // Case 1: Hovering an average metric (Avg Enrollees, Avg Certified, Avg In-Progress, Avg Score)
    if (hoveredStatMetric) {
      const segments = []
      let fillColor = REACH_COLOR
      let trackColor = hexToRgba(REACH_COLOR, 0.18)

      if (hoveredStatMetric === "certified") {
        fillColor = "#2f6b4f"
        trackColor = hexToRgba("#2f6b4f", 0.18)
      } else if (hoveredStatMetric === "inProgress") {
        fillColor = "#c9962b"
        trackColor = hexToRgba("#c9962b", 0.18)
      } else if (hoveredStatMetric === "score") {
        fillColor = "#8b5f7d"
        trackColor = hexToRgba("#8b5f7d", 0.18)
      }

      level1Data.forEach((dept) => {
        const slots = dept.allottedSlots
        let fillValue = 0
        const deptColor = dept.fill || REACH_COLOR
        const deptTrack = hexToRgba(deptColor, 0.18)

        let segmentFill = fillColor
        let segmentTrack = trackColor

        if (hoveredStatMetric === "enrollees") {
          fillValue = Math.min(dept.enrolled, slots)
          segmentFill = deptColor
          segmentTrack = deptTrack
        } else if (hoveredStatMetric === "certified") {
          fillValue = Math.min(dept.certified, slots)
        } else if (hoveredStatMetric === "inProgress") {
          fillValue = Math.min(dept.inProgress, slots)
        } else if (hoveredStatMetric === "score") {
          fillValue = Math.min(
            Math.round(slots * (Math.min(dept.avgScore, 100) / 100)),
            slots
          )
        }

        const remaining = Math.max(slots - fillValue, 0)

        if (fillValue > 0) {
          segments.push({
            id: dept.id,
            name: `${dept.name} Metric Fill`,
            deptName: dept.name,
            allottedSlots: slots,
            enrolled: dept.enrolled,
            reachPct: dept.reachPct,
            value: fillValue,
            isRemaining: false,
            fill: segmentFill,
            deptFill: dept.fill,
          })
        }

        if (remaining > 0) {
          segments.push({
            id: dept.id,
            name: `${dept.name} Metric Remaining`,
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
    }

    // Case 2: Hovering an individual department row in Stats
    if (hoveredStatDept) {
      const segments = []
      level1Data.forEach((dept) => {
        const slots = dept.allottedSlots
        const isTarget = dept.id === hoveredStatDept.id

        if (!isTarget) {
          // Transparent placeholder to preserve exact angular alignment
          segments.push({
            id: dept.id,
            name: `${dept.name} Placeholder`,
            deptName: dept.name,
            allottedSlots: slots,
            enrolled: dept.enrolled,
            reachPct: dept.reachPct,
            value: slots,
            isRemaining: true,
            fill: "transparent",
            deptFill: dept.fill,
          })
        } else {
          const enrolled = Math.min(dept.enrolled, slots)
          const remaining = Math.max(slots - enrolled, 0)
          const deptColor = dept.fill || REACH_COLOR
          const deptTrack = hexToRgba(deptColor, 0.18)

          // Enrolled arc segment (exclusive to this hovered department, matching its color)
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
              fill: deptColor,
              deptFill: dept.fill,
            })
          }

          // Unfilled remaining slots segment (transparent placeholder to preserve alignment)
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
        }
      })
      return segments
    }

    // Case 3: Idle state (nothing hovered)
    return []
  }, [level1Data, hoveredStatDept, hoveredStatMetric])

  // Center display values
  const activeLevel1ReachPct = hoveredDept
    ? hoveredDept.reachPct
    : overallLevel1ReachPct
  const activeLevel1Slots = hoveredDept
    ? hoveredDept.allottedSlots
    : totalLevel1Slots
  const activeLevel1Enrolled = hoveredDept
    ? hoveredDept.enrolled
    : totalLevel1Enrolled

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

        const certMembers = members.filter((m) => entry.learnerIds.has(m.learnerId))

        const certified = certMembers.filter(
          (m) =>
            Number(m.completedCertifications ?? 0) > 0 ||
            Number(m.averageProgress ?? 0) >= 100
        ).length

        const inProgress = certMembers.filter(
          (m) =>
            Number(m.averageProgress ?? 0) > 0 &&
            Number(m.averageProgress ?? 0) < 100
        ).length

        const avgProgressVal =
          certMembers.length > 0
            ? Math.round(
                certMembers.reduce(
                  (sum, m) => sum + Number(m.averageProgress ?? 0),
                  0
                ) / certMembers.length
              )
            : 0

        return {
          ...entry,
          name: entry.title,
          value: slots, // Slices represent allotted slots!
          allottedSlots: slots,
          enrolled,
          reachPct,
          certified,
          inProgress,
          avgProgress: avgProgressVal,
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
    members,
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

  // Outer indicator reach data exclusive to hovered certification's inner slice
  // OR displays outer arcs across ALL certifications when hovering an average metric (e.g. Avg Enrollees)
  const level2OuterData = useMemo(() => {
    // Case 1: Hovering an average metric in Level 2
    if (hoveredStatMetric) {
      const segments = []
      let fillColor = REACH_COLOR
      let trackColor = hexToRgba(REACH_COLOR, 0.18)

      if (hoveredStatMetric === "certified") {
        fillColor = "#2f6b4f"
        trackColor = hexToRgba("#2f6b4f", 0.18)
      } else if (hoveredStatMetric === "inProgress") {
        fillColor = "#c9962b"
        trackColor = hexToRgba("#c9962b", 0.18)
      } else if (hoveredStatMetric === "progress" || hoveredStatMetric === "score") {
        fillColor = "#8b5f7d"
        trackColor = hexToRgba("#8b5f7d", 0.18)
      }

      level2Data.forEach((cert) => {
        const slots = cert.allottedSlots
        let fillValue = 0
        const certColor = cert.fill || REACH_COLOR
        const certTrack = hexToRgba(certColor, 0.18)

        let segmentFill = fillColor
        let segmentTrack = trackColor

        if (hoveredStatMetric === "enrollees") {
          fillValue = Math.min(cert.enrolled, slots)
          segmentFill = certColor
          segmentTrack = certTrack
        } else if (hoveredStatMetric === "certified") {
          fillValue = Math.min(cert.certified, slots)
        } else if (hoveredStatMetric === "inProgress") {
          fillValue = Math.min(cert.inProgress, slots)
        } else if (hoveredStatMetric === "progress" || hoveredStatMetric === "score") {
          fillValue = Math.min(
            Math.round(slots * (Math.min(cert.avgProgress, 100) / 100)),
            slots
          )
        }

        const remaining = Math.max(slots - fillValue, 0)

        if (fillValue > 0) {
          segments.push({
            id: cert.institutionCertId || cert.certificationId,
            name: `${cert.name} Metric Fill`,
            certTitle: cert.name,
            allottedSlots: slots,
            enrolled: cert.enrolled,
            reachPct: cert.reachPct,
            value: fillValue,
            isRemaining: false,
            fill: segmentFill,
            certFill: cert.fill,
          })
        }

        if (remaining > 0) {
          segments.push({
            id: cert.institutionCertId || cert.certificationId,
            name: `${cert.name} Metric Remaining`,
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
    }

    // Case 2: Hovering an individual certification row in Level 2 Stats
    if (hoveredStatCert) {
      const segments = []
      level2Data.forEach((cert) => {
        const slots = cert.allottedSlots
        const isTarget =
          (hoveredStatCert.institutionCertId || hoveredStatCert.certificationId) ===
          (cert.institutionCertId || cert.certificationId)

        if (!isTarget) {
          // Transparent placeholder to preserve exact angular alignment
          segments.push({
            id: cert.institutionCertId || cert.certificationId,
            name: `${cert.name} Placeholder`,
            certTitle: cert.name,
            allottedSlots: slots,
            enrolled: cert.enrolled,
            reachPct: cert.reachPct,
            value: slots,
            isRemaining: true,
            fill: "transparent",
            certFill: cert.fill,
          })
        } else {
          const enrolled = Math.min(cert.enrolled, slots)
          const remaining = Math.max(slots - enrolled, 0)
          const certColor = cert.fill || REACH_COLOR
          const certTrack = hexToRgba(certColor, 0.18)

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
              fill: certColor,
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
        }
      })
      return segments
    }

    // Case 3: Idle
    return []
  }, [level2Data, hoveredStatCert, hoveredStatMetric])

  const activeLevel2ReachPct = hoveredCert
    ? hoveredCert.reachPct
    : overallLevel2ReachPct
  const activeLevel2Slots = hoveredCert
    ? hoveredCert.allottedSlots
    : totalLevel2Slots
  const activeLevel2Enrolled = hoveredCert
    ? hoveredCert.enrolled
    : totalLevel2Enrolled

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

    const certId =
      selectedCertification.institutionCertId ||
      selectedCertification.certificationId

    const deptLearnerAssignments = (data?.assignments || []).filter((assignment) => {
      const matchCert =
        assignment.institutionCertId === certId ||
        assignment.certificationId === certId ||
        (selectedCertification.certificationId &&
          assignment.certificationId === selectedCertification.certificationId)
      if (!matchCert) return false

      if (!selectedDepartment?.id) return true
      const membership = data.groupByInstitutionCertLearnerId?.get(
        assignment.institutionCertLearnerId
      )
      return (
        membership?.departmentId != null &&
        String(membership.departmentId) === String(selectedDepartment.id)
      )
    })

    let completed = 0
    let inProgress = 0
    let notStarted = 0

    deptLearnerAssignments.forEach((assignment) => {
      const member = membersMap.get(assignment.learnerId)
      let prog = Number(
        assignment.progressPercentage ?? member?.averageProgress ?? 0
      )
      if (isNaN(prog)) prog = 0
      if (prog >= 100 || Number(member?.completedCertifications ?? 0) > 0) {
        completed += 1
      } else if (prog > 0) {
        inProgress += 1
      } else {
        notStarted += 1
      }
    })

    // If no direct assignments found, fallback to counts from selectedCertification
    if (deptLearnerAssignments.length === 0 && enrolledInDept > 0) {
      completed = selectedCertification.certified || 0
      inProgress =
        selectedCertification.inProgress ||
        Math.max(enrolledInDept - completed, 0)
      notStarted = Math.max(enrolledInDept - completed - inProgress, 0)
    }

    return {
      totalSlots,
      enrolledInDept,
      remainingSlots,
      percentFilled,
      completed,
      inProgress,
      notStarted,
    }
  }, [
    selectedCertification,
    selectedDepartment,
    data?.assignments,
    data?.groupByInstitutionCertLearnerId,
    membersMap,
  ])

  const level4Learners = useMemo(() => {
    if (!selectedCertification) return []

    const certId =
      selectedCertification.institutionCertId ||
      selectedCertification.certificationId

    const deptLearnerAssignments = (data?.assignments || []).filter((assignment) => {
      const matchCert =
        assignment.institutionCertId === certId ||
        assignment.certificationId === certId ||
        (selectedCertification.certificationId &&
          assignment.certificationId === selectedCertification.certificationId)
      if (!matchCert) return false

      if (!selectedDepartment?.id) return true
      const membership = data.groupByInstitutionCertLearnerId?.get(
        assignment.institutionCertLearnerId
      )
      return (
        membership?.departmentId != null &&
        String(membership.departmentId) === String(selectedDepartment.id)
      )
    })

    const assignmentsToUse =
      deptLearnerAssignments.length > 0
        ? deptLearnerAssignments
        : selectedCertification.assignments || []

    return assignmentsToUse
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
  }, [
    selectedCertification,
    selectedDepartment,
    data?.assignments,
    data?.groupByInstitutionCertLearnerId,
    data.learnerById,
    membersMap,
  ])

  // Distribution buckets for Level 4
  const progressBuckets = useMemo(() => {
    const buckets = [
      { label: "0–25%", min: 0, max: 25, color: "#eb6b56", count: 0 },
      { label: "26–50%", min: 26, max: 50, color: "#f5a623", count: 0 },
      { label: "51–75%", min: 51, max: 75, color: "#3898c6", count: 0 },
      { label: "76–100%", min: 76, max: 100, color: "#3caea3", count: 0 },
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
    const totalEnrolled = totalLevel1Enrolled
    const avgEnrollees = Math.round(totalLevel1Enrolled / deptCount)

    // Certified learners: completed certifications > 0 or progress >= 100%
    const certifiedCount = members.filter(
      (m) =>
        Number(m.completedCertifications ?? 0) > 0 ||
        Number(m.averageProgress ?? 0) >= 100
    ).length
    const avgCertified = Math.round(certifiedCount / deptCount)
    const certifiedPct =
      totalLevel1Slots > 0
        ? Math.min(Math.round((certifiedCount / totalLevel1Slots) * 100), 100)
        : 0

    // In-progress learners: 0 < progress < 100%
    const inProgressCount = members.filter(
      (m) =>
        Number(m.averageProgress ?? 0) > 0 && Number(m.averageProgress ?? 0) < 100
    ).length
    const avgInProgress = Math.round(inProgressCount / deptCount)
    const inProgressPct =
      totalLevel1Slots > 0
        ? Math.min(Math.round((inProgressCount / totalLevel1Slots) * 100), 100)
        : 0

    const avgScore =
      summary?.averageScore != null
        ? `${Math.round(Number(summary.averageScore))}%`
        : summary?.averageProgress != null
        ? `${Math.round(Number(summary.averageProgress))}%`
        : "—"

    return {
      avgEnrollees,
      avgCertified,
      certifiedPct,
      avgInProgress,
      inProgressPct,
      avgScore,
      // Totals retained for remarks calculation & aliases
      totalEnrolled,
      totalCompleted: certifiedCount,
      totalInProgress: inProgressCount,
      completedPct: certifiedPct,
    }
  }, [level1Data, totalLevel1Enrolled, totalLevel1Slots, members, summary])

  // Retain last hovered item so fade-out animation completes smoothly without blanking
  const [lastActiveDept, setLastActiveDept] = useState(null)
  const currentActiveDept = hoveredDept || hoveredStatDept
  useEffect(() => {
    if (currentActiveDept) {
      setLastActiveDept(currentActiveDept)
    } else if (!lastActiveDept && level1Data.length > 0) {
      setLastActiveDept(level1Data[0])
    }
  }, [currentActiveDept, level1Data])

  const isLevel1PanelVisible = Boolean(currentActiveDept || isCardHovered)
  const displayLevel1Item = currentActiveDept || lastActiveDept || level1Data[0]

  // -------------------------------------------------------------------------
  // Summary Stats for Level 2 (Certification Level)
  // -------------------------------------------------------------------------
  const level2SummaryStats = useMemo(() => {
    if (!level2Data.length) {
      return {
        avgEnrollees: 0,
        avgCertified: 0,
        certified: 0,
        certifiedPct: 0,
        avgInProgress: 0,
        inProgress: 0,
        inProgressPct: 0,
        avgProgress: "—",
        totalEnrolled: 0,
        totalCompleted: 0,
        totalInProgress: 0,
      }
    }

    const certCount = level2Data.length || 1
    const totalEnrolled = level2Data.reduce((sum, c) => sum + c.enrolled, 0)
    const avgEnrollees = Math.round(totalEnrolled / certCount)

    const deptLearnerIds = new Set()
    level2Data.forEach((c) => {
      c.learnerIds?.forEach((id) => deptLearnerIds.add(id))
    })
    const deptMembers = members.filter((m) => deptLearnerIds.has(m.learnerId))

    const certifiedCount = deptMembers.filter(
      (m) =>
        Number(m.completedCertifications ?? 0) > 0 ||
        Number(m.averageProgress ?? 0) >= 100
    ).length
    const avgCertified = Math.round(certifiedCount / certCount)

    const inProgressCount = deptMembers.filter(
      (m) =>
        Number(m.averageProgress ?? 0) > 0 && Number(m.averageProgress ?? 0) < 100
    ).length
    const avgInProgress = Math.round(inProgressCount / certCount)

    const certifiedPct =
      totalLevel2Slots > 0
        ? Math.min(Math.round((certifiedCount / totalLevel2Slots) * 100), 100)
        : 0
    const inProgressPct =
      totalLevel2Slots > 0
        ? Math.min(Math.round((inProgressCount / totalLevel2Slots) * 100), 100)
        : 0

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
      avgCertified,
      certified: avgCertified,
      certifiedPct,
      avgInProgress,
      inProgress: avgInProgress,
      inProgressPct,
      avgProgress: `${avgProgressVal}%`,
      // Totals retained for remarks calculation
      totalEnrolled,
      totalCompleted: certifiedCount,
      totalInProgress: inProgressCount,
      completedPct: certifiedPct,
    }
  }, [level2Data, totalLevel2Slots, members])

  // Retain last hovered certification so fade-out animation completes smoothly without blanking
  const [lastActiveCert, setLastActiveCert] = useState(null)
  const currentActiveCert = hoveredCert || hoveredStatCert
  useEffect(() => {
    if (currentActiveCert) {
      setLastActiveCert(currentActiveCert)
    } else if (!lastActiveCert && level2Data.length > 0) {
      setLastActiveCert(level2Data[0])
    }
  }, [currentActiveCert, level2Data])

  const isLevel2PanelVisible = Boolean(currentActiveCert || isCardHovered)
  const displayLevel2Item = currentActiveCert || lastActiveCert || level2Data[0]

  // -------------------------------------------------------------------------
  // Dynamic Remarks Content per Level (Executive Diagnostic Intelligence)
  // -------------------------------------------------------------------------
  const remarksData = useMemo(() => {
    if (currentLevel === 1) {
      if (!level1Data.length || totalLevel1Enrolled === 0) {
        return {
          tag: "Critical Inactivity",
          diagnosis: `Allocated capacity is 100% idle (${totalLevel1Enrolled} of ${totalLevel1Slots} seats used, ${overallLevel1ReachPct}% capacity). All department tracks report zero active learner participation.`,
          recommendation: "Activate department cohorts immediately by assigning designated certification tracks and onboarding students.",
        }
      }

      const emptyDepts = level1Data.filter((d) => d.enrolled === 0).length

      if (overallLevel1ReachPct < 50) {
        return {
          tag: "Severe Underutilization",
          diagnosis: `Allotted seats are critically under-utilized at only ${overallLevel1ReachPct}% capacity (${totalLevel1Enrolled} of ${totalLevel1Slots} seats taken)${
            emptyDepts > 0 ? `, with ${emptyDepts} department(s) recording zero active enrollees` : ""
          }. Student achievement remains lagging with an institutional average progress score of ${level1SummaryStats.avgScore}.`,
          recommendation: "Reallocate vacant seat licenses from dormant departments to active cohorts and mandate refresher reviews.",
        }
      }

      if (overallLevel1ReachPct < 80) {
        return {
          tag: "Moderate Throughput",
          diagnosis: `Seat occupancy is moderate at ${overallLevel1ReachPct}% (${totalLevel1Enrolled} of ${totalLevel1Slots} seats occupied), yet average student performance score stands at ${level1SummaryStats.avgScore}. The persistent gap between seat reservations and completed reviews indicates significant learner drop-off.`,
          recommendation: "Introduce milestone checkpoints and automated reminder nudges to push in-progress learners toward mock exams.",
        }
      }

      return {
        tag: "High Engagement",
        diagnosis: `Seat allocation is robust at ${overallLevel1ReachPct}% capacity (${totalLevel1Enrolled} of ${totalLevel1Slots} seats filled). However, overall average performance of ${level1SummaryStats.avgScore} reflects room for higher curriculum mastery.`,
        recommendation: "Conduct targeted mock assessment clinics to transition active enrollees into completed certifications.",
      }
    }

    if (currentLevel === 2) {
      if (!level2Data.length) {
        return {
          tag: "Zero Allocation",
          diagnosis: `No active certification tracks are currently provisioned for ${selectedDepartment?.name || "this department"}, leaving allocated capacity unassigned.`,
          recommendation: "Assign relevant industry certifications to this department's study plan to begin onboarding students.",
        }
      }
      const deptTotalEnrolled = level2Data.reduce((sum, c) => sum + c.enrolled, 0)
      const reachPct =
        totalLevel2Slots > 0
          ? Math.round((deptTotalEnrolled / totalLevel2Slots) * 100)
          : 0
      const unassignedCerts = level2Data.filter((c) => c.enrolled === 0).length

      return {
        tag: reachPct < 50 ? "Low Department Uptake" : "Department In-Progress",
        diagnosis: `In ${selectedDepartment?.name || "this department"}, seat utilization is at ${reachPct}% (${deptTotalEnrolled} of ${totalLevel2Slots} seats filled)${
          unassignedCerts > 0 ? `, with ${unassignedCerts} certification path(s) completely untouched` : ""
        }. Average cohort progress (${level2SummaryStats.avgProgress}) underscores sluggish skill attainment.`,
        recommendation: "Encourage department faculty leads to set weekly completion goals and review mock exam readiness reports.",
      }
    }

    if (currentLevel === 3) {
      if (!level3Data) {
        return {
          tag: "Data Pending",
          diagnosis: "Slot utilization metrics are currently loading or unavailable.",
          recommendation: "Refresh the data or verify assigned licenses for this certification.",
        }
      }

      if (level3Data.percentFilled === 0) {
        return {
          tag: "Zero Uptake",
          diagnosis: `None of the ${level3Data.totalSlots} provisioned slots for this track have been claimed by learners in ${selectedDepartment?.name || "this department"}. Allocated capacity is completely idle.`,
          recommendation: "Distribute access links and enroll candidates in this track to begin certification prep.",
        }
      }

      if (level3Data.percentFilled < 50) {
        return {
          tag: "Underutilized Allocation",
          diagnosis: `Only ${level3Data.percentFilled}% of allocated capacity is utilized (${level3Data.enrolledInDept} of ${level3Data.totalSlots} seats). With ${level3Data.remainingSlots} seats remaining idle, this department is trailing its target enrollment schedule.`,
          recommendation: "Review pending cohort invitations and onboard eligible candidates to prevent slot wastage.",
        }
      }

      if (level3Data.percentFilled < 90) {
        return {
          tag: "Healthy Utilization",
          diagnosis: `Slot uptake is healthy at ${level3Data.percentFilled}% capacity (${level3Data.enrolledInDept} of ${level3Data.totalSlots} seats filled, with ${level3Data.remainingSlots} remaining). Average learner progress across this cohort is ${avgLearnerProgress}%.`,
          recommendation: "Monitor learner progression through milestone check-ins to ensure on-time mock exam readiness.",
        }
      }

      return {
        tag: "Near Full Capacity",
        diagnosis: `This certification track has achieved ${level3Data.percentFilled}% capacity (${level3Data.enrolledInDept} of ${level3Data.totalSlots} seats active). Available seat pool is nearly exhausted.`,
        recommendation: "Request additional seat quotas from the institutional pool if more department learners need enrollment.",
      }
    }

    if (currentLevel === 4) {
      if (!level4Learners.length) {
        return {
          tag: "No Enrollees",
          diagnosis: `No learners are currently assigned to ${selectedCertification?.title || "this certification"} in ${selectedDepartment?.name || "this department"}.`,
          recommendation: "Assign learners to begin tracking individual completion milestones.",
        }
      }

      const readyCount = level4Learners.filter((l) => l.progress >= 75).length
      const laggingCount = level4Learners.filter((l) => l.progress < 25).length

      return {
        tag: readyCount > 0 ? "Readiness Tracking" : "Cohort In-Progress",
        diagnosis: `Tracking ${level4Learners.length} student(s) in ${selectedCertification?.title}. ${readyCount} learner(s) have reached mock-exam threshold (>=75% progress), while ${laggingCount} student(s) remain below 25%.`,
        recommendation: "Prioritize 1-on-1 tutoring sessions for students below 25% progress to prevent cohort attrition.",
      }
    }

    return {
      tag: "Analytics Current",
      diagnosis: "All departmental and curriculum metrics are synchronized with current institutional records.",
      recommendation: "Continue regular performance monitoring.",
    }
  }, [
    currentLevel,
    level1Data,
    totalLevel1Enrolled,
    totalLevel1Slots,
    overallLevel1ReachPct,
    level1SummaryStats,
    level2Data,
    totalLevel2Slots,
    level2SummaryStats,
    selectedDepartment,
    level3Data,
    level4Learners,
    avgLearnerProgress,
    selectedCertification,
  ])

  // -------------------------------------------------------------------------
  // Handlers for Drill-Down
  // -------------------------------------------------------------------------
  const handleSelectDepartment = (dept) => {
    setSelectedDepartment(dept)
    setHoveredDept(null)
    setHoveredStatDept(null)
    setHoveredStatMetric(null)
    setCurrentLevel(2)
  }

  const handleSelectCertification = (cert) => {
    setSelectedCertification(cert)
    setHoveredCert(null)
    setHoveredStatCert(null)
    setHoveredStatMetric(null)
    setCurrentLevel(3)
  }

  const handleGoBack = () => {
    if (currentLevel === 4) setCurrentLevel(3)
    else if (currentLevel === 3) setCurrentLevel(2)
    else if (currentLevel === 2) {
      setSelectedDepartment(null)
      setHoveredDept(null)
      setHoveredStatDept(null)
      setHoveredStatMetric(null)
      setCurrentLevel(1)
    }
  }

  const handleReset = () => {
    setSelectedDepartment(null)
    setSelectedCertification(null)
    setHoveredDept(null)
    setHoveredCert(null)
    setHoveredStatDept(null)
    setHoveredStatCert(null)
    setHoveredStatMetric(null)
    setCurrentLevel(1)
  }

  return (
    <div className="flex h-full min-h-[320px] w-full flex-col justify-between">
      {/* ----------------- Header & Breadcrumbs ----------------- */}
      <div className="space-y-2 border-b border-border/60 pb-2.5 mb-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
              <Building2 className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h3 className="text-[10px] font-bold uppercase leading-tight tracking-wider text-emerald-700 dark:text-emerald-400">
                {currentLevel === 1 && "Department Analytics"}
                {currentLevel === 2 && "Department Certifications"}
                {currentLevel === 3 && "Department Capacity & Utilization"}
                {currentLevel === 4 && "Learner Progress & Roster"}
              </h3>
              <p className="truncate text-xs font-extrabold leading-snug text-foreground sm:text-sm">
                {currentLevel === 1 && "Department Enrollment & Slots"}
                {currentLevel === 2 &&
                  `${selectedDepartment?.name || "Department"} Certifications`}
                {currentLevel === 3 &&
                  `${selectedCertification?.title || "Certification"} — Capacity & Allocation`}
                {currentLevel === 4 &&
                  `${selectedCertification?.title || "Certification"} — Individual Learners`}
              </p>
              <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground">
                {currentLevel === 1 && "Interactive departmental drill-down & slot distribution"}
                {currentLevel === 2 && "Click any certification to inspect slots & uptake"}
                {currentLevel === 3 && "Seat allocation anatomy, cohort progress distribution & telemetry"}
                {currentLevel === 4 && "Detailed progress and milestone tracking for cohort enrollees"}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {currentLevel > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGoBack}
                  className="h-7 px-2 text-xs font-medium hover:bg-muted cursor-pointer"
                  title="Go back one step"
                >
                  <ArrowLeft className="mr-1 size-3.5" /> Back
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-7 px-2 text-xs text-muted-foreground hover:bg-muted cursor-pointer"
                  title="Reset to Departments"
                >
                  <RotateCcw className="size-3" />
                </Button>
              </>
            )}
            <Badge
              variant="secondary"
              className="border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-bold"
            >
              L{currentLevel}/4
            </Badge>
          </div>
        </div>

        {/* Breadcrumb Trail */}
        <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground pt-1 border-t border-border/40">
          <button
            type="button"
            onClick={handleReset}
            className={`transition hover:text-foreground cursor-pointer ${
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
                className={`max-w-[120px] truncate transition hover:text-foreground cursor-pointer ${
                  currentLevel === 2
                    ? "font-bold text-foreground"
                    : "underline-offset-2 hover:underline"
                }`}
                title={selectedDepartment.name}
              >
                {getDepartmentAbbreviation(selectedDepartment.name) || selectedDepartment.name}
              </button>
            </>
          )}

          {currentLevel >= 3 && selectedCertification && (
            <>
              <ChevronRight className="size-3 shrink-0 text-muted-foreground/60" />
              {currentLevel === 3 ? (
                <span
                  className="font-bold text-foreground max-w-[160px] truncate"
                  title={selectedCertification.title}
                >
                  {selectedCertification.title}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentLevel(3)}
                  className="max-w-[160px] truncate transition hover:text-foreground cursor-pointer underline-offset-2 hover:underline"
                  title={selectedCertification.title}
                >
                  {selectedCertification.title}
                </button>
              )}
            </>
          )}

          {currentLevel === 4 && (
            <>
              <ChevronRight className="size-3 shrink-0 text-muted-foreground/60" />
              <span className="font-bold text-foreground">
                Learners
              </span>
            </>
          )}
        </div>
      </div>

      {/* ----------------- Body Content Per Level ----------------- */}
      <div className="relative min-h-0 flex-1 overflow-hidden py-2">
        {failed ? (
          <div className="flex h-full flex-col items-center justify-center p-4 text-center">
            <p className="text-xs text-muted-foreground">
              Could not load department statistics.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait" custom={direction}>
            {currentLevel === 1 ? (
              /* ========================================================= */
              /* LEVEL 1: Dual-Ring Concentric Pie (Slots + Enrolled Reach) */
              /* ========================================================= */
              <motion.div
                key="level-1"
                custom={direction}
                variants={levelVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex h-full flex-col justify-center"
              >
            {level1Data.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Users className="mb-2 size-8 text-muted-foreground/40" />
                <p className="text-xs font-medium text-muted-foreground">
                  No departments or learner slots recorded yet.
                </p>
              </div>
            ) : (
              <div className="grid h-full grid-cols-1 items-center gap-4 sm:grid-cols-12">
                {/* Left Column: Concentric Dual-Ring Chart (sm:col-span-7 preserves original distance) */}
                <div className="relative flex h-[285px] w-full shrink-0 items-center justify-center sm:h-[305px] sm:col-span-7">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={() => null} cursor={false} />

                      {/* Outer Indicator Pie (Only appears if the text on Stats is hovered) */}
                      {level1OuterData.length > 0 && (
                        <Pie
                          data={level1OuterData}
                          dataKey="value"
                          startAngle={90}
                          endAngle={-270}
                          cx="63%"
                          cy="50%"
                          innerRadius="85%"
                          outerRadius="91%"
                          stroke="none"
                          isAnimationActive={false}
                          className="pointer-events-none outline-none"
                        >
                          {level1OuterData.map((entry, idx) => (
                            <Cell
                              key={`outer-l1-${entry.name}-${idx}`}
                              fill={entry.fill}
                              className="pointer-events-none"
                            />
                          ))}
                        </Pie>
                      )}

                      {/* Inner Pie: Total Slots Allotted to Departments (No outline, no outer shadow) */}
                      <Pie
                        data={level1Data}
                        dataKey="value"
                        nameKey="name"
                        startAngle={90}
                        endAngle={-270}
                        cx="63%"
                        cy="50%"
                        innerRadius="54%"
                        outerRadius="80%"
                        paddingAngle={3.5}
                        stroke="none"
                        strokeWidth={0}
                        className="cursor-pointer outline-none"
                        onClick={(entry) => handleSelectDepartment(entry)}
                        onMouseEnter={(entry) => handleDeptMouseEnter(entry)}
                        onMouseLeave={handleDeptMouseLeave}
                      >
                        {level1Data.map((entry) => {
                          const isHovered = hoveredDept
                            ? hoveredDept.id === entry.id
                            : true
                          const sliceOpacity = hoveredStatMetric
                            ? 1
                            : hoveredDept && !isHovered
                            ? 0.55
                            : 1
                          return (
                            <Cell
                              key={entry.name}
                              fill={entry.fill}
                              opacity={sliceOpacity}
                              className="transition-all duration-200 hover:opacity-90"
                            />
                          )
                        })}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Donut Center: Inner Shadow Circular Plate Filling Inner Space */}
                  <div
                    className="pointer-events-none absolute flex flex-col items-center justify-center px-1 text-center"
                    style={{
                      left: "63%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <div className="relative flex size-[154px] sm:size-[165px] flex-col items-center justify-center rounded-full bg-card shadow-[inset_0_4px_12px_rgba(0,0,0,0.14),inset_0_1px_3px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_4px_14px_rgba(0,0,0,0.6),inset_0_1px_4px_rgba(0,0,0,0.4)]">
                      <div className="relative z-10 flex flex-col items-center justify-center px-1">
                        <span className="font-rb-display text-3xl sm:text-4xl font-black leading-none tabular-nums tracking-tight text-foreground">
                          {hoveredStatMetric === "enrollees"
                            ? `${overallLevel1ReachPct}%`
                            : hoveredStatMetric === "certified"
                            ? `${level1SummaryStats.certifiedPct}%`
                            : hoveredStatMetric === "inProgress"
                            ? `${level1SummaryStats.inProgressPct}%`
                            : hoveredStatMetric === "score"
                            ? level1SummaryStats.avgScore
                            : `${activeLevel1ReachPct}%`}
                        </span>
                        <span className="mt-1 max-w-[85px] sm:max-w-[95px] truncate text-[9px] sm:text-[10px] font-extrabold uppercase leading-tight tracking-wider text-muted-foreground">
                          {hoveredStatMetric === "enrollees"
                            ? "Avg Enrollees"
                            : hoveredStatMetric === "certified"
                            ? "Avg Certified"
                            : hoveredStatMetric === "inProgress"
                            ? "Avg In-Progress"
                            : hoveredStatMetric === "score"
                            ? "Avg Score"
                            : hoveredDept
                            ? (getDepartmentAbbreviation(hoveredDept.name) || hoveredDept.name)
                            : "Slots filled"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fixed Details Card (Positioned to the left of the donut circle with zero overlap) */}
                  <div
                    className={`absolute top-1 sm:top-2 left-1 sm:left-1.5 z-20 hidden sm:block transition-all duration-300 ease-in-out ${
                      isLevel1PanelVisible
                        ? "opacity-100 scale-100 pointer-events-auto"
                        : "opacity-0 scale-95 pointer-events-none"
                    }`}
                  >
                    <DepartmentDetailsFixedCard
                      item={displayLevel1Item}
                      onClick={() => handleSelectDepartment(displayLevel1Item)}
                      onMouseEnter={() => setIsCardHovered(true)}
                      onMouseLeave={() => setIsCardHovered(false)}
                    />
                  </div>
                </div>

                {/* Mobile View for Details Card */}
                <div
                  className={`block sm:hidden transition-all duration-500 ease-in-out overflow-hidden w-full flex justify-center ${
                    isLevel1PanelVisible
                      ? "max-h-[220px] opacity-100 my-2"
                      : "max-h-0 opacity-0 my-0 pointer-events-none"
                  }`}
                >
                  <DepartmentDetailsFixedCard
                    item={displayLevel1Item}
                    onClick={() => handleSelectDepartment(displayLevel1Item)}
                    onMouseEnter={() => setIsCardHovered(true)}
                    onMouseLeave={() => setIsCardHovered(false)}
                  />
                </div>

                {/* Right Column: Stats Layout */}
                <div className="flex flex-col justify-center pl-1 sm:col-span-5">
                  <h4 className="font-rb-display text-base font-bold text-foreground">
                    Stats
                  </h4>
                  <p className="mb-2 mt-0.5 text-xs font-semibold text-muted-foreground">
                    Enrolled per Department
                  </p>

                  {/* Departments List: 5 rows x 2 cols (No scrollbar) */}
                  <div className="grid grid-flow-col grid-rows-5 gap-x-2 gap-y-1 w-[220px] sm:w-[230px]">
                    {level1Data.map((item) => {
                      const isHovered = hoveredDept?.id === item.id
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => handleSelectDepartment(item)}
                          onMouseEnter={() => handleDeptMouseEnter(item)}
                          onMouseLeave={handleDeptMouseLeave}
                          title={`${item.name} — ${item.enrolled} enrolled / ${item.allottedSlots} slots (${item.reachPct}% reach)`}
                          className={`group flex w-[105px] sm:w-[110px] items-center gap-1.5 rounded px-1.5 py-0.5 text-left text-xs transition cursor-pointer min-w-0 ${
                            isHovered
                              ? "bg-primary/10 font-bold text-primary"
                              : "text-foreground hover:bg-muted/50 hover:text-primary"
                          }`}
                        >
                          <span
                            className={`w-4 shrink-0 text-left tabular-nums transition-colors ${
                              isHovered
                                ? "font-black text-primary"
                                : "font-black text-foreground group-hover:text-primary"
                            }`}
                          >
                            {item.enrolled}
                          </span>
                          {/* Reference Infographic Open-Ring Marker */}
                          <span
                            className="size-2.5 shrink-0 rounded-full border-2 bg-transparent transition-transform group-hover:scale-125"
                            style={{ borderColor: item.fill }}
                          />
                          <span
                            className={`truncate transition-colors ${
                              isHovered
                                ? "font-bold text-primary"
                                : "font-semibold text-foreground/90 group-hover:text-primary"
                            }`}
                          >
                            {getDepartmentAbbreviation(item.name)}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Divider */}
                  <div className="my-2 w-[220px] sm:w-[230px] border-t border-border/50" />

                  {/* Averages Section (Interactive Metric Hover) */}
                  <div className="space-y-1 text-xs">
                    <button
                      type="button"
                      onMouseEnter={() => setHoveredStatMetric("enrollees")}
                      onMouseLeave={() => setHoveredStatMetric(null)}
                      className={`flex w-[160px] items-center gap-2 rounded px-2 py-1 text-left transition cursor-pointer ${
                        hoveredStatMetric === "enrollees"
                          ? "bg-[#5c6b73]/15 font-bold text-[#3d484e] dark:text-[#8ea0ab]"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <span
                        className={`w-6 shrink-0 text-left tabular-nums ${
                          hoveredStatMetric === "enrollees"
                            ? "font-black text-[#3d484e] dark:text-[#8ea0ab]"
                            : "font-black text-foreground"
                        }`}
                      >
                        {level1SummaryStats.avgEnrollees}
                      </span>
                      <span>Avg Enrollees</span>
                    </button>
                    <button
                      type="button"
                      onMouseEnter={() => setHoveredStatMetric("certified")}
                      onMouseLeave={() => setHoveredStatMetric(null)}
                      className={`flex w-[160px] items-center gap-2 rounded px-2 py-1 text-left transition cursor-pointer ${
                        hoveredStatMetric === "certified"
                          ? "bg-[#2f6b4f]/15 font-bold text-[#2f6b4f] dark:text-[#52a37b]"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <span
                        className={`w-6 shrink-0 text-left tabular-nums ${
                          hoveredStatMetric === "certified"
                            ? "font-black text-[#2f6b4f] dark:text-[#52a37b]"
                            : "font-black text-foreground"
                        }`}
                      >
                        {level1SummaryStats.avgCertified}
                      </span>
                      <span>Avg Certified</span>
                    </button>
                    <button
                      type="button"
                      onMouseEnter={() => setHoveredStatMetric("inProgress")}
                      onMouseLeave={() => setHoveredStatMetric(null)}
                      className={`flex w-[160px] items-center gap-2 rounded px-2 py-1 text-left transition cursor-pointer ${
                        hoveredStatMetric === "inProgress"
                          ? "bg-[#c9962b]/15 font-bold text-[#b0801e] dark:text-[#e0ab3b]"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <span
                        className={`w-6 shrink-0 text-left tabular-nums ${
                          hoveredStatMetric === "inProgress"
                            ? "font-black text-[#b0801e] dark:text-[#e0ab3b]"
                            : "font-black text-foreground"
                        }`}
                      >
                        {level1SummaryStats.avgInProgress}
                      </span>
                      <span>Avg In-Progress</span>
                    </button>
                    <button
                      type="button"
                      onMouseEnter={() => setHoveredStatMetric("score")}
                      onMouseLeave={() => setHoveredStatMetric(null)}
                      className={`flex w-[160px] items-center gap-2 rounded px-2 py-1 text-left transition cursor-pointer ${
                        hoveredStatMetric === "score"
                          ? "bg-[#8b5f7d]/15 font-bold text-[#7a4f6d] dark:text-[#ba89ab]"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <span
                        className={`w-6 shrink-0 text-left tabular-nums ${
                          hoveredStatMetric === "score"
                            ? "font-black text-[#7a4f6d] dark:text-[#ba89ab]"
                            : "font-black text-foreground"
                        }`}
                      >
                        {level1SummaryStats.avgScore}
                      </span>
                      <span>Avg Score</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
              </motion.div>
            ) : currentLevel === 2 ? (
              /* ========================================================= */
              /* LEVEL 2: Department Certifications Dual-Ring Chart        */
              /* ========================================================= */
              <motion.div
                key="level-2"
                custom={direction}
                variants={levelVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex h-full flex-col justify-center"
              >
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
              <div className="grid h-full grid-cols-1 items-center gap-4 sm:grid-cols-12">
                {/* Left Column: Concentric Dual-Ring Chart (sm:col-span-7 preserves original distance) */}
                <div className="relative flex h-[285px] w-full shrink-0 items-center justify-center sm:h-[305px] sm:col-span-7">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={() => null} cursor={false} />

                      {/* Outer Indicator Pie (Only appears if the text on Stats is hovered) */}
                      {level2OuterData.length > 0 && (
                        <Pie
                          data={level2OuterData}
                          dataKey="value"
                          startAngle={90}
                          endAngle={-270}
                          cx="63%"
                          cy="50%"
                          innerRadius="85%"
                          outerRadius="91%"
                          stroke="none"
                          isAnimationActive={false}
                          className="pointer-events-none outline-none"
                        >
                          {level2OuterData.map((entry, idx) => (
                            <Cell
                              key={`outer-l2-${entry.name}-${idx}`}
                              fill={entry.fill}
                              className="pointer-events-none"
                            />
                          ))}
                        </Pie>
                      )}

                      {/* Inner Pie: Allotted Slots per Certification (No outline, no outer shadow) */}
                      <Pie
                        data={level2Data}
                        dataKey="value"
                        nameKey="name"
                        startAngle={90}
                        endAngle={-270}
                        cx="63%"
                        cy="50%"
                        innerRadius="54%"
                        outerRadius="80%"
                        paddingAngle={3.5}
                        stroke="none"
                        strokeWidth={0}
                        className="cursor-pointer outline-none"
                        onClick={(entry) => handleSelectCertification(entry)}
                        onMouseEnter={(entry) => handleCertMouseEnter(entry)}
                        onMouseLeave={handleCertMouseLeave}
                      >
                        {level2Data.map((entry) => {
                          const isHovered = hoveredCert
                            ? (hoveredCert.institutionCertId ||
                                hoveredCert.certificationId) ===
                              (entry.institutionCertId || entry.certificationId)
                            : true
                          const sliceOpacity = hoveredStatMetric
                            ? 1
                            : hoveredCert && !isHovered
                            ? 0.55
                            : 1
                          return (
                            <Cell
                              key={entry.name}
                              fill={entry.fill}
                              opacity={sliceOpacity}
                              className="transition-all duration-200 hover:opacity-90"
                            />
                          )
                        })}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Donut Center: Inner Shadow Circular Plate Filling Inner Space */}
                  <div
                    className="pointer-events-none absolute flex flex-col items-center justify-center px-1 text-center"
                    style={{
                      left: "63%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <div className="relative flex size-[154px] sm:size-[165px] flex-col items-center justify-center rounded-full bg-card shadow-[inset_0_4px_12px_rgba(0,0,0,0.14),inset_0_1px_3px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_4px_14px_rgba(0,0,0,0.6),inset_0_1px_4px_rgba(0,0,0,0.4)]">
                      <div className="relative z-10 flex flex-col items-center justify-center px-1">
                        <span className="font-rb-display text-3xl sm:text-4xl font-black leading-none tabular-nums tracking-tight text-foreground">
                          {hoveredStatMetric === "enrollees"
                            ? `${overallLevel2ReachPct}%`
                            : hoveredStatMetric === "certified"
                            ? `${level2SummaryStats.certifiedPct}%`
                            : hoveredStatMetric === "inProgress"
                            ? `${level2SummaryStats.inProgressPct}%`
                            : hoveredStatMetric === "progress" || hoveredStatMetric === "score"
                            ? level2SummaryStats.avgProgress
                            : `${activeLevel2ReachPct}%`}
                        </span>
                        <span className="mt-1 max-w-[85px] sm:max-w-[95px] truncate text-[9px] sm:text-[10px] font-extrabold uppercase leading-tight tracking-wider text-muted-foreground">
                          {hoveredStatMetric === "enrollees"
                            ? "Avg Enrollees"
                            : hoveredStatMetric === "certified"
                            ? "Avg Certified"
                            : hoveredStatMetric === "inProgress"
                            ? "Avg In-Progress"
                            : hoveredStatMetric === "progress" || hoveredStatMetric === "score"
                            ? "Avg Progress"
                            : hoveredCert
                            ? hoveredCert.name
                            : "Slots filled"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fixed Details Card (Positioned to the left of the donut circle with zero overlap) */}
                  <div
                    className={`absolute top-1 sm:top-2 left-1 sm:left-1.5 z-20 hidden sm:block transition-all duration-300 ease-in-out ${
                      isLevel2PanelVisible
                        ? "opacity-100 scale-100 pointer-events-auto"
                        : "opacity-0 scale-95 pointer-events-none"
                    }`}
                  >
                    <DepartmentDetailsFixedCard
                      item={displayLevel2Item}
                      onClick={() => handleSelectCertification(displayLevel2Item)}
                      onMouseEnter={() => setIsCardHovered(true)}
                      onMouseLeave={() => setIsCardHovered(false)}
                    />
                  </div>
                </div>

                {/* Mobile View for Details Card */}
                <div
                  className={`block sm:hidden transition-all duration-500 ease-in-out overflow-hidden w-full flex justify-center ${
                    isLevel2PanelVisible
                      ? "max-h-[220px] opacity-100 my-2"
                      : "max-h-0 opacity-0 my-0 pointer-events-none"
                  }`}
                >
                  <DepartmentDetailsFixedCard
                    item={displayLevel2Item}
                    onClick={() => handleSelectCertification(displayLevel2Item)}
                    onMouseEnter={() => setIsCardHovered(true)}
                    onMouseLeave={() => setIsCardHovered(false)}
                  />
                </div>

                {/* Right Column: Certifications Layout */}
                <div className="flex flex-col justify-center pl-1 sm:col-span-5">
                  <h4 className="font-rb-display text-base font-bold text-foreground">
                    Stats
                  </h4>
                  <p className="mb-2 mt-0.5 truncate text-xs font-semibold text-muted-foreground">
                    Enrolled per Certification
                  </p>

                  {/* Certifications List (Number on Left, Name on Right) */}
                  <div className="max-h-[130px] space-y-1 overflow-y-auto pr-1">
                    {level2Data.map((item) => {
                      const isHovered =
                        (hoveredCert?.institutionCertId ||
                          hoveredCert?.certificationId) ===
                        (item.institutionCertId || item.certificationId)
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => handleSelectCertification(item)}
                          onMouseEnter={() => handleCertMouseEnter(item)}
                          onMouseLeave={handleCertMouseLeave}
                          title={`${item.name} — ${item.enrolled} enrolled / ${item.allottedSlots} slots (${item.reachPct}% reach)`}
                          className={`group flex w-[220px] sm:w-[240px] items-center gap-2 rounded px-2 py-1 text-left text-xs transition cursor-pointer ${
                            isHovered
                              ? "bg-primary/10 font-bold text-primary"
                              : "text-foreground hover:bg-muted/50 hover:text-primary"
                          }`}
                        >
                          <span
                            className={`w-6 shrink-0 text-left tabular-nums transition-colors ${
                              isHovered
                                ? "font-black text-primary"
                                : "font-black text-foreground group-hover:text-primary"
                            }`}
                          >
                            {item.enrolled}
                          </span>
                          {/* Reference Infographic Open-Ring Marker */}
                          <span
                            className="size-2.5 shrink-0 rounded-full border-2 bg-transparent transition-transform group-hover:scale-125"
                            style={{ borderColor: item.fill }}
                          />
                          <span
                            className={`whitespace-nowrap truncate transition-colors ${
                              isHovered
                                ? "font-bold text-primary"
                                : "font-semibold text-foreground/90 group-hover:text-primary"
                            }`}
                          >
                            {item.name}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Divider */}
                  <div className="my-2 w-[220px] sm:w-[240px] border-t border-border/50" />

                  {/* Dept Averages (Interactive Metric Hover) */}
                  <div className="space-y-1 text-xs">
                    <button
                      type="button"
                      onMouseEnter={() => setHoveredStatMetric("enrollees")}
                      onMouseLeave={() => setHoveredStatMetric(null)}
                      className={`flex w-[160px] items-center gap-2 rounded px-2 py-1 text-left transition cursor-pointer ${
                        hoveredStatMetric === "enrollees"
                          ? "bg-[#5c6b73]/15 font-bold text-[#3d484e] dark:text-[#8ea0ab]"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <span
                        className={`w-6 shrink-0 text-left tabular-nums ${
                          hoveredStatMetric === "enrollees"
                            ? "font-black text-[#3d484e] dark:text-[#8ea0ab]"
                            : "font-black text-foreground"
                        }`}
                      >
                        {level2SummaryStats.avgEnrollees}
                      </span>
                      <span>Avg Enrollees</span>
                    </button>
                    <button
                      type="button"
                      onMouseEnter={() => setHoveredStatMetric("certified")}
                      onMouseLeave={() => setHoveredStatMetric(null)}
                      className={`flex w-[160px] items-center gap-2 rounded px-2 py-1 text-left transition cursor-pointer ${
                        hoveredStatMetric === "certified"
                          ? "bg-[#2f6b4f]/15 font-bold text-[#2f6b4f] dark:text-[#52a37b]"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <span
                        className={`w-6 shrink-0 text-left tabular-nums ${
                          hoveredStatMetric === "certified"
                            ? "font-black text-[#2f6b4f] dark:text-[#52a37b]"
                            : "font-black text-foreground"
                        }`}
                      >
                        {level2SummaryStats.avgCertified ?? level2SummaryStats.certified}
                      </span>
                      <span>Avg Certified</span>
                    </button>
                    <button
                      type="button"
                      onMouseEnter={() => setHoveredStatMetric("inProgress")}
                      onMouseLeave={() => setHoveredStatMetric(null)}
                      className={`flex w-[160px] items-center gap-2 rounded px-2 py-1 text-left transition cursor-pointer ${
                        hoveredStatMetric === "inProgress"
                          ? "bg-[#c9962b]/15 font-bold text-[#b0801e] dark:text-[#e0ab3b]"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <span
                        className={`w-6 shrink-0 text-left tabular-nums ${
                          hoveredStatMetric === "inProgress"
                            ? "font-black text-[#b0801e] dark:text-[#e0ab3b]"
                            : "font-black text-foreground"
                        }`}
                      >
                        {level2SummaryStats.avgInProgress ?? level2SummaryStats.inProgress}
                      </span>
                      <span>Avg In-Progress</span>
                    </button>
                    <button
                      type="button"
                      onMouseEnter={() => setHoveredStatMetric("progress")}
                      onMouseLeave={() => setHoveredStatMetric(null)}
                      className={`flex w-[160px] items-center gap-2 rounded px-2 py-1 text-left transition cursor-pointer ${
                        hoveredStatMetric === "progress" || hoveredStatMetric === "score"
                          ? "bg-[#8b5f7d]/15 font-bold text-[#7a4f6d] dark:text-[#ba89ab]"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <span
                        className={`w-6 shrink-0 text-left tabular-nums ${
                          hoveredStatMetric === "progress" || hoveredStatMetric === "score"
                            ? "font-black text-[#7a4f6d] dark:text-[#ba89ab]"
                            : "font-black text-foreground"
                        }`}
                      >
                        {level2SummaryStats.avgProgress}
                      </span>
                      <span>Avg Progress</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
              </motion.div>
            ) : currentLevel === 3 ? (
              /* ========================================================= */
              /* LEVEL 3: Capacity & Utilization Analytics Command Center   */
              /* ========================================================= */
              (() => {
                const total = level3Data?.totalSlots || 0
                const enrolled = level3Data?.enrolledInDept || 0
                const completedCount = level3Data?.completed || 0
                const inProgressCount = level3Data?.inProgress || 0
                const notStartedCount = level3Data?.notStarted || 0
                const unclaimedCount = level3Data?.remainingSlots || 0

                const completedPct = total > 0 ? (completedCount / total) * 100 : 0
                const inProgressPct = total > 0 ? (inProgressCount / total) * 100 : 0
                const notStartedPct = total > 0 ? (notStartedCount / total) * 100 : 0
                const unclaimedPct = total > 0 ? (unclaimedCount / total) * 100 : 0

                return (
                  <motion.div
                    key="level-3"
                    custom={direction}
                    variants={levelVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="flex h-full flex-col justify-between space-y-3"
                  >
                {/* Overview Stats Row (Analytical Telemetry with 3D Object Image Backgrounds) */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                  {/* Total Seat Pool (Auditorium seat object on right, warm amber gradient waves) */}
                  <div
                    className="relative overflow-hidden rounded-xl border border-amber-500/35 bg-cover bg-right p-2.5 sm:p-3 shadow-xs transition-transform hover:scale-[1.02]"
                    style={{ backgroundImage: "url('/images/cards/seat-pool-card-bg.jpg')" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent pointer-events-none" />
                    <div className="relative z-10 flex h-full flex-col justify-between max-w-[62%] min-w-0 text-white">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-200 drop-shadow-xs">
                        Total Seat Pool
                      </div>
                      <div className="text-xl sm:text-2xl font-black tabular-nums text-white leading-none my-0.5 drop-shadow-sm font-rb-display">
                        {total}
                      </div>
                      <div className="text-[9px] font-medium text-white/90 truncate drop-shadow-xs">
                        Institutional quota
                      </div>
                    </div>
                  </div>

                  {/* Department Enrolled (Student character on right, emerald green gradient waves) */}
                  <div
                    className="relative overflow-hidden rounded-xl border border-emerald-500/35 bg-cover bg-right p-2.5 sm:p-3 shadow-xs transition-transform hover:scale-[1.02]"
                    style={{ backgroundImage: "url('/images/cards/dept-enrolled-card-bg.jpg')" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent pointer-events-none" />
                    <div className="relative z-10 flex h-full flex-col justify-between max-w-[62%] min-w-0 text-white">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 drop-shadow-xs">
                        Dept Enrolled
                      </div>
                      <div className="text-xl sm:text-2xl font-black tabular-nums text-white leading-none my-0.5 drop-shadow-sm font-rb-display">
                        {enrolled}
                      </div>
                      <div className="text-[9px] font-medium text-white/90 truncate drop-shadow-xs">
                        {level3Data?.percentFilled ?? 0}% capacity claimed
                      </div>
                    </div>
                  </div>

                  {/* Unclaimed Pool Remaining (Vacant seat & golden pass on right, royal blue gradient waves) */}
                  <div
                    className="relative overflow-hidden rounded-xl border border-blue-500/35 bg-cover bg-right p-2.5 sm:p-3 shadow-xs transition-transform hover:scale-[1.02]"
                    style={{ backgroundImage: "url('/images/cards/unclaimed-seats-card-bg.jpg')" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent pointer-events-none" />
                    <div className="relative z-10 flex h-full flex-col justify-between max-w-[62%] min-w-0 text-white">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200 drop-shadow-xs">
                        Unclaimed Seats
                      </div>
                      <div className="text-xl sm:text-2xl font-black tabular-nums text-white leading-none my-0.5 drop-shadow-sm font-rb-display">
                        {unclaimedCount}
                      </div>
                      <div className="text-[9px] font-medium text-white/90 truncate drop-shadow-xs">
                        {Math.max(100 - (level3Data?.percentFilled ?? 0), 0)}% available
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visual Capacity & Cohort Readiness Panel */}
                <div className="rounded-2xl border border-border/80 bg-card/90 p-3.5 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-extrabold text-foreground">
                        Capacity Utilization & Cohort Readiness
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-emerald-600/30 bg-emerald-500/10 text-emerald-800 px-2 py-0.5 text-[10px] font-bold dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      {level3Data?.percentFilled ?? 0}% Allocated
                    </Badge>
                  </div>

                  {/* Segmented Capacity Stacked Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                      <span>Seat Allocation Anatomy</span>
                      <span className="font-bold text-foreground">
                        {enrolled} / {total} Seats
                      </span>
                    </div>

                    <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800 p-0.5 ring-1 ring-border/50">
                      {completedPct > 0 && (
                        <div
                          style={{ width: `${completedPct}%` }}
                          className="h-full first:rounded-l-full last:rounded-r-full bg-[#3caea3] transition-all duration-500"
                          title={`Completed: ${completedCount} learner(s)`}
                        />
                      )}
                      {inProgressPct > 0 && (
                        <div
                          style={{ width: `${inProgressPct}%` }}
                          className="h-full first:rounded-l-full last:rounded-r-full bg-[#f5a623] transition-all duration-500"
                          title={`In Progress: ${inProgressCount} learner(s)`}
                        />
                      )}
                      {notStartedPct > 0 && (
                        <div
                          style={{ width: `${notStartedPct}%` }}
                          className="h-full first:rounded-l-full last:rounded-r-full bg-[#eb6b56] transition-all duration-500"
                          title={`Not Started: ${notStartedCount} learner(s)`}
                        />
                      )}
                      {unclaimedPct > 0 && (
                        <div
                          style={{ width: `${unclaimedPct}%` }}
                          className="h-full first:rounded-l-full last:rounded-r-full bg-muted/50 transition-all duration-500"
                          title={`Unclaimed: ${unclaimedCount} slot(s)`}
                        />
                      )}
                    </div>
                  </div>

                  {/* Legend & Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-border/50 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 shrink-0 rounded-full bg-[#3caea3]" />
                      <span className="text-muted-foreground">Completed:</span>
                      <strong className="font-bold text-foreground tabular-nums">{completedCount}</strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 shrink-0 rounded-full bg-[#f5a623]" />
                      <span className="text-muted-foreground">In Progress:</span>
                      <strong className="font-bold text-foreground tabular-nums">{inProgressCount}</strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 shrink-0 rounded-full bg-[#eb6b56]" />
                      <span className="text-muted-foreground">Not Started:</span>
                      <strong className="font-bold text-foreground tabular-nums">{notStartedCount}</strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 shrink-0 rounded-full bg-muted-foreground/30" />
                      <span className="text-muted-foreground">Unclaimed:</span>
                      <strong className="font-bold text-foreground tabular-nums">{unclaimedCount}</strong>
                    </div>
                  </div>

                  {/* Cohort Performance Telemetry Strip */}
                  <div className="flex items-center justify-between rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[11px] font-medium text-muted-foreground">Cohort Avg Progress:</span>
                      <span className="font-black text-foreground tabular-nums">{avgLearnerProgress}%</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-muted-foreground">Readiness:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {completedCount} of {enrolled} Ready
                      </span>
                    </div>
                  </div>
                </div>

                {/* Single Dedicated Primary Action Button */}
                <Button
                  type="button"
                  onClick={() => setCurrentLevel(4)}
                  className="w-full h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 group transition cursor-pointer"
                >
                  <Users className="size-4" />
                  <span>Inspect Learner Roster & Detailed Progress ({enrolled} Learners)</span>
                  <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </Button>
                  </motion.div>
                )
              })()
            ) : (
              /* ========================================================= */
              /* LEVEL 4: Learner Progress Breakdown                       */
              /* ========================================================= */
              <motion.div
                key="level-4"
                custom={direction}
                variants={levelVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex h-full flex-col justify-between space-y-2.5"
              >
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

              {/* Cohort Average Progress Bar */}
              <div className="relative mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted/80 ring-1 ring-border/50">
                <div
                  style={{
                    width: `${Math.min(Math.max(avgLearnerProgress, 0), 100)}%`,
                    backgroundColor: getProgressTierColor(avgLearnerProgress),
                  }}
                  className="h-full rounded-full transition-all duration-500 shadow-xs"
                />
                {/* Milestone quadrant divider guides at 25%, 50%, 75% */}
                <div className="absolute inset-y-0 left-1/4 w-[1px] bg-background/70 pointer-events-none" />
                <div className="absolute inset-y-0 left-2/4 w-[1px] bg-background/70 pointer-events-none" />
                <div className="absolute inset-y-0 left-3/4 w-[1px] bg-background/70 pointer-events-none" />
              </div>

              {/* Distribution Legend */}
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1.5 text-[10px] text-muted-foreground">
                {progressBuckets.map((b) => (
                  <span
                    key={b.label}
                    className={`flex items-center gap-1.5 rounded-md px-1.5 py-0.5 font-medium transition ${
                      b.count > 0
                        ? "bg-card border border-border/80 text-foreground font-semibold shadow-2xs"
                        : "opacity-60"
                    }`}
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: b.color }}
                    />
                    <span>{b.label}:</span>
                    <strong className="font-bold tabular-nums text-foreground">{b.count}</strong>
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
                        <div className="relative h-1.5 w-20 overflow-hidden rounded-full bg-muted/80 ring-1 ring-border/40">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(Math.max(learner.progress, 0), 100)}%`,
                              backgroundColor: getProgressTierColor(learner.progress),
                            }}
                          />
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
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ----------------- Remarks Box (Executive Diagnostic Intelligence) ----------------- */}
      {currentLevel !== 4 && (
        <div className="mt-1.5 rounded-lg border border-amber-500/35 bg-amber-500/[0.08] px-3 py-1.5 text-[11px] shadow-xs dark:border-amber-500/30 dark:bg-amber-950/30">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-md bg-amber-500/20 text-amber-800 dark:bg-amber-400/25 dark:text-amber-300">
              <Sparkles className="size-2.5" />
            </span>
            <div className="min-w-0 flex-1 leading-snug">
              <div className="flex items-center gap-1.5 pb-0.5">
                <span className="font-bold uppercase tracking-wider text-[9px] text-amber-800 dark:text-amber-300">
                  Diagnostic Analysis
                </span>
              </div>
              <p className="text-foreground/90 text-[11px] leading-snug">
                {remarksData.diagnosis}
              </p>
              {remarksData.recommendation && (
                <p className="mt-0.5 text-[10px] text-amber-900/90 dark:text-amber-200/90 leading-snug">
                  <strong className="font-bold text-amber-950 dark:text-amber-100">Recommendation: </strong>
                  {remarksData.recommendation}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
