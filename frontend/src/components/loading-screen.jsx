import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

import { isDepartmentHeadUser } from "@/context/auth-context.jsx"
import { TraySupplies } from "@/components/classroom/tray-supplies.jsx"


const MESSAGES = [
  { tag: "confidence", text: "Building your confidence...", tone: "macaw" },
  { tag: "mastery", text: "Syncing your mastery...", tone: "bee" },
  { tag: "study plan", text: "Leveling up your study plan...", tone: "beetle" },
  { tag: "challenge", text: "Loading your next challenge...", tone: "fox" },
]

export const INSTITUTION_MESSAGES = [
  { tag: "institution", text: "Opening your institution...", tone: "macaw" },
  { tag: "learners", text: "Gathering your learners' progress...", tone: "beetle" },
  { tag: "certifications", text: "Checking your certification slots...", tone: "bee" },
  { tag: "groups", text: "Lining up your groups...", tone: "fox" },
]

export const DEPARTMENT_HEAD_MESSAGES = [
  { tag: "class", text: "Opening your class...", tone: "macaw" },
  { tag: "roster", text: "Taking attendance...", tone: "beetle" },
  { tag: "assessments", text: "Stacking your assessments...", tone: "bee" },
  { tag: "announcements", text: "Pinning up announcements...", tone: "fox" },
]

export const ADMIN_MESSAGES = [
  { tag: "platform", text: "Checking the whole school...", tone: "macaw" },
  { tag: "content", text: "Sorting the curriculum...", tone: "beetle" },
  { tag: "institutions", text: "Reviewing partner institutions...", tone: "bee" },
  { tag: "reports", text: "Tallying the reports...", tone: "fox" },
]

export const GUEST_MESSAGES = [
  { tag: "rebyu", text: "Opening the classroom...", tone: "macaw" },
  { tag: "board", text: "Wiping the chalkboard...", tone: "beetle" },
  { tag: "seats", text: "Setting out the desks...", tone: "bee" },
  { tag: "almost", text: "Almost ready...", tone: "fox" },
]

export function messagesForUser(user) {
  const role = String(user?.role ?? "").toUpperCase()
  if (!role) return GUEST_MESSAGES
  if (role === "ADMIN") return ADMIN_MESSAGES
  if (isDepartmentHeadUser(user)) {
    return DEPARTMENT_HEAD_MESSAGES
  }
  if (role === "INSTITUTION") return INSTITUTION_MESSAGES
  return MESSAGES
}

export const GRADING_MESSAGES = [
  { tag: "answers", text: "Checking your answers...", tone: "macaw" },
  { tag: "written", text: "Marking your written responses...", tone: "beetle" },
  { tag: "code", text: "Running your code against the tests...", tone: "fox" },
  { tag: "score", text: "Totalling your score...", tone: "bee" },
]

export const ATTEMPT_MESSAGES = [
  { tag: "paper", text: "Setting out your paper...", tone: "macaw" },
  { tag: "questions", text: "Picking your questions...", tone: "beetle" },
  { tag: "answers", text: "Restoring any answers you saved...", tone: "bee" },
  { tag: "ready", text: "Almost ready...", tone: "fox" },
]

const FILL_MS = 650
const FADE_MS = 350

export function LoadingScreen({ messages = MESSAGES, overlay = false, finishing = false, onFinished }) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [progress, setProgress] = useState(4)
  const [leaving, setLeaving] = useState(false)
  const reduced = useReducedMotion()
  const finished = useRef(onFinished)
  finished.current = onFinished

  const list = messages?.length ? messages : MESSAGES
  const current = list[messageIndex % list.length]

  useEffect(() => {
    if (reduced) return undefined
    const id = setInterval(() => {
      setMessageIndex((value) => (value + 1) % list.length)
    }, 2200)
    return () => clearInterval(id)
  }, [reduced, list.length])

  useEffect(() => {
    if (finishing) return undefined
    setLeaving(false)
    const id = setInterval(() => {
      setProgress((value) => Math.max(value, value + (90 - value) * 0.06))
    }, 120)
    return () => clearInterval(id)
  }, [finishing])

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
      className={`rebyu-ds rb-light-only rb-classroom-face isolate flex h-svh w-full items-center justify-center overflow-hidden bg-[#2a2118] px-4 transition-opacity ${
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
              initial={reduced ? false : { clipPath: "inset(0 100% 0 0)", opacity: 1 }}
              animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
              exit={reduced ? undefined : { opacity: 0, transition: { duration: 0.2 } }}
              transition={{ duration: finishing ? 0.45 : 0.9, ease: "easeInOut" }}
            >
              {finishing ? "All set!" : current.text}
            </motion.p>
          </AnimatePresence>
        </div>

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
