import { useCallback, useEffect, useRef } from "react"

/** The span of recent scrolling the pace is judged over. */
const WINDOW_MS = 1600

/**
 * How many screen heights of downward travel inside that window counts as
 * racing through the lesson rather than reading it. Reading a screen takes a
 * learner many seconds; two and a half screens in a second and a half is
 * someone flicking to the end.
 */
const RUSH_SCREENS = 3.5

/** Moving faster than this is too fast for a section passed to count as read. */
const SKIM_SCREENS = 2

/**
 * Only scrolling the learner is doing themselves counts. A wheel, a touch drag,
 * the scrollbar or a scrolling key within this long before the scroll event marks it as
 * theirs; a table-of-contents link, "next lesson" or the page's own scrollTo
 * never does, so those are never mistaken for skimming.
 */
const GESTURE_MS = 500

const SCROLL_KEYS = new Set(["PageDown", "ArrowDown", " ", "Spacebar", "End"])

/**
 * Notices a learner racing down a lesson instead of studying it.
 *
 * `onRush(since)` fires when downward travel inside the window passes
 * RUSH_SCREENS; `since` is the `performance.now()` time the rush began, so the
 * caller can take back anything that was recorded during it. `isRushing()`
 * answers "is the learner moving too fast for what just scrolled past to count
 * as read?" and is meant to be asked by the section-reading check. `pause(ms)`
 * mutes the guard, e.g. while the page itself scrolls back to the top.
 *
 * Scrolling back up is never judged: going back to re-read is studying.
 */
export function useReadingPaceGuard({ enabled, onRush }) {
  const samples = useRef([])
  const lastGesture = useRef(0)
  const pausedUntil = useRef(0)
  const onRushRef = useRef(onRush)
  onRushRef.current = onRush

  /* Travel is summed from one scroll event to the next, not read as "where
     the page is now minus where it was". A single jump bigger than a screen
     is not the learner scrolling: it is the browser keeping the view steady
     while an image or an opened panel above changes the page's height, or a
     scroll-snap settling. Counting those is what flagged a learner who had
     only nudged the wheel. The scrollbar is the exception -- a fast drag
     really does move a screen or more per event. */
  const lastY = useRef(null)
  const draggingBar = useRef(false)

  const measure = useCallback(() => {
    const now = performance.now()
    const y = window.scrollY
    const step = lastY.current == null ? 0 : y - lastY.current
    lastY.current = y
    const counted = !draggingBar.current && Math.abs(step) > window.innerHeight ? 0 : step
    const list = samples.current
    list.push({ t: now, d: counted })
    while (list.length > 1 && now - list[0].t > WINDOW_MS) list.shift()
    const travelled = list.reduce((sum, sample) => sum + sample.d, 0)
    return { now, travelled, since: list[0].t }
  }, [])

  const pause = useCallback((ms = 1500) => {
    pausedUntil.current = performance.now() + ms
    samples.current = []
    lastY.current = null
  }, [])

  const isRushing = useCallback(() => {
    if (!enabled) return false
    const now = performance.now()
    if (now < pausedUntil.current || now - lastGesture.current > GESTURE_MS) return false
    return measure().travelled > window.innerHeight * SKIM_SCREENS
  }, [enabled, measure])

  useEffect(() => {
    if (!enabled) {
      samples.current = []
      return undefined
    }

    const gesture = () => {
      lastGesture.current = performance.now()
    }
    const onKeyDown = (event) => {
      if (SCROLL_KEYS.has(event.key)) gesture()
    }

    /* Dragging the page's scrollbar (or clicking its track or arrows) is the
       learner's scrolling too, but sends no wheel or key event. A press past
       the document's width is on the scrollbar; it counts as a gesture until
       the button is released. Chrome often swallows the mouseup that ends a
       scrollbar drag, so the next move with no button held also ends it. */
    const onMouseDown = (event) => {
      if (event.clientX >= document.documentElement.clientWidth) {
        draggingBar.current = true
        gesture()
      }
    }
    const endScrollbar = () => {
      draggingBar.current = false
    }
    const onMouseMove = (event) => {
      if (draggingBar.current && event.buttons === 0) draggingBar.current = false
    }

    function onScroll() {
      if (draggingBar.current) gesture()
      const now = performance.now()
      if (now < pausedUntil.current || now - lastGesture.current > GESTURE_MS) {
        samples.current = []
        lastY.current = window.scrollY
        return
      }
      const { travelled, since } = measure()
      if (travelled > window.innerHeight * RUSH_SCREENS) {
        samples.current = []
        pausedUntil.current = now + 2000
        onRushRef.current?.(since)
      }
    }

    window.addEventListener("wheel", gesture, { passive: true })
    window.addEventListener("touchmove", gesture, { passive: true })
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("mousedown", onMouseDown, { passive: true })
    window.addEventListener("mouseup", endScrollbar, { passive: true })
    window.addEventListener("mousemove", onMouseMove, { passive: true })
    window.addEventListener("blur", endScrollbar)
    window.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      window.removeEventListener("wheel", gesture)
      window.removeEventListener("touchmove", gesture)
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("mousedown", onMouseDown)
      window.removeEventListener("mouseup", endScrollbar)
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("blur", endScrollbar)
      window.removeEventListener("scroll", onScroll)
    }
  }, [enabled, measure])

  return { isRushing, pause }
}

export default useReadingPaceGuard
