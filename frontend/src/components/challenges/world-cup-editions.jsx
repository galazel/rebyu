import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, CalendarDays, Check, Loader2, Plus, Save, Trash2, Trophy } from "@/components/icons"
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

/**
 * World Cup authoring: one exam per week, one question set per bracket stage.
 *
 * The arena is a weekly event, so its questions cannot be a single standing set
 * the way a solo run's are. Everyone sits the same tournament at the same time,
 * which means last week's questions are already public by the time this week's
 * lobby fills — each week needs its own exam.
 *
 * And a bracket is not one round: the same eight players meet at quarterfinals,
 * again at semis, and twice more in the final. One shared set would have the
 * two finalists answering questions they had already seen two rounds earlier,
 * so every stage carries its own set.
 *
 * Editions are stored server-side. "Save draft" writes new or edited questions
 * to the bank and records which each stage runs; learners see nothing until
 * "Publish week" copies the edition into the World Cup exam.
 */

/**
 * Monday of the week containing `date`, as a YYYY-MM-DD string.
 *
 * Formatted from the local date parts, NOT `toISOString()`: east of UTC that
 * converts local Monday 00:00 into the previous Sunday, so every week landed a
 * day early and "this week" never matched the week just created.
 */
function toDateString(date) {
  const pad = (value) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function weekStartOf(date) {
  // A bare "YYYY-MM-DD" parses as UTC midnight, which is the previous day
  // anywhere west of UTC -- read it as local midnight instead.
  const monday = typeof date === "string" ? new Date(`${date}T00:00:00`) : new Date(date)
  // getDay(): 0 = Sunday. Shift back to the Monday that starts this week.
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
  /* Every question is filed under a lesson -- `questions.lesson_id` is NOT
     NULL -- so an edition needs one even though a bracket spans the whole
     certification. Asked for once, when the week is created. */
  const [draftLesson, setDraftLesson] = useState("")
  const [draftError, setDraftError] = useState("")

  const { data: certifications = [] } = useQuery({
    queryKey: ["admin-certifications", "world-cup-editions"],
    queryFn: () => getAllCertifications(),
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

  /* The chosen certification's lessons, out of the tree already fetched. */
  const draftLessons = useMemo(() => {
    const certification = certifications.find(
      (item) => String(item.certificationId ?? item.id) === String(draftCertification),
    )
    return (certification?.majorCategory ?? []).flatMap((major) =>
      (major.middleCategory ?? []).flatMap((middle) => middle.lessons ?? []),
    )
  }, [certifications, draftCertification])

  const createMutation = useMutation({
    mutationFn: createWorldCupEdition,
    onSuccess: (edition) => {
      queryClient.invalidateQueries({ queryKey: [WORLD_CUP_EDITIONS_KEY] })
      setOpenEditionId(edition.editionId)
      setCreateOpen(false)
      setDraftError("")
      setDraftCertification("")
      setDraftLesson("")
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

  /* one edition */

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

  /* edition list */

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
                    <Badge variant={edition.published ? "default" : "secondary"}>
                      {edition.published ? "Published" : "Draft"}
                    </Badge>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Create weekly exam</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="world-cup-week" className="text-sm font-bold">
                Week starting
              </Label>
              <Input
                id="world-cup-week"
                type="date"
                value={draftWeek}
                className="mt-1.5"
                onChange={(event) => {
                  if (event.target.value) setDraftWeek(weekStartOf(event.target.value))
                }}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {formatWeek(draftWeek)} — any date snaps to that week&rsquo;s Monday.
              </p>
            </div>

            <div>
              <Label htmlFor="world-cup-certification" className="text-sm font-bold">
                Certification
              </Label>
              <Select
                value={draftCertification}
                onValueChange={(value) => {
                  setDraftCertification(value)
                  // The lesson list belongs to the certification, so it cannot
                  // survive a change of one.
                  setDraftLesson("")
                }}
              >
                <SelectTrigger
                  id="world-cup-certification"
                  className="mt-1.5"
                  aria-invalid={Boolean(draftError)}
                >
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
              <p className="mt-1 text-xs text-muted-foreground">
                Every player in the bracket answers from this syllabus.
              </p>
            </div>

            <div>
              <Label htmlFor="world-cup-lesson" className="text-sm font-bold">
                Lesson
              </Label>
              <Select
                value={draftLesson}
                onValueChange={setDraftLesson}
                disabled={!draftCertification || draftLessons.length === 0}
              >
                <SelectTrigger id="world-cup-lesson" className="mt-1.5">
                  <SelectValue
                    placeholder={
                      !draftCertification
                        ? "Choose a certification first"
                        : draftLessons.length === 0
                          ? "This certification has no lessons"
                          : "Select a lesson"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {draftLessons.map((lesson) => (
                    <SelectItem key={lesson.lessonId} value={String(lesson.lessonId)}>
                      {lesson.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Where the questions are stored. A bracket spans the whole
                certification; the bank still files each question under a lesson.
              </p>
            </div>

            {draftError ? <p className="text-xs text-destructive">{draftError}</p> : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createEdition} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create exam"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * One week, opened: a tab per bracket stage, loaded from the server and saved
 * back as a draft or published.
 */
function EditionEditor({ arena, editionId, certificationName, onBack }) {
  const queryClient = useQueryClient()
  const [stages, setStages] = useState(null)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(null) // "save" | "publish" | "delete" | null
  const [dirty, setDirty] = useState(false)

  /* The edition with every stage rebuilt into editor shape. Fetched once:
     a background refetch must not overwrite what is being edited. */
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

  /** Writes new or edited questions to the bank, then the stage lists. */
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

    // Saved questions re-link by id next time instead of being written again.
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
      /* Questions are written one at a time, so a failure part-way can leave
         some in the bank. The ones already written are re-linked on retry. */
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

  /** Every stage has to hold questions and every question has to be valid: a
   *  bracket that runs out of questions at the semifinal cannot be played. */
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
        description: `${allQuestions.length} questions across ${arena.stages.length} stages. The World Cup is open to learners.`,
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
            <Badge variant={edition.published ? "default" : "secondary"} className="ml-2">
              {edition.published ? "Published" : "Draft"}
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

        {/* Disabled while busy: questions are written one at a time, so a
            second press mid-run would author the whole week twice. */}
        <Button size="sm" variant="outline" onClick={onSaveDraft} disabled={Boolean(busy)}>
          <Save className="mr-2 size-4" />
          {busy === "save" ? "Saving..." : "Save draft"}
        </Button>
        <Button size="sm" onClick={onPublish} disabled={Boolean(busy)}>
          <Check className="mr-2 size-4" />
          {busy === "publish" ? "Publishing..." : edition.published ? "Republish week" : "Publish week"}
        </Button>
      </div>

      {/* One tab per bracket stage. The count rides on the tab so an admin can
          see which round is still empty without opening it. */}
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
