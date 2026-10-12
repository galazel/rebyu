import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Loader2,
  PanelLeft,
  Pencil,
  RotateCcw,
  Sparkles,
  XCircle,
} from "@/components/icons"
import { TactileButton } from "@/components/rebyu/rebyu-ui.jsx"
import { Collapse, Reveal, motion, popIn } from "@/components/motion/rebyu-motion.jsx"
import { submitTopicReflection } from "@/services/reflectionService.js"

const MIN_CHARS = 20
const MAX_CHARS = 6000

function draftKey(middleId) {
  return `rebyu:reflection-draft:${middleId}`
}

function readDraft(middleId) {
  try {
    return window.localStorage.getItem(draftKey(middleId)) ?? ""
  } catch {
    return ""
  }
}

function writeDraft(middleId, value) {
  try {
    if (value) window.localStorage.setItem(draftKey(middleId), value)
    else window.localStorage.removeItem(draftKey(middleId))
  } catch {
    /* storage unavailable: the draft just isn't remembered */
  }
}

function percentText(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return "—"
  return `${Number.isInteger(number) ? number : number.toFixed(2)}%`
}

function formatDate(value) {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : ""
}

function Header({ position, total, title, backTo, onOpenOutline }) {
  return (
    <div className="sticky top-0 z-10 border-b-2 border-rb-swan bg-rb-snow/95 px-5 backdrop-blur supports-[backdrop-filter]:bg-rb-snow/80 sm:px-10 lg:px-14">
      <div className="flex h-[var(--rb-topbar-h)] items-center justify-between gap-2 sm:gap-4">
        {onOpenOutline ? (
          <button
            type="button"
            onClick={onOpenOutline}
            aria-label="Open topic outline"
            title="Topic outline"
            className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-rb-swan bg-white text-rb-eel transition-transform active:scale-95 xl:hidden"
          >
            <PanelLeft className="size-5" aria-hidden="true" />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="rb-eyebrow">
            step {position} of {total} · practice assignment
          </p>
          <h1 className="mt-0.5 truncate font-rb-display text-lg font-extrabold text-rb-eel sm:text-xl">
            {title}
          </h1>
        </div>
        {backTo ? (
          <TactileButton asChild variant="feather" size="sm" className="shrink-0">
            <Link to={backTo} aria-label="Back to curriculum">
              <span className="hidden sm:inline">back to curriculum</span>
              <span className="sm:hidden">curriculum</span>
            </Link>
          </TactileButton>
        ) : null}
      </div>
    </div>
  )
}

function Assignment({ reflection, points }) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1 space-y-4 text-rb-eel">
        <p className="rb-body-lg">
          <strong>Scenario:</strong> {reflection.scenario}
        </p>
        <p className="rb-body-lg">
          <strong>Prompt:</strong> {reflection.prompt}
        </p>
        <ul className="list-disc space-y-2 pl-6">
          {(reflection.parts ?? []).map((part, index) => (
            <li key={index} className="rb-body-lg">
              {part}
            </li>
          ))}
        </ul>
        <p className="rb-body-lg">
          Your answer should have <strong>{(reflection.parts ?? []).length} parts</strong> and you may answer in a list
          or a short paragraph.
        </p>
      </div>
      <div className="flex shrink-0 flex-row gap-2 sm:flex-col sm:items-end">
        <span className="rounded-full bg-rb-polar px-3 py-1 text-sm font-extrabold text-rb-eel">{points}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rb-macaw-wash px-3 py-1 text-sm font-extrabold text-rb-macaw-lip">
          <Sparkles className="size-3.5" aria-hidden="true" /> AI-graded
        </span>
      </div>
    </div>
  )
}

function Overview({ reflection, onStart, onViewFeedback, onContinue, examLabel }) {
  const latest = reflection.latest
  const best = reflection.best
  const passed = reflection.passed

  return (
    <Reveal
      variants={popIn}
      amount={0}
      className="mx-auto w-full max-w-6xl overflow-hidden rounded-rb-card border-2 border-rb-swan bg-rb-snow shadow-[var(--comic-shadow-sm)]"
    >
      <div className="bg-rb-macaw-wash p-8 sm:p-12">
        <p className="text-sm font-bold text-rb-macaw-lip">Practice assignment · self-reflection</p>
        <h2 className="rb-display rb-display-sm mt-2">{reflection.title}</h2>
        <p className="rb-body-lg mt-4 max-w-3xl">
          You've worked through every lesson in this topic. Now step back and make it yours: recall a moment from
          your own life where these ideas showed up, picture the real problems a professional solves with them, and
          explain why the skill matters. Putting it in your own words is what turns what you read into what you
          understand, and it's the best warm-up for {examLabel}.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-4">
          <TactileButton variant="macaw" onClick={onStart}>
            {latest ? "try again" : "start reflection"}
            <ArrowRight className="size-4" />
          </TactileButton>
          {passed && onContinue ? (
            <TactileButton variant="fox" onClick={onContinue}>
              go to {examLabel}
              <ArrowRight className="size-4" />
            </TactileButton>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 p-8 sm:p-12 lg:grid-cols-[minmax(0,1fr)_280px]">
        {latest ? (
          <div
            className={`rounded-rb-card border-2 p-5 ${
              passed ? "border-rb-feather bg-rb-feather-wash" : "border-rb-cardinal bg-rb-cardinal-wash"
            }`}
          >
            <p className="font-extrabold text-rb-eel">{passed ? "You passed." : "You didn't pass yet."}</p>
            <p className="mt-1 text-sm text-rb-eel">
              To pass you need a grade of at least {reflection.passPercent}%. We keep your highest score.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <span
                className={`rb-numeric text-3xl font-extrabold ${passed ? "text-rb-feather-ink" : "text-rb-cardinal-lip"}`}
              >
                {percentText(best?.scorePercent)}
              </span>
              <button
                type="button"
                onClick={onViewFeedback}
                className="rounded-xl border-2 border-rb-swan bg-white px-3 py-1.5 text-sm font-extrabold text-rb-eel hover:bg-rb-polar"
              >
                view feedback
              </button>
            </div>
            <p className="mt-3 text-xs text-rb-wolf">Submitted {formatDate(latest.submittedAt)}</p>
          </div>
        ) : (
          <div className="rounded-rb-card border-2 border-dashed border-rb-swan p-5 text-rb-wolf">
            You haven't submitted this reflection yet.
          </div>
        )}

        <div className="rounded-rb-card border-2 border-rb-swan p-5">
          <p className="font-extrabold text-rb-eel">What to expect</p>
          <ul className="mt-3 space-y-2.5 text-sm text-rb-eel">
            <li className="flex items-center gap-2.5">
              <CalendarDays className="size-4 text-rb-wolf" aria-hidden="true" /> About 8 minutes
            </li>
            <li className="flex items-center gap-2.5">
              <RotateCcw className="size-4 text-rb-wolf" aria-hidden="true" /> Unlimited attempts
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="size-4 text-rb-feather" aria-hidden="true" /> {reflection.passPercent}% unlocks
              the exam
            </li>
            <li className="flex items-center gap-2.5">
              <Sparkles className="size-4 text-rb-macaw-lip" aria-hidden="true" /> Graded by AI against a{" "}
              {(reflection.rubric ?? []).length}-point rubric
            </li>
          </ul>
        </div>
      </div>
    </Reveal>
  )
}

function Write({ reflection, middleId, onBack, onSubmitted }) {
  const queryClient = useQueryClient()
  const [answer, setAnswer] = useState(() => readDraft(middleId) || "")

  useEffect(() => {
    writeDraft(middleId, answer)
  }, [middleId, answer])

  const submit = useMutation({
    mutationFn: () => submitTopicReflection(middleId, answer.trim()),
    onSuccess: (view) => {
      writeDraft(middleId, "")
      queryClient.setQueryData(["learner-reflection", String(middleId)], view)
      onSubmitted(view)
    },
    onError: (error) => {
      toast.error("Could not submit your reflection", {
        description: error?.response?.data?.message ?? error?.message ?? "Please try again.",
      })
    },
  })

  const length = answer.trim().length
  const tooShort = length < MIN_CHARS

  return (
    <div className="mx-auto w-full max-w-4xl">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-extrabold text-rb-macaw-lip hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> back
      </button>

      <ol className="space-y-6">
        <li className="flex gap-3">
          <span className="font-extrabold text-rb-eel">1.</span>
          <div className="min-w-0 flex-1 space-y-6">
            <Assignment reflection={reflection} points={`${(reflection.rubric ?? []).length} points`} />

            <label className="block">
              <span className="sr-only">Your reflection</span>
              <textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value.slice(0, MAX_CHARS))}
                rows={10}
                disabled={submit.isPending}
                placeholder="Write your reflection here…"
                className="w-full resize-y rounded-rb-card border-2 border-rb-swan bg-white p-4 text-base leading-relaxed text-rb-eel outline-none focus:border-rb-macaw disabled:opacity-70"
              />
              <span className="mt-1 block text-right text-xs text-rb-wolf">
                {length} / {MAX_CHARS}
              </span>
            </label>
          </div>
        </li>
      </ol>

      <div className="mt-8 border-t-2 border-rb-swan pt-6">
        <p className="font-extrabold text-rb-eel">Honor code</p>
        <p className="mt-1 text-sm text-rb-wolf">
          By submitting, you confirm this reflection is your own words and your own experience.
        </p>
        <TactileButton
          variant="macaw"
          className="mt-5"
          disabled={tooShort || submit.isPending}
          onClick={() => submit.mutate()}
        >
          {submit.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> grading…
            </>
          ) : (
            <>
              submit
              <ArrowRight className="size-4" />
            </>
          )}
        </TactileButton>
        {tooShort ? (
          <p className="mt-2 text-xs text-rb-wolf">Write at least {MIN_CHARS} characters to submit.</p>
        ) : null}
      </div>
    </div>
  )
}

function RubricCard({ index, criterion, grade }) {
  const [open, setOpen] = useState(true)
  const earned = Number(grade?.earnedPoints ?? 0)
  const max = Number(grade?.maxPoints ?? 1)

  return (
    <div className="rounded-rb-card border-2 border-rb-swan bg-white">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-5 text-left"
      >
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="grid place-items-center text-rb-wolf">
          <ChevronDown className="size-4" aria-hidden="true" />
        </motion.span>
        <span className="flex-1 font-bold text-rb-eel">Rubric {index}</span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
            earned >= max ? "bg-rb-feather-wash text-rb-feather-ink" : "bg-rb-cardinal-wash text-rb-cardinal-lip"
          }`}
        >
          {earned}/{max} point
        </span>
      </button>
      <Collapse open={open} duration={0.24}>
        <div className="space-y-4 px-5 pb-5">
          <p className="text-rb-eel">
            <strong>{criterion.title}.</strong> {criterion.description}
          </p>
          <div className="divide-y-2 divide-rb-swan">
            {[
              [0, criterion.zeroPoint],
              [1, criterion.onePoint],
            ].map(([points, text]) => (
              <div key={points} className="flex gap-4 py-3">
                <span
                  className={`h-fit shrink-0 rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                    earned === points ? "bg-rb-eel text-white" : "bg-rb-polar text-rb-eel"
                  }`}
                >
                  {points} {points === 1 ? "point" : "points"}
                </span>
                <span className="text-sm text-rb-eel">{text}</span>
              </div>
            ))}
          </div>
          {grade?.feedback ? (
            <div className="rounded-rb-card bg-rb-macaw-wash p-4">
              <Sparkles className="size-4 text-rb-macaw-lip" aria-hidden="true" />
              <p className="mt-2 text-sm leading-relaxed text-rb-eel">{grade.feedback}</p>
            </div>
          ) : null}
        </div>
      </Collapse>
    </div>
  )
}

function Feedback({ reflection, onRetry, onBack, onContinue, examLabel }) {
  const latest = reflection.latest
  const best = reflection.best
  const passed = Boolean(latest?.passed)
  if (!latest) return null
  const grades = latest.grades ?? []
  const earned = grades.reduce((total, grade) => total + Number(grade.earnedPoints ?? 0), 0)

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div
        className={`flex flex-col gap-4 rounded-rb-card p-6 sm:flex-row sm:items-center sm:justify-between ${
          passed ? "bg-rb-feather-wash" : "bg-rb-cardinal-wash"
        }`}
      >
        <div>
          <p className="font-rb-display text-2xl font-extrabold text-rb-eel">
            Your grade:{" "}
            <span className={passed ? "text-rb-feather-ink" : "text-rb-cardinal-lip"}>
              {percentText(latest.scorePercent)}
            </span>
          </p>
          <p className="mt-1 text-sm text-rb-eel">
            Your latest: <strong>{percentText(latest.scorePercent)}</strong> · Your highest:{" "}
            <strong>{percentText(best?.scorePercent)}</strong> · To pass you need at least {reflection.passPercent}%.
            We keep your highest score.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          {reflection.passed && onContinue ? (
            <TactileButton variant="fox" onClick={onContinue}>
              go to {examLabel} <ArrowRight className="size-4" />
            </TactileButton>
          ) : null}
          <TactileButton variant={reflection.passed ? "feather" : "macaw"} onClick={onRetry}>
            <RotateCcw className="size-4" /> retry
          </TactileButton>
        </div>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-extrabold text-rb-macaw-lip hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> overview
      </button>

      <div className="mt-6 flex gap-3">
        <span className="font-extrabold text-rb-eel">1.</span>
        <div className="min-w-0 flex-1 space-y-6">
          <Assignment reflection={reflection} points={`${earned} / ${grades.length} points`} />

          <div className="whitespace-pre-wrap rounded-rb-card border-2 border-rb-swan bg-rb-polar p-4 text-rb-wolf">
            {latest.answer}
          </div>

          <div>
            <p className="mb-3 flex items-center gap-2 font-extrabold text-rb-eel">
              {passed ? (
                <CheckCircle2 className="size-5 text-rb-feather" aria-hidden="true" />
              ) : (
                <XCircle className="size-5 text-rb-cardinal" aria-hidden="true" />
              )}
              How you were graded
            </p>
            <div className="space-y-4">
              {(reflection.rubric ?? []).map((criterion, index) => (
                <RubricCard
                  key={index}
                  index={index + 1}
                  criterion={criterion}
                  grade={grades.find((grade) => Number(grade.index) === index + 1)}
                />
              ))}
            </div>
          </div>

          <p className="rounded-rb-card bg-rb-macaw-wash p-4 text-sm text-rb-eel">
            This reflection was graded by AI. It is for your own practice — it awards no XP and does not affect your
            proficiency.
          </p>
        </div>
      </div>
    </div>
  )
}

export function TopicReflectionView({
  middleId,
  query,
  position,
  total,
  backTo,
  onOpenOutline,
  onContinue,
  examLabel = "the topic exam",
}) {
  const [mode, setMode] = useState("overview")
  const reflection = query.data

  useEffect(() => {
    setMode("overview")
  }, [middleId])

  return (
    <div className="w-full pb-10">
      <Header
        position={position}
        total={total}
        title={reflection?.title ?? "Reflection"}
        backTo={backTo}
        onOpenOutline={onOpenOutline}
      />
      <div className="px-5 py-12 sm:px-10 lg:px-14">
        {query.isLoading ? (
          <div className="mx-auto flex max-w-xl flex-col items-center gap-3 py-16 text-center text-rb-wolf">
            <Loader2 className="size-6 animate-spin" aria-hidden="true" />
            <p>Preparing this topic's reflection…</p>
          </div>
        ) : query.isError || !reflection ? (
          <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-16 text-center">
            <p className="text-rb-eel">
              {query.error?.response?.data?.message ?? "The reflection could not be loaded."}
            </p>
            <TactileButton variant="macaw" size="sm" onClick={() => query.refetch()}>
              try again
            </TactileButton>
          </div>
        ) : mode === "write" ? (
          <Write
            reflection={reflection}
            middleId={middleId}
            onBack={() => setMode("overview")}
            onSubmitted={() => {
              setMode("feedback")
              window.scrollTo({ top: 0 })
            }}
          />
        ) : mode === "feedback" && reflection.latest ? (
          <Feedback
            reflection={reflection}
            examLabel={examLabel}
            onContinue={onContinue}
            onBack={() => setMode("overview")}
            onRetry={() => {
              setMode("write")
              window.scrollTo({ top: 0 })
            }}
          />
        ) : (
          <Overview
            reflection={reflection}
            examLabel={examLabel}
            onContinue={onContinue}
            onStart={() => setMode("write")}
            onViewFeedback={() => setMode("feedback")}
          />
        )}
      </div>
    </div>
  )
}

export const ReflectionIcon = Pencil
