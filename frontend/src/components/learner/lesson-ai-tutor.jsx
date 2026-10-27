import { useEffect, useRef, useState } from "react"
import { AiLimitNotice, AiUsageRing, isBucketExhausted, useAiUsage } from "@/components/learner/ai-usage.jsx"
import { createPortal } from "react-dom"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  ArrowRight,
  ArrowUp,
  BookOpenCheck,
  Crop,
  ImageIcon,
  Layers3,
  Link,
  Loader2,
  History,
  MessageCircle,
  Pause,
  Play,
  PlayCircle,
  Plus,
  Radio,
  SquarePen,
  Sparkles,
  X,
} from "@/components/icons"

import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { TactileButton } from "@/components/rebyu/rebyu-ui.jsx"
import { Message, MessageContent } from "@/components/ui/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Reveal, motion, popIn } from "@/components/motion/rebyu-motion.jsx"

import { API, base, currentAccessToken } from "@/services/base"

import { AuthedImage } from "@/lib/authed-media.jsx"
import { useLearnerEntitlements } from "@/hooks/use-learner-entitlements.js"
import { ProLockCard } from "@/components/learner/pro-gate.jsx"
import { TutorDialogue } from "@/components/learner/tutor-dialogue.jsx"
import { TutorWidgets } from "@/components/learner/tutor-widgets.jsx"
import { LearningToolsPicker } from "@/components/learner/learning-tools-picker.jsx"
import { friendlyActivityRequest } from "@/lib/friendly-activity-request.js"
import { tutorActivityScope } from "@/lib/tutor-widget-progress.js"
import { MicButton } from "@/components/learner/mic-button.jsx"
import { LiveTutor, LiveTutorVoiceOrb } from "@/components/learner/live-tutor.jsx"


const AI_TUTOR_ENDPOINT = "ai/tutor"
const AI_TUTOR_CONVERSATION_ENDPOINT = "ai/tutor/conversation"
const AI_TUTOR_APPEND_ENDPOINT = "ai/tutor/conversation/messages"

const inFlight = new Map()

function trackRequest(sessionId, entry) {
  inFlight.set(sessionId, entry)
  entry.promise.then((message) => {
    if (inFlight.get(sessionId) === entry) inFlight.delete(sessionId)
    if (entry.listener) {
      entry.listener(message)
    } else {
      toast.success(
          entry.kind === "chat" ? "Your AI tutor replied" : "Your study aid is ready",
          { description: `Open the tutor in ${entry.lessonName ?? "this lesson"} to see it.` }
      )
    }
  })
  return entry
}

class StreamUnavailable extends Error {}
class StreamCancelled extends Error {}

async function streamTutorAnswer(body, entry) {
  const token = await currentAccessToken()
  let response
  try {
    response = await fetch(`${API}/ai/tutor/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: entry.controller?.signal,
    })
  } catch (error) {
    if (error?.name === "AbortError") throw new StreamCancelled()
    throw new StreamUnavailable()
  }
  if (response.status >= 400 && response.status < 500 && response.status !== 404) {
    // A refusal (daily limit reached, no Pro access): surface the server's
    // message instead of retrying without streaming, which would be refused too.
    const payload = await response.json().catch(() => null)
    const refusal = new Error(payload?.message ?? "The AI Tutor is not available right now.")
    refusal.code = payload?.code
    throw refusal
  }
  if (!response.ok || !response.body) {
    throw new StreamUnavailable()
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffered = ""
  let resources
  const widgets = []
  let finished = false

  const handle = (block) => {
    let name = "message"
    const data = []
    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith("event:")) name = line.slice(6).trim()
      else if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""))
    }
    if (!data.length) return
    let event
    try {
      event = JSON.parse(data.join("\n"))
    } catch {
      return
    }
    const type = event.type ?? name
    if (type === "delta" && event.text) {
      entry.text += event.text
      entry.onDelta?.(entry.text)
    } else if (type === "replace" && typeof event.text === "string") {
      // The server's guardrails withheld what was streamed; show its safe reply instead.
      entry.text = event.text
      entry.onDelta?.(entry.text)
    } else if (type === "widget" && event.widget) {
      widgets.push(event.widget)
      entry.onWidgets?.([...widgets])
    } else if (type === "resources") {
      resources = event.resources
    } else if (type === "error") {
      throw new Error(event.message || "The AI tutor could not answer right now.")
    } else if (type === "done") {
      finished = true
    }
  }

  for (;;) {
    let chunk
    try {
      chunk = await reader.read()
    } catch (error) {
      if (error?.name === "AbortError") throw new StreamCancelled()
      throw error
    }
    const { value, done } = chunk
    if (done) break
    buffered += decoder.decode(value, { stream: true })
    let match
    while ((match = /\r?\n\r?\n/.exec(buffered))) {
      const block = buffered.slice(0, match.index)
      buffered = buffered.slice(match.index + match[0].length)
      handle(block)
    }
  }
  if (buffered.trim()) handle(buffered)

  if (!entry.text.trim() && !widgets.length) {
    if (!finished) throw new StreamUnavailable()
    throw new Error("The AI Tutor did not return a response.")
  }
  return { text: entry.text.trim(), resources, widgets }
}

const WAITING_LINES = {
  chat: [
    "Thinking...",
    "Reading the lesson...",
    "Checking your study materials...",
    "Putting the answer together...",
    "Almost there...",
  ],
  quiz: [
    "Getting your quiz ready...",
    "Picking questions from this lesson...",
    "Writing the answer explanations...",
    "Almost there...",
  ],
  flashcard: [
    "Getting your flashcards ready...",
    "Choosing the key ideas...",
    "Writing the cards...",
    "Almost there...",
  ],
}
const WAITING_STEP_MS = 2600

function WaitingLine({ kind, startedAt }) {
  const lines = WAITING_LINES[kind] ?? WAITING_LINES.chat
  const [, setTick] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setTick((tick) => tick + 1), 500)
    return () => clearInterval(timer)
  }, [])

  const step = Math.floor((Date.now() - (startedAt ?? Date.now())) / WAITING_STEP_MS)
  return (
      <span aria-live="polite">{lines[Math.min(step, lines.length - 1)]}</span>
  )
}

// "New chat" gives a lesson a fresh conversation by appending a suffix to its
// session id. No suffix is the original thread, so existing chats keep loading.
function chatSuffixKey(learnerId, lessonId) {
  return `rebyu:tutor-chat:${learnerId ?? "guest"}:${lessonId}`
}

function readChatSuffix(learnerId, lessonId) {
  try {
    return window.localStorage.getItem(chatSuffixKey(learnerId, lessonId)) ?? ""
  } catch {
    return ""
  }
}

function startNewChatSuffix(learnerId, lessonId) {
  const suffix = Date.now().toString(36)
  try {
    window.localStorage.setItem(chatSuffixKey(learnerId, lessonId), suffix)
  } catch {
    /* falls back to this session only */
  }
  return suffix
}

function rememberChatSuffix(learnerId, lessonId, suffix) {
  try {
    if (suffix) window.localStorage.setItem(chatSuffixKey(learnerId, lessonId), suffix)
    else window.localStorage.removeItem(chatSuffixKey(learnerId, lessonId))
  } catch {
    /* falls back to this session only */
  }
}

function formatChatWhen(value) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return ""
  const diff = (Date.now() - date.getTime()) / 1000
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)} d ago`
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function ChatList({ learnerId, lessonId, currentSessionId, onPick, onNew }) {
  const query = useQuery({
    queryKey: ["tutor-chats", String(learnerId), String(lessonId)],
    queryFn: () => base(`ai/tutor/conversations?lessonId=${lessonId}`),
    enabled: lessonId != null,
    staleTime: 0,
  })
  const chats = query.data?.chats ?? []

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b-2 border-rb-swan bg-rb-polar/60 px-4 py-2">
        <p className="text-xs font-extrabold uppercase tracking-wide text-rb-wolf">previous chats</p>
        <button
            type="button"
            onClick={onNew}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-extrabold text-rb-feather-lip hover:bg-rb-feather-wash"
        >
          <Plus className="size-3.5" aria-hidden="true" /> new chat
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {query.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((key) => (
                  <div key={key} className="h-14 animate-pulse rounded-[0.9rem] bg-rb-polar" />
              ))}
            </div>
        ) : query.isError ? (
            <p className="px-1 text-sm text-rb-wolf">Your chats could not be loaded. Try again in a moment.</p>
        ) : chats.length === 0 ? (
            <p className="px-1 text-sm text-rb-wolf">No chats for this lesson yet. Ask the tutor anything to start one.</p>
        ) : (
            <ul className="space-y-2">
              {chats.map((chat) => {
                const current = chat.sessionId === currentSessionId
                return (
                    <li key={chat.sessionId}>
                      <button
                          type="button"
                          onClick={() => onPick(chat.sessionId)}
                          className={`flex w-full items-start gap-3 rounded-[0.9rem] border-2 px-3 py-2.5 text-left transition-colors ${
                            current
                              ? "border-rb-feather bg-rb-feather-wash/50"
                              : "border-rb-swan bg-white hover:border-rb-feather/50"
                          }`}
                      >
                        <MessageCircle className="mt-0.5 size-4 shrink-0 text-rb-feather-lip" aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 text-sm font-bold text-rb-eel">{chat.title}</span>
                          <span className="mt-0.5 block text-[11px] text-rb-wolf">
                            {formatChatWhen(chat.updatedAt)} · {chat.messageCount} message{chat.messageCount === 1 ? "" : "s"}
                            {current ? " · open now" : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                )
              })}
            </ul>
        )}
      </div>
    </div>
  )
}

function buildTutorSessionId(learnerId, lessonId) {
  const suffix = readChatSuffix(learnerId, lessonId)
  return `${learnerId ?? "guest"}-${lessonId}${suffix ? `-${suffix}` : ""}`
}

function createTutorMessageId(prefix = "message") {
  if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`
}

function getTutorResponseText(response) {
  const payload = response?.data ?? response ?? {}

  if (typeof payload === "string") {
    return payload
  }

  return (
      payload.answer ??
      payload.reply ??
      payload.message ??
      payload.content ??
      payload.response ??
      ""
  )
}

function getTutorErrorMessage(error) {
  return (
      error?.response?.data?.message ??
      error?.message ??
      "I could not answer right now. Please try again."
  )
}

function TutorAvatar({ size = "size-7", iconSize = "size-4", onViolet = false }) {
  return (
      <span
          className={`grid ${size} shrink-0 place-items-center rounded-full ring-2 ${
              onViolet
                ? "bg-white text-rb-feather-lip ring-white/40"
                : "bg-rb-feather text-white shadow-[var(--comic-shadow-sm)] ring-white"
          }`}
      >
        <Sparkles className={iconSize} aria-hidden="true" />
      </span>
  )
}

function LearnerAvatar({ size = "size-7", learnerName }) {
  const initial = (learnerName ?? "?").trim().charAt(0).toUpperCase() || "?"
  return (
      <span
          className={`grid ${size} shrink-0 place-items-center rounded-full bg-rb-eel text-xs font-extrabold text-white shadow-[var(--comic-shadow-sm)] ring-2 ring-white`}
      >
        {initial}
      </span>
  )
}

function formatMessageTime(timestamp) {
  if (!timestamp) return ""
  try {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })
  } catch {
    return ""
  }
}

function StudyAidActionCard({ action }) {
  const navigate = useNavigate()
  const Icon = action.kind === "flashcard" ? Layers3 : BookOpenCheck

  return (
      <div className="mt-3 rounded-xl border-2 border-rb-feather/25 bg-rb-feather-wash p-3">
        <div className="flex items-start gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-rb-feather text-white shadow-[var(--comic-shadow-sm)]">
            <Icon className="size-4" aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-rb-eel">{action.title}</p>
            <p className="mt-0.5 text-xs font-medium text-rb-wolf">{action.meta}</p>
          </div>
        </div>

        <TactileButton
            type="button"
            variant="feather"
            size="sm"
            className="!mt-3 !w-full !gap-2"
            onClick={() => navigate(action.href)}
        >
          {action.label}
          <ArrowRight className="size-4" aria-hidden="true" />
        </TactileButton>
      </div>
  )
}

function safeUrl(url) {
  return /^https?:\/\//i.test(String(url ?? "")) ? url : null
}

function TutorResources({ resources }) {
  const videos = resources.filter((item) => item.kind === "video" && safeUrl(item.url))
  const links = resources.filter((item) => item.kind !== "video" && safeUrl(item.url))
  if (!videos.length && !links.length) return null

  return (
      <div className="mt-3 space-y-3">
        {videos.length ? (
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-rb-feather-lip">
                <PlayCircle className="size-3.5" aria-hidden="true" /> Videos
              </p>
              <div className="grid gap-2">
                {videos.map((video) => (
                    <a
                        key={video.url}
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2.5 rounded-xl border border-rb-swan bg-white p-1.5 pr-2.5 transition hover:border-rb-feather"
                    >
                      {safeUrl(video.thumbnail) ? (
                          <img
                              src={video.thumbnail}
                              alt=""
                              loading="lazy"
                              className="h-12 w-20 shrink-0 rounded-lg object-cover"
                          />
                      ) : (
                          <span className="grid h-12 w-20 shrink-0 place-items-center rounded-lg bg-rb-feather-wash">
                            <PlayCircle className="size-5 text-rb-feather" aria-hidden="true" />
                          </span>
                      )}
                      <span className="min-w-0">
                        <span className="line-clamp-2 text-xs font-bold text-rb-eel group-hover:underline">{video.title}</span>
                        <span className="block truncate text-[11px] text-rb-wolf">{video.source}</span>
                      </span>
                    </a>
                ))}
              </div>
            </div>
        ) : null}

        {links.length ? (
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-rb-feather-lip">
                <Link className="size-3.5" aria-hidden="true" /> Further reading
              </p>
              <ul className="space-y-1.5">
                {links.map((link) => (
                    <li key={link.url}>
                      <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-lg px-1 py-0.5 hover:bg-white"
                      >
                        <span className="text-xs font-bold text-rb-feather-lip underline-offset-2 hover:underline">{link.title}</span>
                        <span className="block truncate text-[11px] text-rb-wolf">{link.source}</span>
                      </a>
                    </li>
                ))}
              </ul>
            </div>
        ) : null}
      </div>
  )
}

function SnipViewer({ picture, quote, onClose }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Snipped part of the lesson"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex cursor-zoom-out flex-col items-center justify-center gap-3 bg-black/80 p-4 backdrop-blur-sm"
    >
      {picture ? (
        <img
          src={picture}
          alt="The part of the lesson asked about"
          onClick={(event) => event.stopPropagation()}
          className="max-h-[80vh] max-w-[92vw] cursor-default rounded-lg bg-white object-contain shadow-2xl"
        />
      ) : null}
      {quote ? (
        <blockquote
          onClick={(event) => event.stopPropagation()}
          className="max-h-[30vh] max-w-2xl cursor-default overflow-y-auto rounded-lg bg-white px-4 py-3 text-sm italic leading-6 text-rb-eel shadow-2xl"
        >
          {quote}
        </blockquote>
      ) : null}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-sm font-bold text-rb-eel shadow-lg"
      >
        close
      </button>
    </div>,
    document.body,
  )
}

function SnippetPreview({ snippet, onDark = false }) {
  const [open, setOpen] = useState(false)
  if (!snippet) return null
  const picture = typeof snippet.image === "string" ? snippet.image : null
  return (
    <div className="mb-2 grid gap-1.5">
      {open ? <SnipViewer picture={picture} quote={snippet.quote} onClose={() => setOpen(false)} /> : null}
      {picture ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Click to enlarge"
          aria-label="Enlarge the snipped part"
          className="group relative block cursor-zoom-in rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <img
            src={picture}
            alt="The part of the lesson asked about"
            className="max-h-40 w-auto max-w-full rounded-lg border border-white/40 bg-white object-contain"
          />
          <span className="pointer-events-none absolute bottom-1.5 right-1.5 rounded-md bg-black/65 px-2 py-0.5 text-[11px] font-bold text-white opacity-0 transition group-hover:opacity-100">
            click to enlarge
          </span>
        </button>
      ) : snippet.imageKey ? (
        <AuthedImage
          imageKey={snippet.imageKey}
          alt="The part of the lesson asked about"
          zoomable
          className="max-h-40 w-auto max-w-full rounded-lg border border-white/40 bg-white object-contain"
          placeholderClassName="h-24 w-40 rounded-lg"
        />
      ) : snippet.image ? (
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${onDark ? "text-white/85" : "text-rb-wolf"}`}>
          <ImageIcon className="size-3.5" aria-hidden="true" />
          A snipped part of the lesson
        </span>
      ) : null}
      {snippet.quote ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Show the full text"
          className={`line-clamp-3 cursor-zoom-in border-l-2 pl-2 text-left text-xs italic leading-5 ${onDark ? "border-white/60 text-white/90" : "border-rb-feather text-rb-wolf"}`}
        >
          {snippet.quote}
        </button>
      ) : null}
    </div>
  )
}

export function GeminiTutorMessage({ message, learnerName, isFirstInGroup, isLastInGroup, persistenceScope }) {
  const isLearner = message.role === "user"

  const tailCorner = isLearner ? "!rounded-br-md" : "!rounded-tl-md"

  return (
      <Message align={isLearner ? "end" : "start"}>
        <MessageContent className="flex-row items-start gap-2.5">
          {!isLearner ? (
              isFirstInGroup ? (
                  <TutorAvatar />
              ) : (
                  <span className="size-7 shrink-0" aria-hidden="true" />
              )
          ) : null}

          <div className={`flex min-w-0 flex-1 flex-col ${isLearner ? "items-end" : "items-start"}`}>
            {!isLearner && isFirstInGroup ? (
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-rb-feather-lip">
                  REBYU AI Tutor
                </p>
            ) : null}

            <Bubble
                variant={isLearner ? "secondary" : "ghost"}
                align={isLearner ? "end" : "start"}
                className={isLearner ? "!max-w-[85%]" : "!w-full !max-w-full"}
            >
              <BubbleContent
                  className={
                    isLearner
                      ? `!rounded-2xl ${tailCorner} !border-0 !bg-rb-feather !px-3.5 !py-2.5 !text-white !shadow-none`
                      : "!w-full !rounded-none !border-0 !bg-transparent !p-0 !text-rb-eel !shadow-none"
                  }
              >
                {isLearner ? <SnippetPreview snippet={message.snippet} onDark /> : null}
                {message.text ? <div className={`text-[15px] leading-7 tracking-[0.002em] ${
                  isLearner
                    ? "font-medium text-white"
                    : "font-normal text-rb-eel [&_strong]:font-extrabold [&_strong]:text-rb-feather-ink"
                } [&_ol]:my-2.5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_p]:my-2.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:my-2.5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {isLearner ? friendlyActivityRequest(message.text) : message.text}
                  </ReactMarkdown>
                </div> : null}

                {!isLearner ? <TutorWidgets widgets={message.widgets} persistenceScope={persistenceScope} /> : null}
                {message.action ? <StudyAidActionCard action={message.action} /> : null}
                {message.resources?.length ? <TutorResources resources={message.resources} /> : null}
              </BubbleContent>
            </Bubble>

            {isLastInGroup ? (
                <p
                    className={`mt-1 text-[10px] font-medium text-rb-hare ${
                        isLearner ? "text-right" : "text-left"
                    }`}
                >
                  {formatMessageTime(message.createdAt)}
                </p>
            ) : null}
          </div>

        </MessageContent>
      </Message>
  )
}

export function LessonAiTutor({
                            lessonId,
                            lessonName,
                            learnerName,
                            learnerId,
                            onClose,
                            onStartLive,
                            pendingSnippet = null,
                            onSnippetTaken,
                            onStartSnip,
                          }) {
  const queryClient = useQueryClient()
  const [toolsOpen, setToolsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState("")
  const [pending, setPending] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [generating, setGenerating] = useState(null)
  const [waitingSince, setWaitingSince] = useState(null)
  const [streamText, setStreamText] = useState("")
  const [shownLength, setShownLength] = useState(0)
  const [finishedReply, setFinishedReply] = useState(null)
  const [streamPaused, setStreamPaused] = useState(false)
  const [attachment, setAttachment] = useState(null)
  const [dialogueOpen, setDialogueOpen] = useState(false)
  const [liveTutorOpen, setLiveTutorOpen] = useState(false)
  const [chatVersion, setChatVersion] = useState(0)
  const [chatListOpen, setChatListOpen] = useState(false)
  const draftRef = useRef(null)
  const entitlements = useLearnerEntitlements()
  const aiUsage = useAiUsage()
  const tutorExhausted = isBucketExhausted(aiUsage.bucket("tutor"))
  const sessionId = buildTutorSessionId(learnerId, lessonId)
  const tutorLocked = entitlements.isFree

  useEffect(() => {
    let cancelled = false

    setMessages([])
    setDraft("")
    setPending(false)
    setAttachment(null)

    if (lessonId == null || tutorLocked) {
      return undefined
    }

    setLoadingHistory(true)

    base(
        `${AI_TUTOR_CONVERSATION_ENDPOINT}?sessionId=${encodeURIComponent(
            buildTutorSessionId(learnerId, lessonId)
        )}`
    )
        .then((response) => {
          if (cancelled) return

          const history = response?.data?.messages ?? response?.messages ?? []
          setMessages(
              history.map((entry, index) => ({
                id: createTutorMessageId(`history-${index}`),
                role: entry.role === "user" ? "user" : "assistant",
                text: entry.content,
                action: entry.action ?? undefined,
                resources: Array.isArray(entry.resources) ? entry.resources : undefined,
                widgets: Array.isArray(entry.widgets) && entry.widgets.length ? entry.widgets : undefined,
                snippet: entry.snippet ?? undefined,
              }))
          )
        })
        .catch(() => {
        })
        .finally(() => {
          if (cancelled) return
          setLoadingHistory(false)
          const entry = inFlight.get(sessionId)
          if (entry) {
            setMessages((current) => [
              ...current,
              { id: createTutorMessageId("learner"), role: "user", text: entry.prompt, snippet: entry.snippet, createdAt: entry.startedAt },
            ])
            watch(entry)
          }
        })

    return () => {
      cancelled = true
      const entry = inFlight.get(sessionId)
      if (entry) {
        entry.listener = null
        entry.onDelta = null
      }
      setStreamText("")
      setShownLength(0)
      setFinishedReply(null)
      setStreamPaused(false)
    }
  }, [lessonId, learnerId, tutorLocked, chatVersion])

  useEffect(() => {
    if (streamPaused) return undefined
    if (shownLength >= streamText.length) {
      if (finishedReply) showReply(finishedReply)
      return undefined
    }
    const frame = requestAnimationFrame(() => {
      const behind = streamText.length - shownLength
      const step = Math.min(40, Math.max(2, Math.ceil(behind / 60)))
      setShownLength((current) => Math.min(streamText.length, current + step))
    })
    return () => cancelAnimationFrame(frame)
  }, [streamText, shownLength, finishedReply])

  function showReply(message) {
    if (message.widgets?.some((widget) => widget.library?.id != null)) {
      queryClient.invalidateQueries({ queryKey: ["library-items"] })
    }
    setMessages((current) => [...current, message])
    setPending(false)
    setGenerating(null)
    setWaitingSince(null)
    setStreamText("")
    setShownLength(0)
    setFinishedReply(null)
    setStreamPaused(false)
  }

  useEffect(() => {
    if (!pendingSnippet) return
    setAttachment(pendingSnippet)
    onSnippetTaken?.()
    requestAnimationFrame(() => draftRef.current?.focus())
  }, [pendingSnippet?.id])

  function watch(entry) {
    if (entry.kind === "chat") setPending(true)
    else setGenerating(entry.kind)
    setWaitingSince(entry.startedAt)
    setStreamText(entry.text ?? "")
    setShownLength((entry.text ?? "").length)
    setStreamPaused(false)
    entry.onDelta = (text) => setStreamText(text)
    entry.listener = (message) => {
      if (entry.text) {
        setStreamText(message.text)
        setFinishedReply(message)
      } else {
        showReply(message)
      }
    }
  }

  async function sendTutorMessage(value) {
    const snippet = attachment
    const question = String(value ?? "").trim() || (snippet ? "Explain this part of the lesson." : "")

    if (!question || pending) {
      return
    }

    setMessages((current) => [
      ...current,
      {
        id: createTutorMessageId("learner"),
        role: "user",
        text: question,
        snippet: snippet ?? undefined,
        createdAt: Date.now(),
      },
    ])

    setDraft("")
    setAttachment(null)

    const body = {
      sessionId,
      lessonName: lessonName,
      lessonId: lessonId != null ? Number(lessonId) : null,
      message: question,
      ...(snippet?.quote ? { quote: snippet.quote } : {}),
      ...(snippet?.image ? { image: snippet.image } : {}),
    }
    const entry = {
      kind: "chat", prompt: question, snippet, lessonName, startedAt: Date.now(), text: "",
      controller: new AbortController(),
    }

    const askOnce = () =>
        base(AI_TUTOR_ENDPOINT, { method: "POST", data: body }).then((response) => {
          const answer = String(getTutorResponseText(response)).trim()
          if (!answer) throw new Error("The AI Tutor did not return a response.")
          return { text: answer, resources: response?.resources ?? response?.data?.resources }
        })

    entry.promise = streamTutorAnswer(body, entry)
        .catch((error) => {
          if (error instanceof StreamUnavailable) return askOnce()
          throw error
        })
        .then(({ text, resources, widgets }) => ({
          id: createTutorMessageId("assistant"),
          role: "assistant",
          text,
          resources: Array.isArray(resources) && resources.length ? resources : undefined,
          widgets: widgets?.length ? widgets : undefined,
          createdAt: Date.now(),
        }))
        .catch((error) => {
          if (error instanceof StreamCancelled) {
            return {
              id: createTutorMessageId("assistant"),
              role: "assistant",
              text: entry.text.trim() || "Reply stopped.",
              createdAt: Date.now(),
            }
          }
          return {
            id: createTutorMessageId("error"),
            role: "assistant",
            text: entry.text.trim()
                ? `${entry.text.trim()}\n\n_${getTutorErrorMessage(error)}_`
                : getTutorErrorMessage(error),
            createdAt: Date.now(),
          }
        })

    // Each reply counts against the tutor limits: refresh usage once it lands.
    entry.promise.finally(() => aiUsage.refresh())
    watch(trackRequest(sessionId, entry))
  }

  function handleSubmit(event) {
    event.preventDefault()
    sendTutorMessage(draft)
  }

  function stopTutorResponse() {
    const entry = inFlight.get(sessionId)
    if (!entry || entry.kind !== "chat") return
    entry.controller?.abort()
    toast.message(entry.text.trim() ? "Tutor reply stopped." : "Tutor request cancelled.")
  }


  function handleKeyDown(event) {
    if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.nativeEvent.isComposing
    ) {
      event.preventDefault()
      sendTutorMessage(draft)
    }
  }

  const hasConversation = messages.length > 0

  // Keep the newest message in view: on send, while a reply streams in, and when it
  // lands. Only the chat's own scroll area moves -- never the lesson page behind it.
  const chatEndRef = useRef(null)
  const lastMessageId = messages[messages.length - 1]?.id
  useEffect(() => {
    const end = chatEndRef.current
    const viewport = end?.closest('[data-slot="message-scroller-viewport"]')
    if (!viewport) return
    const lastRole = messages[messages.length - 1]?.role
    const nearBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 160
    // Always follow the learner's own message; follow the tutor only if they haven't scrolled up to read.
    if (lastRole === "user" || nearBottom || !streamText) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: streamText ? "auto" : "smooth" })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessageId, pending, streamText, shownLength, finishedReply])

  if (tutorLocked) {
    return (
      <section className="flex h-full min-h-0 flex-col bg-rb-snow">
        <header className="flex h-16 shrink-0 items-center justify-between bg-rb-feather px-4">
          <div className="flex min-w-0 items-center gap-3">
            {liveTutorOpen ? (
              <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white/10 ring-2 ring-white/35">
                <LiveTutorVoiceOrb className="size-8" />
              </span>
            ) : (
              <TutorAvatar size="size-10" iconSize="size-5" onViolet />
            )}
            <p className="font-rb-display text-sm font-extrabold text-white">REBYU AI Tutor</p>
          </div>
          <TactileButton
            variant="ghost"
            size="sm"
            className="rb-btn-icon shrink-0 !border-transparent hover:!bg-white/15"
            style={{ "--rb-btn-face": "transparent", "--rb-btn-ink": "#ffffff" }}
            onClick={onClose}
            aria-label="Close AI Tutor"
          >
            <X className="size-4" aria-hidden="true" />
          </TactileButton>
        </header>
        <div className="grid min-h-0 flex-1 place-items-center overflow-y-auto p-4">
          <ProLockCard
            compact
            title="The AI tutor is a Pro feature"
            description="Ask questions about this lesson and generate practice quizzes and flashcards (up to 10 a day). Upgrade to REBYU Pro to start."
            className="!border-0 !shadow-none"
          />
        </div>
      </section>
    )
  }

  return (
      <section className="flex h-full min-h-0 flex-col bg-rb-snow">
        <header className="relative flex h-16 shrink-0 items-center justify-between overflow-hidden bg-rb-feather px-4">
          <div className="flex min-w-0 items-center gap-3">
            {liveTutorOpen ? (
              <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white/10 ring-2 ring-white/35">
                <LiveTutorVoiceOrb className="size-8" />
              </span>
            ) : (
              <TutorAvatar size="size-10" iconSize="size-5" onViolet />
            )}

            <div className="min-w-0">
              <p className="font-rb-display text-sm font-extrabold leading-tight text-white">
                {liveTutorOpen ? "REBYU Live Tutor" : "REBYU AI Tutor"}
              </p>
              <p className="flex items-center gap-1.5 truncate text-xs font-bold text-white/80">
                <span className={`size-1.5 shrink-0 rounded-full ${liveTutorOpen ? "bg-rb-fox" : "bg-rb-feather"}`} aria-hidden="true" />
                {liveTutorOpen ? "Live voice & chat" : lessonName ?? "This lesson"}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {liveTutorOpen ? (
              <TactileButton
                variant="ghost"
                size="sm"
                className="rb-btn-icon shrink-0 !border-transparent hover:!bg-white/15"
                style={{ "--rb-btn-face": "transparent", "--rb-btn-ink": "#ffffff" }}
                onClick={() => setLiveTutorOpen(false)}
                aria-label="Return to tutor chat"
                title="Return to tutor chat"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
              </TactileButton>
            ) : null}
            {!dialogueOpen && !liveTutorOpen ? (
              <TactileButton
                  variant="ghost"
                  size="sm"
                  className={`rb-btn-icon shrink-0 !border-transparent hover:!bg-white/15 ${chatListOpen ? "!bg-white/20" : ""}`}
                  style={{ "--rb-btn-face": "transparent", "--rb-btn-ink": "#ffffff" }}
                  onClick={() => setChatListOpen((value) => !value)}
                  disabled={pending || Boolean(generating)}
                  aria-label={chatListOpen ? "Back to the chat" : "Previous chats"}
                  aria-pressed={chatListOpen}
                  title="Previous chats"
              >
                <History className="size-4" aria-hidden="true" />
              </TactileButton>
            ) : null}
            {!dialogueOpen && !liveTutorOpen ? (
              <TactileButton
                  variant="ghost"
                  size="sm"
                  className="rb-btn-icon shrink-0 !border-transparent hover:!bg-white/15"
                  style={{ "--rb-btn-face": "transparent", "--rb-btn-ink": "#ffffff" }}
                  onClick={() => {
                    if (pending || generating || !hasConversation) return
                    startNewChatSuffix(learnerId, lessonId)
                    setChatVersion((value) => value + 1)
                  }}
                  disabled={pending || Boolean(generating) || !hasConversation}
                  aria-label="Start a new chat"
                  title="Start a new chat"
              >
                <SquarePen className="size-4" aria-hidden="true" />
              </TactileButton>
            ) : null}
            <TactileButton
                variant="ghost"
                size="sm"
                className="rb-btn-icon shrink-0 !border-transparent hover:!bg-white/15"
                style={{ "--rb-btn-face": "transparent", "--rb-btn-ink": "#ffffff" }}
                onClick={onClose}
                aria-label="Close AI Tutor"
            >
              <X className="size-4" aria-hidden="true" />
            </TactileButton>
          </div>
        </header>

        {chatListOpen && !dialogueOpen && !liveTutorOpen ? (
            <ChatList
                learnerId={learnerId}
                lessonId={lessonId}
                currentSessionId={sessionId}
                onPick={(picked) => {
                  const prefix = `${learnerId ?? "guest"}-${lessonId}`
                  rememberChatSuffix(learnerId, lessonId, picked === prefix ? "" : picked.slice(prefix.length + 1))
                  setChatListOpen(false)
                  setChatVersion((value) => value + 1)
                }}
                onNew={() => {
                  startNewChatSuffix(learnerId, lessonId)
                  setChatListOpen(false)
                  setChatVersion((value) => value + 1)
                }}
            />
        ) : liveTutorOpen ? (
            <LiveTutor
              lessonId={lessonId}
              lessonName={lessonName}
              messages={messages}
              pending={pending || Boolean(generating)}
              onSend={sendTutorMessage}
              onExit={() => setLiveTutorOpen(false)}
            />
        ) : dialogueOpen ? (
            <TutorDialogue
                lessonId={lessonId}
                lessonName={lessonName}
                learnerId={learnerId}
                onExit={() => setDialogueOpen(false)}
            />
        ) : loadingHistory ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-6 py-8 text-center">
              <Loader2 className="size-5 animate-spin text-rb-feather-lip" aria-hidden="true" />
              <p className="text-xs font-bold text-rb-hare">Loading your conversation…</p>
            </div>
        ) : !hasConversation ? (
            <Reveal
                variants={popIn}
                amount={0}
                className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-8 text-center"
            >
              <div className="relative">
                <motion.span
                    className="absolute inset-0 -z-10 rounded-full bg-rb-feather/30 blur-xl"
                    animate={{ scale: [1, 1.18, 1], opacity: [0.55, 0.9, 0.55] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                    aria-hidden="true"
                />
                <span className="relative grid size-16 shrink-0 place-items-center rounded-[1.5rem] bg-rb-feather text-white shadow-[var(--comic-shadow-sm)] ring-2 ring-white">
                  <Sparkles className="size-8" aria-hidden="true" />
                </span>
              </div>

              <p className="mt-6 font-rb-display text-xl font-extrabold text-rb-eel">
                Hi {learnerName}, ready to dig in?
              </p>

              <p className="mt-2 max-w-[16rem] text-sm font-medium leading-6 text-rb-wolf">
                Ask anything about{" "}
                <span className="font-bold text-rb-eel">{lessonName ?? "this lesson"}</span> —
                I'll stick to what's covered here.
              </p>

              <TactileButton
                  variant="feather"
                  size="sm"
                  className="mt-6"
                  onClick={() => setDialogueOpen(true)}
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                start a guided dialogue
              </TactileButton>

              <div className="mt-4 flex w-full flex-wrap justify-center gap-2">
                <TactileButton
                    variant="snow"
                    size="sm"
                    className="!h-auto !gap-1.5 !border-2 !border-rb-feather/30 !bg-white !px-3.5 !py-2 !text-rb-feather-lip hover:!border-rb-feather hover:!bg-rb-feather-wash"
                    disabled={pending}
                    onClick={() =>
                        sendTutorMessage("Explain this lesson in simple words.")
                    }
                >
                  <Sparkles className="size-3.5" aria-hidden="true" />
                  <span className="text-xs font-bold">Explain simply</span>
                </TactileButton>

                <TactileButton
                    variant="snow"
                    size="sm"
                    className="!h-auto !gap-1.5 !border-2 !border-rb-feather/30 !bg-white !px-3.5 !py-2 !text-rb-feather-lip hover:!border-rb-feather hover:!bg-rb-feather-wash"
                    disabled={pending}
                    onClick={() =>
                        sendTutorMessage(
                            "Give me a simple real-life example about this topic."
                        )
                    }
                >
                  <MessageCircle className="size-3.5" aria-hidden="true" />
                  <span className="text-xs font-bold">Give example</span>
                </TactileButton>

                <TactileButton
                    variant="snow"
                    size="sm"
                    className="!h-auto !gap-1.5 !border-2 !border-rb-feather/30 !bg-white !px-3.5 !py-2 !text-rb-feather-lip hover:!border-rb-feather hover:!bg-rb-feather-wash"
                    disabled={pending}
                    onClick={() =>
                        sendTutorMessage(
                            "Find videos and websites that explain this lesson well."
                        )
                    }
                >
                  <PlayCircle className="size-3.5" aria-hidden="true" />
                  <span className="text-xs font-bold">Find videos & links</span>
                </TactileButton>
              </div>
            </Reveal>
        ) : (
            <MessageScrollerProvider autoScroll scrollPreviousItemPeek={48}>
              <MessageScroller className="min-h-0 flex-1">
                <MessageScrollerViewport>
                  <MessageScrollerContent
                      className="px-4 py-5"
                      aria-busy={pending || Boolean(generating)}
                  >
                    {messages.map((message, index) => {
                      const prev = messages[index - 1]
                      const next = messages[index + 1]
                      const isFirstInGroup = !prev || prev.role !== message.role
                      const isLastInGroup = !next || next.role !== message.role

                      return (
                          <MessageScrollerItem
                              key={message.id}
                              messageId={message.id}
                              scrollAnchor={false}
                              className={index === 0 ? "" : isFirstInGroup ? "mt-5" : "mt-1"}
                          >
                            <GeminiTutorMessage
                                message={message}
                                persistenceScope={tutorActivityScope(sessionId, messages, index)}
                                learnerName={learnerName}
                                isFirstInGroup={isFirstInGroup}
                                isLastInGroup={isLastInGroup}
                            />
                          </MessageScrollerItem>
                      )
                    })}

                    {pending && shownLength > 0 ? (
                        <MessageScrollerItem messageId={`streaming-${lessonId}`} className="mt-5">
                          <GeminiTutorMessage
                              message={{ role: "assistant", text: `${streamText.slice(0, shownLength)} ▍` }}
                              learnerName={learnerName}
                              isFirstInGroup
                              isLastInGroup
                          />
                        </MessageScrollerItem>
                    ) : pending || generating ? (
                        <MessageScrollerItem messageId={`thinking-${lessonId}`} className="mt-5">
                          <Message align="start">
                            <MessageContent className="flex-row items-end gap-2.5">
                              <TutorAvatar />

                              <div className="min-w-0 flex-1">
                                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-rb-feather-lip">
                                  REBYU AI Tutor
                                </p>

                                <Bubble variant="secondary">
                                  <BubbleContent className="!flex !items-center !gap-2 !rounded-2xl !rounded-bl-md !border-0 !bg-rb-feather-wash !px-3.5 !py-2.5 !text-sm !font-medium !text-rb-wolf !shadow-none">
                                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                                    <WaitingLine kind={generating ?? "chat"} startedAt={waitingSince} />
                                  </BubbleContent>
                                </Bubble>
                              </div>
                            </MessageContent>
                          </Message>
                        </MessageScrollerItem>
                    ) : null}
                    <div ref={chatEndRef} aria-hidden="true" />
                  </MessageScrollerContent>
                </MessageScrollerViewport>

                <MessageScrollerButton />
              </MessageScroller>
            </MessageScrollerProvider>
        )}

        {dialogueOpen || chatListOpen || liveTutorOpen ? null : (
        <form
            onSubmit={handleSubmit}
            className="shrink-0 border-t border-border bg-background px-3 pb-2 pt-3"
        >
          <AiLimitNotice className="mb-2" />
          <div data-tutor-composer className="min-w-0 rounded-[calc(var(--radius-rb-control,10px)+8px)] border border-border bg-card p-3 text-card-foreground shadow-sm transition-[border-color,box-shadow] focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
          {attachment ? (
              <div className="mb-3 flex items-start gap-2 rounded-[var(--radius-rb-control,10px)] border border-border bg-muted/40 p-2.5">
                {attachment.image ? (
                    <img
                        src={attachment.image}
                        alt="Snipped part of the lesson"
                        className="h-14 w-20 shrink-0 rounded-md border border-rb-swan bg-white object-contain"
                    />
                ) : (
                    <span className="grid size-8 shrink-0 place-items-center rounded-md bg-rb-feather-wash text-rb-feather-lip">
                      <Crop className="size-4" aria-hidden="true" />
                    </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-rb-eel">
                    {attachment.image ? "Snipped from the lesson" : "Selected from the lesson"}
                  </p>
                  {attachment.quote ? (
                      <p className="line-clamp-2 text-xs text-rb-wolf">{attachment.quote}</p>
                  ) : (
                      <p className="text-xs text-rb-wolf">Ask a question about it, or just send.</p>
                  )}
                </div>
                <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    aria-label="Remove the snippet"
                    className="grid size-6 shrink-0 place-items-center rounded-full text-rb-wolf hover:bg-black/5"
                >
                  <X className="size-3.5" />
                </button>
              </div>
          ) : null}
            <textarea
                ref={draftRef}
                aria-label="Message your tutor"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tutorExhausted ? "AI limit reached—see when it resets above"
                    : attachment ? "Ask about this snippet…" : "Ask your tutor anything…"}
                disabled={Boolean(generating) || tutorExhausted}
                rows={2}
                className="field-sizing-content block max-h-40 min-h-14 w-full resize-none overflow-y-auto appearance-none border-0 bg-transparent px-1 py-1 text-sm font-normal leading-6 text-foreground shadow-none outline-none ring-0 placeholder:text-muted-foreground focus:outline-none focus:ring-0 disabled:opacity-60"
            />
          <div className="mt-2 flex items-center justify-between gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <TactileButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rb-btn-icon shrink-0 !size-9 !rounded-[var(--radius-rb-control,10px)] !border-0 !p-0 !shadow-none"
                    disabled={pending || Boolean(generating)}
                    aria-label="Create study aid"
                >
                  {generating ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                      <Plus className="size-4" aria-hidden="true" />
                  )}
                </TactileButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                side="top"
                className="w-72 !rounded-2xl !border-rb-swan !bg-rb-snow !p-2 shadow-[0_14px_32px_rgba(20,30,24,0.18)]"
              >
                <p className="px-2.5 pb-1 pt-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-rb-hare">
                  Learning tools
                </p>
                {onStartSnip ? (
                  <>
                    <DropdownMenuItem
                      onSelect={() => onStartSnip()}
                      className="!min-h-0 !items-start !gap-3 !rounded-xl !px-2.5 !py-2.5 focus:!bg-rb-feather-wash"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-rb-feather-wash text-rb-feather-lip">
                        <Crop className="size-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-rb-eel">Snip part of the lesson</span>
                        <span className="mt-0.5 block text-xs font-medium leading-4 text-rb-wolf">
                          Ask about a specific section
                        </span>
                      </span>
                    </DropdownMenuItem>
                    {hasConversation ? <DropdownMenuSeparator /> : null}
                  </>
                ) : null}
                <DropdownMenuItem disabled={tutorExhausted} onSelect={() => setToolsOpen(true)} className="!min-h-0 !items-start !gap-3 !rounded-xl !px-2.5 !py-2.5 focus:!bg-rb-feather-wash">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-rb-feather-wash text-rb-feather-lip"><BookOpenCheck className="size-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-rb-eel">Practice & games</span><span className="mt-0.5 block text-xs leading-4 text-rb-wolf">Quizzes, matching, word games and scenarios</span></span>
                </DropdownMenuItem>
                {hasConversation ? (
                    <DropdownMenuItem
                      onSelect={() => setDialogueOpen(true)}
                      className="!min-h-0 !items-start !gap-3 !rounded-xl !px-2.5 !py-2.5 focus:!bg-rb-feather-wash"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-rb-fox-wash text-rb-fox">
                        <MessageCircle className="size-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-rb-eel">Guided dialogue</span>
                        <span className="mt-0.5 block text-xs font-medium leading-4 text-rb-wolf">
                          Practise with tutor-led questions
                        </span>
                      </span>
                    </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  onSelect={() => onStartLive ? onStartLive() : setLiveTutorOpen(true)}
                  className="!min-h-0 !items-start !gap-3 !rounded-xl !px-2.5 !py-2.5"
                  aria-label="Open live tutor"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-rb-cardinal/10 text-rb-cardinal">
                    <Radio className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-rb-eel">Live tutor</span>
                    <span className="mt-0.5 block text-xs font-medium leading-4 text-rb-wolf">
                      Talk, dictate, and chat with your tutor
                    </span>
                  </span>
                </DropdownMenuItem>
                {/* AI usage lives on the ring beside the send button, not here too. */}
              </DropdownMenuContent>
            </DropdownMenu>
            <LearningToolsPicker open={toolsOpen} onOpenChange={setToolsOpen} onGenerate={sendTutorMessage} disabled={pending || tutorExhausted} />
            <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {pending ? (
              <>
                <TactileButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rb-btn-icon shrink-0 !size-9 !rounded-[var(--radius-rb-control,10px)] !border-0 !p-0 !shadow-none"
                    onClick={() => setStreamPaused((current) => !current)}
                    aria-label={streamPaused ? "Resume displaying tutor reply" : "Pause displaying tutor reply"}
                    title={streamPaused ? "Resume reply" : "Pause reply"}
                >
                  {streamPaused ? <Play className="size-3.5" aria-hidden="true" /> : <Pause className="size-3.5" aria-hidden="true" />}
                </TactileButton>
              </>
            ) : (
              <MicButton value={draft} onChange={setDraft} disabled={Boolean(generating)} className="!rounded-[var(--radius-rb-control,10px)]" />
            )}
            {pending ? (
              <TactileButton
                type="button"
                variant="feather"
                size="sm"
                className="rb-btn-icon shrink-0 !size-9 !rounded-[var(--radius-rb-control,10px)] !p-0 !shadow-none"
                onClick={(event) => {
                  event.preventDefault()
                  stopTutorResponse()
                }}
                aria-label="Stop tutor reply"
                title="Stop reply"
              >
                <span className="size-3 rounded-[2px] bg-current" aria-hidden="true" />
              </TactileButton>
            ) : (
            <TactileButton
                type="submit"
                variant="feather"
                size="sm"
                className="rb-btn-icon shrink-0 !size-9 !rounded-[var(--radius-rb-control,10px)] !p-0 !shadow-none"
                disabled={Boolean(generating) || (!draft.trim() && !attachment) || tutorExhausted}
                aria-label="Send message"
            >
              {generating ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                  <ArrowUp className="size-4" aria-hidden="true" />
              )}
            </TactileButton>
            )}
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
        )}
      </section>
  )
}
