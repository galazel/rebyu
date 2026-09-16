import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"

import { CalendarDays, UsersRound, X } from "@/components/icons"
import { ClassBody, ClassHeader, useMyClasses } from "@/components/learner/learner-class-panel.jsx"

/** A progress ring: the certification's completion, drawn once, in one place. */
function ProgressDonut({ value }) {
  const percent = Math.max(0, Math.min(100, Math.round(value ?? 0)))
  const radius = 26
  const circumference = 2 * Math.PI * radius
  return (
    <div
      className="relative grid size-16 place-items-center rounded-full border-2 border-rb-swan bg-rb-snow shadow-[var(--comic-shadow-sm)]"
      role="img"
      aria-label={`${percent}% of this certification complete`}
      title={`${percent}% of this certification complete`}
    >
      <svg viewBox="0 0 64 64" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
        <circle cx="32" cy="32" r={radius} fill="none" strokeWidth="6" className="stroke-rb-swan" />
        <motion.circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className="stroke-rb-feather"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - percent / 100) }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span className="rb-numeric relative text-sm font-extrabold text-rb-eel">{percent}%</span>
    </div>
  )
}

const dockButton =
  "relative grid size-12 place-items-center rounded-full border-2 border-rb-swan bg-rb-snow text-rb-eel shadow-[var(--comic-shadow-sm)] transition-colors hover:bg-rb-polar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rb-macaw"

/**
 * The curriculum page's controls, stacked in the bottom-right corner: the class
 * (when the learner is in one), the study calendar, and the progress ring at the
 * base. The class opens as a card above the stack rather than living in the page.
 *
 * Portaled to <body>: the route wrapper keeps a transform applied, which would
 * otherwise pin this to the page instead of the window (see LearnerMobileNavigation).
 * Sits above the mobile tab bar below `lg`.
 */
export function CurriculumDock({ certificationId, progress, showCalendar }) {
  const classes = useMyClasses(certificationId)
  const [classOpen, setClassOpen] = useState(false)
  const panelRef = useRef(null)
  const announcementCount = classes.reduce((total, group) => total + (group.announcements?.length ?? 0), 0)

  useEffect(() => {
    if (!classOpen) return undefined
    const onKey = (event) => {
      if (event.key === "Escape") setClassOpen(false)
    }
    const onPointer = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) setClassOpen(false)
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("pointerdown", onPointer)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("pointerdown", onPointer)
    }
  }, [classOpen])

  if (typeof document === "undefined") return null

  return createPortal(
    <div className="rebyu-ds netacad-portal learner-portal">
      <div
        ref={panelRef}
        className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-3 sm:right-6 lg:bottom-6"
      >
        {classOpen && classes.length > 0 ? (
          <div className="max-h-[min(60dvh,32rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-rb-card border-2 border-rb-swan bg-rb-snow p-4 shadow-xl">
            <div className="space-y-5">
              {classes.map((group) => (
                <section key={group.groupId}>
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <ClassHeader group={group} />
                    </div>
                    <button
                      type="button"
                      onClick={() => setClassOpen(false)}
                      aria-label="Close class"
                      className="grid size-8 shrink-0 place-items-center rounded-full text-rb-hare hover:bg-rb-polar"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="mt-4">
                    <ClassBody group={group} />
                  </div>
                </section>
              ))}
            </div>
          </div>
        ) : null}

        {classes.length > 0 ? (
          <button
            type="button"
            onClick={() => setClassOpen((value) => !value)}
            aria-expanded={classOpen}
            aria-label="Your class"
            title="Your class"
            className={dockButton}
          >
            <UsersRound className="size-5" aria-hidden="true" />
            {announcementCount > 0 && !classOpen ? (
              <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-rb-cardinal px-1 text-[10px] font-bold text-white">
                {announcementCount}
              </span>
            ) : null}
          </button>
        ) : null}

        {showCalendar ? (
          <Link to="/learner/plan" aria-label="Study calendar" title="Study calendar" className={dockButton}>
            <CalendarDays className="size-5" aria-hidden="true" />
          </Link>
        ) : null}

        <ProgressDonut value={progress} />
      </div>
    </div>,
    document.body
  )
}

export default CurriculumDock
