/**
 * The teacher's pen strokes, shared by everything drawn as "marked": the graded
 * notebook on the landing page and the result and attempt-history pages.
 *
 * Each stroke has `pathLength="1"` and the `rb-pen-stroke` class, so GSAP can
 * draw it in by animating `strokeDashoffset` from 1 to 0. The colour comes from
 * the `--rb-pen` custom property on any ancestor (red by default, green for a
 * pass).
 */

const PATHS = {
  check: ["M6 17 L13 24 L27 7"],
  cross: ["M8 8 L24 24", "M24 8 L8 24"],
  tilde: ["M5 18 C10 9 14 9 16 16 S22 23 27 13"],
  question: ["M11 11 C11 4 22 4 22 11 C22 16 16 16 16 21", "M16 26 L16 26.6"],
}

export function PenMark({ kind = "check", className = "" }) {
  return (
    <svg viewBox="0 0 32 32" className={`rb-pen-mark ${className}`} aria-hidden="true">
      {(PATHS[kind] ?? PATHS.check).map((d) => (
        <path key={d} d={d} pathLength="1" className="rb-pen-stroke" />
      ))}
    </svg>
  )
}

export function PenCircle({ className = "" }) {
  return (
    <svg viewBox="0 0 100 60" preserveAspectRatio="none" className={`rb-pen-circle ${className}`} aria-hidden="true">
      <path
        d="M12 32 C10 14 40 6 62 8 C84 10 94 22 90 36 C86 50 58 56 36 52 C16 48 6 38 14 24 C20 16 30 12 40 11"
        pathLength="1"
        className="rb-pen-stroke"
      />
    </svg>
  )
}

export function PenUnderline({ className = "" }) {
  return (
    <svg viewBox="0 0 200 12" preserveAspectRatio="none" className={`rb-pen-underline ${className}`} aria-hidden="true">
      <path d="M2 8 C30 2 50 12 80 6 S140 2 198 7" pathLength="1" className="rb-pen-stroke" />
    </svg>
  )
}
