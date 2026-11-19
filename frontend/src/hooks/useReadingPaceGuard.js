import { useCallback, useEffect, useRef } from "react"
import { isLessonScrollGesture } from "@/lib/skim-challenge-state.js"

// What counts as skimming: covering more than `rushScreens` viewport heights inside
// `windowMs`, as `minSamples` separate movements, with a real gesture in the last
// `gestureMs`.
//
// Desktop mouse-wheel input is precise, but a short mobile flick can carry several screen
// heights of momentum, so a touch-first screen needs more travel before it counts.
//
// `minSamples` is what keeps ONE big movement from counting. A lesson can be ten
// screens long, so nudging the scrollbar a centimetre, or pressing End, moves several
// screens in a single jump -- that is navigating to a place, not reading past content,
// and on its own it must never raise a challenge. Skimming is many fast movements in a
// row, which is what this measures.
const DESKTOP_GUARD = { windowMs: 900, rushScreens: 3.5, gestureMs: 350, minSamples: 4 }
const MOBILE_GUARD = { windowMs: 1250, rushScreens: 6, gestureMs: 500, minSamples: 4 }

const SCROLL_KEYS = new Set(["PageDown", "ArrowDown", " ", "Spacebar", "End"])

function guardSettings() {
  if (typeof window === "undefined") return DESKTOP_GUARD
  const narrowScreen = window.matchMedia?.("(max-width: 767px)").matches
  const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches || navigator.maxTouchPoints > 0
  return narrowScreen && coarsePointer ? MOBILE_GUARD : DESKTOP_GUARD
}

export function useReadingPaceGuard({ enabled, onRush, resetKey, lessonRootRef }) {
  const samples = useRef([])
  const lastGesture = useRef(0)
  const pausedUntil = useRef(0)
  const onRushRef = useRef(onRush)
  onRushRef.current = onRush

  const lastY = useRef(null)
  const draggingBar = useRef(false)

  const measure = useCallback((windowMs) => {
    const now = performance.now()
    const y = window.scrollY
    const step = lastY.current == null ? 0 : y - lastY.current
    lastY.current = y
    const list = samples.current
    if (list.length > 0 && now - list[list.length - 1].t > windowMs) list.length = 0
    list.push({ t: now, d: step })
    while (list.length > 0 && now - list[0].t > windowMs) list.shift()

    let travelled = 0
    let since = now
    let moves = 0
    for (const sample of list) {
      travelled += sample.d
      if (sample.d !== 0) moves += 1
      since = Math.min(since, sample.t)
    }
    return { now, travelled, since, moves }
  }, [])

  const pause = useCallback((ms = 1500) => {
    pausedUntil.current = performance.now() + ms
    samples.current = []
    lastY.current = null
  }, [])

  const isRushing = useCallback(() => {
    if (!enabled) return false
    const now = performance.now()
    const settings = guardSettings()
    if (now < pausedUntil.current || now - lastGesture.current > settings.gestureMs) return false
    const { travelled, moves } = measure(settings.windowMs)
    return (
      moves >= settings.minSamples &&
      Math.abs(travelled) > window.innerHeight * settings.rushScreens
    )
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
      else if (event.key === "Enter") {
        pause(3000)
        lastGesture.current = 0
      }
    }

    const onMouseDown = (event) => {
      const page = document.documentElement
      // clientWidth stops where the page's scrollbar starts, so anything right of it is the bar.
      // Overlay scrollbars take no width; for those, treat the last 16px as the bar.
      const barStart = page.clientWidth < window.innerWidth ? page.clientWidth : window.innerWidth - 16
      const rightEdge = event.clientX >= barStart
      if (rightEdge) {
        draggingBar.current = true
        gesture()
      } else {
        // A click elsewhere (sidebar section, quiz link, jump button) can start a long
        // programmatic scroll. That is navigation, not skimming, so ignore the next few seconds.
        pause(3000)
        lastGesture.current = 0
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
      const settings = guardSettings()
      if (now < pausedUntil.current || now - lastGesture.current > settings.gestureMs) {
        samples.current = []
        lastY.current = window.scrollY
        return
      }
      const { travelled, since, moves } = measure(settings.windowMs)
      const screen = window.innerHeight
      if (moves >= settings.minSamples && Math.abs(travelled) > screen * settings.rushScreens) {
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
  }, [enabled, measure, pause, lessonRootRef])

  return { isRushing, pause }
}

export default useReadingPaceGuard
