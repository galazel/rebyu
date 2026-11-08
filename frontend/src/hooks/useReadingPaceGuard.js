import { useCallback, useEffect, useRef } from "react"
import { isLessonScrollGesture } from "@/lib/skim-challenge-state.js"

// Deliberately strict: regular wheel scrolling should never be treated as
// skimming. A rush must cover more than two screens in under a second.
const WINDOW_MS = 900

const RUSH_SCREENS = 2.25

const GESTURE_MS = 350

const SCROLL_KEYS = new Set(["PageDown", "ArrowDown", " ", "Spacebar", "End"])

export function useReadingPaceGuard({ enabled, onRush, resetKey, lessonRootRef }) {
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
    const list = samples.current
    list.push({ t: now, d: step })
    while (list.length > 1 && now - list[0].t > WINDOW_MS) list.shift()

    let travelled = 0
    let since = now
    for (const sample of list) {
      travelled += sample.d
      since = Math.min(since, sample.t)
    }
    return { now, travelled, since }
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
    return Math.abs(measure().travelled) > window.innerHeight * RUSH_SCREENS
  }, [enabled, measure])

  useEffect(() => {
    // A new lesson starts clean. Programmatic positioning never records a user
    // gesture, so the first genuine rapid scroll can be evaluated immediately.
    samples.current = []
    lastY.current = null
    lastGesture.current = 0
    draggingBar.current = false
    pausedUntil.current = performance.now()
  }, [enabled, resetKey])

  useEffect(() => {
    if (!enabled) {
      samples.current = []
      return undefined
    }

    const gesture = (event) => {
      if (event && !isLessonScrollGesture(event, lessonRootRef?.current ?? document.body)) {
        lastGesture.current = 0
        samples.current = []
        lastY.current = window.scrollY
        return
      }
      lastGesture.current = performance.now()
    }
    const onKeyDown = (event) => {
      if (SCROLL_KEYS.has(event.key)) gesture(event)
    }

    const onMouseDown = (event) => {
      const page = document.documentElement
      const rightEdge = event.clientX >= Math.max(page.clientWidth, window.innerWidth) - 2
      if (rightEdge) {
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
      const screen = window.innerHeight
      if (Math.abs(travelled) > screen * RUSH_SCREENS) {
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
  }, [enabled, measure, lessonRootRef])

  return { isRushing, pause }
}

export default useReadingPaceGuard
