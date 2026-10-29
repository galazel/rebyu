import { useEffect, useRef, useState } from "react"
import { AiLimitNotice, AiUsageRing, isBucketExhausted, useAiUsage } from "@/components/learner/ai-usage.jsx"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import ReactMarkdown from "react-markdown"
import { toast } from "sonner"
import {
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MessageCircle,
  RotateCcw,
  Sparkles,
} from "@/components/icons"
import { TactileButton } from "@/components/rebyu/rebyu-ui.jsx"
import { base } from "@/services/base"
import { MicButton } from "@/components/learner/mic-button.jsx"

const ENDPOINT = "ai/tutor/dialogue"

// Labels for question formats from sessions saved before the Feynman-only dialogue.
const FORMAT_LABEL = {
  mcq: "multiple choice",
  truefalse: "true or false",
  fill: "fill in the blank",
  short: "short answer",
  scenario: "scenario",
}

// The open-ended Feynman formats (python-backend tutor_dialogue.FORMATS): card title for each question.
const FEYNMAN_TITLE = {
  explain: "Explain it simply",
  compare: "Compare the two",
  apply: "Apply it",
  analogy: "Make an analogy",
  misconception: "Spot the mistake",
  why: "Why does it matter?",
}

const FORMAT_PLACEHOLDER = {
  mcq: "Pick an option above, or type your answer…",
  truefalse: "Pick True or False above, or explain…",
  fill: "Type the missing word…",
  short: "Answer in a word or short phrase…",
  scenario: "What would you do, and why?…",
  explain: "Explain it simply, as if teaching a friend…",
  compare: "How are they alike, and how do they differ?…",
  apply: "Which idea is at work here, and why?…",
  analogy: "It's like… and here's where the comparison breaks down…",
  misconception: "What's the mistake, and what's the correct idea?…",
  why: "Explain the reason in plain words…",
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

// The tutor ends each turn with the question alone, in bold, in its own paragraph.
// Pull it out so the thing to answer gets its own card.
function splitTurn(content) {
  const paragraphs = String(content ?? "").replace(/\\n/g, "\n").split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean)
  const last = paragraphs.at(-1) ?? ""
  if (!/^\*\*[\s\S]+\*\*$/.test(last)) return { feedback: paragraphs.join("\n\n"), question: null }
  return { feedback: paragraphs.slice(0, -1).join("\n\n"), question: last.replace(/^\*\*|\*\*$/g, "").trim() }
}

const FEYNMAN_STEPS = [
  ["The tutor picks one idea", "and asks it a different way each time: explain, compare, apply, analogy, spot the mistake, or why."],
  ["You explain it simply", "in plain words, as if teaching a friend who has never heard of it."],
  ["You get gap feedback", "what was clear, what was missing or jargon, and a simpler way to say it."],
]

const FEYNMAN_TIPS = ["Use everyday words", "Say why it matters", "Give an example"]

// Client copy of python-backend tutor_dialogue.screen_answer: catch plain non-answers
// before they spend an AI request. The server repeats these checks (and more).
const KEY_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"]
function keyboardRun(word) {
  const pos = [...word.toLowerCase()].map((ch) => { const row = KEY_ROWS.findIndex((keys) => keys.includes(ch)); return row < 0 ? null : [row, KEY_ROWS[row].indexOf(ch)] })
  if (word.length < 3 || pos.includes(null) || new Set(pos.map(([row]) => row)).size !== 1) return false
  const steps = new Set(pos.slice(1).map(([, col], i) => col - pos[i][1]))
  return steps.size === 1 && (steps.has(1) || steps.has(-1))
}
const mashed = (word) => !/[aeiouy]/i.test(word) || new Set(word.toLowerCase()).size === 1 || keyboardRun(word)
function answerProblem(text, explanation) {
  const words = text.match(/[a-z]{2,}/gi) ?? []
  if (text.length > 1500) return "That's a lot! Keep it to a few sentences — the simplest explanation is the goal."
  if (/\b(just\s+)?(tell|give|show)\s+me\s+(the\s+)?(answer|solution)\b|\bwhat('?s| is)\s+the\s+(right\s+|correct\s+)?answer\b/i.test(text)) return "I won't give the answer away — explaining it yourself is how it sticks. Tap hint for a clue."
  if (!words.length || words.every(mashed)) return "I couldn't make that out — try answering in a full sentence."
  if (explanation && words.length < 5 && !/\b(i\s*(don'?t|do\s+not)\s*know|idk|not\s+sure|no\s+idea)\b/i.test(text)) return "Give it a bit more: explain it in a sentence or two, as if teaching a friend."
  return null
}

function TutorDot() {
  return (
    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-rb-feather text-white">
      <Sparkles className="size-3.5" aria-hidden="true" />
    </span>
  )
}

// What every Dialogue is judged by. The server sends its copy with each turn
// (`rubric`, from python-backend tutor_dialogue.RUBRIC); this one is shown before
// the first turn and for sessions saved before rubrics existed.
const RUBRIC = [
  { key: "accuracy", criterion: "Accuracy", levels: [
    "Answers are mostly wrong, missing, or 'I don't know'.",
    "Some answers are right, but key facts or results are wrong.",
    "Answers are correct, with at most minor slips.",
    "Every answer is correct and precise.",
  ] },
  { key: "understanding", criterion: "Understanding", levels: [
    "No explanation of why; answers are guesses or recall without meaning.",
    "Explains some ideas, but the reasoning is vague or partly wrong.",
    "Explains why in their own words for most questions.",
    "Explains clearly, connects ideas and could teach them to someone else.",
  ] },
  { key: "terminology", criterion: "Use of lesson terms", levels: [
    "Does not use the lesson's terms, or uses them wrongly.",
    "Uses a few terms, some loosely or incorrectly.",
    "Uses the lesson's terms correctly.",
    "Uses the terms precisely and naturally, including the exact definitions.",
  ] },
  { key: "application", criterion: "Application", levels: [
    "Cannot apply the ideas to a question or example.",
    "Applies ideas only with help or to the simplest cases.",
    "Applies the ideas correctly to the questions asked.",
    "Applies the ideas to new or tricky cases and checks the result.",
  ] },
]
const LEVELS = ["Beginning", "Developing", "Proficient", "Excellent"]
const LEVEL_COLOURS = ["bg-rb-cardinal", "bg-rb-fox", "bg-rb-macaw", "bg-rb-feather"]

function RubricGuide({ rubric = RUBRIC }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-[0.9rem] border-2 border-rb-swan">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-extrabold text-rb-eel">
        How you'll be assessed
        <span className="text-xs font-bold text-rb-feather-lip">{open ? "hide rubric" : "view rubric"}</span>
      </button>
      {open ? (
        <div className="space-y-3 border-t-2 border-rb-swan px-3 py-3">
          {rubric.map((item) => (
            <div key={item.key}>
              <p className="text-sm font-extrabold text-rb-eel">{item.criterion}</p>
              <ol className="mt-1 space-y-0.5 text-xs text-rb-wolf">
                {item.levels.map((text, index) => (
                  <li key={index}><strong className="text-rb-eel">{index + 1} {LEVELS[index]}:</strong> {text}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function RubricScores({ scores, rubric = RUBRIC }) {
  if (!scores?.length) return null
  const byKey = Object.fromEntries(rubric.map((item) => [item.key, item]))
  const total = scores.reduce((sum, score) => sum + (score.level || 0), 0)
  return (
    <div className="mt-3 rounded-[0.9rem] bg-white/70 p-3">
      <p className="flex items-center justify-between font-extrabold">
        Rubric <span className="text-xs font-bold text-rb-wolf">{total} / {scores.length * 4}</span>
      </p>
      <ul className="mt-2 space-y-2.5">
        {scores.map((score) => {
          const item = byKey[score.key]
          const level = Math.min(4, Math.max(1, score.level || 1))
          return (
            <li key={score.key}>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-extrabold text-rb-eel">{item?.criterion ?? score.key}</span>
                <span className="font-bold text-rb-wolf">{level} · {LEVELS[level - 1]}</span>
              </div>
              <div className="mt-1 flex gap-1" aria-hidden="true">
                {LEVELS.map((_, index) => (
                  <span key={index} className={`h-1.5 flex-1 rounded-full ${index < level ? LEVEL_COLOURS[level - 1] : "bg-rb-swan"}`} />
                ))}
              </div>
              {item ? <p className="mt-1 text-xs text-rb-wolf">{item.levels[level - 1]}</p> : null}
              {score.evidence ? <p className="mt-0.5 text-xs italic text-rb-eel">“{score.evidence}”</p> : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Summary({ summary, rubric }) {
  return (
    <div className="rounded-[1.1rem] border-2 border-rb-feather/40 bg-rb-feather-wash/40 p-4 text-sm leading-relaxed text-rb-eel">
      <p className="mb-2 flex items-center gap-1.5 font-extrabold">
        <Sparkles className="size-4 text-rb-feather-lip" aria-hidden="true" /> Session summary
      </p>
      <p>{summary.overview}</p>
      <RubricScores scores={summary.rubric} rubric={rubric} />
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
  const [guardNote, setGuardNote] = useState(null)
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
        rubric: result.rubric,
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
    const lastTutor = [...session.history].reverse().find((message) => message.role === "tutor")
    const problem = /hint/i.test(content) && content.length < 60 ? null : answerProblem(content, Boolean(FEYNMAN_TITLE[lastTutor?.format]))
    if (problem) { setGuardNote(problem); return }
    setGuardNote(null)
    const withAnswer = { ...session, history: [...session.history, { role: "learner", content }] }
    setSession(withAnswer)
    setDraft("")
    setBusy("reply")
    try {
      const result = await call("reply", withAnswer)
      const history = result.counted === false
        ? withAnswer.history.map((message, index) =>
            index === withAnswer.history.length - 1 ? { ...message, ignored: true } : message)
        : withAnswer.history
      const next = {
        ...withAnswer,
        rubric: result.rubric ?? withAnswer.rubric,
        topics: result.topics?.length ? result.topics : withAnswer.topics,
        topicIndex: result.topicIndex ?? withAnswer.topicIndex,
        complete: Boolean(result.sessionComplete),
        history: [
          ...history,
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
            <div className="flex items-start gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-[1rem] bg-rb-feather text-white">
                <MessageCircle className="size-6" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-rb-feather-lip">Feynman technique</p>
                <p className="font-rb-display text-lg font-extrabold leading-tight">Teach it back: {lessonName ?? "this lesson"}</p>
              </div>
            </div>
            <p>If you can explain an idea simply, you understand it. If you can't, the gaps show you exactly what to review.</p>
            <ol className="space-y-2">
              {FEYNMAN_STEPS.map(([title, detail], index) => (
                <li key={title} className="flex items-start gap-3 rounded-[0.9rem] border-2 border-rb-swan bg-white px-3 py-2.5">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-rb-feather-wash text-xs font-extrabold text-rb-feather-ink">{index + 1}</span>
                  <span className="min-w-0"><strong className="block text-rb-eel">{title}</strong><span className="text-xs text-rb-wolf">{detail}</span></span>
                </li>
              ))}
            </ol>
            <p className="flex flex-wrap gap-2 text-xs font-bold text-rb-wolf">
              <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-rb-swan">About 10 minutes</span>
              <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-rb-swan">Summary + rubric at the end</span>
              <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-rb-swan">Stuck? Tap hint</span>
            </p>
            <RubricGuide />
            <AiLimitNotice />
            <TactileButton variant="feather" onClick={start} disabled={busy === "start" || tutorExhausted}>
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
                  <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-rb-swan bg-white px-4 py-3.5 text-[15px] leading-7 text-rb-eel shadow-[0_2px_10px_rgba(17,55,43,0.06)]">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-rb-feather-lip">
                        REBYU AI Tutor
                      </p>
                      {FORMAT_LABEL[message.format] ? (
                        <span className="rounded-full bg-rb-feather-wash px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-rb-feather-lip">
                          {FORMAT_LABEL[message.format]}
                        </span>
                      ) : null}
                    </div>
                    {(() => {
                      const { feedback, question } = splitTurn(message.content)
                      return <>
                        {feedback ? (
                          <div className="font-normal tracking-[0.002em] [&_ol]:my-2.5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_p]:my-2.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_strong]:font-extrabold [&_strong]:text-rb-feather-ink [&_ul]:my-2.5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
                            <Markdown>{feedback}</Markdown>
                          </div>
                        ) : null}
                        {question ? (
                          <div className={`${feedback ? "mt-3" : ""} rounded-xl border-l-4 border-rb-feather bg-rb-feather-wash/50 px-3.5 py-3`}>
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-rb-feather-lip">{FEYNMAN_TITLE[message.format] ?? "Your turn"}</p>
                            <div className="mt-1 font-extrabold leading-snug text-rb-eel"><Markdown>{question}</Markdown></div>
                          </div>
                        ) : null}
                      </>
                    })()}
                    {message.options?.length ? (
                      <div className="mt-4 grid gap-2">
                        {message.options.map((option, optionIndex) => {
                          const letter = String.fromCharCode(65 + optionIndex)
                          const isLatest = index === live.history.length - 1
                          const chosen = live.history[index + 1]?.content?.startsWith(`${letter})`)
                          return (
                            <button
                              key={optionIndex}
                              type="button"
                              disabled={!isLatest || Boolean(busy) || Boolean(viewing) || live.complete || tutorExhausted}
                              onClick={() => send(`${letter}) ${option}`)}
                              className={`flex items-start gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-sm leading-snug transition-colors ${
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
                  <p className="max-w-[85%] whitespace-pre-wrap rounded-[1.1rem] rounded-br-md bg-rb-feather px-3.5 py-2.5 text-sm font-medium leading-relaxed text-white shadow-[0_2px_10px_rgba(17,55,43,0.14)]">
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
                <Summary summary={live.summary} rubric={live.rubric} />
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
        // Same composer as the normal tutor chat (lesson-ai-tutor.jsx), with hint in place of the + menu.
        <form
          onSubmit={(event) => {
            event.preventDefault()
            send(draft)
          }}
          className="shrink-0 border-t border-border bg-background px-3 pb-2 pt-3"
        >
          <AiLimitNotice className="mb-2" />
          <div data-tutor-composer className="min-w-0 rounded-[calc(var(--radius-rb-control,10px)+8px)] border border-border bg-card p-3 text-card-foreground shadow-sm transition-[border-color,box-shadow] focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
            {FEYNMAN_TITLE[lastFormat] ? (
              <p className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-rb-wolf">
                {FEYNMAN_TIPS.map((tip) => <span key={tip} className="rounded-full bg-muted/60 px-2 py-0.5">{tip}</span>)}
              </p>
            ) : null}
            <textarea
              aria-label="Your answer"
              value={draft}
              onChange={(event) => { setDraft(event.target.value); setGuardNote(null) }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault()
                  send(draft)
                }
              }}
              placeholder={tutorExhausted ? "AI limit reached—see when it resets above" : FORMAT_PLACEHOLDER[lastFormat] ?? "Type your answer…"}
              disabled={Boolean(busy) || tutorExhausted}
              rows={2}
              className="field-sizing-content block max-h-40 min-h-14 w-full resize-none overflow-y-auto appearance-none border-0 bg-transparent px-1 py-1 text-sm font-normal leading-6 text-foreground shadow-none outline-none ring-0 placeholder:text-muted-foreground focus:outline-none focus:ring-0 disabled:opacity-60"
            />
            {guardNote ? <p role="alert" className="mt-1 px-1 text-xs font-semibold text-rb-cardinal-lip">{guardNote}</p> : null}
            <div className="mt-2 flex items-center justify-between gap-2">
              <TactileButton
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 !h-9 !rounded-[var(--radius-rb-control,10px)] !px-3 !shadow-none text-xs"
                disabled={Boolean(busy) || tutorExhausted}
                onClick={() => send("I'm stuck — can I have a hint?")}
              >
                <Sparkles className="size-3.5" aria-hidden="true" /> hint
              </TactileButton>
              <div className="flex items-center gap-1.5">
                {draft.trim() ? (
                  <span className="text-[11px] font-medium text-muted-foreground">{draft.trim().split(/s+/).length} words · aim for 2–4 sentences</span>
                ) : null}
                <MicButton value={draft} onChange={setDraft} disabled={Boolean(busy) || tutorExhausted} className="!rounded-[var(--radius-rb-control,10px)]" />
                <TactileButton
                  type="submit"
                  variant="feather"
                  size="sm"
                  className="rb-btn-icon shrink-0 !size-9 !rounded-[var(--radius-rb-control,10px)] !p-0 !shadow-none"
                  disabled={Boolean(busy) || !draft.trim() || tutorExhausted}
                  aria-label="Send answer"
                >
                  {busy === "reply" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ArrowUp className="size-4" aria-hidden="true" />}
                </TactileButton>
              </div>
            </div>
          </div>
          <div className="mt-1.5 flex items-center gap-2 px-2">
            <p className="flex-1 text-center text-[10px] leading-snug font-medium text-rb-hare">
              REBYU AI can make mistakes &middot; check your lesson materials · Enter to send, Shift+Enter for a new line
            </p>
            <AiUsageRing bucketKey="tutor" />
          </div>
        </form>
      ) : null}
    </div>
  )
}
