import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, CalendarDays, Check, Loader2, Plus, Save, Search, Trash2, Trophy } from "@/components/icons"
import { toast } from "sonner"

import {
  CHALLENGE_ARENAS_KEY,
  WORLD_CUP_EDITIONS_KEY,
  createWorldCupEdition,
  deleteWorldCupEdition,
  getWorldCupEdition,
  getWorldCupEditions,
  publishWorldCupEdition,
  saveWorldCupEditionStages,
} from "@/services/challengeService.js"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import QuestionSetEditor, {
  arenaQuestionFromSaved,
  saveArenaQuestion,
  totalPointsOf,
  totalXpOf,
  validateArenaQuestions,
} from "@/components/challenges/question-set-editor.jsx"
import { getAllCertifications } from "@/services/certificationService.js"


function toDateString(date) {
  const pad = (value) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function weekStartOf(date) {
  const monday = typeof date === "string" ? new Date(`${date}T00:00:00`) : new Date(date)
  const offset = (monday.getDay() + 6) % 7
  monday.setDate(monday.getDate() - offset)
  monday.setHours(0, 0, 0, 0)
  return toDateString(monday)
}

function formatWeek(weekStart) {
  const start = new Date(`${weekStart}T00:00:00`)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)

  const month = (date) => date.toLocaleDateString(undefined, { month: "short" })
  const sameMonth = start.getMonth() === end.getMonth()

  return sameMonth
    ? `${month(start)} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`
    : `${month(start)} ${start.getDate()} – ${month(end)} ${end.getDate()}, ${end.getFullYear()}`
}

/* A published week is live only during that week; learners never see it after. */
function editionStatus(edition) {
  if (!edition.published) return { label: "Draft", variant: "secondary" }
  const thisWeek = weekStartOf(new Date())
  if (edition.weekStart < thisWeek) return { label: "Expired", variant: "outline" }
  if (edition.weekStart > thisWeek) return { label: "Scheduled", variant: "secondary" }
  return { label: "Live", variant: "default" }
}

function StepLabel({ step, title, hint }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
        {step}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-foreground">{title}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  )
}

function emptyStages(arena) {
  return Object.fromEntries(arena.stages.map((stage) => [stage.id, []]))
}

function apiMessage(error, fallback) {
  return error?.response?.data?.message ?? error?.message ?? fallback
}

export default function WorldCupEditions({ arena }) {
  const queryClient = useQueryClient()
  const [openEditionId, setOpenEditionId] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)

  const thisWeek = weekStartOf(new Date())
  const [draftWeek, setDraftWeek] = useState(thisWeek)
  const [draftCertification, setDraftCertification] = useState("")
  const [draftLesson, setDraftLesson] = useState("")
  const [draftError, setDraftError] = useState("")
  const [lessonSearch, setLessonSearch] = useState("")

  const { data: certifications = [] } = useQuery({
    queryKey: ["admin-certifications", "world-cup-editions"],
    queryFn: () => getAllCertifications(undefined, { summary: true }),
    staleTime: 5 * 60 * 1000,
  })

  const editionsQuery = useQuery({
    queryKey: [WORLD_CUP_EDITIONS_KEY],
    queryFn: getWorldCupEditions,
  })
  const editions = editionsQuery.data ?? []

  const certificationName = useMemo(() => {
    const byId = new Map(
      certifications.map((certification) => [
        String(certification.certificationId ?? certification.id),
        certification.title,
      ]),
    )
    return (id) => byId.get(String(id)) ?? "Certification"
  }, [certifications])

  // Lessons grouped by the syllabus (unit and topic), so a long list stays scannable.
  const draftGroups = useMemo(() => {
    const certification = certifications.find(
      (item) => String(item.certificationId ?? item.id) === String(draftCertification),
    )
    return (certification?.majorCategory ?? []).flatMap((major, mi) =>
      (major.middleCategory ?? [])
        .filter((middle) => (middle.lessons ?? []).length > 0)
        .map((middle, ci) => ({
          key: `${mi}-${ci}`,
          title: [major.title, middle.title].filter(Boolean).join(" · ") || "Lessons",
          lessons: middle.lessons ?? [],
        })),
    )
  }, [certifications, draftCertification])
  const draftLessons = useMemo(() => draftGroups.flatMap((group) => group.lessons), [draftGroups])
  const lessonGroups = useMemo(() => {
    const query = lessonSearch.trim().toLowerCase()
    if (!query) return draftGroups
    return draftGroups
      .map((group) => ({
        ...group,
        lessons: group.title.toLowerCase().includes(query)
          ? group.lessons
          : group.lessons.filter((lesson) => String(lesson.name ?? "").toLowerCase().includes(query)),
      }))
      .filter((group) => group.lessons.length > 0)
  }, [draftGroups, lessonSearch])
  const draftLessonName = draftLessons.find((lesson) => String(lesson.lessonId) === draftLesson)?.name ?? null

  // This week and the next three, marked when a week already has an exam.
  const takenWeeks = useMemo(() => new Set(editions.map((edition) => edition.weekStart)), [editions])
  const weekOptions = useMemo(() => {
    const labels = ["This week", "Next week", "In 2 weeks", "In 3 weeks"]
    return labels.map((label, i) => {
      const monday = new Date(`${thisWeek}T00:00:00`)
      monday.setDate(monday.getDate() + i * 7)
      return { label, weekStart: toDateString(monday) }
    })
  }, [thisWeek])

  const createMutation = useMutation({
    mutationFn: createWorldCupEdition,
    onSuccess: (edition) => {
      queryClient.invalidateQueries({ queryKey: [WORLD_CUP_EDITIONS_KEY] })
      setOpenEditionId(edition.editionId)
      setCreateOpen(false)
      setDraftError("")
      setDraftCertification("")
      setDraftLesson("")
      setLessonSearch("")
      setDraftWeek(thisWeek)
    },
    onError: (error) => setDraftError(apiMessage(error, "The week could not be created.")),
  })

  function createEdition() {
    if (!draftCertification) {
      setDraftError("Choose the certification this week's bracket runs on.")
      return
    }
    if (!draftLesson) {
      setDraftError("Choose the lesson these questions are filed under.")
      return
    }
    if (editions.some((edition) => edition.weekStart === draftWeek)) {
      setDraftError("An exam already exists for that week.")
      return
    }
    createMutation.mutate({
      weekStart: draftWeek,
      certificationId: Number(draftCertification),
      lessonId: Number(draftLesson),
    })
  }


  if (openEditionId != null) {
    return (
      <EditionEditor
        key={openEditionId}
        arena={arena}
        editionId={openEditionId}
        certificationName={certificationName}
        onBack={() => setOpenEditionId(null)}
      />
    )
  }


  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold">Weekly exams</h3>
          <p className="text-xs text-muted-foreground">
            One exam per week, with its own question set for each bracket stage.
          </p>
        </div>

        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 size-4" />
          Create this week&rsquo;s exam
        </Button>
      </div>

      {editionsQuery.isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border px-6 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Loading weekly exams...
        </div>
      ) : editionsQuery.isError ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-destructive">
          {apiMessage(editionsQuery.error, "The weekly exams could not be loaded.")}
        </div>
      ) : editions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <CalendarDays className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium">No weekly exams yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create one to author its {arena.stages.map((stage) => stage.name.toLowerCase()).join(", ")} questions.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {editions.map((edition) => {
            const counts = arena.stages.map((stage) => ({
              stage,
              count: edition.stageCounts?.[stage.id] ?? 0,
            }))
            const total = counts.reduce((sum, item) => sum + item.count, 0)

            return (
              <li key={edition.editionId}>
                <button
                  type="button"
                  onClick={() => setOpenEditionId(edition.editionId)}
                  className="flex w-full flex-wrap items-center gap-3 rounded-xl border-2 border-border bg-card px-4 py-3 text-left transition hover:border-primary/45 hover:bg-accent/40"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
                    <CalendarDays className="size-4" aria-hidden="true" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">
                      {formatWeek(edition.weekStart)}
                      {edition.weekStart === thisWeek ? (
                        <Badge variant="secondary" className="ml-2">
                          This week
                        </Badge>
                      ) : null}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {certificationName(edition.certificationId)} · {total} question
                      {total === 1 ? "" : "s"}
                    </span>
                  </span>

                  <span className="flex flex-wrap items-center gap-1.5">
                    {counts.map(({ stage, count }) => (
                      <Badge
                        key={stage.id}
                        variant="outline"
                        className={count === 0 ? "text-muted-foreground" : ""}
                      >
                        {stage.name} {count}
                      </Badge>
                    ))}
                    <Badge variant={editionStatus(edition).variant}>{editionStatus(edition).label}</Badge>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-[600px]">
          <DialogHeader className="border-b px-6 pb-4 pt-6">
            <DialogTitle>Create weekly exam</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Learners can play it only during its week; it expires when the week ends.
            </p>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
            {/* 1. Week */}
            <section>
              <StepLabel step={1} title="Week" hint="Pick the week the bracket runs." />
              <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Week">
                {weekOptions.map((option) => {
                  const taken = takenWeeks.has(option.weekStart)
                  const active = draftWeek === option.weekStart
                  return (
                    <button
                      key={option.weekStart}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={taken}
                      onClick={() => setDraftWeek(option.weekStart)}
                      className={`rounded-xl border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        active ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/60"
                      }`}
                    >
                      <span className="block text-xs font-bold text-foreground">{option.label}</span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">{formatWeek(option.weekStart)}</span>
                      {taken ? <span className="mt-1 block text-[10px] font-semibold text-muted-foreground">Already has an exam</span> : null}
                    </button>
                  )
                })}
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                <span>Another week:</span>
                <Input
                  id="world-cup-week"
                  type="date"
                  value={draftWeek}
                  aria-label="Any date in the week"
                  className="h-8 w-auto text-xs"
                  onChange={(event) => {
                    if (event.target.value) setDraftWeek(weekStartOf(event.target.value))
                  }}
                />
                <span>snaps to its Monday</span>
              </div>
              {draftWeek < thisWeek ? (
                <p className="mt-2 text-xs font-medium text-destructive">
                  That week is over, so learners would never see this exam.
                </p>
              ) : null}
            </section>

            {/* 2. Certification */}
            <section>
              <StepLabel step={2} title="Certification" hint="Every player in the bracket answers from this syllabus." />
              <Select
                value={draftCertification}
                onValueChange={(value) => {
                  setDraftCertification(value)
                  setDraftLesson("")
                  setLessonSearch("")
                }}
              >
                <SelectTrigger id="world-cup-certification" className="mt-2.5 w-full">
                  <SelectValue placeholder="Select a certification" />
                </SelectTrigger>
                <SelectContent>
                  {certifications.map((certification) => {
                    const id = String(certification.certificationId ?? certification.id)
                    return (
                      <SelectItem key={id} value={id}>
                        {certification.title}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </section>

            {/* 3. Lesson */}
            <section>
              <StepLabel
                step={3}
                title="File questions under"
                hint="The bracket spans the whole certification; this lesson is only where the bank stores its questions."
              />
              {!draftCertification ? (
                <p className="mt-2.5 rounded-xl border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
                  Choose a certification first.
                </p>
              ) : draftLessons.length === 0 ? (
                <p className="mt-2.5 rounded-xl border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
                  This certification has no lessons yet.
                </p>
              ) : (
                <div className="mt-2.5 overflow-hidden rounded-xl border">
                  <div className="relative border-b">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={lessonSearch}
                      onChange={(event) => setLessonSearch(event.target.value)}
                      placeholder={`Search ${draftLessons.length} lessons`}
                      aria-label="Search lessons"
                      className="h-10 w-full bg-transparent pl-9 pr-3 text-sm outline-none"
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto p-1.5" role="listbox" aria-label="Lessons">
                    {lessonGroups.length === 0 ? (
                      <p className="px-3 py-4 text-center text-xs text-muted-foreground">No lesson matches.</p>
                    ) : (
                      lessonGroups.map((group) => (
                        <div key={group.key} className="mb-1 last:mb-0">
                          <p className="sticky top-0 z-[1] bg-background/95 px-2.5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground backdrop-blur">
                            {group.title}
                          </p>
                          {group.lessons.map((lesson) => {
                            const selected = String(lesson.lessonId) === draftLesson
                            return (
                              <button
                                key={lesson.lessonId}
                                type="button"
                                role="option"
                                aria-selected={selected}
                                onClick={() => setDraftLesson(String(lesson.lessonId))}
                                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                                  selected ? "bg-primary/10 font-semibold text-primary" : "hover:bg-muted/70"
                                }`}
                              >
                                <span className="min-w-0 flex-1">{lesson.name}</span>
                                {selected ? <Check className="size-4 shrink-0" aria-hidden="true" /> : null}
                              </button>
                            )
                          })}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className="space-y-3 border-t px-6 py-4">
            <div className="flex items-start gap-2.5 rounded-xl bg-muted/50 px-3 py-2.5 text-xs">
              <Trophy className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">{formatWeek(draftWeek)}</span>
                {" · "}
                {draftCertification ? certificationName(draftCertification) : "no certification yet"}
                {draftLessonName ? ` · filed under ${draftLessonName}` : ""}
                . Next you add questions for each stage, then publish.
              </p>
            </div>
            {draftError ? <p className="text-xs font-medium text-destructive">{draftError}</p> : null}
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createEdition} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Plus className="mr-2 size-4" aria-hidden="true" />
                )}
                Create exam
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EditionEditor({ arena, editionId, certificationName, onBack }) {
  const queryClient = useQueryClient()
  const [stages, setStages] = useState(null)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(null)
  const [dirty, setDirty] = useState(false)

  const detailQuery = useQuery({
    queryKey: [WORLD_CUP_EDITIONS_KEY, editionId],
    queryFn: async () => {
      const detail = await getWorldCupEdition(editionId)
      const rebuilt = {}
      for (const stage of arena.stages) {
        const rows = detail.stages?.[stage.id] ?? []
        const problems = await Promise.all(rows.map(arenaQuestionFromSaved))
        rebuilt[stage.id] = problems.filter(Boolean)
      }
      return { edition: detail.edition, stages: rebuilt }
    },
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
  })

  const edition = detailQuery.data?.edition ?? null

  useEffect(() => {
    if (stages === null && detailQuery.data) {
      setStages({ ...emptyStages(arena), ...detailQuery.data.stages })
    }
  }, [stages, detailQuery.data, arena])

  if (!edition || stages === null) {
    return (
      <div className="space-y-5">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 size-4" />
          Weekly exams
        </Button>
        <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border px-6 py-12 text-sm text-muted-foreground">
          {detailQuery.isError ? (
            apiMessage(detailQuery.error, "This week could not be loaded.")
          ) : (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Loading this week&rsquo;s questions...
            </>
          )}
        </div>
      </div>
    )
  }

  const allQuestions = arena.stages.flatMap((stage) => stages[stage.id])

  function setStageQuestions(stageId, problems) {
    setStages((current) => ({ ...current, [stageId]: problems }))
    setDirty(true)
  }

  async function saveDraft() {
    const nextErrors = validateArenaQuestions(allQuestions)
    setErrors(nextErrors)
    const invalidCount = Object.keys(nextErrors).length
    if (invalidCount > 0) {
      toast.error("Fix the highlighted questions", {
        description: `${invalidCount} of ${allQuestions.length} questions are incomplete.`,
      })
      return false
    }

    const ids = {}
    const savedIds = new Map()
    for (const stage of arena.stages) {
      ids[stage.id] = []
      for (const problem of stages[stage.id]) {
        const questionId = await saveArenaQuestion(problem, {
          lessonId: edition.lessonId,
          certificationId: edition.certificationId,
        })
        savedIds.set(problem.id, questionId)
        ids[stage.id].push(questionId)
      }
    }

    await saveWorldCupEditionStages(editionId, ids)

    setStages((current) =>
      Object.fromEntries(
        Object.entries(current).map(([stageId, problems]) => [
          stageId,
          problems.map((problem) =>
            savedIds.has(problem.id)
              ? { ...problem, existingQuestionId: savedIds.get(problem.id), edited: false }
              : problem,
          ),
        ]),
      ),
    )
    setDirty(false)
    await queryClient.invalidateQueries({ queryKey: [WORLD_CUP_EDITIONS_KEY], exact: true })
    return true
  }

  async function run(kind, action) {
    setBusy(kind)
    try {
      await action()
    } catch (error) {
      toast.error(kind === "publish" ? "Could not publish this week" : "Could not save this week", {
        description: apiMessage(error, "Some questions may have been saved. Try again."),
      })
    } finally {
      setBusy(null)
    }
  }

  function onSaveDraft() {
    void run("save", async () => {
      if (await saveDraft()) {
        toast.success("Draft saved", { description: "Learners see nothing until you publish." })
      }
    })
  }

  function onPublish() {
    const emptyStageNames = arena.stages
      .filter((stage) => stages[stage.id].length === 0)
      .map((stage) => stage.name)
    if (emptyStageNames.length > 0) {
      toast.error("Every stage needs questions", {
        description: `${emptyStageNames.join(", ")} ${emptyStageNames.length === 1 ? "has" : "have"} none.`,
      })
      return
    }

    void run("publish", async () => {
      if (!(await saveDraft())) return
      await publishWorldCupEdition(editionId)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [WORLD_CUP_EDITIONS_KEY], exact: true }),
        queryClient.invalidateQueries({ queryKey: [CHALLENGE_ARENAS_KEY], exact: true }),
      ])
      toast.success(`${formatWeek(edition.weekStart)} is live`, {
        description: `${allQuestions.length} questions across ${arena.stages.length} stages. The Champions Cup is open to learners.`,
      })
      onBack()
    })
  }

  function onDelete() {
    if (!window.confirm(`Delete the draft for ${formatWeek(edition.weekStart)}? Its questions stay in the bank.`)) {
      return
    }
    void run("delete", async () => {
      await deleteWorldCupEdition(editionId)
      await queryClient.invalidateQueries({ queryKey: [WORLD_CUP_EDITIONS_KEY], exact: true })
      toast.success("Draft deleted")
      onBack()
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (!dirty || window.confirm("Leave without saving? Unsaved questions will be lost.")) onBack()
          }}
        >
          <ArrowLeft className="size-4" />
          <span className="sr-only">Back to weekly exams</span>
        </Button>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold">
            {formatWeek(edition.weekStart)}
            <Badge variant={editionStatus(edition).variant} className="ml-2">
              {editionStatus(edition).label}
            </Badge>
          </h3>
          <p className="text-xs text-muted-foreground">
            {certificationName(edition.certificationId)} ·{" "}
            {allQuestions.length} question{allQuestions.length === 1 ? "" : "s"} ·{" "}
            {totalPointsOf(allQuestions)} points · {totalXpOf(allQuestions)} XP
          </p>
        </div>

        {!edition.published ? (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
            disabled={Boolean(busy)}
          >
            <Trash2 className="mr-2 size-4" />
            Delete draft
          </Button>
        ) : null}

        <Button size="sm" variant="outline" onClick={onSaveDraft} disabled={Boolean(busy)}>
          <Save className="mr-2 size-4" />
          {busy === "save" ? "Saving..." : "Save draft"}
        </Button>
        <Button size="sm" onClick={onPublish} disabled={Boolean(busy)}>
          <Check className="mr-2 size-4" />
          {busy === "publish" ? "Publishing..." : edition.published ? "Republish week" : "Publish week"}
        </Button>
      </div>

      <Tabs defaultValue={arena.stages[0].id}>
        <TabsList>
          {arena.stages.map((stage) => (
            <TabsTrigger key={stage.id} value={stage.id}>
              {stage.name}
              <Badge variant="outline" className="ml-2 tabular-nums">
                {stages[stage.id].length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {arena.stages.map((stage) => (
          <TabsContent key={stage.id} value={stage.id} className="mt-5 space-y-4">
            <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
              <p className="text-sm font-bold">{stage.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {stage.matches} match{stage.matches === 1 ? "" : "es"} ·{" "}
                {stage.players} players · every match in this stage answers this set.
              </p>
            </div>

            <QuestionSetEditor
              problems={stages[stage.id]}
              onChange={(problems) => setStageQuestions(stage.id, problems)}
              typeIds={arena.questionTypes}
              errors={errors}
              emptyState={
                <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
                  <Trophy className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />
                  <p className="mt-3 text-sm font-medium">
                    No {stage.name.toLowerCase()} questions yet
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add one below. Same editors as a certification&rsquo;s question bank.
                  </p>
                </div>
              }
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
