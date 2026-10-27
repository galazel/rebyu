import React, { useEffect, useMemo, useState } from "react"
import {
  BookOpenCheck,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Layers3,
  LibraryBig,
  Search,
  Trash2,
  Link,
  StickyNote,
  Network,
  ListChecks,
  Sparkles,
} from "@/components/icons"
import { useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Skeleton } from "@/components/ui/skeleton"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { toast } from "sonner"
import { deleteLibraryItem, getLibraryItems } from "@/services/learnerToolsService"
import { getAllCertifications } from "@/services/certificationService"
import { getLessonById } from "@/services/learnerService.js"
import {
  LearnerEmptyState,
  LearnerPageHeader,
} from "@/components/learner/learner-ui.jsx"
import { categoryClass, GameIcon } from "@/components/learner/tutor-game-kit.jsx"

const ALL_VALUE = "all"

const LIBRARY_ITEMS_KEY = ["library-items"]

const PAGE_SIZE = 10

// Page numbers with gaps, e.g. 1 … 4 5 6 … 12
function pageWindow(page, pageCount) {
  const pages = [...new Set([1, pageCount, page - 1, page, page + 1])]
      .filter((n) => n >= 1 && n <= pageCount)
      .sort((a, b) => a - b)
  return pages.flatMap((n, index) =>
      index > 0 && n - pages[index - 1] > 1 ? [`gap-${n}`, n] : [n]
  )
}

function SortLabel({ column, children, className = "" }) {
  const sorted = column.getIsSorted()
  return (
      <button
          type="button"
          onClick={column.getToggleSortingHandler()}
          className={`inline-flex items-center gap-1 uppercase tracking-wide hover:text-foreground ${className}`}
      >
        {children}
        <span aria-hidden="true" className="text-[10px]">
          {sorted === "asc" ? "▲" : sorted === "desc" ? "▼" : "↕"}
        </span>
      </button>
  )
}

const LIBRARY_KINDS = new Set(["quiz", "flashcard", "mindmap", "activity"])

// Library kinds that open a tutor tool, shown with that tool's colour and icon.
const LIBRARY_TUTOR_TYPES = { quiz: "quiz", flashcard: "flashcards", mindmap: "mindmap", activity: "word_game" }

const libraryTypeMeta = {
  activity: { label: "Activity", icon: Sparkles, badge: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" },
  quiz: {
    label: "Quiz",
    icon: ListChecks,
    badge:
        "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  },
  flashcard: {
    label: "Flashcards",
    icon: Layers3,
    badge:
        "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  },
  mindmap: {
    label: "Mind map",
    icon: Network,
    badge:
        "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
  },
  link: {
    label: "Link",
    icon: Link,
    badge: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300",
  },
  note: {
    label: "Note",
    icon: StickyNote,
    badge: "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
  },
}

function formatDate(value) {
  if (!value) return "—"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

function resolveOpenUrl(item) {
  return item.route
}

export default function LearnerFilesPage() {
  const navigate = useNavigate()

  const [localSearch, setLocalSearch] = useState("")
  const [certificationId, setCertificationId] = useState("")
  const [category, setCategory] = useState(ALL_VALUE)
  const [viewItem, setViewItem] = useState(null)
  const [pendingRemoval, setPendingRemoval] = useState(null)

  async function openSourceLesson(item) {
    let topicId = item.middleCategoryId ?? null
    if (!topicId && item.certificationId) {
      try {
        topicId = (await getLessonById(item.lessonId))?.middleCategoryId ?? null
      } catch {
        topicId = null
      }
    }
    navigate(
      topicId && item.certificationId
        ? `/learner/learning/${item.certificationId}/topics/${topicId}?lesson=${item.lessonId}`
        : `/learner/lessons/${item.lessonId}`
    )
  }


  const queryClient = useQueryClient()

  const libraryQuery = useQuery({
    queryKey: LIBRARY_ITEMS_KEY,
    queryFn: getLibraryItems,
    staleTime: 60_000,
    retry: 1,
  })

  const certificationsQuery = useQuery({
    queryKey: ["certifications", "summary"],
    queryFn: () => getAllCertifications(undefined, { summary: true }),
    staleTime: 5 * 60_000,
    retry: 1,
  })

  const items = Array.isArray(libraryQuery.data) ? libraryQuery.data : []
  const certifications = Array.isArray(certificationsQuery.data)
      ? certificationsQuery.data
      : []

  const certificationOptions = useMemo(() => {
    const titlesById = new Map(
        certifications.map((certification) => [
          String(certification.certificationId),
          certification.title || "Untitled certification",
        ])
    )

    for (const item of items) {
      if (item.certificationId == null) continue
      const id = String(item.certificationId)
      if (!titlesById.has(id)) {
        titlesById.set(id, item.certificationTitle || `Certification ${id}`)
      }
    }

    return Array.from(titlesById, ([id, title]) => ({ id, title })).sort((a, b) =>
        a.title.localeCompare(b.title)
    )
  }, [certifications, items])

  const isLoading = libraryQuery.isLoading

  useEffect(() => {
    if (libraryQuery.isError || certificationsQuery.isError) {
      toast.error("Your library could not be loaded.")
    }
  }, [libraryQuery.isError, certificationsQuery.isError])

  async function removeResource(item) {
    if (!item) return
    try {
      await deleteLibraryItem(item.id)
      queryClient.setQueryData(LIBRARY_ITEMS_KEY, (current) =>
          (Array.isArray(current) ? current : []).filter((entry) => entry.id !== item.id)
      )
      toast.success("Resource removed.")
    } catch {
      toast.error("The resource could not be removed.")
    } finally {
      setPendingRemoval(null)
    }
  }

  const counts = useMemo(() => {
    const result = { quiz: 0, flashcard: 0, mindmap: 0, activity: 0 }
    for (const item of items) {
      if (result[item.kind] != null) result[item.kind] += 1
    }
    return result
  }, [items])

  const query = localSearch.toLowerCase().trim()

  const visibleItems = useMemo(
      () =>
          items.filter((item) => {
            if (!LIBRARY_KINDS.has(item.kind)) {
              return false
            }

            const matchesCategory = category === ALL_VALUE || item.kind === category

            const matchesCertification =
                !certificationId || String(item.certificationId ?? "") === certificationId

            const matchesSearch =
                !query ||
                (item.title || "").toLowerCase().includes(query) ||
                (item.description || "").toLowerCase().includes(query) ||
                (item.certificationTitle || "").toLowerCase().includes(query) ||
                (item.lessonTitle || "").toLowerCase().includes(query) ||
                (item.details || "").toLowerCase().includes(query)

            return matchesCategory && matchesCertification && matchesSearch
          }),
      [items, category, certificationId, query]
  )

  function openItem(item) {
    const url = resolveOpenUrl(item)

    if (!url) {
      setViewItem(item)
      return
    }

    if (/^https?:\/\//i.test(url)) {
      window.open(url, "_blank", "noopener,noreferrer")
      return
    }

    navigate(url)
  }

  const [sorting, setSorting] = useState([{ id: "createdAt", desc: true }])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: PAGE_SIZE })

  // Any filter change starts back on page 1.
  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }, [category, certificationId, query])

  const columns = [
    {
      id: "title",
      // Takes the leftover width and truncates, so the table never scrolls sideways.
      meta: { className: "w-full max-w-0" },
      accessorFn: (item) => item.title || "",
      header: ({ column }) => <SortLabel column={column}>Resource</SortLabel>,
      cell: ({ row }) => {
        const item = row.original
        const meta = libraryTypeMeta[item.kind] ?? libraryTypeMeta.note
        const Icon = meta.icon
        const tutorType = LIBRARY_TUTOR_TYPES[item.kind]
        return (
            <div className="flex min-w-0 items-start gap-3">
              {tutorType ? (
                  <span className={`tg-badge-icon ${categoryClass(tutorType)}`}><GameIcon type={tutorType} /></span>
              ) : (
                  <span className={`grid size-9 shrink-0 place-items-center rounded-lg border ${meta.badge}`}>
                    <Icon className="size-4" />
                  </span>
              )}
              <div className="min-w-0 flex-1">
                <button
                    type="button"
                    onClick={() => openItem(item)}
                    className="block w-full truncate text-left text-sm font-semibold text-foreground hover:underline"
                >
                  {String(item.title || "").replace(/^[a-z ]+:\s*/, "")}
                </button>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {item.description || item.details}
                </p>
              </div>
            </div>
        )
      },
    },
    {
      id: "kind",
      accessorFn: (item) => libraryTypeMeta[item.kind]?.label ?? "",
      header: ({ column }) => <SortLabel column={column}>Type</SortLabel>,
      cell: ({ row }) => {
        const meta = libraryTypeMeta[row.original.kind] ?? libraryTypeMeta.note
        return <Badge variant="outline" className={meta.badge}>{meta.label}</Badge>
      },
    },
    {
      id: "source",
      meta: { className: "hidden xl:table-cell" },
      accessorFn: (item) => item.certificationTitle || "",
      header: ({ column }) => <SortLabel column={column}>Certification · lesson</SortLabel>,
      cell: ({ row }) => (
          <div className="max-w-48 text-sm">
            <p className="truncate text-foreground">{row.original.certificationTitle || "General library"}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.lessonTitle || "Not linked to a lesson"}</p>
          </div>
      ),
    },
    {
      id: "createdAt",
      meta: { className: "hidden md:table-cell" },
      accessorFn: (item) => new Date(item.createdAt ?? 0).getTime(),
      header: ({ column }) => <SortLabel column={column}>Added</SortLabel>,
      cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      id: "actions",
      enableSorting: false,
      header: () => <span className="block text-right uppercase tracking-wide">Actions</span>,
      cell: ({ row }) => {
        const item = row.original
        return (
            <div className="flex justify-end gap-2">
              <Button type="button" size="sm" onClick={() => openItem(item)}>
                {item.kind === "quiz" ? <BrainCircuit className="mr-2 h-4 w-4" /> : <BookOpenCheck className="mr-2 h-4 w-4" />}
                {item.kind === "flashcard" ? "Study" : "Open"}
              </Button>
              {item.lessonId ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => openSourceLesson(item)}>
                    Source
                  </Button>
              ) : null}
              {item.ownedByMe ? (
                  <Button type="button" size="icon" variant="ghost" onClick={() => setPendingRemoval(item)} aria-label="Remove from library">
                    <Trash2 className="h-4 w-4" />
                  </Button>
              ) : null}
            </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: visibleItems,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getRowId: (item) => `${item.kind}-${item.id}`,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
  })

  const pageCount = table.getPageCount()
  const firstShown = pagination.pageIndex * pagination.pageSize + 1
  const lastShown = Math.min(firstShown + pagination.pageSize - 1, visibleItems.length)

  // Deleting the last row on the last page shouldn't strand you on an empty page.
  useEffect(() => {
    if (pageCount > 0 && pagination.pageIndex > pageCount - 1) {
      setPagination((current) => ({ ...current, pageIndex: pageCount - 1 }))
    }
  }, [pageCount, pagination.pageIndex])

  return (
      <div className="space-y-6">
        <LearnerPageHeader title="Library" subtitle="Your saved quizzes, flashcards, games, learning activities and mind maps.">
        </LearnerPageHeader>

        <div role="tablist" aria-label="Library categories" className="-mx-1 flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-border px-1">
          {[
            { value: ALL_VALUE, label: "All", count: items.length, icon: LibraryBig },
            { value: "quiz", label: "Quizzes", count: counts.quiz, icon: ListChecks },
            { value: "flashcard", label: "Flashcards", count: counts.flashcard, icon: Layers3 },
            { value: "mindmap", label: "Mind maps", count: counts.mindmap, icon: Network },
            { value: "activity", label: "Games & activities", count: counts.activity, icon: Sparkles },
          ].map((tab) => {
            const active = category === tab.value
            const TabIcon = tab.icon
            return (
                <button
                    key={tab.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setCategory(tab.value)}
                    className={`-mb-px inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                >
                  <TabIcon className="size-4" aria-hidden="true" />
                  {tab.label}
                  <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{tab.count}</span>
                </button>
            )
          })}
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
                value={localSearch}
                onChange={(event) => setLocalSearch(event.target.value)}
                placeholder="Search your quizzes, flashcards and mind maps"
                className="pl-10"
            />
          </label>

          <Select value={certificationId || ALL_VALUE} onValueChange={(value) => setCertificationId(value === ALL_VALUE ? "" : value)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="All certifications" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All certifications</SelectItem>
              {certificationOptions.map((certification) => (
                <SelectItem key={certification.id} value={certification.id}>{certification.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
            <div className="overflow-hidden rounded-xl border border-border" aria-busy="true" aria-label="Loading your library">
              {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-b-0">
                    <Skeleton className="size-9 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="hidden h-5 w-20 rounded-full sm:block" />
                    <Skeleton className="hidden h-4 w-24 md:block" />
                    <Skeleton className="h-8 w-20 rounded-md" />
                  </div>
              ))}
            </div>
        ) : items.length === 0 ? (
            <LearnerEmptyState
                icon={LibraryBig}
                title="Your library is empty"
                description="Quizzes, flashcards, mind maps and activities you save from the tutor will appear here."
            />
        ) : visibleItems.length === 0 ? (
            <LearnerEmptyState
                icon={Search}
                title="Nothing matches"
                description="No saved resource matches this search or filter. Try another word or switch back to All."
            />
        ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id} className="border-b border-border bg-muted/50">
                        {headerGroup.headers.map((header) => (
                            <th
                                key={header.id}
                                aria-sort={
                                  header.column.getIsSorted() === "asc"
                                      ? "ascending"
                                      : header.column.getIsSorted() === "desc"
                                          ? "descending"
                                          : undefined
                                }
                                className={`px-4 py-3 text-xs font-semibold text-muted-foreground ${header.column.columnDef.meta?.className ?? ""}`}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </th>
                        ))}
                      </tr>
                  ))}
                  </thead>
                  <tbody>
                  {table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="border-b border-border transition last:border-b-0 hover:bg-muted/40">
                        {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className={`px-4 py-3 align-middle ${cell.column.columnDef.meta?.className ?? ""}`}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                        ))}
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Showing {firstShown}–{lastShown} of {visibleItems.length}
                  {visibleItems.length === items.length ? "" : ` (${items.length} saved)`}
                </p>
                {pageCount > 1 ? (
                    <nav className="flex items-center gap-1" aria-label="Library pages">
                      <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => table.previousPage()}
                          disabled={!table.getCanPreviousPage()}
                          aria-label="Previous page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {pageWindow(pagination.pageIndex + 1, pageCount).map((entry) =>
                          typeof entry === "string" ? (
                              <span key={entry} className="px-1 text-xs text-muted-foreground">…</span>
                          ) : (
                              <Button
                                  key={entry}
                                  type="button"
                                  size="sm"
                                  variant={entry === pagination.pageIndex + 1 ? "default" : "ghost"}
                                  className="min-w-8 px-2"
                                  onClick={() => table.setPageIndex(entry - 1)}
                                  aria-current={entry === pagination.pageIndex + 1 ? "page" : undefined}
                              >
                                {entry}
                              </Button>
                          )
                      )}
                      <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => table.nextPage()}
                          disabled={!table.getCanNextPage()}
                          aria-label="Next page"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </nav>
                ) : null}
              </div>
            </div>
        )}

        <Dialog open={Boolean(viewItem)} onOpenChange={(open) => !open && setViewItem(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>{viewItem?.title}</DialogTitle><DialogDescription>{viewItem?.details || "Library resource"}</DialogDescription></DialogHeader>
            <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{viewItem?.description || "No description was added."}</p>
          </DialogContent>
        </Dialog>

        <AlertDialog
            open={Boolean(pendingRemoval)}
            onOpenChange={(open) => !open && setPendingRemoval(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove this from your library?</AlertDialogTitle>
              <AlertDialogDescription>
                “{pendingRemoval?.title}” will be deleted. This cannot be undone — the tutor can
                generate another, but not this one again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction onClick={() => removeResource(pendingRemoval)}>
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  )
}
