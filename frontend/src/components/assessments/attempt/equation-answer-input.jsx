import { useId, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MathLines, withInlineMath } from "@/components/certifications/math.jsx"
import {
  decodeProblemSolvingAnswer,
  encodeProblemSolvingAnswer,
} from "@/lib/problem-solving-answer.js"

// Maths goes between \( and \), the same notation the lesson text uses, so what
// a learner types here is typeset by exactly the same renderer that shows them
// the formula in the lesson. Each button inserts a snippet and leaves the
// cursor where the next thing is typed; `select` is how far back to pull the
// caret so it lands inside the braces.
const PALETTE = [
  { label: "Equation", insert: "\\( \\)", select: 2, title: "Wrap maths: \\( ... \\)" },
  { label: "a\u2044b", insert: "\\frac{}{}", select: 3, title: "Fraction" },
  { label: "\u221a", insert: "\\sqrt{}", select: 1, title: "Square root" },
  { label: "x\u00b2", insert: "^{}", select: 1, title: "Power" },
  { label: "x\u2081", insert: "_{}", select: 1, title: "Subscript" },
  { label: "\u00d7", insert: "\\times ", select: 0, title: "Times" },
  { label: "\u00f7", insert: "\\div ", select: 0, title: "Divide" },
  { label: "\u00b1", insert: "\\pm ", select: 0, title: "Plus or minus" },
  { label: "\u2264", insert: "\\le ", select: 0, title: "Less than or equal to" },
  { label: "\u2265", insert: "\\ge ", select: 0, title: "Greater than or equal to" },
  { label: "\u2248", insert: "\\approx ", select: 0, title: "Approximately" },
  { label: "\u03c0", insert: "\\pi ", select: 0, title: "Pi" },
  { label: "\u03b8", insert: "\\theta ", select: 0, title: "Theta" },
  { label: "\u0394", insert: "\\Delta ", select: 0, title: "Delta" },
  // \ufe0e asks for a glyph's text rendering. Without it the sum and integral
  // signs fall through to an emoji font and arrive in colour.
  { label: "\u2211\ufe0e", insert: "\\sum_{}^{}", select: 3, title: "Sum" },
  { label: "\u222b\ufe0e", insert: "\\int_{}^{}", select: 3, title: "Integral" },
  { label: "Unit", insert: "\\pu{}", select: 1, title: "A quantity with a unit, e.g. 9.81 m/s^2" },
  { label: "Reaction", insert: "\\ce{}", select: 1, title: "A chemical formula or equation" },
  { label: "Words", insert: "\\text{}", select: 1, title: "Ordinary words inside an equation" },
]

/**
 * The answer box for a PROBLEM_SOLVING question: the working, then the final
 * answer, with both typeset as the learner writes.
 *
 * The preview is not decoration. Without it a learner cannot tell whether
 * \frac{1}{2} came out as a fraction or as the literal characters, and would
 * only find out after submitting -- by which time the mark is made.
 */
export function EquationAnswerInput({ value, onChange, disabled = false }) {
  const workingId = useId()
  const finalId = useId()
  const workingRef = useRef(null)
  const { working, finalAnswer } = decodeProblemSolvingAnswer(value)

  function emit(next) {
    onChange(encodeProblemSolvingAnswer({ working, finalAnswer, ...next }))
  }

  function insert({ insert: snippet, select }) {
    const field = workingRef.current
    if (!field) return

    const { selectionStart, selectionEnd, value: text } = field

    // \sqrt{} outside an equation is five literal characters, which is not what
    // anyone pressing a square-root button meant. If the caret is not already
    // inside \( ... \), the snippet brings its own.
    const before = text.slice(0, selectionStart)
    const inEquation = before.lastIndexOf("\\(") > before.lastIndexOf("\\)")
    const opensItsOwn = snippet.includes("\\(")
    const wrapped = inEquation || opensItsOwn ? snippet : `\\(${snippet}\\)`
    const tail = inEquation || opensItsOwn ? select : select + 2

    const next = before + wrapped + text.slice(selectionEnd)
    const caret = selectionStart + wrapped.length - tail

    emit({ working: next })
    requestAnimationFrame(() => {
      field.focus()
      field.selectionStart = field.selectionEnd = caret
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={workingId}>Your working</Label>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Insert a symbol">
          {PALETTE.map((entry) => (
            <button
              key={entry.label}
              type="button"
              title={entry.title}
              aria-label={entry.title}
              disabled={disabled}
              onClick={() => insert(entry)}
              className="rounded-lg border border-[var(--tg-line)] bg-card px-2.5 py-1 font-mono text-[13px] text-foreground transition hover:border-[var(--tg)] hover:bg-[var(--tg-softer)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tg)] disabled:pointer-events-none disabled:opacity-50"
            >
              {entry.label}
            </button>
          ))}
        </div>

        <Textarea
          id={workingId}
          ref={workingRef}
          value={working}
          disabled={disabled}
          spellCheck={false}
          onChange={(event) => emit({ working: event.target.value })}
          placeholder={"One step per line. Put maths between \\( and \\):\n\\(V = I \\times R\\)\n\\(V = \\pu{3 A} \\times \\pu{4 \\Omega} = \\pu{12 V}\\)"}
          className="min-h-40 resize-y font-mono text-[13px] leading-6"
        />

        <div
          className="rounded-xl border border-[var(--tg-line)] bg-[var(--tg-softer)] px-3.5 py-3"
          aria-live="polite"
          aria-label="How your working will be read"
        >
          <p className="tg-kicker !text-[11px] mb-1.5">As it will be read</p>
          <MathLines text={working} placeholder="Your working appears here, typeset." />
        </div>
      </div>

      <div className="space-y-2 border-t border-[var(--tg-line)] pt-4">
        <Label htmlFor={finalId}>Final answer</Label>
        <Input
          id={finalId}
          value={finalAnswer}
          disabled={disabled}
          spellCheck={false}
          onChange={(event) => emit({ finalAnswer: event.target.value })}
          placeholder="\\(\\pu{12 V}\\)"
          className="font-mono text-[13px]"
        />
        <div
          className="rounded-xl border border-[var(--tg-line)] bg-card px-3.5 py-2.5"
          aria-live="polite"
          aria-label="How your final answer will be read"
        >
          <MathLines text={finalAnswer} placeholder="State the answer, with its unit." />
        </div>
      </div>
    </div>
  )
}

/** The read-only counterpart, for a submitted answer on the result page. */
export function ProblemSolvingAnswerView({ value, className = "" }) {
  const { working, finalAnswer } = decodeProblemSolvingAnswer(value)
  if (!working && !finalAnswer) return null

  return (
    <div className={`space-y-2.5 ${className}`}>
      {working ? <MathLines text={working} /> : null}
      {finalAnswer ? (
        <p className="rounded-xl bg-[var(--tg-softer)] px-3 py-2 text-[15px] leading-7 text-[var(--tg-ink)]">
          <span className="font-bold">Final answer: </span>
          {withInlineMath(finalAnswer)}
        </p>
      ) : null}
    </div>
  )
}
