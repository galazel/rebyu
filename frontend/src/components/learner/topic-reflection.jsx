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

function Header({ position, total, title, backTo, onOpenOutline, outlineHidden }) {
  return (
    <div className="sticky top-0 z-10 border-b-2 border-rb-swan bg-rb-snow/95 px-5 backdrop-blur supports-[backdrop-filter]:bg-rb-snow/80 sm:px-10 lg:px-14">
      <div className="flex h-[var(--rb-topbar-h)] items-center justify-between gap-2 sm:gap-4">
        {onOpenOutline ? (
          <button
            type="button"
            onClick={onOpenOutline}
            aria-label="Open topic outline"
            title="Topic outline"
            className={`grid size-10 shrink-0 place-items-center rounded-xl border-2 border-rb-swan bg-white text-rb-eel transition-transform active:scale-95 ${outlineHidden ? "" : "xl:hidden"}`}
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
  const parts = reflection.parts ?? []

  return (
    <div className="space-y-5 text-rb-eel">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-rb-swan px-2.5 py-0.5 text-xs font-bold text-rb-wolf">{points}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rb-macaw-wash px-2.5 py-0.5 text-xs font-bold text-rb-macaw-lip">
          <Sparkles className="size-3" aria-hidden="true" /> AI-graded
        </span>
      </div>

      <div className="rounded-xl border border-rb-swan bg-rb-polar/60 p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-rb-wolf">Scenario</p>
        <p className="mt-1 text-[15px] leading-7">{reflection.scenario}</p>
      </div>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-rb-wolf">Your task</p>
        <p className="mt-1 text-[15px] leading-7">{reflection.prompt}</p>
      </div>

      {parts.length ? (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-rb-wolf">
            Cover these {parts.length} parts
          </p>
          <ol className="mt-2 space-y-2">
            {parts.map((part, index) => (
              <li key={index} className="flex gap-3 rounded-xl border border-rb-swan bg-rb-snow p-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-rb-macaw-wash text-xs font-bold text-rb-macaw-lip">
                  {index + 1}
                </span>
                <span className="text-sm leading-6">{part}</span>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-rb-wolf">A list or a short paragraph is fine.</p>
        </div>
      ) : null}
    </div>
  )
}

function Overview({ reflection, onStart, onViewFeedback, onContinue, examLabel }) {
  const latest = reflection.latest
  const best = reflection.best
  const passed = reflection.passed
  const facts = [
    { icon: CalendarDays, text: "About 8 minutes" },
    { icon: RotateCcw, text: "Unlimited attempts" },
    { icon: CheckCircle2, text: `${reflection.passPercent}% unlocks the exam` },
    { icon: Sparkles, text: `AI-graded · ${(reflection.rubric ?? []).length}-point rubric` },
  ]

  return (
    <Reveal variants={popIn} amount={0} className="mx-auto w-full max-w-4xl space-y-4">
      <section className="rounded-rb-card border-2 border-rb-swan bg-rb-snow p-5 sm:p-6">
        <div className="mb-4 flex items-start gap-3 border-b border-rb-swan pb-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-700">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Practice assignment · reflection</p>
            <h2 className="text-lg font-extrabold leading-snug text-rb-eel sm:text-xl">{reflection.title}</h2>
          </div>
        </div>

        <p className="max-w-3xl text-[15px] leading-7 text-rb-eel/90">
          Put this topic in your own words: a moment where these ideas showed up in your life, a real problem a
          professional solves with them, and why the skill matters. It's the best warm-up for {examLabel}.
        </p>

        <ul className="mt-4 flex flex-wrap gap-2">
          {facts.map(({ icon: Icon, text }) => (
            <li
              key={text}
              className="inline-flex items-center gap-1.5 rounded-full border border-rb-swan bg-rb-polar/60 px-3 py-1 text-xs font-semibold text-rb-wolf"
            >
              <Icon className="size-3.5" aria-hidden="true" /> {text}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4 rounded-rb-card border-2 border-rb-swan bg-rb-snow p-5 sm:flex-row sm:items-center sm:p-6">
        {latest ? (
          <>
            <div
              className={`grid size-20 shrink-0 place-items-center rounded-2xl ${
                passed ? "bg-rb-feather-wash text-rb-feather-ink" : "bg-rb-cardinal-wash text-rb-cardinal-lip"
              }`}
            >
              <span className="rb-numeric text-2xl font-extrabold">{percentText(best?.scorePercent)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-rb-eel">{passed ? "You passed" : "Not passed yet"}</p>
              <p className="mt-0.5 text-sm text-rb-wolf">
                Best score kept · {reflection.passPercent}% needed · submitted {formatDate(latest.submittedAt)}
              </p>
              <button
                type="button"
                onClick={onViewFeedback}
                className="mt-1.5 text-sm font-bold text-rb-macaw-lip hover:underline"
              >
                View feedback
              </button>
            </div>
          </>
        ) : (
          <p className="min-w-0 flex-1 text-sm text-rb-wolf">You haven't submitted this reflection yet.</p>
        )}

        <div className="flex shrink-0 flex-wrap gap-2">
          <TactileButton variant={passed && onContinue ? "ghost" : "macaw"} size="sm" onClick={onStart}>
            {latest ? "try again" : "start reflection"}
            <ArrowRight className="size-4" />
          </TactileButton>
          {passed && onContinue ? (
            <TactileButton variant="macaw" size="sm" onClick={onContinue}>
              go to {examLabel}
              <ArrowRight className="size-4" />
            </TactileButton>
          ) : null}
        </div>
      </section>
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
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-extrabold text-rb-macaw-lip hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> back
      </button>

      <section className="rounded-rb-card border-2 border-rb-swan bg-rb-snow p-5 sm:p-6">
        <Assignment reflection={reflection} points={`${(reflection.rubric ?? []).length} points`} />
      </section>

      <section className="mt-4 rounded-rb-card border-2 border-rb-swan bg-rb-snow p-5 sm:p-6">
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rb-wolf">Your reflection</span>
          <textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value.slice(0, MAX_CHARS))}
            rows={10}
            disabled={submit.isPending}
            placeholder="Write in your own words. Draft is saved as you type."
            className="mt-2 w-full resize-y rounded-xl border-2 border-rb-swan bg-white p-4 text-[15px] leading-7 text-rb-eel outline-none focus:border-rb-macaw disabled:opacity-70"
          />
        </label>
        <div className="mt-1 flex justify-between text-xs text-rb-wolf">
          <span>{tooShort ? `At least ${MIN_CHARS} characters` : "Ready to submit"}</span>
          <span className="tabular-nums">
            {length} / {MAX_CHARS}
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-rb-swan pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-rb-wolf">
            <strong className="text-rb-eel">Honor code:</strong> by submitting you confirm this is your own words and
            experience.
          </p>
          <TactileButton
            variant="macaw"
            size="sm"
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
        </div>
      </section>
    </div>
  )
}

// The grader sometimes returns a mark with no comment (free fallback models do).
// Then the rubric itself explains the mark, so a learner never sees an empty note.
const NO_FEEDBACK = /no written feedback was produced/i

function feedbackFor(criterion, grade, earned) {
  const text = String(grade?.feedback ?? "").trim()
  if (text && !NO_FEEDBACK.test(text)) return { text, generated: false }
  const goal = String(criterion.onePoint ?? "").trim().replace(/\.$/, "")
  if (!goal) return null
  return {
    text: earned >= 1 ? `You met this: ${goal}.` : `Not met yet. To earn this point: ${goal}.`,
    generated: true,
  }
}

function RubricCard({ index, criterion, grade }) {
  const [open, setOpen] = useState(true)
  const earned = Number(grade?.earnedPoints ?? 0)
  const max = Number(grade?.maxPoints ?? 1)
  const met = earned >= max
  const note = feedbackFor(criterion, grade, earned)

  return (
    <div className={`overflow-hidden rounded-rb-card border-2 bg-white ${met ? "border-rb-feather/40" : "border-rb-cardinal/30"}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left sm:px-5"
      >
        <span
          className={`grid size-8 shrink-0 place-items-center rounded-full ${
            met ? "bg-rb-feather-wash text-rb-feather-ink" : "bg-rb-cardinal-wash text-rb-cardinal-lip"
          }`}
        >
          {met ? <CheckCircle2 className="size-4" aria-hidden="true" /> : <XCircle className="size-4" aria-hidden="true" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-extrabold uppercase tracking-wide text-rb-wolf">Rubric {index}</span>
          <span className="block font-bold leading-snug text-rb-eel">{criterion.title}</span>
        </span>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
            met ? "bg-rb-feather-wash text-rb-feather-ink" : "bg-rb-cardinal-wash text-rb-cardinal-lip"
          }`}
        >
          {earned}/{max} {max === 1 ? "point" : "points"}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="grid place-items-center text-rb-wolf">
          <ChevronDown className="size-4" aria-hidden="true" />
        </motion.span>
      </button>
      <Collapse open={open} duration={0.24}>
        <div className="space-y-3 border-t-2 border-rb-swan px-4 pb-4 pt-3 sm:px-5">
          <p className="text-sm leading-relaxed text-rb-wolf">{criterion.description}</p>
          <div className="grid gap-2">
            {[
              [0, criterion.zeroPoint],
              [1, criterion.onePoint],
            ].map(([points, text]) => {
              const reached = earned === points
              return (
                <div
                  key={points}
                  className={`flex items-start gap-3 rounded-[0.8rem] border-2 px-3 py-2.5 ${
                    reached
                      ? points === 1
                        ? "border-rb-feather/50 bg-rb-feather-wash/40"
                        : "border-rb-cardinal/40 bg-rb-cardinal-wash/40"
                      : "border-transparent bg-rb-polar/60"
                  }`}
                >
                  <span
                    className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                      reached ? "bg-rb-eel text-white" : "bg-white text-rb-wolf"
                    }`}
                  >
                    {points} {points === 1 ? "pt" : "pts"}
                  </span>
                  <span className={`text-sm leading-snug ${reached ? "font-semibold text-rb-eel" : "text-rb-wolf"}`}>{text}</span>
                  {reached ? <span className="ml-auto shrink-0 text-[10px] font-extrabold uppercase text-rb-eel">your level</span> : null}
                </div>
              )
            })}
          </div>
          {note ? (
            <div className="flex gap-2.5 rounded-[0.8rem] bg-rb-macaw-wash/60 px-3 py-2.5">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-rb-macaw-lip" aria-hidden="true" />
              <p className="text-sm leading-relaxed text-rb-eel">{note.text}</p>
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
      <div className={`rounded-rb-card p-5 sm:p-6 ${passed ? "bg-rb-feather-wash" : "bg-rb-cardinal-wash"}`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {passed ? (
            <CheckCircle2 className="size-6 text-rb-feather" aria-hidden="true" />
          ) : (
            <XCircle className="size-6 text-rb-cardinal" aria-hidden="true" />
          )}
          <p className="font-rb-display text-2xl font-extrabold text-rb-eel">
            Your grade:{" "}
            <span className={passed ? "text-rb-feather-ink" : "text-rb-cardinal-lip"}>
              {percentText(latest.scorePercent)}
            </span>
          </p>
          <span className="text-sm font-bold text-rb-eel">{passed ? "· Passed" : "· Not passed yet"}</span>
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-2">
          {[
            ["Latest", percentText(latest.scorePercent)],
            ["Highest", percentText(best?.scorePercent)],
            ["Pass mark", `${reflection.passPercent}%`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[0.8rem] bg-white/70 px-3 py-2">
              <dt className="text-[10px] font-extrabold uppercase tracking-wide text-rb-wolf">{label}</dt>
              <dd className="text-base font-extrabold text-rb-eel">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-xs text-rb-wolf">We keep your highest score. Retakes are unlimited.</p>

        <div className="mt-4 flex flex-wrap gap-2.5">
          {reflection.passed && onContinue ? (
            <TactileButton variant="fox" onClick={onContinue} className="max-w-full">
              <span className="truncate">go to {examLabel}</span> <ArrowRight className="size-4 shrink-0" />
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
  outlineHidden,
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
        outlineHidden={outlineHidden}
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
