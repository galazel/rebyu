import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"

import { Sparkles } from "@/components/icons"

/**
 * The AI tutor as a chat head, the way Messenger floats a conversation.
 *
 * A round bubble sits on the edge of the screen. Drag it anywhere and it snaps
 * to the nearer side when let go, and remembers where it was left, so it can be
 * moved off whatever it happens to be covering. A tap (a press that did not
 * travel) opens the chat window beside it; on a phone the window takes the
 * lower part of the screen instead, since there is no "beside" at 400px.
 *
 * Portaled to <body>: the route wrapper keeps a transform applied, and a
 * transformed ancestor would pin a `position: fixed` bubble to the page rather
 * than the window.
 */

const SIZE = 56
const MARGIN = 12
const TAP_TRAVEL = 6
const PANEL_WIDTH = 380
const PANEL_HEIGHT = 600
const STORAGE_KEY = "rebyu.tutorChatHead"

function viewport() {
  return { width: window.innerWidth, height: window.innerHeight }
}

function clampY(y) {
  return Math.min(Math.max(y, MARGIN), viewport().height - SIZE - MARGIN)
}

function readSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null")
    if (saved && (saved.side === "left" || saved.side === "right") && Number.isFinite(saved.y)) {
      return saved
    }
  } catch {
    /* Storage blocked: start from the default corner. */
  }
  return null
}

export function TutorChatHead({ open, onOpenChange, hidden = false, children }) {
  const [spot, setSpot] = useState(() => readSaved() ?? { side: "right", y: viewport().height - SIZE - 28 })
  const [drag, setDrag] = useState(null) // { x, y } while being dragged
  const [, setResized] = useState(0)
  const press = useRef(null)

  useEffect(() => {
    const onResize = () => setResized((n) => n + 1)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  const { width, height } = viewport()
  const phone = width < 640
  const restX = spot.side === "left" ? MARGIN : width - SIZE - MARGIN
  const restY = clampY(spot.y)
  const x = drag ? drag.x : restX
  const y = drag ? drag.y : restY

  const onPointerDown = useCallback((event) => {
    if (event.button !== undefined && event.button !== 0) return
    const rect = event.currentTarget.getBoundingClientRect()
    try {
      // Keeps the moves coming when a fast drag outruns the bubble. Throws for
      // a pointer the browser no longer tracks, which must not cost the tap.
      event.currentTarget.setPointerCapture?.(event.pointerId)
    } catch {
      /* Dragging still works while the pointer stays over the bubble. */
    }
    press.current = {
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      moved: false,
    }
  }, [])

  const onPointerMove = useCallback((event) => {
    const current = press.current
    if (!current) return
    const travel = Math.hypot(event.clientX - current.startX, event.clientY - current.startY)
    if (!current.moved && travel < TAP_TRAVEL) return
    current.moved = true
    const { width: w, height: h } = viewport()
    setDrag({
      x: Math.min(Math.max(event.clientX - current.offsetX, 0), w - SIZE),
      y: Math.min(Math.max(event.clientY - current.offsetY, 0), h - SIZE),
    })
  }, [])

  const onPointerUp = useCallback(
    (event) => {
      const current = press.current
      press.current = null
      if (!current) return
      if (!current.moved) {
        onOpenChange(!open)
        return
      }
      const { width: w } = viewport()
      const left = event.clientX - current.offsetX + SIZE / 2 < w / 2
      const next = { side: left ? "left" : "right", y: clampY(event.clientY - current.offsetY) }
      setDrag(null)
      setSpot(next)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* The bubble just will not remember its place. */
      }
    },
    [open, onOpenChange]
  )

  /* The window opens beside the bubble on the side it is docked, bottom edges
     lined up, and is pushed back on screen if that would run off the top. */
  const panelHeight = Math.min(PANEL_HEIGHT, height - MARGIN * 2)
  const panelStyle = phone
    ? { left: 8, right: 8, bottom: 8, height: Math.min(height * 0.78, 640) }
    : {
        width: PANEL_WIDTH,
        height: panelHeight,
        top: Math.min(Math.max(restY + SIZE - panelHeight, MARGIN), height - panelHeight - MARGIN),
        ...(spot.side === "left"
          ? { left: MARGIN + SIZE + MARGIN }
          : { right: MARGIN + SIZE + MARGIN }),
      }

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
              ...panelStyle,
              transformOrigin: phone ? "50% 100%" : spot.side === "left" ? "0% 100%" : "100% 100%",
            }}
            className="rebyu-ds fixed z-[61] overflow-hidden rounded-2xl border border-rb-swan bg-rb-snow shadow-[0_18px_48px_rgba(20,30,24,0.28)]"
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {!hidden && !(open && phone) ? (
          <motion.button
            key="tutor-head"
            type="button"
            aria-label={open ? "Close AI tutor" : "Open AI tutor"}
            aria-expanded={open}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => {
              press.current = null
              setDrag(null)
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                onOpenChange(!open)
              }
            }}
            initial={{ scale: 0 }}
            animate={{ scale: drag ? 1.08 : 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 480, damping: 24 }}
            style={{
              left: x,
              top: y,
              width: SIZE,
              height: SIZE,
              touchAction: "none",
              transition: drag ? "none" : "left 260ms cubic-bezier(0.22,1,0.36,1), top 260ms cubic-bezier(0.22,1,0.36,1)",
            }}
            className="fixed z-[62] grid cursor-grab select-none place-items-center rounded-full bg-rb-feather text-white shadow-[0_8px_22px_rgba(20,60,40,0.35)] ring-4 ring-white active:cursor-grabbing"
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
