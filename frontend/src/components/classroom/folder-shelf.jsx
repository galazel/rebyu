import { useRef, useState } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

import { X } from "@/components/icons"

gsap.registerPlugin(useGSAP)

/**
 * A row of closed paper folders. Clicking one lays it open below the row like a
 * book: the cover swings over to the left, a couple of loose sheets riffle after
 * it, and the notes on the right-hand page are written in line by line.
 *
 * Driven by one GSAP timeline per opened folder, so closing is the same motion
 * played backwards. Below `md` there is no room for a spread; the cover lifts
 * away instead and the two pages stack.
 *
 * items: [{ key, tab, title, meta, icon, color: { face, edge }, left, right }]
 *   `left`  -- inside of the cover (identity, call to action)
 *   `right` -- the ruled page; give each line `className="rb-spread-line"` so it
 *              is written in on open.
 */
export function FolderShelf({ items, hint = "click to open" }) {
  const [openKey, setOpenKey] = useState(null)
  const scope = useRef(null)
  const timeline = useRef(null)
  const pending = useRef(null)

  const open = items.find((item) => item.key === openKey)

  const prefersReduced = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

  useGSAP(
    () => {
      if (!openKey) return
      const wide = window.matchMedia("(min-width: 768px)").matches
      const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.inOut" } })

      tl.from(".rb-spread", { autoAlpha: 0, y: 28, duration: 0.35, ease: "power2.out" })

      if (wide) {
        tl.set(".rb-spread-left-content", { autoAlpha: 0 })
          .to(".rb-spread-cover", { rotateY: -180, duration: 0.95 })
          .to(".rb-spread-leaf", { rotateY: -180, duration: 0.6, stagger: 0.14, ease: "power1.inOut" }, "-=0.5")
          .to(".rb-spread-leaf", { autoAlpha: 0, duration: 0.12, stagger: 0.14 }, "<0.5")
          .set(".rb-spread-cover", { autoAlpha: 0 })
          .to(".rb-spread-left-content", { autoAlpha: 1, duration: 0.3 }, "<")
      } else {
        tl.to(".rb-spread-cover", { rotateY: -100, autoAlpha: 0, duration: 0.7 })
      }

      tl.from(
        ".rb-spread-line",
        { autoAlpha: 0, x: -12, duration: 0.32, stagger: 0.07, ease: "power2.out" },
        "-=0.15",
      )

      timeline.current = tl
      if (prefersReduced()) tl.progress(1)
      else tl.play()

      /* The spread starts at opacity 0 and only the timeline brings it in. GSAP
         advances on animation frames, and a browser that stops handing those
         out (an embedded preview, a tab that was in the background) left the
         folder marked open with nothing visible under it. If the opening has
         not moved after a beat, show the finished spread outright. */
      const safety = window.setTimeout(() => {
        if (timeline.current === tl && tl.progress() < 0.05 && !tl.reversed()) tl.progress(1)
      }, 1200)
      return () => window.clearTimeout(safety)

      scope.current
        ?.querySelector(".rb-spread")
        ?.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "nearest" })
    },
    { scope, dependencies: [openKey], revertOnUpdate: true },
  )

  const close = (then = null) => {
    const tl = timeline.current
    pending.current = then
    const finish = () => {
      timeline.current = null
      setOpenKey(pending.current)
      pending.current = null
    }
    if (!tl || prefersReduced()) return finish()
    tl.eventCallback("onReverseComplete", finish)
    tl.timeScale(1.6).reverse()
  }

  const toggle = (key) => {
    if (openKey === key) close()
    else if (openKey) close(key)
    else setOpenKey(key)
  }

  return (
    <div ref={scope}>
      <div className="rb-folder-shelf">
        {items.map((item) => {
          const Icon = item.icon
          const isOpen = item.key === openKey
          return (
            <button
              key={item.key}
              type="button"
              className="rb-folder"
              style={{ "--folder": item.color.face, "--folder-edge": item.color.edge }}
              aria-expanded={isOpen}
              aria-controls="rb-folder-spread"
              onClick={() => toggle(item.key)}
            >
              <span className="rb-folder-back" aria-hidden="true">
                <span className="rb-folder-tab">{item.tab}</span>
              </span>
              <span className="rb-folder-sheet" aria-hidden="true" />
              <span className="rb-folder-front">
                {Icon ? <Icon className="size-7 text-[#4a3516]" aria-hidden="true" /> : null}
                <span className="rb-folder-title">{item.title}</span>
                <span className="rb-folder-meta">{item.meta}</span>
                <span className="rb-folder-hint">{isOpen ? "open below — click to close" : hint}</span>
              </span>
            </button>
          )
        })}
      </div>

      {open ? (
        <section
          id="rb-folder-spread"
          aria-label={`${open.title} folder`}
          className="rb-spread"
          style={{ "--folder": open.color.face, "--folder-edge": open.color.edge }}
        >
          <div className="rb-spread-book">
            <div className="rb-spread-left">
              <div className="rb-spread-left-content">{open.left}</div>
            </div>
            <div className="rb-spread-right rb-notebook">{open.right}</div>

            <span className="rb-spread-leaf" aria-hidden="true" />
            <span className="rb-spread-leaf" aria-hidden="true" />

            <div className="rb-spread-cover" aria-hidden="true">
              <div className="rb-spread-face rb-spread-face-front">
                <span className="rb-folder-title">{open.title}</span>
                <span className="rb-folder-meta">{open.meta}</span>
              </div>
              <div className="rb-spread-face rb-spread-face-back" />
            </div>
          </div>

          <button type="button" className="rb-spread-close" onClick={() => close()} aria-label={`Close ${open.title} folder`}>
            <X className="size-4" aria-hidden="true" />
          </button>
        </section>
      ) : null}
    </div>
  )
}
