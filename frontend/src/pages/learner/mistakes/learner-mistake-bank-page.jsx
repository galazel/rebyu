import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  CheckCheck,
  CheckCircle2,
  ChevronDownIcon,
  Clock,
  ListChecks,
  Search,
  Target,
  X,
  XCircle,
} from "@/components/icons"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { LearnerEmptyState, LearnerErrorState, LearnerPageHeader } from "@/components/learner/learner-ui.jsx"
import { Celebration, Confidence, ProgressBar } from "@/components/learner/tutor-game-kit.jsx"
import { getMistakes, setMistakeReviewed } from "@/services/learnerToolsService"
import ProGate from "@/components/learner/pro-gate.jsx"
import { FEATURES } from "@/services/subscriptionService.js"

const ALL_VALUE = "all"

const REPEAT_THRESHOLD = 2

const PAGE_SIZE = 25

// Mistakes take the game kit's red "decision" accent throughout the page.
const ACCENT = "tg-cat-decision"

function formatDate(value) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date)
}

function label(text) {
  if (!text) return "Question"
  return text.replaceAll("_", " ").toLowerCase().replace(/^./, (character) => character.toUpperCase())
}

const misses = (mistake) => Number(mistake.mistakeCount ?? 1)
const isRepeated = (mistake) => misses(mistake) >= REPEAT_THRESHOLD
const lessonOf = (mistake) => mistake.lessonTitle || "Unassigned lesson"

function AnswerPair({ mistake }) {
  return (
    <>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <div className="rounded-2xl bg-rose-500/10 p-3 ring-1 ring-rose-500/40">
          <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-rose-600 dark:text-rose-300">
            <XCircle className="size-3.5" aria-hidden="true" /> You answered
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
            {mistake.learnerAnswer?.trim() || "No answer submitted"}
          </p>
        </div>
        <div className="rounded-2xl bg-emerald-500/12 p-3 ring-1 ring-emerald-500/40">
          <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-3.5" aria-hidden="true" /> Correct answer
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{mistake.correctAnswer}</p>
        </div>
      </div>
      {mistake.explanation ? (
        <div className="mt-2.5 rounded-2xl bg-[var(--tg-softer)] p-3 ring-1 ring-[var(--tg-line)]">
          <p className="tg-kicker">Why</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{mistake.explanation}</p>
        </div>
      ) : null}
    </>
  )
}

/** One mistake at a time: think, reveal, then keep it or mark it learned. */
function ReviewSession({ queue, onMark, onClose }) {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [learned, setLearned] = useState(0)
  const mistake = queue[index]
  const done = index >= queue.length

  function next(gotIt) {
    if (gotIt) {
      setLearned((count) => count + 1)
      onMark(mistake, true)
    }
    setRevealed(false)
    setIndex((current) => current + 1)
  }

  return (
    <section className={`tg-frame ${ACCENT}`} aria-label="Review your mistakes">
      <header className="tg-head flex items-center gap-3 px-4 py-3 sm:px-5">
        <span className="tg-badge-icon"><Target className="size-4" aria-hidden="true" /></span>
        <span className="tg-kicker flex-1">Mistake review</span>
        {!done ? <span className="tg-pill">{index + 1} / {queue.length}</span> : null}
        <button type="button" onClick={onClose} aria-label="Close the review" className="tg-btn tg-icon-btn !size-9">
          <X className="size-4" aria-hidden="true" />
        </button>
        <span className="tg-progress"><span style={{ width: `${(Math.min(index, queue.length) / queue.length) * 100}%` }} /></span>
      </header>

      <div className="p-4 sm:p-6">
        {done ? (
          <Celebration
            right={learned}
            total={queue.length}
            noun="marked as learned"
            detail={queue.length - learned ? `${queue.length - learned} still to practise` : null}
            reviewable={false}
            onRestart={onClose}
            restartLabel="Back to the bank"
          />
        ) : (
          <>
            <p className="text-xs font-semibold text-muted-foreground">
              {[mistake.certificationTitle, lessonOf(mistake)].filter(Boolean).join(" · ")}
              {isRepeated(mistake) ? <span className="tg-chip ml-2">Missed {misses(mistake)}×</span> : null}
            </p>
            <h2 className="rb-form-heading mt-3 rounded-2xl bg-[var(--tg-softer)] p-5 text-lg font-extrabold leading-snug text-foreground ring-1 ring-[var(--tg-line)] sm:text-xl">
              {mistake.question}
            </h2>

            {revealed ? (
              <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <AnswerPair mistake={mistake} />
                <Confidence missLabel="Still shaky" hitLabel="Got it now" onMiss={() => next(false)} onHit={() => next(true)} />
              </div>
            ) : (
              <div className="mt-5 text-center">
                <p className="mb-3 text-sm text-muted-foreground">Recall the right answer first, then check yourself.</p>
                <button type="button" className="tg-btn tg-btn-primary !px-6 !py-3 !text-base" onClick={() => setRevealed(true)}>
                  Show the answer
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

function MistakeRow({ mistake, open, onToggle, onToggleReviewed, isPending }) {
  return (
    <li className={cn("rounded-2xl border bg-card transition-colors", open ? "border-[var(--tg-line)]" : "border-border")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start gap-3 rounded-2xl p-3.5 text-left hover:bg-[var(--tg-softer)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tg)] sm:p-4"
      >
        <span
          className={cn(
            "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full text-xs font-black",
            mistake.reviewed
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : isRepeated(mistake)
                ? "bg-rose-500/15 text-rose-600 dark:text-rose-300"
                : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
          )}
          aria-label={mistake.reviewed ? "Reviewed" : `Missed ${misses(mistake)} times`}
        >
          {mistake.reviewed ? <CheckCircle2 className="size-4" aria-hidden="true" /> : `${misses(mistake)}×`}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("block text-sm font-semibold leading-6 text-foreground", !open && "line-clamp-2")}>
            {mistake.question}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>{label(mistake.questionType)}</span>
            {mistake.difficulty ? <span>· {label(mistake.difficulty)}</span> : null}
            {mistake.attemptSource ? <span>· {mistake.attemptSource}</span> : null}
            <span className="inline-flex items-center gap-1">· <Clock className="size-3" aria-hidden="true" />{formatDate(mistake.lastMistakeAt)}</span>
          </span>
        </span>
        <ChevronDownIcon className={cn("mt-1.5 size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      {open ? (
        <div className="animate-in fade-in px-3.5 pb-4 duration-200 sm:px-4 sm:pl-[3.75rem]">
          <AnswerPair mistake={mistake} />
          <div className="mt-3 flex justify-end">
            <button type="button" className={cn("tg-btn", !mistake.reviewed && "tg-btn-primary")} disabled={isPending} onClick={() => onToggleReviewed(mistake)}>
              {mistake.reviewed ? "Put back to review" : <><CheckCheck className="size-4" aria-hidden="true" /> Mark as learned</>}
            </button>
          </div>
        </div>
      ) : null}
    </li>
  )
}

// Mirrors the loaded layout (progress panel, chips, filters, rows) so nothing jumps.
function MistakeBankSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading your mistake bank">
      <Skeleton className="h-40 rounded-[1.1rem]" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-8 w-36 rounded-full" />)}
      </div>
      <Skeleton className="h-10 rounded-md" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-20 rounded-2xl" />)}
      </div>
    </div>
  )
}

export default function LearnerMistakeBankPage() {
  return (
    <ProGate
      feature={FEATURES.MISTAKE_BANK}
      title="Your mistake bank is a Pro feature"
      description="Every question you got wrong, grouped by lesson, ready to review until it sticks. Upgrade to REBYU Pro to open it."
    >
      <MistakeBankContent />
    </ProGate>
  )
}

const FILTERS = [
  { value: ALL_VALUE, label: "All" },
  { value: "todo", label: "To review" },
  { value: "repeated", label: "Missed twice+" },
  { value: "reviewed", label: "Learned" },
]

function MistakeBankContent() {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState("")
  const [certification, setCertification] = useState(ALL_VALUE)
  const [filter, setFilter] = useState(ALL_VALUE)
  const [lesson, setLesson] = useState(null)
  const [sort, setSort] = useState("recent")
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [openId, setOpenId] = useState(null)
  const [session, setSession] = useState(null)

  const mistakesQuery = useQuery({ queryKey: ["learner-mistakes"], queryFn: getMistakes, retry: 1 })

  const mistakes = useMemo(() => (Array.isArray(mistakesQuery.data) ? mistakesQuery.data : []), [mistakesQuery.data])

  const reviewMutation = useMutation({
    mutationFn: ({ questionId, reviewed }) => setMistakeReviewed(questionId, reviewed),
    onSuccess: (_result, variables) => {
      queryClient.setQueryData(["learner-mistakes"], (current) =>
        Array.isArray(current)
          ? current.map((mistake) => (mistake.questionId === variables.questionId ? { ...mistake, reviewed: variables.reviewed } : mistake))
          : current
      )
      if (!variables.quiet) toast.success(variables.reviewed ? "Marked as learned." : "Back on the list to review.")
    },
    onError: () => toast.error("That could not be saved. Try again."),
  })

  const stats = useMemo(() => ({
    questions: mistakes.length,
    totalMisses: mistakes.reduce((sum, mistake) => sum + misses(mistake), 0),
    repeated: mistakes.filter(isRepeated).length,
    reviewed: mistakes.filter((mistake) => mistake.reviewed).length,
    todo: mistakes.filter((mistake) => !mistake.reviewed).length,
  }), [mistakes])

  const counts = { [ALL_VALUE]: stats.questions, todo: stats.todo, repeated: stats.repeated, reviewed: stats.reviewed }

  const certifications = useMemo(
    () => [...new Set(mistakes.map((mistake) => mistake.certificationTitle).filter(Boolean))].sort(),
    [mistakes]
  )

  // The lessons with the most wrong answers, as filter chips.
  const weakLessons = useMemo(() => {
    const totals = new Map()
    for (const mistake of mistakes) {
      const key = lessonOf(mistake)
      totals.set(key, (totals.get(key) ?? 0) + misses(mistake))
    }
    return [...totals].map(([title, wrong]) => ({ title, wrong })).sort((a, b) => b.wrong - a.wrong).slice(0, 6)
  }, [mistakes])

  const query = search.trim().toLowerCase()

  const visible = useMemo(() => {
    const filtered = mistakes.filter((mistake) => {
      const matchesFilter =
        filter === ALL_VALUE ||
        (filter === "todo" && !mistake.reviewed) ||
        (filter === "reviewed" && mistake.reviewed) ||
        (filter === "repeated" && isRepeated(mistake))
      const matchesCertification = certification === ALL_VALUE || mistake.certificationTitle === certification
      const matchesLesson = !lesson || lessonOf(mistake) === lesson
      const matchesSearch =
        !query ||
        [mistake.question, mistake.lessonTitle, mistake.certificationTitle, mistake.attemptSource, mistake.correctAnswer]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(query))
      return matchesFilter && matchesCertification && matchesLesson && matchesSearch
    })
    return filtered.sort((a, b) =>
      sort === "missed" ? misses(b) - misses(a) : new Date(b.lastMistakeAt ?? 0) - new Date(a.lastMistakeAt ?? 0)
    )
  }, [mistakes, filter, certification, lesson, query, sort])

  const shown = visible.slice(0, visibleCount)

  // The shown rows, kept in order, as one section per lesson.
  const groups = useMemo(() => {
    const byLesson = new Map()
    for (const mistake of shown) {
      const key = lessonOf(mistake)
      if (!byLesson.has(key)) byLesson.set(key, { title: key, certification: mistake.certificationTitle, items: [] })
      byLesson.get(key).items.push(mistake)
    }
    return [...byLesson.values()]
  }, [shown])

  const resetPaging = () => setVisibleCount(PAGE_SIZE)

  function startReview() {
    // What is still to review under the current filters, habits (missed twice+) first.
    const queue = visible.filter((mistake) => !mistake.reviewed).sort((a, b) => misses(b) - misses(a)).slice(0, 20)
    if (!queue.length) {
      toast.info("Nothing left to review here. Try another filter, or All.")
      return
    }
    setSession(queue)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (mistakesQuery.isError) {
    return <LearnerErrorState title="Could not load your mistake bank" error={mistakesQuery.error} onRetry={mistakesQuery.refetch} />
  }

  const learnedPct = stats.questions ? Math.round((stats.reviewed / stats.questions) * 100) : 0

  return (
    <div className={`rb-hub space-y-6 ${ACCENT}`}>
      <LearnerPageHeader
        title="Mistake bank"
      />

      {mistakesQuery.isLoading ? (
        <MistakeBankSkeleton />
      ) : mistakes.length === 0 ? (
        <LearnerEmptyState
          icon={ListChecks}
          title="Nothing to review yet"
          description="Questions you get wrong in an assessment land here automatically, with the correct answer and the explanation."
        />
      ) : session ? (
        <ReviewSession
          queue={session}
          onMark={(mistake, reviewed) => reviewMutation.mutate({ questionId: mistake.questionId, reviewed, quiet: true })}
          onClose={() => setSession(null)}
        />
      ) : (
        <>
          <section className="tg-frame">
            <div className="tg-head flex flex-wrap items-center gap-x-6 gap-y-4 px-5 py-5 sm:px-6">
              <div className="min-w-[14rem] flex-1">
                <p className="tg-kicker">Learned</p>
                <p className="mt-1 text-3xl font-black tabular-nums text-foreground">
                  {stats.reviewed}<span className="text-lg font-bold text-muted-foreground"> / {stats.questions}</span>
                </p>
                <div className="mt-2 max-w-md"><ProgressBar value={stats.reviewed} total={stats.questions} label="Mistakes learned" /></div>
                <p className="mt-1.5 text-xs font-semibold text-muted-foreground">
                  {learnedPct}% gone over · {stats.totalMisses} wrong answers in total
                </p>
              </div>
              <div className="flex gap-3">
                <div className="rounded-2xl bg-card px-4 py-3 ring-1 ring-[var(--tg-line)]">
                  <p className="text-2xl font-black tabular-nums text-rose-600 dark:text-rose-300">{stats.repeated}</p>
                  <p className="text-xs font-semibold text-muted-foreground">missed twice+</p>
                </div>
                <div className="rounded-2xl bg-card px-4 py-3 ring-1 ring-[var(--tg-line)]">
                  <p className="text-2xl font-black tabular-nums text-foreground">{stats.todo}</p>
                  <p className="text-xs font-semibold text-muted-foreground">to review</p>
                </div>
              </div>
              <button type="button" className="tg-btn tg-btn-primary !px-5 !py-3 !text-base" onClick={startReview} disabled={!stats.todo}>
                <Target className="size-4" aria-hidden="true" /> Review my mistakes
              </button>
            </div>
          </section>

          {weakLessons.length > 1 ? (
            <div>
              <p className="tg-kicker mb-2">Weakest lessons</p>
              <div className="flex flex-wrap gap-2">
                {weakLessons.map((entry) => {
                  const active = lesson === entry.title
                  return (
                    <button
                      key={entry.title}
                      type="button"
                      aria-pressed={active}
                      onClick={() => { setLesson(active ? null : entry.title); resetPaging() }}
                      className={cn(
                        "inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tg)]",
                        active ? "border-[var(--tg)] bg-[var(--tg)] text-white" : "border-[var(--tg-line)] bg-card text-foreground hover:bg-[var(--tg-softer)]"
                      )}
                    >
                      <span className="truncate">{entry.title}</span>
                      <span className={cn("shrink-0 rounded-full px-1.5 text-xs tabular-nums", active ? "bg-white/25" : "bg-[var(--tg-soft)] text-[var(--tg-ink)]")}>{entry.wrong}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            <div role="tablist" aria-label="Mistake filters" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {FILTERS.map((option) => {
                const active = filter === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => { setFilter(option.value); resetPaging() }}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {option.label}
                    <span className={cn("rounded-full px-1.5 text-xs tabular-nums", active ? "bg-primary-foreground/20" : "bg-muted")}>{counts[option.value]}</span>
                  </button>
                )
              })}
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_180px]">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  value={search}
                  onChange={(event) => { setSearch(event.target.value); resetPaging() }}
                  placeholder="Search questions, lessons or answers"
                  className="pl-9"
                  aria-label="Search your mistakes"
                />
              </label>
              <Select value={certification} onValueChange={(value) => { setCertification(value); resetPaging() }}>
                <SelectTrigger aria-label="Filter by certification"><SelectValue placeholder="All certifications" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All certifications</SelectItem>
                  {certifications.map((title) => <SelectItem key={title} value={title}>{title}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger aria-label="Sort mistakes"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most recent first</SelectItem>
                  <SelectItem value="missed">Most missed first</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Showing {shown.length} of {visible.length}
                {visible.length === mistakes.length ? "" : ` (${mistakes.length} in the bank)`}
              </p>
              {lesson ? (
                <button type="button" className="tg-btn !py-1 !text-xs" onClick={() => { setLesson(null); resetPaging() }}>
                  <X className="size-3.5" aria-hidden="true" /> {lesson}
                </button>
              ) : null}
            </div>
          </div>

          {visible.length === 0 ? (
            <LearnerEmptyState icon={Search} title="Nothing matches" description="No mistake matches this filter. Widen the search or switch back to All." />
          ) : (
            <div className="space-y-6">
              {groups.map((group) => (
                <section key={group.title} aria-label={group.title}>
                  <div className="mb-2 flex items-baseline justify-between gap-3 border-b border-border pb-1.5">
                    <h2 className="rb-form-heading truncate text-base font-semibold text-foreground">{group.title}</h2>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {[group.certification, `${group.items.length} shown`].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                  <ol className="space-y-2">
                    {group.items.map((mistake) => {
                      const id = mistake.questionId ?? mistake.mistakeId
                      return (
                        <MistakeRow
                          key={id}
                          mistake={mistake}
                          open={openId === id}
                          onToggle={() => setOpenId((current) => (current === id ? null : id))}
                          isPending={reviewMutation.isPending && reviewMutation.variables?.questionId === mistake.questionId}
                          onToggleReviewed={(target) => reviewMutation.mutate({ questionId: target.questionId, reviewed: !target.reviewed })}
                        />
                      )
                    })}
                  </ol>
                </section>
              ))}
            </div>
          )}

          {visible.length > shown.length ? (
            <button type="button" className="tg-btn w-full" onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}>
              Show {Math.min(PAGE_SIZE, visible.length - shown.length)} more
            </button>
          ) : null}
        </>
      )}
    </div>
  )
}
