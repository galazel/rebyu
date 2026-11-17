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
  CheckIcon,
  ChevronsUpDownIcon,
  Eye,
  Loader2Icon,
  ShieldAlert,
} from "@/components/icons"
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
import { SAFETY_KIND } from "@/components/institution/safety-alert-kinds.js"
import { cn } from "@/lib/utils"
import { base } from "@/services/base"

const SURFACE = {
  chat: "AI tutor chat",
  dialogue: "Guided Dialogue",
  live: "Live Tutor",
}

const QUERY_KEY = "admin-safety-alerts"
const ALL_FILTER = "ALL"

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
  return String(name || "Learner")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}

/**
 * AI tutor safety alert management directory for platform administrators:
 * Monitors self-harm disclosures, abuse disclosures, violence threats, and data probes.
 */
export default function SafetyAlertsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("OPEN")
  const [kindFilter, setKindFilter] = useState(ALL_FILTER)
  const [surfaceFilter, setSurfaceFilter] = useState(ALL_FILTER)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { sort, setSort, toggle, sortRows } = useTableSort()

  const [selectedAlert, setSelectedAlert] = useState(null)
  const [reviewNote, setReviewNote] = useState("")

  const query = useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => base("admin/safety-alerts?openOnly=false"),
    refetchInterval: 30_000,
  })

  const alerts = useMemo(() => (Array.isArray(query.data) ? query.data : []), [query.data])

  const reviewMutation = useMutation({
    mutationFn: ({ alertId, note }) =>
      base(`admin/safety-alerts/${alertId}/review`, {
        method: "POST",
        data: { note },
      }),
    onSuccess: () => {
      toast.success("Safety alert marked as followed up.")
      setSelectedAlert(null)
      setReviewNote("")
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
    onError: () => toast.error("Could not save the review. Please try again."),
  })

  // Quick stats
  const openCount = useMemo(() => alerts.filter((a) => a.status === "OPEN").length, [alerts])
  const reviewedCount = useMemo(() => alerts.filter((a) => a.status !== "OPEN").length, [alerts])
  const threatCount = useMemo(() => alerts.filter((a) => a.kind === "THREAT").length, [alerts])
  const wellbeingCount = useMemo(
    () => alerts.filter((a) => a.kind === "SELF_HARM" || a.kind === "ABUSE").length,
    [alerts]
  )

  // Filtering
  const filteredAlerts = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return alerts.filter((alert) => {
      // Status filter
      if (statusFilter === "OPEN" && alert.status !== "OPEN") return false
      if (statusFilter === "REVIEWED" && alert.status === "OPEN") return false

      // Kind filter
      if (kindFilter !== ALL_FILTER && alert.kind !== kindFilter) return false

      // Surface filter
      if (surfaceFilter !== ALL_FILTER && alert.surface !== surfaceFilter) return false

      // Search query
      if (needle) {
        const kindLabel = SAFETY_KIND[alert.kind]?.label ?? ""
        const surfaceLabel = SURFACE[alert.surface] ?? ""
        const matches = [
          alert.learnerName,
          alert.learnerUsername,
          alert.message,
          alert.reviewNote,
          kindLabel,
          surfaceLabel,
        ]
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(needle))

        if (!matches) return false
      }

      return true
    })
  }, [alerts, search, statusFilter, kindFilter, surfaceFilter])

  // Sorting
  const sortedAlerts = useMemo(
    () =>
      sortRows(filteredAlerts, {
        learner: (a) => a.learnerName?.toLowerCase() ?? "",
        kind: (a) => SAFETY_KIND[a.kind]?.label ?? a.kind ?? "",
        surface: (a) => SURFACE[a.surface] ?? a.surface ?? "",
        createdAt: (a) => (a.createdAt ? new Date(a.createdAt).getTime() : 0),
        status: (a) => (a.status === "OPEN" ? 0 : 1),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredAlerts, sort]
  )

  const totalPages = Math.max(1, Math.ceil(sortedAlerts.length / pageSize))

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, kindFilter, surfaceFilter, pageSize])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  const paginatedAlerts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedAlerts.slice(start, start + pageSize)
  }, [currentPage, pageSize, sortedAlerts])

  const visibleStart = sortedAlerts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const visibleEnd = Math.min(currentPage * pageSize, sortedAlerts.length)

  return (
    <section className="admin-directory flex min-h-0 w-full flex-1 flex-col gap-6">
      <DirectoryHeader
        title="Safety alerts"
        description="Review AI tutor safety alerts raised by learners on the platform, including self-harm concerns, threats, abuse disclosures, and unauthorized data probes."
        stats={[
          {
            label: "All alerts",
            value: alerts.length,
            hint: "Total recorded",
            active: statusFilter === ALL_FILTER && kindFilter === ALL_FILTER,
            onSelect: () => {
              setStatusFilter(ALL_FILTER)
              setKindFilter(ALL_FILTER)
            },
          },
          {
            label: "Needs follow-up",
            value: openCount,
            hint: "Urgent safeguarding",
            active: statusFilter === "OPEN",
            onSelect: () => {
              setStatusFilter("OPEN")
              setKindFilter(ALL_FILTER)
            },
          },
          {
            label: "Followed up",
            value: reviewedCount,
            hint: "Resolved cases",
            active: statusFilter === "REVIEWED",
            onSelect: () => {
              setStatusFilter("REVIEWED")
              setKindFilter(ALL_FILTER)
            },
          },
          {
            label: "Threats of violence",
            value: threatCount,
            hint: "Immediate review",
            active: kindFilter === "THREAT",
            onSelect: () => {
              setKindFilter("THREAT")
              setStatusFilter(ALL_FILTER)
            },
          },
        ]}
      >
        <ExportButton
          filename="rebyu-admin-safety-alerts"
          report="Safety alerts"
          details={() => [
            ["Alerts in file", `${sortedAlerts.length} of ${alerts.length}`],
            ["Status filter", statusFilter],
            ["Category filter", kindFilter],
          ]}
          className="w-full sm:w-auto"
          disabled={sortedAlerts.length === 0}
          sections={() => [
            {
              title: "Safety alerts",
              columns: [
                "Learner",
                "Username",
                "Category",
                "Surface",
                "Triggered message",
                "Status",
                "Date raised",
                "Followed up at",
                "Review note",
              ],
              rows: sortedAlerts.map((a) => [
                a.learnerName,
                a.learnerUsername ? `@${a.learnerUsername}` : "",
                SAFETY_KIND[a.kind]?.label ?? a.kind,
                SURFACE[a.surface] ?? a.surface,
                a.message ?? "",
                a.status === "OPEN" ? "Needs follow-up" : "Followed up",
                formatWhen(a.createdAt),
                formatWhen(a.reviewedAt),
                a.reviewNote ?? "",
              ]),
            },
          ]}
        />
      </DirectoryHeader>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <TableCard className="flex min-h-0 flex-1 flex-col">
          <DirectoryResults
            title="Safety alert inbox"
            count={sortedAlerts.length}
            filtered={Boolean(
              search ||
                statusFilter !== ALL_FILTER ||
                kindFilter !== ALL_FILTER ||
                surfaceFilter !== ALL_FILTER
            )}
            onReset={() => {
              setSearch("")
              setStatusFilter(ALL_FILTER)
              setKindFilter(ALL_FILTER)
              setSurfaceFilter(ALL_FILTER)
            }}
            error={query.isError}
            onRetry={() => query.refetch()}
          />

          <TableToolbar
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search learner, username, or message"
          >
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 flex-1 sm:w-40" aria-label="Filter by status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER}>All statuses</SelectItem>
                  <SelectItem value="OPEN">Needs follow-up</SelectItem>
                  <SelectItem value="REVIEWED">Followed up</SelectItem>
                </SelectContent>
              </Select>

              {/* Category / Kind Filter */}
              <Select value={kindFilter} onValueChange={setKindFilter}>
                <SelectTrigger className="h-9 flex-1 sm:w-48" aria-label="Filter by category">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER}>All categories</SelectItem>
                  <SelectItem value="SELF_HARM">Wellbeing: self-harm</SelectItem>
                  <SelectItem value="ABUSE">Wellbeing: abuse disclosure</SelectItem>
                  <SelectItem value="THREAT">Threat of violence</SelectItem>
                  <SelectItem value="DATA_PROBE">Data access attempt</SelectItem>
                </SelectContent>
              </Select>

              {/* Surface Filter */}
              <Select value={surfaceFilter} onValueChange={setSurfaceFilter}>
                <SelectTrigger className="h-9 flex-1 sm:w-36" aria-label="Filter by surface">
                  <SelectValue placeholder="All surfaces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER}>All surfaces</SelectItem>
                  <SelectItem value="chat">AI tutor chat</SelectItem>
                  <SelectItem value="dialogue">Guided Dialogue</SelectItem>
                  <SelectItem value="live">Live Tutor</SelectItem>
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
                <SelectTrigger className="h-9 flex-1 sm:w-36 md:hidden" aria-label="Sort safety alerts">
                  <ChevronsUpDownIcon className="mr-1.5 size-3.5 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default order</SelectItem>
                  <SelectItem value="createdAt-desc">Date raised (Newest)</SelectItem>
                  <SelectItem value="createdAt-asc">Date raised (Oldest)</SelectItem>
                  <SelectItem value="learner-asc">Learner (A–Z)</SelectItem>
                  <SelectItem value="learner-desc">Learner (Z–A)</SelectItem>
                  <SelectItem value="kind-asc">Category</SelectItem>
                  <SelectItem value="status-asc">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TableToolbar>

          {/* Mobile Cards View: Compact & Aesthetic */}
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
            ) : paginatedAlerts.length > 0 ? (
              paginatedAlerts.map((alert) => {
                const kind = SAFETY_KIND[alert.kind] ?? SAFETY_KIND.THREAT
                const isOpen = alert.status === "OPEN"

                return (
                  <article
                    key={alert.alertId}
                    className={cn(
                      "space-y-2 p-3 transition-colors hover:bg-muted/20 sm:p-3.5",
                      !isOpen && "opacity-85"
                    )}
                  >
                    {/* Row 1: Avatar + Learner Name & Username + Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-xs font-bold text-primary shadow-2xs">
                          {getInitials(alert.learnerName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-foreground">
                            {alert.learnerName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {alert.learnerUsername ? `@${alert.learnerUsername}` : "Learner"}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isOpen ? (
                          <Badge
                            variant="outline"
                            className="border-red-300 bg-red-50 text-[11px] font-bold text-red-700 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-300"
                          >
                            Needs follow-up
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="gap-1 border-emerald-300 bg-emerald-50 text-[11px] font-bold text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-300"
                          >
                            <CheckIcon className="size-3" aria-hidden="true" />
                            Followed up
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Row 2: Category Badge + Surface & Timestamp */}
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs">
                      <Badge variant="outline" className={cn("text-[10px] font-semibold", kind.tone)}>
                        {kind.label}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span>{SURFACE[alert.surface] ?? alert.surface}</span>
                        <span>&bull;</span>
                        <span>{formatWhen(alert.createdAt)}</span>
                      </div>
                    </div>

                    {/* Row 3: Triggered Message Excerpt */}
                    {alert.message ? (
                      <blockquote className="truncate rounded border-l-2 border-border bg-muted/40 px-2 py-1 font-mono text-xs text-foreground/90">
                        "{alert.message}"
                      </blockquote>
                    ) : null}

                    {/* Row 4: Action / Follow-up Status */}
                    <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-1.5">
                      {isOpen ? (
                        <span className="truncate text-[11px] text-muted-foreground">
                          {kind.action ? "Requires safeguarding check" : "Awaiting review"}
                        </span>
                      ) : alert.reviewNote ? (
                        <p className="truncate text-[11px] text-muted-foreground italic max-w-[200px]">
                          <span className="font-semibold not-italic">Note:</span> {alert.reviewNote}
                        </p>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          Reviewed {formatWhen(alert.reviewedAt)}
                        </span>
                      )}

                      <Button
                        size="sm"
                        variant={isOpen ? "outline" : "ghost"}
                        className={cn(
                          "h-7 px-2.5 text-xs font-semibold shadow-2xs",
                          isOpen
                            ? "border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => {
                          setSelectedAlert(alert)
                          setReviewNote(alert.reviewNote ?? "")
                        }}
                      >
                        {isOpen ? "Follow up" : "View"}
                      </Button>
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
                  {query.isError ? "Safety alerts could not be loaded" : "No safety alerts found"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {query.isError
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
                    column="learner"
                    label="Learner"
                    sort={sort}
                    onSort={toggle}
                    className="min-w-56"
                  />
                  <SortableHead
                    column="kind"
                    label="Category"
                    sort={sort}
                    onSort={toggle}
                    className="w-48"
                  />
                  <SortableHead
                    column="surface"
                    label="Surface"
                    sort={sort}
                    onSort={toggle}
                    className="w-36"
                  />
                  <PlainHead label="Triggered message" className="min-w-64 max-w-sm" />
                  <SortableHead
                    column="createdAt"
                    label="Raised at"
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
                  <PlainHead label="Actions" align="right" className="w-28" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {query.isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`loading-${index}`}>
                      <TableCell colSpan={7} className="h-16">
                        <div className="h-4 w-full animate-pulse rounded bg-muted" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedAlerts.length > 0 ? (
                  paginatedAlerts.map((alert) => {
                    const kind = SAFETY_KIND[alert.kind] ?? SAFETY_KIND.THREAT
                    const isOpen = alert.status === "OPEN"

                    return (
                      <TableRow
                        key={alert.alertId}
                        className={cn("transition-colors", !isOpen && "opacity-85")}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-xs font-bold text-primary">
                              {getInitials(alert.learnerName)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-foreground">
                                {alert.learnerName}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {alert.learnerUsername ? `@${alert.learnerUsername}` : "Learner"}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className={cn("text-xs font-semibold", kind.tone)}>
                            {kind.label}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-xs font-medium text-foreground">
                          {SURFACE[alert.surface] ?? alert.surface}
                        </TableCell>

                        <TableCell>
                          {alert.message ? (
                            <p
                              className="max-w-sm truncate rounded border-l-2 border-border bg-muted/40 px-2 py-1 font-mono text-xs text-foreground/90"
                              title={alert.message}
                            >
                              "{alert.message}"
                            </p>
                          ) : (
                            <span className="text-xs italic text-muted-foreground">No excerpt</span>
                          )}
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatWhen(alert.createdAt)}
                        </TableCell>

                        <TableCell>
                          {isOpen ? (
                            <Badge
                              variant="outline"
                              className="border-red-300 bg-red-50 text-xs font-bold text-red-700 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-300"
                            >
                              Needs follow-up
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="gap-1 border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-300"
                            >
                              <CheckIcon className="size-3" aria-hidden="true" />
                              Followed up
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={isOpen ? "outline" : "ghost"}
                            className={cn(
                              "h-8 gap-1.5 text-xs font-semibold",
                              isOpen
                                ? "border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => {
                              setSelectedAlert(alert)
                              setReviewNote(alert.reviewNote ?? "")
                            }}
                          >
                            {isOpen ? (
                              <>Follow up</>
                            ) : (
                              <>
                                <Eye className="size-3.5" />
                                <span>View</span>
                              </>
                            )}
                          </Button>
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
                          {query.isError ? "Safety alerts could not be loaded" : "No safety alerts found"}
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
            total={sortedAlerts.length}
            unit="alerts"
          />
        </TableCard>
      </div>

      {/* Safety Alert Follow-up & Detail Modal */}
      <Dialog
        open={selectedAlert != null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAlert(null)
            setReviewNote("")
          }
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-4rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xl text-card-foreground">
          <DialogHeader className="gap-1.5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/15 text-destructive border border-destructive/25">
                <ShieldAlert className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="font-heading text-lg font-bold text-foreground sm:text-xl">
                  {selectedAlert?.status === "OPEN" ? "Follow Up Safety Alert" : "Safety Alert Details"}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-xs text-muted-foreground truncate">
                  Raised for <span className="font-semibold text-foreground">{selectedAlert?.learnerName}</span> · {formatWhen(selectedAlert?.createdAt)}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedAlert && (() => {
            const kind = SAFETY_KIND[selectedAlert.kind] ?? SAFETY_KIND.THREAT
            const isOpen = selectedAlert.status === "OPEN"

            return (
              <div className="space-y-4 py-2 text-sm">
                {/* Category & Surface Overview */}
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/70 bg-muted/20 p-3.5">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Alert Category
                    </span>
                    <div>
                      <Badge variant="outline" className={cn("text-xs font-semibold px-2 py-0.5", kind.tone)}>
                        {kind.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1 text-right">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Trigger Surface
                    </span>
                    <p className="text-xs font-bold text-foreground">
                      {SURFACE[selectedAlert.surface] ?? selectedAlert.surface}
                    </p>
                  </div>
                </div>

                {/* Safeguarding guidance / Action required */}
                {kind.action && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive dark:text-red-300">
                    <p className="font-bold text-destructive dark:text-red-200">Safeguarding Guidance:</p>
                    <p className="mt-1 leading-relaxed text-foreground/90">{kind.action}</p>
                  </div>
                )}

                {/* Message quote */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Triggered Learner Message:
                  </span>
                  {selectedAlert.message ? (
                    <div className="rounded-xl border border-destructive/30 bg-muted/40 p-3.5 text-xs sm:text-sm leading-relaxed text-foreground break-words whitespace-pre-wrap font-sans">
                      {selectedAlert.message}
                    </div>
                  ) : (
                    <p className="text-xs italic text-muted-foreground">
                      No message excerpt recorded.
                    </p>
                  )}
                </div>

                {/* Follow-up Note Form or Followed Up Info */}
                {isOpen ? (
                  <div className="space-y-2 border-t border-border/70 pt-3">
                    <label htmlFor="followup-note" className="text-xs font-semibold text-foreground">
                      Follow-up Notes (Optional):
                    </label>
                    <Textarea
                      id="followup-note"
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      maxLength={500}
                      placeholder="What action was taken? (e.g. Spoke with learner, referred to school guidance counselor)..."
                      className="min-h-20 resize-none text-xs sm:text-sm bg-muted/30 border-border/80 text-foreground placeholder:text-muted-foreground"
                    />
                    <p className="text-right text-[11px] text-muted-foreground tabular-nums">
                      {reviewNote.length}/500
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 rounded-xl border border-border/70 bg-muted/20 p-3.5 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-semibold text-foreground">Follow-Up Status:</span>
                      <span className="tabular-nums font-medium text-foreground/90">Reviewed {formatWhen(selectedAlert.reviewedAt)}</span>
                    </div>
                    {selectedAlert.reviewNote ? (
                      <div className="mt-2 rounded-lg border border-border/70 bg-background/60 p-2.5">
                        <p className="font-semibold text-foreground mb-0.5">Action Taken / Note:</p>
                        <p className="text-foreground/90 leading-relaxed break-words">{selectedAlert.reviewNote}</p>
                      </div>
                    ) : (
                      <p className="pt-0.5 italic text-muted-foreground">
                        No review notes were attached.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })()}

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedAlert(null)
                setReviewNote("")
              }}
              disabled={reviewMutation.isPending}
              className="w-full text-xs sm:w-auto h-9 px-4 font-medium"
            >
              {selectedAlert?.status === "OPEN" ? "Cancel" : "Close"}
            </Button>

            {selectedAlert?.status === "OPEN" && (
              <Button
                size="sm"
                disabled={reviewMutation.isPending}
                onClick={() => {
                  if (selectedAlert) {
                    reviewMutation.mutate({
                      alertId: selectedAlert.alertId,
                      note: reviewNote,
                    })
                  }
                }}
                className="w-full gap-1.5 bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90 sm:w-auto h-9 px-4"
              >
                {reviewMutation.isPending ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  <CheckIcon className="size-3.5" />
                )}
                <span>Save as followed up</span>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
