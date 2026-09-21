import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { CheckIcon, Clock, CreditCard, Download, Loader2Icon, UsersIcon, XCircleIcon } from "@/components/icons"
import {
  InstitutionErrorState,
  InstitutionLoadingSkeleton,
  InstitutionPageHeader,
  formatDateTime,
} from "@/components/institution/institution-ui.jsx"
import { BentoGrid, BentoStat } from "@/components/commons/bento.jsx"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { downloadCsv, timestampedFilename, toCsv } from "@/lib/csv.js"
import { apiMessage } from "@/services/base"
import {
  approveSubscription,
  getAdminPayments,
  getAdminSubscriptions,
  rejectSubscription,
  revokeSubscription,
} from "@/services/subscriptionService.js"

/* The first two tabs are the Pro approval queue (LEARNER_SUBSCRIPTIONS); the
   last two are the payment ledger, which also folds in certification purchases
   (LEARNER_ORDERS). One page for "who has paid us", whichever way they did. */
const TABS = [
  { id: "awaiting", label: "Awaiting approval" },
  { id: "pro", label: "Pro subscriptions" },
  { id: "certifications", label: "Certification purchases" },
  { id: "all", label: "All payments" },
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
    queryClient.invalidateQueries({ queryKey: ["admin-payments"] })
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
      {row.status === "CANCELED" && row.reviewedAt && row.reviewNote !== undefined && !row.active ? (
        row.refundId ? (
          <p className="mt-1 text-xs text-rb-feather-lip">Refunded via PayMongo · {row.refundId}</p>
        ) : row.reviewNote ? (
          <p className="mt-1 text-xs text-rb-cardinal-lip">Refund failed — refund this payment by hand in PayMongo.</p>
        ) : null
      ) : null}

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

function PaymentStatus({ status }) {
  const tone =
    status === "Awaiting approval"
      ? "text-rb-bee-lip"
      : status === "Active" || status === "Paid"
        ? "text-rb-feather-lip"
        : status === "Rejected"
          ? "text-rb-cardinal-lip"
          : "text-rb-wolf"
  return <span className={`text-xs font-bold ${tone}`}>{status}</span>
}

/** The full ledger: one row per payment, searchable. */
function PaymentsTable({ rows, onlyKind }) {
  const [search, setSearch] = useState("")
  const scoped = useMemo(() => rows.filter((row) => !onlyKind || row.kind === onlyKind), [rows, onlyKind])
  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return scoped
    return scoped.filter((row) =>
      [row.learnerName, row.email, row.reference, row.item]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    )
  }, [scoped, search])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by learner, email, reference or item"
          className="max-w-sm"
          aria-label="Search payments"
        />
        <span className="text-xs text-rb-wolf">
          {visible.length.toLocaleString()} of {scoped.length.toLocaleString()}
        </span>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-rb-card border-2 border-dashed border-rb-swan p-8 text-center text-sm text-rb-wolf">
          {search ? "No payments match that search." : "No paid purchases or Pro subscriptions yet."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-rb-card border-2 border-rb-swan bg-rb-snow shadow-[var(--comic-shadow-sm)]">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b-2 border-rb-swan text-left text-xs font-bold uppercase tracking-wide text-rb-hare">
                <th className="px-4 py-3">Learner</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Paid at</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.key} className="border-b border-rb-swan/60 last:border-b-0">
                  <td className="px-4 py-3">
                    <p className="font-bold text-rb-eel">{row.learnerName}</p>
                    <p className="text-xs text-rb-wolf">{row.email ?? "No email"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        row.kind === "Pro" ? "bg-rb-feather-wash text-rb-feather-lip" : "bg-rb-macaw-wash text-rb-macaw-lip"
                      }`}
                    >
                      {row.kind}
                    </span>
                  </td>
                  <td className="max-w-[16rem] truncate px-4 py-3 text-rb-eel" title={row.item ?? ""}>
                    {row.item ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-rb-wolf">{row.reference}</td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums text-rb-eel">{money(row.amount)}</td>
                  <td className="px-4 py-3 text-rb-eel">{row.paidAt ? formatDateTime(row.paidAt) : "—"}</td>
                  <td className="px-4 py-3">
                    <PaymentStatus status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/**
 * Payments: who has paid us, and the Pro approval queue.
 *
 * PayMongo runs in test mode, so a paid Pro checkout is not real money: each
 * one waits in the first tab until an admin approves (Pro starts then) or
 * rejects it with a note the learner sees. The ledger tabs list every payment
 * from both tables -- certification orders and Pro subscriptions -- in full;
 * the dashboard tile only ever shows the latest eight.
 */
export default function AdminSubscriptionsPage() {
  const [tab, setTab] = useState("awaiting")
  const query = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: getAdminSubscriptions,
    retry: 1,
    refetchInterval: 30_000,
  })
  const paymentsQuery = useQuery({
    queryKey: ["admin-payments"],
    queryFn: getAdminPayments,
    retry: 1,
    refetchInterval: 30_000,
  })
  const rows = useMemo(() => (Array.isArray(query.data) ? query.data : []), [query.data])
  const ledger = paymentsQuery.data ?? {}
  const payments = useMemo(() => (Array.isArray(ledger.payments) ? ledger.payments : []), [ledger.payments])
  const counts = useMemo(
    () => ({
      awaiting: rows.filter((row) => row.awaitingApproval).length,
      active: rows.filter((row) => row.active).length,
    }),
    [rows]
  )
  const proRows = rows.filter((row) => (tab === "awaiting" ? row.awaitingApproval : true))
  const isLedgerTab = tab === "certifications" || tab === "all"

  /* One file with the analytics on top and the full ledger underneath, so a
     spreadsheet reader gets the same picture as this page. */
  const exportCsv = () => {
    const stamp = new Date().toISOString()
    downloadCsv(
      timestampedFilename("rebyu-payments"),
      toCsv([
        {
          title: `REBYU payments analytics (exported ${stamp})`,
          columns: ["Metric", "Value"],
          rows: [
            ["Learners who paid", ledger.payers ?? ""],
            ["Certification orders (paid)", ledger.certificationOrders ?? ""],
            ["Certification sales (PHP)", ledger.certificationRevenue ?? ""],
            ["Pro payments", ledger.proPayments ?? ""],
            ["Approved Pro revenue (PHP, test)", ledger.proRevenue ?? ""],
            ["Learners on Pro now", counts.active],
            ["Pro awaiting approval", counts.awaiting],
          ],
        },
        {
          title: "Payments",
          columns: ["Learner", "Email", "Type", "Item", "Reference", "Amount (PHP)", "Paid at", "Status"],
          rows: payments.map((row) => [
            row.learnerName,
            row.email ?? "",
            row.kind,
            row.item ?? "",
            row.reference,
            row.amount ?? "",
            row.paidAt ?? "",
            row.status,
          ]),
        },
        {
          title: "Pro subscriptions",
          columns: ["Learner", "Email", "Plan", "Status", "Amount", "Paid at", "Pro until", "Reviewed at", "Note"],
          rows: rows.map((row) => [
            row.learnerName ?? `Learner #${row.learnerId}`,
            row.email ?? "",
            row.planName ?? row.planCode ?? "",
            row.awaitingApproval ? "Awaiting approval" : row.active ? "Active" : row.status,
            row.amount ?? "",
            row.paidAt ?? "",
            row.currentPeriodEnd ?? "",
            row.reviewedAt ?? "",
            row.reviewNote ?? "",
          ]),
        },
      ])
    )
  }

  if (query.isLoading) return <InstitutionLoadingSkeleton />
  if (query.isError) {
    return (
      <InstitutionErrorState
        title="Payments could not be loaded"
        description={apiMessage(query.error, "Check that the API is running.")}
        onRetry={() => query.refetch()}
      />
    )
  }

  return (
    <div className="space-y-6">
      <InstitutionPageHeader
        title="Payments"
        subtitle="Everyone who has paid — certification purchases and Pro subscriptions — plus test-mode PayMongo payments waiting for review."
        actions={
          <Button variant="outline" onClick={exportCsv} disabled={paymentsQuery.isLoading}>
            <Download className="size-4" aria-hidden="true" />
            Download CSV
          </Button>
        }
      />

      <BentoGrid>
        <BentoStat
          tone="macaw"
          col={2}
          icon={UsersIcon}
          label="Learners who paid"
          value={ledger.payers == null ? "—" : Number(ledger.payers).toLocaleString()}
          hint={`${Number(ledger.certificationOrders ?? 0).toLocaleString()} orders · ${Number(ledger.proPayments ?? 0).toLocaleString()} Pro payments`}
        />
        <BentoStat
          tone="macaw"
          col={2}
          icon={CreditCard}
          label="Certification sales"
          value={money(ledger.certificationRevenue)}
          hint="Completed, paid orders"
        />
        <BentoStat
          tone="feather"
          col={2}
          icon={CheckIcon}
          label="Approved Pro revenue (test)"
          value={money(ledger.proRevenue)}
          hint={`${counts.active.toLocaleString()} on Pro right now`}
        />
        <BentoStat tone="bee" col={2} icon={Clock} label="Awaiting approval" value={counts.awaiting.toLocaleString()} hint="Paid, not yet Pro" />
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

      {isLedgerTab ? (
        paymentsQuery.isLoading ? (
          <InstitutionLoadingSkeleton />
        ) : paymentsQuery.isError ? (
          <InstitutionErrorState
            title="Payment ledger could not be loaded"
            description={apiMessage(paymentsQuery.error, "Check that the API is running.")}
            onRetry={() => paymentsQuery.refetch()}
          />
        ) : (
          <PaymentsTable rows={payments} onlyKind={tab === "certifications" ? "Certification" : null} />
        )
      ) : proRows.length === 0 ? (
        <p className="rounded-rb-card border-2 border-dashed border-rb-swan p-8 text-center text-sm text-rb-wolf">
          {tab === "awaiting" ? "No payments are waiting for approval." : "No Pro subscriptions yet."}
        </p>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {proRows.map((row) => (
            <SubscriptionCard key={row.learnerSubscriptionId} row={row} />
          ))}
        </ul>
      )}
    </div>
  )
}
