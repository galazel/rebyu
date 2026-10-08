import { useEffect, useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, Loader2, Plus, Trash2, Trophy } from "@/components/icons"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  QUESTION_TYPES,
  QuestionTypeButton,
  cloneQuestionData,
  createLocalId,
  validateQuestionData,
} from "@/components/questions/question-editors.jsx"
import {
  arenaQuestionFromSaved,
  saveArenaQuestion,
} from "@/components/challenges/question-set-editor.jsx"
import { getAllCertifications } from "@/services/certificationService.js"
import {
  CHALLENGE_ARENAS_KEY,
  getArenaProblems,
  saveArenaProblems,
} from "@/services/challengeService.js"


const DEFAULT_REWARD = { points: "10", xp: "25" }

function createNode() {
  return { id: createLocalId(), problems: [] }
}

export default function ArenaProblemBuilder({ arena, status, settings }) {
  const queryClient = useQueryClient()
  const [nodes, setNodes] = useState(() => [createNode()])
  const [errors, setErrors] = useState({})
  const [nodeErrors, setNodeErrors] = useState({})
  const [certificationId, setCertificationId] = useState("")
  const [certificationError, setCertificationError] = useState("")
  const [lessonId, setLessonId] = useState("")
  const [lessonError, setLessonError] = useState("")
  const [saving, setSaving] = useState(false)

  const questionsPerNode = Number(arena.questionsPerNode) || 0
  const isRoadmap = questionsPerNode > 0

  const targetNodes = isRoadmap
    ? Number(
        settings?.problems ??
          arena.fields.find((field) => field.key === "problems")?.value ??
          0,
      )
    : 0

  const savedQuery = useQuery({
    queryKey: [CHALLENGE_ARENAS_KEY, arena.id, "problems"],
    queryFn: async () => {
      const rows = await getArenaProblems(arena.id)
      const rebuilt = await Promise.all(
        rows.map(async (row) => ({
          nodeIndex: row.nodeIndex ?? 1,
          problem: await arenaQuestionFromSaved(row),
        })),
      )
      return rebuilt.filter((item) => item.problem)
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (hydrated || !savedQuery.data) return
    setHydrated(true)
    if (savedQuery.data.length === 0) return

    const byNode = new Map()
    for (const { nodeIndex, problem } of savedQuery.data) {
      const key = isRoadmap ? nodeIndex : 1
      if (!byNode.has(key)) byNode.set(key, [])
      byNode.get(key).push(problem)
    }
    setNodes(
      [...byNode.keys()]
        .sort((a, b) => a - b)
        .map((key) => ({ id: createLocalId(), problems: byNode.get(key) })),
    )
    if (status?.certificationId) setCertificationId(String(status.certificationId))
    const firstLesson = savedQuery.data.find(({ problem }) => problem.lessonId)?.problem.lessonId
    if (firstLesson) setLessonId(String(firstLesson))
  }, [hydrated, savedQuery.data, isRoadmap, status?.certificationId])

  const allowedTypes = useMemo(
    () => QUESTION_TYPES.filter((type) => arena.questionTypes.includes(type.id)),
    [arena.questionTypes],
  )

  const { data: certifications = [] } = useQuery({
    queryKey: ["admin-certifications", "arena-problems"],
    queryFn: () => getAllCertifications(),
    staleTime: 5 * 60 * 1000,
  })

  const lessons = useMemo(() => {
    const certification = certifications.find(
      (item) => String(item.certificationId) === String(certificationId),
    )
    return (certification?.majorCategory ?? []).flatMap((major) =>
      (major.middleCategory ?? []).flatMap((middle) => middle.lessons ?? []),
    )
  }, [certifications, certificationId])

  const allProblems = nodes.flatMap((node) => node.problems)

  function updateNode(nodeId, update) {
    setNodes((current) =>
      current.map((node) => (node.id === nodeId ? update(node) : node)),
    )
  }

  function addNode() {
    setNodes((current) => [...current, createNode()])
  }

  function removeNode(nodeId) {
    setNodes((current) => {
      const remaining = current.filter((node) => node.id !== nodeId)
      return remaining.length > 0 ? remaining : [createNode()]
    })
  }

  function addProblem(nodeId, questionType) {
    updateNode(nodeId, (node) => ({
      ...node,
      problems: [
        ...node.problems,
        {
          id: createLocalId(),
          typeId: questionType.id,
          typeName: questionType.title,
          ...DEFAULT_REWARD,
          data: cloneQuestionData(questionType.data),
        },
      ],
    }))
  }

  function removeProblem(nodeId, problemId) {
    updateNode(nodeId, (node) => ({
      ...node,
      problems: node.problems.filter((problem) => problem.id !== problemId),
    }))
    setErrors((current) => {
      const next = { ...current }
      delete next[problemId]
      return next
    })
  }

  function updateProblemField(nodeId, problemId, field, value) {
    updateNode(nodeId, (node) => ({
      ...node,
      problems: node.problems.map((problem) =>
        problem.id === problemId ? { ...problem, [field]: value } : problem,
      ),
    }))
  }

  function updateProblemData(nodeId, problemId, update) {
    updateNode(nodeId, (node) => ({
      ...node,
      problems: node.problems.map((problem) =>
        problem.id === problemId
          ? {
              ...problem,
              data: typeof update === "function" ? update(problem.data) : update,
              edited: true,
            }
          : problem,
      ),
    }))
  }

  function saveProblems() {
    const nextErrors = {}

    for (const problem of allProblems) {
      const problemErrors = validateQuestionData(problem.typeId, problem.data)

      if (!(Number(problem.points) > 0)) {
        problemErrors.points = "Points must be greater than zero."
      }
      if (!(Number(problem.xp) >= 0)) {
        problemErrors.xp = "XP cannot be negative."
      }

      if (Object.keys(problemErrors).length > 0) {
        nextErrors[problem.id] = problemErrors
      }
    }

    setErrors(nextErrors)

    const missingCertification = !certificationId
    setCertificationError(
      missingCertification ? "Choose the certification these problems come from." : "",
    )


    const nextNodeErrors = {}
    if (isRoadmap) {
      nodes.forEach((node, index) => {
        if (node.problems.length === 0) {
          nextNodeErrors[node.id] = `Node ${index + 1} has no questions yet.`
        }
      })
    }
    setNodeErrors(nextNodeErrors)

    const missingLesson = !lessonId
    setLessonError(missingLesson ? "Choose the lesson these problems belong to." : "")

    if (missingCertification || missingLesson) {
      toast.error(missingCertification ? "Choose a certification" : "Choose a lesson", {
        description: missingCertification
          ? `${arena.name} problems are saved against one certification.`
          : "Every question is filed under a lesson, even in an arena.",
      })
      return
    }

    const emptyNodeCount = Object.keys(nextNodeErrors).length
    if (emptyNodeCount > 0) {
      toast.error("Every node needs at least one question", {
        description: `${emptyNodeCount} node${emptyNodeCount === 1 ? " is" : "s are"} empty. Remove ${emptyNodeCount === 1 ? "it" : "them"} or add a question.`,
      })
      return
    }

    const invalidCount = Object.keys(nextErrors).length
    if (invalidCount > 0) {
      toast.error("Fix the highlighted questions", {
        description: `${invalidCount} of ${allProblems.length} questions are incomplete.`,
      })
      return
    }

    setSaving(true)
    void (async () => {
      try {
        const saved = []
        const savedIds = new Map()

        for (const node of nodes) {
          const nodeIndex = isRoadmap ? nodes.indexOf(node) + 1 : null

          for (const problem of node.problems) {
            const questionId = await saveArenaQuestion(problem, { lessonId, certificationId })
            savedIds.set(problem.id, questionId)
            saved.push({
              questionId,
              nodeIndex,
              points: Number(problem.points) || 1,
            })
          }
        }

        const status = await saveArenaProblems(arena.id, {
          certificationId: Number(certificationId),
          problems: saved,
        })

        setNodes((current) =>
          current.map((node) => ({
            ...node,
            problems: node.problems.map((problem) =>
              savedIds.has(problem.id)
                ? { ...problem, existingQuestionId: savedIds.get(problem.id), edited: false }
                : problem,
            ),
          })),
        )

        await queryClient.invalidateQueries({ queryKey: [CHALLENGE_ARENAS_KEY], exact: true })

        toast.success(`${arena.name} is live`, {
          description: `${status.problemCount} problem${
            status.problemCount === 1 ? "" : "s"
          } saved. Learners can enter this arena now.`,
        })
      } catch (error) {
        toast.error("Could not save the arena", {
          description:
            error?.response?.data?.message ??
            error?.message ??
            "Some questions may have been saved. Check the question bank before retrying.",
        })
      } finally {
        setSaving(false)
      }
    })()
  }

  const totalPoints = allProblems.reduce(
    (total, problem) => total + (Number(problem.points) || 0),
    0,
  )
  const totalXp = allProblems.reduce(
    (total, problem) => total + (Number(problem.xp) || 0),
    0,
  )

  function renderProblem(node, problem, index) {
    const questionType = QUESTION_TYPES.find((type) => type.id === problem.typeId)
    if (!questionType) return null

    const Editor = questionType.component
    const problemErrors = errors[problem.id] ?? {}

    return (
      <div key={problem.id} className="space-y-2">
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
          <div className="w-24">
            <Label htmlFor={`${problem.id}-points`} className="text-xs font-bold">
              Points
            </Label>
            <Input
              id={`${problem.id}-points`}
              value={problem.points}
              inputMode="numeric"
              className="mt-1 h-9"
              aria-invalid={Boolean(problemErrors.points)}
              onChange={(event) =>
                updateProblemField(node.id, problem.id, "points", event.target.value)
              }
            />
          </div>

          <div className="w-24">
            <Label htmlFor={`${problem.id}-xp`} className="text-xs font-bold">
              XP
            </Label>
            <Input
              id={`${problem.id}-xp`}
              value={problem.xp}
              inputMode="numeric"
              className="mt-1 h-9"
              aria-invalid={Boolean(problemErrors.xp)}
              onChange={(event) =>
                updateProblemField(node.id, problem.id, "xp", event.target.value)
              }
            />
          </div>

          <span className="ml-auto text-xs font-semibold text-muted-foreground">
            Question {index + 1} · {problem.typeName}
          </span>
        </div>

        {problemErrors.points || problemErrors.xp ? (
          <p className="px-1 text-xs text-destructive">
            {problemErrors.points ?? problemErrors.xp}
          </p>
        ) : null}

        <Editor
          questionKey={problem.id}
          questionNumber={index + 1}
          data={problem.data}
          errors={problemErrors}
          onRemove={() => removeProblem(node.id, problem.id)}
          onDataChange={(update) => updateProblemData(node.id, problem.id, update)}
        />
      </div>
    )
  }

  function renderTypeButtons(node, full) {
    if (full) {
      return (
        <p className="rounded-xl border border-dashed border-border px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
          This node holds its {questionsPerNode} questions.
        </p>
      )
    }

    return (
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {allowedTypes.map((questionType) => (
          <QuestionTypeButton
            key={questionType.id}
            questionType={questionType}
            onAdd={(type) => addProblem(node.id, type)}
          />
        ))}
      </div>
    )
  }

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border-2 border-border bg-card px-6 py-12 text-sm text-muted-foreground">
        {savedQuery.isError ? (
          <span>
            The saved problems could not be loaded.{" "}
            <button type="button" className="font-bold underline" onClick={() => savedQuery.refetch()}>
              Try again
            </button>
          </span>
        ) : (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Loading saved problems...
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border-2 border-border bg-card p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor={`${arena.id}-certification`} className="text-sm font-bold">
              Certification
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              {arena.tracked
                ? `A ${arena.name} round is a mock exam on one certification.`
                : `Where ${arena.name} problems are filed.`}
            </p>
            <Select
              value={certificationId}
              onValueChange={(value) => {
                setCertificationId(value)
                setLessonId("")
              }}
            >
              <SelectTrigger
                id={`${arena.id}-certification`}
                className="mt-2"
                aria-invalid={Boolean(certificationError)}
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
            {certificationError ? (
              <p className="mt-1.5 text-xs text-destructive">{certificationError}</p>
            ) : null}
          </div>

          <div>
            <Label htmlFor={`${arena.id}-lesson`} className="text-sm font-bold">
              Lesson
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Every question is filed under a lesson, even in an arena.
            </p>
            <Select
              value={lessonId}
              onValueChange={setLessonId}
              disabled={!certificationId || lessons.length === 0}
            >
              <SelectTrigger
                id={`${arena.id}-lesson`}
                className="mt-2"
                aria-invalid={Boolean(lessonError)}
              >
                <SelectValue
                  placeholder={
                    !certificationId
                      ? "Choose a certification first"
                      : lessons.length === 0
                        ? "This certification has no lessons"
                        : "Select a lesson"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {lessons.map((lesson) => (
                  <SelectItem key={lesson.lessonId} value={String(lesson.lessonId)}>
                    {lesson.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {lessonError ? (
              <p className="mt-1.5 text-xs text-destructive">{lessonError}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {isRoadmap ? (
            <Badge variant="outline" className="tabular-nums">
              {nodes.length}
              {targetNodes ? ` / ${targetNodes}` : ""} nodes
            </Badge>
          ) : null}

          <Badge variant="outline" className="tabular-nums">
            {allProblems.length} question{allProblems.length === 1 ? "" : "s"}
          </Badge>

          {allProblems.length > 0 ? (
            <>
              <Badge variant="outline" className="tabular-nums">
                {totalPoints} points
              </Badge>
              <Badge variant="outline" className="tabular-nums">
                {totalXp} XP
              </Badge>
            </>
          ) : null}

          {isRoadmap && targetNodes && nodes.length < targetNodes ? (
            <span className="text-xs text-muted-foreground">
              {targetNodes - nodes.length} more node
              {targetNodes - nodes.length === 1 ? "" : "s"} to fill the path
            </span>
          ) : null}
        </div>

        <Button
          size="sm"
          onClick={saveProblems}
          disabled={allProblems.length === 0 || saving}
        >
          <Check className="mr-2 size-4" />
          {saving ? "Saving..." : "Save problems"}
        </Button>
      </div>

      {isRoadmap ? (
        <>
          {nodes.map((node, nodeIndex) => {
            const full = node.problems.length >= questionsPerNode
            const nodeError = nodeErrors[node.id]

            return (
              <section
                key={node.id}
                className="rounded-2xl border-2 border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-border bg-muted font-rb-display text-base font-extrabold">
                    {nodeIndex + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold">Node {nodeIndex + 1}</h3>
                    <p className="text-xs text-muted-foreground">
                      Cleared by answering all {questionsPerNode} questions.
                    </p>
                  </div>

                  <Badge
                    variant="outline"
                    className={`tabular-nums ${full ? "" : "text-muted-foreground"}`}
                  >
                    {node.problems.length} / {questionsPerNode}
                  </Badge>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    aria-label={`Remove node ${nodeIndex + 1}`}
                    onClick={() => removeNode(node.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                {nodeError ? (
                  <p className="mt-2 text-xs text-destructive">{nodeError}</p>
                ) : null}

                <div className="mt-4 space-y-5">
                  {node.problems.map((problem, index) =>
                    renderProblem(node, problem, index),
                  )}
                  {renderTypeButtons(node, full)}
                </div>
              </section>
            )
          })}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={addNode}
            disabled={Boolean(targetNodes) && nodes.length >= targetNodes}
          >
            <Plus className="mr-2 size-4" />
            Add node
          </Button>
        </>
      ) : (
        <>
          {allProblems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
              <Trophy className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium">No questions yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add one below. {arena.name} uses the same editors as a
                certification&rsquo;s question bank.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {nodes[0].problems.map((problem, index) =>
                renderProblem(nodes[0], problem, index),
              )}
            </div>
          )}

          {renderTypeButtons(nodes[0], false)}
        </>
      )}
    </div>
  )
}
