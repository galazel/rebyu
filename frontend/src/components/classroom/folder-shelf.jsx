import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
export function FolderShelf({ items = [], hint = "click to open", carousel = true }) {
  const [openKey, setOpenKey] = useState(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [tempVisible, setTempVisible] = useState(false)

  const scope = useRef(null)
  const timeline = useRef(null)
  const pending = useRef(null)

  const scrollRef = useRef(null)
  const trackRef = useRef(null)
  const thumbRef = useRef(null)
  const hideTimerRef = useRef(null)
  const pointerStartRef = useRef({ x: 0, scrollLeft: 0, isDown: false, didDrag: false })

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

      const safety = window.setTimeout(() => {
        if (timeline.current === tl && tl.progress() < 0.05 && !tl.reversed()) tl.progress(1)
      }, 1200)
      return () => window.clearTimeout(safety)
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

  // Each folder card occupies 280px + 24px gap = 304px
  const ITEM_STRIDE = 304

  // Ensure enough items for seamless infinite loop across all viewport widths
  const baseItems = useMemo(() => {
    if (!items || items.length === 0) return []
    let list = [...items]
    while (list.length < 5) {
      list = [...list, ...items]
    }
    return list
  }, [items])

  const cycleWidth = baseItems.length * ITEM_STRIDE

  // 4 segments so there is always abundant runway before hitting browser scroll limits
  const marqueeItems = useMemo(() => {
    return [...baseItems, ...baseItems, ...baseItems, ...baseItems]
  }, [baseItems])

  const triggerTemporaryVisibility = useCallback(() => {
    setTempVisible(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => {
      setTempVisible(false)
    }, 1800)
  }, [])

  const prevProgressRef = useRef(0)

  const updateThumb = useCallback(() => {
    const el = scrollRef.current
    const track = trackRef.current
    const thumb = thumbRef.current
    if (!el || !track || !thumb || cycleWidth <= 0) return

    const trackWidth = track.clientWidth
    if (trackWidth <= 0) return

    // Thumb width: proportional to viewport, clamped between 36px and 25% of track
    const thumbWidth = Math.max(36, Math.min(trackWidth * 0.25, (el.clientWidth / cycleWidth) * trackWidth))
    thumb.style.width = `${thumbWidth}px`

    const maxTrack = trackWidth - thumbWidth
    if (maxTrack <= 0) return

    // Progress within the active cycle [0, 1)
    const relativeScroll = ((el.scrollLeft - cycleWidth) % cycleWidth + cycleWidth) % cycleWidth
    const progress = Math.max(0, Math.min(1, relativeScroll / cycleWidth))

    // Smooth reset glide when arriving at the end and wrapping back to the first
    if (prevProgressRef.current > 0.85 && progress < 0.15) {
      thumb.style.transition = "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.15s ease"
    } else {
      thumb.style.transition = "background-color 0.15s ease"
    }
    prevProgressRef.current = progress

    const translateX = progress * maxTrack
    thumb.style.transform = `translateX(${translateX}px)`
  }, [cycleWidth])

  // Position at middle segment initially so users can scroll left or right immediately
  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollRef.current && cycleWidth > 0) {
        scrollRef.current.scrollLeft = cycleWidth
        updateThumb()
      }
    }, 50)
    return () => clearTimeout(timer)
  }, [cycleWidth, updateThumb])

  // Marquee auto-scroll loop (pauses on hover, drag, open folder, or reduced motion)
  useEffect(() => {
    if (!carousel || items.length === 0 || cycleWidth <= 0) return
    if (prefersReduced()) return

    let animId
    let lastTime = performance.now()
    const speed = 35 // px per second

    const tick = (now) => {
      const dt = (now - lastTime) / 1000
      lastTime = now

      if (!isHovered && !isDragging && openKey === null && scrollRef.current) {
        const el = scrollRef.current
        el.scrollLeft += speed * dt
        if (el.scrollLeft >= cycleWidth * 2) {
          el.scrollLeft -= cycleWidth
        }
        updateThumb()
      }
      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [carousel, items.length, isHovered, isDragging, openKey, cycleWidth, updateThumb])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el || cycleWidth <= 0) return
    if (el.scrollLeft >= cycleWidth * 2) {
      el.scrollLeft -= cycleWidth
    } else if (el.scrollLeft < cycleWidth) {
      el.scrollLeft += cycleWidth
    }
    updateThumb()
    triggerTemporaryVisibility()
  }

  const handleTrackClick = (e) => {
    if (e.target === thumbRef.current) return
    const track = trackRef.current
    const el = scrollRef.current
    const thumb = thumbRef.current
    if (!track || !el || !thumb || cycleWidth <= 0) return

    const rect = track.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const thumbW = thumb.clientWidth
    const maxTrack = track.clientWidth - thumbW
    if (maxTrack <= 0) return

    const targetProgress = Math.max(0, Math.min(1, (clickX - thumbW / 2) / maxTrack))
    const targetScroll = cycleWidth + targetProgress * cycleWidth

    el.scrollTo({ left: targetScroll, behavior: "smooth" })
    triggerTemporaryVisibility()
  }

  const handleThumbPointerDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    triggerTemporaryVisibility()

    const startX = e.clientX
    const startScrollLeft = scrollRef.current ? scrollRef.current.scrollLeft : 0
    const track = trackRef.current
    const thumb = thumbRef.current
    const el = scrollRef.current
    if (!track || !thumb || !el || cycleWidth <= 0) return

    thumb.style.transition = "none"
    const maxTrack = track.clientWidth - thumb.clientWidth

    const onPointerMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX
      if (maxTrack > 0) {
        const deltaProgress = deltaX / maxTrack
        const targetScroll = startScrollLeft + deltaProgress * cycleWidth
        el.scrollLeft = targetScroll
        updateThumb()
      }
    }

    const onPointerUp = () => {
      setIsDragging(false)
      triggerTemporaryVisibility()
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
      window.removeEventListener("pointercancel", onPointerUp)
    }

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    window.addEventListener("pointercancel", onPointerUp)
  }

  const handleCarouselPointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return
    pointerStartRef.current = {
      x: e.clientX,
      scrollLeft: scrollRef.current ? scrollRef.current.scrollLeft : 0,
      isDown: true,
      didDrag: false,
    }
  }

  const handleCarouselPointerMove = (e) => {
    if (!pointerStartRef.current.isDown || !scrollRef.current) return
    const deltaX = e.clientX - pointerStartRef.current.x
    if (Math.abs(deltaX) > 6) {
      pointerStartRef.current.didDrag = true
      setIsDragging(true)
      scrollRef.current.scrollLeft = pointerStartRef.current.scrollLeft - deltaX
      updateThumb()
    }
  }

  const handleCarouselPointerUp = () => {
    if (pointerStartRef.current.isDown) {
      pointerStartRef.current.isDown = false
      setIsDragging(false)
      setTimeout(() => {
        pointerStartRef.current.didDrag = false
      }, 60)
    }
  }

  const isVisible = isHovered || isDragging || tempVisible

  return (
    <div ref={scope}>
      {carousel && items.length > 0 ? (
        <div
          className="relative w-full group/shelf"
          onMouseEnter={() => {
            setIsHovered(true)
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
          }}
          onMouseLeave={() => {
            setIsHovered(false)
            triggerTemporaryVisibility()
          }}
        >
          {/* Subtle edge fades for continuous shelf depth */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 md:w-20 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 md:w-20 bg-gradient-to-l from-white via-white/80 to-transparent z-10" />

          {/* Draggable & scrollable carousel row */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            onPointerDown={handleCarouselPointerDown}
            onPointerMove={handleCarouselPointerMove}
            onPointerUp={handleCarouselPointerUp}
            className="relative w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pt-7 pb-3 cursor-grab active:cursor-grabbing select-none"
          >
            <div className="flex w-max gap-6 px-4">
              {marqueeItems.map((item, index) => {
                const Icon = item.icon
                const isOpen = item.key === openKey
                return (
                  <div key={`${item.key}-${index}`} className="w-[280px] min-w-[280px] max-w-[280px] shrink-0">
                    <button
                      type="button"
                      className="rb-folder w-full"
                      style={{ "--folder": item.color.face, "--folder-edge": item.color.edge }}
                      aria-expanded={isOpen}
                      aria-controls="rb-folder-spread"
                      onClick={() => {
                        if (pointerStartRef.current.didDrag) return
                        toggle(item.key)
                      }}
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
                  </div>
                )
              })}
            </div>
          </div>

          {/* Subtle disappearing scrollbar */}
          <div
            className={`mt-4 flex items-center justify-center transition-opacity duration-500 ease-out ${
              isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-hidden={!isVisible}
          >
            <div
              ref={trackRef}
              onClick={handleTrackClick}
              className="group/track relative flex items-center w-48 sm:w-64 md:w-80 py-3 -my-3 cursor-pointer select-none"
              title="Drag or click to navigate certifications"
            >
              <div className="relative w-full h-1 group-hover/track:h-1.5 rounded-full bg-black/10 transition-[height,background-color] duration-200 overflow-hidden">
                <div
                  ref={thumbRef}
                  onPointerDown={handleThumbPointerDown}
                  className="absolute top-0 bottom-0 rounded-full bg-[#123126]/35 hover:bg-[#123126]/60 active:bg-[#123126]/80 cursor-grab active:cursor-grabbing transition-[background-color] duration-150"
                  style={{ width: "48px", transform: "translateX(0px)" }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rb-folder-shelf">
          {items.map((item) => {
            const Icon = item.icon
            const isOpen = item.key === openKey
            return (
              <div key={item.key} className="w-[280px] min-w-[280px] max-w-[280px] shrink-0">
                <button
                  type="button"
                  className="rb-folder w-full"
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
              </div>
            )
          })}
        </div>
      )}

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
