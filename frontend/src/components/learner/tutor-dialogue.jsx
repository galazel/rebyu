import { useEffect, useRef, useState } from "react"
import { AiUsageRing, isBucketExhausted, useAiUsage } from "@/components/learner/ai-usage.jsx"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import ReactMarkdown from "react-markdown"
import { toast } from "sonner"
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MessageCircle,
  RotateCcw,
  SendHorizontal,
  Sparkles,
} from "@/components/icons"
import { TactileButton } from "@/components/rebyu/rebyu-ui.jsx"
import { base } from "@/services/base"
import { MicButton } from "@/components/learner/mic-button.jsx"

const ENDPOINT = "ai/tutor/dialogue"

const FORMAT_LABEL = {
  mcq: "multiple choice",
  truefalse: "true or false",
  fill: "fill in the blank",
  short: "short answer",
  scenario: "scenario",
  compare: "compare",
  explain: "explain it",
}

const FORMAT_PLACEHOLDER = {
  mcq: "Pick an option above, or type your answer…",
  truefalse: "Pick True or False above, or explain…",
  fill: "Type the missing word…",
  short: "Answer in a word or short phrase…",
  scenario: "What would you do, and why?…",
  compare: "How are they alike, and how do they differ?…",
  explain: "Explain it in your own words…",
}
const EMPTY = { topics: [], history: [], topicIndex: 0, complete: false, summary: null }

function storageKey(learnerId, lessonId) {
  return `rebyu:tutor-dialogue:${learnerId ?? "guest"}:${lessonId}`
}

function loadSession(key) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY
  } catch {
    return EMPTY
  }
}

function saveSession(key, value) {
  try {
    if (value === EMPTY || value.history.length === 0) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable: the session just won't survive a refresh */
  }
}

function formatWhen(value) {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "Earlier"
}

function errorText(error) {
  return error?.response?.data?.message ?? error?.message ?? "Please try again."
}

function Markdown({ children }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children: inner }) => <p className="mb-3 last:mb-0">{inner}</p>,
        strong: ({ children: inner }) => <strong className="font-extrabold text-rb-eel">{inner}</strong>,
      }}
    >
      {String(children ?? "").replace(/\\n/g, "\n")}
    </ReactMarkdown>
  )
}

function TopicTrack({ topics, topicIndex, complete }) {
  const [open, setOpen] = useState(false)
  if (topics.length === 0) return null
  const current = Math.min(topicIndex, topics.length - 1)
  const label = complete ? "All parts covered" : `Part ${current + 1} of ${topics.length}`
  const name = complete ? "" : topics[current].split(" · ")[0]

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left"
      >
        <span className="shrink-0 text-[11px] font-extrabold text-rb-eel">{label}</span>
        {name ? <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-rb-wolf">· {name}</span> : <span className="flex-1" />}
        <ChevronDown
          className={`size-3.5 shrink-0 text-rb-hare transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      <div className="mt-1.5 flex gap-1" aria-hidden="true">
        {topics.map((topic, index) => (
          <span
            key={topic}
            className={`h-1.5 flex-1 rounded-full ${
              complete || index < current ? "bg-rb-feather" : index === current ? "bg-rb-feather/40" : "bg-rb-swan"
            }`}
          />
        ))}
      </div>
      {open ? (
        <ol className="mt-2 max-h-40 space-y-1 overflow-y-auto text-[11px] leading-snug">
          {topics.map((topic, index) => {
            const done = complete || index < current
            return (
              <li key={topic} className={`flex gap-1.5 ${done ? "text-rb-feather-ink" : index === current ? "font-bold text-rb-eel" : "text-rb-wolf"}`}>
                {done ? (
                  <CheckCircle2 className="mt-px size-3 shrink-0" aria-hidden="true" />
                ) : (
                  <span className="w-3 shrink-0 text-center">{index + 1}</span>
                )}
                <span className="min-w-0">{topic}</span>
              </li>
            )
          })}
        </ol>
      ) : null}
    </div>
  )
}

function TutorDot() {
  return (
    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-rb-feather text-white">
      <Sparkles className="size-3.5" aria-hidden="true" />
    </span>
  )
}

function Summary({ summary }) {
  return (
    <div className="rounded-[1.1rem] border-2 border-rb-feather/40 bg-rb-feather-wash/40 p-4 text-sm leading-relaxed text-rb-eel">
      <p className="mb-2 flex items-center gap-1.5 font-extrabold">
        <Sparkles className="size-4 text-rb-feather-lip" aria-hidden="true" /> Session summary
      </p>
      <p>{summary.overview}</p>
      {summary.strengths?.length ? (
        <>
          <p className="mt-3 font-extrabold">Strengths</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {summary.strengths.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </>
      ) : null}
      {summary.improvements?.length ? (
        <>
          <p className="mt-3 font-extrabold">Areas for improvement</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {summary.improvements.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </>
      ) : null}
      {summary.closing ? <p className="mt-3">{summary.closing}</p> : null}
    </div>
  )
}

export function TutorDialogue({ lessonId, lessonName, learnerId, onExit }) {
  const key = storageKey(learnerId, lessonId)
  const queryClient = useQueryClient()
  const [session, setSession] = useState(() => loadSession(key))
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(null)
  const aiUsage = useAiUsage()
  const tutorExhausted = isBucketExhausted(aiUsage.bucket("tutor"))
  const endRef = useRef(null)

  const statusQuery = useQuery({
    queryKey: ["tutor-dialogue-status", String(lessonId)],
    queryFn: () => base(`${ENDPOINT}/status?lessonId=${lessonId}`),
    enabled: Boolean(lessonId),
    staleTime: 60_000,
  })
  const completedBefore = Boolean(statusQuery.data?.completed)
  const pastSessions = statusQuery.data?.sessions ?? []
  const [viewing, setViewing] = useState(null)

  useEffect(() => {
    setSession(loadSession(key))
  }, [key])

  useEffect(() => {
    saveSession(key, session)
  }, [key, session])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [session.history.length, session.summary, busy])

  async function call(action, next) {
    // Each turn counts against the tutor limits; refresh usage when it lands.
    return base(ENDPOINT, {
      method: "POST",
      data: {
        action,
        lessonId: lessonId == null ? null : Number(lessonId),
        lessonName,
        topics: next.topics,
        history: next.history,
        avoid: action === "start" ? usedBefore() : [],
      },
    }).finally(() => aiUsage.refresh())
  }

  function usedBefore() {
    const used = []
    for (const past of [session, ...pastSessions]) {
      used.push(...(past.topics ?? []))
      for (const message of past.history ?? []) {
        if (message.role !== "tutor") continue
        const question = String(message.content ?? "")
          .split(/\n+/)
          .reverse()
          .find((line) => line.includes("?"))
        if (question) used.push(question.replace(/\*\*/g, "").trim())
      }
    }
    return [...new Set(used)].slice(-30)
  }

  async function start() {
    setBusy("start")
    try {
      const result = await call("start", EMPTY)
      setSession({
        ...EMPTY,
        topics: result.topics ?? [],
        topicIndex: result.topicIndex ?? 0,
        history: [{ role: "tutor", content: result.reply, format: result.format, options: result.options ?? [] }],
      })
    } catch (error) {
      toast.error("Could not start the dialogue", { description: errorText(error) })
    } finally {
      setBusy(null)
    }
  }

  async function send(text) {
    const content = text.trim()
    if (!content || busy || session.complete) return
    const withAnswer = { ...session, history: [...session.history, { role: "learner", content }] }
    setSession(withAnswer)
    setDraft("")
    setBusy("reply")
    try {
      const result = await call("reply", withAnswer)
      const next = {
        ...withAnswer,
        topics: result.topics?.length ? result.topics : withAnswer.topics,
        topicIndex: result.topicIndex ?? withAnswer.topicIndex,
        complete: Boolean(result.sessionComplete),
        history: [
          ...withAnswer.history,
          { role: "tutor", content: result.reply, format: result.format, options: result.options ?? [] },
        ],
      }
      setSession(next)
      if (next.complete) {
        setBusy(null)
        await summarise(next)
        return
      }
    } catch (error) {
      setSession(session)
      setDraft(content)
      toast.error("The tutor could not reply", { description: errorText(error) })
    } finally {
      setBusy(null)
    }
  }

  async function summarise(from = session) {
    setBusy("summary")
    try {
      const result = await call("summary", from)
      setSession({ ...from, complete: true, summary: result.summary, completedAt: result.completedAt })
      queryClient.invalidateQueries({ queryKey: ["tutor-dialogue-status", String(lessonId)] })
    } catch (error) {
      toast.error("Could not generate your summary", { description: errorText(error) })
    } finally {
      setBusy(null)
    }
  }

  const autoSummaryRef = useRef(false)
  useEffect(() => {
    if (session.complete && !session.summary && !busy && !autoSummaryRef.current) {
      autoSummaryRef.current = true
      summarise()
    }
    if (!session.complete) autoSummaryRef.current = false
  }, [session.complete, session.summary, busy])

  function restart() {
    setSession(EMPTY)
    setDraft("")
  }

  const live = viewing ?? session
  const lastFormat = [...live.history].reverse().find((message) => message.role === "tutor")?.format
  const started = live.history.length > 0
  const ended = Boolean(live.summary)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b-2 border-rb-swan bg-rb-polar/60 px-3 py-2">
        <button
          type="button"
          onClick={() => (viewing ? setViewing(null) : onExit())}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-extrabold text-rb-feather-lip hover:bg-rb-feather-wash"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" /> {viewing ? "back" : "chat"}
        </button>
        <p className="min-w-0 flex-1 truncate text-xs font-extrabold uppercase tracking-wide text-rb-wolf">
          guided dialogue
        </p>
        {completedBefore ? (
          <span className="inline-flex items-center gap-1 text-xs font-extrabold text-rb-feather-ink">
            <CheckCircle2 className="size-3.5" aria-hidden="true" /> completed
          </span>
        ) : null}
      </div>

      {started ? (
        <div className="shrink-0 border-b-2 border-rb-swan bg-rb-snow px-3 py-2">
          <TopicTrack topics={live.topics} topicIndex={live.topicIndex} complete={live.complete} />
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto bg-rb-polar/40 px-3 py-4">
        {!started ? (
          <div className="space-y-4 text-sm leading-relaxed text-rb-eel">
            <span className="grid size-12 place-items-center rounded-[1rem] bg-rb-feather text-white">
              <MessageCircle className="size-6" aria-hidden="true" />
            </span>
            <p className="font-rb-display text-lg font-extrabold">Talk it through</p>
            <p>
              In this dialogue the tutor asks you a few questions about{" "}
              <strong>{lessonName ?? "this lesson"}</strong>, one at a time. Answer in your own words; it will point
              out what you got right, help you refine the rest, and finish with a summary of your strengths and what to
              work on.
            </p>
            <p className="text-rb-wolf">
              It takes about 10 minutes. Stuck? Just type <strong>hint</strong>.
            </p>
            <TactileButton variant="feather" onClick={start} disabled={busy === "start"}>
              {busy === "start" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {pastSessions.length ? "start a new dialogue" : "start dialogue"}
            </TactileButton>

            {pastSessions.length ? (
              <div className="pt-4">
                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-rb-hare">
                  previous dialogues · {pastSessions.length}
                </p>
                <ul className="space-y-2">
                  {pastSessions.map((past) => (
                    <li key={past.sessionId}>
                      <button
                        type="button"
                        onClick={() =>
                          setViewing({
                            ...EMPTY,
                            topics: past.topics ?? [],
                            history: past.history ?? [],
                            summary: past.summary,
                            complete: true,
                            topicIndex: Math.max(0, (past.topics?.length ?? 1) - 1),
                            completedAt: past.completedAt,
                          })
                        }
                        className="flex w-full items-center gap-3 rounded-[0.9rem] border-2 border-rb-swan bg-white px-3 py-2.5 text-left hover:border-rb-feather/60"
                      >
                        <CheckCircle2 className="size-4 shrink-0 text-rb-feather" aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-rb-eel">{formatWhen(past.completedAt)}</span>
                          <span className="block truncate text-xs text-rb-wolf">
                            {(past.topics ?? []).join(" · ") || "Dialogue"}
                          </span>
                        </span>
                        <span className="text-xs font-extrabold text-rb-feather-lip">view</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-5">
            {live.history.map((message, index) =>
              message.role === "tutor" ? (
                <div key={index} className="flex items-start gap-2.5">
                  <TutorDot />
                  <div className="min-w-0 max-w-[88%] rounded-[1.1rem] rounded-tl-md border-2 border-rb-swan bg-white px-3.5 py-2.5 text-sm leading-relaxed text-rb-eel">
                    {FORMAT_LABEL[message.format] ? (
                      <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-wide text-rb-hare">
                        {FORMAT_LABEL[message.format]}
                      </p>
                    ) : null}
                    <Markdown>{message.content}</Markdown>
                    {message.options?.length ? (
                      <div className="mt-3 grid gap-1.5">
                        {message.options.map((option, optionIndex) => {
                          const letter = String.fromCharCode(65 + optionIndex)
                          const isLatest = index === live.history.length - 1
                          const chosen = live.history[index + 1]?.content?.startsWith(`${letter})`)
                          return (
                            <button
                              key={optionIndex}
                              type="button"
                              disabled={!isLatest || Boolean(busy) || Boolean(viewing) || live.complete}
                              onClick={() => send(`${letter}) ${option}`)}
                              className={`flex items-start gap-2 rounded-[0.8rem] border-2 px-3 py-2 text-left text-sm transition-colors ${
                                chosen
                                  ? "border-rb-feather bg-rb-feather-wash/60"
                                  : "border-rb-swan bg-white enabled:hover:border-rb-feather/60 enabled:hover:bg-rb-feather-wash/30"
                              } disabled:cursor-default`}
                            >
                              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-rb-polar text-[11px] font-extrabold text-rb-eel">
                                {letter}
                              </span>
                              <span className="min-w-0 flex-1">{option}</span>
                            </button>
                          )
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div key={index} className="flex justify-end">
                  <p className="max-w-[85%] whitespace-pre-wrap rounded-[1.1rem] rounded-br-md bg-rb-feather px-3.5 py-2.5 text-sm font-medium leading-relaxed text-white shadow-[var(--comic-shadow-sm)]">
                    {message.content}
                  </p>
                </div>
              ),
            )}
            {busy === "reply" || busy === "summary" ? (
              <div className="flex items-center gap-2.5">
                <TutorDot />
                <p className="flex items-center gap-2 rounded-[1.1rem] rounded-tl-md border-2 border-rb-swan bg-white px-3.5 py-2.5 text-xs font-bold text-rb-wolf">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  {busy === "summary" ? "Writing your summary…" : "Thinking…"}
                </p>
              </div>
            ) : null}
            {ended ? (
              <>
                <Summary summary={live.summary} />
                <p className="text-sm text-rb-wolf">
                  {viewing
                    ? `Past dialogue from ${formatWhen(viewing.completedAt)}.`
                    : "The dialogue has ended. Start again to have a fresh conversation."}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {viewing ? (
                    <TactileButton variant="snow" size="sm" onClick={() => setViewing(null)}>
                      <ArrowLeft className="size-4" /> all dialogues
                    </TactileButton>
                  ) : null}
                  <TactileButton
                    variant="feather"
                    size="sm"
                    onClick={() => {
                      setViewing(null)
                      restart()
                    }}
                  >
                    <RotateCcw className="size-4" /> {viewing ? "new dialogue" : "try again"}
                  </TactileButton>
                  <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-rb-feather-ink">
                    <CheckCircle2 className="size-4" aria-hidden="true" /> Completed
                  </span>
                </div>
              </>
            ) : live.complete ? (
              <TactileButton variant="feather" size="sm" onClick={() => summarise()} disabled={Boolean(busy)}>
                <Sparkles className="size-4" /> generate summary
              </TactileButton>
            ) : null}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {started && !live.complete && !viewing ? (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            send(draft)
          }}
          className="shrink-0 border-t-2 border-rb-swan bg-rb-polar/60 p-3"
        >
          <div className="flex items-end gap-1.5 rounded-2xl border-2 border-rb-swan bg-rb-snow p-1.5 shadow-[var(--comic-shadow-sm)] focus-within:border-rb-feather/60">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault()
                  send(draft)
                }
              }}
              placeholder={FORMAT_PLACEHOLDER[lastFormat] ?? "Type your answer…"}
              disabled={Boolean(busy)}
              rows={1}
              className="field-sizing-content max-h-32 min-h-9 flex-1 resize-none self-center appearance-none border-0 bg-transparent px-2 py-2 text-sm font-medium leading-snug text-rb-eel shadow-none outline-none placeholder:text-rb-hare focus:outline-none focus:ring-0"
            />
            <MicButton value={draft} onChange={setDraft} disabled={Boolean(busy)} />
            <TactileButton
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 !h-8 !rounded-full !px-3 text-xs"
              disabled={Boolean(busy)}
              onClick={() => send("I'm stuck — can I have a hint?")}
            >
              hint
            </TactileButton>
            <TactileButton
              type="submit"
              variant="feather"
              size="sm"
              className="rb-btn-icon shrink-0"
              disabled={Boolean(busy) || !draft.trim() || tutorExhausted}
              aria-label="Send answer"
            >
              {busy === "reply" ? <Loader2 className="size-4 animate-spin" /> : <SendHorizontal className="size-4" />}
            </TactileButton>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <p className="flex-1 text-center text-[10px] font-medium text-rb-hare">
              The dialogue is powered by AI — check for mistakes and don't share personal information.
            </p>
            <AiUsageRing bucketKey="tutor" />
          </div>
        </form>
      ) : null}
    </div>
  )
}
