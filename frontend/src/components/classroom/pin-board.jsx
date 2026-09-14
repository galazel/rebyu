import { useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP, ScrollTrigger)

/**
 * A cork bulletin board. Its `.rb-sticky` children drop onto it and swing into
 * their resting tilt, then the pushpins go in, when the board scrolls into
 * view. The resting tilt is CSS (`rotate`), so GSAP only animates the drop on
 * top of it and hover can still straighten a note.
 */
export function PinBoard({ className = "", children }) {
  const scope = useRef(null)

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      const trigger = { trigger: scope.current, start: "top 75%", once: true }
      gsap
        .timeline({ scrollTrigger: trigger })
        .from(".rb-sticky", {
          y: -70,
          autoAlpha: 0,
          rotation: (i) => (i % 2 ? 10 : -10),
          duration: 0.75,
          stagger: 0.2,
          ease: "back.out(1.5)",
        })
        .from(
          ".rb-pushpin",
          { y: -36, scale: 1.4, autoAlpha: 0, duration: 0.3, stagger: 0.2, ease: "power3.in" },
          "-=0.45",
        )
    },
    { scope },
  )

  return (
    <div ref={scope} className={`rb-corkboard ${className}`}>
      {children}
    </div>
  )
}
