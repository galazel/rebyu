import { useMemo } from "react"
import katex from "katex"
import "katex/dist/katex.min.css"
// mhchem teaches KaTeX the notation the sciences actually use: \ce{} for
// chemical equations and \pu{} for physical units. Without it a chemistry or
// physics lesson has to spell out "2H2 + O2 -> 2H2O" as flat text, with the
// subscripts and the arrow typed as punctuation.
import "katex/dist/contrib/mhchem.mjs"

// Inline math is delimited \( ... \), never $ ... $. Lessons are full of prices
// -- "$0.12/kWh", "$2,800 profit" -- and a dollar delimiter turns every pair of
// them into an equation made of the prose between them.
const INLINE_MATH = /\\\((.+?)\\\)/gs

const KATEX_OPTIONS = {
  throwOnError: true,
  strict: "ignore",
  trust: false,
  // Chemistry and matrices get tall; without this they are clipped rather than
  // given the line height they need.
  output: "htmlAndMathml",
}

/** Typesets `latex`, or returns null when it is not valid TeX. */
export function renderMath(latex, displayMode) {
  const source = String(latex ?? "").trim()
  if (!source) return { html: null, error: null }
  try {
    return { html: katex.renderToString(source, { ...KATEX_OPTIONS, displayMode }), error: null }
  } catch (error) {
    return { html: null, error: error?.message ?? "This is not valid LaTeX." }
  }
}

/**
 * One expression. When it will not typeset, the author's own text is shown as
 * written -- a formula nobody can read is worse than a plainly printed one, and
 * far worse than KaTeX's red error string in the middle of a lesson.
 */
export function MathExpression({ latex, display = true, className = "" }) {
  const { html } = useMemo(() => renderMath(latex, display), [latex, display])
  const source = String(latex ?? "").trim()
  if (!source) return null

  if (!html) {
    return (
        <span className={`font-mono ${display ? "block text-center" : ""} ${className}`}>
          {source}
        </span>
    )
  }

  const Tag = display ? "div" : "span"
  return (
      <Tag
          className={`rb-math ${display ? "overflow-x-auto py-1 text-center" : "inline-block align-middle"} ${className}`}
          dangerouslySetInnerHTML={{ __html: html }}
      />
  )
}

/**
 * Splits a run of prose on \( ... \) and typesets the parts inside. Prose with
 * no delimiters comes back untouched, so this is safe to use everywhere text is
 * rendered.
 */
export function withInlineMath(text) {
  const body = String(text ?? "")
  if (!body.includes("\\(")) return body

  const parts = []
  let last = 0
  INLINE_MATH.lastIndex = 0

  for (let match = INLINE_MATH.exec(body); match; match = INLINE_MATH.exec(body)) {
    if (match.index > last) parts.push(body.slice(last, match.index))
    parts.push(
        <MathExpression key={`${match.index}-${match[1]}`} latex={match[1]} display={false} />
    )
    last = match.index + match[0].length
  }

  if (last < body.length) parts.push(body.slice(last))
  return parts
}

/**
 * A block of text, line by line, with the maths in it typeset. Used wherever
 * someone needs to see how what they typed will be read -- a learner writing
 * their working, an author writing the solution it is marked against.
 */
export function MathLines({ text, placeholder = null, className = "" }) {
  const lines = String(text ?? "")
      .split("\n")
      .filter((line) => line.trim())

  if (lines.length === 0) {
    return placeholder ? <p className="text-sm text-muted-foreground">{placeholder}</p> : null
  }

  return (
      <div className={`space-y-1.5 ${className}`}>
        {lines.map((line, index) => (
            <p key={`${index}-${line}`} className="text-[15px] leading-7 text-foreground">
              {withInlineMath(line)}
            </p>
        ))}
      </div>
  )
}

export function hasInlineMath(text) {
  return String(text ?? "").includes("\\(")
}
