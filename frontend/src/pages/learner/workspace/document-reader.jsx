import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

import {
  ChevronDown,
  ChevronUpIcon,
  Download,
  FileText,
  Loader2,
  Maximize,
  Minimize2Icon,
  Minus,
  Plus,
  RefreshCw,
  Trash2,
} from "@/components/icons"

/**
 * The document reader, laid out the way Scribd reads a file.
 *
 * <p>A light room, not a dark one: a warm grey ground with every page as its own
 * white sheet stacked down the middle, an info panel on the left saying what
 * the document is, and one toolbar across the top for download, paging and
 * zoom. Every kind of file is read the same way:
 *
 * <ul>
 *   <li><b>PDF</b> — drawn by pdf.js onto canvases, one per page. The browser's
 *       own PDF viewer is dark and cannot be restyled, which is why it is not
 *       used. Pages draw as they come near the screen and let their pixels go
 *       once they are far away, so a 400-page book does not hold 400 bitmaps.</li>
 *   <li><b>Word</b> — converted to HTML with mammoth, then laid out onto
 *       letter-sized sheets: each block is measured and packed until the next
 *       one would spill past the bottom margin.</li>
 *   <li><b>TXT</b> — paragraphs packed onto the same sheets.</li>
 *   <li><b>Images</b> — shown whole as a single page, fitted to the room and
 *       zoomed like a PDF page.</li>
 * </ul>
 *
 * <p>pdf.js and mammoth are both imported only when a file of their kind is
 * opened, so neither weighs on any other page.
 */

const ZOOM_STEPS = [0.5, 0.75, 0.9, 1, 1.15, 1.35, 1.6, 2]

/** A letter-sized sheet at 96dpi, and its inch margins. */
const SHEET_WIDTH = 816
const SHEET_HEIGHT = 1056
const SHEET_PADDING = 84

/** The widest a PDF page is drawn at 100%. */
const PDF_MAX_WIDTH = 880

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp"]

function fileExtension(name) {
  const dot = name.lastIndexOf(".")
  return dot === -1 ? "" : name.slice(dot).toLowerCase()
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return null
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c])
}

/** Plain text as paragraphs the sheet packer can measure. */
function textToHtml(text) {
  return (text ?? "")
    .split(/\n{2,}/)
    .filter((paragraph) => paragraph.trim())
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("")
}

/** Tracks the width of an element, for fitting pages to the room they have. */
function useElementWidth(ref) {
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return undefined
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(node)
    setWidth(node.clientWidth)
    return () => observer.disconnect()
  }, [ref])
  return width
}

/* ------------------------------------------------------------------ PDF --- */

/**
 * Opens a PDF with pdf.js. The URL is tried first so a large file streams in
 * ranges; if that is refused (a storage bucket without CORS for this origin),
 * the file's bytes are asked for instead.
 */
function usePdfDocument(file, enabled) {
  const [state, setState] = useState({ status: "idle" })

  useEffect(() => {
    if (!enabled) return undefined
    let cancelled = false
    // In pdf.js the loading task, not the document, is what closes the worker.
    let task = null
    setState({ status: "loading" })

    async function open() {
      const [pdfjs, worker] = await Promise.all([
        import("pdfjs-dist"),
        import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
      ])
      if (cancelled) throw new Error("cancelled")
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default

      const common = { useSystemFonts: true, isEvalSupported: false }
      let doc
      try {
        task = pdfjs.getDocument({ ...common, url: file.previewUrl })
        doc = await task.promise
      } catch {
        task?.destroy()
        if (cancelled) throw new Error("cancelled")
        const bytes = await file.arrayBuffer()
        if (!bytes || bytes.byteLength === 0) throw new Error("empty")
        if (cancelled) throw new Error("cancelled")
        task = pdfjs.getDocument({ ...common, data: new Uint8Array(bytes) })
        doc = await task.promise
      }
      const first = await doc.getPage(1)
      const viewport = first.getViewport({ scale: 1 })
      return { doc, pageCount: doc.numPages, ratio: viewport.height / viewport.width }
    }

    open().then(
      (result) => !cancelled && setState({ status: "ready", ...result }),
      () => !cancelled && setState({ status: "error" })
    )

    return () => {
      cancelled = true
      task?.destroy()
    }
  }, [file, enabled])

  return state
}

/** One PDF page: a white sheet that draws itself when it nears the screen. */
function PdfPage({ doc, number, width, ratio, rootRef }) {
  const holderRef = useRef(null)
  const canvasRef = useRef(null)
  const [near, setNear] = useState(false)
  const [pageRatio, setPageRatio] = useState(ratio)
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    const node = holderRef.current
    if (!node) return undefined
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
      root: rootRef.current,
      rootMargin: "1200px 0px",
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [rootRef])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    if (!near || width <= 0) {
      // Far away: give the bitmap back.
      canvas.width = 0
      canvas.height = 0
      setDrawn(false)
      return undefined
    }

    let task = null
    let cancelled = false
    doc.getPage(number).then((page) => {
      if (cancelled) return
      const base = page.getViewport({ scale: 1 })
      const scale = width / base.width
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const viewport = page.getViewport({ scale: scale * dpr })
      setPageRatio(base.height / base.width)
      const buffer = document.createElement("canvas")
      buffer.width = Math.floor(viewport.width)
      buffer.height = Math.floor(viewport.height)
      task = page.render({ canvas: buffer, viewport })
      task.promise.then(
        () => {
          if (cancelled) return
          // Drawn off screen and copied in whole, so a zoom never shows a
          // half-painted page over the old one.
          canvas.width = buffer.width
          canvas.height = buffer.height
          canvas.getContext("2d").drawImage(buffer, 0, 0)
          setDrawn(true)
        },
        () => {}
      )
    })

    return () => {
      cancelled = true
      task?.cancel()
    }
  }, [doc, number, near, width])

  return (
    <div data-page={number} ref={holderRef} className="rb-reader-page-slot">
      <div className="rb-reader-sheet" style={{ width, height: Math.round(width * pageRatio) }}>
        <canvas ref={canvasRef} className="block size-full" aria-label={`Page ${number}`} />
        {!drawn ? (
          <span className="rb-reader-sheet-wait" aria-hidden="true">
            <Loader2 className="size-5 animate-spin" />
          </span>
        ) : null}
      </div>
      <p className="rb-reader-page-number">{number}</p>
    </div>
  )
}

/* ------------------------------------------------------- Word and text --- */

/**
 * Packs a document's blocks onto sheets. Each top-level block is measured in an
 * invisible sheet of the real width; a block joins the current sheet until it
 * would pass the bottom margin. One block taller than a whole sheet gets a
 * sheet of its own and lets it grow.
 */
function useSheets(html) {
  const measureRef = useRef(null)
  const [sheets, setSheets] = useState(null)

  useLayoutEffect(() => {
    setSheets(null)
  }, [html])

  useLayoutEffect(() => {
    if (html === null || sheets !== null) return
    const node = measureRef.current
    if (!node) return
    const blocks = [...node.children]
    const room = SHEET_HEIGHT - SHEET_PADDING * 2
    const packed = []
    let current = []
    let top = 0

    blocks.forEach((block, index) => {
      const next = blocks[index + 1]
      const start = block.offsetTop
      const end = next ? next.offsetTop : node.scrollHeight
      if (current.length === 0) top = start
      if (current.length > 0 && end - top > room) {
        packed.push(current)
        current = []
        top = start
      }
      current.push(block.outerHTML)
    })
    if (current.length > 0) packed.push(current)
    setSheets(packed.length > 0 ? packed.map((parts) => parts.join("")) : [""])
  }, [html, sheets])

  const measurer =
    html !== null && sheets === null ? (
      <div
        ref={measureRef}
        className="rb-docx rb-reader-flow"
        aria-hidden="true"
        style={{
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
          left: -99999,
          top: 0,
          width: SHEET_WIDTH - SHEET_PADDING * 2,
        }}
        // mammoth's own output (a fixed set of semantic tags, no scripts) or
        // text this component escaped itself.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    ) : null

  return { sheets, measurer }
}

/* -------------------------------------------------------------- reader --- */

export function DocumentReader({ file, onReplace, onRemove, back }) {
  const extension = fileExtension(file.name)
  const isPdf = extension === ".pdf"
  const isText = extension === ".txt"
  const isWord = extension === ".docx" || extension === ".doc"
  const isImage = IMAGE_EXTENSIONS.includes(extension)
  const typeLabel = extension.replace(".", "").toUpperCase() || "FILE"

  const frameRef = useRef(null)
  const scrollRef = useRef(null)
  const roomWidth = useElementWidth(scrollRef)

  const [zoomIndex, setZoomIndex] = useState(ZOOM_STEPS.indexOf(1))
  const [page, setPage] = useState(1)
  const [pageDraft, setPageDraft] = useState(null)
  const [fullscreen, setFullscreen] = useState(false)
  const zoom = ZOOM_STEPS[zoomIndex]

  /* ---- content */
  const pdf = usePdfDocument(file, isPdf)
  const [html, setHtml] = useState(null)
  const [flowError, setFlowError] = useState(null)

  useEffect(() => {
    if (!isText && !isWord) return undefined
    let cancelled = false
    setHtml(null)
    setFlowError(null)

    const read = isText
      ? file.text().then(textToHtml)
      : Promise.all([import("mammoth/mammoth.browser"), file.arrayBuffer()])
          .then(([mammoth, buffer]) => mammoth.convertToHtml({ arrayBuffer: buffer }))
          .then(({ value }) => value)

    read.then(
      (value) => !cancelled && setHtml(value),
      () =>
        !cancelled &&
        setFlowError(isWord ? "This Word document could not be read." : "This file could not be read.")
    )
    return () => {
      cancelled = true
    }
  }, [file, isText, isWord])

  const { sheets, measurer } = useSheets(html)

  const [imageError, setImageError] = useState(false)
  useEffect(() => setImageError(false), [file])

  const pageCount = isImage
    ? 1
    : isPdf
    ? pdf.status === "ready"
      ? pdf.pageCount
      : null
    : sheets
      ? sheets.length
      : null

  /* ---- sizing: fit the room, then zoom */
  const gutter = roomWidth < 640 ? 24 : 64
  const available = Math.max(roomWidth - gutter, 200)
  const pdfWidth = Math.round(Math.min(available, PDF_MAX_WIDTH) * zoom)
  const sheetScale = Math.min(1, available / SHEET_WIDTH) * zoom

  /* ---- paging */
  const updateCurrentPage = useCallback(() => {
    const room = scrollRef.current
    if (!room) return
    const slots = room.querySelectorAll("[data-page]")
    if (slots.length === 0) return
    const line = room.scrollTop + room.clientHeight * 0.35
    let low = 0
    let high = slots.length - 1
    while (low < high) {
      const mid = Math.ceil((low + high) / 2)
      if (slots[mid].offsetTop <= line) low = mid
      else high = mid - 1
    }
    setPage(Number(slots[low].dataset.page))
  }, [])

  useEffect(() => {
    const room = scrollRef.current
    if (!room) return undefined
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(updateCurrentPage)
    }
    room.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      room.removeEventListener("scroll", onScroll)
    }
  }, [updateCurrentPage])

  const goTo = useCallback(
    (target) => {
      if (!pageCount) return
      const number = Math.min(Math.max(Math.round(target), 1), pageCount)
      const slot = scrollRef.current?.querySelector(`[data-page="${number}"]`)
      if (slot) scrollRef.current.scrollTo({ top: slot.offsetTop - 20, behavior: "smooth" })
      setPage(number)
    },
    [pageCount]
  )

  /* ---- zoom keeps the page you were on */
  const keepPageRef = useRef(null)
  const zoomTo = (index) => {
    keepPageRef.current = page
    setZoomIndex(index)
  }
  // After the pages have re-laid out at the new size, not before.
  useLayoutEffect(() => {
    const keep = keepPageRef.current
    if (keep === null) return
    keepPageRef.current = null
    const slot = scrollRef.current?.querySelector(`[data-page="${keep}"]`)
    if (slot) scrollRef.current.scrollTop = slot.offsetTop - 20
  }, [zoomIndex])

  /* ---- fullscreen follows the document, which Escape can also leave */
  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === frameRef.current)
    document.addEventListener("fullscreenchange", sync)
    return () => document.removeEventListener("fullscreenchange", sync)
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else frameRef.current?.requestFullscreen?.()
  }

  const size = formatBytes(file.size)
  const loading =
    (isPdf && (pdf.status === "loading" || pdf.status === "idle")) ||
    ((isText || isWord) && !flowError && sheets === null)
  const failed =
    (isPdf && pdf.status === "error") ||
    Boolean(flowError) ||
    (isImage && imageError) ||
    (!isPdf && !isText && !isWord && !isImage)

  const pageNumbers = useMemo(
    () => (pageCount ? Array.from({ length: pageCount }, (_, i) => i + 1) : []),
    [pageCount]
  )

  return (
    <div ref={frameRef} className="rb-reader">
      {/* ---- toolbar */}
      <header className="rb-reader-bar">
        <div className="flex min-w-0 items-center gap-3">
          {back ?? null}
          <div className="min-w-0 lg:hidden">
            <p className="truncate text-sm font-extrabold">{file.name}</p>
            <p className="rb-reader-muted text-xs font-bold">
              {[typeLabel, pageCount ? `${pageCount} pages` : null].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <a href={file.previewUrl} download={file.name} className="rb-reader-download">
            <Download className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Download</span>
          </a>

          <span className="rb-reader-divider" aria-hidden="true" />

          <div className="flex items-center gap-1" role="group" aria-label="Pages">
            <ToolButton label="Previous page" onClick={() => goTo(page - 1)} disabled={!pageCount || page <= 1}>
              <ChevronUpIcon className="size-4" />
            </ToolButton>
            <input
              value={pageDraft ?? (pageCount ? page : "–")}
              onChange={(event) => setPageDraft(event.target.value.replace(/\D/g, ""))}
              onBlur={() => {
                if (pageDraft) goTo(Number(pageDraft))
                setPageDraft(null)
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur()
              }}
              disabled={!pageCount}
              aria-label="Page number"
              className="rb-reader-page-input"
            />
            <span className="rb-reader-muted text-sm font-bold">/ {pageCount ?? "–"}</span>
            <ToolButton label="Next page" onClick={() => goTo(page + 1)} disabled={!pageCount || page >= pageCount}>
              <ChevronDown className="size-4" />
            </ToolButton>
          </div>

          <span className="rb-reader-divider hidden sm:block" aria-hidden="true" />

          <div className="hidden items-center gap-1 sm:flex" role="group" aria-label="Zoom">
            <ToolButton label="Zoom out" onClick={() => zoomTo(Math.max(0, zoomIndex - 1))} disabled={zoomIndex === 0}>
              <Minus className="size-4" />
            </ToolButton>
            <span className="w-12 text-center text-sm font-bold tabular-nums">{Math.round(zoom * 100)}%</span>
            <ToolButton
              label="Zoom in"
              onClick={() => zoomTo(Math.min(ZOOM_STEPS.length - 1, zoomIndex + 1))}
              disabled={zoomIndex === ZOOM_STEPS.length - 1}
            >
              <Plus className="size-4" />
            </ToolButton>
          </div>

          <ToolButton label={fullscreen ? "Exit full screen" : "Read full screen"} onClick={toggleFullscreen}>
            {fullscreen ? <Minimize2Icon className="size-4" /> : <Maximize className="size-4" />}
          </ToolButton>

          {/* The uploader's own controls; a shared file has neither. */}
          {onReplace ? (
            <ToolButton label="Replace this file" onClick={onReplace}>
              <RefreshCw className="size-4" />
            </ToolButton>
          ) : null}
          {onRemove ? (
            <ToolButton label="Remove this file" onClick={onRemove}>
              <Trash2 className="size-4" />
            </ToolButton>
          ) : null}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* ---- info panel */}
        <aside className="rb-reader-info" aria-label="About this document">
          <div className="rb-reader-cover" aria-hidden="true">
            <FileText className="size-8" />
            <span className="rb-reader-type">{typeLabel}</span>
          </div>

          <h1 className="rb-reader-title">{file.name.replace(/\.[^.]+$/, "")}</h1>

          {file.uploader ? (
            <p className="rb-reader-muted mt-2 text-sm font-semibold">
              Shared by <span className="rb-reader-strong">{file.uploader}</span>
              {file.circle ? <> in {file.circle}</> : null}
            </p>
          ) : null}

          <dl className="rb-reader-facts">
            <div>
              <dt>Pages</dt>
              <dd>{pageCount ?? "…"}</dd>
            </div>
            <div>
              <dt>Format</dt>
              <dd>{typeLabel}</dd>
            </div>
            {size ? (
              <div>
                <dt>Size</dt>
                <dd>{size}</dd>
              </div>
            ) : null}
          </dl>

          {file.description ? <p className="rb-reader-description">{file.description}</p> : null}

          {pageNumbers.length > 1 ? (
            <nav className="mt-6" aria-label="Jump to page">
              <p className="rb-reader-label">Jump to page</p>
              <div className="rb-reader-jump">
                {pageNumbers.map((number) => (
                  <button
                    key={number}
                    type="button"
                    onClick={() => goTo(number)}
                    aria-current={number === page ? "page" : undefined}
                  >
                    {number}
                  </button>
                ))}
              </div>
            </nav>
          ) : null}
        </aside>

        {/* ---- pages */}
        <div ref={scrollRef} className="rb-reader-room">
          {loading ? (
            <div className="rb-reader-state">
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              Opening your document…
            </div>
          ) : failed ? (
            <div className="rb-reader-state">
              <div className="rb-reader-sheet grid max-w-md place-items-center p-10 text-center" style={{ width: "100%" }}>
                <FileText className="rb-reader-muted size-8" aria-hidden="true" />
                <p className="mt-4 text-base font-extrabold">{file.name}</p>
                <p className="rb-reader-muted mt-2 text-sm font-medium leading-6">
                  {flowError ??
                    (isPdf
                      ? "This PDF could not be shown here. Download it to read it."
                      : isImage
                        ? "This image could not be shown here. Download it to see it."
                        : "This file type has no preview. Download it to read it.")}
                </p>
                <a href={file.previewUrl} download={file.name} className="rb-reader-download mt-5">
                  <Download className="size-4" aria-hidden="true" />
                  Download
                </a>
              </div>
            </div>
          ) : isImage ? (
            <div className="rb-reader-stack">
              <div data-page="1" className="rb-reader-page-slot">
                <img
                  src={file.previewUrl}
                  alt={file.name}
                  onError={() => setImageError(true)}
                  className="rb-reader-sheet block h-auto"
                  style={{ width: pdfWidth, maxWidth: "none" }}
                />
              </div>
            </div>
          ) : isPdf ? (
            <div className="rb-reader-stack">
              {pageNumbers.map((number) => (
                <PdfPage
                  key={number}
                  doc={pdf.doc}
                  number={number}
                  width={pdfWidth}
                  ratio={pdf.ratio}
                  rootRef={scrollRef}
                />
              ))}
            </div>
          ) : (
            <div className="rb-reader-stack">
              {sheets.map((sheet, index) => (
                <div key={index} data-page={index + 1} className="rb-reader-page-slot">
                  <div
                    className="rb-reader-sheet"
                    style={{
                      width: SHEET_WIDTH * sheetScale,
                      minHeight: SHEET_HEIGHT * sheetScale,
                    }}
                  >
                    <div
                      className="rb-docx rb-reader-flow"
                      style={{
                        width: SHEET_WIDTH,
                        minHeight: SHEET_HEIGHT,
                        padding: SHEET_PADDING,
                        zoom: sheetScale,
                      }}
                      dangerouslySetInnerHTML={{ __html: sheet }}
                    />
                  </div>
                  <p className="rb-reader-page-number">{index + 1}</p>
                </div>
              ))}
            </div>
          )}
          {measurer}
        </div>
      </div>
    </div>
  )
}

function ToolButton({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="rb-reader-tool"
    >
      {children}
    </button>
  )
}
