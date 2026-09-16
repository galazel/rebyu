import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { CheckIcon, Clock, Loader2Icon, XCircleIcon } from "@/components/icons"
import {
  InstitutionErrorState,
  InstitutionLoadingSkeleton,
  InstitutionPageHeader,
  formatDateTime,
} from "@/components/institution/institution-ui.jsx"
import { BentoGrid, BentoStat } from "@/components/commons/bento.jsx"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { apiMessage } from "@/services/base"
import {
  approveSubscription,
  getAdminSubscriptions,
  rejectSubscription,
  revokeSubscription,
} from "@/services/subscriptionService.js"

const TABS = [
  { id: "awaiting", label: "Awaiting approval" },
  { id: "active", label: "Active Pro" },
  { id: "all", label: "All" },
]

function money(value, currency = "PHP") {
  if (value == null) return "—"
  return Number(value).toLocaleString("en-PH", { style: "currency", currency, maximumFractionDigits: 0 })
}

function StatusPill({ row }) {
  const [label, tone] = row.awaitingApproval
    ? ["Awaiting approval", "bg-rb-bee-wash text-rb-eel border-rb-bee/50"]
    : row.active
      ? ["Active", "bg-rb-feather-wash text-rb-feather-lip border-rb-feather/40"]
      : row.status === "CANCELED" && row.reviewNote
        ? ["Rejected", "bg-rb-cardinal/10 text-rb-cardinal-lip border-rb-cardinal/40"]
        : [row.status.charAt(0) + row.status.slice(1).toLowerCase(), "bg-rb-polar text-rb-wolf border-rb-swan"]
  return <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${tone}`}>{label}</span>
}

function SubscriptionCard({ row }) {
  const queryClient = useQueryClient()
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState("")

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] })
    queryClient.invalidateQueries({ queryKey: ["admin-platform-metrics"] })
  }
  const approve = useMutation({
    mutationFn: () => approveSubscription(row.learnerSubscriptionId),
    onSuccess: () => {
      toast.success(`${row.learnerName ?? "Learner"} is now on Pro`)
      refresh()
    },
    onError: (error) => toast.error(apiMessage(error, "Could not approve this subscription.")),
  })
  const reject = useMutation({
    mutationFn: () => rejectSubscription(row.learnerSubscriptionId, note),
    onSuccess: () => {
      toast.success("Subscription rejected")
      setRejecting(false)
      refresh()
    },
    onError: (error) => toast.error(apiMessage(error, "Could not reject this subscription.")),
  })
  const revoke = useMutation({
    mutationFn: () => revokeSubscription(row.learnerSubscriptionId),
    onSuccess: () => {
      toast.success("Pro access ended")
      refresh()
    },
    onError: (error) => toast.error(apiMessage(error, "Could not end this subscription.")),
  })
  const busy = approve.isPending || reject.isPending || revoke.isPending

  return (
    <li className="rounded-rb-card border-2 border-rb-swan bg-rb-snow p-4 shadow-[var(--comic-shadow-sm)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-rb-display text-base font-extrabold text-rb-eel">
            {row.learnerName || `Learner #${row.learnerId}`}
          </p>
          <p className="truncate text-sm text-rb-wolf">{row.email ?? "No email"}</p>
        </div>
        <StatusPill row={row} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-rb-hare">Plan</dt>
          <dd className="font-bold text-rb-eel">{row.planName ?? row.planCode}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-rb-hare">Paid (test)</dt>
          <dd className="font-bold tabular-nums text-rb-eel">{money(row.amount, row.currency)}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-rb-hare">Paid at</dt>
          <dd className="text-rb-eel">{row.paidAt ? formatDateTime(row.paidAt) : "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-rb-hare">
            {row.active ? "Pro until" : "Reviewed"}
          </dt>
          <dd className="text-rb-eel">
            {row.active
              ? row.currentPeriodEnd
                ? formatDateTime(row.currentPeriodEnd)
                : "—"
              : row.reviewedAt
                ? formatDateTime(row.reviewedAt)
                : "—"}
          </dd>
        </div>
      </dl>

      {row.checkoutReference ? (
        <p className="mt-2 truncate text-xs text-rb-hare">PayMongo checkout · {row.checkoutReference}</p>
      ) : null}
      {row.reviewNote ? <p className="mt-2 text-sm text-rb-wolf">Note: {row.reviewNote}</p> : null}

      {row.awaitingApproval ? (
        rejecting ? (
          <div className="mt-4 space-y-2">
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Why is this being rejected? The learner sees this note."
              rows={2}
              maxLength={500}
            />
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setRejecting(false)} disabled={busy}>
                Back
              </Button>
              <Button variant="destructive" size="sm" onClick={() => reject.mutate()} disabled={busy}>
                {reject.isPending ? <Loader2Icon className="size-4 animate-spin" /> : "Confirm rejection"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setRejecting(true)} disabled={busy}>
              <XCircleIcon className="size-4" aria-hidden="true" />
              Reject
            </Button>
            <Button size="sm" onClick={() => approve.mutate()} disabled={busy}>
              {approve.isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <CheckIcon className="size-4" aria-hidden="true" />
              )}
              Approve Pro
            </Button>
          </div>
        )
      ) : row.active ? (
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => {
              if (window.confirm("End this learner's Pro access now?")) revoke.mutate()
            }}
          >
            End Pro now
          </Button>
        </div>
      ) : null}
    </li>
  )
}

/**
 * Pro approvals. PayMongo runs in test mode, so a paid checkout is not real
 * money: each one waits here until an admin approves (Pro starts then) or
 * rejects it with a note the learner sees.
 */
export default function AdminSubscriptionsPage() {
  const [tab, setTab] = useState("awaiting")
  const query = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: getAdminSubscriptions,
    retry: 1,
    refetchInterval: 30_000,
  })
  const rows = useMemo(() => (Array.isArray(query.data) ? query.data : []), [query.data])
  const counts = useMemo(
    () => ({
      awaiting: rows.filter((row) => row.awaitingApproval).length,
      active: rows.filter((row) => row.active).length,
      revenue: rows
        .filter((row) => row.active || (row.reviewedAt && !row.reviewNote && row.status !== "PENDING"))
        .reduce((sum, row) => sum + Number(row.amount ?? 0), 0),
    }),
    [rows]
  )
  const visible = rows.filter((row) =>
    tab === "awaiting" ? row.awaitingApproval : tab === "active" ? row.active : true
  )

  if (query.isLoading) return <InstitutionLoadingSkeleton />
  if (query.isError) {
    return (
      <InstitutionErrorState
        title="Subscriptions could not be loaded"
        description={apiMessage(query.error, "Check that the API is running.")}
        onRetry={() => query.refetch()}
      />
    )
  }

  return (
    <div className="space-y-6">
      <InstitutionPageHeader
        title="Pro subscriptions"
        subtitle="Test-mode PayMongo payments waiting for review, and who is on Pro."
      />

      <BentoGrid>
        <BentoStat tone="bee" col={2} icon={Clock} label="Awaiting approval" value={counts.awaiting.toLocaleString()} hint="Paid, not yet Pro" />
        <BentoStat tone="feather" col={2} icon={CheckIcon} label="Active Pro" value={counts.active.toLocaleString()} hint="Learners with Pro right now" />
        <BentoStat tone="macaw" col={2} label="Approved revenue (test)" value={money(counts.revenue)} hint="Sum of approved Pro payments" />
      </BentoGrid>

      <div className="flex flex-wrap gap-2" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-colors ${
              tab === item.id
                ? "border-rb-feather bg-rb-feather-wash text-rb-feather-lip"
                : "border-rb-swan bg-rb-snow text-rb-wolf hover:bg-rb-polar"
            }`}
          >
            {item.label}
            {item.id === "awaiting" && counts.awaiting > 0 ? (
              <span className="ml-2 rounded-full bg-rb-cardinal px-1.5 text-[11px] text-white">{counts.awaiting}</span>
            ) : null}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-rb-card border-2 border-dashed border-rb-swan p-8 text-center text-sm text-rb-wolf">
          {tab === "awaiting" ? "No payments are waiting for approval." : "Nothing here yet."}
        </p>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {visible.map((row) => (
            <SubscriptionCard key={row.learnerSubscriptionId} row={row} />
          ))}
        </ul>
      )}
    </div>
  )
}
