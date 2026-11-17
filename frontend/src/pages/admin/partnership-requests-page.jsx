import { DirectoryHeader, DirectoryResults } from "@/components/admin/directory-header.jsx"
import { useEffect, useMemo, useState } from "react"
import { ExportButton, tableFromObjects } from "@/components/commons/export-button.jsx"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  AlertTriangle,
  Award,
  Building2,
  CheckCircle2,
  ChevronRight,
  ChevronsUpDownIcon,
  CreditCard,
  Info,
  Loader2Icon,
} from "@/components/icons"
import { cn } from "@/lib/utils"

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
  DialogFooter,
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

const STATUS_BADGE = {
  PENDING: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-300",
  UNDER_REVIEW: "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-500/40 dark:bg-blue-950/40 dark:text-blue-300",
  APPROVED: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-300",
  REJECTED: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-500/40 dark:bg-rose-950/40 dark:text-rose-300",
  CANCELLED: "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
}

function formatDate(value) {
  if (!value) return "—"
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value)
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

const REQUEST_TYPE_LABEL = {
  NEW: "Partnership request",
  ADDITIONAL: "Additional access request",
  RENEWAL: "Renewal request",
  CANCELLATION: "Cancellation request",
}

function getInitials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "PR"
}

export default function PartnershipRequests() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [detailId, setDetailId] = useState(null)
  const [remarks, setRemarks] = useState("")
  const [confirm, setConfirm] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { sort, toggle, sortRows, setSort } = useTableSort()

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

  const isCancellation = detail?.requestType === "CANCELLATION"
  const isTopUp =
    detail?.requestType === "ADDITIONAL" ||
    detail?.requestType === "RENEWAL" ||
    (detail?.items ?? []).some((item) => item.existingSlots != null)

  return (
    <div className="admin-directory flex min-h-0 w-full flex-1 flex-col gap-6">
      <DirectoryHeader title="Partnership requests" description="Review institution applications, additional access, renewals, and cancellations." stats={[{ label: "Requests in this view", value: requests.length, hint: "Current status filter" }, { label: "Awaiting review", value: counts.PENDING + requests.filter((r) => r.status === "UNDER_REVIEW").length, hint: "In current status view" }, { label: "Approved", value: counts.APPROVED, hint: "In current status view" }, { label: "Rejected", value: counts.REJECTED, hint: "In current status view" }]}>
        <ExportButton
          filename="rebyu-admin-partnership-requests"
          report="Partnership requests"
          details={() => [["Requests in file", `${sorted.length} of ${requests.length}`], ["Status filter", statusFilter]]}
          className="w-full sm:w-auto"
          disabled={sorted.length === 0}
          sections={() => [tableFromObjects("Partnership requests", sorted)]}
        />
      </DirectoryHeader>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <TableCard className="flex min-h-0 flex-1 flex-col">
        <DirectoryResults title="Request inbox" count={sorted.length} filtered={Boolean(search || statusFilter !== "ALL")} onReset={() => { setSearch(""); setStatusFilter("ALL"); }} error={listQuery.isError} onRetry={() => listQuery.refetch()} />
        <TableToolbar
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search institution or email"
        >
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 flex-1 sm:w-40" aria-label="Filter by status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sort?.key ? `${sort.key}-${sort.direction}` : "default"}
              onValueChange={(val) => {
                if (val === "default") {
                  setSort(null)
                } else {
                  const [key, direction] = val.split("-")
                  setSort({ key, direction })
                }
              }}
            >
              <SelectTrigger className="h-9 flex-1 sm:w-36 md:hidden" aria-label="Sort requests">
                <ChevronsUpDownIcon className="mr-1.5 size-3.5 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default order</SelectItem>
                <SelectItem value="institution-asc">Institution (A–Z)</SelectItem>
                <SelectItem value="institution-desc">Institution (Z–A)</SelectItem>
                <SelectItem value="submitted-desc">Submitted (Newest)</SelectItem>
                <SelectItem value="submitted-asc">Submitted (Oldest)</SelectItem>
                <SelectItem value="status-asc">Status</SelectItem>
                <SelectItem value="reference-asc">Reference</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TableToolbar>

        {/* Mobile View: Compressed aesthetic request cards */}
        <div className="divide-y divide-border/60 md:hidden">
          {listQuery.isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={`mobile-loading-${index}`} className="flex items-center gap-3 p-3.5">
                <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-7 w-16 rounded-md" />
              </div>
            ))
          ) : paged.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="mt-3 font-semibold text-foreground">
                {listQuery.isError ? "Partnership requests could not be loaded." : "No partnership requests match your filters."}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {listQuery.isError ? "Try loading the requests again above." : "Try changing the search or clearing the filters."}
              </p>
            </div>
          ) : (
            paged.map((r) => {
              const initials = getInitials(r.institutionName)
              const typeLabel = REQUEST_TYPE_LABEL[r.requestType]
              const isCustomType = r.requestType && r.requestType !== "NEW"

              return (
                <article
                  key={r.requestId}
                  className="group relative flex flex-col gap-2 p-3.5 transition-colors hover:bg-muted/20 active:bg-muted/30 focus-within:bg-muted/20 sm:p-4"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-[11px] font-bold text-primary shadow-xs">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="truncate text-sm font-bold text-foreground">
                            {r.institutionName}
                          </h3>
                          {isCustomType && (
                            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                              {typeLabel ?? r.requestType}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {r.institutionEmail}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant={STATUS_VARIANT[r.status] ?? "secondary"}
                      className="shrink-0 text-[11px] font-semibold capitalize"
                    >
                      {r.status.replaceAll("_", " ").toLowerCase()}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-0.5 pl-11">
                    <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono text-[11px] font-medium text-foreground/80">
                        {r.referenceNumber}
                      </span>
                      <span className="text-muted-foreground/40">&bull;</span>
                      <span className="truncate text-[11px]">
                        {formatDate(r.submittedAt)}
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 rounded-lg px-2.5 text-xs font-semibold shadow-xs hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                      aria-label={`Review partnership request for ${r.institutionName}`}
                      onClick={() => {
                        setRemarks("")
                        setDetailId(r.requestId)
                      }}
                    >
                      <span>Review</span>
                      <ChevronRight className="size-3 text-muted-foreground" />
                    </Button>
                  </div>
                </article>
              )
            })
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden min-h-0 flex-1 overflow-auto md:block">
          <Table mobileLayout="scroll">
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
                    {listQuery.isError ? "Partnership requests could not be loaded. Try again above." : "No partnership requests match your filters."}
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
                      {r.requestType ? <p className="mt-1 text-xs text-muted-foreground">{REQUEST_TYPE_LABEL[r.requestType] ?? r.requestType}</p> : null}
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
                        variant="outline"
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

      <Dialog
        open={detailId != null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailId(null)
            setRemarks("")
          }
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-4rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xl text-card-foreground">
          <DialogHeader className="gap-2">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Building2 className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="font-heading text-lg font-bold text-foreground sm:text-xl">
                    {detail?.requestType && detail.requestType !== "NEW"
                      ? REQUEST_TYPE_LABEL[detail.requestType]
                      : isTopUp
                        ? "Additional Access Request"
                        : "Partnership Request"}
                  </DialogTitle>
                  {detail?.status && (
                    <Badge
                      variant="outline"
                      className={cn("text-[11px] font-bold uppercase tracking-wider", STATUS_BADGE[detail.status])}
                    >
                      {detail.status.replaceAll("_", " ")}
                    </Badge>
                  )}
                </div>
                <DialogDescription className="mt-0.5 text-xs text-muted-foreground flex flex-wrap items-center gap-1.5">
                  <span className="font-mono font-medium text-foreground">{detail?.referenceNumber}</span>
                  <span>·</span>
                  <span>Submitted {formatDate(detail?.submittedAt)}</span>
                  {isTopUp && (
                    <>
                      <span>·</span>
                      <span className="text-primary font-medium">Existing partner</span>
                    </>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {detailQuery.isLoading || !detail ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-36 w-full rounded-xl" />
            </div>
          ) : (
            <div className="space-y-4 py-1">
              {/* Institution Profile */}
              <section className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Institution Profile
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">Institution name</span>
                    <p className="font-semibold text-foreground text-sm">{detail.institutionName || "—"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">Official email</span>
                    <p className="font-medium text-foreground truncate">{detail.institutionEmail || "—"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">Contact person</span>
                    <p className="font-medium text-foreground">{detail.contactPersonName || "—"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">Contact number</span>
                    <p className="font-medium text-foreground">{detail.contactNumber || "—"}</p>
                  </div>
                  <div className="sm:col-span-2 space-y-0.5">
                    <span className="text-muted-foreground">Campus / Institution address</span>
                    <p className="font-medium text-foreground">{detail.institutionAddress || "—"}</p>
                  </div>
                  {detail.businessDescription && (
                    <div className="sm:col-span-2 space-y-1 pt-1">
                      <span className="text-muted-foreground">Description / Purpose</span>
                      <div className="rounded-lg border border-border/50 bg-muted/40 p-2.5 text-xs leading-relaxed text-foreground whitespace-pre-wrap break-words">
                        {detail.businessDescription}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Requested Certifications */}
              {!isCancellation && (
                <section className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <div className="flex items-center gap-2">
                      <Award className="size-4 text-primary" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Requested Certifications
                      </h3>
                    </div>
                    <Badge variant="outline" className="text-[11px] font-medium">
                      {(detail.items ?? []).length} {detail.items?.length === 1 ? "track" : "tracks"}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {(detail.items ?? []).map((item) => (
                      <div
                        key={item.partnershipRequestItemId}
                        className="rounded-lg border border-border/60 bg-card/60 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <p className="font-semibold text-foreground text-sm truncate">
                            {item.certificationTitle}
                          </p>
                          <p className="text-muted-foreground">
                            {item.requestedAccessStartDate && item.requestedAccessEndDate
                              ? `${formatDate(item.requestedAccessStartDate)} – ${formatDate(item.requestedAccessEndDate)}`
                              : "Access window: 1 year from approval"}
                          </p>
                        </div>

                        <div className="shrink-0 text-left sm:text-right space-y-0.5 tabular-nums">
                          <p className="font-bold text-foreground text-sm">
                            {money(item.lineTotal ?? (item.requestedSlots ?? 0) * (detail.pricePerSlot ?? 149), detail.currency)}
                          </p>
                          <p className="text-muted-foreground">
                            {item.existingSlots != null ? "+" : ""}
                            {item.requestedSlots} slot(s) × {money(item.unitPrice ?? detail.pricePerSlot ?? 149, detail.currency)}
                          </p>
                          {item.existingSlots != null && (
                            <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                              {item.existingSlots} held → {item.existingSlots + Number(item.requestedSlots ?? 0)} after approval
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Footer */}
                  <div className="rounded-lg border border-border/60 bg-muted/40 p-3 flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {(detail.items ?? []).reduce((sum, item) => sum + Number(item.requestedSlots ?? 0), 0)} slot(s) total
                      {isTopUp ? " added" : ""} · {money(detail.pricePerSlot ?? 149, detail.currency)} per slot
                    </span>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground mr-2 font-medium">Total:</span>
                      <span className="text-base font-bold tabular-nums text-foreground">
                        {money(
                          detail.totalAmount ??
                            (detail.items ?? []).reduce(
                              (sum, item) => sum + Number(item.requestedSlots ?? 0) * Number(detail.pricePerSlot ?? 149),
                              0
                            ),
                          detail.currency
                        )}
                      </span>
                    </div>
                  </div>

                  {detail.invoiceNumber && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5 px-1">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="size-3.5" />
                        <span>Invoice</span>
                        <span className="font-mono font-semibold text-foreground">{detail.invoiceNumber}</span>
                      </div>
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {String(detail.invoiceStatus ?? "").replaceAll("_", " ")}
                      </Badge>
                    </div>
                  )}
                </section>
              )}

              {/* Action Area */}
              {canReview ? (
                <section className="space-y-3 pt-1">
                  <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
                    <Info className="size-4 shrink-0 text-primary mt-0.5" />
                    <p>
                      {isCancellation
                        ? "Approving ends this partnership immediately: every learner loses access, the institution's departments, enrolments, and pending invitations are deleted, and payments are refunded. This action cannot be undone."
                        : isTopUp
                          ? "Approving issues an invoice for the additional slots and emails it. The extra slots are added to the institution's allocation once paid."
                          : "Approving issues the invoice and emails the institution a welcome message with payment instructions. Certification access activates once paid."}
                    </p>
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto text-xs h-9 font-medium"
                      onClick={() => setDetailId(null)}
                    >
                      Close
                    </Button>
                    <div className="flex flex-1 gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1 text-xs h-9 font-semibold"
                        onClick={() => setConfirm({ action: "reject", id: detail.requestId })}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 text-xs h-9 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => setConfirm({ action: "approve", id: detail.requestId })}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                </section>
              ) : (
                <section className="space-y-3 pt-1">
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 text-xs text-foreground space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Review status</span>
                      <Badge
                        variant="outline"
                        className={cn("text-[11px] font-semibold uppercase tracking-wider", STATUS_BADGE[detail.status])}
                      >
                        {detail.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Processed {detail.reviewedBy ? `by ${detail.reviewedBy}` : ""}
                      {detail.reviewedAt ? ` on ${formatDate(detail.reviewedAt)}` : ""}.
                    </p>
                    {detail.adminRemarks && (
                      <div className="mt-2 rounded-lg border border-border/50 bg-muted/40 p-2.5 text-xs leading-relaxed text-foreground">
                        <span className="block font-semibold text-muted-foreground text-[11px] mb-0.5">Admin remarks:</span>
                        <span className="italic">“{detail.adminRemarks}”</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto text-xs h-9 font-medium"
                      onClick={() => setDetailId(null)}
                    >
                      Close
                    </Button>
                  </div>
                </section>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirm != null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xl text-card-foreground">
          <AlertDialogHeader className="gap-1.5">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl border",
                  confirm?.action === "reject" || isCancellation
                    ? "bg-destructive/15 text-destructive border-destructive/25"
                    : "bg-primary/15 text-primary border-primary/25"
                )}
              >
                {confirm?.action === "reject" || isCancellation ? (
                  <AlertTriangle className="size-5" />
                ) : (
                  <CheckCircle2 className="size-5" />
                )}
              </div>
              <div className="min-w-0">
                <AlertDialogTitle className="font-heading text-lg font-bold text-foreground sm:text-xl">
                  {confirm?.action === "approve"
                    ? isCancellation
                      ? "End this partnership?"
                      : isTopUp
                        ? "Approve additional access?"
                        : "Approve this partnership?"
                    : isCancellation
                      ? "Decline this cancellation?"
                      : isTopUp
                        ? "Reject additional access?"
                        : "Reject this partnership?"}
                </AlertDialogTitle>
                <AlertDialogDescription className="mt-0.5 text-xs text-muted-foreground">
                  {confirm?.action === "approve"
                    ? isCancellation
                      ? "Access is revoked immediately, departments and enrolments are erased, and payments are refunded."
                      : isTopUp
                        ? "An invoice for the additional slots will be issued and emailed to the institution."
                        : "An invoice and onboarding email with payment instructions will be sent."
                    : isCancellation
                      ? "The institution keeps its access and will be notified with your rejection reason."
                      : "The institution is notified that the request was rejected with your reason."}
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          {confirm?.action === "reject" ? (
            <div className="space-y-1.5 py-1">
              <Label htmlFor="reject-reason" className="text-xs font-semibold text-foreground">
                Reason (shared with the institution)
              </Label>
              <Textarea
                id="reject-reason"
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="State why this request is being rejected..."
                className="min-h-24 resize-none rounded-lg border-border bg-muted/40 font-mono text-xs focus:bg-background"
              />
            </div>
          ) : null}

          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row pt-2">
            <AlertDialogCancel
              disabled={reviewMutation.isPending}
              className="w-full text-xs sm:w-auto h-9 px-4 font-medium"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant={confirm?.action === "reject" ? "destructive" : "default"}
              onClick={(e) => {
                e.preventDefault()
                reviewMutation.mutate(confirm)
              }}
              disabled={reviewMutation.isPending}
              className={cn(
                "w-full gap-1.5 text-xs font-semibold sm:w-auto h-9 px-4",
                confirm?.action === "reject"
                  ? "bg-destructive text-white hover:bg-destructive/90"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {reviewMutation.isPending ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : confirm?.action === "reject" ? (
                <AlertTriangle className="size-3.5" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
              <span>
                {reviewMutation.isPending
                  ? confirm?.action === "approve"
                    ? isCancellation
                      ? "Ending partnership..."
                      : isTopUp
                        ? "Approving access..."
                        : "Approving..."
                    : "Rejecting..."
                  : confirm?.action === "approve"
                    ? isCancellation
                      ? "End Partnership"
                      : "Approve Partnership"
                    : "Reject Partnership"}
              </span>
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
