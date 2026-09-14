import { useCallback, useEffect, useRef } from "react"

/** The span of recent scrolling the pace is judged over. */
const WINDOW_MS = 1600

/**
 * How many screen heights of downward travel inside that window counts as
 * racing through the lesson rather than reading it. Reading a screen takes a
 * learner many seconds; two and a half screens in a second and a half is
 * someone flicking to the end.
 */
const RUSH_SCREENS = 2.6

/** Moving faster than this is too fast for a section passed to count as read. */
const SKIM_SCREENS = 1.5

/**
 * Only scrolling the learner is doing themselves counts. A wheel, a touch drag
 * or a scrolling key within this long before the scroll event marks it as
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

  const measure = useCallback(() => {
    const now = performance.now()
    const list = samples.current
    list.push({ t: now, y: window.scrollY })
    while (list.length > 1 && now - list[0].t > WINDOW_MS) list.shift()
    return { now, travelled: window.scrollY - list[0].y, since: list[0].t }
  }, [])

  const pause = useCallback((ms = 1500) => {
    pausedUntil.current = performance.now() + ms
    samples.current = []
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

    function onScroll() {
      const now = performance.now()
      if (now < pausedUntil.current || now - lastGesture.current > GESTURE_MS) {
        samples.current = []
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
    window.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      window.removeEventListener("wheel", gesture)
      window.removeEventListener("touchmove", gesture)
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("scroll", onScroll)
    }
  }, [enabled, measure])

  return { isRushing, pause }
}

export default useReadingPaceGuard
