import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { DirectoryHeader, DirectoryResults } from "@/components/admin/directory-header.jsx"
import {
  PlainHead,
  SortableHead,
  TableCard,
  TablePagination,
  TableToolbar,
  useTableSort,
} from "@/components/commons/data-table.jsx"
import { ExportButton } from "@/components/commons/export-button.jsx"
import {
  Building2,
  CheckIcon,
  ChevronsUpDownIcon,
  Eye,
  Loader2Icon,
  Trash2,
  User,
  Users,
} from "@/components/icons"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { apiMessage } from "@/services/base"
import {
  approveDeletionRequest,
  declineDeletionRequest,
  listDeletionRequests,
} from "@/services/accountDeletionService.js"

const QUERY_KEY = "admin-account-deletion-requests"
const ALL_FILTER = "ALL"

const KIND = {
  LEARNER: {
    label: "Learner",
    scope: "the learner account and all of its learning data",
    tone: "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-200",
  },
  DEPARTMENT_HEAD: {
    label: "Department head",
    scope: "the department head's account",
    tone: "border-purple-300 bg-purple-50 text-purple-800 dark:border-purple-500/40 dark:bg-purple-500/10 dark:text-purple-200",
  },
  INSTITUTION: {
    label: "Institution",
    scope: "the whole institution (departments, assessments, results, files, invoices) and its staff sign-ins",
    tone: "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200",
  },
}

const STATUS = {
  PENDING: {
    label: "Waiting for review",
    tone: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-300",
  },
  APPROVED: {
    label: "Deleted",
    tone: "border-red-300 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-300",
  },
  DECLINED: {
    label: "Declined",
    tone: "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
  },
  CANCELLED: {
    label: "Cancelled by user",
    tone: "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400",
  },
}

function formatWhen(value) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function getDisplayName(request) {
  if (request.kind === "INSTITUTION" && request.institutionName) {
    return request.institutionName
  }
  return request.displayName || request.email || "Requester"
}

function getInitials(name) {
  return String(name || "U")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}

/**
 * Account deletion requests directory for platform administrators:
 * Review and process GDPR and voluntary account deletion requests.
 */
export default function AccountDeletionRequestsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("PENDING")
  const [kindFilter, setKindFilter] = useState(ALL_FILTER)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { sort, setSort, toggle, sortRows } = useTableSort()

  const [actionTarget, setActionTarget] = useState(null) // { request, type: "approve" | "decline" }
  const [viewTarget, setViewTarget] = useState(null) // request to view details
  const [note, setNote] = useState("")

  const query = useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => listDeletionRequests(false),
    refetchInterval: 30_000,
  })

  const requests = useMemo(() => (Array.isArray(query.data) ? query.data : []), [query.data])

  const decideMutation = useMutation({
    mutationFn: ({ requestId, type, note }) =>
      type === "approve"
        ? approveDeletionRequest(requestId, note)
        : declineDeletionRequest(requestId, note),
    onSuccess: (_data, variables) => {
      toast.success(
        variables.type === "approve"
          ? "Account deleted successfully."
          : "Deletion request declined."
      )
      setActionTarget(null)
      setNote("")
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
    onError: (error) => {
      toast.error(apiMessage(error, "Could not save the decision. Try again."))
    },
  })

  const pendingCount = useMemo(
    () => requests.filter((r) => r.status === "PENDING").length,
    [requests]
  )
  const approvedCount = useMemo(
    () => requests.filter((r) => r.status === "APPROVED").length,
    [requests]
  )
  const declinedCount = useMemo(
    () => requests.filter((r) => r.status === "DECLINED" || r.status === "CANCELLED").length,
    [requests]
  )

  const filteredRequests = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return requests.filter((req) => {
      if (statusFilter !== ALL_FILTER && req.status !== statusFilter) return false

      if (kindFilter !== ALL_FILTER && req.kind !== kindFilter) return false

      if (needle) {
        const displayName = getDisplayName(req)
        const kindLabel = KIND[req.kind]?.label ?? ""
        const matches = [
          displayName,
          req.email,
          req.institutionName,
          req.reason,
          req.adminNote,
          kindLabel,
        ]
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(needle))

        if (!matches) return false
      }

      return true
    })
  }, [requests, search, statusFilter, kindFilter])

  const sortedRequests = useMemo(
    () =>
      sortRows(filteredRequests, {
        requester: (r) => getDisplayName(r).toLowerCase(),
        kind: (r) => KIND[r.kind]?.label ?? r.kind ?? "",
        requestedAt: (r) => (r.requestedAt ? new Date(r.requestedAt).getTime() : 0),
        status: (r) => r.status ?? "",
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredRequests, sort]
  )

  const totalPages = Math.max(1, Math.ceil(sortedRequests.length / pageSize))

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, kindFilter, pageSize])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedRequests.slice(start, start + pageSize)
  }, [currentPage, pageSize, sortedRequests])

  const visibleStart = sortedRequests.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const visibleEnd = Math.min(currentPage * pageSize, sortedRequests.length)

  return (
    <section className="admin-directory flex min-h-0 w-full flex-1 flex-col gap-6">
      <DirectoryHeader
        title="Deletion requests"
        description="Review and process account deletion requests from learners, department heads, and partner institutions. Approving executes permanent erasure of accounts and associated records."
        stats={[
          {
            label: "All requests",
            value: requests.length,
            hint: "Total recorded",
            active: statusFilter === ALL_FILTER && kindFilter === ALL_FILTER,
            onSelect: () => {
              setStatusFilter(ALL_FILTER)
              setKindFilter(ALL_FILTER)
            },
          },
          {
            label: "Waiting for review",
            value: pendingCount,
            hint: "Requires action",
            active: statusFilter === "PENDING",
            onSelect: () => {
              setStatusFilter("PENDING")
              setKindFilter(ALL_FILTER)
            },
          },
          {
            label: "Deleted accounts",
            value: approvedCount,
            hint: "Permanently erased",
            active: statusFilter === "APPROVED",
            onSelect: () => {
              setStatusFilter("APPROVED")
              setKindFilter(ALL_FILTER)
            },
          },
          {
            label: "Declined / Cancelled",
            value: declinedCount,
            hint: "Closed requests",
            active: statusFilter === "DECLINED",
            onSelect: () => {
              setStatusFilter("DECLINED")
              setKindFilter(ALL_FILTER)
            },
          },
        ]}
      >
        <ExportButton
          filename="rebyu-admin-deletion-requests"
          report="Account deletion requests"
          details={() => [
            ["Requests in file", `${sortedRequests.length} of ${requests.length}`],
            ["Status filter", statusFilter],
            ["Type filter", kindFilter],
          ]}
          className="w-full sm:w-auto"
          disabled={sortedRequests.length === 0}
          sections={() => [
            {
              title: "Account deletion requests",
              columns: [
                "Requester",
                "Email",
                "Account type",
                "Institution",
                "Status",
                "Reason",
                "Requested at",
                "Reviewed at",
                "Admin note",
              ],
              rows: sortedRequests.map((r) => [
                getDisplayName(r),
                r.email,
                KIND[r.kind]?.label ?? r.kind,
                r.institutionName ?? "",
                STATUS[r.status]?.label ?? r.status,
                r.reason ?? "",
                formatWhen(r.requestedAt),
                formatWhen(r.reviewedAt),
                r.adminNote ?? "",
              ]),
            },
          ]}
        />
      </DirectoryHeader>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <TableCard className="flex min-h-0 flex-1 flex-col">
          <DirectoryResults
            title="Deletion requests inbox"
            count={sortedRequests.length}
            filtered={Boolean(search || statusFilter !== ALL_FILTER || kindFilter !== ALL_FILTER)}
            onReset={() => {
              setSearch("")
              setStatusFilter(ALL_FILTER)
              setKindFilter(ALL_FILTER)
            }}
            error={query.isError}
            onRetry={() => query.refetch()}
          />

          <TableToolbar
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search requester, email, or reason"
          >
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 flex-1 sm:w-44" aria-label="Filter by status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER}>All statuses</SelectItem>
                  <SelectItem value="PENDING">Waiting for review</SelectItem>
                  <SelectItem value="APPROVED">Deleted</SelectItem>
                  <SelectItem value="DECLINED">Declined</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled by user</SelectItem>
                </SelectContent>
              </Select>

              <Select value={kindFilter} onValueChange={setKindFilter}>
                <SelectTrigger className="h-9 flex-1 sm:w-40" aria-label="Filter by account type">
                  <SelectValue placeholder="All account types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER}>All types</SelectItem>
                  <SelectItem value="LEARNER">Learner</SelectItem>
                  <SelectItem value="DEPARTMENT_HEAD">Department head</SelectItem>
                  <SelectItem value="INSTITUTION">Institution</SelectItem>
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
                  <SelectItem value="requestedAt-desc">Requested (Newest)</SelectItem>
                  <SelectItem value="requestedAt-asc">Requested (Oldest)</SelectItem>
                  <SelectItem value="requester-asc">Requester (A–Z)</SelectItem>
                  <SelectItem value="requester-desc">Requester (Z–A)</SelectItem>
                  <SelectItem value="kind-asc">Account type</SelectItem>
                  <SelectItem value="status-asc">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TableToolbar>

          <div className="divide-y divide-border/60 md:hidden">
            {query.isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={`mobile-loading-${index}`} className="space-y-2.5 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-muted" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                    <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-6 w-full animate-pulse rounded bg-muted/60" />
                </div>
              ))
            ) : paginatedRequests.length > 0 ? (
              paginatedRequests.map((request) => {
                const displayName = getDisplayName(request)
                const kind = KIND[request.kind] ?? KIND.LEARNER
                const status = STATUS[request.status] ?? STATUS.PENDING
                const isPending = request.status === "PENDING"

                return (
                  <article
                    key={request.requestId}
                    className={cn(
                      "space-y-2 p-3 transition-colors hover:bg-muted/20 sm:p-3.5",
                      !isPending && "opacity-85"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-xs font-bold text-primary shadow-2xs">
                          {getInitials(displayName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-foreground">
                            {displayName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{request.email}</p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <Badge
                          variant="outline"
                          className={cn("text-[11px] font-bold", status.tone)}
                        >
                          {status.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] font-semibold", kind.tone)}
                        >
                          {kind.label}
                        </Badge>
                        {request.kind !== "INSTITUTION" && request.institutionName ? (
                          <span
                            className="max-w-[140px] truncate text-[11px] text-muted-foreground"
                            title={request.institutionName}
                          >
                            · {request.institutionName}
                          </span>
                        ) : null}
                      </div>

                      <span className="text-[11px] text-muted-foreground">
                        {formatWhen(request.requestedAt)}
                      </span>
                    </div>

                    {request.reason ? (
                      <blockquote className="truncate rounded border-l-2 border-border bg-muted/40 px-2 py-1 font-mono text-xs text-foreground/90">
                        "{request.reason}"
                      </blockquote>
                    ) : null}

                    {isPending && !request.accountExists ? (
                      <p className="text-[11px] text-muted-foreground italic">
                        Account no longer exists in system.
                      </p>
                    ) : null}

                    <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-1.5">
                      {!isPending && request.reviewedAt ? (
                        <p className="max-w-[200px] truncate text-[11px] text-muted-foreground italic">
                          Closed {formatWhen(request.reviewedAt)}
                          {request.adminNote ? ` · Note: ${request.adminNote}` : ""}
                        </p>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          {isPending ? "Awaiting admin decision" : ""}
                        </span>
                      )}

                      {isPending ? (
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2.5 text-xs font-semibold shadow-2xs"
                            onClick={() => {
                              setNote("")
                              setActionTarget({ request, type: "approve" })
                            }}
                          >
                            <Trash2 className="mr-1 size-3" />
                            Delete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-xs font-semibold"
                            onClick={() => {
                              setNote("")
                              setActionTarget({ request, type: "decline" })
                            }}
                          >
                            Decline
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                          onClick={() => setViewTarget(request)}
                        >
                          <Eye className="mr-1 size-3" />
                          View
                        </Button>
                      )}
                    </div>
                  </article>
                )
              })
            ) : (
              <div className="px-4 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Trash2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">
                  {query.isError
                    ? "Deletion requests could not be loaded"
                    : "No deletion requests found"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {query.isError
                    ? "Try loading the directory again."
                    : "Try changing the search or clearing the filters."}
                </p>
              </div>
            )}
          </div>

          <div className="hidden min-h-0 flex-1 overflow-auto md:block">
            <Table mobileLayout="scroll">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <SortableHead
                    column="requester"
                    label="Requester"
                    sort={sort}
                    onSort={toggle}
                    className="min-w-60"
                  />
                  <SortableHead
                    column="kind"
                    label="Account type"
                    sort={sort}
                    onSort={toggle}
                    className="w-40"
                  />
                  <PlainHead label="Reason for deletion" className="min-w-64 max-w-sm" />
                  <SortableHead
                    column="requestedAt"
                    label="Requested at"
                    sort={sort}
                    onSort={toggle}
                    className="w-40"
                  />
                  <SortableHead
                    column="status"
                    label="Status"
                    sort={sort}
                    onSort={toggle}
                    className="w-36"
                  />
                  <PlainHead label="Actions" align="right" className="w-44" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {query.isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`loading-${index}`}>
                      <TableCell colSpan={6} className="h-16">
                        <div className="h-4 w-full animate-pulse rounded bg-muted" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedRequests.length > 0 ? (
                  paginatedRequests.map((request) => {
                    const displayName = getDisplayName(request)
                    const kind = KIND[request.kind] ?? KIND.LEARNER
                    const status = STATUS[request.status] ?? STATUS.PENDING
                    const isPending = request.status === "PENDING"

                    return (
                      <TableRow
                        key={request.requestId}
                        className={cn("transition-colors", !isPending && "opacity-85")}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-xs font-bold text-primary">
                              {getInitials(displayName)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-foreground">
                                {displayName}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">{request.email}</p>
                              {request.kind !== "INSTITUTION" && request.institutionName ? (
                                <p className="truncate text-[11px] text-muted-foreground">
                                  {request.institutionName}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className={cn("text-xs font-semibold", kind.tone)}>
                            {kind.label}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {request.reason ? (
                            <p
                              className="max-w-sm truncate rounded border-l-2 border-border bg-muted/40 px-2 py-1 font-mono text-xs text-foreground/90"
                              title={request.reason}
                            >
                              "{request.reason}"
                            </p>
                          ) : (
                            <span className="text-xs italic text-muted-foreground">
                              No reason provided
                            </span>
                          )}
                          {isPending && !request.accountExists ? (
                            <p className="mt-1 text-[11px] text-muted-foreground italic">
                              Account no longer exists in system.
                            </p>
                          ) : null}
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatWhen(request.requestedAt)}
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className={cn("text-xs font-bold", status.tone)}>
                            {status.label}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 gap-1 text-xs font-semibold"
                                onClick={() => {
                                  setNote("")
                                  setActionTarget({ request, type: "approve" })
                                }}
                              >
                                <Trash2 className="size-3" />
                                <span>Delete</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs font-semibold"
                                onClick={() => {
                                  setNote("")
                                  setActionTarget({ request, type: "decline" })
                                }}
                              >
                                Decline
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                              onClick={() => setViewTarget(request)}
                            >
                              <Eye className="size-3.5" />
                              <span>View</span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                          <Trash2 className="h-5 w-5 text-muted-foreground" />
                        </div>

                        <p className="mt-4 text-sm font-semibold">
                          {query.isError
                            ? "Deletion requests could not be loaded"
                            : "No deletion requests found"}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {query.isError
                            ? "Try loading the directory again."
                            : "Try changing the search or clearing the filters."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <TablePagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            rangeStart={visibleStart}
            rangeEnd={visibleEnd}
            total={sortedRequests.length}
            unit="requests"
          />
        </TableCard>
      </div>

      <AlertDialog
        open={actionTarget != null}
        onOpenChange={(open) => {
          if (!decideMutation.isPending && !open) {
            setActionTarget(null)
            setNote("")
          }
        }}
      >
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xl text-card-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-lg font-bold text-foreground sm:text-xl">
              {actionTarget?.type === "approve"
                ? `Delete ${actionTarget.request.email}?`
                : `Decline deletion request?`}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {actionTarget?.type === "approve"
                ? `This permanently deletes ${KIND[actionTarget.request.kind]?.scope ?? "the account"}. It cannot be undone.`
                : "The account stays active, and the user is notified with your note explaining why."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 py-2">
            <label htmlFor="action-note" className="text-xs font-semibold text-foreground">
              {actionTarget?.type === "approve"
                ? "Note for the record (optional):"
                : "Reason shown to the user (optional):"}
            </label>
            <Textarea
              id="action-note"
              value={note}
              maxLength={1000}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                actionTarget?.type === "approve"
                  ? "Audit note for compliance..."
                  : "Explain why this request is declined..."
              }
              className="min-h-20 resize-none text-xs sm:text-sm bg-muted/30 border-border/80 text-foreground"
            />
            <p className="text-right text-[11px] text-muted-foreground tabular-nums">
              {note.length}/1000
            </p>
          </div>

          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row pt-1">
            <AlertDialogCancel disabled={decideMutation.isPending} className="w-full text-xs sm:w-auto h-9">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant={actionTarget?.type === "approve" ? "destructive" : "default"}
              disabled={decideMutation.isPending}
              onClick={(e) => {
                e.preventDefault()
                if (actionTarget) {
                  decideMutation.mutate({
                    requestId: actionTarget.request.requestId,
                    type: actionTarget.type,
                    note,
                  })
                }
              }}
              className={cn(
                "w-full gap-1.5 text-xs font-semibold sm:w-auto h-9",
                actionTarget?.type === "approve"
                  ? "bg-destructive text-white hover:bg-destructive/90"
                  : ""
              )}
            >
              {decideMutation.isPending ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : actionTarget?.type === "approve" ? (
                <Trash2 className="size-3.5" />
              ) : (
                <CheckIcon className="size-3.5" />
              )}
              <span>
                {decideMutation.isPending
                  ? "Saving..."
                  : actionTarget?.type === "approve"
                    ? "Delete permanently"
                    : "Confirm decline"}
              </span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={viewTarget != null}
        onOpenChange={(open) => {
          if (!open) setViewTarget(null)
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-4rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xl text-card-foreground">
          <DialogHeader className="gap-1.5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <Trash2 className="size-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="font-heading text-lg font-bold text-foreground sm:text-xl">
                  Deletion Request Details
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-xs text-muted-foreground truncate">
                  Requested by <span className="font-semibold text-foreground">{viewTarget ? getDisplayName(viewTarget) : ""}</span> · {viewTarget?.email}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {viewTarget && (() => {
            const kind = KIND[viewTarget.kind] ?? KIND.LEARNER
            const status = STATUS[viewTarget.status] ?? STATUS.PENDING

            return (
              <div className="space-y-4 py-2 text-sm">
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/70 bg-muted/20 p-3.5">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Account Type
                    </span>
                    <div>
                      <Badge variant="outline" className={cn("text-xs font-semibold px-2 py-0.5", kind.tone)}>
                        {kind.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1 text-right">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Request Status
                    </span>
                    <div>
                      <Badge variant="outline" className={cn("text-xs font-bold px-2 py-0.5", status.tone)}>
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                </div>

                {viewTarget.reason ? (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-foreground">
                      User's Stated Reason:
                    </span>
                    <div className="rounded-xl border border-border/80 bg-muted/40 p-3.5 text-xs sm:text-sm leading-relaxed text-foreground break-words whitespace-pre-wrap font-sans">
                      {viewTarget.reason}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2.5 rounded-xl border border-border/70 bg-muted/20 p-3.5 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="font-semibold text-foreground">Requested:</span>
                    <span className="tabular-nums font-medium text-foreground/90">{formatWhen(viewTarget.requestedAt)}</span>
                  </div>
                  {viewTarget.reviewedAt ? (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-semibold text-foreground">Reviewed:</span>
                      <span className="tabular-nums font-medium text-foreground/90">{formatWhen(viewTarget.reviewedAt)}</span>
                    </div>
                  ) : null}
                  {viewTarget.adminNote ? (
                    <div className="mt-2 rounded-lg border border-border/70 bg-background/60 p-2.5">
                      <p className="font-semibold text-foreground mb-0.5">Admin Review Note:</p>
                      <p className="text-foreground/90 leading-relaxed break-words">{viewTarget.adminNote}</p>
                    </div>
                  ) : (
                    <p className="pt-0.5 italic text-muted-foreground">No admin notes were recorded.</p>
                  )}
                </div>
              </div>
            )
          })()}

          <DialogFooter className="pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewTarget(null)}
              className="w-full text-xs sm:w-auto h-9 px-4 font-medium"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
