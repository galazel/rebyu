import { useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP, ScrollTrigger)

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
