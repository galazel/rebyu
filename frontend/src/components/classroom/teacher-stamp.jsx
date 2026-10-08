import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP)

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
