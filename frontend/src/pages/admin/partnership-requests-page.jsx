import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, Clock, XCircle } from "@/components/icons"
import { toast } from "sonner"

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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  PlainHead,
  SortableHead,
  TableCard,
  TablePagination,
  TableToolbar,
  useTableSort,
} from "@/components/commons/data-table.jsx"
import { Textarea } from "@/components/ui/textarea"
import {
  approvePartnershipRequest,
  getAdminPartnershipRequestDetail,
  getAdminPartnershipRequests,
  rejectPartnershipRequest,
} from "@/services/partnershipService.js"

const STATUS_VARIANT = {
  PENDING: "secondary",
  UNDER_REVIEW: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  CANCELLED: "outline",
}

function formatDate(value) {
  if (!value) return "—"
  // A bare yyyy-mm-dd is read as local midnight, not UTC, so it never slips a day.
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value)
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

/** What each kind of request is called, wherever it is named. */
const REQUEST_TYPE_LABEL = {
  NEW: "Partnership request",
  ADDITIONAL: "Additional access request",
  RENEWAL: "Renewal request",
  CANCELLATION: "Cancellation request",
}

export default function PartnershipRequests() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [detailId, setDetailId] = useState(null)
  const [remarks, setRemarks] = useState("")
  const [confirm, setConfirm] = useState(null) // { action: "approve" | "reject", id }
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { sort, toggle, sortRows } = useTableSort()

  const listQuery = useQuery({
    queryKey: ["admin-partnership-requests", statusFilter],
    queryFn: () => getAdminPartnershipRequests(statusFilter),
  })

  const detailQuery = useQuery({
    queryKey: ["admin-partnership-request", detailId],
    queryFn: () => getAdminPartnershipRequestDetail(detailId),
    enabled: detailId != null,
  })

  const requests = Array.isArray(listQuery.data) ? listQuery.data : []

  const counts = useMemo(() => {
    // Summary cards always reflect the full set, so fetch counts from the rows
    // when no status filter is applied; otherwise show the filtered figure.
    const base = { PENDING: 0, APPROVED: 0, REJECTED: 0 }
    requests.forEach((r) => {
      if (r.status in base) base[r.status] += 1
    })
    return base
  }, [requests])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return requests
    return requests.filter(
      (r) =>
        r.institutionName?.toLowerCase().includes(term) ||
        r.institutionEmail?.toLowerCase().includes(term)
    )
  }, [requests, search])

  const sorted = useMemo(
    () =>
      sortRows(filtered, {
        institution: (request) => request.institutionName ?? null,
        reference: (request) => request.referenceNumber ?? null,
        submitted: (request) => {
          const time = request.submittedAt
            ? new Date(request.submittedAt).getTime()
            : Number.NaN
          return Number.isNaN(time) ? null : time
        },
        status: (request) => request.status ?? null,
      }),
    [filtered, sort]
  )

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, pageSize])

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages))
  }, [totalPages])

  const paged = useMemo(
    () => sorted.slice((page - 1) * pageSize, page * pageSize),
    [page, pageSize, sorted]
  )

  const rangeStart = sorted.length === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, sorted.length)

  const reviewMutation = useMutation({
    mutationFn: ({ action, id }) =>
      action === "approve"
        ? approvePartnershipRequest(id, remarks)
        : rejectPartnershipRequest(id, remarks),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-partnership-requests"] })
      queryClient.invalidateQueries({ queryKey: ["admin-partnership-request"] })
      if (variables.action === "approve") {
        toast.success("Partnership approved.", {
          description:
            data?.institutionAccountNote ??
            "The institution now has certification access.",
        })
      } else {
        toast.success("Partnership rejected.")
      }
      setConfirm(null)
      setDetailId(null)
      setRemarks("")
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message ?? "Unable to update the request. Please try again."
      )
    },
  })

  const detail = detailQuery.data
  const canReview =
    detail && (detail.status === "PENDING" || detail.status === "UNDER_REVIEW")

  /* What was asked for. The request says so itself now; the fall-back reads it
     off the line items, for rows submitted before it did -- a certification the
     institution already holds slots for is one the server tops up rather than
     creates. */
  /* A cancellation grants nothing: no slots, no invoice, no access. Every
     other kind of request is some amount of "yes, have this". */
  const isCancellation = detail?.requestType === "CANCELLATION"
  const isTopUp =
    detail?.requestType === "ADDITIONAL" ||
    detail?.requestType === "RENEWAL" ||
    (detail?.items ?? []).some((item) => item.existingSlots != null)

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      {/* Three counts on one line rather than three cards on a grid: each held
          a single number, and a card's job is to separate things that would
          otherwise run together -- which spacing already does here. */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-10 gap-y-3 border-b border-border pb-4">
        <SummaryCard icon={Clock} label="Pending" value={counts.PENDING} />
        <SummaryCard icon={CheckCircle2} label="Approved" value={counts.APPROVED} />
        <SummaryCard icon={XCircle} label="Rejected" value={counts.REJECTED} />
      </div>

      {/* One table, scrolled sideways on a narrow screen. The duplicate card
          list this page used to render below md is gone: it was a second copy
          of every row to keep in step, and a request is read by comparing
          slots and dates down a column, which cards cannot do. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <TableCard className="flex min-h-0 flex-1 flex-col">
        <TableToolbar
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search institution or email"
        >
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[170px]" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </TableToolbar>

        {/* The rows scroll, the pager does not: with a short list the page still
            ends where the window does rather than leaving the pager stranded
            halfway up a blank page. */}
        <div className="min-h-0 flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <SortableHead
                  column="institution"
                  label="Institution"
                  sort={sort}
                  onSort={toggle}
                  className="min-w-56"
                />
                <SortableHead
                  column="reference"
                  label="Reference"
                  sort={sort}
                  onSort={toggle}
                />
                <SortableHead
                  column="submitted"
                  label="Submitted"
                  sort={sort}
                  onSort={toggle}
                />
                <SortableHead column="status" label="Status" sort={sort} onSort={toggle} />
                <PlainHead label="Actions" align="right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQuery.isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`loading-${index}`}>
                    <TableCell colSpan={7} className="h-16">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paged.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-48 text-center text-sm text-muted-foreground"
                  >
                    No partnership requests match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((r) => (
                  <TableRow key={r.requestId}>
                    <TableCell>
                      <div className="font-bold">{r.institutionName}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.institutionEmail}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.referenceNumber}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(r.submittedAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[r.status] ?? "secondary"}>
                        {r.status.replaceAll("_", " ").toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full"
                        onClick={() => {
                          setRemarks("")
                          setDetailId(r.requestId)
                        }}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <TablePagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          total={sorted.length}
          unit="requests"
        />
      </TableCard>
      </div>

      {/* Detail dialog */}
      <Dialog
        open={detailId != null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailId(null)
            setRemarks("")
          }
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-4rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {/* The request's own word for itself, except where it says NEW
                  only because it predates the column -- a row whose lines add
                  to slots already held is an addition whatever it calls
                  itself. */}
              {detail?.requestType && detail.requestType !== "NEW"
                ? REQUEST_TYPE_LABEL[detail.requestType]
                : isTopUp
                  ? "Additional access request"
                  : "Partnership request"}
            </DialogTitle>
            <DialogDescription>
              {detail?.referenceNumber} · submitted {formatDate(detail?.submittedAt)}
              {isTopUp ? " · from an existing partner" : ""}
            </DialogDescription>
          </DialogHeader>

          {detailQuery.isLoading || !detail ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* The details sit on a paper card pinned to the board: dim chalk
                  on dark green was unreadable at this size. */}
              <section className="space-y-2 rounded-lg bg-card p-4 text-sm shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Institution</h3>
                <Row label="Name" value={detail.institutionName} />
                <Row label="Email" value={detail.institutionEmail} />
                <Row label="Contact" value={detail.contactPersonName} />
                <Row label="Phone" value={detail.contactNumber} />
                <Row label="Address" value={detail.institutionAddress} />
                <div>
                  <p className="text-muted-foreground">Description</p>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-foreground">
                    {detail.businessDescription || "—"}
                  </p>
                </div>
              </section>

              {/* A cancellation has no line items -- it asks for nothing. The
                  empty table that rendered here read as data failing to load. */}
              <section
                className={`space-y-2 rounded-lg bg-card p-4 shadow-sm ${
                  isCancellation ? "hidden" : ""
                }`}
              >
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Requested certifications
                </h3>
                <ul className="divide-y divide-[#e5ddcc] rounded-md border border-[#e5ddcc]">
                  {(detail.items ?? []).map((item) => (
                    <li
                      key={item.partnershipRequestItemId}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-foreground">
                          {item.certificationTitle}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {item.requestedAccessStartDate && item.requestedAccessEndDate
                            ? `${formatDate(item.requestedAccessStartDate)} – ${formatDate(item.requestedAccessEndDate)}`
                            : "Access window: 1 year from approval"}
                        </span>
                      </span>
                      <span className="shrink-0 text-right tabular-nums">
                        <span className="block font-semibold text-foreground">
                          {money(item.lineTotal ?? (item.requestedSlots ?? 0) * (detail.pricePerSlot ?? 149), detail.currency)}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {item.existingSlots != null ? "+" : ""}
                          {item.requestedSlots} slot(s) × {money(item.unitPrice ?? detail.pricePerSlot ?? 149, detail.currency)}
                          {/* What they hold now and what approving makes it.
                              "10 slots" alone cannot be told apart from a
                              request to be cut down to 10, and approving is
                              not reversible. */}
                          {item.existingSlots != null ? (
                            <span className="block text-muted-foreground">
                              {item.existingSlots} held → {item.existingSlots + Number(item.requestedSlots ?? 0)} after approval
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-baseline justify-between gap-3 px-1 pt-1 text-sm">
                  <span className="text-muted-foreground">
                    {(detail.items ?? []).reduce((sum, item) => sum + Number(item.requestedSlots ?? 0), 0)} slot(s) total
                    {isTopUp ? " added" : ""} · {money(detail.pricePerSlot ?? 149, detail.currency)} per slot
                  </span>
                  <span className="text-base font-bold tabular-nums text-foreground">
                    Total {money(
                      detail.totalAmount ??
                        (detail.items ?? []).reduce(
                          (sum, item) => sum + Number(item.requestedSlots ?? 0) * Number(detail.pricePerSlot ?? 149),
                          0
                        ),
                      detail.currency
                    )}
                  </span>
                </div>
                {detail.invoiceNumber ? (
                  <p className="px-1 text-xs text-muted-foreground">
                    Invoice <span className="font-mono font-semibold text-foreground">{detail.invoiceNumber}</span> ·{" "}
                    <span className="capitalize">{String(detail.invoiceStatus ?? "").replaceAll("_", " ")}</span>
                  </p>
                ) : null}
              </section>

              {canReview ? (
                <section className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {isCancellation
                      ? "Approving ends this partnership immediately: every learner loses access, the institution's departments, enrolments and pending invitations are deleted, and what it paid is refunded to its original payment method. This cannot be undone."
                      : isTopUp
                        ? "Approving issues an invoice for the additional slots and emails it. The extra slots are added to the institution's existing allocation once it is paid — nothing it already has is replaced."
                        : "Approving issues the invoice and emails the institution a welcome message with a link to pay it. The access above activates once the invoice is paid."}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => setConfirm({ action: "approve", id: detail.requestId })}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => setConfirm({ action: "reject", id: detail.requestId })}
                    >
                      Reject
                    </Button>
                  </div>
                </section>
              ) : (
                <section className="rounded-lg bg-muted/50 p-3 text-sm">
                  <p>
                    This request was{" "}
                    <span className="font-medium">{detail.status.toLowerCase()}</span>
                    {detail.reviewedBy ? ` by ${detail.reviewedBy}` : ""}.
                  </p>
                  {detail.adminRemarks ? (
                    <p className="mt-1 text-muted-foreground">“{detail.adminRemarks}”</p>
                  ) : null}
                </section>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve / reject confirmation */}
      <AlertDialog open={confirm != null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.action === "approve"
                ? isCancellation
                  ? "End this partnership?"
                  : isTopUp
                    ? "Approve this additional access?"
                    : "Approve this partnership?"
                : isCancellation
                  ? "Decline this cancellation?"
                  : isTopUp
                    ? "Reject this additional access?"
                    : "Reject this partnership?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.action === "approve"
                ? isCancellation
                  ? "Access is revoked now, the institution's departments and enrolments are deleted, and its payments are refunded. There is no undo."
                  : isTopUp
                    ? "An invoice for the additional slots is issued and emailed. They are added to the institution's existing allocation once it is paid."
                    : "An invoice is issued and a welcome email with a link to pay it is sent. Certification access and learner slots activate once the invoice is paid."
                : isCancellation
                  ? "The institution keeps its access and is told the cancellation was declined, with your reason."
                  : "The institution is emailed and notified that the request was rejected, with your reason. No access is granted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {confirm?.action === "reject" ? (
            <div className="space-y-1.5">
              <Label htmlFor="reject-reason">Reason (shared with the institution)</Label>
              <Textarea
                id="reject-reason"
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Why this request is not being approved."
              />
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reviewMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                reviewMutation.mutate(confirm)
              }}
              disabled={reviewMutation.isPending}
              className={
                confirm?.action === "reject"
                  ? "bg-destructive text-white hover:bg-destructive/90"
                  : undefined
              }
            >
              {reviewMutation.isPending
                ? confirm?.action === "approve"
                  ? isCancellation
                    ? "Ending partnership..."
                    : isTopUp
                      ? "Approving access..."
                      : "Approving partnership..."
                  : isCancellation
                    ? "Declining..."
                    : isTopUp
                      ? "Rejecting access..."
                      : "Rejecting partnership..."
                : confirm?.action === "approve"
                  ? "Approve Partnership"
                  : "Reject Partnership"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function money(value, currency = "PHP") {
  if (value == null) return "—"
  return Number(value).toLocaleString("en-PH", { style: "currency", currency, maximumFractionDigits: 2 })
}

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <div className="flex items-baseline gap-2">
      <Icon className="size-4 self-center text-muted-foreground" aria-hidden="true" />
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words text-right font-medium text-foreground">{value || "—"}</span>
    </div>
  )
}
