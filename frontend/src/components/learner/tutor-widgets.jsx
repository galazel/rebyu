// The interactive pieces the AI tutor draws with its tools (see the Python
// app/ai/tutor_widgets.py for the shapes). Everything here is client-side:
// practice progress is saved locally, scoped to the learner/conversation/activity.
import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import katex from "katex"
import "katex/dist/katex.min.css"
import { Light as SyntaxHighlighter } from "react-syntax-highlighter"
import { registerCodeLanguages } from "@/components/certifications/code-languages.js"
import { MindMap } from "@/components/learner/tutor-mindmap.jsx"
import { TutorStudyWidget } from "@/components/learner/tutor-study-widget.jsx"
import { SortingGame, WordGame, PuzzleGame, VisualGame, SpeedFlashcardsGame } from "@/components/learner/learning-game-widgets.jsx"
import { BranchingStoryGame, SimulationGame, TwoTruthsLieGame } from "@/components/learner/decision-game-widgets.jsx"
import { TutorWidgetProgressContext, useTutorWidgetProgress } from "@/hooks/useTutorWidgetProgress.js"
import { widgetProgressKey } from "@/lib/tutor-widget-progress.js"
import { categoryClass, GameFooter, GameHint, GameIcon, Grip, IconButton, useCardDrag } from "@/components/learner/tutor-game-kit.jsx"
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  BookOpen,
  Building,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Home,
  Lock,
  Network,
  ServerCog,
  Sparkles,
  UploadCloud,
  User,
  XCircle,
  Zap,
} from "@/components/icons"
import { Ico, Stars } from "@/components/learner/tutor-game-kit.jsx"

registerCodeLanguages(SyntaxHighlighter)

const TONES = [
  { wash: "bg-sky-50", text: "text-sky-700", ring: "border-sky-200", dot: "bg-sky-500" },
  { wash: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700", ring: "border-emerald-200", dot: "bg-emerald-500" },
  { wash: "bg-amber-50", text: "text-amber-700", ring: "border-amber-200", dot: "bg-amber-500" },
  { wash: "bg-violet-50", text: "text-violet-700", ring: "border-violet-200", dot: "bg-violet-500" },
  { wash: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-700", ring: "border-rose-200", dot: "bg-rose-500" },
  { wash: "bg-teal-50", text: "text-teal-700", ring: "border-teal-200", dot: "bg-teal-500" },
  { wash: "bg-orange-50", text: "text-orange-700", ring: "border-orange-200", dot: "bg-orange-500" },
]

const CARD_ICONS = {
  building: Building, home: Home, server: ServerCog, network: Network, cloud: UploadCloud,
  user: User, lock: Lock, book: BookOpen, chart: BarChart3, lightbulb: Zap,
}

function shuffled(items) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function Md({ children, className = "" }) {
  return (
      <div className={`text-sm leading-6 [&_p]:my-1 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_table]:my-2 [&_td]:border-b [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 ${className}`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{children ?? ""}</ReactMarkdown>
      </div>
  )
}

/** Quizzes, flashcards and mind maps are saved to the Library by the gateway as
 *  they stream; `library.route` is set on the live reply, a reload links to the Library. */
function SavedChip({ library }) {
  return (
      <Link to={library?.route ?? "/learner/library"}
            className="tg-pill inline-flex shrink-0 items-center gap-1 !text-[11px] hover:underline">
        <BookOpen className="size-3" /> {library?.route ? "Saved · Open" : "Open Library"}
      </Link>
  )
}

function Frame({ kind, type, title, badge, children, saved }) {
  const counts = typeof badge === "string" && /^(\d+)\/(\d+)$/.exec(badge)
  const progress = counts && Number(counts[2]) ? Number(counts[1]) / Number(counts[2]) : null
  return (
      <section className={`tg-frame @container my-3 w-full min-w-0 ${categoryClass(type)}`} data-tutor-widget={type}>
        <header className="tg-head flex flex-wrap items-center gap-3 px-4 py-3">
          <span className="tg-badge-icon"><GameIcon type={type} /></span>
          <span className="min-w-0 flex-1">
            <span className="tg-kicker block">{kind}</span>
            {title ? <span className="block truncate text-sm font-extrabold text-foreground">{title}</span> : null}
          </span>
          <span className="ml-auto flex shrink-0 items-center gap-2">
            {badge ? <span className="tg-pill">{badge}</span> : null}
            {saved ? <SavedChip library={saved.library} /> : null}
          </span>
          {progress != null ? <span className="tg-progress"><span style={{ width: `${progress * 100}%` }} /></span> : null}
        </header>
        <div className="p-3 @sm:p-4">{children}</div>
      </section>
  )
}

function Feedback({ ok, children }) {
  return (
      <div className={`mt-2 flex gap-2 rounded-xl px-3 py-2 text-sm ${ok ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200" : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200"}`}>
        {ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <XCircle className="mt-0.5 size-4 shrink-0" />}
        <div className="min-w-0"><strong>{ok ? "Correct!" : "Not quite."}</strong> {children}</div>
      </div>
  )
}

function Score({ right, total, onReset }) {
  const pct = total ? right / total : 0
  const line = pct === 1 ? "Perfect -- you've got this!" : pct >= 0.7 ? "Good job!" : pct >= 0.4 ? "Getting there -- review the misses." : "Let's go over this again."
  const stars = pct === 1 ? 3 : pct >= 0.7 ? 2 : pct >= 0.4 ? 1 : 0
  return (
      <div role="status" className="tg-result mt-4 flex animate-in fade-in zoom-in-95 items-center justify-between gap-3 px-4 py-3 duration-300">
        <div className="flex items-center gap-3">
          <span className="tg-confetti text-4xl text-[var(--tg)]" aria-hidden="true"><Ico name={pct === 1 ? "trophy" : pct >= 0.7 ? "medal" : pct >= 0.4 ? "strong" : "book"} /></span>
          <div>
            <p className="flex items-baseline gap-2 text-2xl font-semibold tabular-nums text-foreground">{right}/{total}
              <span className="text-lg tracking-tight text-amber-400" aria-label={`${stars} of 3 stars`}><Stars count={stars} /></span>
            </p>
            <p className="text-sm font-medium text-muted-foreground">{line}</p>
          </div>
        </div>
        {onReset ? <IconButton icon="restart" label="Try again" onClick={onReset} /> : null}
      </div>
  )
}

/* ---------- practice ---------- */


const PAIR_COLORS = ["#2f7ee0", "#d6436b", "#d98a00", "#7c4ddb", "#1f9d74", "#e25c1c", "#0e9bb3", "#b5459b", "#5d7a1f", "#4b5bd6"]

/** "Match the letters" worksheet: drag (or tap) from a term's dot to a definition's dot. */
function MatchingWidget({ data }) {
  const [matches, setMatches] = useTutorWidgetProgress("matches", () => shuffled(data.pairs.map((p) => p.match)))
  const [links, setLinks] = useTutorWidgetProgress("links", {})
  const [checked, setChecked] = useTutorWidgetProgress("linksChecked", false)
  const [from, setFrom] = useState(null)
  const [pointer, setPointer] = useState(null)
  const [dots, setDots] = useState({ left: [], right: [], w: 0, h: 0 })
  const box = useRef(null)
  const measure = () => {
    const root = box.current
    if (!root) return
    const r = root.getBoundingClientRect()
    const at = (side) => [...root.querySelectorAll(`[data-dot="${side}"]`)].map((el) => { const d = el.getBoundingClientRect(); return { x: d.left + d.width / 2 - r.left, y: d.top + d.height / 2 - r.top } })
    setDots({ left: at("left"), right: at("right"), w: r.width, h: r.height })
  }
  useEffect(() => {
    measure()
    const observer = new ResizeObserver(measure)
    if (box.current) observer.observe(box.current)
    return () => observer.disconnect()
  }, [matches, data.pairs.length])
  const link = (term, match) => {
    setLinks((current) => {
      const next = Object.fromEntries(Object.entries(current).filter(([, m]) => m !== match))
      next[term] = match
      return next
    })
    setChecked(false)
    setFrom(null)
  }
  const unlink = (term) => { setLinks((current) => { const next = { ...current }; delete next[term]; return next }); setChecked(false) }
  const local = (event) => { const r = box.current.getBoundingClientRect(); return { x: event.clientX - r.left, y: event.clientY - r.top } }
  const dragged = useRef(false)
  const startDrag = (event, i) => {
    if (event.pointerType === "mouse" && event.button !== 0) return
    const start = { x: event.clientX, y: event.clientY }
    dragged.current = false
    const move = (e) => {
      if (!dragged.current && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 6) return
      dragged.current = true
      setFrom(i)
      setPointer(local(e))
    }
    const up = (e) => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      if (!dragged.current) return
      setPointer(null)
      const target = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-match-index]")
      if (target && box.current?.contains(target)) link(i, matches[Number(target.dataset.matchIndex)])
      else setFrom(null)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }
  const isRight = (i) => links[i] === data.pairs[i].match
  const linkedCount = Object.keys(links).length
  const right = data.pairs.filter((_, i) => isRight(i)).length
  const colorOf = (i) => PAIR_COLORS[i % PAIR_COLORS.length]
  const curve = (a, b) => { const mid = (a.x + b.x) / 2; return `M${a.x} ${a.y} C${mid} ${a.y} ${mid} ${b.y} ${b.x} ${b.y}` }
  const termOf = (match) => Object.keys(links).find((t) => links[t] === match)
  const badge = "relative flex min-h-12 w-full min-w-0 items-center gap-2 rounded-2xl border-2 bg-card py-1.5 text-left text-xs leading-snug font-bold [overflow-wrap:anywhere] hyphens-auto @md:gap-2.5 @md:rounded-full @md:text-sm shadow-[0_3px_0_var(--tg-line)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tg)]"
  const dot = "absolute top-1/2 size-4 -translate-y-1/2 rounded-full border-[3px] border-card shadow ring-2"
  return (
      <Frame kind="Match the pairs" type="matching" title={data.title} badge={`${linkedCount}/${data.pairs.length}`} saved={data}>
        <GameHint>Draw a line from each term to its definition — drag between the dots, or tap a term and then a definition. Tap a linked term to undo it.</GameHint>
        <div ref={box} className="relative grid grid-cols-2 gap-x-5 gap-y-2.5 @md:gap-x-12 @xl:gap-x-20" >
          <svg className="pointer-events-none absolute inset-0 z-10 overflow-visible" width={dots.w} height={dots.h} aria-hidden="true">
            {Object.entries(links).map(([t, m]) => {
              const a = dots.left[t], b = dots.right[matches.indexOf(m)]
              if (!a || !b) return null
              const stroke = checked ? (isRight(t) ? "#22a565" : "#e0475f") : colorOf(Number(t))
              return <path key={t} d={curve(a, b)} fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" className="animate-in fade-in duration-300" />
            })}
            {from != null && pointer && dots.left[from] ? <path d={curve(dots.left[from], pointer)} fill="none" stroke={colorOf(from)} strokeWidth="3" strokeDasharray="7 6" strokeLinecap="round" /> : null}
          </svg>
          <ol className="contents">
            {data.pairs.map((p, i) => {
              const linked = links[i] != null
              const state = checked && linked ? (isRight(i) ? "!border-emerald-500" : "!border-rose-500 animate-[shake_0.3s_ease-in-out]") : ""
              return (
                  <li key={i} className="col-start-1" style={{ gridRow: i + 1 }}>
                    <button type="button" aria-pressed={from === i} aria-label={`${p.term}${linked ? `, linked to ${links[i]}` : ""}`}
                            onClick={() => { if (dragged.current) { dragged.current = false; return } if (from === i) setFrom(null); else if (linked && from == null) unlink(i); else setFrom(i) }}
                            onPointerDown={(e) => startDrag(e, i)}
                            className={`${badge} touch-none pl-2.5 pr-4 @md:pl-1.5 @md:pr-6 ${state}`}
                            style={{ borderColor: from === i || linked ? colorOf(i) : "var(--tg-line)", background: from === i ? `color-mix(in oklab, ${colorOf(i)} 14%, var(--card))` : undefined }}>
                      <span className="hidden size-8 shrink-0 place-items-center rounded-full text-xs @md:grid font-black text-white" style={{ background: colorOf(i) }}>{String.fromCharCode(65 + (i % 26))}</span>
                      <span className="min-w-0 flex-1">{p.term}</span>
                      <span data-dot="left" className={`${dot} -right-2`} style={{ background: colorOf(i), "--tw-ring-color": colorOf(i) }} />
                    </button>
                  </li>
              )
            })}
          </ol>
          <ul className="contents">
            {matches.map((m, j) => {
              const t = termOf(m)
              const c = t != null ? colorOf(Number(t)) : null
              const state = checked && t != null ? (isRight(t) ? "!border-emerald-500" : "!border-rose-500") : ""
              return (
                  <li key={m} className="col-start-2" style={{ gridRow: j + 1 }}>
                    <button type="button" data-match-index={j} disabled={from == null && t == null}
                            aria-label={`${m}${t != null ? `, linked to ${data.pairs[t].term}` : ""}`}
                            onClick={() => from != null && link(from, m)}
                            className={`${badge} pl-4 pr-2.5 !font-semibold @md:pl-6 @md:pr-3 disabled:opacity-100 ${from != null ? "cursor-pointer hover:-translate-y-0.5 hover:border-[var(--tg)]" : ""} ${state}`}
                            style={{ borderColor: c ?? "var(--tg-line)", background: c ? `color-mix(in oklab, ${c} 10%, var(--card))` : undefined }}>
                      <span data-dot="right" className={`${dot} -left-2`} style={{ background: c ?? "var(--card)", "--tw-ring-color": c ?? "var(--tg-line)" }} />
                      <span className="min-w-0 flex-1">{m}</span>
                      {checked && t != null ? (isRight(t) ? <CheckCircle2 className="size-4 shrink-0 text-emerald-600" /> : <XCircle className="size-4 shrink-0 text-rose-600" />) : null}
                    </button>
                  </li>
              )
            })}
          </ul>
        </div>
        <GameFooter onCheck={() => setChecked(true)} checkDisabled={!linkedCount} score={checked ? `${right} of ${data.pairs.length} lines right${right < data.pairs.length ? " — re-draw the red ones" : ""}` : `${linkedCount} of ${data.pairs.length} matched`} onRestart={() => { setLinks({}); setChecked(false); setFrom(null); setMatches(shuffled(data.pairs.map((p) => p.match))) }} />
        {checked && right === data.pairs.length ? <Score right={right} total={data.pairs.length} /> : null}
      </Frame>
  )
}

function OrderingWidget({ data }) {
  const fresh = () => {
    let order = shuffled(data.items)
    for (let tries = 0; tries < 5 && order.every((x, i) => x === data.items[i]); tries++) order = shuffled(data.items)
    return order
  }
  const [order, setOrder] = useTutorWidgetProgress("order", fresh)
  const [checked, setChecked] = useTutorWidgetProgress("checked", false)
  const reorder = (from, to) => {
    if (from === to || from < 0 || to < 0 || to >= order.length) return
    const next = [...order]
    next.splice(to, 0, next.splice(from, 1)[0])
    setOrder(next)
    setChecked(false)
  }
  const move = (i, delta) => reorder(i, i + delta)
  const drag = useCardDrag((item, target) => reorder(order.indexOf(item), target))
  const right = order.filter((x, i) => x === data.items[i]).length
  return (
      <Frame kind="Put in order" type="ordering" title={data.title} saved={data}>
        <GameHint>Drag the cards into order — or tap one card, then tap where it goes. The arrows work too.</GameHint>
        <ol className="space-y-2">
          {order.map((item, i) => {
            const ok = checked && item === data.items[i]
            const bad = checked && item !== data.items[i]
            const card = drag.card(item)
            return (
                <li key={item} {...drag.zone(i)} {...card}
                    onClick={() => drag.picked != null && drag.picked !== item ? drag.placePicked(i) : card.onClick()}
                    onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); e.currentTarget.click() } }}
                    tabIndex={0} role="button" aria-label={`Step ${i + 1}: ${item}`}
                    className={`tg-card !py-1.5 ${ok ? "is-right" : bad ? "is-wrong" : ""} ${drag.picked === item ? "is-picked" : ""} ${drag.dragging === item ? "is-dragging" : ""} ${drag.over === i && drag.dragging !== item ? "!border-[var(--tg)] !bg-[var(--tg-soft)]" : ""}`}>
                  <Grip />
                  <span className="tg-num">{i + 1}</span>
                  <span className="min-w-0 flex-1 text-foreground">{item}</span>
                  <button type="button" aria-label="Move up" disabled={i === 0} onClick={(e) => { e.stopPropagation(); move(i, -1) }} className="rounded-lg p-1.5 text-muted-foreground hover:bg-[var(--tg-soft)] disabled:opacity-30"><ArrowUp className="size-3.5" /></button>
                  <button type="button" aria-label="Move down" disabled={i === order.length - 1} onClick={(e) => { e.stopPropagation(); move(i, 1) }} className="rounded-lg p-1.5 text-muted-foreground hover:bg-[var(--tg-soft)] disabled:opacity-30"><ArrowDown className="size-3.5" /></button>
                </li>
            )
          })}
        </ol>
        <GameFooter onCheck={() => setChecked(true)} score={checked ? `${right} of ${order.length} in the right place${right < order.length ? " — keep moving the red ones" : ""}` : `${order.length} cards to order`} onRestart={() => { setOrder(fresh()); setChecked(false) }} />
        {checked && right === order.length ? <Feedback ok>{data.explanation}</Feedback> : null}
      </Frame>
  )
}

const normalizeAnswer = (s) => String(s ?? "").trim().toLowerCase().replace(/[\s.,;:!'"`]+/g, " ").trim()

function FillBlankWidget({ data }) {
  const [values, setValues] = useTutorWidgetProgress("values", {})
  const [checked, setChecked] = useTutorWidgetProgress("checked", false)
  const isRight = (b, i) => [b.answer, ...(b.alternatives ?? [])].some((a) => normalizeAnswer(a) === normalizeAnswer(values[i]))
  const right = data.blanks.filter(isRight).length
  return (
      <Frame kind="Fill in the blank" type="fill_blank" title={data.title} saved={data}>
        <GameHint>Type the missing word in each blank, then check your answers.</GameHint>
        <ol className="space-y-3">
          {data.blanks.map((b, i) => {
            const [before, ...rest] = b.sentence.split("___")
            const ok = checked && isRight(b, i)
            return (
                <li key={i} className="flex gap-3 rounded-2xl bg-[var(--tg-softer)] p-3 text-sm leading-8 text-foreground">
                  <span className="tg-num mt-1">{i + 1}</span><span className="min-w-0">
                  {before}
                  <input
                      value={values[i] ?? ""}
                      onChange={(e) => { setValues((v) => ({ ...v, [i]: e.target.value })); setChecked(false) }}
                      onKeyDown={(e) => e.key === "Enter" && setChecked(true)}
                      className={`mx-1 w-36 rounded-lg border-0 border-b-[3px] bg-card px-2 py-0.5 text-center text-sm font-extrabold outline-none ${
                          !checked ? "border-[var(--tg-line)] focus:border-[var(--tg)]" : ok ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40" : "border-rose-300 bg-rose-50 dark:bg-rose-950/40"}`}
                      aria-label={`Blank ${i + 1}`}
                  />
                  {rest.join("___")}
                  {checked && !ok ? <span className="ml-2 text-xs font-bold text-rose-700 dark:text-rose-300">→ {b.answer}</span> : null}</span>
                </li>
            )
          })}
        </ol>
        <GameFooter onCheck={() => setChecked(true)} score={checked ? `${right} of ${data.blanks.length} right` : `${data.blanks.filter((_, i) => String(values[i] ?? "").trim()).length} of ${data.blanks.length} filled`} onRestart={() => { setValues({}); setChecked(false) }} />
        {checked && right === data.blanks.length ? <Score right={right} total={data.blanks.length} /> : null}
      </Frame>
  )
}

function TrueFalseWidget({ data }) {
  const [answers, setAnswers] = useTutorWidgetProgress("answers", {})
  const total = data.claims.length
  const answered = Object.keys(answers).length
  const right = data.claims.filter((c, i) => answers[i] === c.isTrue).length
  return (
      <Frame kind="Myth or fact" type="true_false" title={data.title} badge={`${answered}/${total}`} saved={data}>
        <GameHint>Decide whether each statement is a fact or a myth.</GameHint>
        <ol className="space-y-4">
          {data.claims.map((c, i) => (
              <li key={i} className="rounded-2xl bg-[var(--tg-softer)] p-3">
                <p className="flex gap-2 text-sm font-semibold text-foreground"><span className="tg-num">{i + 1}</span><span className="pt-1">{c.statement}</span></p>
                <div className="mt-2 flex gap-2">
                  {[true, false].map((value) => {
                    const picked = answers[i] === value
                    const state = answers[i] == null ? "" : value === c.isTrue ? "right" : picked ? "wrong" : "dim"
                    return (
                        <button key={String(value)} type="button" disabled={answers[i] != null}
                                onClick={() => setAnswers((a) => ({ ...a, [i]: value }))}
                                className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-extrabold shadow-[0_3px_0_var(--tg-line)] transition ${
                                    state === "right" ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200"
                                        : state === "wrong" ? "border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200"
                                            : state === "dim" ? "border-border text-muted-foreground" : "border-[var(--tg-line)] bg-card text-foreground hover:-translate-y-0.5 hover:border-[var(--tg)] active:translate-y-0"}`}>
                          <Ico name={value ? "right" : "wrong"} className="mr-1.5" />{value ? "Fact" : "Myth"}
                        </button>
                    )
                  })}
                </div>
                {answers[i] != null ? <Feedback ok={answers[i] === c.isTrue}>{c.explanation}</Feedback> : null}
              </li>
          ))}
        </ol>
        <GameFooter score={`${right} of ${answered} correct · ${answered} of ${total} answered`} onRestart={() => setAnswers({})} />
        {answered === total ? <Score right={right} total={total} /> : null}
      </Frame>
  )
}

/* ---------- explanations ---------- */

function TableWidget({ data }) {
  return (
      <Frame kind="Comparison" type="table">
        <div className="overflow-x-auto rounded-xl ring-1 ring-[var(--tg-line)]">
          <table className="w-full min-w-max border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--tg-soft)]">{data.columns.map((c, i) => (
                  <th key={i} className="border-b-2 border-[var(--tg-line)] px-3 py-2.5 text-left text-xs font-extrabold uppercase tracking-wide text-[var(--tg-ink)]">{c}</th>
              ))}</tr>
            </thead>
            <tbody>
              {data.rows.map((row, r) => (
                  <tr key={r} className="transition even:bg-[var(--tg-softer)] hover:bg-[var(--tg-soft)]">
                    {row.map((cell, c) => (
                        <td key={c} className={`border-b border-[var(--tg-line)] px-3 py-2 text-foreground ${c === 0 ? "font-extrabold" : "font-medium"}`}>{cell}</td>
                    ))}
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.caption ? <p className="mt-2 text-xs font-semibold text-muted-foreground">{data.caption}</p> : null}
      </Frame>
  )
}

function CardsWidget({ data }) {
  return (
      <Frame kind="Examples" type="cards" title={data.title}>
        <div className="grid gap-3 @md:grid-cols-2">
          {data.cards.map((card, i) => {
            const tone = TONES[i % TONES.length]
            const Icon = CARD_ICONS[card.icon] ?? Sparkles
            return (
                <div key={i} className={`flex gap-3 rounded-2xl border ${tone.ring} ${tone.wash} p-3 shadow-[0_3px_0_var(--tg-line)] transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/5`}>
                  <span className={`grid size-12 shrink-0 -rotate-3 place-items-center rounded-xl text-white shadow-md ${tone.dot}`}><Icon className="size-5" /></span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{card.title}</p>
                    {card.detail ? <p className="text-xs font-semibold text-muted-foreground">{card.detail}</p> : null}
                    {card.highlight ? <p className={`mt-0.5 text-sm font-extrabold ${tone.text} dark:brightness-150`}>{card.highlight}</p> : null}
                  </div>
                </div>
            )
          })}
        </div>
      </Frame>
  )
}

function StepsWidget({ data }) {
  const [shown, setShown] = useTutorWidgetProgress("shown", 1)
  const all = shown > data.steps.length
  return (
      <Frame kind="Worked example" type="steps" badge={`step ${Math.min(shown, data.steps.length)}/${data.steps.length}`}>
        <div className="mb-4 flex gap-2 rounded-2xl border border-[var(--tg-line)] bg-[var(--tg-softer)] px-3 py-2"><Ico name="calc" className="mt-1 size-5 text-[var(--tg)]" /><Md className="font-semibold text-foreground">{data.problem}</Md></div>
        <ol className="relative ml-3 space-y-4 border-l-[3px] border-dashed border-[var(--tg-line)] pl-6">
          {data.steps.slice(0, shown).map((step, i) => (
              <li key={i} className="relative animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="tg-num absolute -left-[39px] top-0 !rounded-full ring-4 ring-card">{i + 1}</span>
                <p className="text-sm font-semibold text-foreground">{step.title}</p>
                <Md className="text-foreground">{step.detail}</Md>
              </li>
          ))}
        </ol>
        {all && data.answer ? (
            <div className="tg-result mt-4 flex animate-in fade-in zoom-in-95 items-center gap-2 px-3 py-2.5 text-sm font-extrabold text-foreground"><Ico name="target" className="tg-confetti size-6 text-[var(--tg)]" />Answer: {data.answer}</div>
        ) : null}
        <div className="mt-3 flex gap-2">
          {!all ? (
              <>
                <IconButton icon={shown < data.steps.length ? "next" : "show"} primary label={shown < data.steps.length ? "Next step" : "Show answer"} onClick={() => setShown((s) => s + 1)} />
                <IconButton icon="all" label="Show all steps" onClick={() => setShown(data.steps.length + 1)} />
              </>
          ) : <IconButton icon="restart" label="Start over" onClick={() => setShown(1)} />}
        </div>
      </Frame>
  )
}

function CodeWidget({ data }) {
  const [copied, setCopied] = useState(false)
  const copy = () => navigator.clipboard?.writeText(data.code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
  return (
      <section className={`tg-frame my-3 w-full ${categoryClass("code")}`} data-tutor-widget="code">
        <header className="tg-head flex items-center gap-3 px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden="true"><span className="size-3 rounded-full bg-rose-400" /><span className="size-3 rounded-full bg-amber-400" /><span className="size-3 rounded-full bg-emerald-400" /></span>
          <span className="tg-badge-icon !size-7"><Code2 className="size-3.5" /></span>
          <span className="tg-kicker">{data.language}</span>
          <button type="button" onClick={copy} className="tg-btn ml-auto !px-2.5 !py-1 !text-xs">
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy"}
          </button>
        </header>
        <div className="overflow-x-auto">
          <SyntaxHighlighter language={data.language} useInlineStyles={false} PreTag="pre" CodeTag="code"
                             className="rb-code-sample !m-0 !rounded-none" showLineNumbers={data.code.split("\n").length > 4}>
            {data.code}
          </SyntaxHighlighter>
        </div>
        {data.caption ? <p className="border-t border-border px-4 py-2 text-xs font-semibold text-muted-foreground">{data.caption}</p> : null}
      </section>
  )
}

function TeX({ latex }) {
  const html = useMemo(() => katex.renderToString(latex, { displayMode: true, throwOnError: false, strict: "ignore", trust: false }), [latex])
  return <div className="overflow-x-auto py-1" dangerouslySetInnerHTML={{ __html: html }} />
}

function MathWidget({ data }) {
  return (
      <Frame kind="Math" type="math" title={data.title}>
        <div className="space-y-2">
          {data.steps.map((step, i) => (
              <div key={i} className="relative flex flex-col gap-0.5 rounded-xl bg-[var(--tg-softer)] px-3 py-1.5 ring-1 ring-[var(--tg-line)]"><span className="tg-num absolute left-2 top-2 !size-6 !text-[10px]">{i + 1}</span>
                <TeX latex={step.latex} />
                {step.note ? <p className="text-center text-xs font-semibold text-muted-foreground">{step.note}</p> : null}
              </div>
          ))}
        </div>
      </Frame>
  )
}

let mermaidReady
function loadMermaid() {
  mermaidReady ??= import("mermaid").then(({ default: mermaid }) => {
    mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "neutral", fontFamily: "inherit" })
    return mermaid
  })
  return mermaidReady
}

let diagramCount = 0
function DiagramWidget({ data }) {
  const [svg, setSvg] = useState(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let live = true
    loadMermaid()
        .then((mermaid) => mermaid.render(`rb-tutor-diagram-${++diagramCount}`, data.mermaid))
        .then(({ svg }) => live && setSvg(svg))
        .catch(() => live && setFailed(true))
    return () => { live = false }
  }, [data.mermaid])
  return (
      <Frame kind="Diagram" type="diagram" title={data.title}>
        {failed ? (
            <pre className="overflow-x-auto rounded-xl bg-muted p-3 text-xs text-foreground">{data.mermaid}</pre>
        ) : svg ? (
            <div className="flex justify-center overflow-x-auto rounded-xl bg-white p-3 ring-1 ring-[var(--tg-line)] [&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />
        ) : (
            <div className="grid h-32 animate-pulse place-items-center rounded-xl bg-[var(--tg-soft)] text-2xl text-[var(--tg)]" aria-label="Drawing diagram"><Ico name="map" /></div>
        )}
      </Frame>
  )
}

/* A tiny, safe expression evaluator for the explorer: numbers, variables,
   + - * / % ^, parentheses and a fixed set of Math functions. No eval. */
const FUNCS = {
  floor: Math.floor, ceil: Math.ceil, round: Math.round, abs: Math.abs, sqrt: Math.sqrt,
  log: Math.log, log2: Math.log2, log10: Math.log10, exp: Math.exp, min: Math.min, max: Math.max, pow: Math.pow,
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
}
const CONSTS = { pi: Math.PI, e: Math.E }

function evaluate(formula, scope) {
  const tokens = formula.match(/\d+\.?\d*(?:e[+-]?\d+)?|\.\d+|[A-Za-z_]\w*|\*\*|[-+*/%^(),]/g) ?? []
  let pos = 0
  const peek = () => tokens[pos]
  const take = () => tokens[pos++]
  const expect = (t) => { if (take() !== t) throw new Error(`expected ${t}`) }
  function primary() {
    const t = take()
    if (t == null) throw new Error("end")
    if (t === "(") { const v = expr(); expect(")"); return v }
    if (t === "-") return -power()
    if (t === "+") return power()
    if (/^[\d.]/.test(t)) return parseFloat(t)
    if (FUNCS[t] && peek() === "(") {
      take()
      const args = [expr()]
      while (peek() === ",") { take(); args.push(expr()) }
      expect(")")
      return FUNCS[t](...args)
    }
    if (t in scope) return scope[t]
    if (t in CONSTS) return CONSTS[t]
    throw new Error(`unknown ${t}`)
  }
  function power() {
    const base = primary()
    if (peek() === "^" || peek() === "**") { take(); return Math.pow(base, unary()) }
    return base
  }
  function unary() { return power() }
  function term() {
    let v = unary()
    while (["*", "/", "%"].includes(peek())) {
      const op = take(); const r = unary()
      v = op === "*" ? v * r : op === "/" ? v / r : v % r
    }
    return v
  }
  function expr() {
    let v = term()
    while (peek() === "+" || peek() === "-") { const op = take(); const r = term(); v = op === "+" ? v + r : v - r }
    return v
  }
  const value = expr()
  if (pos !== tokens.length) throw new Error("trailing")
  return value
}

function formatValue(value, format) {
  if (!Number.isFinite(value)) return "—"
  if (format === "percent") return `${(value * 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}%`
  if (format === "binary") return Math.round(value) >= 0 ? Math.round(value).toString(2) : "—"
  return value.toLocaleString(undefined, { maximumFractionDigits: 4 })
}

function ExplorerWidget({ data }) {
  const [scope, setScope] = useTutorWidgetProgress("scope", () => Object.fromEntries(data.variables.map((v) => [v.name, v.value])))
  return (
      <Frame kind="Explorer" type="explorer" title={data.title}>
        <div className="space-y-3">
          {data.variables.map((v) => (
              <label key={v.name} className="block">
                <span className="flex items-center justify-between text-xs font-semibold text-foreground">
                  {v.label}
                  <span className="tg-num !h-6 !w-auto min-w-6 px-2 tabular-nums">{scope[v.name]}</span>
                </span>
                <input type="range" min={v.min} max={v.max} step={v.step} value={scope[v.name]}
                       onChange={(e) => setScope((s) => ({ ...s, [v.name]: Number(e.target.value) }))}
                       className="mt-1 w-full accent-[var(--tg)]" />
              </label>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 @sm:grid-cols-2">
          {data.outputs.map((o, i) => {
            let value
            try { value = evaluate(o.formula, scope) } catch { value = NaN }
            const tone = TONES[i % TONES.length]
            return (
                <div key={i} className={`rounded-2xl border ${tone.ring} ${tone.wash} px-3 py-2 shadow-[0_3px_0_var(--tg-line)] dark:border-white/10 dark:bg-white/5`}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{o.label}</p>
                  <p className={`break-all text-xl font-black tabular-nums ${tone.text} dark:brightness-150`}>{formatValue(value, o.format)}</p>
                </div>
            )
          })}
        </div>
        {data.note ? <p className="mt-3 text-xs font-semibold text-muted-foreground"><Ico name="idea" className="mr-1 text-amber-500" />{data.note}</p> : null}
      </Frame>
  )
}

export function MindMapWidget({ data }) {
  return <div className={categoryClass("mindmap")}><MindMap data={data} header={data.standalone ? null : <SavedChip library={data.library} />} /></div>
}

const WIDGETS = {
  quiz: TutorStudyWidget, flashcards: TutorStudyWidget, matching: MatchingWidget, ordering: OrderingWidget,
  fill_blank: FillBlankWidget, true_false: TrueFalseWidget, table: TableWidget, cards: CardsWidget,
  steps: StepsWidget, code: CodeWidget, math: MathWidget, diagram: DiagramWidget,
  explorer: ExplorerWidget, mindmap: MindMapWidget,
  sorting: SortingGame, word_game: WordGame, puzzle: PuzzleGame, visual_game: VisualGame, speed_flashcards: SpeedFlashcardsGame,
  branching_story: BranchingStoryGame, simulation: SimulationGame, two_truths_lie: TwoTruthsLieGame,
}

export function TutorWidget({ widget, persistenceKey }) {
  const Widget = WIDGETS[widget?.type]
  if (!Widget) return null
  return <TutorWidgetProgressContext.Provider key={persistenceKey || "temporary"} value={persistenceKey}>{widget.libraryError && !["sorting", "word_game", "puzzle", "visual_game", "speed_flashcards", "branching_story", "simulation", "two_truths_lie"].includes(widget.type) ? <p role="alert" className="rounded-xl border border-destructive p-3 text-sm text-destructive">{widget.libraryError}</p> : null}<Widget data={widget} /></TutorWidgetProgressContext.Provider>
}

export function TutorWidgets({ widgets, persistenceScope }) {
  const ref = useRef(null)
  if (!widgets?.length) return null
  return (
      <div ref={ref} className="w-full">
        {widgets.map((widget, i) => <TutorWidget key={i} widget={widget} persistenceKey={widgetProgressKey(persistenceScope, widget, i)} />)}
      </div>
  )
}
