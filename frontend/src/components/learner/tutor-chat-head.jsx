import { useEffect } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"

import { Sparkles } from "@/components/icons"

/**
 * The AI tutor as a chat head, fixed to the bottom-right corner of the window.
 *
 * A round bubble stays in the corner while the lesson scrolls under it. Tapping
 * it opens the chat window just above it; on a phone the window takes the lower
 * part of the screen instead, since there is no room beside a bubble at 400px.
 *
 * Portaled to <body>: the route wrapper keeps a transform applied, and a
 * transformed ancestor would pin a `position: fixed` bubble to the page rather
 * than the window.
 */

const SIZE = 56
const MARGIN = 20
const GAP = 12
const PANEL_WIDTH = 380
const PANEL_HEIGHT = 600

export function TutorChatHead({ open, onOpenChange, hidden = false, children }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  return createPortal(
    <>
      <AnimatePresence>
        {open && !hidden ? (
          <motion.div
            key="tutor-window"
            role="dialog"
            aria-label="AI tutor"
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            style={{
              "--tutor-panel-width": `${PANEL_WIDTH}px`,
              "--tutor-panel-height": `${PANEL_HEIGHT}px`,
              "--tutor-panel-bottom": `${MARGIN + SIZE + GAP}px`,
              "--tutor-panel-right": `${MARGIN}px`,
              transformOrigin: "100% 100%",
            }}
            className="rebyu-ds fixed inset-x-2 bottom-2 z-[61] h-[min(78dvh,640px)] overflow-hidden rounded-2xl border border-rb-swan bg-rb-snow shadow-[0_18px_48px_rgba(20,30,24,0.28)] sm:inset-x-auto sm:right-[var(--tutor-panel-right)] sm:bottom-[var(--tutor-panel-bottom)] sm:h-[min(var(--tutor-panel-height),calc(100dvh-var(--tutor-panel-bottom)-20px))] sm:w-[var(--tutor-panel-width)]"
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {!hidden ? (
          <motion.button
            key="tutor-head"
            type="button"
            aria-label={open ? "Close AI tutor" : "Open AI tutor"}
            aria-expanded={open}
            onClick={() => onOpenChange(!open)}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 480, damping: 24 }}
            style={{ right: MARGIN, bottom: MARGIN, width: SIZE, height: SIZE }}
            className={`fixed z-[62] grid select-none place-items-center rounded-full bg-rb-feather text-white shadow-[0_8px_22px_rgba(20,60,40,0.35)] ring-4 ring-white ${open ? "max-sm:hidden" : ""}`}
          >
            <Sparkles className="size-6" aria-hidden="true" />
            {!open ? (
              <span className="absolute right-0.5 top-0.5 size-3 rounded-full bg-rb-bee ring-2 ring-white" aria-hidden="true" />
            ) : null}
          </motion.button>
        ) : null}
      </AnimatePresence>
    </>,
    document.body
  )
}

export default TutorChatHead
