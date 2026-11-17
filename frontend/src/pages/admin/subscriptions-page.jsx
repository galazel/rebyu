import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DirectoryHeader, DirectoryResults } from "@/components/admin/directory-header.jsx"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { AlertTriangle, CheckIcon, Loader2Icon, Search, XCircleIcon } from "@/components/icons"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  InstitutionErrorState,
  InstitutionLoadingSkeleton,
  formatDateTime,
} from "@/components/institution/institution-ui.jsx"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ExportButton } from "@/components/commons/export-button.jsx"
import { apiMessage } from "@/services/base"
import {
  approveSubscription,
  getAdminPayments,
  getAdminSubscriptions,
  rejectSubscription,
  revokeSubscription,
} from "@/services/subscriptionService.js"

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
    ? ["Awaiting approval", "bg-rb-bee-wash text-foreground border-rb-bee/50"]
    : row.active
      ? ["Active", "bg-rb-feather-wash text-rb-feather-lip border-rb-feather/40"]
      : row.status === "CANCELED" && row.reviewNote
        ? ["Rejected", "bg-rb-cardinal/10 text-rb-cardinal-lip border-rb-cardinal/40"]
        : [row.status.charAt(0) + row.status.slice(1).toLowerCase(), "bg-rb-polar text-muted-foreground border-border"]
  return <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${tone}`}>{label}</span>
}

function SubscriptionsTable({ rows, tab }) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectNote, setRejectNote] = useState("")
  const [revokeTarget, setRevokeTarget] = useState(null)

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] })
    queryClient.invalidateQueries({ queryKey: ["admin-platform-metrics"] })
    queryClient.invalidateQueries({ queryKey: ["admin-payments"] })
  }

  const approve = useMutation({
    mutationFn: (id) => approveSubscription(id),
    onSuccess: (data, id) => {
      const row = rows.find((r) => r.learnerSubscriptionId === id)
      toast.success(`${row?.learnerName ?? "Learner"} is now on Pro`)
      refresh()
    },
    onError: (error) => toast.error(apiMessage(error, "Could not approve this subscription.")),
  })

  const reject = useMutation({
    mutationFn: ({ id, note }) => rejectSubscription(id, note),
    onSuccess: () => {
      toast.success("Subscription rejected")
      setRejectTarget(null)
      setRejectNote("")
      refresh()
    },
    onError: (error) => toast.error(apiMessage(error, "Could not reject this subscription.")),
  })

  const revoke = useMutation({
    mutationFn: (id) => revokeSubscription(id),
    onSuccess: () => {
      toast.success("Pro access ended")
      setRevokeTarget(null)
      refresh()
    },
    onError: (error) => toast.error(apiMessage(error, "Could not end this subscription.")),
  })

  const busy = approve.isPending || reject.isPending || revoke.isPending

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((row) =>
      [
        row.learnerName,
        row.email,
        row.planName,
        row.planCode,
        row.checkoutReference,
        row.status,
        row.learnerId,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    )
  }, [rows, search])

  const title = tab === "awaiting" ? "Awaiting approval" : "Pro subscriptions"

  return (
    <div className="space-y-3">
      <DirectoryResults
        title={title}
        count={visible.length}
        filtered={Boolean(search)}
        onReset={() => setSearch("")}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search learner, email, plan, or reference"
            className="h-9 pr-9 text-sm"
            aria-label="Search Pro subscriptions"
          />
          <Search
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {visible.length.toLocaleString()} of {rows.length.toLocaleString()} subscriptions
        </span>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-rb-card border-2 border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {search
            ? "No subscriptions match that search."
            : tab === "awaiting"
              ? "No payments are waiting for approval."
              : "No Pro subscriptions yet."}
        </p>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-card shadow-[var(--comic-shadow-sm)] md:block">
            <Table className="w-full min-w-[760px] text-sm">
              <TableHeader>
                <TableRow className="border-b-2 border-border text-left text-xs font-bold uppercase tracking-wide text-muted-foreground hover:bg-transparent">
                  <TableHead className="px-4 py-3">Learner</TableHead>
                  <TableHead className="px-4 py-3">Plan</TableHead>
                  <TableHead className="px-4 py-3 text-right">Paid</TableHead>
                  <TableHead className="px-4 py-3">Paid at</TableHead>
                  <TableHead className="px-4 py-3">
                    {tab === "awaiting" ? "Reviewed" : "Pro until"}
                  </TableHead>
                  <TableHead className="px-4 py-3">Status</TableHead>
                  <TableHead className="px-4 py-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((row) => (
                  <TableRow
                    key={row.learnerSubscriptionId}
                    className="border-b border-border/60 transition-colors last:border-b-0 hover:bg-muted/20"
                  >
                    <TableCell className="px-4 py-3.5">
                      <p className="font-bold text-foreground">
                        {row.learnerName || `Learner #${row.learnerId}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {row.email ?? "No email"}
                      </p>
                      {row.checkoutReference ? (
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          {row.checkoutReference}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 font-medium text-foreground">
                      {row.planName ?? row.planCode}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-right font-bold tabular-nums text-foreground">
                      {money(row.amount, row.currency)}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-xs text-muted-foreground">
                      {row.paidAt ? formatDateTime(row.paidAt) : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-xs text-muted-foreground">
                      {row.active
                        ? row.currentPeriodEnd
                          ? formatDateTime(row.currentPeriodEnd)
                          : "—"
                        : row.reviewedAt
                          ? formatDateTime(row.reviewedAt)
                          : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <StatusPill row={row} />
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-right">
                      {row.awaitingApproval ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRejectNote("")
                              setRejectTarget(row)
                            }}
                            disabled={busy}
                            className="h-8 text-xs font-semibold text-destructive hover:border-destructive/30 hover:bg-destructive/10"
                          >
                            <XCircleIcon className="mr-1 size-3.5" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => approve.mutate(row.learnerSubscriptionId)}
                            disabled={busy}
                            className="h-8 text-xs font-semibold"
                          >
                            {approve.isPending && approve.variables === row.learnerSubscriptionId ? (
                              <Loader2Icon className="mr-1 size-3.5 animate-spin" />
                            ) : (
                              <CheckIcon className="mr-1 size-3.5" />
                            )}
                            Approve
                          </Button>
                        </div>
                      ) : row.active ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => setRevokeTarget(row)}
                          className="h-8 text-xs font-semibold text-destructive hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                        >
                          End Pro now
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards View: Compressed & Pleasing */}
          <div className="divide-y divide-border/60 rounded-xl border border-border bg-card shadow-[var(--comic-shadow-sm)] md:hidden">
            {visible.map((row) => (
              <article key={row.learnerSubscriptionId} className="space-y-2 p-3 transition-colors hover:bg-muted/20 sm:p-3.5">
                {/* Top: Learner + Amount + Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">
                      {row.learnerName || `Learner #${row.learnerId}`}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {row.email ?? "No email"}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold tabular-nums text-foreground">
                      {money(row.amount, row.currency)}
                    </p>
                    <div className="mt-0.5">
                      <StatusPill row={row} />
                    </div>
                  </div>
                </div>

                {/* Sub-line: Plan & Timeframe */}
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs">
                  <span className="font-semibold text-foreground">
                    {row.planName ?? row.planCode}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {row.active
                      ? `Pro until: ${row.currentPeriodEnd ? formatDateTime(row.currentPeriodEnd) : "—"}`
                      : row.paidAt
                        ? `Paid: ${formatDateTime(row.paidAt)}`
                        : "—"}
                  </span>
                </div>

                {row.checkoutReference ? (
                  <p className="truncate font-mono text-[10px] text-muted-foreground">
                    Ref: {row.checkoutReference}
                  </p>
                ) : null}
                {row.reviewNote ? (
                  <p className="text-xs italic text-muted-foreground">Note: {row.reviewNote}</p>
                ) : null}

                {/* Actions */}
                {row.awaitingApproval ? (
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRejectNote("")
                        setRejectTarget(row)
                      }}
                      disabled={busy}
                      className="h-8 flex-1 text-xs font-semibold text-destructive hover:border-destructive/30 hover:bg-destructive/10"
                    >
                      <XCircleIcon className="mr-1 size-3.5" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => approve.mutate(row.learnerSubscriptionId)}
                      disabled={busy}
                      className="h-8 flex-1 text-xs font-semibold"
                    >
                      {approve.isPending && approve.variables === row.learnerSubscriptionId ? (
                        <Loader2Icon className="mr-1 size-3.5 animate-spin" />
                      ) : (
                        <CheckIcon className="mr-1 size-3.5" />
                      )}
                      Approve Pro
                    </Button>
                  </div>
                ) : row.active ? (
                  <div className="pt-0.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => setRevokeTarget(row)}
                      className="h-8 w-full text-xs font-semibold text-destructive hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                    >
                      End Pro now
                    </Button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </>
      )}

      {/* Revoke Pro Confirmation Modal */}
      <AlertDialog open={revokeTarget != null} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xl text-card-foreground">
          <AlertDialogHeader className="gap-1.5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/15 text-destructive border border-destructive/25">
                <AlertTriangle className="size-5" />
              </div>
              <div className="min-w-0">
                <AlertDialogTitle className="font-heading text-lg font-bold text-foreground sm:text-xl">
                  End Pro Access Now?
                </AlertDialogTitle>
                <AlertDialogDescription className="mt-0.5 text-xs text-muted-foreground truncate">
                  Revoke active subscription for <span className="font-semibold text-foreground">{revokeTarget?.learnerName || `Learner #${revokeTarget?.learnerId}`}</span>
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          {revokeTarget ? (
            <div className="space-y-3 py-1 text-sm">
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Subscription Target</span>
                  <span className="rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">REBYU Pro</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Learner Name:</span>
                  <span className="font-semibold text-foreground">{revokeTarget.learnerName || `Learner #${revokeTarget.learnerId}`}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Account Email:</span>
                  <span className="font-mono text-foreground/90">{revokeTarget.email ?? "No email"}</span>
                </div>
                {revokeTarget.currentPeriodEnd ? (
                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <span className="text-muted-foreground font-medium">Active Period End:</span>
                    <span className="tabular-nums font-semibold text-foreground">{formatDateTime(revokeTarget.currentPeriodEnd)}</span>
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive dark:text-red-300">
                <p className="font-bold text-destructive dark:text-red-200">Immediate Downgrade</p>
                <p className="mt-1 leading-relaxed text-foreground/90">
                  This learner will immediately lose Pro access to advanced mock exams, AI tutor daily allowances, and mastery insights, reverting them to the standard free tier.
                </p>
              </div>
            </div>
          ) : null}

          <AlertDialogFooter className="mt-2 flex-col-reverse gap-2 sm:flex-row pt-1">
            <AlertDialogCancel
              disabled={revoke.isPending}
              className="w-full text-xs font-medium sm:w-auto h-9 px-4"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={revoke.isPending}
              onClick={(e) => {
                e.preventDefault()
                if (revokeTarget) revoke.mutate(revokeTarget.learnerSubscriptionId)
              }}
              className="w-full gap-1.5 text-xs font-semibold sm:w-auto h-9 px-4 !bg-destructive !text-destructive-foreground hover:!bg-destructive/90"
            >
              {revoke.isPending ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <AlertTriangle className="size-3.5" />
              )}
              <span>End Pro now</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Awaiting Approval Dialog */}
      <Dialog open={rejectTarget != null} onOpenChange={(open) => {
        if (!open) {
          setRejectTarget(null)
          setRejectNote("")
        }
      }}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md p-5 sm:p-6 rounded-2xl border border-border/80 bg-card shadow-2xl text-card-foreground">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold text-foreground">Reject Subscription</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Provide an explanation for rejecting{" "}
              <span className="font-semibold text-foreground">
                {rejectTarget?.learnerName || `Learner #${rejectTarget?.learnerId}`}
              </span>
              . The learner will see this note.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Why is this being rejected? The learner sees this note."
              rows={3}
              maxLength={500}
              className="resize-none text-xs sm:text-sm bg-muted/30 border-border/80 text-foreground placeholder:text-muted-foreground"
            />
            <p className="text-right text-[11px] text-muted-foreground tabular-nums">
              {rejectNote.length}/500
            </p>
          </div>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRejectTarget(null)
                setRejectNote("")
              }}
              disabled={reject.isPending}
              className="w-full text-xs sm:w-auto h-9 px-4 font-medium"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={reject.isPending}
              onClick={() => {
                if (rejectTarget) {
                  reject.mutate({ id: rejectTarget.learnerSubscriptionId, note: rejectNote })
                }
              }}
              className="w-full gap-1.5 text-xs font-semibold sm:w-auto h-9 px-4 !bg-destructive !text-destructive-foreground hover:!bg-destructive/90"
            >
              {reject.isPending ? <Loader2Icon className="size-3.5 animate-spin" /> : null}
              <span>Confirm rejection</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
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
          : "text-muted-foreground"
  return <span className={`text-xs font-bold ${tone}`}>{status}</span>
}

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
      <DirectoryResults title="Payment records" count={visible.length} filtered={Boolean(search)} onReset={() => setSearch("")} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search learner, email, reference, or item"
            className="h-9 pr-9 text-sm"
            aria-label="Search payments"
          />
          <Search
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {visible.length.toLocaleString()} of {scoped.length.toLocaleString()} records
        </span>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-rb-card border-2 border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {search ? "No payments match that search." : "No paid purchases or Pro subscriptions yet."}
        </p>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-card shadow-[var(--comic-shadow-sm)] md:block">
            <Table mobileLayout="scroll" className="w-full min-w-[720px] text-sm">
              <TableHeader>
                <TableRow className="border-b-2 border-border text-left text-xs font-bold uppercase tracking-wide text-muted-foreground hover:bg-transparent">
                  <TableHead className="px-4 py-3">Learner</TableHead>
                  <TableHead className="px-4 py-3">Type</TableHead>
                  <TableHead className="px-4 py-3">Item</TableHead>
                  <TableHead className="px-4 py-3">Reference</TableHead>
                  <TableHead className="px-4 py-3 text-right">Amount</TableHead>
                  <TableHead className="px-4 py-3">Paid at</TableHead>
                  <TableHead className="px-4 py-3">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((row) => (
                  <TableRow key={row.key} className="border-b border-border/60 transition-colors last:border-b-0 hover:bg-muted/20">
                    <TableCell className="px-4 py-3">
                      <p className="font-bold text-foreground">{row.learnerName}</p>
                      <p className="text-xs text-muted-foreground">{row.email ?? "No email"}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          row.kind === "Pro"
                            ? "bg-rb-feather-wash text-rb-feather-lip border border-rb-feather/40"
                            : "bg-rb-macaw-wash text-rb-macaw-lip border border-rb-macaw/40"
                        }`}
                      >
                        {row.kind}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[16rem] truncate px-4 py-3 text-foreground" title={row.item ?? ""}>
                      {row.item ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.reference}</TableCell>
                    <TableCell className="px-4 py-3 text-right font-bold tabular-nums text-foreground">{money(row.amount)}</TableCell>
                    <TableCell className="px-4 py-3 text-foreground">{row.paidAt ? formatDateTime(row.paidAt) : "—"}</TableCell>
                    <TableCell className="px-4 py-3">
                      <PaymentStatus status={row.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards View: Compressed & Pleasing */}
          <div className="divide-y divide-border/60 rounded-xl border border-border bg-card shadow-[var(--comic-shadow-sm)] md:hidden">
            {visible.map((row) => (
              <article key={row.key} className="space-y-1.5 p-3 transition-colors hover:bg-muted/20 sm:p-3.5">
                {/* Line 1: Learner Name & Type on Left, Amount & Status on Right */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-bold text-foreground">
                        {row.learnerName}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                          row.kind === "Pro"
                            ? "bg-rb-feather-wash text-rb-feather-lip border border-rb-feather/40"
                            : "bg-rb-macaw-wash text-rb-macaw-lip border border-rb-macaw/40"
                        }`}
                      >
                        {row.kind}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {row.email ?? "No email"}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold tabular-nums text-foreground">
                      {money(row.amount)}
                    </p>
                    <div className="mt-0.5">
                      <PaymentStatus status={row.status} />
                    </div>
                  </div>
                </div>

                {/* Line 2: Item Name on Left, Reference and Date on Right */}
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-0.5 text-xs">
                  <span className="truncate font-medium text-foreground max-w-[200px]" title={row.item ?? ""}>
                    {row.item ?? "—"}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="font-mono">{row.reference}</span>
                    <span>&bull;</span>
                    <span>{row.paidAt ? formatDateTime(row.paidAt) : "—"}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

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

  const statusLabel = (value) => {
    const text = String(value ?? "").toLowerCase().replaceAll("_", " ")
    return text ? text[0].toUpperCase() + text.slice(1) : ""
  }

  const exportSections = () => [
        {
          title: "Payments summary",
          columns: ["Metric", "Value"],
          rows: [
            ["Learners who paid", ledger.payers ?? ""],
            ["Certification orders paid for (above ₱0)", ledger.certificationOrders ?? ""],
            ["Certification sales (PHP)", ledger.certificationRevenue ?? ""],
            ["Pro payments (any status, including rejected)", ledger.proPayments ?? ""],
            ["Approved Pro revenue (PHP, test mode)", ledger.proRevenue ?? ""],
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
            statusLabel(row.status),
          ]),
        },
        {
          title: "Pro subscriptions",
          columns: ["Learner", "Email", "Plan", "Status", "Amount", "Paid at", "Pro until", "Reviewed at", "Note"],
          rows: rows.map((row) => [
            row.learnerName ?? `Learner #${row.learnerId}`,
            row.email ?? "",
            row.planName ?? row.planCode ?? "",
            row.awaitingApproval ? "Awaiting approval" : row.active ? "Active" : statusLabel(row.status),
            row.amount ?? "",
            row.paidAt ?? "",
            row.currentPeriodEnd ?? "",
            row.reviewedAt ?? "",
            row.reviewNote ?? "",
          ]),
        },
  ]

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
    <div className="admin-directory space-y-6">
      {paymentsQuery.isError ? (
        <InstitutionErrorState title="Payment totals could not be loaded" description="Totals are unavailable until the ledger reloads." onRetry={() => paymentsQuery.refetch()} />
      ) : null}
      <DirectoryHeader
        title="Payments"
        description="Review Pro subscriptions, track certification purchases, and find payment records. PayMongo payments are in test mode."
        stats={[
          { label: "Learners who paid", value: ledger.payers ?? "—", hint: paymentsQuery.isError || paymentsQuery.isLoading ? "Ledger unavailable" : `${ledger.certificationOrders ?? 0} orders · ${ledger.proPayments ?? 0} Pro payments` },
          { label: "Certification sales", value: money(ledger.certificationRevenue), hint: "Completed, paid orders" },
          { label: "Approved Pro revenue (test)", value: money(ledger.proRevenue), hint: `${counts.active} active subscriptions` },
          { label: "Awaiting approval", value: counts.awaiting, hint: "Paid, waiting for review", onSelect: () => setTab("awaiting"), active: tab === "awaiting" },
        ]}
      >
          <ExportButton
            filename="rebyu-payments"
            report="Payments"
            details={[["Mode", "PayMongo test mode"]]}
            sections={exportSections}
            disabled={paymentsQuery.isLoading}
            size="default"
            className="w-full sm:w-auto"
          />
      </DirectoryHeader>



      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" role="tablist" aria-label="Payment categories">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`min-h-11 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
              tab === item.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-accent"
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
      ) : (
        <SubscriptionsTable rows={proRows} tab={tab} />
      )}
    </div>
  )
}
