import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { toCanvas } from "html-to-image"
import { toast } from "sonner"

import { Loader2, Sparkles, X } from "@/components/icons"


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
      if (node.alt && intersects(node.getBoundingClientRect(), rect)) parts.push(`[Image: ${node.alt}]`)
      continue
    }
    range.selectNodeContents(node)
    if ([...range.getClientRects()].some((box) => intersects(box, rect))) parts.push(node.textContent.trim())
  }
  return parts.join(" ").replace(/\s+/g, " ").trim().slice(0, MAX_QUOTE)
}

function touchesNoSnip(rect) {
  return [...document.querySelectorAll("[data-no-snip]")].some((el) => intersects(el.getBoundingClientRect(), rect))
}

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

async function pictureOf(root, rect) {
  const node = containerOf(root, rect)
  const box = node.getBoundingClientRect()
  const scale = box.width * box.height > 4_000_000 ? 1 : Math.min(window.devicePixelRatio || 1, 2)
  const full = await toCanvas(node, {
    pixelRatio: scale,
    backgroundColor: "#ffffff",
    imagePlaceholder: TRANSPARENT_PIXEL,
    cacheBust: true,
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
  if (isBlank(out)) return null
  return out.toDataURL("image/jpeg", 0.85)
}

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
    if (touchesNoSnip(rect)) {
      toast.error("Quizzes and checks can't be sent to the AI tutor.")
      onCancel()
      return
    }
    setBusy(true)
    const quote = textInside(root, rect)
    let image = null
    try {
      image = await Promise.race([
        pictureOf(root, rect),
        new Promise((resolve) => setTimeout(() => resolve(null), PICTURE_TIMEOUT_MS)),
      ])
    } catch {
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

export function SelectionAskButton({ target, onAsk }) {
  const [anchor, setAnchor] = useState(null)

  useEffect(() => {
    function update() {
      const selection = window.getSelection()
      const root = target?.current
      const text = selection?.toString().trim() ?? ""
      const node = selection?.anchorNode
      const inNoSnip = (node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement)?.closest("[data-no-snip]")
      if (!root || !selection?.rangeCount || text.length < 3 || !root.contains(node) || inNoSnip) {
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
