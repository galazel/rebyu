import { useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"

import { PenCircle, PenMark, PenUnderline } from "@/components/classroom/pen-marks.jsx"

gsap.registerPlugin(useGSAP, ScrollTrigger)

/**
 * Mastery shown as an open spiral notebook the teacher has just marked.
 *
 * Left page: every scored topic written on the ruled lines, weakest first, with
 * a highlighter bar for its mastery, the score circled in red pen, a tick or a
 * cross, and a short remark. Right page: the teacher's notes -- the topic to
 * study first, exam readiness, and whatever is taped in (`children`).
 *
 * When the notebook scrolls into view GSAP fills the highlighter bars and draws
 * the red-pen strokes in, and finally the teacher's "checked" stamp comes down on
 * the page. Every value is also plain text, so nothing depends on the ink.
 */

const MARKS = {
  CRITICAL_PRIORITY: { kind: "cross", remark: "see me!", label: "Critical priority" },
  HIGH_PRIORITY: { kind: "cross", remark: "review this", label: "High priority" },
  MEDIUM_PRIORITY: { kind: "tilde", remark: "getting there", label: "Medium priority" },
  NOT_ENOUGH_DATA: { kind: "question", remark: "answer more", label: "Not enough answers yet" },
  STRONG: { kind: "check", remark: "great work", label: "Strong" },
}

export function GradedNotebook({ topics, notAssessed = 0, readiness, tone, children }) {
  const scope = useRef(null)
  const focus = topics[0]

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      const tl = gsap.timeline({
        scrollTrigger: { trigger: scope.current, start: "top 70%", once: true },
      })
      tl.from(".rb-nb-bar-fill", {
        scaleX: 0,
        transformOrigin: "left center",
        duration: 0.8,
        stagger: 0.08,
        ease: "power2.out",
      })
        .fromTo(
          ".rb-pen-stroke",
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 0.3, stagger: 0.05, ease: "none" },
          "-=0.5",
        )
        .from(
          ".rb-pen-note",
          { autoAlpha: 0, scale: 0.7, rotation: -10, duration: 0.3, stagger: 0.07, ease: "back.out(2)" },
          "-=1.2",
        )
        // Last, the teacher's hand brings the stamp down: it presses, the mark
        // is left on the page and the notebook takes the knock, then the hand
        // lifts away.
        .set(".rb-nb-stamp", { autoAlpha: 0 }, 0)
        .fromTo(
          ".rb-nb-stamper",
          { autoAlpha: 0, x: 90, y: -300, rotation: 8 },
          { autoAlpha: 1, x: 0, y: 0, rotation: -12, duration: 0.6, ease: "power2.in" },
          "+=0.3",
        )
        .to(".rb-nb-stamper", { scaleY: 0.93, duration: 0.09, yoyo: true, repeat: 1, ease: "power1.out" })
        .fromTo(
          ".rb-nb-stamp",
          { autoAlpha: 0, scale: 1.06, rotation: -12 },
          { autoAlpha: 1, scale: 1, rotation: -12, duration: 0.12 },
          "<",
        )
        .to(".rb-nb-pages", { y: 4, duration: 0.07, yoyo: true, repeat: 1, ease: "power1.inOut" }, "<")
        .to(
          ".rb-nb-stamper",
          { autoAlpha: 0, x: 110, y: -320, rotation: 10, duration: 0.65, ease: "power2.out" },
          "+=0.35",
        )
    },
    { scope },
  )

  return (
    <div ref={scope} className="rb-nb">
      <div className="rb-nb-pages">
        <div className="rb-nb-page rb-nb-left">
          <p className="rb-nb-head">mastery by topic</p>
          <p className="rb-nb-sub">Weakest first — every topic with enough answers behind it to score.</p>

          <ol className="rb-nb-topics">
            {topics.map((topic) => {
              const mark = MARKS[topic.priorityTag] ?? MARKS.MEDIUM_PRIORITY
              return (
                <li key={topic.name} className="rb-nb-topic">
                  <div className="rb-nb-topic-main">
                    <span className="rb-nb-topic-name">{topic.name}</span>
                    <span className="rb-nb-topic-meta">
                      {topic.domain} · {topic.answers} answers
                    </span>
                  </div>

                  <div className="rb-nb-row2">
                    <span className="rb-nb-bar" data-tone={tone(topic.mastery)}>
                      <span className="rb-nb-bar-fill" style={{ width: `${topic.mastery}%` }} />
                    </span>
                    <span className="rb-pen rb-pen-note rb-nb-remark" aria-hidden="true">
                      {mark.remark}
                    </span>
                  </div>

                  <span className="rb-nb-score">
                    <PenCircle />
                    <span>{topic.mastery}%</span>
                  </span>

                  <span className="rb-nb-mark">
                    <PenMark kind={mark.kind} />
                    <span className="sr-only">{mark.label}</span>
                  </span>
                </li>
              )
            })}
          </ol>

          {notAssessed ? (
            <p className="rb-pen rb-pen-note rb-nb-footnote">
              + {notAssessed} topics not graded yet — no answers behind them
            </p>
          ) : null}

          <div className="rb-nb-stamp" role="img" aria-label="Stamped: checked by the teacher">
            <span className="rb-nb-stamp-top">rebyu · graded</span>
            <span className="rb-nb-stamp-main">checked</span>
            <span className="rb-nb-stamp-bottom">★ keep going ★</span>
          </div>

          {/* The teacher's hand holding the rubber stamp; only seen while GSAP plays it. */}
          <div className="rb-nb-stamper" aria-hidden="true">
            <svg viewBox="0 0 170 290">
              <rect x="58" y="-10" width="54" height="84" fill="#2f6b4f" />
              <rect x="58" y="62" width="54" height="10" fill="#245440" />
              <rect x="64" y="70" width="42" height="30" fill="#f1c29b" />
              <circle cx="85" cy="150" r="28" fill="#b07a4a" />
              <rect x="70" y="150" width="30" height="80" fill="#8a5a33" />
              <rect x="22" y="222" width="126" height="34" rx="6" fill="#a8743f" />
              <rect x="16" y="252" width="138" height="22" rx="4" fill="#7d1d17" />
              <rect x="20" y="272" width="130" height="6" rx="3" fill="#c8342b" />
              <path
                d="M44 118 C44 92 64 86 85 86 C110 86 128 94 128 120 L128 170 C128 184 118 192 104 192 L64 192 C52 192 44 184 44 172 Z"
                fill="#f1c29b"
                stroke="#c9906a"
                strokeWidth="2"
              />
              <path d="M48 140 C66 134 104 134 124 140" fill="none" stroke="#c9906a" strokeWidth="2" strokeLinecap="round" />
              <path d="M48 160 C66 154 104 154 124 160" fill="none" stroke="#c9906a" strokeWidth="2" strokeLinecap="round" />
              <path d="M50 178 C66 173 104 173 122 178" fill="none" stroke="#c9906a" strokeWidth="2" strokeLinecap="round" />
              <path
                d="M44 124 C30 128 26 146 36 156 C44 164 58 160 62 150"
                fill="#eab48b"
                stroke="#c9906a"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>

        <span className="rb-nb-spiral" aria-hidden="true" />

        <div className="rb-nb-page rb-nb-right">
          <p className="rb-nb-head">teacher&apos;s notes</p>

          <div className="rb-nb-focus">
            <p className="rb-nb-line">Study this first:</p>
            <p className="rb-nb-big">
              <span className="rb-nb-underline">
                {focus.name}
                <PenUnderline />
              </span>
            </p>
            <p className="rb-pen rb-pen-note rb-nb-line">your weakest topic — start here</p>
            <span className="rb-nb-grade">
              <PenCircle />
              <span>{focus.mastery}%</span>
            </span>
          </div>

          <div className="rb-nb-readiness">
            <p className="rb-nb-line">Exam readiness:</p>
            <p className="rb-nb-line">
              <span className="rb-pen rb-nb-fraction">
                {readiness}
                <small>/100</small>
              </span>
              <span className="rb-pen rb-pen-note ml-3">almost there, keep going!</span>
            </p>
            <p className="rb-nb-small">
              Your estimated chance of passing, from mastery across every domain the paper weights —
              not from how much of the course you have clicked through.
            </p>
          </div>

          {children ? (
            <div className="rb-nb-taped">
              <span className="rb-tape" data-side="l" aria-hidden="true" />
              <span className="rb-tape" data-side="r" aria-hidden="true" />
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
