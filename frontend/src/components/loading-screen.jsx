import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

import { TraySupplies } from "@/components/classroom/tray-supplies.jsx"

/**
 * Boot screen — the classroom.
 *
 * The painted classroom fills the window, softly out of focus, and a chalkboard
 * stands in the middle of it. Each status message is written onto the board in
 * chalk, left to right, and a chalk bar under it fills as the wait goes on.
 *
 * The bar is a real progress bar that finishes: while loading it creeps toward
 * 90%, and when `finishing` turns on it fills to 100%, holds a beat, fades the
 * screen out and calls `onFinished`. The app drives that through
 * `LoadingOverlayProvider` (`overlay` = fixed over everything); rendered on its
 * own (the dev preview) it simply keeps creeping.
 *
 * The board and photo are ornament: the message is announced through a stable
 * visually-hidden live region.
 */

const MESSAGES = [
  { tag: "confidence", text: "Building your confidence...", tone: "macaw" },
  { tag: "mastery", text: "Syncing your mastery...", tone: "bee" },
  { tag: "study plan", text: "Leveling up your study plan...", tone: "beetle" },
  { tag: "challenge", text: "Loading your next challenge...", tone: "fox" },
]

/** Copy for the wait after submitting an assessment: the real grading stages. */
export const GRADING_MESSAGES = [
  { tag: "answers", text: "Checking your answers...", tone: "macaw" },
  { tag: "written", text: "Marking your written responses...", tone: "beetle" },
  { tag: "code", text: "Running your code against the tests...", tone: "fox" },
  { tag: "score", text: "Totalling your score...", tone: "bee" },
]

/** Copy for the wait before an attempt opens. */
export const ATTEMPT_MESSAGES = [
  { tag: "paper", text: "Setting out your paper...", tone: "macaw" },
  { tag: "questions", text: "Picking your questions...", tone: "beetle" },
  { tag: "answers", text: "Restoring any answers you saved...", tone: "bee" },
  { tag: "ready", text: "Almost ready...", tone: "fox" },
]

const FILL_MS = 650
const FADE_MS = 350

/**
 * @param messages    Optional replacement for the boot copy -- e.g.
 *                    `GRADING_MESSAGES` while a submission is being marked.
 * @param overlay     Fixed over the whole app instead of in the page flow.
 * @param finishing   Loading is done: fill the bar, fade out, then `onFinished`.
 */
export function LoadingScreen({ messages = MESSAGES, overlay = false, finishing = false, onFinished }) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [progress, setProgress] = useState(4)
  const [leaving, setLeaving] = useState(false)
  const reduced = useReducedMotion()
  const finished = useRef(onFinished)
  finished.current = onFinished

  // Modulo'd rather than indexed directly: the interval keeps counting against
  // the list that was current when it was scheduled.
  const list = messages?.length ? messages : MESSAGES
  const current = list[messageIndex % list.length]

  useEffect(() => {
    if (reduced) return undefined
    const id = setInterval(() => {
      setMessageIndex((value) => (value + 1) % list.length)
    }, 2200)
    return () => clearInterval(id)
  }, [reduced, list.length])

  // Still loading: creep toward 90%, slowing as it gets closer. Never moves
  // backwards if loading resumes after the bar had already filled.
  useEffect(() => {
    if (finishing) return undefined
    setLeaving(false)
    const id = setInterval(() => {
      setProgress((value) => Math.max(value, value + (90 - value) * 0.06))
    }, 120)
    return () => clearInterval(id)
  }, [finishing])

  // Done: fill to 100%, let it be seen full, fade, then hand back.
  useEffect(() => {
    if (!finishing) return undefined
    setProgress(100)
    const fade = setTimeout(() => setLeaving(true), FILL_MS)
    const done = setTimeout(() => finished.current?.(), FILL_MS + FADE_MS)
    return () => {
      clearTimeout(fade)
      clearTimeout(done)
    }
  }, [finishing])

  const percent = Math.round(progress)

  return (
    <div
      className={`rebyu-ds rb-light-only isolate flex h-svh w-full items-center justify-center overflow-hidden bg-[#2a2118] px-4 transition-opacity ${
        overlay ? "fixed inset-0 z-[300]" : "relative"
      } ${leaving ? "opacity-0" : "opacity-100"}`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <div aria-hidden="true" className="rb-classroom-photo absolute inset-[-12px] -z-10 blur-[3px]" />

      <p className="sr-only" role="status" aria-live="polite">
        {finishing ? "Ready." : current.text}
      </p>

      <div aria-hidden="true" className="rb-chalkboard w-full max-w-2xl px-6 pb-12 pt-9 text-center sm:px-10">
        <p className="rb-chalk-label mx-auto">{finishing ? "ready" : current.tag}</p>

        <div className="mt-6 flex min-h-[3.5rem] items-center justify-center sm:min-h-[4.5rem]">
          <AnimatePresence mode="wait">
            <motion.p
              key={finishing ? "ready" : messageIndex}
              className="rb-chalk text-[clamp(1.75rem,4.5vw,2.75rem)] leading-tight"
              /* Written left to right, like chalk on a board. */
              initial={reduced ? false : { clipPath: "inset(0 100% 0 0)", opacity: 1 }}
              animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
              exit={reduced ? undefined : { opacity: 0, transition: { duration: 0.2 } }}
              transition={{ duration: finishing ? 0.45 : 0.9, ease: "easeInOut" }}
            >
              {finishing ? "All set!" : current.text}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* The chalk bar: fills as the wait goes on, and finishes before the
            screen leaves. */}
        <div className="mx-auto mt-8 flex max-w-sm items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-[var(--rb-chalk)] transition-[width] ease-out"
              style={{ width: `${progress}%`, transitionDuration: finishing ? `${FILL_MS - 150}ms` : "120ms" }}
            />
          </div>
          <span className="rb-chalk w-12 text-right text-lg tabular-nums">{percent}%</span>
        </div>

        <TraySupplies />
      </div>
    </div>
  )
}
