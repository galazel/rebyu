import { useEffect, useMemo, useRef, useState } from "react"
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
import { useIsMobile } from "@/hooks/use-mobile"

// Earth Tone Palette for Departments & Certifications (sophisticated, warm & grounded)
const EARTH_TONE_PALETTE = [
  "#2f6b4f", // Deep Forest / Moss Green
  "#c8553d", // Warm Terracotta / Burnt Clay
  "#c9962b", // Harvest Gold / Warm Ochre
  "#8b5f7d", // Dusty Plum / Earth Heather
  "#4a7c59", // Sage / Fern Green
  "#b06d3b", // Warm Sienna / Caramel
  "#5c6b73", // River Slate / Stone
  "#bc4749", // Rust Red / Muted Crimson
  "#606c38", // Olive Earth
  "#b08968", // Warm Sandstone / Taupe
]

const DEPARTMENT_PALETTE = EARTH_TONE_PALETTE
const SLOTS_PALETTE = EARTH_TONE_PALETTE
const REACH_COLOR = "#2f6b4f" // Forest Green base for reach arc

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

function DepartmentDetailsFixedCard({ item, onClick, onMouseEnter, onMouseLeave }) {
  if (!item) return null

  const title = (item.deptName || item.certTitle || item.name || "")
    .replace(/\s+/g, " ")
    .trim()

  const sliceFill = item.fill || item.deptFill || item.certFill || "#2f6b4f"

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="group flex w-[165px] sm:w-[172px] flex-col rounded-2xl border border-border/70 bg-card/95 p-3 text-left shadow-xs backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md cursor-pointer"
    >
      <div className="flex w-full items-center gap-2 border-b border-border/50 pb-2">
        <span
          className="size-2.5 shrink-0 rounded-full ring-1 ring-background"
          style={{ backgroundColor: sliceFill }}
        />
        <span
          className="truncate text-xs font-bold text-foreground transition-colors group-hover:text-primary"
          title={title}
        >
          {title}
        </span>
      </div>
      <div className="mt-2 w-full space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-2 text-muted-foreground">
          <span>Allotted Slots:</span>
          <span className="font-bold tabular-nums text-foreground">
            {item.allottedSlots ?? item.value ?? 0}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 text-muted-foreground">
          <span>Enrolled:</span>
          <span className="font-bold tabular-nums text-foreground">
            {item.enrolled ?? 0}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 text-muted-foreground">
          <span>Capacity Reach:</span>
          <span
            className="font-extrabold tabular-nums"
            style={{ color: sliceFill }}
          >
            {item.reachPct ?? 0}%
          </span>
        </div>
      </div>
      <div className="mt-2.5 flex w-full items-center justify-between border-t border-border/50 pt-1.5 text-[10px] font-medium text-muted-foreground/80 transition-colors group-hover:text-primary">
        <span>Click to drill down</span>
        <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
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
  // Summary Stats for Level 2 (Original Certifications & Dept Averages)
  // -------------------------------------------------------------------------
  const level2SummaryStats = useMemo(() => {
    if (!level2Data.length) {
      return {
        avgEnrollees: 0,
        certified: 0,
        certifiedPct: 0,
        inProgress: 0,
        inProgressPct: 0,
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

    const certifiedPct =
      totalLevel2Slots > 0
        ? Math.min(Math.round((certified / totalLevel2Slots) * 100), 100)
        : 0
    const inProgressPct =
      totalLevel2Slots > 0
        ? Math.min(Math.round((inProgress / totalLevel2Slots) * 100), 100)
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
      certified,
      certifiedPct,
      inProgress,
      inProgressPct,
      avgProgress: `${avgProgressVal}%`,
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
                          cx="50%"
                          cy="50%"
                          innerRadius="88%"
                          outerRadius="94%"
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

                      {/* Inner Pie: Total Slots Allotted to Departments */}
                      <Pie
                        data={level1Data}
                        dataKey="value"
                        nameKey="name"
                        startAngle={90}
                        endAngle={-270}
                        cx="50%"
                        cy="50%"
                        innerRadius="58%"
                        outerRadius="84%"
                        stroke={chartTheme.surface}
                        strokeWidth={2}
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

                  {/* Donut Center: Percentage & Slots filled / Metric */}
                  <div
                    className="pointer-events-none absolute flex flex-col items-center justify-center px-1 text-center"
                    style={{
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <span className="font-rb-display text-4xl font-black leading-none tabular-nums tracking-tight text-foreground sm:text-5xl">
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
                    <span className="mt-1.5 max-w-[120px] truncate text-[10px] font-extrabold uppercase leading-tight tracking-wider text-muted-foreground sm:text-[11px]">
                      {hoveredStatMetric === "enrollees"
                        ? "Avg Enrollees"
                        : hoveredStatMetric === "certified"
                        ? "Avg Certified"
                        : hoveredStatMetric === "inProgress"
                        ? "Avg In-Progress"
                        : hoveredStatMetric === "score"
                        ? "Avg Score"
                        : hoveredDept
                        ? hoveredDept.name
                        : "Slots filled"}
                    </span>
                  </div>

                  {/* Fixed Details Card (Moved completely to the right of the donut circle with zero overlap) */}
                  <div
                    className={`absolute top-1 sm:top-2 z-20 hidden sm:block transition-all duration-500 ease-in-out ${
                      isLevel1PanelVisible
                        ? "opacity-100 scale-100 pointer-events-auto"
                        : "opacity-0 scale-95 pointer-events-none"
                    }`}
                    style={{ left: "calc(50% + 134px)" }}
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

                {/* Right Column: Stats Layout (Resting at original distance; slides with an appropriate, balanced gap on hover) */}
                <div
                  className={`flex flex-col justify-center pl-1 sm:col-span-5 transition-transform duration-500 ease-in-out ${
                    isLevel1PanelVisible
                      ? "sm:translate-x-16 lg:translate-x-20"
                      : "sm:translate-x-0"
                  }`}
                >
                  <h4 className="font-rb-display text-base font-bold text-foreground">
                    Stats
                  </h4>
                  <p className="mb-2 mt-0.5 text-xs font-semibold text-muted-foreground">
                    Enrolled per Department
                  </p>

                  {/* Departments List (Number on Left, Name on Right) */}
                  <div className="max-h-[130px] space-y-1 overflow-y-auto pr-1">
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
                          className={`group flex w-[160px] items-center gap-2 rounded px-2 py-1 text-left text-xs transition cursor-pointer ${
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
                          <span
                            className="size-2 shrink-0 rounded-full ring-1 ring-background"
                            style={{ backgroundColor: item.fill }}
                          />
                          <span
                            className={`transition-colors ${
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
                  <div className="my-2 w-[160px] border-t border-border/50" />

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
                          cx="50%"
                          cy="50%"
                          innerRadius="88%"
                          outerRadius="94%"
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

                      {/* Inner Pie: Allotted Slots per Certification */}
                      <Pie
                        data={level2Data}
                        dataKey="value"
                        nameKey="name"
                        startAngle={90}
                        endAngle={-270}
                        cx="50%"
                        cy="50%"
                        innerRadius="58%"
                        outerRadius="84%"
                        stroke={chartTheme.surface}
                        strokeWidth={2}
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

                  {/* Donut Center: Percentage & Slots filled / Metric */}
                  <div
                    className="pointer-events-none absolute flex flex-col items-center justify-center px-1 text-center"
                    style={{
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <span className="font-rb-display text-4xl font-black leading-none tabular-nums tracking-tight text-foreground sm:text-5xl">
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
                    <span className="mt-1.5 max-w-[120px] truncate text-[10px] font-extrabold uppercase leading-tight tracking-wider text-muted-foreground sm:text-[11px]">
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

                  {/* Fixed Details Card (Moved completely to the right of the donut circle with zero overlap) */}
                  <div
                    className={`absolute top-1 sm:top-2 z-20 hidden sm:block transition-all duration-500 ease-in-out ${
                      isLevel2PanelVisible
                        ? "opacity-100 scale-100 pointer-events-auto"
                        : "opacity-0 scale-95 pointer-events-none"
                    }`}
                    style={{ left: "calc(50% + 134px)" }}
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

                {/* Right Column: Stats Layout (Resting at original distance; slides with an appropriate, balanced gap on hover) */}
                <div
                  className={`flex flex-col justify-center pl-1 sm:col-span-5 transition-transform duration-500 ease-in-out ${
                    isLevel2PanelVisible
                      ? "sm:translate-x-16 lg:translate-x-20"
                      : "sm:translate-x-0"
                  }`}
                >
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
                          className={`group flex w-[160px] items-center gap-2 rounded px-2 py-1 text-left text-xs transition cursor-pointer ${
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
                          <span
                            className="size-2 shrink-0 rounded-full ring-1 ring-background"
                            style={{ backgroundColor: item.fill }}
                          />
                          <span
                            className={`transition-colors ${
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
                  <div className="my-2 w-[160px] border-t border-border/50" />

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
                        {level2SummaryStats.certified}
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
                        {level2SummaryStats.inProgress}
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
