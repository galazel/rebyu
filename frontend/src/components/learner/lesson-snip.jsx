import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { toCanvas } from "html-to-image"
import { toast } from "sonner"

import { Loader2, Sparkles, X } from "@/components/icons"

/* Ways a learner hands part of a lesson to the AI tutor:
 *
 *   LessonSnipOverlay   drag a box over anything on the lesson -- text,
 *                       diagram, table -- and get a picture of it plus the
 *                       words inside it
 *   SelectionAskButton  select text, then "Ask AI tutor"
 *
 * Both produce a snippet {id, quote, image}: `quote` is plain text, `image` a
 * JPEG data URL (or null). The words travel even when the picture cannot be
 * made, so a text-only model still knows what was asked about. */

// Big enough to read a diagram's labels, small enough that a vision model
// on a per-minute token budget (Groq) takes it with the question beside it.
const MAX_SIDE = 1024
const MAX_QUOTE = 6000
const PICTURE_TIMEOUT_MS = 8000
const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"

let nextId = 1
export const newSnippet = (fields) => ({ id: `snip-${Date.now()}-${nextId++}`, quote: null, image: null, ...fields })

function intersects(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
}

/** The lesson's words inside `rect` (viewport coordinates), in reading order. */
function textInside(root, rect) {
  const parts = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.tagName
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "BUTTON") return NodeFilter.FILTER_REJECT
        return tag === "IMG" ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
      }
      return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
    },
  })
  const range = document.createRange()
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      // A picture's own description, when it has one.
      if (node.alt && intersects(node.getBoundingClientRect(), rect)) parts.push(`[Image: ${node.alt}]`)
      continue
    }
    range.selectNodeContents(node)
    if ([...range.getClientRects()].some((box) => intersects(box, rect))) parts.push(node.textContent.trim())
  }
  return parts.join(" ").replace(/\s+/g, " ").trim().slice(0, MAX_QUOTE)
}

/** The smallest element under `root` that holds all of `rect`. */
function containerOf(root, rect) {
  const cx = (rect.left + rect.right) / 2
  const cy = (rect.top + rect.bottom) / 2
  let node = document.elementsFromPoint(cx, cy).find((el) => root.contains(el)) ?? root
  const holds = (el) => {
    const box = el.getBoundingClientRect()
    return box.left <= rect.left && box.top <= rect.top && box.right >= rect.right && box.bottom >= rect.bottom
  }
  while (node !== root && !holds(node)) node = node.parentElement ?? root
  return node
}

/**
 * A picture of `rect` (viewport coordinates) within `root`, as a JPEG data URL.
 * Draws the smallest element holding the box -- usually a section or a figure,
 * not the whole lesson -- then crops to the box.
 */
async function pictureOf(root, rect) {
  const node = containerOf(root, rect)
  const box = node.getBoundingClientRect()
  // A whole long lesson at 2x would be a canvas of tens of millions of pixels.
  const scale = box.width * box.height > 4_000_000 ? 1 : Math.min(window.devicePixelRatio || 1, 2)
  const full = await toCanvas(node, {
    pixelRatio: scale,
    backgroundColor: "#ffffff",
    imagePlaceholder: TRANSPARENT_PIXEL,
    cacheBust: true,
    // Embedding web fonts reads every stylesheet's rules, and a browser
    // refuses that for cross-site ones (Google Fonts) -- console errors and a
    // slow capture, for lettering a model reads just as well in a fallback font.
    skipFonts: true,
  })
  const left = Math.max(rect.left, box.left)
  const top = Math.max(rect.top, box.top)
  const width = Math.min(rect.right, box.right) - left
  const height = Math.min(rect.bottom, box.bottom) - top
  if (width <= 0 || height <= 0) return null
  const shrink = Math.min(1, MAX_SIDE / (Math.max(width, height) * scale))
  const out = document.createElement("canvas")
  out.width = Math.max(1, Math.round(width * scale * shrink))
  out.height = Math.max(1, Math.round(height * scale * shrink))
  const context = out.getContext("2d")
  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, out.width, out.height)
  context.drawImage(
    full,
    (left - box.left) * scale, (top - box.top) * scale, width * scale, height * scale,
    0, 0, out.width, out.height,
  )
  // Embedded videos and frames cannot be drawn and come out as one flat
  // colour; a picture of nothing is worse than none.
  if (isBlank(out)) return null
  return out.toDataURL("image/jpeg", 0.85)
}

/** Whether a canvas is a single flat colour (sampled on a small grid). */
function isBlank(canvas) {
  const probe = document.createElement("canvas")
  probe.width = 24
  probe.height = 24
  const context = probe.getContext("2d")
  context.drawImage(canvas, 0, 0, 24, 24)
  const { data } = context.getImageData(0, 0, 24, 24)
  let min = 255
  let max = 0
  for (let i = 0; i < data.length; i += 4) {
    const light = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000
    if (light < min) min = light
    if (light > max) max = light
  }
  return max - min < 6
}

/**
 * Dims the page and lets the learner drag a box over the lesson. On release it
 * resolves the box to a snippet and calls `onCapture`; Escape or a click with
 * no drag cancels.
 */
export function LessonSnipOverlay({ target, onCapture, onCancel }) {
  const [drag, setDrag] = useState(null)
  const [busy, setBusy] = useState(false)
  const overlayRef = useRef(null)

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onCancel()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onCancel])

  function onDown(event) {
    if (event.button !== 0 || busy) return
    setDrag({ x0: event.clientX, y0: event.clientY, x1: event.clientX, y1: event.clientY })
    overlayRef.current?.setPointerCapture(event.pointerId)
  }
  function onMove(event) {
    if (!drag) return
    setDrag((d) => ({ ...d, x1: event.clientX, y1: event.clientY }))
  }
  async function onUp() {
    if (!drag) return
    const rect = {
      left: Math.min(drag.x0, drag.x1),
      top: Math.min(drag.y0, drag.y1),
      right: Math.max(drag.x0, drag.x1),
      bottom: Math.max(drag.y0, drag.y1),
    }
    rect.width = rect.right - rect.left
    rect.height = rect.bottom - rect.top
    setDrag(null)
    if (rect.width < 12 || rect.height < 12) {
      onCancel()
      return
    }
    const root = target?.current ?? target
    if (!root) {
      onCancel()
      return
    }
    setBusy(true)
    const quote = textInside(root, rect)
    let image = null
    try {
      // Drawing waits on image decoding, which a browser can stall (a
      // background tab, a slow image); the words alone are better than a
      // spinner that never ends.
      image = await Promise.race([
        pictureOf(root, rect),
        new Promise((resolve) => setTimeout(() => resolve(null), PICTURE_TIMEOUT_MS)),
      ])
    } catch {
      // A picture that cannot be drawn (a blocked image, say) still leaves
      // the words, which is enough for most questions.
    }
    setBusy(false)
    if (!quote && !image) {
      toast.error("Nothing readable there (videos and embedded frames can't be captured). Try a nearby area or select the text.")
      onCancel()
      return
    }
    onCapture(newSnippet({ quote: quote || null, image }))
  }

  const box = drag && {
    left: Math.min(drag.x0, drag.x1),
    top: Math.min(drag.y0, drag.y1),
    width: Math.abs(drag.x1 - drag.x0),
    height: Math.abs(drag.y1 - drag.y0),
  }

  return createPortal(
    <div
      ref={overlayRef}
      role="dialog"
      aria-label="Snip part of the lesson"
      className="fixed inset-0 z-[80] cursor-crosshair select-none"
      style={{ background: box ? "transparent" : "rgba(15, 23, 42, 0.28)", touchAction: "none" }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
    >
      {box ? (
        <div
          className="pointer-events-none absolute border-2 border-rb-feather bg-rb-feather/10"
          // Everything outside the box stays dimmed while dragging.
          style={{ ...box, boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.28)" }}
        />
      ) : null}

      <div
        className="absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-2 rounded-full bg-rb-eel px-4 py-2 text-sm font-semibold text-white shadow-lg"
        onPointerDown={(event) => event.stopPropagation()}
      >
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Capturing…
          </>
        ) : (
          <>
            <Sparkles className="size-4" aria-hidden="true" />
            Drag over the part you want explained
            <button
              type="button"
              onClick={onCancel}
              aria-label="Cancel snip"
              className="ml-1 grid size-6 place-items-center rounded-full hover:bg-white/15"
            >
              <X className="size-3.5" />
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}

/**
 * While text inside `target` is selected, a small "Ask AI tutor" button sits
 * just above the selection; clicking it hands the text over as a snippet.
 */
export function SelectionAskButton({ target, onAsk }) {
  const [anchor, setAnchor] = useState(null)

  useEffect(() => {
    function update() {
      const selection = window.getSelection()
      const root = target?.current
      const text = selection?.toString().trim() ?? ""
      if (!root || !selection?.rangeCount || text.length < 3 || !root.contains(selection.anchorNode)) {
        setAnchor(null)
        return
      }
      const rect = selection.getRangeAt(0).getBoundingClientRect()
      setAnchor({ text: text.slice(0, MAX_QUOTE), left: rect.left + rect.width / 2, top: rect.top })
    }
    const onUp = () => setTimeout(update, 0)
    const onScroll = () => setAnchor(null)
    document.addEventListener("mouseup", onUp)
    document.addEventListener("keyup", onUp)
    document.addEventListener("scroll", onScroll, true)
    return () => {
      document.removeEventListener("mouseup", onUp)
      document.removeEventListener("keyup", onUp)
      document.removeEventListener("scroll", onScroll, true)
    }
  }, [target])

  if (!anchor) return null
  return createPortal(
    <button
      type="button"
      // Keeps the selection alive through the click.
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => {
        onAsk(newSnippet({ quote: anchor.text }))
        window.getSelection()?.removeAllRanges()
        setAnchor(null)
      }}
      className="fixed z-[75] flex -translate-x-1/2 -translate-y-full items-center gap-1.5 rounded-full bg-rb-feather px-3 py-1.5 text-xs font-bold text-white shadow-lg transition-transform hover:scale-105"
      style={{ left: anchor.left, top: Math.max(anchor.top - 8, 8) }}
    >
      <Sparkles className="size-3.5" aria-hidden="true" />
      Ask AI tutor
    </button>,
    document.body,
  )
}
