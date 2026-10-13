import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "@/components/icons"

/**
 * Listen to a lesson: the browser's own speech synthesis reads the lesson's
 * sections aloud, section by section. Free, offline, nothing generated or stored,
 * so every lesson -- old or new -- gets audio.
 *
 * Text comes from the lesson's blocks, not the page, so collapsed accordions and
 * tabs are read too; links, images, ids and code are skipped. Speech is queued in
 * short sentence-sized chunks: long utterances stall in Chrome after ~15 s, and
 * chunks make pause, resume and seeking exact.
 */

const SKIP_KEYS = new Set([
  "id", "key", "type", "url", "src", "href", "image", "imageUrl", "imageKey", "alt", "style",
  "color", "tone", "icon", "language", "code", "svg", "diagram", "variant", "layout", "level",
  "width", "height", "source", "sourceUrl", "license", "credit", "attribution",
  "imageSourceUrl", "imageSourceName", "imageCaptionSource",
])
const SPEEDS = [0.75, 1, 1.25, 1.5, 2]
const CHARS_PER_SECOND = 15
const MAX_CHUNK = 220
const RATE_KEY = "rebyu:lesson-audio-rate"
const VOICE_KEY = "rebyu:lesson-audio-voice"

function stripMarkup(text) {
  return String(text)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/[*_`#>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

// A list item or heading without closing punctuation would run into the next one.
function endSentence(text) {
  const trimmed = String(text).trim()
  return /[.!?:;]["')\]]*$/.test(trimmed) ? trimmed : `${trimmed}.`
}

function collectText(value, out, key) {
  if (value == null || SKIP_KEYS.has(key)) return
  if (typeof value === "string") {
    const text = stripMarkup(value)
    if (text && !/^(https?:|data:|\/|#)/i.test(text) && /[a-z]/i.test(text)) out.push(endSentence(text))
    return
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectText(item, out))
    return
  }
  if (typeof value === "object") {
    if (value.type === "code" || value.type === "codeBlock") {
      out.push("A code example is shown here.")
      return
    }
    Object.entries(value).forEach(([childKey, child]) => collectText(child, out, childKey))
  }
}

function toChunks(text) {
  const sentences = text.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) ?? [text]
  const chunks = []
  for (const raw of sentences) {
    let sentence = raw.trim()
    while (sentence.length > MAX_CHUNK) {
      const cut = sentence.lastIndexOf(" ", MAX_CHUNK)
      const at = cut > 40 ? cut : MAX_CHUNK
      chunks.push(sentence.slice(0, at))
      sentence = sentence.slice(at).trim()
    }
    if (sentence) chunks.push(sentence)
  }
  return chunks
}

function buildScript(sections) {
  const chunks = []
  const sectionStart = []
  sections.forEach((section, index) => {
    const parts = []
    collectText(section.tools, parts)
    const unique = parts.filter((part, i) => parts.indexOf(part) === i)
    sectionStart.push(chunks.length)
    chunks.push({ text: endSentence(section.name), section: index })
    toChunks(unique.join(" ")).forEach((text) => chunks.push({ text, section: index }))
  })
  return { chunks, sectionStart }
}

function fmt(seconds) {
  const s = Math.max(0, Math.round(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

function readStored(key, fallback) {
  try {
    return window.localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

function store(key, value) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* not remembered */
  }
}

// Natural (neural) female English voices first, then any female voice, so the
// default never lands on a robotic one when a better voice is installed.
const PREFERRED_VOICES = [
  /aria.*natural/i, /jenny.*natural/i, /ava.*natural/i, /emma.*natural/i, /michelle.*natural/i,
  /sonia.*natural/i, /libby.*natural/i, /natasha.*natural/i, /clara.*natural/i,
  /google us english/i, /google uk english female/i, /samantha/i, /karen/i, /moira/i, /tessa/i,
  /\b(aria|jenny|ava|emma|zira|hazel|susan|catherine|linda|heera)\b/i, /female/i,
]

function voiceRank(voice) {
  const index = PREFERRED_VOICES.findIndex((pattern) => pattern.test(voice.name))
  return index === -1 ? PREFERRED_VOICES.length + (/natural|neural|online/i.test(voice.name) ? 0 : 1) : index
}

function voiceLabel(voice) {
  return voice.name
    .replace(/^(Microsoft|Google)\s+/, "")
    .replace(/\s+Online\s+\(Natural\)/i, " (natural)")
    .replace(/\s+-\s+.*$/, "")
}

function bestVoice(voices) {
  return [...voices].sort((a, b) => voiceRank(a) - voiceRank(b))[0] ?? null
}

const HIGHLIGHT = "lesson-reading"
const highlightSupported = () => typeof CSS !== "undefined" && "highlights" in CSS && typeof Highlight !== "undefined"

function clearHighlight() {
  if (highlightSupported()) CSS.highlights.delete(HIGHLIGHT)
}

// Finds the sentence inside its section's rendered text and highlights it. Text in
// a collapsed accordion or a hidden tab isn't on screen, so it simply isn't marked.
function highlightSentence(sectionEl, sentence) {
  if (!highlightSupported() || !sectionEl) return null
  const needle = sentence.replace(/\.$/, "").replace(/\s+/g, " ").trim().toLowerCase().slice(0, 80)
  if (needle.length < 4) return null

  const walker = document.createTreeWalker(sectionEl, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => (node.parentElement?.closest("[aria-hidden='true'], [hidden], script, style")
      ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  })
  const nodes = []
  let flat = ""
  const map = []
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const raw = node.nodeValue ?? ""
    nodes.push(node)
    for (let i = 0; i < raw.length; i++) {
      const ch = /\s/.test(raw[i]) ? " " : raw[i].toLowerCase()
      if (ch === " " && flat.endsWith(" ")) continue
      flat += ch
      map.push([nodes.length - 1, i])
    }
    if (!flat.endsWith(" ")) {
      flat += " "
      map.push([nodes.length - 1, raw.length])
    }
  }

  const start = flat.indexOf(needle)
  if (start === -1) return null
  const fullLength = Math.min(sentence.replace(/\.$/, "").replace(/\s+/g, " ").trim().length, flat.length - start)
  const endAt = Math.min(map.length - 1, start + fullLength - 1)
  const [startNode, startOffset] = map[start]
  const [endNode, endOffset] = map[endAt]
  const range = document.createRange()
  range.setStart(nodes[startNode], startOffset)
  range.setEnd(nodes[endNode], Math.min((nodes[endNode].nodeValue ?? "").length, endOffset + 1))
  CSS.highlights.set(HIGHLIGHT, new Highlight(range))
  return range
}

function ensureHighlightStyle() {
  if (typeof document === "undefined" || document.getElementById("lesson-reading-style")) return
  const style = document.createElement("style")
  style.id = "lesson-reading-style"
  style.textContent = "::highlight(lesson-reading){background-color:rgb(250 204 21 / 0.45);color:inherit;}"
  document.head.appendChild(style)
}

export function LessonAudioPlayer({ sections, lessonKey, follow = true }) {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window
  const { chunks, sectionStart } = useMemo(() => buildScript(sections ?? []), [sections])
  const offsets = useMemo(() => {
    let total = 0
    return chunks.map((chunk) => {
      const at = total
      total += chunk.text.length
      return at
    })
  }, [chunks])
  const totalChars = offsets.length ? offsets[offsets.length - 1] + chunks[chunks.length - 1].text.length : 0

  const [playing, setPlaying] = useState(false)
  const [index, setIndex] = useState(0)
  const [rate, setRate] = useState(() => Number(readStored(RATE_KEY, "1")) || 1)
  const [muted, setMuted] = useState(false)
  const [voices, setVoices] = useState([])
  const [voiceName, setVoiceName] = useState(() => readStored(VOICE_KEY, ""))

  const indexRef = useRef(0)
  const playingRef = useRef(false)
  const tokenRef = useRef(0)

  useEffect(() => {
    if (!supported) return undefined
    const load = () => {
      const list = window.speechSynthesis.getVoices().filter((voice) => /^en/i.test(voice.lang))
      setVoices(list)
    }
    load()
    window.speechSynthesis.addEventListener("voiceschanged", load)
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load)
  }, [supported])

  const activeVoice = useMemo(
    () => voices.find((item) => item.name === voiceName) ?? bestVoice(voices),
    [voices, voiceName],
  )

  useEffect(() => {
    ensureHighlightStyle()
    return clearHighlight
  }, [])

  const stop = useCallback(() => {
    tokenRef.current += 1
    playingRef.current = false
    setPlaying(false)
    clearHighlight()
    if (supported) window.speechSynthesis.cancel()
  }, [supported])

  // A new lesson, or leaving the page, silences the old one.
  useEffect(() => {
    stop()
    indexRef.current = 0
    setIndex(0)
    return stop
  }, [lessonKey, stop])

  const speakFrom = useCallback(
    (start) => {
      if (!supported || !chunks.length) return
      window.speechSynthesis.cancel()
      const token = ++tokenRef.current
      playingRef.current = true
      setPlaying(true)

      const speak = (at) => {
        if (token !== tokenRef.current) return
        if (at >= chunks.length) {
          playingRef.current = false
          setPlaying(false)
          indexRef.current = 0
          setIndex(0)
          return
        }
        indexRef.current = at
        setIndex(at)
        const chunk = chunks[at]
        const sectionEl = document.getElementById(sections[chunk.section]?.key ?? "")
        const range = highlightSentence(sectionEl, chunk.text)
        if (follow) {
          const box = range?.getBoundingClientRect()
          const offscreen = box && (box.top < window.innerHeight * 0.2 || box.bottom > window.innerHeight * 0.85)
          if (range && offscreen) {
            window.scrollBy({ top: box.top - window.innerHeight * 0.4, behavior: "smooth" })
          } else if (!range && (at === 0 || chunks[at - 1].section !== chunk.section)) {
            sectionEl?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        }
        if (!range) clearHighlight()
        const utterance = new SpeechSynthesisUtterance(chunk.text)
        utterance.rate = rate
        utterance.volume = muted ? 0 : 1
        if (activeVoice) {
          utterance.voice = activeVoice
          utterance.lang = activeVoice.lang
        }
        utterance.onend = () => speak(at + 1)
        utterance.onerror = (event) => {
          if (event.error !== "interrupted" && event.error !== "canceled") speak(at + 1)
        }
        window.speechSynthesis.speak(utterance)
      }
      speak(start)
    },
    [supported, chunks, rate, muted, activeVoice, follow, sections],
  )

  // Changing speed, voice or mute mid-sentence restarts the current sentence with it.
  useEffect(() => {
    if (playingRef.current) speakFrom(indexRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rate, muted, voiceName])

  if (!supported || !chunks.length) return null

  const elapsed = (offsets[index] ?? 0) / CHARS_PER_SECOND / rate
  const duration = totalChars / CHARS_PER_SECOND / rate
  const progress = totalChars ? ((offsets[index] ?? 0) / totalChars) * 100 : 0
  const currentSection = chunks[index]?.section ?? 0

  function seek(event) {
    const box = event.currentTarget.getBoundingClientRect()
    const target = ((event.clientX - box.left) / box.width) * totalChars
    let at = offsets.findIndex((offset) => offset > target)
    at = at === -1 ? chunks.length - 1 : Math.max(0, at - 1)
    indexRef.current = at
    setIndex(at)
    if (playingRef.current) speakFrom(at)
  }

  function jumpSection(delta) {
    const nextSection = Math.min(sectionStart.length - 1, Math.max(0, currentSection + delta))
    const at = sectionStart[nextSection]
    indexRef.current = at
    setIndex(at)
    if (playingRef.current) speakFrom(at)
    else {
      const key = sections[nextSection]?.key
      if (follow && key) document.getElementById(key)?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <div
      className="flex items-center gap-2 rounded-full border-2 border-rb-swan bg-white px-2 py-1.5 sm:gap-3 sm:px-3"
      role="group"
      aria-label="Listen to this lesson"
    >
      <button
        type="button"
        onClick={() => jumpSection(-1)}
        aria-label="Previous section"
        className="hidden size-8 shrink-0 place-items-center rounded-full text-rb-wolf hover:bg-rb-polar hover:text-rb-eel sm:grid"
      >
        <SkipBack className="size-3.5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => (playing ? stop() : speakFrom(indexRef.current))}
        aria-label={playing ? "Pause narration" : "Listen to this lesson"}
        className="grid size-9 shrink-0 place-items-center rounded-full bg-rb-feather text-white transition-transform active:scale-95"
      >
        {playing ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
      </button>
      <button
        type="button"
        onClick={() => jumpSection(1)}
        aria-label="Next section"
        className="hidden size-8 shrink-0 place-items-center rounded-full text-rb-wolf hover:bg-rb-polar hover:text-rb-eel sm:grid"
      >
        <SkipForward className="size-3.5" aria-hidden="true" />
      </button>

      <span className="hidden shrink-0 text-xs font-bold tabular-nums text-rb-wolf sm:inline">
        {fmt(elapsed)} / {fmt(duration)}
      </span>

      <div
        role="slider"
        tabIndex={0}
        aria-label="Narration position"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-valuetext={`Section ${currentSection + 1} of ${sectionStart.length}: ${sections[currentSection]?.name ?? ""}`}
        onClick={seek}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") jumpSection(1)
          if (event.key === "ArrowLeft") jumpSection(-1)
        }}
        className="group relative h-6 min-w-10 flex-1 cursor-pointer"
        title={sections[currentSection]?.name}
      >
        <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-rb-swan" />
        <span
          className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-rb-feather"
          style={{ width: `${progress}%` }}
        />
        <span
          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rb-feather ring-2 ring-white"
          style={{ left: `${progress}%` }}
        />
      </div>

      <select
        value={rate}
        onChange={(event) => {
          setRate(Number(event.target.value))
          store(RATE_KEY, event.target.value)
        }}
        aria-label="Narration speed"
        className="shrink-0 cursor-pointer rounded-lg bg-transparent px-1 text-xs font-extrabold text-rb-eel outline-none hover:bg-rb-polar"
      >
        {SPEEDS.map((speed) => (
          <option key={speed} value={speed}>
            {speed}x
          </option>
        ))}
      </select>

      {voices.length > 1 ? (
        <select
          value={voiceName}
          onChange={(event) => {
            setVoiceName(event.target.value)
            store(VOICE_KEY, event.target.value)
          }}
          aria-label="Narration voice"
          className="max-w-16 shrink-0 cursor-pointer truncate rounded-lg bg-transparent px-1 text-xs font-bold text-rb-wolf outline-none hover:bg-rb-polar sm:max-w-28"
        >
          <option value="">
            {bestVoice(voices) ? `Best: ${voiceLabel(bestVoice(voices))}` : "Default voice"}
          </option>
          {[...voices].sort((a, b) => voiceRank(a) - voiceRank(b)).map((voice) => (
            <option key={voice.name} value={voice.name}>
              {voiceLabel(voice)}
            </option>
          ))}
        </select>
      ) : null}

      <button
        type="button"
        onClick={() => setMuted((value) => !value)}
        aria-label={muted ? "Unmute narration" : "Mute narration"}
        className="hidden size-8 shrink-0 place-items-center rounded-full text-rb-wolf hover:bg-rb-polar hover:text-rb-eel sm:grid"
      >
        {muted ? <VolumeX className="size-4" aria-hidden="true" /> : <Volume2 className="size-4" aria-hidden="true" />}
      </button>
    </div>
  )
}
