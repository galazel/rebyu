import { useCallback, useEffect, useRef } from "react"

const WINDOW_MS = 1600

const RUSH_SCREENS = 1.5

const SKIM_SCREENS = 1.2

const PASSIVE_WINDOW_MS = 6000
const PASSIVE_SCREENS = 2

const GESTURE_MS = 500

const SCROLL_KEYS = new Set(["PageDown", "ArrowDown", " ", "Spacebar", "End"])

export function useReadingPaceGuard({ enabled, onRush }) {
  const samples = useRef([])
  const lastGesture = useRef(0)
  const pausedUntil = useRef(0)
  const onRushRef = useRef(onRush)
  onRushRef.current = onRush

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
    while (list.length > 1 && now - list[0].t > PASSIVE_WINDOW_MS) list.shift()

    let travelled = 0
    let since = now
    let passiveTravelled = 0
    for (const sample of list) {
      passiveTravelled += sample.d
      if (now - sample.t <= WINDOW_MS) {
        travelled += sample.d
        since = Math.min(since, sample.t)
      }
    }
    return { now, travelled, since, passiveTravelled, passiveSince: list[0].t }
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
      const { travelled, since, passiveTravelled, passiveSince } = measure()
      const screen = window.innerHeight
      if (travelled > screen * RUSH_SCREENS) {
        samples.current = []
        pausedUntil.current = now + 2000
        onRushRef.current?.(since)
      } else if (passiveTravelled > screen * PASSIVE_SCREENS) {
        samples.current = []
        pausedUntil.current = now + 2000
        onRushRef.current?.(passiveSince)
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
