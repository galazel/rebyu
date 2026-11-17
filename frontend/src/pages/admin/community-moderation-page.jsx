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
  CheckCircle2,
  ChevronsUpDownIcon,
  Eye,
  EyeOffIcon,
  Loader2Icon,
  ShieldAlert,
  XCircle,
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
import { cn } from "@/lib/utils"
import {
  getCommunityReports,
  hideCommunityPost,
  reviewCommunityReport,
} from "@/services/adminCommunityService"

const ALL_FILTER = "ALL"

const STATUS_CONFIG = {
  OPEN: {
    label: "Open",
    tone: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-300",
  },
  RESOLVED: {
    label: "Resolved",
    tone: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  DISMISSED: {
    label: "Dismissed",
    tone: "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
  },
}

const REASON_CONFIG = {
  SPAM: {
    label: "Spam",
    tone: "border-amber-300/80 bg-amber-50 text-amber-800 dark:border-amber-600/40 dark:bg-amber-950/30 dark:text-amber-300",
  },
  HARASSMENT: {
    label: "Harassment",
    tone: "border-rose-300/80 bg-rose-50 text-rose-800 dark:border-rose-600/40 dark:bg-rose-950/30 dark:text-rose-300",
  },
  INAPPROPRIATE: {
    label: "Inappropriate",
    tone: "border-red-300/80 bg-red-50 text-red-800 dark:border-red-600/40 dark:bg-red-950/30 dark:text-red-300",
  },
  HATE_SPEECH: {
    label: "Hate speech",
    tone: "border-red-400 bg-red-100 text-red-900 dark:border-red-500/50 dark:bg-red-950/50 dark:text-red-200",
  },
  MISINFORMATION: {
    label: "Misinformation",
    tone: "border-purple-300/80 bg-purple-50 text-purple-800 dark:border-purple-600/40 dark:bg-purple-950/30 dark:text-purple-300",
  },
  OTHER: {
    label: "Other",
    tone: "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
  },
}

function formatReason(reason) {
  if (!reason) return "Unspecified"
  const upper = String(reason).toUpperCase()
  return REASON_CONFIG[upper]?.label ?? upper.replaceAll("_", " ")
}

function getReasonTone(reason) {
  if (!reason) return ""
  const upper = String(reason).toUpperCase()
  return REASON_CONFIG[upper]?.tone ?? ""
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
 * Community moderation directory for administrators:
 * Review flagged posts, resolve complaints, and remove harmful community content.
 */
export default function CommunityModeration() {
  const client = useQueryClient()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("OPEN")
  const [reasonFilter, setReasonFilter] = useState(ALL_FILTER)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { sort, setSort, toggle, sortRows } = useTableSort()

  // Modal states
  const [actionTarget, setActionTarget] = useState(null) // { report, type: "RESOLVED" | "DISMISSED" | "hide" }
  const [viewTarget, setViewTarget] = useState(null) // report for inspection

  // Fetch reports across all statuses
  const openQuery = useQuery({
    queryKey: ["community-reports", "OPEN"],
    queryFn: () => getCommunityReports("OPEN"),
    refetchInterval: 30_000,
  })

  const resolvedQuery = useQuery({
    queryKey: ["community-reports", "RESOLVED"],
    queryFn: () => getCommunityReports("RESOLVED"),
    refetchInterval: 60_000,
  })

  const dismissedQuery = useQuery({
    queryKey: ["community-reports", "DISMISSED"],
    queryFn: () => getCommunityReports("DISMISSED"),
    refetchInterval: 60_000,
  })

  const refresh = () => client.invalidateQueries({ queryKey: ["community-reports"] })

  const reviewMutation = useMutation({
    mutationFn: ({ id, action }) => reviewCommunityReport(id, action),
    onSuccess: (_data, variables) => {
      refresh()
      toast.success(
        variables.action === "RESOLVED"
          ? "Report marked as resolved."
          : "Report dismissed."
      )
      setActionTarget(null)
    },
    onError: () => toast.error("Could not update the report. Please try again."),
  })

  const hidePostMutation = useMutation({
    mutationFn: (postId) => hideCommunityPost(postId),
    onSuccess: () => {
      refresh()
      toast.success("Post hidden from community feed.")
      setActionTarget(null)
    },
    onError: () => toast.error("Could not hide the post. Please try again."),
  })

  const openReports = useMemo(
    () => (Array.isArray(openQuery.data) ? openQuery.data : []),
    [openQuery.data]
  )
  const resolvedReports = useMemo(
    () => (Array.isArray(resolvedQuery.data) ? resolvedQuery.data : []),
    [resolvedQuery.data]
  )
  const dismissedReports = useMemo(
    () => (Array.isArray(dismissedQuery.data) ? dismissedQuery.data : []),
    [dismissedQuery.data]
  )

  const allReports = useMemo(() => {
    return [...openReports, ...resolvedReports, ...dismissedReports]
  }, [openReports, resolvedReports, dismissedReports])

  const scopedReports = useMemo(() => {
    if (statusFilter === "OPEN") return openReports
    if (statusFilter === "RESOLVED") return resolvedReports
    if (statusFilter === "DISMISSED") return dismissedReports
    return allReports
  }, [statusFilter, openReports, resolvedReports, dismissedReports, allReports])

  // Filtering
  const filteredReports = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return scopedReports.filter((report) => {
      // Reason filter
      if (reasonFilter !== ALL_FILTER && report.reason?.toUpperCase() !== reasonFilter) {
        return false
      }

      // Search query
      if (needle) {
        const reasonText = formatReason(report.reason)
        const matches = [
          report.postTitle,
          report.authorName,
          report.reporterName,
          report.details,
          reasonText,
        ]
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(needle))

        if (!matches) return false
      }

      return true
    })
  }, [scopedReports, search, reasonFilter])

  // Sorting
  const sortedReports = useMemo(
    () =>
      sortRows(filteredReports, {
        post: (r) => r.postTitle?.toLowerCase() ?? "",
        reporter: (r) => r.reporterName?.toLowerCase() ?? "",
        reason: (r) => formatReason(r.reason),
        status: (r) => r.status ?? "",
        createdAt: (r) => (r.createdAt ? new Date(r.createdAt).getTime() : 0),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredReports, sort]
  )

  const totalPages = Math.max(1, Math.ceil(sortedReports.length / pageSize))

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, reasonFilter, pageSize])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedReports.slice(start, start + pageSize)
  }, [currentPage, pageSize, sortedReports])

  const visibleStart = sortedReports.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const visibleEnd = Math.min(currentPage * pageSize, sortedReports.length)

  const isAnyLoading = openQuery.isLoading || resolvedQuery.isLoading || dismissedQuery.isLoading
  const isAnyError = openQuery.isError || resolvedQuery.isError || dismissedQuery.isError

  return (
    <section className="admin-directory flex min-h-0 w-full flex-1 flex-col gap-6">
      <DirectoryHeader
        title="Community moderation"
        description="Review reports submitted by learners regarding community questions, discussions, and replies. Take action to resolve issues, hide harmful posts, or dismiss invalid flags."
        stats={[
          {
            label: "All reports",
            value: allReports.length,
            hint: "Total across platform",
            active: statusFilter === ALL_FILTER,
            onSelect: () => setStatusFilter(ALL_FILTER),
          },
          {
            label: "Open reports",
            value: openReports.length,
            hint: "Needs review",
            active: statusFilter === "OPEN",
            onSelect: () => setStatusFilter("OPEN"),
          },
          {
            label: "Resolved",
            value: resolvedReports.length,
            hint: "Addressed reports",
            active: statusFilter === "RESOLVED",
            onSelect: () => setStatusFilter("RESOLVED"),
          },
          {
            label: "Dismissed",
            value: dismissedReports.length,
            hint: "Dismissed flags",
            active: statusFilter === "DISMISSED",
            onSelect: () => setStatusFilter("DISMISSED"),
          },
        ]}
      >
        <ExportButton
          filename="rebyu-admin-community-reports"
          report="Community reports"
          details={() => [
            ["Reports in file", `${sortedReports.length} of ${allReports.length}`],
            ["Status filter", statusFilter],
            ["Reason filter", reasonFilter],
          ]}
          className="w-full sm:w-auto"
          disabled={sortedReports.length === 0}
          sections={() => [
            {
              title: "Community reports",
              columns: [
                "Post title",
                "Author",
                "Reporter",
                "Reason",
                "Details",
                "Status",
                "Reported at",
              ],
              rows: sortedReports.map((r) => [
                r.postTitle,
                r.authorName,
                r.reporterName,
                formatReason(r.reason),
                r.details ?? "",
                r.status,
                formatWhen(r.createdAt),
              ]),
            },
          ]}
        />
      </DirectoryHeader>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <TableCard className="flex min-h-0 flex-1 flex-col bg-card bg-none">
          <DirectoryResults
            title="Reported community posts"
            count={sortedReports.length}
            filtered={Boolean(search || statusFilter !== ALL_FILTER || reasonFilter !== ALL_FILTER)}
            onReset={() => {
              setSearch("")
              setStatusFilter(ALL_FILTER)
              setReasonFilter(ALL_FILTER)
            }}
            error={isAnyError}
            onRetry={refresh}
          />

          <TableToolbar
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search post, author, reporter, or reason"
          >
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 flex-1 sm:w-40" aria-label="Filter by status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER}>All statuses</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="DISMISSED">Dismissed</SelectItem>
                </SelectContent>
              </Select>

              {/* Reason Filter */}
              <Select value={reasonFilter} onValueChange={setReasonFilter}>
                <SelectTrigger className="h-9 flex-1 sm:w-44" aria-label="Filter by reason">
                  <SelectValue placeholder="All reasons" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER}>All reasons</SelectItem>
                  <SelectItem value="SPAM">Spam</SelectItem>
                  <SelectItem value="HARASSMENT">Harassment</SelectItem>
                  <SelectItem value="INAPPROPRIATE">Inappropriate</SelectItem>
                  <SelectItem value="HATE_SPEECH">Hate speech</SelectItem>
                  <SelectItem value="MISINFORMATION">Misinformation</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>

              {/* Mobile Sort Dropdown */}
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
                <SelectTrigger className="h-9 flex-1 sm:w-36 md:hidden" aria-label="Sort reports">
                  <ChevronsUpDownIcon className="mr-1.5 size-3.5 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default order</SelectItem>
                  <SelectItem value="createdAt-desc">Reported (Newest)</SelectItem>
                  <SelectItem value="createdAt-asc">Reported (Oldest)</SelectItem>
                  <SelectItem value="post-asc">Post title (A–Z)</SelectItem>
                  <SelectItem value="reporter-asc">Reporter (A–Z)</SelectItem>
                  <SelectItem value="reason-asc">Reason</SelectItem>
                  <SelectItem value="status-asc">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TableToolbar>

          {/* Mobile Cards View: Compact & Aesthetic */}
          <div className="divide-y divide-border/60 md:hidden">
            {isAnyLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={`mobile-loading-${index}`} className="space-y-2.5 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-7 w-full animate-pulse rounded bg-muted/60" />
                </div>
              ))
            ) : paginatedReports.length > 0 ? (
              paginatedReports.map((report) => {
                const isOpen = report.status === "OPEN"
                const statusStyle = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.OPEN

                return (
                  <article
                    key={report.reportId}
                    className={cn(
                      "space-y-2 p-3 transition-colors hover:bg-muted/20 sm:p-3.5",
                      !isOpen && "opacity-85"
                    )}
                  >
                    {/* Row 1: Post Title & Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">
                          {report.postTitle}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          by <span className="font-medium text-foreground/80">{report.authorName}</span>
                        </p>
                      </div>

                      <div className="shrink-0">
                        <Badge
                          variant="outline"
                          className={cn("text-[11px] font-bold", statusStyle.tone)}
                        >
                          {statusStyle.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Row 2: Reason Pill + Reporter + Timestamp */}
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] font-semibold", getReasonTone(report.reason))}
                        >
                          {formatReason(report.reason)}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          · Flagged by {report.reporterName}
                        </span>
                      </div>

                      <span className="text-[11px] text-muted-foreground">
                        {formatWhen(report.createdAt)}
                      </span>
                    </div>

                    {/* Row 3: Report details snippet */}
                    {report.details ? (
                      <blockquote className="truncate rounded border-l-2 border-border bg-muted/40 px-2 py-1 font-mono text-xs text-foreground/90">
                        "{report.details}"
                      </blockquote>
                    ) : null}

                    {/* Row 4: Action Buttons for Open or View for Closed */}
                    <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-1.5">
                      <span className="text-[11px] text-muted-foreground">
                        {isOpen ? "Action needed" : `Report ${report.status.toLowerCase()}`}
                      </span>

                      {isOpen ? (
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs font-semibold"
                            onClick={() => setActionTarget({ report, type: "DISMISSED" })}
                          >
                            <XCircle className="mr-1 size-3" />
                            Dismiss
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2 text-xs font-semibold shadow-2xs"
                            onClick={() => setActionTarget({ report, type: "hide" })}
                          >
                            Hide post
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 gap-1 bg-emerald-600 px-2 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700"
                            onClick={() => setActionTarget({ report, type: "RESOLVED" })}
                          >
                            <CheckCircle2 className="size-3" />
                            Resolve
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                          onClick={() => setViewTarget(report)}
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
                  <ShieldAlert className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">
                  {isAnyError ? "Reports could not be loaded" : "No community reports found"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isAnyError
                    ? "Try loading the directory again."
                    : "Try changing the search or clearing the filters."}
                </p>
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden min-h-0 flex-1 overflow-auto md:block">
            <Table mobileLayout="scroll">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <SortableHead
                    column="post"
                    label="Post"
                    sort={sort}
                    onSort={toggle}
                    className="min-w-60"
                  />
                  <SortableHead
                    column="reporter"
                    label="Reporter"
                    sort={sort}
                    onSort={toggle}
                    className="w-40"
                  />
                  <SortableHead
                    column="reason"
                    label="Reason"
                    sort={sort}
                    onSort={toggle}
                    className="w-36"
                  />
                  <PlainHead label="Details" className="min-w-56 max-w-sm" />
                  <SortableHead
                    column="createdAt"
                    label="Reported at"
                    sort={sort}
                    onSort={toggle}
                    className="w-40"
                  />
                  <SortableHead
                    column="status"
                    label="Status"
                    sort={sort}
                    onSort={toggle}
                    className="w-32"
                  />
                  <PlainHead label="Actions" align="right" className="w-64" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {isAnyLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`loading-${index}`}>
                      <TableCell colSpan={7} className="h-16">
                        <div className="h-4 w-full animate-pulse rounded bg-muted" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedReports.length > 0 ? (
                  paginatedReports.map((report) => {
                    const isOpen = report.status === "OPEN"
                    const statusStyle = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.OPEN

                    return (
                      <TableRow
                        key={report.reportId}
                        className={cn("transition-colors", !isOpen && "opacity-85")}
                      >
                        <TableCell>
                          <p className="font-bold text-foreground">{report.postTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            by <span className="font-medium text-foreground/80">{report.authorName}</span>
                          </p>
                        </TableCell>

                        <TableCell className="text-sm text-foreground">
                          {report.reporterName}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("text-xs font-semibold", getReasonTone(report.reason))}
                          >
                            {formatReason(report.reason)}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {report.details ? (
                            <p
                              className="max-w-sm truncate rounded border-l-2 border-border bg-muted/40 px-2 py-1 font-mono text-xs text-foreground/90"
                              title={report.details}
                            >
                              "{report.details}"
                            </p>
                          ) : (
                            <span className="text-xs italic text-muted-foreground">
                              No details provided
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatWhen(report.createdAt)}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("text-xs font-bold", statusStyle.tone)}
                          >
                            {statusStyle.label}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          {isOpen ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 text-xs font-semibold"
                                onClick={() => setActionTarget({ report, type: "DISMISSED" })}
                              >
                                <XCircle className="size-3" />
                                <span>Dismiss</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 gap-1 text-xs font-semibold"
                                onClick={() => setActionTarget({ report, type: "hide" })}
                              >
                                <span>Hide post</span>
                              </Button>
                              <Button
                                size="sm"
                                className="h-8 gap-1 bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
                                onClick={() => setActionTarget({ report, type: "RESOLVED" })}
                              >
                                <CheckCircle2 className="size-3.5" />
                                <span>Resolve</span>
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                              onClick={() => setViewTarget(report)}
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
                    <TableCell colSpan={7} className="h-64 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                          <ShieldAlert className="h-5 w-5 text-muted-foreground" />
                        </div>

                        <p className="mt-4 text-sm font-semibold">
                          {isAnyError ? "Reports could not be loaded" : "No community reports found"}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {isAnyError
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
            total={sortedReports.length}
            unit="reports"
          />
        </TableCard>
      </div>

      {/* Action Confirmation Modal (Resolve, Dismiss, Hide post) */}
      <AlertDialog
        open={actionTarget != null}
        onOpenChange={(open) => !open && setActionTarget(null)}
      >
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-lg rounded-xl p-5 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-foreground">
              {actionTarget?.type === "hide"
                ? "Hide this post from the community feed?"
                : actionTarget?.type === "RESOLVED"
                  ? "Mark report as resolved?"
                  : "Dismiss this report?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              {actionTarget?.type === "hide"
                ? `This removes "${actionTarget?.report.postTitle}" by ${actionTarget?.report.authorName} from public community view. Other learners will no longer see it.`
                : actionTarget?.type === "RESOLVED"
                  ? `Confirm that the issue regarding "${actionTarget?.report.postTitle}" flagged by ${actionTarget?.report.reporterName} has been addressed.`
                  : `Dismiss the report filed by ${actionTarget?.report.reporterName}. The post remains publicly visible.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <AlertDialogCancel
              disabled={reviewMutation.isPending || hidePostMutation.isPending}
              className="w-full text-xs sm:w-auto"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant={actionTarget?.type === "hide" ? "destructive" : "default"}
              disabled={reviewMutation.isPending || hidePostMutation.isPending}
              onClick={(e) => {
                e.preventDefault()
                if (!actionTarget) return
                if (actionTarget.type === "hide") {
                  hidePostMutation.mutate(actionTarget.report.postId)
                } else {
                  reviewMutation.mutate({
                    id: actionTarget.report.reportId,
                    action: actionTarget.type,
                  })
                }
              }}
              className={cn(
                "w-full gap-1.5 text-xs font-semibold sm:w-auto",
                actionTarget?.type === "hide"
                  ? "bg-destructive text-white hover:bg-destructive/90"
                  : actionTarget?.type === "RESOLVED"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : ""
              )}
            >
              {reviewMutation.isPending || hidePostMutation.isPending ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : actionTarget?.type === "hide" ? (
                <EyeOffIcon className="size-3.5" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
              <span>
                {actionTarget?.type === "hide"
                  ? "Hide post"
                  : actionTarget?.type === "RESOLVED"
                    ? "Confirm resolution"
                    : "Confirm dismissal"}
              </span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Details View Modal */}
      <Dialog open={viewTarget != null} onOpenChange={(open) => !open && setViewTarget(null)}>
        <DialogContent className="max-h-[calc(100dvh-4rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Report details
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Reported on {formatWhen(viewTarget?.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {viewTarget && (
            <div className="space-y-4 py-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-medium text-muted-foreground">Reason</span>
                  <div>
                    <Badge
                      variant="outline"
                      className={cn("text-xs font-semibold", getReasonTone(viewTarget.reason))}
                    >
                      {formatReason(viewTarget.reason)}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-0.5 text-right">
                  <span className="text-[11px] font-medium text-muted-foreground">Status</span>
                  <div>
                    <Badge
                      variant="outline"
                      className={cn("text-xs font-bold", STATUS_CONFIG[viewTarget.status]?.tone)}
                    >
                      {viewTarget.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-foreground">Post title:</span>
                <p className="font-semibold text-foreground">{viewTarget.postTitle}</p>
                <p className="text-xs text-muted-foreground">Author: {viewTarget.authorName}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-foreground">Reporter details:</span>
                <p className="text-xs text-foreground">Filed by: {viewTarget.reporterName}</p>
                {viewTarget.details ? (
                  <blockquote className="mt-1 break-words whitespace-pre-wrap rounded-lg border-l-4 border-border bg-muted/60 p-3 font-mono text-xs leading-relaxed text-foreground">
                    {viewTarget.details}
                  </blockquote>
                ) : (
                  <p className="text-xs italic text-muted-foreground">No additional details filed.</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewTarget(null)}
              className="w-full text-xs sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
