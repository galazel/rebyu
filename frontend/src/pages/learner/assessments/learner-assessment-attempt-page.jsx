import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom"

import { returnPath } from "@/lib/assessment-return"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloudOffIcon,
  ClockIcon,
  FlagIcon,
  ListIcon,
  Loader2Icon,
  SkipForwardIcon,
} from "@/components/icons"
import { toast } from "sonner"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { PortalThemeToggle } from "@/components/portal-theme-toggle"
import { ASSESSMENT_XP } from "@/lib/xp.js"
import { announceRewards, prefetchRewards, snapshotRewards } from "@/components/learner/xp-award-modal.jsx"
import { gradingMessagesFor } from "@/components/loading-screen.jsx"
import { LoadingSignal } from "@/components/loading-overlay.jsx"
import DiagramArea from "@/components/challenges/diagram-area.jsx"
import CodeMirrorProgrammingWorkspace from "@/components/assessments/attempt/code-mirror-programming-workspace.jsx"
import DiagramQuestionLayout from "@/components/assessments/attempt/diagram-question-layout.jsx"
import ProgrammingQuestionLayout from "@/components/assessments/attempt/programming-question-layout.jsx"
import AttemptSkeleton from "@/components/assessments/attempt/attempt-skeleton.jsx"
import QuestionNavigator from "@/components/assessments/attempt/question-navigator.jsx"
import SubQuestionTabs from "@/components/assessments/attempt/sub-question-tabs.jsx"
import { AuthedImage, prefetchAuthedMedia, questionMediaKeys } from "@/lib/authed-media.jsx"
import {
  getCurrentLearner,
  getCurrentLearnerIdentity,
} from "@/services/learnerService.js"
import {
  autosaveAttemptAnswers,
  checkChoiceAnswer,
  getAssessmentTypeLabel,
  setAttemptCurrentItem,
  setAttemptFlag,
  setAttemptSkip,
  startAssessmentAttempt,
  submitAssessmentAttempt,
} from "@/services/assessmentService.js"
import { GeneratedQuizArena } from "@/components/practice/generated-quiz-arena.jsx"
import { AdaptiveAttemptRunner } from "@/components/assessments/attempt/adaptive-attempt-runner.jsx"
import { describeCountdown, formatCountdown } from "@/lib/countdown.js"
import { AttemptPausedModal } from "@/components/assessments/attempt/attempt-paused-modal.jsx"
import { useAttemptIntegrity } from "@/hooks/use-attempt-integrity.js"
import { getMyWorldCupBracket } from "@/services/challengeService.js"
import { getLearnerPortalData } from "@/services/learnerService.js"
import {
  isMultipleAnswer,
  MultipleAnswerChoices,
} from "@/components/assessments/attempt/multiple-answer-choices.jsx"

function toDraftDto(attemptQuestionId, answer) {
  const subAnswers = answer.subAnswers ?? {}
  const hasSubs = Object.values(subAnswers).some((text) => text?.trim())
  return {
    attemptQuestionId,
    learnerAnswer: hasSubs
        ? JSON.stringify(subAnswers)
        : (answer.learnerAnswer ?? null),
    selectedChoiceId: answer.selectedChoiceId ?? null,
    submittedCode: answer.submittedCode ?? null,
    programmingLanguage: answer.programmingLanguage ?? null,
    diagramSubmissionData: answer.diagramSubmissionData ?? null,
  }
}

function isMultipleChoice(question) {
  const type = String(question?.questionType ?? "").toUpperCase()
  return type === "MULTIPLE_CHOICE" || type === "MCQ"
}

const QUESTION_TYPE_STYLES = {
  MULTIPLE_CHOICE: {
    label: "Multiple Choice",
    className: "border-rb-macaw bg-rb-macaw-wash text-rb-macaw-lip",
  },
  MULTIPLE_ANSWER: {
    label: "Multiple Answer",
    className: "border-rb-macaw bg-rb-macaw-wash text-rb-macaw-lip",
  },
  SHORT_ANSWER: {
    label: "Short Answer",
    className: "border-rb-macaw bg-rb-macaw-wash text-rb-macaw-lip",
  },
  DESCRIPTIVE: {
    label: "Descriptive",
    className: "border-rb-bee bg-rb-bee-wash text-rb-bee-ink",
  },
  CRITICAL_THINKING: {
    label: "Critical Thinking",
    className: "border-rb-fox bg-rb-fox-wash text-rb-fox-lip",
  },
  PROGRAMMING: {
    label: "Programming",
    className: "border-rb-macaw bg-rb-macaw-wash text-rb-macaw-lip",
  },
  DIAGRAM: {
    label: "Diagram",
    className: "border-rb-beetle bg-rb-beetle-wash text-rb-beetle-lip",
  },
  DEFAULT: {
    label: "Question",
    className: "border-rb-swan bg-rb-polar text-rb-wolf",
  },
}

function getQuestionTypeMeta(question) {
  const questionType = String(question?.questionType ?? "").toUpperCase()
  const criticalThinkingType = String(
      question?.criticalThinkingType ?? ""
  ).toUpperCase()

  if (questionType === "MCQ") {
    return QUESTION_TYPE_STYLES.MULTIPLE_CHOICE
  }

  if (questionType === "CRITICAL_THINKING") {
    if (criticalThinkingType === "PROGRAMMING") {
      return QUESTION_TYPE_STYLES.PROGRAMMING
    }

    if (criticalThinkingType === "DIAGRAM") {
      return QUESTION_TYPE_STYLES.DIAGRAM
    }

    return QUESTION_TYPE_STYLES.CRITICAL_THINKING
  }

  return QUESTION_TYPE_STYLES[questionType] ?? QUESTION_TYPE_STYLES.DEFAULT
}

function QuestionTypeBadge({ question }) {
  const typeMeta = getQuestionTypeMeta(question)

  return (
      <Badge
          variant="outline"
          className={cn(
              "h-6 shrink-0 rounded-md px-2 text-[11px] font-semibold",
              typeMeta.className
          )}
      >
        {typeMeta.label}
      </Badge>
  )
}

function QuestionMetaRow({ question, index, itemLabel = "Question" }) {
  return (
      <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold text-muted-foreground">
        {itemLabel} {index + 1}
      </span>

        {question.points != null ? (
            <Badge variant="secondary">{Number(question.points)} pt(s)</Badge>
        ) : null}

        <QuestionTypeBadge question={question} />
      </div>
  )
}

function isAnswered(question, answer) {
  if (!answer) return false
  if (isMultipleChoice(question)) {
    return answer.selectedChoiceId != null
  }
  if (question.questionType === "CRITICAL_THINKING") {
    return (
        Boolean(answer.submittedCode?.trim()) ||
        Boolean(answer.diagramSubmissionData?.trim()) ||
        Object.values(answer.subAnswers ?? {}).some((text) => text?.trim())
    )
  }
  if ((question.subQuestions ?? []).length > 0) {
    return Object.values(answer.subAnswers ?? {}).some((text) => text?.trim())
  }
  return Boolean(answer.learnerAnswer?.trim())
}

function SaveStatusIndicator({ status }) {
  if (status === "saving") {
    return (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2Icon className="size-3 animate-spin" aria-hidden="true" />
        Saving…
      </span>
    )
  }
  if (status === "saved") {
    return (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <CheckIcon className="size-3" aria-hidden="true" />
        Saved
      </span>
    )
  }
  if (status === "error") {
    return (
        <span className="flex items-center gap-1 text-xs text-destructive">
        <CloudOffIcon className="size-3" aria-hidden="true" />
        Unable to save draft
      </span>
    )
  }
  return null
}

function NormalQuestionPanel({ question, index, answer, onAnswer }) {
  return (
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <QuestionMetaRow
            question={question}
            index={index}
            itemLabel="Question"
        />

        <p className="whitespace-pre-wrap text-lg font-semibold leading-8 text-foreground">{question.question}</p>

        <AuthedImage
            imageKey={question.questionImageKey}
            alt="Question reference"
            zoomable
            className="tg-media-img-paper max-h-80 w-auto rounded-xl border dark:p-1.5"
        />

        {isMultipleAnswer(question) ? (
            <MultipleAnswerChoices
                question={question}
                learnerAnswer={answer?.learnerAnswer ?? null}
                onChange={(learnerAnswer) => onAnswer({ learnerAnswer })}
            />
        ) : isMultipleChoice(question) ? (
            <RadioGroup
                value={
                  answer?.selectedChoiceId != null
                      ? String(answer.selectedChoiceId)
                      : ""
                }
                onValueChange={(value) =>
                    onAnswer({ selectedChoiceId: Number(value) })
                }
                className="gap-2"
            >
              {(question.choices ?? []).map((choice, choiceIndex) => (
                  <label
                      key={choice.choiceId ?? choiceIndex}
                      className={cn(
                          "flex min-h-16 cursor-pointer items-start gap-3 rounded-[1rem] border-2 p-4 transition",
                          "active:translate-y-[2px] active:shadow-none",
                          answer?.selectedChoiceId === choice.choiceId
                              ? "border-[var(--tg)] bg-[var(--tg-softer)] shadow-[0_3px_0_var(--tg-line)] ring-4 ring-[var(--tg-soft)]"
                              : "border-[var(--tg-line)] bg-card shadow-[0_3px_0_var(--tg-line)] hover:border-[var(--tg)]"
                      )}
                  >
                    <RadioGroupItem
                        value={String(choice.choiceId)}
                        className="mt-0.5"
                        aria-label={`Choice ${String.fromCharCode(65 + choiceIndex)}`}
                    />
                    <div className="min-w-0">
                <span className="text-sm leading-6">
                  <span className="mr-1.5 font-extrabold text-[var(--tg-ink)]">
                    {String.fromCharCode(65 + choiceIndex)}.
                  </span>
                  {choice.choiceText}
                </span>
                      <AuthedImage
                          imageKey={choice.imageKey}
                          className="tg-media-img-paper mt-2 max-h-40 w-auto rounded-lg border dark:p-1"
                          placeholderClassName="mt-2 h-16 w-full max-w-[10rem]"
                      />
                    </div>
                  </label>
              ))}
            </RadioGroup>
        ) : question.questionType === "SHORT_ANSWER" &&
            (question.subQuestions ?? []).length > 0 ? (

            <div className="space-y-3">
              <Label>Your answers</Label>
              {question.subQuestions.map((sub) => (
                  <div
                      key={sub.subQuestionId}
                      className="flex items-center gap-3"
                  >
                    <span className="w-10 shrink-0 text-sm font-medium text-muted-foreground">
                      {sub.questionText}
                    </span>
                    <Input
                        value={answer?.subAnswers?.[sub.subQuestionId] ?? ""}
                        onChange={(event) =>
                            onAnswer({
                              subAnswers: {
                                ...(answer?.subAnswers ?? {}),
                                [sub.subQuestionId]: event.target.value,
                              },
                            })
                        }
                        placeholder="Type the term"
                    />
                  </div>
              ))}
            </div>
        ) : question.questionType === "SHORT_ANSWER" ? (
            <div className="space-y-2">
              <Label htmlFor="short-answer">Your answer</Label>
              <Input
                  id="short-answer"
                  value={answer?.learnerAnswer ?? ""}
                  onChange={(event) =>
                      onAnswer({ learnerAnswer: event.target.value })
                  }
                  placeholder="Type your answer"
              />
            </div>
        ) : (
            <div className="space-y-2">
              <Label htmlFor="descriptive-answer">Your answer</Label>
              <Textarea
                  id="descriptive-answer"
                  value={answer?.learnerAnswer ?? ""}
                  onChange={(event) =>
                      onAnswer({ learnerAnswer: event.target.value })
                  }
                  placeholder="Write your answer..."
                  className="min-h-48"
              />
              <p className="text-right text-xs text-muted-foreground">
                {(answer?.learnerAnswer ?? "").length} characters
              </p>
            </div>
        )}
      </div>
  )
}

function WorkspaceQuestionPanel({ question, index, answer, onAnswer }) {
  const format = question.criticalThinkingType ?? "TEXT"

  useEffect(() => {
    if (
        format === "PROGRAMMING" &&
        question.starterCode &&
        answer?.submittedCode == null
    ) {
      onAnswer({ submittedCode: question.starterCode })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, question.starterCode])

  const problemPanel = (
      <div className="space-y-4">
        <QuestionMetaRow
            question={question}
            index={index}
            itemLabel="Item"
        />
        <p className="whitespace-pre-wrap text-sm leading-7">
          {question.question}
        </p>
        {question.instructions ? (
            <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {question.instructions}
            </p>
        ) : null}
        {question.diagramType ? (
            <Badge variant="outline">{question.diagramType}</Badge>
        ) : null}
        <AuthedImage
            imageKey={question.questionImageKey}
            alt="Problem reference"
            zoomable
            className="tg-media-img-paper w-full rounded-xl border dark:p-1.5"
        />
      </div>
  )

  const subQuestionTabs =
      (question.subQuestions ?? []).length > 0 ? (
          <SubQuestionTabs
              subQuestions={question.subQuestions.map((sub) => ({
                questionId: sub.subQuestionId,
                questionText: sub.questionText,
              }))}
              answers={answer?.subAnswers ?? {}}
              onAnswerChange={(subQuestionId, text) =>
                  onAnswer({
                    subAnswers: { ...(answer?.subAnswers ?? {}), [subQuestionId]: text },
                  })
              }
          />
      ) : null

  const workspace =
      format === "PROGRAMMING" ? (
          <CodeMirrorProgrammingWorkspace
              value={answer?.submittedCode ?? question.starterCode ?? ""}
              language={answer?.programmingLanguage ?? "Java"}
              starterCode={question.starterCode ?? ""}
              // The shown language goes with the code: before, it was saved only when the
              // dropdown changed, and default-editor code reached the grader with none.
              onChange={(code) => onAnswer({
                submittedCode: code,
                programmingLanguage: answer?.programmingLanguage ?? "Java",
              })}
              onLanguageChange={(language) =>
                  onAnswer({ programmingLanguage: language })
              }
          />
      ) : format === "DIAGRAM" ? (
          <div className="h-full min-h-[420px] overflow-hidden rounded-2xl border-2 border-rb-swan">
            <DiagramArea
                documentId={question.attemptQuestionId ?? question.questionId ?? null}
                initialXml={answer?.diagramSubmissionData}
                onChange={(diagramXml) =>
                    onAnswer({ diagramSubmissionData: diagramXml })
                }
            />
          </div>
      ) : (
          subQuestionTabs ?? (
              <div className="space-y-2">
                <Label htmlFor="workspace-answer">Your answer</Label>
                <Textarea
                    id="workspace-answer"
                    value={answer?.learnerAnswer ?? ""}
                    onChange={(event) =>
                        onAnswer({ learnerAnswer: event.target.value })
                    }
                    className="min-h-64"
                />
              </div>
          )
      )

  return (
      <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[320px_1fr]">
        <ScrollArea className="max-h-full rounded-2xl border-2 border-rb-swan bg-rb-snow p-4">
          {problemPanel}
        </ScrollArea>
        <div className="flex min-h-0 flex-col gap-3">
          {format !== "TEXT" && subQuestionTabs ? (
              <div className="rounded-2xl border-2 border-rb-swan bg-rb-snow p-3">{subQuestionTabs}</div>
          ) : null}
          <div className="min-h-0 flex-1">{workspace}</div>
        </div>
      </div>
  )
}

/** Where the learner types (answers, code editors) keeps normal copy, paste and menus. */
function isEditable(target) {
  return Boolean(target?.closest?.('input, textarea, select, [contenteditable="true"], .cm-editor'))
}

/**
 * While an assessment is open, questions and answer choices cannot be copied out:
 * no right-click menu, no copy or cut, no text selection outside the answer fields.
 */
function useNoCopyDuringAttempt() {
  useEffect(() => {
    const block = (event) => {
      if (!isEditable(event.target)) event.preventDefault()
    }
    const blockKeys = (event) => {
      const key = event.key?.toLowerCase()
      if ((event.ctrlKey || event.metaKey) && (key === "c" || key === "x" || key === "a") && !isEditable(event.target)) {
        event.preventDefault()
      }
    }
    document.body.classList.add("rb-no-copy")
    document.addEventListener("contextmenu", block)
    document.addEventListener("copy", block)
    document.addEventListener("cut", block)
    document.addEventListener("dragstart", block)
    document.addEventListener("keydown", blockKeys)
    return () => {
      document.body.classList.remove("rb-no-copy")
      document.removeEventListener("contextmenu", block)
      document.removeEventListener("copy", block)
      document.removeEventListener("cut", block)
      document.removeEventListener("dragstart", block)
      document.removeEventListener("keydown", blockKeys)
    }
  }, [])
}

/* The other player in a Champions Cup match: whichever seat is not the learner's. */
function opponentName(match, me) {
  const p1 = match.player1
  const p2 = match.player2
  if (me != null) return (p1?.learnerId === me ? p2 : p1)?.displayName ?? "your opponent"
  return [p1?.displayName, p2?.displayName].filter(Boolean).join(" / ")
}

export default function LearnerAssessmentAttemptPage() {
  useNoCopyDuringAttempt()
  const { examId } = useParams()
  const [searchParams] = useSearchParams()
  const questionIndex = searchParams.get("q") != null ? Number(searchParams.get("q")) : null
  const totalProblems = searchParams.get("total") != null ? Number(searchParams.get("total")) : null
  const arenaId = searchParams.get("arena")
  const matchId = searchParams.get("matchId")
  // Champions Cup: which round this is and who the opponent is, for the header.
  const worldCupBracketQuery = useQuery({
    queryKey: ["worldcup-my-bracket"],
    queryFn: getMyWorldCupBracket,
    enabled: arenaId === "worldcup" && matchId != null,
    staleTime: 30_000,
  })
  const worldCupMeQuery = useQuery({
    queryKey: ["learner-portal-data"],
    queryFn: getLearnerPortalData,
    enabled: arenaId === "worldcup" && matchId != null,
    staleTime: 5 * 60 * 1000,
  })
  const worldCupMatch = useMemo(() => {
    const matches = worldCupBracketQuery.data?.matches ?? []
    return matches.find((m) => String(m.matchId) === String(matchId)) ?? null
  }, [worldCupBracketQuery.data, matchId])
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  useEffect(() => {
    prefetchRewards(queryClient).catch(() => {})
  }, [queryClient])

  const identity = getCurrentLearnerIdentity()
  const currentLearnerQuery = useQuery({
    queryKey: ["current-learner"],
    queryFn: getCurrentLearner,
    retry: 1,
    enabled: identity.learnerId == null,
  })
  const learnerId =
      identity.learnerId ?? currentLearnerQuery.data?.learnerId ?? null

  const [attempt, setAttempt] = useState(null)
  const [startError, setStartError] = useState(null)
  const startedRef = useRef(false)

  const [answers, setAnswers] = useState({})
  const answersRef = useRef(answers)
  answersRef.current = answers
  const dirtyRef = useRef(new Set())
  const [saveStatus, setSaveStatus] = useState("idle")

  const [flagged, setFlagged] = useState(() => new Set())
  const [skipped, setSkipped] = useState(() => new Set())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [finishOpen, setFinishOpen] = useState(false)
  const [timeUp, setTimeUp] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(null)
  const warnedRef = useRef({ ten: false, one: false })
  const autoSubmittedRef = useRef(false)
  // The deadline the countdown runs to. It starts at the attempt's expiresAt and moves
  // forward whenever the server credits time spent paused (the learner left the tab).
  const [clockExpiresAt, setClockExpiresAt] = useState(null)
  const currentQuestionIdRef = useRef(null)
  // Off from the moment the paper is handed in: no pausing, copy blocking or exit counting while
  // it is marked. A pause racing the submit hit the attempt's version check and failed one of them.
  const [handedIn, setHandedIn] = useState(false)
  const integrity = useAttemptIntegrity({
    attemptId: attempt?.assessmentAttemptId ?? null,
    // Every certification assessment is policed; a challenge is a game, not a sitting.
    enabled: attempt != null && !timeUp && !handedIn
        && String(attempt.assessmentType ?? "").toUpperCase() !== "CHALLENGE",
    onClock: setClockExpiresAt,
    getQuestionId: () => currentQuestionIdRef.current,
    initialViolations: attempt?.focusViolations,
    initialMaxViolations: attempt?.maxFocusViolations,
    onForfeit: (forfeitedAttemptId) => {
      // The server has already ended the attempt with a score of 0: never auto-submit after it.
      autoSubmittedRef.current = true
      sessionStorage.removeItem(`rebyu-attempt-key-${examId}-${learnerId}`)
      toast.error("You left the assessment too many times. It has ended with a score of 0.")
      queryClient.invalidateQueries({ queryKey: ["learner-portal-data"] })
      navigate(`/learner/results/${forfeitedAttemptId}`, {
        replace: true,
        state: { returnTo: returnPath(location), forfeited: true },
      })
    },
  })

  useEffect(() => {
    if (learnerId == null || startedRef.current) return
    startedRef.current = true
    const keySuffix = questionIndex != null ? `-q${questionIndex}` : ""
    const keyName = `rebyu-attempt-key-${examId}-${learnerId}${keySuffix}`
    let idempotencyKey = sessionStorage.getItem(keyName)
    if (!idempotencyKey) {
      idempotencyKey = crypto.randomUUID()
      sessionStorage.setItem(keyName, idempotencyKey)
    }
    startAssessmentAttempt(examId, learnerId, idempotencyKey, questionIndex, matchId ? Number(matchId) : null)
        .then((response) => {
          setAttempt(response)
          setClockExpiresAt(response.expiresAt ?? null)
          const rehydrated = {}
          Object.values(response.savedAnswers ?? {}).forEach((draft) => {
            let subAnswers
            if (draft.learnerAnswer?.startsWith("{")) {
              try {
                subAnswers = JSON.parse(draft.learnerAnswer)
              } catch {
                subAnswers = undefined
              }
            }
            rehydrated[draft.attemptQuestionId] = {
              learnerAnswer: subAnswers ? undefined : draft.learnerAnswer,
              selectedChoiceId: draft.selectedChoiceId,
              submittedCode: draft.submittedCode,
              programmingLanguage: draft.programmingLanguage,
              diagramSubmissionData: draft.diagramSubmissionData,
              subAnswers,
            }
          })
          setAnswers(rehydrated)
          setFlagged(new Set(response.flaggedAttemptQuestionIds ?? []))
          setSkipped(new Set(response.skippedAttemptQuestionIds ?? []))
          if (response.currentAttemptQuestionId != null) {
            const resumeIndex = (response.questions ?? []).findIndex(
                (question) =>
                    question.attemptQuestionId === response.currentAttemptQuestionId
            )
            if (resumeIndex >= 0) setCurrentIndex(resumeIndex)
          }
          if (response.resumed) {
            toast.info("Resumed your attempt in progress.")
          }
        })
        .catch((error) => {
          sessionStorage.removeItem(keyName)
          setStartError(
              error?.response?.data?.message ??
              "This assessment could not be started."
          )
        })
  }, [examId, learnerId])

  const questions = attempt?.questions ?? []

  useEffect(() => {
    document.body.classList.add("rb-attempt-lock")
    return () => document.body.classList.remove("rb-attempt-lock")
  }, [])

  useEffect(() => {
    if (!attempt) return
    const interval = setInterval(() => {
      if (dirtyRef.current.size === 0) return
      const dirtyIds = [...dirtyRef.current]
      dirtyRef.current = new Set()
      const payload = dirtyIds
          .map((id) => {
            const answer = answersRef.current[id]
            return answer ? toDraftDto(Number(id), answer) : null
          })
          .filter(Boolean)
      if (payload.length === 0) return
      setSaveStatus("saving")
      autosaveAttemptAnswers(attempt.assessmentAttemptId, learnerId, payload)
          .then(() => setSaveStatus("saved"))
          .catch(() => {
            dirtyIds.forEach((id) => dirtyRef.current.add(id))
            setSaveStatus("error")
          })
    }, 1500)
    return () => clearInterval(interval)
  }, [attempt, learnerId])

  const setAnswer = useCallback((attemptQuestionId, patch) => {
    setAnswers((current) => ({
      ...current,
      [attemptQuestionId]: { ...(current[attemptQuestionId] ?? {}), ...patch },
    }))
    dirtyRef.current.add(attemptQuestionId)
  }, [])

  useEffect(() => {
    // While paused the clock stands still; resuming hands back a later deadline.
    if (!clockExpiresAt || integrity.paused) return
    const endAt = new Date(clockExpiresAt).getTime()
    // Warn only when the clock CROSSES a mark while the learner is working: a quiz
    // that starts with 10 minutes or less (or is resumed late) must not open with a
    // "10 minutes remaining" warning.
    let previous = null
    const crossed = (left, mark) => previous != null && previous > mark && left <= mark
    const tick = () => {
      const left = Math.max(0, Math.round((endAt - Date.now()) / 1000))
      setRemainingSeconds(left)
      if (crossed(left, 600) && !warnedRef.current.ten) {
        warnedRef.current.ten = true
        toast.warning("10 minutes remaining.")
      }
      if (crossed(left, 60) && !warnedRef.current.one) {
        warnedRef.current.one = true
        toast.warning("1 minute remaining.")
      }
      previous = left
      if (left === 0) setTimeUp(true)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [clockExpiresAt, integrity.paused])

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [])

  const isDiagnostic = String(attempt?.assessmentType ?? "").toUpperCase() === "DIAGNOSTIC"
  const isChallenge = String(attempt?.assessmentType ?? "").toUpperCase() === "CHALLENGE"
  const isWorldCupChallenge = false
  const isSingleProblemChallenge = isChallenge && arenaId !== "worldcup"
  const isWorldCup = isChallenge && arenaId === "worldcup"
  // A challenge is played, not sat: its screen speaks of rounds and challenges.
  const ROUND_NAMES = { QUARTERFINAL: "Quarterfinals", SEMIFINAL: "Semifinals", FINAL: "Final" }
  const worldCupRound = worldCupMatch ? ROUND_NAMES[worldCupMatch.round] ?? "Match" : "Match"
  const copy = isChallenge
    ? {
        title: isWorldCup ? "Champions Cup" : attempt?.assessmentTitle,
        finish: isWorldCup ? "Submit round" : "Submit challenge",
        submitTitle: isWorldCup ? `Submit your ${worldCupRound.toLowerCase()} answers?` : "Submit this challenge?",
        leaveTitle: isWorldCup ? "Leave this round?" : "Leave this challenge?",
        keep: "Keep playing",
        leave: isWorldCup ? "Leave round" : "Leave challenge",
      }
    : {
        title: attempt?.assessmentTitle,
        finish: "Finish attempt",
        submitTitle: "Submit assessment?",
        leaveTitle: "Leave this attempt?",
        keep: "Keep Taking Assessment",
        leave: "Leave Attempt",
      }

  const answeredIds = useMemo(() => {
    const set = new Set()
    questions.forEach((question) => {
      if (isAnswered(question, answers[question.attemptQuestionId])) {
        set.add(question.attemptQuestionId)
      }
    })
    return set
  }, [questions, answers])

  const navItems = useMemo(
      () =>
          questions.map((question) => {
            const answer = answers[question.attemptQuestionId]
            const subs = question.subQuestions ?? []
            const subAnswers = answer?.subAnswers ?? {}
            const subAnsweredCount = subs.filter((sub) =>
                subAnswers[sub.subQuestionId]?.trim()
            ).length
            return {
              attemptQuestionId: question.attemptQuestionId,
              points: question.points,
              questionType: question.questionType,
              subQuestionCount: subs.length,
              subAnsweredCount,
              answered: answeredIds.has(question.attemptQuestionId),
              skipped: skipped.has(question.attemptQuestionId),
              flagged: flagged.has(question.attemptQuestionId),
            }
          }),
      [questions, answers, answeredIds, skipped, flagged]
  )

  useEffect(() => {
    prefetchAuthedMedia(
        questions.slice(currentIndex, currentIndex + 4).flatMap(questionMediaKeys)
    )
  }, [questions, currentIndex])

  useEffect(() => {
    if (!attempt || attempt.adaptive || !questions[currentIndex]) return
    const attemptQuestionId = questions[currentIndex].attemptQuestionId
    const timeout = setTimeout(() => {
      setAttemptCurrentItem(
          attempt.assessmentAttemptId,
          attemptQuestionId,
          learnerId
      ).catch(() => {})
    }, 400)
    return () => clearTimeout(timeout)
  }, [attempt, currentIndex, questions, learnerId])

  const toggleFlag = useCallback(
      (attemptQuestionId) => {
        const willFlag = !flagged.has(attemptQuestionId)
        setFlagged((current) => {
          const next = new Set(current)
          if (willFlag) next.add(attemptQuestionId)
          else next.delete(attemptQuestionId)
          return next
        })
        if (attempt) {
          setAttemptFlag(
              attempt.assessmentAttemptId,
              attemptQuestionId,
              learnerId,
              willFlag
          ).catch(() => {})
        }
      },
      [attempt, learnerId, flagged]
  )

  const skipCurrent = useCallback(() => {
    const question = questions[currentIndex]
    if (!question) return
    setSkipped((current) => new Set(current).add(question.attemptQuestionId))
    if (attempt) {
      setAttemptSkip(
          attempt.assessmentAttemptId,
          question.attemptQuestionId,
          learnerId,
          true
      ).catch(() => {})
    }
    setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))
  }, [attempt, currentIndex, questions, learnerId])

  const submitMutation = useMutation({
    mutationFn: () => {
      const payload = questions
          .map((question) => {
            const answer = answers[question.attemptQuestionId]
            return answer
                ? toDraftDto(question.attemptQuestionId, answer)
                : null
          })
          .filter(Boolean)
      return submitAssessmentAttempt(
          attempt.assessmentAttemptId,
          learnerId,
          payload
      )
    },
    onMutate: () => {
      setHandedIn(true)
      return snapshotRewards(queryClient)
    },
    onSuccess: (result, _variables, before) => {
      sessionStorage.removeItem(`rebyu-attempt-key-${examId}-${learnerId}`)

      queryClient.setQueryData(
        ["attempt-result", String(result.assessmentAttemptId), learnerId],
        result
      )

      const challengeType = String(attempt?.assessmentType ?? "").toUpperCase() === "CHALLENGE"
      if (challengeType && matchId) {
        import("@/services/challengeService.js").then(({ reportWorldCupScore }) => {
          reportWorldCupScore(matchId, result.assessmentAttemptId, result.percentage ?? 0).catch(() => {})
        })
        navigate(`/learner/results/${result.assessmentAttemptId}`, {
          replace: true,
          state: { returnTo: "/learner/challenges/world-cup", fromChallenge: true, isWorldCup: true, matchId: Number(matchId) },
        })
      } else if (challengeType) {
        navigate(`/learner/results/${result.assessmentAttemptId}`, {
          replace: true,
          state: {
            returnTo: { codestrike: "/learner/challenges/codestrike", blueprint: "/learner/challenges/blueprint-arena" }[arenaId] ?? "/learner/challenges",
            fromChallenge: true,
            arenaId,
            questionIndex,
            totalProblems,
          },
        })
      } else {
        navigate(`/learner/results/${result.assessmentAttemptId}`, {
          replace: true,
          state: { returnTo: returnPath(location) },
        })
      }

      if (!challengeType) {
        announceRewards({
          queryClient,
          before,
          title: "Assessment submitted",
          fallback: "You had already earned the XP for this assessment.",
        }).catch(() => {})
      }
      queryClient.invalidateQueries({
        queryKey: ["learner-progress-analytics", String(result.certificationId)],
      })
      queryClient.invalidateQueries({ queryKey: ["learner-streak"] })

      queryClient.invalidateQueries({ queryKey: ["learner-portal-data"] })
    },
    onError: (error) => {
      // Back in the attempt after a failed submit: the guard applies again.
      setHandedIn(false)
      toast.error(
          error?.response?.data?.message ??
          "Unable to submit the assessment. Please try again."
      )
    },
  })

  useEffect(() => {
    if (timeUp && attempt && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true
      toast.warning("Time is up — submitting your attempt.")
      submitMutation.mutate()
    }
  }, [timeUp, attempt, submitMutation])

  const leavingRef = useRef(false)
  const hadPriorHistoryRef = useRef(
    typeof window !== "undefined" ? window.history.length > 1 : true
  )

  useEffect(() => {
    if (!attempt || submitMutation.isSuccess || leavingRef.current) return undefined

    if (!window.history.state?.rebyuAttemptGuard) {
      window.history.pushState(
        { ...(window.history.state ?? {}), rebyuAttemptGuard: true },
        "",
        window.location.href
      )
    }

    const onPopState = () => {
      if (leavingRef.current || submitMutation.isPending || submitMutation.isSuccess) return
      window.history.pushState(
        { ...(window.history.state ?? {}), rebyuAttemptGuard: true },
        "",
        window.location.href
      )
      setLeaveOpen(true)
    }

    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [attempt, submitMutation.isPending, submitMutation.isSuccess])

  const confirmLeave = useCallback(() => {
    leavingRef.current = true
    setLeaveOpen(false)
    if (window.history.state?.rebyuAttemptGuard) {
      if (hadPriorHistoryRef.current) window.history.go(-2)
      else navigate(returnPath(location) || "/learner/learning", { replace: true })
      return
    }
    navigate(-1)
  }, [location, navigate])




  if (submitMutation.isPending || submitMutation.isSuccess) {
    return <LoadingSignal messages={gradingMessagesFor(questions)} />
  }

  if (startError) {
    return (
        <div className="flex min-h-dvh items-center justify-center p-6">
          <div className="max-w-md rounded-2xl border bg-card p-8 text-center">
            <p className="font-medium">Assessment unavailable</p>
            <p className="mt-1 text-sm text-muted-foreground">{startError}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {/REBYU Pro/.test(startError) ? (
                <Button onClick={() => navigate("/learner/subscription")}>Upgrade to Pro</Button>
              ) : null}
            </div>
          </div>
        </div>
    )
  }

  if (!attempt) {
    return <AttemptSkeleton />
  }

  const currentQuestion = questions[currentIndex]
  currentQuestionIdRef.current = currentQuestion?.attemptQuestionId ?? null

  const workspaceKind =
      currentQuestion?.criticalThinkingType
      ?? (currentQuestion?.questionType === "PROGRAMMING"
          || currentQuestion?.questionType === "DIAGRAM"
              ? currentQuestion.questionType
              : null)

  const isProgramming = workspaceKind === "PROGRAMMING"
  const isDiagram = workspaceKind === "DIAGRAM"

  const isWorkspace = currentQuestion?.questionType === "CRITICAL_THINKING"
  const currentAnswer = currentQuestion
      ? answers[currentQuestion.attemptQuestionId]
      : null
  const editingLocked = timeUp || submitMutation.isPending

  const navigatorPanel = (
      <QuestionNavigator
          items={navItems}
          currentIndex={currentIndex}
          onJump={setCurrentIndex}
          onFinish={() => setFinishOpen(true)}
          finishDisabled={submitMutation.isPending}
      />
  )

  const leaveDialog = (
    <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
      <AlertDialogContent className="rebyu-ds tg-cat-explain">
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.leaveTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {attempt?.adaptive ? (
              "Your saved answers stay on the server — you can resume this attempt later."
            ) : (
              <>
                You have answered {answeredIds.size} of {questions.length}{" "}
                question(s)
                {flagged.size > 0 ? `, with ${flagged.size} flagged` : ""}. Your
                saved drafts stay on the server — you can resume this attempt
                later.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="tg-btn">
            {copy.keep}
          </AlertDialogCancel>
          <AlertDialogAction className="tg-btn tg-btn-primary" onClick={confirmLeave}>
            {copy.leave}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  const pausedModal = (
      <AttemptPausedModal
          open={integrity.paused}
          violations={integrity.violations}
          maxViolations={integrity.maxViolations}
          resuming={integrity.resuming}
          onResume={integrity.resume}
      />
  )

  if (attempt.adaptive) {
    return (
        <>
          {pausedModal}
          <AdaptiveAttemptRunner
              attempt={attempt}
              learnerId={learnerId}
              remainingSeconds={remainingSeconds}
              timeUp={timeUp}
              onFinish={() => {
                if (!submitMutation.isPending && !submitMutation.isSuccess) submitMutation.mutate()
              }}
              onLeave={() => setLeaveOpen(true)}
              isSubmitting={submitMutation.isPending || submitMutation.isSuccess}
              toDraftDto={toDraftDto}
              isMultipleChoice={isMultipleChoice}
              WorkspaceQuestionPanel={WorkspaceQuestionPanel}
          />
          {leaveDialog}
        </>
    )
  }

  if (attempt.assessmentType === "GENERATED_QUIZ" && !timeUp) {
    return (
        <>
          {pausedModal}
          <GeneratedQuizArena
              attempt={attempt}
              questions={questions}
              answers={answers}
              onAnswer={setAnswer}
              onCheckChoice={(attemptQuestionId, selectedChoiceId) =>
                checkChoiceAnswer(attempt.assessmentAttemptId, attemptQuestionId, learnerId, selectedChoiceId)
              }
              currentIndex={currentIndex}
              onIndexChange={setCurrentIndex}
              onFinish={() => submitMutation.mutate()}
              onLeave={() => setLeaveOpen(true)}
              isSubmitting={submitMutation.isPending}
              remainingSeconds={remainingSeconds}
          />
          {leaveDialog}
        </>
    )
  }

  return (
      <div className="rebyu-ds tg-cat-explain flex h-dvh flex-col overflow-hidden bg-[var(--tg-softer)]">
        {pausedModal}
        <header className="shrink-0 border-b border-[var(--tg-line)] bg-card">
          <div className="flex min-h-16 items-center justify-between gap-2 px-3 py-2 sm:px-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <button type="button" className="tg-btn !h-9 shrink-0 !px-2.5 sm:!px-3.5" onClick={() => setLeaveOpen(true)} aria-label="Exit attempt">
              <ArrowLeftIcon aria-hidden="true" />
              <span className="hidden sm:inline">Exit</span>
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate font-rb-display text-base font-extrabold leading-tight text-foreground sm:text-lg">
                {copy.title}
              </p>
              <p className="truncate whitespace-nowrap text-[11px] font-semibold leading-tight text-muted-foreground sm:text-xs">
                {isSingleProblemChallenge
                  ? `Problem ${(questionIndex ?? 0) + 1}${totalProblems ? ` of ${totalProblems}` : ""}`
                  : isWorldCup
                    ? `${worldCupRound} · question ${currentIndex + 1} of ${questions.length}${
                        worldCupMatch ? ` · vs ${opponentName(worldCupMatch, worldCupMeQuery.data?.learnerId)}` : ""
                      }`
                    : `Question ${currentIndex + 1} of ${questions.length} · Attempt ${attempt.attemptNumber}`}
              </p>
            </div>
            <span className="tg-chip max-sm:hidden">
              {getAssessmentTypeLabel(attempt.assessmentType)}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <SaveStatusIndicator status={saveStatus} />

            {remainingSeconds != null ? (
                <span
                    className={cn(
                        "flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold tabular-nums sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-sm",
                        remainingSeconds <= 120
                            ? "border-rb-cardinal bg-rb-cardinal-wash text-rb-cardinal-lip"
                            : remainingSeconds <= 600
                                ? "border-rb-bee bg-rb-bee-wash text-rb-bee-ink"
                                : "border-[var(--tg-line)] bg-[var(--tg-softer)] text-[var(--tg-ink)]",
                        remainingSeconds > 0 &&
                        remainingSeconds <= 60 &&
                        "rb-timer-urgent"
                    )}
                    role="timer"
                    aria-label={describeCountdown(remainingSeconds)}
                >
              <ClockIcon className="size-3.5 sm:size-4" aria-hidden="true" />
                  {formatCountdown(remainingSeconds)}
            </span>
            ) : null}

            <PortalThemeToggle className="tg-btn tg-icon-btn !size-9 shrink-0" />

            {!isSingleProblemChallenge && (
              <Sheet>
                <SheetTrigger asChild>
                  <button type="button" className="tg-btn tg-icon-btn !size-9 lg:!hidden" aria-label="Open item navigation">
                    <ListIcon />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="overflow-hidden p-4">
                  <SheetHeader className="p-0 pb-3">
                    <SheetTitle>Item Navigation</SheetTitle>
                  </SheetHeader>
                  {navigatorPanel}
                </SheetContent>
              </Sheet>
            )}

            {!isSingleProblemChallenge && (
              <button
                  type="button"
                  className="tg-btn tg-btn-primary max-lg:!hidden"
                  onClick={() => setFinishOpen(true)}
                  disabled={submitMutation.isPending}
              >
                <CheckIcon aria-hidden="true" />
                {copy.finish}
              </button>
            )}
          </div>
          </div>


          <div
              className="h-2 w-full bg-[var(--tg-soft)]"
              role="progressbar"
              aria-valuenow={answeredIds.size}
              aria-valuemin={0}
              aria-valuemax={questions.length}
              aria-valuetext={`${answeredIds.size} of ${questions.length} questions answered`}
              aria-label="Attempt progress"
          >
            <div
                className={cn(
                    "tg-solid-soft h-full transition-[width] duration-500 ease-out",
                    answeredIds.size > 0 &&
                    answeredIds.size < questions.length &&
                    "rounded-r-full"
                )}
                style={{
                  width: `${
                      questions.length
                          ? (answeredIds.size / questions.length) * 100
                          : 0
                  }%`,
                }}
            />
          </div>
        </header>

        <div className="flex min-h-0 flex-1 gap-4 overflow-hidden p-2 sm:p-4">
          {isProgramming && currentQuestion ? (
              <div
                  className={cn(
                      "flex min-h-0 flex-1 flex-col overflow-hidden",
                      editingLocked && "pointer-events-none opacity-70"
                  )}
              >
                <div className="min-h-0 flex-1 overflow-hidden">
                  <ProgrammingQuestionLayout
                      key={currentQuestion.attemptQuestionId}
                      question={currentQuestion}
                      index={currentIndex}
                      answer={currentAnswer}
                      onAnswer={(patch) =>
                          setAnswer(currentQuestion.attemptQuestionId, patch)
                      }
                      attemptId={attempt.assessmentAttemptId}
                      attemptQuestionId={currentQuestion.attemptQuestionId}
                      learnerId={learnerId}
                      navigator={isSingleProblemChallenge ? null : navigatorPanel}
                      editingLocked={editingLocked}
                  />
                </div>
              </div>
          ) : isDiagram && currentQuestion ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="min-h-0 flex-1 overflow-hidden">
                  <DiagramQuestionLayout
                      question={currentQuestion}
                      index={currentIndex}
                      answer={currentAnswer}
                      onAnswer={(patch) =>
                          setAnswer(currentQuestion.attemptQuestionId, patch)
                      }
                      attemptId={attempt.assessmentAttemptId}
                      attemptQuestionId={currentQuestion.attemptQuestionId}
                      learnerId={learnerId}
                      navigator={isSingleProblemChallenge ? null : navigatorPanel}
                      editingLocked={editingLocked}
                      isChallenge={isSingleProblemChallenge}
                  />
                </div>
              </div>
          ) : (
              <>
                <main
                    className={cn(
                        "min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 rounded-[1.1rem] border border-[var(--tg-line)] bg-card shadow-[0_4px_0_color-mix(in_oklab,var(--tg)_14%,transparent)]",
                        editingLocked && "pointer-events-none opacity-70"
                    )}
                    aria-live="polite"
                >
                  {currentQuestion ? (
                      isWorkspace ? (
                          <WorkspaceQuestionPanel
                              key={currentQuestion.attemptQuestionId}
                              question={currentQuestion}
                              index={currentIndex}
                              answer={currentAnswer}
                              onAnswer={(patch) =>
                                  setAnswer(currentQuestion.attemptQuestionId, patch)
                              }
                          />
                      ) : (
                          <NormalQuestionPanel
                              key={currentQuestion.attemptQuestionId}
                              question={currentQuestion}
                              index={currentIndex}
                              answer={currentAnswer}
                              onAnswer={(patch) =>
                                  setAnswer(currentQuestion.attemptQuestionId, patch)
                              }
                          />
                      )
                  ) : null}
                </main>

                {!isSingleProblemChallenge && (
                  <aside className="hidden min-h-0 w-72 shrink-0 overflow-hidden p-4 lg:block rounded-[1.1rem] border border-[var(--tg-line)] bg-card shadow-[0_4px_0_color-mix(in_oklab,var(--tg)_14%,transparent)]">
                    {navigatorPanel}
                  </aside>
                )}
              </>
          )}
        </div>

        <footer className="flex h-16 shrink-0 items-center justify-between gap-2 border-t border-[var(--tg-line)] bg-card px-4">
          {isWorldCupChallenge ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  if (questionIndex != null && questionIndex > 0) {
                    navigate(`/learner/assessments/${examId}?q=${questionIndex - 1}${totalProblems ? `&total=${totalProblems}` : ""}${arenaId ? `&arena=${arenaId}` : ""}`)
                  } else {
                    navigate("/learner/challenges")
                  }
                }}
              >
                <ChevronLeftIcon aria-hidden="true" />
                {questionIndex != null && questionIndex > 0 ? "Previous" : "Back"}
              </Button>

              <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                {(questionIndex ?? 0) + 1} / {totalProblems ?? "?"}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setFinishOpen(true)}
                  disabled={submitMutation.isPending || editingLocked}
                >
                  <CheckIcon aria-hidden="true" />
                  Submit Answer
                </Button>
                {questionIndex != null && totalProblems != null && questionIndex < totalProblems - 1 ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigate(`/learner/assessments/${examId}?q=${questionIndex + 1}&total=${totalProblems}${arenaId ? `&arena=${arenaId}` : ""}`)
                    }}
                  >
                    Next
                    <ChevronRightIcon aria-hidden="true" />
                  </Button>
                ) : null}
              </div>
            </>
          ) : isSingleProblemChallenge ? (
            <>
              <span />
              <Button
                onClick={() => setFinishOpen(true)}
                disabled={submitMutation.isPending || editingLocked}
              >
                <CheckIcon aria-hidden="true" />
                Submit Answer
              </Button>
            </>
          ) : (
            <>
              <button
                  type="button"
                  className="tg-btn"
                  onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
                  disabled={currentIndex === 0}
              >
                <ChevronLeftIcon aria-hidden="true" />
                Previous
              </button>

              <div className="flex items-center gap-3">
                {currentQuestion ? (
                    <button
                        type="button"
                        className={cn(
                            "tg-btn !rounded-full !px-3 !py-1.5 !text-xs",
                            flagged.has(currentQuestion.attemptQuestionId) && "!border-rb-bee !bg-rb-bee-wash !text-rb-bee-ink"
                        )}
                        onClick={() => toggleFlag(currentQuestion.attemptQuestionId)}
                        disabled={editingLocked}
                        aria-pressed={flagged.has(currentQuestion.attemptQuestionId)}
                        aria-label={
                          flagged.has(currentQuestion.attemptQuestionId)
                              ? "Flagged for review"
                              : "Flag for review"
                        }
                    >
                      <FlagIcon
                          className={cn(
                              flagged.has(currentQuestion.attemptQuestionId) &&
                              "fill-amber-400 text-amber-500"
                          )}
                          aria-hidden="true"
                      />
                      <span className="hidden sm:inline">
                        {flagged.has(currentQuestion.attemptQuestionId)
                            ? "Flagged"
                            : "Flag for review"}
                      </span>
                    </button>
                ) : null}
                {currentQuestion &&
                !answeredIds.has(currentQuestion.attemptQuestionId) &&
                currentIndex < questions.length - 1 ? (
                    <button
                        type="button"
                        className="tg-btn !rounded-full !px-3 !py-1.5 !text-xs"
                        onClick={skipCurrent}
                        disabled={editingLocked}
                        aria-label="Skip this question"
                    >
                      <SkipForwardIcon aria-hidden="true" />
                      <span className="hidden sm:inline">Skip</span>
                    </button>
                ) : null}
                <span className="hidden text-sm font-bold tabular-nums text-muted-foreground sm:block">
                {currentIndex + 1} / {questions.length}
              </span>
              </div>

              <div className="flex min-w-24 justify-end sm:min-w-32">
                {currentIndex === questions.length - 1 ? (
                    <button
                        type="button"
                        className="tg-btn tg-btn-primary lg:!hidden"
                        onClick={() => setFinishOpen(true)}
                        disabled={submitMutation.isPending}
                    >
                      {copy.finish}
                    </button>
                ) : (
                    <button
                        type="button"
                        className="tg-btn tg-btn-primary"
                        onClick={() =>
                            setCurrentIndex((index) =>
                                Math.min(questions.length - 1, index + 1)
                            )
                        }
                    >
                      Next
                      <ChevronRightIcon aria-hidden="true" />
                    </button>
                )}
              </div>
            </>
          )}
        </footer>

        {leaveDialog}

        <AlertDialog open={finishOpen} onOpenChange={setFinishOpen}>
          <AlertDialogContent className="rebyu-ds">
            <AlertDialogHeader>
              <AlertDialogTitle>{copy.submitTitle}</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2 text-sm">
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <dt className="text-muted-foreground">{isChallenge ? "Questions" : "Total items"}</dt>
                    <dd className="text-right tabular-nums">
                      {questions.length}
                    </dd>
                    <dt className="text-muted-foreground">Answered</dt>
                    <dd className="text-right tabular-nums">
                      {answeredIds.size}
                    </dd>
                    <dt className="text-muted-foreground">Unanswered</dt>
                    <dd className="text-right tabular-nums">
                      {questions.length - answeredIds.size}
                    </dd>
                    {isChallenge ? null : (
                      <>
                        <dt className="text-muted-foreground">Flagged</dt>
                        <dd className="text-right tabular-nums">{flagged.size}</dd>
                        <dt className="text-muted-foreground">XP on completion</dt>
                        <dd className="text-right tabular-nums">
                          {ASSESSMENT_XP.attempted}–{ASSESSMENT_XP.perfect} XP
                        </dd>
                      </>
                    )}
                    {remainingSeconds != null ? (
                        <>
                          <dt className="text-muted-foreground">Time remaining</dt>
                          <dd className="text-right tabular-nums">
                            {formatCountdown(remainingSeconds)}
                          </dd>
                        </>
                    ) : null}
                  </dl>
                  {questions.length - answeredIds.size > 0 ? (
                      <p className="text-destructive">
                        {isDiagnostic && !timeUp
                          ? "Answer every question before submitting. Your diagnostic decides where your study plan starts."
                          : isWorldCup
                            ? "Unanswered questions score nothing, and the higher score goes through."
                            : "Unanswered items may receive no score."}
                      </p>
                  ) : null}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                  className="tg-btn"
                  disabled={submitMutation.isPending}
              >
                {isChallenge ? "Keep playing" : "Review Answers"}
              </AlertDialogCancel>
              {isDiagnostic && !timeUp && questions.length - answeredIds.size > 0 ? (
                <AlertDialogAction
                    className="tg-btn tg-btn-primary"
                    onClick={(event) => {
                      event.preventDefault()
                      const first = questions.findIndex(
                        (question) => !answeredIds.has(question.attemptQuestionId)
                      )
                      if (first >= 0) setCurrentIndex(first)
                      setFinishOpen(false)
                    }}
                >
                  Go to first unanswered
                </AlertDialogAction>
              ) : (
                <AlertDialogAction
                    className="tg-btn tg-btn-primary"
                    onClick={(event) => {
                      event.preventDefault()
                      submitMutation.mutate()
                    }}
                    disabled={submitMutation.isPending}
                >
                  {submitMutation.isPending ? "Submitting..." : isChallenge ? copy.finish : "Submit Assessment"}
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={timeUp && !submitMutation.isPending}>
          <AlertDialogContent className="rebyu-ds">
            <AlertDialogHeader>
              <AlertDialogTitle>Time is up</AlertDialogTitle>
              <AlertDialogDescription>
                {isChallenge
                  ? "Time is up for this round. Your answers are locked in; submit them now."
                  : "The time limit for this assessment has been reached. Editing is locked — submit your answers now."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                  className="tg-btn tg-btn-primary"
                  onClick={(event) => {
                    event.preventDefault()
                    submitMutation.mutate()
                  }}
              >
                {isChallenge ? copy.finish : "Submit Assessment"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  )
}
