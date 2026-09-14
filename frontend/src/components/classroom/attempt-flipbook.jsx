import { useLayoutEffect, useRef, useState } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

import { ArrowLeft, ArrowRight } from "@/components/icons"

gsap.registerPlugin(useGSAP)

/**
 * An open spiral notebook on a desk, one page per attempt, turned by hand.
 *
 * The spread shows the previous attempt on the left page and the current one on
 * the right, with the spiral binding between them. Turning forward, a hand takes
 * the right-hand sheet by its corner and turns it over the spiral: the sheet
 * curls slightly as it goes, the next attempt is revealed underneath, and the
 * turned sheet lands on the left. Turning back runs the same motion the other
 * way. Divider tabs jump straight to any attempt; the arrow keys turn pages
 * while the book has focus. Below `md` there is one page and the sheet turns
 * away off it.
 *
 * pages: [{ key, tab, tone: "pass" | "fail" | "open", label, content }]
 */

const TURN_S = 0.95

function HandSvg() {
  return (
    <svg viewBox="0 0 130 190" aria-hidden="true">
      {/* sleeve and forearm, coming up from below the book */}
      <path d="M40 190 L52 120 L96 120 L108 190 Z" fill="#2f6b4f" />
      <path d="M52 124 L96 124 L94 116 L54 116 Z" fill="#245440" />
      {/* palm and fingers, pinching the page corner */}
      <path
        d="M50 122 C40 96 44 70 60 58 C66 40 78 30 88 36 C96 42 94 56 90 66 C104 70 110 86 104 104 C100 118 92 124 90 124 Z"
        fill="#f1c29b"
        stroke="#c9906a"
        strokeWidth="2"
      />
      <path d="M62 60 C62 44 70 32 78 32" fill="none" stroke="#c9906a" strokeWidth="2" strokeLinecap="round" />
      <path d="M72 84 C80 80 90 80 98 86" fill="none" stroke="#c9906a" strokeWidth="2" strokeLinecap="round" />
      <path d="M68 98 C78 94 90 94 100 100" fill="none" stroke="#c9906a" strokeWidth="2" strokeLinecap="round" />
      {/* thumb over the front of the sheet */}
      <path
        d="M58 70 C46 64 34 66 30 76 C27 84 36 90 48 88 C54 87 58 82 60 78"
        fill="#eab48b"
        stroke="#c9906a"
        strokeWidth="2"
      />
    </svg>
  )
}

export function AttemptFlipbook({
  pages,
  initialIndex = 0,
  coverTitle = "attempt history",
  coverNote = "Every attempt gets its own page. Turn the pages to compare them.",
}) {
  const clamp = (value) => Math.min(Math.max(value, 0), Math.max(pages.length - 1, 0))
  const [index, setIndex] = useState(() => clamp(initialIndex))
  const [turn, setTurn] = useState(null) // { dir: 1 | -1, to }
  const scope = useRef(null)
  const leafRef = useRef(null)
  const { contextSafe } = useGSAP({ scope })

  const reduced = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

  function go(target) {
    if (turn || target === index || target < 0 || target >= pages.length) return
    if (reduced()) {
      setIndex(target)
      return
    }
    setTurn({ dir: target > index ? 1 : -1, to: target })
  }

  const play = contextSafe((current) => {
    const forward = current.dir > 0
    gsap
      .timeline({
        onComplete: () => {
          setIndex(current.to)
          setTurn(null)
        },
      })
      .fromTo(
        leafRef.current,
        { rotateY: forward ? 0 : -180 },
        { rotateY: forward ? -180 : 0, duration: TURN_S, ease: "power2.inOut" },
      )
      // The curl: the sheet bends a little on its way over, then flattens.
      .fromTo(
        leafRef.current,
        { skewY: 0 },
        { skewY: forward ? -4 : 4, duration: TURN_S / 2, yoyo: true, repeat: 1, ease: "sine.inOut" },
        0,
      )
      .fromTo(
        ".rb-flip-hand",
        { autoAlpha: 0, y: 40 },
        { autoAlpha: 1, y: 0, duration: 0.22, ease: "power2.out" },
        0,
      )
      .to(".rb-flip-hand", { autoAlpha: 0, y: -20, duration: 0.25, ease: "power1.in" }, TURN_S - 0.28)
      .fromTo(
        ".rb-flip-shade",
        { opacity: 0 },
        { opacity: 1, duration: TURN_S / 2, yoyo: true, repeat: 1, ease: "sine.inOut" },
        0,
      )
  })

  useLayoutEffect(() => {
    if (turn) play(turn)
  }, [turn]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!pages.length) return null

  const forward = turn?.dir > 0
  const leftIdx = turn ? (forward ? index - 1 : turn.to - 1) : index - 1
  const rightIdx = turn ? (forward ? turn.to : index) : index
  const leafFront = turn ? (forward ? index : turn.to) : null
  const leafBack = turn ? (forward ? turn.to - 1 : index - 1) : null
  const shown = pages[turn ? turn.to : index]

  const renderPage = (i, side) => (
    <div className={`rb-flip-page rb-flip-page-${side}`}>
      {i < 0 ? (
        <div className="rb-flip-cover">
          <p className="rb-graded-heading">{coverTitle}</p>
          <p className="rb-pen mt-3 text-xl text-[#6b706c]">{coverNote}</p>
        </div>
      ) : (
        <div key={pages[i].key}>{pages[i].content}</div>
      )}
    </div>
  )

  function onKeyDown(event) {
    if (event.key === "ArrowRight") {
      event.preventDefault()
      go(index + 1)
    } else if (event.key === "ArrowLeft") {
      event.preventDefault()
      go(index - 1)
    }
  }

  return (
    <div ref={scope} className="rb-flipbook">
      <div className="rb-flipbook-tabs" role="tablist" aria-label="Attempts">
        {pages.map((item, i) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={i === (turn ? turn.to : index)}
            aria-label={item.label}
            data-tone={item.tone}
            className="rb-flipbook-tab"
            onClick={() => go(i)}
          >
            {item.tab}
          </button>
        ))}
      </div>

      <div
        className="rb-flipbook-book"
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-roledescription="notebook"
        aria-label={`${shown.label}, page ${(turn ? turn.to : index) + 1} of ${pages.length}`}
      >
        <div className="rb-flipbook-spread">
          {renderPage(leftIdx, "left")}
          {renderPage(rightIdx, "right")}

          {turn ? (
            <div ref={leafRef} className="rb-flip-leaf" aria-hidden="true">
              <div className="rb-flip-face rb-flip-face-front">
                {renderPage(leafFront, "right")}
                <span className="rb-flip-shade" />
                <span className="rb-flip-hand">
                  <HandSvg />
                </span>
              </div>
              <div className="rb-flip-face rb-flip-face-back">
                {renderPage(leafBack, "left")}
                <span className="rb-flip-shade" />
                <span className="rb-flip-hand">
                  <HandSvg />
                </span>
              </div>
            </div>
          ) : null}

          <span className="rb-flipbook-spiral" aria-hidden="true" />
        </div>
      </div>

      <div className="rb-flipbook-nav">
        <button type="button" className="rb-flipbook-turn" onClick={() => go(index - 1)} disabled={index === 0}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          previous attempt
        </button>
        <p className="rb-flipbook-folio" aria-live="polite">
          page {(turn ? turn.to : index) + 1} of {pages.length}
        </p>
        <button
          type="button"
          className="rb-flipbook-turn"
          onClick={() => go(index + 1)}
          disabled={index === pages.length - 1}
        >
          next attempt
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
