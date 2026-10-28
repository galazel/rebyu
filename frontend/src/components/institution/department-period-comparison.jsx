import React, { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Sparkles,
  CheckCheck,
  Award,
  UsersRoundIcon,
  ArrowRight,
  AlertCircle,
} from "@/components/icons"
import { BentoTile } from "@/components/commons/bento.jsx"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  getInstitutionLearningStats,
  getDepartmentStats,
} from "@/services/institutionLearningStatsService.js"
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts"
import { useChartTheme } from "@/components/charts/rebyu-charts.jsx"

/**
 * Format a Date object to YYYY-MM-DD
 */
export function formatIsoDate(date) {
  if (!date) return undefined
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return undefined
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Formats a Date object to a human-friendly string (e.g. "Oct 12, 2026")
 */
function formatHumanDate(date) {
  if (!date) return "—"
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/**
 * Computes both the current period and comparison period window
 * based on the date range and comparison mode ("previous_period" vs "prior_year").
 */
export function computeComparisonRange(range, comparisonType = "previous_period") {
  const mode = range?.mode ?? "yearly"
  const now = new Date()

  const currentFrom = range?.from instanceof Date
    ? range.from
    : range?.from
      ? new Date(range.from)
      : new Date(now.getFullYear(), 0, 1)

  const currentTo = range?.to instanceof Date
    ? range.to
    : range?.to
      ? new Date(range.to)
      : new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)

  let prevFrom
  let prevTo
  let baselineLabel = "Previous period"

  if (comparisonType === "prior_year") {
    prevFrom = new Date(currentFrom)
    prevFrom.setFullYear(prevFrom.getFullYear() - 1)
    prevTo = new Date(currentTo)
    prevTo.setFullYear(prevTo.getFullYear() - 1)
    baselineLabel = "Same period last year"
  } else {
    if (mode === "daily") {
      prevFrom = new Date(currentFrom)
      prevFrom.setDate(prevFrom.getDate() - 1)
      prevTo = new Date(currentTo)
      prevTo.setDate(prevTo.getDate() - 1)
      baselineLabel = "Previous day"
    } else if (mode === "weekly") {
      prevFrom = new Date(currentFrom)
      prevFrom.setDate(prevFrom.getDate() - 7)
      prevTo = new Date(currentTo)
      prevTo.setDate(prevTo.getDate() - 7)
      baselineLabel = "Previous week"
    } else if (mode === "monthly") {
      prevFrom = new Date(currentFrom.getFullYear(), currentFrom.getMonth() - 1, 1)
      prevTo = new Date(currentFrom.getFullYear(), currentFrom.getMonth(), 0, 23, 59, 59, 999)
      baselineLabel = "Previous month"
    } else if (mode === "yearly") {
      prevFrom = new Date(currentFrom.getFullYear() - 1, 0, 1)
      prevTo = new Date(currentFrom.getFullYear() - 1, 11, 31, 23, 59, 59, 999)
      baselineLabel = "Previous year"
    } else {
      const diffMs = currentTo.getTime() - currentFrom.getTime()
      prevTo = new Date(currentFrom.getTime() - 1)
      prevFrom = new Date(prevTo.getTime() - diffMs)
      baselineLabel = "Previous period"
    }
  }

  return {
    current: {
      from: currentFrom,
      to: currentTo,
      fromStr: formatIsoDate(currentFrom),
      toStr: formatIsoDate(currentTo),
      formatted: `${formatHumanDate(currentFrom)} – ${formatHumanDate(currentTo)}`,
    },
    previous: {
      from: prevFrom,
      to: prevTo,
      fromStr: formatIsoDate(prevFrom),
      toStr: formatIsoDate(prevTo),
      formatted: `${formatHumanDate(prevFrom)} – ${formatHumanDate(prevTo)}`,
      baselineLabel,
    },
    mode,
    comparisonType,
  }
}

/**
 * Period delta pill badge
 */
export function PeriodDeltaBadge({
  delta,
  unit = "",
  favorable = true,
  size = "sm",
  showZero = true,
  className = "",
}) {
  if (delta == null || Number.isNaN(delta)) return null
  const num = Number(delta)
  if (num === 0 && !showZero) return null

  const isPositive = num > 0
  const isNegative = num < 0
  const isNeutral = num === 0

  const isGood = favorable ? isPositive : isNegative
  const isBad = favorable ? isNegative : isPositive

  let colorClasses = "bg-muted text-muted-foreground border-border/60"
  let IconComponent = Minus

  if (!isNeutral) {
    if (isGood) {
      colorClasses = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
      IconComponent = TrendingUp
    } else if (isBad) {
      colorClasses = "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30"
      IconComponent = TrendingDown
    }
  }

  const sign = isPositive ? "+" : ""
  const displayVal = Number.isInteger(num) ? num : num.toFixed(1)
  const sizeClasses = size === "xs" ? "text-[10px] px-1.5 py-0.5 gap-1" : "text-xs px-2 py-0.5 gap-1.5"

  return (
    <span
      className={`inline-flex items-center font-bold border rounded-md shrink-0 tabular-nums select-none ${sizeClasses} ${colorClasses} ${className}`}
    >
      <IconComponent className="size-3 shrink-0" aria-hidden="true" />
      <span>{sign}{displayVal}{unit}</span>
    </span>
  )
}

/**
 * Hook to manage period-over-period comparison queries and metric delta derivations.
 */
export function usePeriodComparison({
  range,
  enabled = true,
  comparisonType = "previous_period",
  currentStats = null,
}) {
  const comparisonRange = useMemo(
    () => computeComparisonRange(range, comparisonType),
    [range, comparisonType]
  )

  const { current, previous } = comparisonRange

  const prevStatsQuery = useQuery({
    queryKey: ["department-head-learning-stats-prev", previous.fromStr, previous.toStr],
    queryFn: () => getInstitutionLearningStats({ from: previous.fromStr, to: previous.toStr }),
    enabled: enabled && Boolean(previous.fromStr && previous.toStr),
    staleTime: 60_000,
    retry: 1,
  })

  const prevGroupStatsQuery = useQuery({
    queryKey: ["department-head-group-stats-prev", previous.toStr],
    queryFn: () => getDepartmentStats({ to: previous.toStr }),
    enabled: enabled && Boolean(previous.toStr),
    staleTime: 60_000,
    retry: 1,
  })

  const prevData = prevStatsQuery.data
  const currData = currentStats

  // Metric Deltas Calculation
  const deltas = useMemo(() => {
    const currSummary = currData?.summary ?? {}
    const prevSummary = prevData?.summary ?? {}

    const computeDelta = (currVal, prevVal, isPercent = false) => {
      const c = currVal != null ? Number(currVal) : null
      const p = prevVal != null ? Number(prevVal) : null
      if (c == null && p == null) {
        return { current: 0, previous: 0, delta: 0, formattedDelta: "—", hasData: false }
      }
      const safeC = c ?? 0
      const safeP = p ?? 0
      const diff = safeC - safeP
      const sign = diff > 0 ? "+" : ""
      const formattedDiff = isPercent
        ? `${sign}${diff.toFixed(1)}%`
        : `${sign}${Number.isInteger(diff) ? diff : diff.toFixed(1)}`

      return {
        current: safeC,
        previous: safeP,
        delta: diff,
        formattedDelta: formattedDiff,
        hasData: c != null || p != null,
      }
    }

    return {
      averageProgress: computeDelta(currSummary.averageProgress, prevSummary.averageProgress, true),
      passRate: computeDelta(currSummary.passRate, prevSummary.passRate, true),
      averageScore: computeDelta(currSummary.averageScore, prevSummary.averageScore, true),
      gradedAttempts: computeDelta(currSummary.gradedAttempts, prevSummary.gradedAttempts, false),
      lessonsCompleted: computeDelta(currSummary.lessonsCompleted, prevSummary.lessonsCompleted, false),
      activeMembers: computeDelta(currSummary.activeMembers, prevSummary.activeMembers, false),
    }
  }, [currData, prevData])

  // Certification breakdown comparison
  const certificationsComparison = useMemo(() => {
    const currCerts = Array.isArray(currData?.certifications) ? currData.certifications : []
    const prevCerts = Array.isArray(prevData?.certifications) ? prevData.certifications : []

    const prevMap = new Map(prevCerts.map((c) => [c.certificationId, c]))
    const allCertIds = new Set([
      ...currCerts.map((c) => c.certificationId),
      ...prevCerts.map((c) => c.certificationId),
    ])

    return Array.from(allCertIds).map((certId) => {
      const current = currCerts.find((c) => c.certificationId === certId)
      const prev = prevMap.get(certId)
      const title = current?.title || prev?.title || `Certification #${certId}`

      const currentEnrolled = Number(current?.enrolled ?? 0)
      const prevEnrolled = Number(prev?.enrolled ?? 0)

      const currentPassRate = Number(current?.passRate ?? 0)
      const prevPassRate = Number(prev?.passRate ?? 0)
      const deltaPassRate = currentPassRate - prevPassRate

      const currentAvgScore = Number(current?.averageScore ?? 0)
      const prevAvgScore = Number(prev?.averageScore ?? 0)
      const deltaAvgScore = currentAvgScore - prevAvgScore

      const currentAttempts = Number(current?.gradedAttempts ?? 0)
      const prevAttempts = Number(prev?.gradedAttempts ?? 0)
      const deltaAttempts = currentAttempts - prevAttempts

      const currentProgress = Number(current?.averageProgress ?? 0)
      const prevProgress = Number(prev?.averageProgress ?? 0)
      const deltaProgress = currentProgress - prevProgress

      return {
        certificationId: certId,
        title,
        currentEnrolled,
        prevEnrolled,
        currentPassRate,
        prevPassRate,
        deltaPassRate,
        currentAvgScore,
        prevAvgScore,
        deltaAvgScore,
        currentAttempts,
        prevAttempts,
        deltaAttempts,
        currentProgress,
        prevProgress,
        deltaProgress,
      }
    })
  }, [currData, prevData])

  // Learner velocity & momentum
  const learnerMomentum = useMemo(() => {
    const currMembers = Array.isArray(currData?.members) ? currData.members : []
    const prevMembers = Array.isArray(prevData?.members) ? prevData.members : []

    const prevMap = new Map(prevMembers.map((m) => [m.learnerId, m]))

    const movements = currMembers.map((curr) => {
      const prev = prevMap.get(curr.learnerId)
      const currProgress = Number(curr.averageProgress ?? 0)
      const prevProgress = Number(prev?.averageProgress ?? 0)
      const deltaProgress = currProgress - prevProgress

      const currScore = Number(curr.averageScore ?? 0)
      const prevScore = Number(prev?.averageScore ?? 0)
      const deltaScore = currScore - prevScore

      const currAttempts = Number(curr.gradedAttempts ?? 0)
      const prevAttempts = Number(prev?.gradedAttempts ?? 0)
      const deltaAttempts = currAttempts - prevAttempts

      return {
        learnerId: curr.learnerId,
        username: curr.username || `Learner #${curr.learnerId}`,
        name: curr.name || curr.username,
        deltaProgress,
        deltaScore,
        deltaAttempts,
        currAttempts,
        prevAttempts,
        currProgress,
        prevProgress,
      }
    })

    const topGainers = [...movements]
      .filter((m) => m.deltaProgress > 0 || m.deltaScore > 0 || m.currAttempts > 0)
      .sort((a, b) => b.deltaProgress - a.deltaProgress)
      .slice(0, 5)

    const stalled = [...movements]
      .filter((m) => (m.prevAttempts > 0 && m.currAttempts === 0) || (m.deltaProgress === 0 && m.currAttempts === 0))
      .slice(0, 5)

    return {
      topGainers,
      stalled,
    }
  }, [currData, prevData])

  // Synthesized executive insights bullets
  const insights = useMemo(() => {
    const list = []
    if (!prevData) return list

    // 1. Pass Rate
    if (deltas.passRate.delta > 0) {
      list.push({
        type: "positive",
        title: "Pass Rate Improved",
        text: `Department cohort pass rate increased by ${deltas.passRate.formattedDelta} to ${deltas.passRate.current}% (was ${deltas.passRate.previous}% in baseline window).`,
      })
    } else if (deltas.passRate.delta < 0) {
      list.push({
        type: "warning",
        title: "Pass Rate Decreased",
        text: `Department pass rate softened by ${deltas.passRate.formattedDelta} (currently ${deltas.passRate.current}% vs ${deltas.passRate.previous}% previously). Review hard topics.`,
      })
    } else {
      list.push({
        type: "neutral",
        title: "Pass Rate Steady",
        text: `Department pass rate held constant at ${deltas.passRate.current}% across both observation periods.`,
      })
    }

    // 2. Graded Attempts & Engagement Volume
    if (deltas.gradedAttempts.delta > 0) {
      list.push({
        type: "positive",
        title: "Assessment Activity Surged",
        text: `Learners completed ${deltas.gradedAttempts.current} graded attempts, up ${deltas.gradedAttempts.formattedDelta} attempts compared to the baseline period.`,
      })
    } else if (deltas.gradedAttempts.delta < 0) {
      list.push({
        type: "warning",
        title: "Assessment Activity Dropped",
        text: `Attempt volume decreased by ${Math.abs(deltas.gradedAttempts.delta)} attempts (${deltas.gradedAttempts.current} attempts this period vs ${deltas.gradedAttempts.previous} in baseline).`,
      })
    }

    // 3. Score Movement
    if (deltas.averageScore.delta !== 0) {
      const verb = deltas.averageScore.delta > 0 ? "rose by" : "dipped by"
      list.push({
        type: deltas.averageScore.delta > 0 ? "positive" : "warning",
        title: "Score Trajectory",
        text: `Average assessment score ${verb} ${Math.abs(deltas.averageScore.delta)}% (currently ${deltas.averageScore.current}% vs ${deltas.averageScore.previous}%).`,
      })
    }

    // 4. Certification Champion
    if (certificationsComparison.length > 0) {
      const bestCert = [...certificationsComparison].sort((a, b) => b.deltaPassRate - a.deltaPassRate)[0]
      if (bestCert && bestCert.deltaPassRate > 0) {
        list.push({
          type: "positive",
          title: "Leading Programme Gain",
          text: `"${bestCert.title}" registered the largest rise in learners certified, a +${bestCert.deltaPassRate.toFixed(1)}% gain over baseline.`,
        })
      }
    }

    return list
  }, [deltas, prevData, certificationsComparison])

  return {
    comparisonRange,
    prevStatsQuery,
    prevGroupStatsQuery,
    deltas,
    certificationsComparison,
    learnerMomentum,
    insights,
    isLoading: prevStatsQuery.isLoading,
    isError: prevStatsQuery.isError,
  }
}

/**
 * Period comparison tile for the Department Head Bento Dashboard
 */
export function PeriodComparisonTile({
  comparisonRange,
  deltas,
  certificationsComparison = [],
  learnerMomentum = { topGainers: [], stalled: [] },
  insights = [],
  comparisonType,
  onComparisonTypeChange,
  isLoading = false,
  isError = false,
}) {
  const [activeTab, setActiveTab] = useState("scorecard")
  const theme = useChartTheme()

  // Chart data for visual trajectory
  const trajectoryData = useMemo(() => {
    return [
      {
        metric: "Avg Progress",
        current: Math.round(deltas.averageProgress.current),
        baseline: Math.round(deltas.averageProgress.previous),
      },
      {
        metric: "Pass Rate",
        current: Math.round(deltas.passRate.current),
        baseline: Math.round(deltas.passRate.previous),
      },
      {
        metric: "Avg Score",
        current: Math.round(deltas.averageScore.current),
        baseline: Math.round(deltas.averageScore.previous),
      },
    ]
  }, [deltas])

  return (
    <BentoTile col={6} row={3} className="!p-0" id="dept-period-comparison">
      <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <History className="size-4" aria-hidden="true" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Cohort Analytics
                </span>
                <Badge
                  variant="outline"
                  className="h-4 px-1.5 text-[9px] font-extrabold uppercase tracking-widest border-primary/30 text-primary bg-primary/5"
                >
                  Live Comparison
                </Badge>
              </div>
              <h2 className="text-sm font-extrabold text-foreground sm:text-base leading-tight">
                Period-over-Period Performance Comparison
              </h2>
            </div>
          </div>

          {/* Mode Switcher & Date Tags */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg border border-border/80 bg-muted/40 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => onComparisonTypeChange?.("previous_period")}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  comparisonType === "previous_period"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sequential ({comparisonRange.previous.baselineLabel})
              </button>
              <button
                type="button"
                onClick={() => onComparisonTypeChange?.("prior_year")}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  comparisonType === "prior_year"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Year-over-Year (YoY)
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-md border border-border/50">
              <span className="font-bold text-foreground">Current:</span>
              <span className="tabular-nums">{comparisonRange.current.formatted}</span>
              <ArrowRight className="size-3 text-muted-foreground/60" aria-hidden="true" />
              <span className="font-bold text-foreground">Baseline:</span>
              <span className="tabular-nums">{comparisonRange.previous.formatted}</span>
            </div>
          </div>
        </div>

        {/* 6 Metric Comparison Cards */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-lg border border-border/70 bg-card p-3 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
              <span>Avg Completion</span>
              <PeriodDeltaBadge delta={deltas.averageProgress.delta} unit="%" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5 font-rb-display text-xl font-extrabold tabular-nums text-foreground">
              {Math.round(deltas.averageProgress.current)}%
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground tabular-nums">
              Baseline: <strong className="text-foreground">{Math.round(deltas.averageProgress.previous)}%</strong>
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-card p-3 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
              <span>Pass Rate</span>
              <PeriodDeltaBadge delta={deltas.passRate.delta} unit="%" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5 font-rb-display text-xl font-extrabold tabular-nums text-foreground">
              {Math.round(deltas.passRate.current)}%
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground tabular-nums">
              Baseline: <strong className="text-foreground">{Math.round(deltas.passRate.previous)}%</strong>
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-card p-3 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
              <span>Average Score</span>
              <PeriodDeltaBadge delta={deltas.averageScore.delta} unit="%" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5 font-rb-display text-xl font-extrabold tabular-nums text-foreground">
              {Math.round(deltas.averageScore.current)}%
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground tabular-nums">
              Baseline: <strong className="text-foreground">{Math.round(deltas.averageScore.previous)}%</strong>
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-card p-3 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
              <span>Graded Attempts</span>
              <PeriodDeltaBadge delta={deltas.gradedAttempts.delta} />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5 font-rb-display text-xl font-extrabold tabular-nums text-foreground">
              {deltas.gradedAttempts.current.toLocaleString()}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground tabular-nums">
              Baseline: <strong className="text-foreground">{deltas.gradedAttempts.previous.toLocaleString()}</strong>
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-card p-3 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
              <span>Lessons Done</span>
              <PeriodDeltaBadge delta={deltas.lessonsCompleted.delta} />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5 font-rb-display text-xl font-extrabold tabular-nums text-foreground">
              {deltas.lessonsCompleted.current.toLocaleString()}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground tabular-nums">
              Baseline: <strong className="text-foreground">{deltas.lessonsCompleted.previous.toLocaleString()}</strong>
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-card p-3 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
              <span>Active Students</span>
              <PeriodDeltaBadge delta={deltas.activeMembers.delta} />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5 font-rb-display text-xl font-extrabold tabular-nums text-foreground">
              {deltas.activeMembers.current.toLocaleString()}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground tabular-nums">
              Baseline: <strong className="text-foreground">{deltas.activeMembers.previous.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 border-b border-border/40 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("scorecard")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
              activeTab === "scorecard"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            <Award className="size-3.5" aria-hidden="true" />
            <span>Programme Scorecard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("trajectory")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
              activeTab === "trajectory"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            <BarChart3 className="size-3.5" aria-hidden="true" />
            <span>Visual Trajectory</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("momentum")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
              activeTab === "momentum"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            <UsersRoundIcon className="size-3.5" aria-hidden="true" />
            <span>Learner Momentum</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("insights")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
              activeTab === "insights"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            <span>Executive Insights</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="min-h-0 flex-1">
          {/* TAB 1: Programme Scorecard */}
          {activeTab === "scorecard" && (
            <div className="overflow-x-auto">
              {certificationsComparison.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No certification data available for this comparison period.
                </div>
              ) : (
                <table className="w-full text-xs" style={{ minWidth: 620 }}>
                  <thead>
                    <tr className="border-b border-border/40 text-[11px] font-bold text-muted-foreground">
                      <th className="py-2 text-left">Programme</th>
                      <th className="py-2 text-center">Certified (Current / Baseline)</th>
                      <th className="py-2 text-center">Delta</th>
                      <th className="py-2 text-center">Avg Score</th>
                      <th className="py-2 text-center">Attempts</th>
                      <th className="py-2 text-right pr-2">Trajectory</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificationsComparison.map((row) => (
                      <tr
                        key={row.certificationId}
                        className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-2.5 font-bold text-foreground">
                          {row.title}
                        </td>
                        <td className="py-2.5 text-center tabular-nums">
                          <strong className="text-foreground">{Math.round(row.currentPassRate)}%</strong>
                          <span className="text-muted-foreground/60 mx-1">/</span>
                          <span className="text-muted-foreground">{Math.round(row.prevPassRate)}%</span>
                        </td>
                        <td className="py-2.5 text-center">
                          <PeriodDeltaBadge delta={row.deltaPassRate} unit="%" size="xs" />
                        </td>
                        <td className="py-2.5 text-center tabular-nums">
                          <span className="font-semibold text-foreground">{Math.round(row.currentAvgScore)}%</span>
                          <span className="text-muted-foreground text-[10px] ml-1">
                            ({row.deltaAvgScore >= 0 ? `+${row.deltaAvgScore}` : row.deltaAvgScore}%)
                          </span>
                        </td>
                        <td className="py-2.5 text-center tabular-nums">
                          <strong className="text-foreground">{row.currentAttempts}</strong>
                          <span className="text-muted-foreground text-[10px] ml-1">
                            (was {row.prevAttempts})
                          </span>
                        </td>
                        <td className="py-2.5 text-right pr-2 font-semibold">
                          {row.deltaPassRate > 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Gaining</span>
                          ) : row.deltaPassRate < 0 ? (
                            <span className="text-rose-600 dark:text-rose-400 font-bold">Declining</span>
                          ) : (
                            <span className="text-muted-foreground font-medium">Unchanged</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 2: Visual Trajectory Chart */}
          {activeTab === "trajectory" && (
            <div className="py-2">
              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={trajectoryData}
                    margin={{ top: 12, right: 16, bottom: 0, left: -20 }}
                    barGap={6}
                  >
                    <CartesianGrid stroke={theme.grid} strokeWidth={1} vertical={false} />
                    <XAxis
                      dataKey="metric"
                      stroke={theme.ink.secondary}
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      unit="%"
                      stroke={theme.ink.secondary}
                      fontSize={11}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(val, name) => [`${val}%`, name === "current" ? "Current Period" : "Baseline Period"]}
                      contentStyle={{
                        backgroundColor: theme.surface,
                        borderColor: theme.grid,
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend
                      formatter={(value) => (value === "current" ? "Current Period" : "Baseline Period")}
                      wrapperStyle={{ fontSize: 11, fontWeight: 700 }}
                    />
                    <Bar
                      dataKey="current"
                      fill={theme.series[0]}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={48}
                    />
                    <Bar
                      dataKey="baseline"
                      fill={theme.other}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 3: Learner Momentum */}
          {activeTab === "momentum" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-1">
              {/* Top Gainers */}
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <TrendingUp className="size-3.5" aria-hidden="true" />
                    Top Progress Movers
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground">Highest gain this window</span>
                </div>
                {learnerMomentum.topGainers.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3 text-center">
                    No active student movement recorded in this period.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {learnerMomentum.topGainers.map((learner) => (
                      <div
                        key={learner.learnerId}
                        className="flex items-center justify-between rounded-md bg-background/80 px-2.5 py-1.5 text-xs border border-border/40"
                      >
                        <span className="font-semibold text-foreground truncate max-w-[150px]">
                          {learner.name}
                        </span>
                        <div className="flex items-center gap-2 tabular-nums">
                          <span className="text-muted-foreground text-[11px]">
                            {learner.currAttempts} attempt{learner.currAttempts === 1 ? "" : "s"}
                          </span>
                          <PeriodDeltaBadge delta={learner.deltaProgress} unit="%" size="xs" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stalled Learners */}
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                    <AlertCircle className="size-3.5" aria-hidden="true" />
                    Stalled / Reduced Velocity
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground">Active prior, dormant now</span>
                </div>
                {learnerMomentum.stalled.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3 text-center">
                    No stalled learners identified between these periods.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {learnerMomentum.stalled.map((learner) => (
                      <div
                        key={learner.learnerId}
                        className="flex items-center justify-between rounded-md bg-background/80 px-2.5 py-1.5 text-xs border border-border/40"
                      >
                        <span className="font-semibold text-foreground truncate max-w-[150px]">
                          {learner.name}
                        </span>
                        <div className="flex items-center gap-2 tabular-nums text-[11px]">
                          <span className="text-muted-foreground">
                            was {learner.prevAttempts} attempts
                          </span>
                          <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-700 dark:text-amber-400">
                            0 attempts
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Executive Insights */}
          {activeTab === "insights" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-1">
              {insights.length === 0 ? (
                <div className="col-span-2 py-6 text-center text-xs text-muted-foreground">
                  Insights will appear once learning activity is recorded across two periods.
                </div>
              ) : (
                insights.map((item, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg p-3 border text-xs space-y-1 ${
                      item.type === "positive"
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : item.type === "warning"
                          ? "bg-amber-500/5 border-amber-500/20"
                          : "bg-muted/30 border-border/60"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      {item.type === "positive" ? (
                        <CheckCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                      ) : item.type === "warning" ? (
                        <AlertCircle className="size-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                      ) : (
                        <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
                      )}
                      <span className="text-foreground">{item.title}</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed pl-5">
                      {item.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </BentoTile>
  )
}
