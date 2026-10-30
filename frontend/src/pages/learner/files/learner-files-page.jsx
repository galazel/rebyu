import React, { useEffect, useMemo, useState } from "react"
import { ArrowRight, BookOpen, LibraryBig, Search, Trash2 } from "@/components/icons"
import { useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { getLessonById } from "@/services/learnerService.js"
import { LearnerEmptyState, LearnerPageHeader } from "@/components/learner/learner-ui.jsx"
import { categoryClass, GameIcon } from "@/components/learner/tutor-game-kit.jsx"
import { LEARNING_ACTIVITIES } from "@/components/learner/learning-tools-picker.jsx"

const ALL_VALUE = "all"

const LIBRARY_ITEMS_KEY = ["library-items"]

// The Library holds what the AI tutor made in lessons: its game tools and mind maps.
const LIBRARY_KINDS = new Set(["quiz", "flashcard", "mindmap", "activity"])

const KIND_TABS = [
  { value: "activity", label: "Games & activities", icon: "word_game" },
  { value: "quiz", label: "Quizzes", icon: "quiz" },
  { value: "flashcard", label: "Flashcards", icon: "flashcards" },
  { value: "mindmap", label: "Mind maps", icon: "mindmap" },
]

// Names for tool types the picker does not list (older or variant activities).
const EXTRA_TOOL_NAMES = {
  word_game: "Word game",
  word_search: "Word search",
  puzzle: "Puzzle",
  jigsaw: "Jigsaw puzzle",
  sliding: "Sliding puzzle",
  visual_game: "Visual game",
  hidden_objects: "Hidden objects",
  spot_difference: "Spot the difference",
  mindmap: "Mind map",
}

const TOOL_NAMES = {
  ...EXTRA_TOOL_NAMES,
  ...Object.fromEntries(LEARNING_ACTIVITIES.map((tool) => [tool.id, tool.name])),
}

const SORTS = {
  newest: { label: "Newest first", compare: (a, b) => time(b) - time(a) },
  oldest: { label: "Oldest first", compare: (a, b) => time(a) - time(b) },
  title: { label: "Title A–Z", compare: (a, b) => cleanTitle(a).localeCompare(cleanTitle(b)) },
}

function time(item) {
  return new Date(item.createdAt ?? 0).getTime()
}

/** The tutor tool an item came from, for its icon, colour and name. */
function toolOf(item) {
  if (item.activityType) return item.activityType
  if (item.kind === "flashcard") return "flashcards"
  if (item.kind === "mindmap") return "mindmap"
  if (item.kind === "quiz") return "quiz"
  return "word_game"
}

function cleanTitle(item) {
  return String(item.title || "Untitled").replace(/^[a-z ]+:\s*/, "")
}

function formatDate(value) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(date)
}

function LibraryCard({ item, onOpen, onRemove }) {
  const tool = toolOf(item)
  return (
    <div className={`relative ${categoryClass(tool)}`}>
      <button
        type="button"
        onClick={() => onOpen(item)}
        className="tg-pick group flex h-full w-full flex-col p-4 pr-12 text-left"
      >
        <span className="relative z-10 mb-3 flex items-center gap-2.5">
          <span className="tg-badge-icon"><GameIcon type={tool} /></span>
          <span className="tg-chip">{TOOL_NAMES[tool] ?? tool.replaceAll("_", " ")}</span>
        </span>
        <span className="relative z-10 line-clamp-2 text-sm font-extrabold text-foreground">{cleanTitle(item)}</span>
        <span className="relative z-10 mt-auto flex items-center justify-between gap-2 pt-3 text-xs font-semibold text-muted-foreground">
          <span className="flex items-center gap-2">
            {formatDate(item.createdAt)}
            {item.scoreTotal ? <span className="tg-pill" title="Your last score">{item.scoreRight}/{item.scoreTotal}</span> : null}
          </span>
          <span className="inline-flex items-center gap-1 text-[var(--tg-ink)]">
            {item.kind === "mindmap" ? "Open" : item.scoreTotal ? "Play again" : "Play"}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </span>
      </button>
      {item.ownedByMe ? (
        <button
          type="button"
          onClick={() => onRemove(item)}
          aria-label={`Remove ${cleanTitle(item)} from your library`}
          className="absolute right-2.5 top-2.5 z-20 grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive focus-visible:outline-2 focus-visible:outline-[var(--tg)]"
        >
          <Trash2 className="size-4" />
        </button>
      ) : null}
    </div>
  )
}

export default function LearnerFilesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState("")
  const [certificationId, setCertificationId] = useState(ALL_VALUE)
  const [kind, setKind] = useState(ALL_VALUE)
  const [sort, setSort] = useState("newest")
  const [pendingRemoval, setPendingRemoval] = useState(null)

  const libraryQuery = useQuery({
    queryKey: LIBRARY_ITEMS_KEY,
    queryFn: getLibraryItems,
    staleTime: 60_000,
    retry: 1,
  })

  useEffect(() => {
    if (libraryQuery.isError) toast.error("Your library could not be loaded.")
  }, [libraryQuery.isError])

  const items = useMemo(
    () => (Array.isArray(libraryQuery.data) ? libraryQuery.data : []).filter((item) => LIBRARY_KINDS.has(item.kind)),
    [libraryQuery.data]
  )

  const counts = useMemo(() => {
    const result = {}
    for (const item of items) result[item.kind] = (result[item.kind] ?? 0) + 1
    return result
  }, [items])

  const certificationOptions = useMemo(() => {
    const titles = new Map()
    for (const item of items) {
      if (item.certificationId != null) titles.set(String(item.certificationId), item.certificationTitle || "Certification")
    }
    return [...titles].map(([id, title]) => ({ id, title })).sort((a, b) => a.title.localeCompare(b.title))
  }, [items])

  // Only kinds you actually have get a tab; if the open one empties, fall back to All.
  useEffect(() => {
    if (kind !== ALL_VALUE && !libraryQuery.isLoading && !counts[kind]) setKind(ALL_VALUE)
  }, [kind, counts, libraryQuery.isLoading])

  const query = search.toLowerCase().trim()

  const groups = useMemo(() => {
    const visible = items
      .filter((item) => kind === ALL_VALUE || item.kind === kind)
      .filter((item) => certificationId === ALL_VALUE || String(item.certificationId ?? "") === certificationId)
      .filter((item) => {
        if (!query) return true
        const tool = toolOf(item)
        return [item.title, item.lessonTitle, item.certificationTitle, TOOL_NAMES[tool], tool]
          .some((text) => String(text || "").toLowerCase().includes(query))
      })
      .sort(SORTS[sort].compare)

    // One section per lesson, in the order its first item appears under the chosen sort.
    const byLesson = new Map()
    for (const item of visible) {
      const key = item.lessonId ?? "none"
      if (!byLesson.has(key)) byLesson.set(key, { key, lessonId: item.lessonId, title: item.lessonTitle, certification: item.certificationTitle, items: [] })
      byLesson.get(key).items.push(item)
    }
    return [...byLesson.values()]
  }, [items, kind, certificationId, query, sort])

  const shownCount = groups.reduce((total, group) => total + group.items.length, 0)

  function openItem(item) {
    if (!item.route) {
      toast.error("This item has nothing to open.")
      return
    }
    if (/^https?:\/\//i.test(item.route)) {
      window.open(item.route, "_blank", "noopener,noreferrer")
      return
    }
    navigate(item.route)
  }

  async function openLesson(group) {
    const sample = group.items[0]
    let topicId = sample.middleCategoryId ?? null
    if (!topicId && sample.certificationId) {
      try {
        topicId = (await getLessonById(group.lessonId))?.middleCategoryId ?? null
      } catch {
        topicId = null
      }
    }
    navigate(
      topicId && sample.certificationId
        ? `/learner/learning/${sample.certificationId}/topics/${topicId}?lesson=${group.lessonId}`
        : `/learner/lessons/${group.lessonId}`
    )
  }

  async function removeItem(item) {
    if (!item) return
    try {
      await deleteLibraryItem(item.id)
      queryClient.setQueryData(LIBRARY_ITEMS_KEY, (current) =>
        (Array.isArray(current) ? current : []).filter((entry) => !(entry.id === item.id && entry.kind === item.kind))
      )
      toast.success("Removed from your library.")
    } catch {
      toast.error("It could not be removed.")
    } finally {
      setPendingRemoval(null)
    }
  }

  const tabs = [
    { value: ALL_VALUE, label: "All", count: items.length },
    ...KIND_TABS.map((tab) => ({ ...tab, count: counts[tab.value] ?? 0 })).filter((tab) => tab.count > 0),
  ]

  return (
    <div className="space-y-6">
      <LearnerPageHeader
        title="Library"
        subtitle="Every game, quiz, flashcard set and mind map the AI tutor made for you in your lessons."
      />

      {items.length > 0 ? (
        <>
          <div role="tablist" aria-label="Library categories" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((tab) => {
              const active = kind === tab.value
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setKind(tab.value)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.icon ? <GameIcon type={tab.icon} className="size-3.5" /> : <LibraryBig className="size-4" aria-hidden="true" />}
                  {tab.label}
                  <span className={`rounded-full px-1.5 text-xs tabular-nums ${active ? "bg-primary-foreground/20" : "bg-muted"}`}>{tab.count}</span>
                </button>
              )
            })}
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_170px]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title, lesson or game type"
                aria-label="Search your Library"
                className="pl-10"
              />
            </label>

            <Select value={certificationId} onValueChange={setCertificationId}>
              <SelectTrigger className="w-full" aria-label="Certification"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All certifications</SelectItem>
                {certificationOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>{option.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-full" aria-label="Sort"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(SORTS).map(([value, option]) => (
                  <SelectItem key={value} value={value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      ) : null}

      {libraryQuery.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading your library">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-[1.1rem]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <LearnerEmptyState
          icon={LibraryBig}
          title="Your library is empty"
          description="Open a lesson, ask the AI tutor for a game, quiz, flashcards or mind map, and it is saved here automatically."
        />
      ) : shownCount === 0 ? (
        <LearnerEmptyState
          icon={Search}
          title="Nothing matches"
          description="Nothing in your Library matches this search or filter. Try another word or switch back to All."
        />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.key} aria-labelledby={`library-lesson-${group.key}`}>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b border-border pb-2">
                <div className="min-w-0">
                  <h2 id={`library-lesson-${group.key}`} className="rb-form-heading truncate text-base font-semibold text-foreground">
                    {group.title || "Not linked to a lesson"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {[group.certification, `${group.items.length} ${group.items.length === 1 ? "item" : "items"}`].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {group.lessonId ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => openLesson(group)}>
                    <BookOpen className="mr-1.5 size-4" /> Open lesson
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {group.items.map((item) => (
                  <LibraryCard key={`${item.kind}-${item.id}`} item={item} onOpen={openItem} onRemove={setPendingRemoval} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <AlertDialog open={Boolean(pendingRemoval)} onOpenChange={(open) => !open && setPendingRemoval(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this from your library?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingRemoval ? cleanTitle(pendingRemoval) : ""}” will be deleted. This cannot be undone — the tutor can
              make another, but not this one again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={() => removeItem(pendingRemoval)}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
