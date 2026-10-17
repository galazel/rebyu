// The interactive pieces the AI tutor draws with its tools (see the Python
// app/ai/tutor_widgets.py for the shapes). Everything here is client-side:
// answers, flips and slider values are the learner's own and are not saved.
import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import katex from "katex"
import "katex/dist/katex.min.css"
import { Light as SyntaxHighlighter } from "react-syntax-highlighter"
import { registerCodeLanguages } from "@/components/certifications/code-languages.js"
import { MindMap } from "@/components/learner/tutor-mindmap.jsx"
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  BookOpen,
  Brain,
  Building,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Code2,
  Copy,
  Eye,
  FlipHorizontal,
  Home,
  ListOrdered,
  Lock,
  Network,
  RotateCcw,
  ServerCog,
  Sparkles,
  Type,
  UploadCloud,
  User,
  XCircle,
  Zap,
} from "@/components/icons"

registerCodeLanguages(SyntaxHighlighter)

const TONES = [
  { wash: "bg-sky-50", text: "text-sky-700", ring: "border-sky-200", dot: "bg-sky-500" },
  { wash: "bg-emerald-50", text: "text-emerald-700", ring: "border-emerald-200", dot: "bg-emerald-500" },
  { wash: "bg-amber-50", text: "text-amber-700", ring: "border-amber-200", dot: "bg-amber-500" },
  { wash: "bg-violet-50", text: "text-violet-700", ring: "border-violet-200", dot: "bg-violet-500" },
  { wash: "bg-rose-50", text: "text-rose-700", ring: "border-rose-200", dot: "bg-rose-500" },
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
      <div className={`text-sm leading-6 [&_p]:my-1 [&_strong]:font-extrabold [&_ul]:list-disc [&_ul]:pl-5 [&_table]:my-2 [&_td]:border-b [&_td]:border-rb-swan [&_td]:px-2 [&_td]:py-1 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_code]:rounded [&_code]:bg-rb-polar [&_code]:px-1 ${className}`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{children ?? ""}</ReactMarkdown>
      </div>
  )
}

/** Quizzes, flashcards and mind maps are saved to the Library by the gateway as
 *  they stream; `library.route` is set on the live reply, a reload links to the Library. */
function SavedChip({ library }) {
  return (
      <Link to={library?.route ?? "/learner/library"}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-extrabold text-emerald-700 hover:bg-emerald-100">
        <BookOpen className="size-3" /> {library?.route ? "Saved · Open" : "In your Library"}
      </Link>
  )
}

function Frame({ kind, title, badge, children, icon: Icon = Sparkles, saved }) {
  return (
      <section className="my-3 w-full overflow-hidden rounded-2xl border-2 border-rb-swan bg-white">
        <header className="flex items-center gap-2 border-b-2 border-rb-swan bg-rb-polar/60 px-4 py-2.5">
          <Icon className="size-4 text-rb-feather" />
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-rb-feather-lip">{kind}</span>
          {title ? <span className="min-w-0 truncate text-sm font-extrabold text-rb-eel">· {title}</span> : null}
          <span className="ml-auto flex shrink-0 items-center gap-2">
            {badge ? <span className="text-xs font-bold text-rb-hare">{badge}</span> : null}
            {saved ? <SavedChip library={saved.library} /> : null}
          </span>
        </header>
        <div className="p-4">{children}</div>
      </section>
  )
}

function Feedback({ ok, children }) {
  return (
      <div className={`mt-2 flex gap-2 rounded-xl px-3 py-2 text-sm ${ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
        {ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <XCircle className="mt-0.5 size-4 shrink-0" />}
        <div className="min-w-0"><strong>{ok ? "Correct!" : "Not quite."}</strong> {children}</div>
      </div>
  )
}

function SmallButton({ children, onClick, primary, disabled }) {
  return (
      <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-extrabold transition disabled:opacity-40 ${
              primary ? "bg-rb-feather text-white hover:brightness-110" : "border-2 border-rb-swan bg-white text-rb-eel hover:bg-rb-polar"
          }`}
      >
        {children}
      </button>
  )
}

function Score({ right, total, onReset }) {
  const pct = total ? right / total : 0
  const line = pct === 1 ? "Perfect -- you've got this!" : pct >= 0.7 ? "Good job!" : pct >= 0.4 ? "Getting there -- review the misses." : "Let's go over this again."
  return (
      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-rb-polar px-4 py-3">
        <div>
          <p className="text-2xl font-extrabold text-rb-eel">{right}/{total}</p>
          <p className="text-sm font-bold text-rb-hare">{line}</p>
        </div>
        <SmallButton onClick={onReset}><RotateCcw className="size-3.5" /> Try again</SmallButton>
      </div>
  )
}

/* ---------- practice ---------- */

function QuizWidget({ data }) {
  const [answers, setAnswers] = useState({})
  const [hint, setHint] = useState(false)
  const total = data.questions.length
  const answered = Object.keys(answers).length
  const right = data.questions.filter((q, i) => answers[i] === q.correctIndex).length
  return (
      <Frame kind="Practice quiz" title={data.title} badge={`${answered}/${total} answered`} icon={Brain} saved={data}>
        <div className="mb-4 flex gap-1">
          {data.questions.map((q, i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full ${
                  answers[i] == null ? "bg-rb-swan" : answers[i] === q.correctIndex ? "bg-emerald-500" : "bg-rose-400"}`} />
          ))}
        </div>
        <ol className="space-y-5">
          {data.questions.map((q, i) => {
            const picked = answers[i]
            const inline = q.options.every((o) => o.length <= 4)
            return (
                <li key={i} className="border-b border-rb-swan pb-4 last:border-0 last:pb-0">
                  <p className="mb-2 text-sm font-extrabold text-rb-eel">{i + 1}. {q.question}</p>
                  <div className={inline ? "flex flex-wrap gap-2" : "space-y-1.5"}>
                    {q.options.map((option, o) => {
                      const state = picked == null ? "" : o === q.correctIndex ? "right" : o === picked ? "wrong" : "dim"
                      return (
                          <button
                              key={o}
                              type="button"
                              disabled={picked != null}
                              onClick={() => setAnswers((a) => ({ ...a, [i]: o }))}
                              className={`flex items-center gap-2.5 rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold transition ${inline ? "" : "w-full"} ${
                                  state === "right" ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                                      : state === "wrong" ? "border-rose-300 bg-rose-50 text-rose-900"
                                          : state === "dim" ? "border-rb-swan text-rb-hare"
                                              : "border-rb-swan text-rb-eel hover:border-rb-feather hover:bg-rb-polar"}`}
                          >
                            <span className={`grid size-5 shrink-0 place-items-center rounded-full border-2 text-[10px] ${
                                state === "right" ? "border-emerald-500 bg-emerald-500 text-white" : state === "wrong" ? "border-rose-400 bg-rose-400 text-white" : "border-rb-swan"}`}>
                              {state === "right" ? <Check className="size-3" /> : state === "wrong" ? "✕" : String.fromCharCode(65 + o)}
                            </span>
                            {option}
                          </button>
                      )
                    })}
                  </div>
                  {picked != null ? (
                      <Feedback ok={picked === q.correctIndex}>
                        {picked !== q.correctIndex ? <>Answer: <strong>{q.options[q.correctIndex]}</strong>. </> : null}
                        {q.explanation}
                      </Feedback>
                  ) : null}
                </li>
            )
          })}
        </ol>
        {data.hint ? (
            <div className="mt-4 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/60">
              <button type="button" onClick={() => setHint((h) => !h)} className="flex w-full items-center gap-2 px-3 py-2 text-sm font-extrabold text-amber-800">
                <Zap className="size-4" /> {hint ? "Hide hint" : "Show hint"}
                <ChevronDown className={`ml-auto size-4 transition ${hint ? "rotate-180" : ""}`} />
              </button>
              {hint ? <Md className="px-3 pb-3 text-amber-900">{data.hint}</Md> : null}
            </div>
        ) : null}
        {answered === total ? <Score right={right} total={total} onReset={() => setAnswers({})} /> : null}
      </Frame>
  )
}

function FlashcardsWidget({ data }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState({})
  const card = data.cards[index]
  const go = (next) => { setFlipped(false); setIndex((next + data.cards.length) % data.cards.length) }
  const mark = (value) => { setKnown((k) => ({ ...k, [index]: value })); go(index + 1) }
  const knownCount = Object.values(known).filter(Boolean).length
  return (
      <Frame kind="Flashcards" title={data.title} badge={`${index + 1}/${data.cards.length} · ${knownCount} known`} icon={FlipHorizontal} saved={data}>
        <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="group relative h-44 w-full [perspective:1000px]"
            aria-label={flipped ? "Show the front" : "Flip to see the answer"}
        >
          <div className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}>
            <div className="absolute inset-0 grid place-items-center rounded-2xl border-2 border-rb-swan bg-gradient-to-br from-white to-rb-polar p-5 [backface-visibility:hidden]">
              <p className="text-lg font-extrabold text-rb-eel">{card.front}</p>
              <span className="absolute bottom-2 text-[11px] font-bold text-rb-hare">tap to flip</span>
            </div>
            <div className="absolute inset-0 grid place-items-center overflow-auto rounded-2xl border-2 border-rb-feather bg-rb-feather/5 p-5 [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <p className="text-sm font-semibold leading-6 text-rb-eel">{card.back}</p>
            </div>
          </div>
        </button>
        <div className="mt-3 flex items-center gap-2">
          <SmallButton onClick={() => go(index - 1)}><ChevronLeft className="size-4" /></SmallButton>
          <div className="flex flex-1 justify-center gap-2">
            <SmallButton onClick={() => mark(false)}>Still learning</SmallButton>
            <SmallButton primary onClick={() => mark(true)}><Check className="size-3.5" /> Got it</SmallButton>
          </div>
          <SmallButton onClick={() => go(index + 1)}><ChevronRight className="size-4" /></SmallButton>
        </div>
      </Frame>
  )
}

function MatchingWidget({ data }) {
  const [round, setRound] = useState(0)
  const matches = useMemo(() => shuffled(data.pairs.map((p) => p.match)), [data, round])
  const [picked, setPicked] = useState(null)
  const [done, setDone] = useState({})
  const [miss, setMiss] = useState(null)
  const [mistakes, setMistakes] = useState(0)
  const choose = (match) => {
    if (picked == null || Object.values(done).includes(match)) return
    if (data.pairs[picked].match === match) {
      setDone((d) => ({ ...d, [picked]: match }))
      setPicked(null)
    } else {
      setMistakes((m) => m + 1)
      setMiss(match)
      setTimeout(() => setMiss(null), 600)
    }
  }
  const finished = Object.keys(done).length === data.pairs.length
  return (
      <Frame kind="Match the pairs" title={data.title} badge={`${Object.keys(done).length}/${data.pairs.length}`} icon={Network}>
        <p className="mb-3 text-xs font-bold text-rb-hare">Pick a term, then its match.</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            {data.pairs.map((p, i) => (
                <button key={i} type="button" disabled={done[i] != null} onClick={() => setPicked(i)}
                        className={`w-full rounded-xl border-2 px-3 py-2 text-left text-sm font-bold transition ${
                            done[i] != null ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                : picked === i ? "border-rb-feather bg-rb-feather/10 text-rb-eel" : "border-rb-swan text-rb-eel hover:bg-rb-polar"}`}>
                  {p.term}
                </button>
            ))}
          </div>
          <div className="space-y-2">
            {matches.map((m) => {
              const used = Object.values(done).includes(m)
              return (
                  <button key={m} type="button" disabled={used} onClick={() => choose(m)}
                          className={`w-full rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold transition ${
                              used ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                  : miss === m ? "animate-pulse border-rose-300 bg-rose-50 text-rose-800" : "border-rb-swan text-rb-eel hover:bg-rb-polar"}`}>
                    {m}
                  </button>
              )
            })}
          </div>
        </div>
        {finished ? (
            <Score right={data.pairs.length} total={data.pairs.length + mistakes}
                   onReset={() => { setDone({}); setPicked(null); setMistakes(0); setRound((r) => r + 1) }} />
        ) : null}
      </Frame>
  )
}

function OrderingWidget({ data }) {
  const fresh = () => {
    let order = shuffled(data.items)
    for (let tries = 0; tries < 5 && order.every((x, i) => x === data.items[i]); tries++) order = shuffled(data.items)
    return order
  }
  const [order, setOrder] = useState(fresh)
  const [checked, setChecked] = useState(false)
  const move = (i, delta) => {
    const j = i + delta
    if (j < 0 || j >= order.length) return
    const next = [...order]
    ;[next[i], next[j]] = [next[j], next[i]]
    setOrder(next)
    setChecked(false)
  }
  const right = order.filter((x, i) => x === data.items[i]).length
  return (
      <Frame kind="Put in order" title={data.title} icon={ArrowDown}>
        <ol className="space-y-2">
          {order.map((item, i) => {
            const ok = checked && item === data.items[i]
            const bad = checked && item !== data.items[i]
            return (
                <li key={item} className={`flex items-center gap-2 rounded-xl border-2 px-2 py-1.5 text-sm font-semibold transition ${
                    ok ? "border-emerald-300 bg-emerald-50" : bad ? "border-rose-300 bg-rose-50" : "border-rb-swan bg-white"}`}>
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-rb-polar text-xs font-extrabold text-rb-feather-lip">{i + 1}</span>
                  <span className="min-w-0 flex-1 text-rb-eel">{item}</span>
                  <button type="button" aria-label="Move up" onClick={() => move(i, -1)} className="rounded-lg p-1.5 text-rb-hare hover:bg-rb-polar"><ArrowUp className="size-3.5" /></button>
                  <button type="button" aria-label="Move down" onClick={() => move(i, 1)} className="rounded-lg p-1.5 text-rb-hare hover:bg-rb-polar"><ArrowDown className="size-3.5" /></button>
                </li>
            )
          })}
        </ol>
        <div className="mt-3 flex gap-2">
          <SmallButton primary onClick={() => setChecked(true)}>Check order</SmallButton>
          <SmallButton onClick={() => { setOrder(fresh()); setChecked(false) }}><RotateCcw className="size-3.5" /> Shuffle</SmallButton>
        </div>
        {checked ? (
            <Feedback ok={right === order.length}>
              {right === order.length ? data.explanation : `${right} of ${order.length} in the right place -- keep moving the red ones.`}
            </Feedback>
        ) : null}
      </Frame>
  )
}

const normalizeAnswer = (s) => String(s ?? "").trim().toLowerCase().replace(/[\s.,;:!'"`]+/g, " ").trim()

function FillBlankWidget({ data }) {
  const [values, setValues] = useState({})
  const [checked, setChecked] = useState(false)
  const isRight = (b, i) => [b.answer, ...(b.alternatives ?? [])].some((a) => normalizeAnswer(a) === normalizeAnswer(values[i]))
  const right = data.blanks.filter(isRight).length
  return (
      <Frame kind="Fill in the blank" title={data.title} icon={Type}>
        <ol className="space-y-3">
          {data.blanks.map((b, i) => {
            const [before, ...rest] = b.sentence.split("___")
            const ok = checked && isRight(b, i)
            return (
                <li key={i} className="text-sm leading-8 text-rb-eel">
                  <span className="font-extrabold text-rb-feather-lip">{i + 1}. </span>
                  {before}
                  <input
                      value={values[i] ?? ""}
                      onChange={(e) => { setValues((v) => ({ ...v, [i]: e.target.value })); setChecked(false) }}
                      onKeyDown={(e) => e.key === "Enter" && setChecked(true)}
                      className={`mx-1 w-32 rounded-lg border-2 px-2 py-0.5 text-sm font-bold outline-none ${
                          !checked ? "border-rb-swan focus:border-rb-feather" : ok ? "border-emerald-400 bg-emerald-50" : "border-rose-300 bg-rose-50"}`}
                      aria-label={`Blank ${i + 1}`}
                  />
                  {rest.join("___")}
                  {checked && !ok ? <span className="ml-2 text-xs font-bold text-rose-700">→ {b.answer}</span> : null}
                </li>
            )
          })}
        </ol>
        <div className="mt-3 flex gap-2">
          <SmallButton primary onClick={() => setChecked(true)}>Check answers</SmallButton>
          <SmallButton onClick={() => { setValues({}); setChecked(false) }}><RotateCcw className="size-3.5" /> Clear</SmallButton>
        </div>
        {checked ? <Feedback ok={right === data.blanks.length}>{right} of {data.blanks.length} right.</Feedback> : null}
      </Frame>
  )
}

function TrueFalseWidget({ data }) {
  const [answers, setAnswers] = useState({})
  const total = data.claims.length
  const answered = Object.keys(answers).length
  const right = data.claims.filter((c, i) => answers[i] === c.isTrue).length
  return (
      <Frame kind="Myth or fact" title={data.title} badge={`${answered}/${total}`} icon={Eye}>
        <ol className="space-y-4">
          {data.claims.map((c, i) => (
              <li key={i}>
                <p className="text-sm font-extrabold text-rb-eel">{i + 1}. {c.statement}</p>
                <div className="mt-2 flex gap-2">
                  {[true, false].map((value) => {
                    const picked = answers[i] === value
                    const state = answers[i] == null ? "" : value === c.isTrue ? "right" : picked ? "wrong" : "dim"
                    return (
                        <button key={String(value)} type="button" disabled={answers[i] != null}
                                onClick={() => setAnswers((a) => ({ ...a, [i]: value }))}
                                className={`flex-1 rounded-xl border-2 py-2 text-sm font-extrabold transition ${
                                    state === "right" ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                                        : state === "wrong" ? "border-rose-300 bg-rose-50 text-rose-800"
                                            : state === "dim" ? "border-rb-swan text-rb-hare" : "border-rb-swan text-rb-eel hover:bg-rb-polar"}`}>
                          {value ? "Fact" : "Myth"}
                        </button>
                    )
                  })}
                </div>
                {answers[i] != null ? <Feedback ok={answers[i] === c.isTrue}>{c.explanation}</Feedback> : null}
              </li>
          ))}
        </ol>
        {answered === total ? <Score right={right} total={total} onReset={() => setAnswers({})} /> : null}
      </Frame>
  )
}

/* ---------- explanations ---------- */

function TableWidget({ data }) {
  return (
      <Frame kind="Comparison" icon={BarChart3}>
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-sm">
            <thead>
              <tr>{data.columns.map((c, i) => (
                  <th key={i} className="border-b-2 border-rb-swan px-2.5 py-2 text-left text-xs font-extrabold uppercase tracking-wide text-rb-feather-lip">{c}</th>
              ))}</tr>
            </thead>
            <tbody>
              {data.rows.map((row, r) => (
                  <tr key={r} className="even:bg-rb-polar/50">
                    {row.map((cell, c) => (
                        <td key={c} className={`border-b border-rb-swan px-2.5 py-2 text-rb-eel ${c === 0 ? "font-extrabold" : "font-medium"}`}>{cell}</td>
                    ))}
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.caption ? <p className="mt-2 text-xs font-semibold text-rb-hare">{data.caption}</p> : null}
      </Frame>
  )
}

function CardsWidget({ data }) {
  return (
      <Frame kind="Examples" title={data.title} icon={Building}>
        <div className="divide-y-2 divide-rb-swan">
          {data.cards.map((card, i) => {
            const tone = TONES[i % TONES.length]
            const Icon = CARD_ICONS[card.icon] ?? Sparkles
            return (
                <div key={i} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${tone.wash} ${tone.text}`}><Icon className="size-5" /></span>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-rb-eel">{card.title}</p>
                    {card.detail ? <p className="text-xs font-semibold text-rb-hare">{card.detail}</p> : null}
                    {card.highlight ? <p className={`mt-0.5 text-sm font-extrabold ${tone.text}`}>{card.highlight}</p> : null}
                  </div>
                </div>
            )
          })}
        </div>
      </Frame>
  )
}

function StepsWidget({ data }) {
  const [shown, setShown] = useState(1)
  const all = shown > data.steps.length
  return (
      <Frame kind="Worked example" badge={`step ${Math.min(shown, data.steps.length)}/${data.steps.length}`} icon={ListOrdered}>
        <Md className="mb-3 rounded-xl bg-rb-polar px-3 py-2 font-semibold text-rb-eel">{data.problem}</Md>
        <ol className="relative space-y-3 border-l-2 border-rb-swan pl-5">
          {data.steps.slice(0, shown).map((step, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[31px] grid size-5 place-items-center rounded-full bg-rb-feather text-[10px] font-extrabold text-white">{i + 1}</span>
                <p className="text-sm font-extrabold text-rb-eel">{step.title}</p>
                <Md className="text-rb-eel">{step.detail}</Md>
              </li>
          ))}
        </ol>
        {all && data.answer ? (
            <div className="mt-3 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-extrabold text-emerald-900">Answer: {data.answer}</div>
        ) : null}
        <div className="mt-3 flex gap-2">
          {!all ? (
              <>
                <SmallButton primary onClick={() => setShown((s) => s + 1)}>{shown < data.steps.length ? "Next step" : "Show answer"} <ChevronRight className="size-3.5" /></SmallButton>
                <SmallButton onClick={() => setShown(data.steps.length + 1)}>Show all</SmallButton>
              </>
          ) : <SmallButton onClick={() => setShown(1)}><RotateCcw className="size-3.5" /> Start over</SmallButton>}
        </div>
      </Frame>
  )
}

function CodeWidget({ data }) {
  const [copied, setCopied] = useState(false)
  const copy = () => navigator.clipboard?.writeText(data.code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
  return (
      <section className="my-3 w-full overflow-hidden rounded-2xl border-2 border-rb-swan bg-white">
        <header className="flex items-center gap-2 border-b-2 border-rb-swan bg-rb-polar/60 px-4 py-2">
          <Code2 className="size-4 text-rb-feather" />
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-rb-feather-lip">{data.language}</span>
          <button type="button" onClick={copy} className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-rb-hare hover:bg-white">
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy"}
          </button>
        </header>
        <div className="overflow-x-auto">
          <SyntaxHighlighter language={data.language} useInlineStyles={false} PreTag="pre" CodeTag="code"
                             className="rb-code-sample !m-0 !rounded-none" showLineNumbers={data.code.split("\n").length > 4}>
            {data.code}
          </SyntaxHighlighter>
        </div>
        {data.caption ? <p className="border-t-2 border-rb-swan px-4 py-2 text-xs font-semibold text-rb-hare">{data.caption}</p> : null}
      </section>
  )
}

function TeX({ latex }) {
  const html = useMemo(() => katex.renderToString(latex, { displayMode: true, throwOnError: false, strict: "ignore", trust: false }), [latex])
  return <div className="overflow-x-auto py-1" dangerouslySetInnerHTML={{ __html: html }} />
}

function MathWidget({ data }) {
  return (
      <Frame kind="Math" title={data.title} icon={Sparkles}>
        <div className="space-y-1">
          {data.steps.map((step, i) => (
              <div key={i} className="flex flex-col gap-0.5 border-b border-dashed border-rb-swan pb-1 last:border-0">
                <TeX latex={step.latex} />
                {step.note ? <p className="text-center text-xs font-semibold text-rb-hare">{step.note}</p> : null}
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
      <Frame kind="Diagram" title={data.title} icon={Network}>
        {failed ? (
            <pre className="overflow-x-auto rounded-xl bg-rb-polar p-3 text-xs text-rb-eel">{data.mermaid}</pre>
        ) : svg ? (
            <div className="flex justify-center overflow-x-auto [&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />
        ) : (
            <div className="h-32 animate-pulse rounded-xl bg-rb-polar" />
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
  const [scope, setScope] = useState(() => Object.fromEntries(data.variables.map((v) => [v.name, v.value])))
  return (
      <Frame kind="Explorer" title={data.title} icon={Zap}>
        <div className="space-y-3">
          {data.variables.map((v) => (
              <label key={v.name} className="block">
                <span className="flex items-center justify-between text-xs font-extrabold text-rb-eel">
                  {v.label}
                  <span className="rounded-lg bg-rb-feather px-2 py-0.5 text-white">{scope[v.name]}</span>
                </span>
                <input type="range" min={v.min} max={v.max} step={v.step} value={scope[v.name]}
                       onChange={(e) => setScope((s) => ({ ...s, [v.name]: Number(e.target.value) }))}
                       className="mt-1 w-full accent-[var(--rb-feather,#58a700)]" />
              </label>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {data.outputs.map((o, i) => {
            let value
            try { value = evaluate(o.formula, scope) } catch { value = NaN }
            const tone = TONES[i % TONES.length]
            return (
                <div key={i} className={`rounded-xl border-2 ${tone.ring} ${tone.wash} px-3 py-2`}>
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-rb-hare">{o.label}</p>
                  <p className={`break-all text-lg font-extrabold ${tone.text}`}>{formatValue(value, o.format)}</p>
                </div>
            )
          })}
        </div>
        {data.note ? <p className="mt-3 text-xs font-semibold text-rb-hare">💡 {data.note}</p> : null}
      </Frame>
  )
}

export function MindMapWidget({ data }) {
  return <MindMap data={data} header={data.standalone ? null : <SavedChip library={data.library} />} />
}

const WIDGETS = {
  quiz: QuizWidget, flashcards: FlashcardsWidget, matching: MatchingWidget, ordering: OrderingWidget,
  fill_blank: FillBlankWidget, true_false: TrueFalseWidget, table: TableWidget, cards: CardsWidget,
  steps: StepsWidget, code: CodeWidget, math: MathWidget, diagram: DiagramWidget,
  explorer: ExplorerWidget, mindmap: MindMapWidget,
}

export function TutorWidget({ widget }) {
  const Widget = WIDGETS[widget?.type]
  if (!Widget) return null
  return <Widget data={widget} />
}

export function TutorWidgets({ widgets }) {
  const ref = useRef(null)
  if (!widgets?.length) return null
  return (
      <div ref={ref} className="w-full">
        {widgets.map((widget, i) => <TutorWidget key={i} widget={widget} />)}
      </div>
  )
}
