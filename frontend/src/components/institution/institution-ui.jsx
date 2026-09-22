import { InlineLoading } from "@/components/inline-loading.jsx"
import { AlertCircle, Inbox, RefreshCw } from "@/components/icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function InstitutionPageHeader({ title, subtitle, actions }) {
  if (!title && !subtitle && !actions) return null
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0 max-w-3xl">
        {title ? (
          <h1 className="font-rb-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
        ) : null}
        {subtitle ? (
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  )
}

/** Matches LearnerStatCard so a tile reads the same in either portal. */
const STAT_TONES = {
  macaw: "bg-rb-macaw-wash text-rb-macaw-lip",
  feather: "bg-rb-feather-wash text-rb-feather-lip",
  fox: "bg-rb-fox-wash text-rb-fox-lip",
  beetle: "bg-rb-beetle-wash text-rb-beetle-lip",
  bee: "bg-rb-bee-wash text-rb-bee-lip",
}

export function InstitutionStatCard({ icon: Icon, label, value, hint, tone = "macaw" }) {
  return (
    <div className="rounded-rb-card border-2 border-border bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-muted-foreground">{label}</p>
          <p className="mt-3 font-rb-display text-4xl font-extrabold leading-none tabular-nums tracking-tight text-foreground sm:text-5xl">
            {value}
          </p>
        </div>
        {Icon ? (
          <span
            className={`grid size-11 shrink-0 place-items-center rounded-2xl ${
              STAT_TONES[tone] ?? STAT_TONES.macaw
            }`}
          >
            <Icon className="size-5" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      {hint ? (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export function InstitutionLoadingSkeleton({ rows = 4 }) {
  /* Inline, not the full-screen loading board. This is used inside pages that
     are already on screen -- a tab's panel, a section waiting on its data --
     and covering the whole app for that made every tab click look like
     leaving the page. The board stays for the app booting and a route's code
     loading, which is what it is for. */

  return <InlineLoading rows={rows} />
}

export function InstitutionErrorState({ title, description, onRetry }) {
  return (
    /* A pink sticky note pinned in place -- the same object the learner portal
       and the landing page use. */
    <div className="rb-sticky rb-sticky-pink mt-4 text-center">
      <span className="rb-pushpin" aria-hidden="true" />
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white/60 text-rb-cardinal-lip">
        <AlertCircle className="size-6" aria-hidden="true" />
      </span>
      <p className="mt-4 font-rb-display font-extrabold lowercase text-rb-cardinal-lip">
        {title ?? "Unable to load this data"}
      </p>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-rb-eel">
        {description ??
          "The institution data could not be loaded right now. It may require a signed-in institution account."}
      </p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw aria-hidden="true" />
          Try again
        </Button>
      ) : null}
    </div>
  )
}

export function InstitutionEmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="rb-sticky rb-sticky-yellow mx-auto mt-4 min-h-56 w-full max-w-md items-center justify-center text-center">
      <span className="rb-pushpin" aria-hidden="true" />
      <span className="grid size-12 place-items-center rounded-2xl bg-white/60 text-rb-macaw-lip">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <p className="mt-4 font-rb-display text-base font-extrabold lowercase text-foreground">
        {title}
      </p>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

const STATUS_BADGE_VARIANTS = {
  // invitation
  PENDING: "secondary",
  ACCEPTED: "default",
  DECLINED: "destructive",
  EXPIRED: "outline",
  REVOKED: "outline",
  // partnership
  UNDER_REVIEW: "secondary",
  MEETING_SCHEDULED: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  CANCELLED: "outline",
  // invoice / allocation (lowercase enums in backend)
  issued: "secondary",
  payment_submitted: "secondary",
  paid: "default",
  overdue: "destructive",
  cancelled: "outline",
  draft: "outline",
  active: "default",
  expired: "outline",
  pending: "secondary",
  suspended: "destructive",
  // access-window states derived on the client (see accessWindowStatus)
  upcoming: "secondary",
  expiring_soon: "secondary",
  awaiting_payment: "destructive",
}

export function InstitutionStatusBadge({ status }) {
  if (!status) return null
  const variant = STATUS_BADGE_VARIANTS[status] ?? "secondary"
  const label = String(status).replaceAll("_", " ").toLowerCase()
  return (
    <Badge variant={variant} className="capitalize">
      {label}
    </Badge>
  )
}

/** Days from today (local midnight) to a yyyy-mm-dd date; negative when past. */
function daysUntil(value) {
  if (!value) return null
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((date - today) / 86_400_000)
}

/**
 * What an allocation's access window says about it today.
 *
 * The row's stored `status` never flips on its own: an allocation approved
 * for a year still reads "active" the day after it ends. Access is not cut
 * off -- learners keep what they enrolled in -- but the institution should
 * see that the window it asked for has closed. So the label is worked out
 * from the dates here, and only overrides "active"; a suspended or cancelled
 * allocation keeps saying so whatever the calendar says.
 *
 * Returns { status, detail }: status is one of upcoming | active |
 * expiring_soon | expired (or the stored one), detail a short human line.
 */
export function accessWindowStatus(allocation, { soonDays = 30 } = {}) {
  const stored = allocation?.status ?? null
  if (stored === "pending") return { status: "awaiting_payment", detail: "Pay the invoice to activate" }
  if (stored && stored !== "active") return { status: stored, detail: null }

  const toStart = daysUntil(allocation?.accessStartDate)
  const toEnd = daysUntil(allocation?.accessExpiryDate ?? allocation?.accessEndDate)

  if (toStart != null && toStart > 0) {
    return { status: "upcoming", detail: `Starts in ${toStart} day${toStart === 1 ? "" : "s"}` }
  }
  if (toEnd != null && toEnd < 0) {
    const ago = -toEnd
    return { status: "expired", detail: `Ended ${ago} day${ago === 1 ? "" : "s"} ago` }
  }
  if (toEnd != null && toEnd <= soonDays) {
    return {
      status: "expiring_soon",
      detail: toEnd === 0 ? "Ends today" : `Ends in ${toEnd} day${toEnd === 1 ? "" : "s"}`,
    }
  }
  return { status: stored ?? "active", detail: toEnd != null ? `${toEnd} days left` : null }
}

/** The allocation badge, labelled by its access window rather than its stored status. */
export function AccessWindowBadge({ allocation }) {
  return <InstitutionStatusBadge status={accessWindowStatus(allocation).status} />
}

export function formatDate(value) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatDateTime(value) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatMoney(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return "—"
  return amount.toLocaleString(undefined, {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  })
}

export { InstitutionVerifiedBadge } from "./institution-verified-badge.jsx"
