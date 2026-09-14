import { useId, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP, ScrollTrigger)

/**
 * The IT Olympics trophy: a gold cup on a wooden base with a plaque. It rises
 * into place when scrolled to, then floats gently while a shine sweeps across
 * the cup and a few sparkles twinkle around it. Ornament only.
 */
export function BigTrophy({ className = "", label = "IT OLYMPICS" }) {
  const scope = useRef(null)
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const gold = `rb-trophy-gold-${uid}`
  const goldDark = `rb-trophy-gold-dark-${uid}`
  const cup = `rb-trophy-cup-${uid}`

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      gsap.from(scope.current, {
        y: 60,
        scale: 0.85,
        autoAlpha: 0,
        duration: 0.9,
        ease: "back.out(1.4)",
        scrollTrigger: { trigger: scope.current, start: "top 85%", once: true },
      })
      gsap.to(".rb-trophy-body", { y: -8, duration: 2.4, yoyo: true, repeat: -1, ease: "sine.inOut" })
      gsap.fromTo(
        ".rb-trophy-shine",
        { attr: { x: -90 } },
        { attr: { x: 280 }, duration: 1.4, ease: "power2.inOut", repeat: -1, repeatDelay: 2.2 },
      )
      gsap.to(".rb-trophy-sparkle", {
        scale: 0.35,
        autoAlpha: 0.25,
        duration: 0.9,
        ease: "sine.inOut",
        stagger: { each: 0.3, repeat: -1, yoyo: true },
      })
    },
    { scope },
  )

  return (
    <div ref={scope} className={`rb-trophy ${className}`} aria-hidden="true">
      <span className="rb-trophy-sparkle" style={{ top: "6%", left: "8%" }} />
      <span className="rb-trophy-sparkle" style={{ top: "18%", right: "4%" }} />
      <span className="rb-trophy-sparkle" style={{ top: "48%", left: "0%" }} />
      <span className="rb-trophy-sparkle" style={{ top: "40%", right: "-2%" }} />

      <svg viewBox="0 0 240 300" className="rb-trophy-svg">
        <defs>
          <linearGradient id={gold} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#d08e1c" />
            <stop offset="0.35" stopColor="#ffe38a" />
            <stop offset="0.65" stopColor="#f2b83a" />
            <stop offset="1" stopColor="#c07f14" />
          </linearGradient>
          <linearGradient id={goldDark} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#b3760f" />
            <stop offset="0.5" stopColor="#f0c14f" />
            <stop offset="1" stopColor="#a96d0c" />
          </linearGradient>
          <clipPath id={cup}>
            <path d="M60 40 H180 V90 C180 150 150 180 120 182 C90 180 60 150 60 90 Z" />
          </clipPath>
        </defs>

        <g className="rb-trophy-body">
          <path d="M64 62 C18 62 16 142 82 150" fill="none" stroke={`url(#${goldDark})`} strokeWidth="13" strokeLinecap="round" />
          <path d="M176 62 C222 62 224 142 158 150" fill="none" stroke={`url(#${goldDark})`} strokeWidth="13" strokeLinecap="round" />
          <path d="M60 40 H180 V90 C180 150 150 180 120 182 C90 180 60 150 60 90 Z" fill={`url(#${gold})`} />
          <g clipPath={`url(#${cup})`}>
            <g transform="skewX(-20)">
              <rect className="rb-trophy-shine" x="-90" y="20" width="34" height="200" fill="#fff" opacity="0.5" />
            </g>
          </g>
          <rect x="54" y="30" width="132" height="16" rx="8" fill="#f6cf5c" />
          <polygon
            points="120,76 128,96 150,97 133,110 139,131 120,119 101,131 107,110 90,97 112,96"
            fill="#fff6c8"
            opacity="0.92"
          />
          <path d="M108 180 H132 L140 222 H100 Z" fill={`url(#${goldDark})`} />
          <rect x="88" y="216" width="64" height="12" rx="6" fill="#d9a531" />
        </g>

        <rect x="62" y="228" width="116" height="10" rx="5" fill="#b07a4a" />
        <rect x="68" y="236" width="104" height="48" rx="6" fill="#8a5a33" />
        <rect x="76" y="248" width="88" height="22" rx="3" fill="#e9c46a" />
        <text
          x="120"
          y="263"
          textAnchor="middle"
          fontSize="8"
          fontWeight="800"
          letterSpacing="0.6"
          fill="#5a3d10"
          fontFamily="Nunito Sans, sans-serif"
        >
          {label}
        </text>
      </svg>
    </div>
  )
}
