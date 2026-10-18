import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUpIcon,
  Clock,
  CreditCard,
  ShieldAlert,
  UsersRoundIcon,
  X,
} from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/components/institution/institution-ui.jsx"

const SEVERITY_RANKS = {
  critical: 3,
  warning: 2,
  info: 1,
}

function daysUntil(value) {
  if (!value) return null
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((date - today) / 86_400_000)
}

/**
 * Derives the active alert items across department seat allocations,
 * access window expiry, at-risk/dormant learners, unpaid invoices, and pending invitations.
 */
export function useDepartmentAlerts({
  allocation = null,
  summary = {},
  overviewGroup = null,
  deptLearners = [],
  flaggedCount = 0,
  invoices = [],
  pendingHeadInvitations = [],
  isOwner = false,
  onOpenCoAuthorities,
  onInspectFlaggedRoster,
  onInspectDormantRoster,
}) {
  return useMemo(() => {
    const alerts = []

    // 1. Access Window / Expiration Alert
    const expiryDate = allocation?.accessExpiryDate ?? allocation?.accessEndDate
    if (expiryDate) {
      const days = daysUntil(expiryDate)
      if (days != null) {
        if (days < 0) {
          alerts.push({
            id: "access-expired",
            kicker: "Access Window",
            title: "Certification Access Expired",
            message: `Cohort access expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago (${formatDate(expiryDate)}). Learners can no longer attempt assessments.`,
            severity: "critical",
            icon: AlertCircle,
            actionLabel: isOwner ? "Renew Allocation" : "Contact Administrator",
            actionHref: isOwner ? "/institution/invoices" : undefined,
          })
        } else if (days <= 30) {
          alerts.push({
            id: "access-expiring-soon",
            kicker: "Access Window",
            title: days === 0 ? "Access Expires Today" : `Access Window Expires in ${days} Day${days === 1 ? "" : "s"}`,
            message: `Department access ends on ${formatDate(expiryDate)}. Plan cohort renewal or export outcomes before access closes.`,
            severity: days <= 7 ? "critical" : "warning",
            icon: Clock,
            actionLabel: isOwner ? "Manage Allocation" : "Notify Administrator",
            actionHref: isOwner ? "/institution/invoices" : undefined,
          })
        }
      }
    }

    // 2. Seat Budget / Capacity Alert
    const totalSlots = Number(summary?.seatsTotal ?? overviewGroup?.totalSlots ?? 0)
    const usedSlots = Number(summary?.seatsUsed ?? overviewGroup?.usedSlots ?? 0)
    if (totalSlots > 0) {
      const remainingSlots = Math.max(0, totalSlots - usedSlots)
      if (remainingSlots === 0) {
        alerts.push({
          id: "seats-exhausted",
          kicker: "Seat Budget",
          title: "All Seats Fully Allocated (0 Remaining)",
          message: `All ${totalSlots} department seats are currently in use. Additional learners cannot be registered until unused seats are reclaimed or more seats purchased.`,
          severity: "critical",
          icon: AlertCircle,
          actionLabel: "Review Roster",
          actionTargetId: "dept-learner-table",
        })
      } else if (remainingSlots <= 3) {
        alerts.push({
          id: "seats-near-limit",
          kicker: "Seat Budget",
          title: `Seat Allocation Nearing Limit (${remainingSlots} Left)`,
          message: `Only ${remainingSlots} of ${totalSlots} seat${totalSlots === 1 ? "" : "s"} remain available (${Math.round((usedSlots / totalSlots) * 100)}% utilization).`,
          severity: "warning",
          icon: AlertTriangle,
          actionLabel: "Review Roster",
          actionTargetId: "dept-learner-table",
        })
      }
    }

    // 3. At-Risk Learners Alert (Progress & Score flags)
    if (flaggedCount > 0) {
      alerts.push({
        id: "learners-at-risk",
        kicker: "Academic Intervention",
        title: `${flaggedCount} Learner${flaggedCount === 1 ? "" : "s"} Flagged for Urgent Support`,
        message: `${flaggedCount} student${flaggedCount === 1 ? "" : "s"} currently lag significantly behind department completion averages, failed recent diagnostic assessments, or require academic advising.`,
        severity: "warning",
        icon: AlertTriangle,
        actionLabel: "Inspect Flagged Roster",
        actionTargetId: "dept-learner-table",
        onClick: onInspectFlaggedRoster,
      })
    }

    // 4. Dormant Learners Alert (No activity in over 14 days)
    const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000
    const now = Date.now()
    const dormantCount = deptLearners.filter((l) => {
      if (!l.lastActivityAt) return true
      const time = new Date(l.lastActivityAt).getTime()
      return !Number.isNaN(time) && now - time > FOURTEEN_DAYS_MS
    }).length

    if (dormantCount > 0) {
      alerts.push({
        id: "learners-dormant",
        kicker: "Engagement Monitor",
        title: `${dormantCount} Dormant Learner${dormantCount === 1 ? "" : "s"} (No Activity in 14+ Days)`,
        message: `${dormantCount} enrolled student${dormantCount === 1 ? "" : "s"} have not accessed study material or attempted lesson quizzes in over 2 weeks.`,
        severity: "info",
        icon: UsersRoundIcon,
        actionLabel: "View Dormant Learners",
        actionTargetId: "dept-learner-table",
        onClick: onInspectDormantRoster,
      })
    }

    // 5. Unpaid Invoices Alert
    const unpaidList = (Array.isArray(invoices) ? invoices : []).filter((inv) => {
      const s = String(inv.status ?? "").toUpperCase()
      return s === "PENDING" || s === "UNPAID" || s === "OVERDUE"
    })
    if (unpaidList.length > 0) {
      const overdueCount = unpaidList.filter(
        (inv) => String(inv.status ?? "").toUpperCase() === "OVERDUE"
      ).length

      alerts.push({
        id: "unpaid-invoices",
        kicker: "Billing & Invoices",
        title: overdueCount > 0
          ? `${overdueCount} Overdue Institution Invoice${overdueCount === 1 ? "" : "s"}`
          : `${unpaidList.length} Unpaid Invoice${unpaidList.length === 1 ? "" : "s"} Pending Payment`,
        message: overdueCount > 0
          ? `Outstanding invoices require immediate settlement to prevent interruption of department access.`
          : `${unpaidList.length} invoice${unpaidList.length === 1 ? "" : "s"} are awaiting payment or checkout verification.`,
        severity: overdueCount > 0 ? "critical" : "warning",
        icon: CreditCard,
        actionLabel: isOwner ? "Review Invoices" : "View Billing Details",
        actionHref: "/institution/invoices",
      })
    }

    // 6. Pending Co-Authority Invitations
    const pendingInvites = Array.isArray(pendingHeadInvitations) ? pendingHeadInvitations : []
    if (pendingInvites.length > 0) {
      alerts.push({
        id: "pending-coauthorities",
        kicker: "Faculty Leadership",
        title: `${pendingInvites.length} Pending Co-Authority Invitation${pendingInvites.length === 1 ? "" : "s"}`,
        message: `${pendingInvites.length} onboarding code${pendingInvites.length === 1 ? "" : "s"} sent to faculty members remain unclaimed.`,
        severity: "info",
        icon: ShieldAlert,
        actionLabel: "Manage Invitations",
        onClick: onOpenCoAuthorities,
      })
    }

    // Sort alerts: critical first, then warning, then info
    return alerts.sort(
      (a, b) => (SEVERITY_RANKS[b.severity] ?? 0) - (SEVERITY_RANKS[a.severity] ?? 0)
    )
  }, [
    allocation,
    summary,
    overviewGroup,
    deptLearners,
    flaggedCount,
    invoices,
    pendingHeadInvitations,
    isOwner,
    onOpenCoAuthorities,
    onInspectFlaggedRoster,
    onInspectDormantRoster,
  ])
}

export function DepartmentAlertStrip({
  alerts = [],
  className = "",
}) {
  const [expanded, setExpanded] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const navigate = useNavigate()

  if (dismissed || !alerts || alerts.length === 0) {
    return null
  }

  const criticalCount = alerts.filter((a) => a.severity === "critical").length
  const warningCount = alerts.filter((a) => a.severity === "warning").length
  const topAlert = alerts[0]

  const handleAction = (alert) => {
    if (alert.onClick) {
      alert.onClick()
      return
    }
    if (alert.actionHref) {
      navigate(alert.actionHref)
      return
    }
    if (alert.actionTargetId) {
      const el = document.getElementById(alert.actionTargetId)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }
  }

  const getSeverityBadgeClass = (severity) => {
    switch (severity) {
      case "critical":
        return "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-bold"
      case "warning":
        return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold"
      case "info":
      default:
        return "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-400 font-semibold"
    }
  }

  const getSeverityCardBorder = (severity) => {
    switch (severity) {
      case "critical":
        return "border-rose-500/40 bg-rose-500/[0.04]"
      case "warning":
        return "border-amber-500/40 bg-amber-500/[0.04]"
      case "info":
      default:
        return "border-sky-500/30 bg-sky-500/[0.03]"
    }
  }

  const getSeverityIconColor = (severity) => {
    switch (severity) {
      case "critical":
        return "text-rose-600 dark:text-rose-400 bg-rose-500/10"
      case "warning":
        return "text-amber-600 dark:text-amber-400 bg-amber-500/10"
      case "info":
      default:
        return "text-sky-600 dark:text-sky-400 bg-sky-500/10"
    }
  }

  return (
    <div
      className={`rounded-xl border border-border/70 bg-card shadow-sm transition-all duration-200 overflow-hidden ${className}`}
      id="dept-alert-strip"
    >
      {/* Summarized Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-muted/20 border-b border-border/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`grid size-7 shrink-0 place-items-center rounded-lg ${
              criticalCount > 0
                ? "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
            }`}
          >
            {criticalCount > 0 ? (
              <AlertCircle className="size-4" aria-hidden="true" />
            ) : (
              <AlertTriangle className="size-4" aria-hidden="true" />
            )}
          </span>

          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <Badge
              variant="outline"
              className={
                criticalCount > 0
                  ? "border-rose-500/40 bg-rose-500/15 text-rose-700 dark:text-rose-400 text-xs font-bold"
                  : "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-bold"
              }
            >
              {alerts.length} Attention Item{alerts.length === 1 ? "" : "s"}
            </Badge>

            {criticalCount > 0 ? (
              <Badge variant="outline" className="text-[11px] border-rose-500/30 text-rose-600 dark:text-rose-400">
                {criticalCount} Critical
              </Badge>
            ) : null}

            {warningCount > 0 ? (
              <Badge variant="outline" className="text-[11px] border-amber-500/30 text-amber-600 dark:text-amber-400">
                {warningCount} Warning{warningCount === 1 ? "" : "s"}
              </Badge>
            ) : null}

            {!expanded && topAlert ? (
              <span className="hidden sm:inline-block truncate text-xs text-muted-foreground font-medium pl-1">
                <strong className="text-foreground font-semibold">{topAlert.kicker}:</strong>{" "}
                {topAlert.title}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {!expanded && topAlert && (topAlert.actionLabel || topAlert.onClick) ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleAction(topAlert)}
              className="h-7 px-2.5 text-xs font-semibold text-primary hover:text-primary"
            >
              {topAlert.actionLabel ?? "View"}
            </Button>
          ) : null}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setExpanded((prev) => !prev)}
            className="h-7 px-2.5 text-xs font-semibold gap-1"
            aria-expanded={expanded}
            aria-controls="dept-alert-strip-details"
          >
            <span>{expanded ? "Collapse" : `Show All (${alerts.length})`}</span>
            {expanded ? (
              <ChevronUpIcon className="size-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="size-3.5" aria-hidden="true" />
            )}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss alert strip"
            className="size-7 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Expanded Multi-Card View */}
      {expanded ? (
        <div id="dept-alert-strip-details" className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-card">
          {alerts.map((alert) => {
            const Icon = alert.icon ?? AlertTriangle
            return (
              <div
                key={alert.id}
                className={`flex flex-col justify-between gap-3 rounded-xl border p-3.5 transition-colors ${getSeverityCardBorder(
                  alert.severity
                )}`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`grid size-6 place-items-center rounded-md ${getSeverityIconColor(alert.severity)}`}>
                        <Icon className="size-3.5" aria-hidden="true" />
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {alert.kicker}
                      </span>
                    </div>
                    <Badge variant="outline" className={`text-[10px] uppercase py-0.5 px-1.5 ${getSeverityBadgeClass(alert.severity)}`}>
                      {alert.severity}
                    </Badge>
                  </div>

                  <p className="text-xs font-bold text-foreground leading-snug">
                    {alert.title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {alert.message}
                  </p>
                </div>

                {alert.actionLabel ? (
                  <div className="pt-1 flex items-center justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(alert)}
                      className="h-7 px-3 text-xs font-semibold"
                    >
                      {alert.actionLabel}
                    </Button>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
