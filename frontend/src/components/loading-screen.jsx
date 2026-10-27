import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

import { isDepartmentHeadUser } from "@/context/auth-context.jsx"
import { TraySupplies } from "@/components/classroom/tray-supplies.jsx"

const TONES = ["macaw", "beetle", "bee", "fox"]

// [tag, text] pairs; tones are assigned in order so neighbouring lines differ.
function lines(pairs) {
  return pairs.map(([tag, text], index) => ({ tag, text, tone: TONES[index % TONES.length] }))
}

const MESSAGES = lines([
  ["confidence", "Building your confidence..."],
  ["mastery", "Syncing your mastery..."],
  ["study plan", "Leveling up your study plan..."],
  ["challenge", "Loading your next challenge..."],
  ["streak", "Counting your study streak..."],
  ["focus", "Sharpening your pencils..."],
])

// Learner areas, matched by URL so each screen talks about what it is opening.
const LEARNER_AREAS = [
  [/^\/learner\/(analytics|progress|dashboard)/, lines([
    ["progress", "Plotting your progress..."],
    ["mastery", "Weighing up what you've mastered..."],
    ["weak spots", "Finding the topics to revisit..."],
    ["readiness", "Checking how exam-ready you are..."],
    ["streak", "Counting your study days..."],
    ["trend", "Drawing your learning curve..."],
  ])],
  [/^\/learner\/learning\/[^/]+\/diagnostic/, lines([
    ["diagnostic", "Preparing your placement test..."],
    ["questions", "Picking one question per lesson..."],
    ["fair start", "Making sure you start at the right level..."],
    ["ready", "Sharpening your pencil..."],
  ])],
  [/^\/learner\/(learning\/[^/]+\/topics|lessons)/, lines([
    ["lesson", "Opening today's lesson..."],
    ["notes", "Writing the key points on the board..."],
    ["examples", "Lining up worked examples..."],
    ["tutor", "Waking up your AI tutor..."],
    ["sections", "Turning to the right page..."],
    ["focus", "Clearing the desk for focus..."],
  ])],
  [/^\/learner\/learning\/[^/]+/, lines([
    ["curriculum", "Unrolling your curriculum..."],
    ["units", "Arranging units and modules..."],
    ["next step", "Finding where you left off..."],
    ["path", "Mapping your study path..."],
  ])],
  [/^\/learner\/learning/, lines([
    ["my learning", "Gathering your enrolled courses..."],
    ["continue", "Bookmarking where you stopped..."],
    ["badges", "Polishing your achievements..."],
    ["next lesson", "Choosing your next lesson..."],
  ])],
  [/^\/learner\/certifications/, lines([
    ["certifications", "Opening the course catalogue..."],
    ["tracks", "Laying out every certification track..."],
    ["syllabus", "Counting modules and lessons..."],
    ["enrol", "Checking what you're enrolled in..."],
  ])],
  [/^\/learner\/mistakes/, lines([
    ["mistake bank", "Collecting the questions you missed..."],
    ["corrections", "Writing the right answers beside them..."],
    ["patterns", "Spotting mistakes you keep making..."],
    ["review", "Sorting what's left to review..."],
  ])],
  [/^\/learner\/library/, lines([
    ["library", "Dusting off your bookshelf..."],
    ["quizzes", "Stacking your saved quizzes..."],
    ["flashcards", "Shuffling your flashcards..."],
    ["activities", "Unpacking your games and activities..."],
  ])],
  [/^\/learner\/community/, lines([
    ["community", "Opening the study hall..."],
    ["posts", "Catching up on the latest posts..."],
    ["classmates", "Finding your classmates..."],
    ["discussion", "Pulling up a chair to the discussion..."],
  ])],
  [/^\/learner\/(plan|calendar)/, lines([
    ["calendar", "Flipping to this week..."],
    ["schedule", "Pencilling in your study sessions..."],
    ["goals", "Lining up today's goals..."],
    ["reminders", "Setting your reminders..."],
  ])],
  [/^\/learner\/(account|subscription)/, lines([
    ["account", "Opening your profile..."],
    ["settings", "Loading your preferences..."],
    ["plan", "Checking your plan..."],
  ])],
  [/^\/learner\/(challenges|world-cup)/, lines([
    ["challenges", "Setting up the arena..."],
    ["rankings", "Updating the leaderboard..."],
    ["rivals", "Finding worthy opponents..."],
    ["rules", "Reading out the rules..."],
  ])],
  [/^\/learner\/assessments/, lines([
    ["paper", "Setting out your paper..."],
    ["questions", "Picking your questions..."],
    ["timer", "Winding up the timer..."],
    ["quiet", "Quiet, please. Exam in progress..."],
  ])],
]

export const INSTITUTION_MESSAGES = lines([
  ["institution", "Opening your institution..."],
  ["learners", "Gathering your learners' progress..."],
  ["certifications", "Checking your certification slots..."],
  ["groups", "Lining up your groups..."],
  ["reports", "Preparing your institution reports..."],
  ["members", "Updating the member list..."],
])

export const DEPARTMENT_HEAD_MESSAGES = lines([
  ["class", "Opening your class..."],
  ["roster", "Taking attendance..."],
  ["assessments", "Stacking your assessments..."],
  ["announcements", "Pinning up announcements..."],
  ["grades", "Reading through the gradebook..."],
  ["sections", "Sorting your sections..."],
])

export const ADMIN_MESSAGES = lines([
  ["platform", "Checking the whole school..."],
  ["content", "Sorting the curriculum..."],
  ["institutions", "Reviewing partner institutions..."],
  ["reports", "Tallying the reports..."],
  ["question bank", "Filing the question bank..."],
  ["users", "Counting heads in every classroom..."],
])

export const GUEST_MESSAGES = lines([
  ["rebyu", "Opening the classroom..."],
  ["board", "Wiping the chalkboard..."],
  ["seats", "Setting out the desks..."],
  ["lights", "Switching on the lights..."],
  ["bell", "Waiting for the bell..."],
])

export function messagesForUser(user) {
  const role = String(user?.role ?? "").toUpperCase()
  if (!role) return GUEST_MESSAGES
  if (role === "ADMIN") return ADMIN_MESSAGES
  if (isDepartmentHeadUser(user)) return DEPARTMENT_HEAD_MESSAGES
  if (role === "INSTITUTION") return INSTITUTION_MESSAGES
  return MESSAGES
}

// The page being opened decides the lines; the role is the fallback.
export function messagesForPath(pathname, user) {
  const area = LEARNER_AREAS.find(([pattern]) => pattern.test(pathname ?? ""))
  return area ? area[1] : messagesForUser(user)
}

export const GRADING_MESSAGES = lines([
  ["answers", "Checking your answers..."],
  ["written", "Marking your written responses..."],
  ["code", "Running your code against the tests..."],
  ["score", "Totalling your score..."],
  ["feedback", "Writing notes in the margin..."],
])

export const ATTEMPT_MESSAGES = lines([
  ["paper", "Setting out your paper..."],
  ["questions", "Picking your questions..."],
  ["answers", "Restoring any answers you saved..."],
  ["timer", "Winding up the timer..."],
])

const FILL_MS = 650
const FADE_MS = 350
const ROTATE_MS = 2200
const SLOW_MS = 8000

// Remembered across loading screens so the next one never opens on the same line.
let lastShownText = null

function shuffledOrder(list) {
  const order = list.map((_, index) => index)
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  if (order.length > 1 && list[order[0]].text === lastShownText) order.push(order.shift())
  return order
}

export function LoadingScreen({ messages = MESSAGES, overlay = false, finishing = false, onFinished }) {
  const list = messages?.length ? messages : MESSAGES
  const order = useMemo(() => shuffledOrder(list), [list])
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(4)
  const [leaving, setLeaving] = useState(false)
  const [slow, setSlow] = useState(false)
  const reduced = useReducedMotion()
  const finished = useRef(onFinished)
  finished.current = onFinished

  const current = list[order[step % order.length]] ?? list[0]

  useEffect(() => {
    lastShownText = current.text
  }, [current.text])

  // A new set of lines (another page started loading) starts its own sequence.
  useEffect(() => setStep(0), [order])

  useEffect(() => {
    if (reduced || finishing) return undefined
    const id = setInterval(() => setStep((value) => value + 1), ROTATE_MS)
    return () => clearInterval(id)
  }, [reduced, finishing, order])

  useEffect(() => {
    if (finishing) return undefined
    setLeaving(false)
    setSlow(false)
    const slowTimer = setTimeout(() => setSlow(true), SLOW_MS)
    // Eases towards 90% and never claims to be done before the data is.
    const id = setInterval(() => {
      setProgress((value) => Math.max(value, value + (90 - value) * 0.06))
    }, 120)
    return () => {
      clearInterval(id)
      clearTimeout(slowTimer)
    }
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

  const label = finishing ? "ready" : current.tag
  const text = finishing ? "All set!" : current.text

  return (
    <div
      className={`rebyu-ds rb-light-only rb-classroom-face isolate flex h-svh w-full items-center justify-center overflow-hidden bg-[#2a2118] px-4 transition-opacity ${
        overlay ? "fixed inset-0 z-[300]" : "relative"
      } ${leaving ? "opacity-0" : "opacity-100"}`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
      aria-busy={!finishing}
    >
      <div aria-hidden="true" className="rb-classroom-photo absolute inset-[-12px] -z-10 blur-[3px]" />

      <p className="sr-only" role="status" aria-live="polite">
        {finishing ? "Ready." : slow ? `${text} This is taking longer than usual.` : text}
      </p>

      <div aria-hidden="true" className="rb-chalkboard w-full max-w-2xl px-6 pb-12 pt-9 text-center sm:px-10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={label}
            className="rb-chalk-label mx-auto"
            initial={reduced ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: 4, transition: { duration: 0.15 } }}
            transition={{ duration: 0.25 }}
          >
            {label}
          </motion.p>
        </AnimatePresence>

        <div className="mt-6 flex min-h-[3.5rem] items-center justify-center sm:min-h-[4.5rem]">
          <AnimatePresence mode="wait">
            <motion.p
              key={finishing ? "ready" : `${step}-${text}`}
              className="rb-chalk text-[clamp(1.75rem,4.5vw,2.75rem)] leading-tight"
              initial={reduced ? false : { clipPath: "inset(0 100% 0 0)", opacity: 1 }}
              animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
              exit={reduced ? undefined : { opacity: 0, transition: { duration: 0.2 } }}
              transition={{ duration: finishing ? 0.45 : 0.9, ease: "easeInOut" }}
            >
              {text}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="mx-auto mt-8 max-w-sm">
          <div className="h-2 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-[var(--rb-chalk)] transition-[width] ease-out"
              style={{ width: `${progress}%`, transitionDuration: finishing ? `${FILL_MS - 150}ms` : "120ms" }}
            />
          </div>
          {/* One chalk dot per line in this set; the lit one is the line on the board. */}
          <div className="mt-3 flex justify-center gap-1.5">
            {order.map((index, position) => (
              <span
                key={index}
                className={`size-1.5 rounded-full transition-colors duration-300 ${
                  finishing || position === step % order.length ? "bg-[var(--rb-chalk)]" : "bg-white/20"
                }`}
              />
            ))}
          </div>
          <p className={`rb-chalk mt-3 text-sm transition-opacity duration-500 ${slow && !finishing ? "opacity-80" : "opacity-0"}`}>
            Taking a little longer than usual. Hang tight...
          </p>
        </div>

        <TraySupplies />
      </div>
    </div>
  )
}
