import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP)

/**
 * The teacher's rubber stamp on a marked page: green "passed" or red "try
 * again". It comes down onto the sheet a moment after the page opens, the way
 * the stamp lands at the end of the graded notebook on the landing page, and
 * sits in the sheet's top-right corner.
 *
 * Decorative: the pass/fail state is always also written as text on the page,
 * so the stamp carries an accessible name but no information of its own.
 */
export function TeacherStamp({ passed, className = "" }) {
  const ref = useRef(null)

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      gsap.fromTo(
        ref.current,
        { scale: 2.6, autoAlpha: 0, rotation: -34 },
        { scale: 1, autoAlpha: 1, rotation: -10, duration: 0.32, delay: 0.55, ease: "power4.in" },
      )
    },
    { scope: ref },
  )

  return (
    <div
      ref={ref}
      className={`rb-nb-stamp rb-teacher-stamp ${className}`}
      data-tone={passed ? "pass" : "fail"}
      role="img"
      aria-label={passed ? "Stamped: passed" : "Stamped: try again"}
    >
      <span className="rb-nb-stamp-top">rebyu · checked</span>
      <span className="rb-nb-stamp-main">{passed ? "passed" : "try again"}</span>
      <span className="rb-nb-stamp-bottom">{passed ? "★ well done ★" : "★ keep going ★"}</span>
    </div>
  )
}
