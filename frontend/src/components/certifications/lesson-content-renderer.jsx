import { createPortal } from "react-dom"
import { useEffect, useId, useRef, useState } from "react"
import { motion } from "framer-motion"
import { fetchFileBlob, getFileViewLink } from "@/services/fileService.js"
import { parseLessonStructure } from "@/services/learnerService.js"
import { Check, Copy, ImageIcon, Maximize, RotateCcw, X } from "@/components/icons"
import { Light as SyntaxHighlighter } from "react-syntax-highlighter"
import { CODE_LANGUAGES, registerCodeLanguages } from "./code-languages.js"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


const EASE = [0.22, 1, 0.36, 1]

// Every block uses the game kit's green (the --tg variables of tg-cat-explain,
// set on each tool's wrapper). Washes are translucent so they also read on the
// solid-green "statement" sections. Class names stay literal for Tailwind's scanner.
const SOFT = "bg-[color-mix(in_oklab,var(--tg)_9%,transparent)]"

const ACCENTS = [
  { text: "!text-[var(--tg-ink)]", marker: "marker:!text-[var(--tg)]", border: "!border-[var(--tg)]", bgSolid: "!bg-[var(--tg)]", bgSoft: "!bg-[color-mix(in_oklab,var(--tg)_9%,transparent)]" },
]

function accentFor(index) {
  return ACCENTS[((index % ACCENTS.length) + ACCENTS.length) % ACCENTS.length]
}

const RB_PILL_ACTIVE =
  "data-[state=active]:!border-[var(--tg)] data-[state=active]:!bg-[var(--tg)] data-[state=active]:!text-white"

const RB_CARD = "overflow-hidden rounded-2xl border border-[var(--tg-line)] bg-card"

const RB_INDEX_CHIP =
  "grid size-9 shrink-0 place-items-center rounded-xl tg-solid-soft font-rb-display text-sm font-extrabold text-white"

function isDirectMediaSrc(key) {
  return Boolean(key) && (/^https?:\/\//.test(key) || key.startsWith("/"))
}

function ImageAttribution({ sourceUrl, sourceName }) {
  if (!sourceUrl) return null

  let label = sourceName
  if (!label) {
    try {
      label = new URL(sourceUrl).hostname.replace(/^www\./, "")
    } catch {
      label = sourceUrl
    }
  }

  return (
      <p className="mt-1.5 text-center text-xs text-muted-foreground">
        Source:{" "}
        <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted underline-offset-2 hover:text-foreground"
        >
          {label}
        </a>
      </p>
  )
}


// The same full-screen viewer as a tutor snip: dark backdrop, the media large and
// unframed, closed by clicking outside, Escape, or the "close" pill.
function MediaViewer({ label, ownerId, onClose, children }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  return createPortal(
      <div
          role="dialog"
          data-live-media-owner={ownerId}
          aria-modal="true"
          aria-label={label}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      >
        <div onClick={(event) => event.stopPropagation()} className="cursor-default">
          {children}
        </div>
        <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            data-live-media-close=""
            className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-sm font-bold text-rb-eel shadow-lg"
        >
          close
        </button>
      </div>,
      document.body,
  )
}

function LessonImage({ imageKey, alt = "", className, sourceUrl, sourceName }) {
  const [open, setOpen] = useState(false)
  // Hotlinked pictures can be refused by their host; show a tidy notice, not a broken icon.
  const [failed, setFailed] = useState(false)
  const mediaId = useId()

  const youTubeEmbed = getYouTubeEmbedUrl(sourceUrl) ?? getYouTubeEmbedUrl(imageKey)
  if (youTubeEmbed) {
    return (
        <div>
          <VideoBlock videoKey={sourceUrl || imageKey} className={className} />
          <ImageAttribution sourceUrl={sourceUrl} sourceName={sourceName} />
        </div>
    )
  }

  const src = useAuthedMediaSrc(imageKey)

  if (imageKey && !src) {
    return (
        <div
            className="aspect-video w-full rounded-[var(--radius-rb-tile)] bg-muted/60 motion-safe:animate-pulse"
            aria-label={alt ? `Loading ${alt}` : "Loading image"}
            role="img"
        />
    )
  }

  if (failed) {
    return (
        <div className="tg-cat-explain mx-auto flex w-full max-w-xl flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[var(--tg-line)] bg-[var(--tg-softer)] px-6 py-8 text-center">
          <span className="tg-badge-icon"><ImageIcon className="size-4" aria-hidden="true" /></span>
          <p className="text-sm font-bold text-foreground">{alt && alt !== "Lesson image" ? alt : "This picture could not load"}</p>
          <p className="text-xs text-muted-foreground">Its website did not let REBYU show it here.</p>
          {sourceUrl ? (
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="tg-btn mt-1 !rounded-full !px-3 !py-1 !text-xs">
                Open it on {sourceName || "the source site"}
              </a>
          ) : null}
        </div>
    )
  }

  return (
      <div>
        <button
            type="button"
            onClick={() => setOpen(true)}
            data-live-image-trigger=""
            data-live-media-id={mediaId}
            aria-expanded={open}
            aria-label={alt ? `View "${alt}" full size` : "View image full size"}
            className="group relative mx-auto block w-fit max-w-full cursor-zoom-in rounded-[var(--radius-rb-tile)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />
          <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-[var(--radius-rb-tile)] bg-foreground/0 transition-colors group-hover:bg-foreground/5"
          />
        </button>

        <ImageAttribution sourceUrl={sourceUrl} sourceName={sourceName} />

        {open ? (
            <MediaViewer label={alt || "Lesson image"} ownerId={mediaId} onClose={() => setOpen(false)}>
              <img
                  src={src}
                  alt={alt}
                  className="max-h-[88vh] max-w-[92vw] rounded-lg bg-white object-contain shadow-2xl"
              />
            </MediaViewer>
        ) : null}
      </div>
  )
}

function getYouTubeEmbedUrl(url) {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`
    }
    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v")
      if (videoId) return `https://www.youtube.com/embed/${videoId}`
    }
    if (parsed.hostname.endsWith("ytimg.com")) {
      const [, vi, videoId] = parsed.pathname.split("/")
      if (vi === "vi" && videoId) return `https://www.youtube.com/embed/${videoId}`
    }
  } catch {
    return null
  }
  return null
}

function VideoBlock({ videoKey, className }) {
  const [expanded, setExpanded] = useState(false)
  const mediaId = useId()
  const src = useStreamedMediaSrc(videoKey)

  if (!videoKey) return null

  if (!src) {
    return (
        <div
            className={`${className} !border-dashed motion-safe:animate-pulse`}
            aria-label="Loading video"
        />
    )
  }

  const embedUrl = getYouTubeEmbedUrl(src)
  const player = (playerClassName) =>
      embedUrl ? (
          <iframe
              src={embedUrl}
              title="Lesson video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className={playerClassName}
          />
      ) : (
          <video controls className={playerClassName} src={src} />
      )

  return (
      <div className="relative">
        {expanded ? (
            <div
                className={`${className} grid place-items-center text-sm text-muted-foreground`}
                aria-hidden="true"
            >
              Playing full size
            </div>
        ) : (
            player(className)
        )}

        <button
            type="button"
            onClick={() => setExpanded(true)}
            data-live-video-trigger=""
            data-live-media-id={mediaId}
            aria-expanded={expanded}
            aria-label="View video full size"
            className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full border-2 border-border/70 bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Maximize className="size-4" />
        </button>

        {expanded ? (
            <MediaViewer label="Lesson video" ownerId={mediaId} onClose={() => setExpanded(false)}>
              {player("aspect-video w-[min(92vw,calc(88vh*16/9))] rounded-lg bg-black shadow-2xl")}
            </MediaViewer>
        ) : null}
      </div>
  )
}

function renderText(text, className) {
  return String(text ?? "")
      .split("\n")
      .filter(Boolean)
      .map((line, index) => (
          <p key={`${line}-${index}`} className={className}>
            {line}
          </p>
      ))
}

function TableBlock({ data, accent = ACCENTS[0] }) {
  const columns = Array.isArray(data.columns) ? data.columns : []
  const rows = Array.isArray(data.rows) ? data.rows : []
  if (columns.length === 0 || rows.length === 0) return null

  const rowHeaders = data.rowHeaders !== false

  return (
      <div className="space-y-4">
        <SectionIntro
            smallHeader={data.smallHeader}
            description={data.description}
            accent={accent}
        />

        <div
            className="overflow-x-auto rounded-2xl border border-[var(--tg-line)] bg-card"
            tabIndex={0}
            role="region"
            aria-label={data.caption ?? data.smallHeader ?? "Table"}
        >
          <table className="w-full min-w-[34rem] border-collapse text-left text-[15px]">
            {data.caption ? (
                <caption className="px-4 pt-3 pb-2 text-left text-sm text-muted-foreground">
                  {data.caption}
                </caption>
            ) : null}

            <thead>
              <tr className="bg-[var(--tg-softer)]">
                {columns.map((column, columnIndex) => (
                    <th
                        key={column.id ?? column.label ?? columnIndex}
                        scope="col"
                        className="border-b border-[var(--tg-line)] px-4 py-3 text-[12px] font-extrabold uppercase tracking-wider text-[var(--tg-ink)]"
                    >
                      {column.label ?? column}
                    </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, rowIndex) => {
                const cells = Array.isArray(row.cells) ? row.cells : row
                return (
                    <tr
                        key={row.id ?? rowIndex}
                        className={`border-b border-[var(--tg-line)] last:border-b-0 ${rowIndex % 2 ? SOFT : ""}`}
                    >
                      {cells.map((cell, cellIndex) =>
                          rowHeaders && cellIndex === 0 ? (
                              <th
                                  key={cellIndex}
                                  scope="row"
                                  className="px-4 py-3 align-top font-semibold text-foreground"
                              >
                                {cell}
                              </th>
                          ) : (
                              <td
                                  key={cellIndex}
                                  className="px-4 py-3 align-top text-foreground/85"
                              >
                                {cell}
                              </td>
                          )
                      )}
                    </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {data.footer ? (
            <p className="text-[15px] leading-7 text-muted-foreground">
              {data.footer}
            </p>
        ) : null}
      </div>
  )
}

registerCodeLanguages(SyntaxHighlighter)

function CodeBlock({ data, accent = ACCENTS[0] }) {
  const [copied, setCopied] = useState(false)
  const code = typeof data.code === "string" ? data.code.replace(/\s+$/, "") : ""
  if (!code) return null
  const language = CODE_LANGUAGES[data.language] ? data.language : "text"
  const label = CODE_LANGUAGES[language]?.label ?? "Code"

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
    }
  }

  return (
      <div className="space-y-4">
        <SectionIntro smallHeader={data.smallHeader} description={data.description} accent={accent} />

        <figure className="overflow-hidden rounded-2xl border border-[var(--tg-line)] bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--tg-line)] bg-[var(--tg-softer)] px-4 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="tg-chip">
                {label}
              </span>
              {data.title ? (
                  <span className="truncate font-mono text-[13px] text-muted-foreground">{data.title}</span>
              ) : null}
            </div>
            <button
                type="button"
                onClick={copy}
                className="tg-btn !rounded-full !px-2.5 !py-1 !text-xs"
                aria-live="polite"
            >
              {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={data.title ? `Code: ${data.title}` : `${label} code sample`}>
            <SyntaxHighlighter
                language={language}
                useInlineStyles={false}
                PreTag="pre"
                CodeTag="code"
                className="rb-code-sample"
                showLineNumbers={code.split("\n").length > 4}
                wrapLongLines={false}
            >
              {code}
            </SyntaxHighlighter>
          </div>

          {data.caption ? (
              <figcaption className="border-t border-[var(--tg-line)] px-4 py-2.5 text-sm text-muted-foreground">
                {data.caption}
              </figcaption>
          ) : null}
        </figure>
      </div>
  )
}

function SectionIntro({ smallHeader, description, accent = ACCENTS[0] }) {
  if (!smallHeader && !description) return null

  return (
      <div>
        {smallHeader ? (
            <p className={`tg-kicker !text-[12px] ${accent.text}`}>
              {smallHeader}
            </p>
        ) : null}
        {renderText(description, "mt-2 text-[17px] leading-8 text-foreground/85")}
      </div>
  )
}

function AccordionBlock({ items = [] }) {
  if (items.length === 0) return null

  return (
      <Accordion type="single" collapsible defaultValue={String(items[0]?.id ?? 0)} className="gap-3">
        {items.map((item, index) => {
          const id = String(item.id ?? index)
          return (
              <AccordionItem key={id} value={id} className={`${RB_CARD} transition data-[state=open]:border-[var(--tg)] data-[state=open]:shadow-[0_3px_0_var(--tg-line)]`}>
                <AccordionTrigger data-live-accordion={id} className="items-center gap-3 p-4 hover:no-underline">
                  <span className={RB_INDEX_CHIP} aria-hidden="true">
                    {index + 1}
                  </span>

                  <span className="min-w-0 flex-1 text-base font-bold text-foreground">
                    {item.title}
                  </span>
                </AccordionTrigger>

                <AccordionContent
                    className="border-t border-[var(--tg-line)] px-4 py-3 text-[15px] leading-7 text-foreground/80"
                >
                  {item.content ?? item.description}
                </AccordionContent>
              </AccordionItem>
          )
        })}
      </Accordion>
  )
}

function TabsBlock({ items = [] }) {
  if (items.length === 0) return null

  return (
      <Tabs defaultValue="0" className="gap-0">
        <TabsList className="w-full flex-wrap gap-2 border-b-0 bg-transparent p-0 group-data-horizontal/tabs:h-auto">
          {items.map((item, index) => {
            return (
                <TabsTrigger
                    data-live-tab={String(item.id ?? index)}
                    key={item.id ?? item.label ?? index}
                    value={String(index)}
                    className={`h-auto flex-1 rounded-full border border-[var(--tg-line)] bg-card px-3.5 py-2 text-sm font-bold text-muted-foreground after:hidden hover:text-[var(--tg-ink)] ${RB_PILL_ACTIVE}`}
                >
                  {item.label ?? item.title ?? `Tab ${index + 1}`}
                </TabsTrigger>
            )
          })}
        </TabsList>

        {items.map((item, index) => {
          return (
              <TabsContent
                  key={item.id ?? item.label ?? index}
                  value={String(index)}
                  className={`mt-3 ${RB_CARD}`}
              >
                <div className="flex items-center gap-3 p-4">
                  <span className={RB_INDEX_CHIP} aria-hidden="true">
                    {index + 1}
                  </span>

                  <span className="min-w-0 flex-1 text-base font-bold text-foreground">
                    {item.title ?? item.label}
                  </span>
                </div>

                <div
                    className="border-t border-[var(--tg-line)] px-4 py-3 text-[15px] leading-7 text-foreground/80"
                >
                  {item.description}
                </div>
              </TabsContent>
          )
        })}
      </Tabs>
  )
}

function FlipCard({ cardId, frontTitle, backTitle, description, accent = ACCENTS[0] }) {
  const [flipped, setFlipped] = useState(false)

  return (
      <button
          type="button"
          data-live-card={cardId ?? frontTitle ?? backTitle ?? "card"}
          data-live-card-face={flipped ? "back" : "front"}
          onClick={() => setFlipped((value) => !value)}
          aria-label={`${frontTitle}. Press to ${flipped ? "show front" : "reveal detail"}.`}
          className="group block h-48 w-full text-left [perspective:1200px]"
      >
        <motion.div
            className="relative h-full w-full [transform-style:preserve-3d]"
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.5, ease: EASE }}
        >
          <div className="absolute inset-0 flex h-full flex-col justify-between rounded-2xl border border-[var(--tg-line)] bg-card p-5 shadow-[0_3px_0_var(--tg-line)] transition group-hover:border-[var(--tg)] [backface-visibility:hidden]">
            <p className="text-lg font-bold leading-snug text-foreground">{frontTitle}</p>
            <span className="inline-flex items-center gap-1.5 self-start text-xs font-bold text-[var(--tg-ink)]">
              <span className="tg-badge-icon !size-7 !rounded-lg"><RotateCcw className="size-3.5" aria-hidden="true" /></span>
              Tap to flip
            </span>
          </div>

          <div
              className="absolute inset-0 flex h-full flex-col justify-center overflow-y-auto rounded-2xl tg-solid p-5 text-white shadow-[0_3px_0_color-mix(in_oklab,var(--tg)_55%,#000)] [backface-visibility:hidden]"
              style={{ transform: "rotateY(180deg)" }}
          >
            {/* The answer may live in backTitle (with no description) or in description. */}
            {backTitle && backTitle !== frontTitle ? (
              <>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-white/70">{frontTitle}</p>
                <p className="mt-1.5 text-lg font-bold leading-snug text-white">{backTitle}</p>
              </>
            ) : (
              <p className="font-bold text-white">{frontTitle ?? backTitle}</p>
            )}
            {description ? <p className="mt-2 text-[15px] leading-6 text-white/90">{description}</p> : null}
          </div>
        </motion.div>
      </button>
  )
}

function useAuthedMediaSrc(key) {
  const isDirect = isDirectMediaSrc(key)
  const [blobSrc, setBlobSrc] = useState("")

  useEffect(() => {
    if (!key || isDirect) {
      setBlobSrc("")
      return
    }

    let cancelled = false
    let objectUrl = ""

    fetchFileBlob(key)
        .then((blob) => {
          if (cancelled) return
          objectUrl = URL.createObjectURL(blob)
          setBlobSrc(objectUrl)
        })
        .catch(() => {
          if (!cancelled) setBlobSrc("")
        })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [key, isDirect])

  return isDirect ? key : blobSrc
}

function useStreamedMediaSrc(key) {
  const isDirect = isDirectMediaSrc(key)
  const [signedSrc, setSignedSrc] = useState("")

  useEffect(() => {
    if (!key || isDirect) {
      setSignedSrc("")
      return undefined
    }

    let cancelled = false
    getFileViewLink(key)
        .then(({ url }) => {
          if (!cancelled) setSignedSrc(url)
        })
        .catch(() => {
          if (!cancelled) setSignedSrc("")
        })

    return () => {
      cancelled = true
    }
  }, [key, isDirect])

  return isDirect ? key : signedSrc
}

function ImageHotspotBlock({ data, accent }) {
  const hotspots = Array.isArray(data.hotspots) ? data.hotspots : []
  const [openId, setOpenId] = useState(null)
  const [visitedIds, setVisitedIds] = useState(() => new Set())

  const src = useAuthedMediaSrc(data.imageKey)
  const popoverRef = useRef(null)

  function toggleHotspot(hotspotId, isOpen) {
    setOpenId(isOpen ? null : hotspotId)

    if (!isOpen) {
      setVisitedIds((previous) =>
          previous.has(hotspotId) ? previous : new Set(previous).add(hotspotId)
      )
    }
  }

  useEffect(() => {
    if (openId == null) return undefined

    function handlePointerDown(event) {
      if (popoverRef.current?.contains(event.target)) return
      if (event.target.closest?.("[data-hotspot-pin]")) return
      setOpenId(null)
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") setOpenId(null)
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [openId])
  const openIndex = hotspots.findIndex((hotspot, index) => (hotspot.id ?? index) === openId)
  const openHotspot = openIndex === -1 ? null : hotspots[openIndex]

  if (!data.imageKey) {
    return null
  }

  return (
      <div className="space-y-4">
        <SectionIntro smallHeader={data.smallHeader} description={data.description} accent={accent} />

        <div className="flex justify-center rounded-2xl border border-[var(--tg-line)] bg-[var(--tg-softer)] p-2">
          {!src ? (
              <div className="flex aspect-video w-full items-center justify-center text-sm text-muted-foreground">
                Loading image...
              </div>
          ) : (
          <div className="relative inline-block max-w-full">
            <img
                src={src}
                alt={data.altText || "Lesson diagram with labelled points"}
                className="max-h-[560px] w-auto max-w-full rounded-[calc(var(--radius-rb-tile)-4px)]"
            />

            {hotspots.map((hotspot, hotspotIndex) => {
              const hotspotId = hotspot.id ?? hotspotIndex
              const isOpen = hotspotId === openId
              const isVisited = visitedIds.has(hotspotId)

              return (
                  <button
                      key={hotspot.id ?? hotspotIndex}
                      type="button"
                      onClick={() => toggleHotspot(hotspotId, isOpen)}
                      data-hotspot-pin=""
                      data-live-hotspot={String(hotspot.id ?? hotspotIndex)}
                      style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                      aria-label={`Point ${hotspotIndex + 1}: ${hotspot.title}`}
                      aria-pressed={isOpen}
                      className={`absolute isolate grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-sm font-bold shadow-md ring-2 ring-background transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                          isOpen
                              ? `scale-110 text-white ${accent.bgSolid}`
                              : "bg-card text-[var(--tg-ink)] ring-[var(--tg)]"
                      }`}
                  >
                    {hotspotIndex + 1}


                    {isOpen ? null : (
                        <span
                            aria-hidden="true"
                            className={`absolute -inset-1 -z-10 rounded-full opacity-25 ${accent.bgSolid}`}
                        />
                    )}

                    {isOpen || isVisited ? null : (
                        <span
                            aria-hidden="true"
                            className={`absolute -inset-1 -z-10 rounded-full opacity-40 motion-safe:animate-ping ${accent.bgSolid}`}
                        />
                    )}
                  </button>
              )
            })}



            {openHotspot ? (
                <div
                    ref={popoverRef}
                    role="group"
                    aria-label={`Point ${openIndex + 1}: ${openHotspot.title}`}
                    style={{
                      left: `${openHotspot.x}%`,
                      top: `${openHotspot.y}%`,
                      transform: `translate(${
                          openHotspot.x > 50 ? "calc(-100% + 1.25rem)" : "-1.25rem"
                      }, ${openHotspot.y > 50 ? "calc(-100% + 1.25rem)" : "-1.25rem"})`,
                    }}
                    className={`absolute z-20 w-64 max-w-[calc(100%-1rem)] overflow-hidden rounded-2xl border bg-popover p-4 shadow-lg sm:w-72 ${accent.border}`}
                >
                  <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-0 -z-1 ${accent.bgSoft}`}
                  />

                  <div className="flex items-start gap-2.5">
                    <span
                        className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${accent.bgSolid}`}
                    >
                      {openIndex + 1}
                    </span>

                    <h3 className="min-w-0 flex-1 font-heading text-base font-semibold text-foreground">
                      {openHotspot.title}
                    </h3>

                    <button
                        type="button"
                        onClick={() => setOpenId(null)}
                        aria-label="Close this point"
                        className="-mr-1 -mt-1 grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>

                  {openHotspot.description ? (
                      <p className="mt-2 max-h-44 overflow-y-auto text-[15px] leading-6 text-foreground/85">
                        {openHotspot.description}
                      </p>
                  ) : null}
                </div>
            ) : null}
          </div>
          )}
        </div>

        {openHotspot ? null : (
            <p className="text-center text-sm text-muted-foreground">
              Select a numbered point on the image to read about it.
            </p>
        )}
      </div>
  )
}

function LessonTool({ tool, index = 0 }) {
  return <div className="tg-cat-explain" data-tool-id={tool.id ?? `block-${index}`} data-tool-type={tool.type} data-live-title={tool.data?.smallHeader || tool.data?.title || ""}><LessonToolContent tool={tool} index={index} /></div>
}

function LessonToolContent({ tool, index = 0 }) {
  const data = tool?.data ?? {}
  const accent = accentFor(index)

  if (tool.type === "heading") {
    return (
        <h2 className={`border-l-4 py-1 pl-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl ${accent.border}`}>
          {data.text}
        </h2>
    )
  }

  if (tool.type === "subheading") {
    return (
        <h3 className="text-lg font-semibold text-foreground sm:text-xl">
          {data.text}
        </h3>
    )
  }

  if (tool.type === "description") {
    return (
        <div className="space-y-3">
          {renderText(data.text, "text-[17px] leading-8 text-foreground/85")}
        </div>
    )
  }

  if (tool.type === "unordered-list" || tool.type === "ordered-list") {
    const ordered = tool.type === "ordered-list"
    const Tag = ordered ? "ol" : "ul"



    return (
        <Tag className="space-y-1.5">
          {(data.items ?? []).map((item, itemIndex) => (
              <li
                  key={item.id ?? item.text}
                  className="flex gap-2.5 text-[17px] leading-7 text-foreground"
              >
                {ordered ? (
                    <span
                        data-marker
                        className={`mt-[0.15em] grid size-[1.375rem] shrink-0 place-items-center rounded-md text-xs font-bold tabular-nums ${accent.bgSoft} ${accent.text}`}
                    >
                      {itemIndex + 1}
                    </span>
                ) : (
                    <span
                        data-marker
                        aria-hidden="true"
                        className={`mt-[0.6em] size-1.5 shrink-0 rounded-full ${accent.bgSolid}`}
                    />
                )}

                <span className="min-w-0 flex-1">{item.text}</span>
              </li>
          ))}
        </Tag>
    )
  }

  if (tool.type === "code") {
    return <CodeBlock data={data} accent={accent} />
  }

  if (tool.type === "table") {
    return <TableBlock data={data} accent={accent} />
  }

  if (tool.type === "image") {
    return data.imageKey ? (
        <div>

          <LessonImage
              imageKey={data.imageKey}
              alt={data.altText || data.title || data.smallHeader || "Lesson image"}
              className="mx-auto block h-auto max-h-[560px] w-auto max-w-full rounded-2xl object-contain"
              sourceUrl={data.imageSourceUrl}
              sourceName={data.imageSourceName}
          />
        </div>
    ) : null
  }

  if (tool.type === "video") {
    return data.videoKey ? (
        <VideoBlock
            videoKey={data.videoKey}
            className="aspect-video w-full rounded-2xl border border-[var(--tg-line)] bg-foreground"
        />
    ) : null
  }

  if (tool.type === "image-hotspot") {
    return <ImageHotspotBlock data={data} accent={accent} />
  }

  if (tool.type === "image-left-text" || tool.type === "image-right-text") {
    const image = data.imageKey ? (
        <LessonImage
            imageKey={data.imageKey}
            alt={data.title ?? ""}
            className="mx-auto block h-auto max-h-[560px] w-auto max-w-full rounded-2xl object-contain"
            sourceUrl={data.imageSourceUrl}
            sourceName={data.imageSourceName}
        />
    ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-2xl border-2 border-dashed border-[var(--tg-line)] bg-[var(--tg-softer)] text-muted-foreground">
          No image
        </div>
    )


    const text = (
        <div className="min-w-0">
          {data.title ? (
              <h3 className="text-lg font-semibold text-foreground sm:text-xl">
                {data.title}
              </h3>
          ) : null}

          <p className="mt-3 text-[17px] leading-8 text-foreground/85">
            {data.description}
          </p>
        </div>
    )

    return (
        <div className="grid gap-6 md:grid-cols-2 md:items-center md:gap-8">
          {tool.type === "image-left-text" ? image : text}
          {tool.type === "image-left-text" ? text : image}
        </div>
    )
  }

  if (tool.type === "tabs") {
    return <TabsBlock items={data.items ?? []} />
  }

  if (tool.type === "accordion") {
    return <AccordionBlock items={data.items ?? []} />
  }

  if (tool.type === "flip-grid") {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
          {(data.cards ?? []).map((card, cardIndex) => (
              <FlipCard
                  key={card.id ?? card.frontTitle ?? cardIndex}
                  cardId={String(card.id ?? cardIndex)}
                  frontTitle={card.frontTitle}
                  backTitle={card.backTitle}
                  description={card.description}
                  accent={accentFor(cardIndex)}
              />
          ))}
        </div>
    )
  }

  if (tool.type === "intro-image-card") {
    return (
        <div className="space-y-4">
          <SectionIntro smallHeader={data.smallHeader} description={data.description} accent={accent} />
          {data.imageKey ? (
              <div>
                <LessonImage
                    imageKey={data.imageKey}
                    className="mx-auto block h-auto max-h-[560px] w-auto max-w-full rounded-2xl object-contain"
                    sourceUrl={data.imageSourceUrl}
                    sourceName={data.imageSourceName}
                />
              </div>
          ) : null}
        </div>
    )
  }

  if (tool.type === "header-description-grid" || tool.type === "image-feature-grid") {
    return (
        <div className="space-y-4">
          <SectionIntro smallHeader={data.smallHeader} description={data.description} accent={accent} />
          {tool.type === "image-feature-grid" && data.imageKey ? (
              <div>
                <LessonImage
                    imageKey={data.imageKey}
                    className="mx-auto block h-auto max-h-[560px] w-auto max-w-full rounded-2xl object-contain"
                    sourceUrl={data.imageSourceUrl}
                    sourceName={data.imageSourceName}
                />
              </div>
          ) : null}


          <div className="grid auto-rows-fr gap-4 sm:grid-cols-2">
            {(data.gridItems ?? []).map((item, itemIndex) => {
              return (
                  <div
                      key={item.id ?? itemIndex}
                      className={`rounded-2xl p-5 ring-1 ring-[var(--tg-line)] ${SOFT}`}
                  >
                    <span className={`${RB_INDEX_CHIP} !size-8 !text-xs`} aria-hidden="true">{itemIndex + 1}</span>
                    <h4 className="mt-3 font-bold text-foreground">{item.title}</h4>
                    <p className="mt-1.5 text-[15px] leading-6 text-foreground/85">
                      {item.description}
                    </p>
                  </div>
              )
            })}
          </div>
        </div>
    )
  }

  if (tool.type === "review-card-grid") {
    return (
        <div className="space-y-4">
          <SectionIntro smallHeader={data.smallHeader} description={data.description} accent={accent} />
          <div className="grid gap-4 sm:grid-cols-2">
            {(data.cards ?? []).map((card, cardIndex) => (
                <FlipCard
                    key={card.id ?? cardIndex}
                    cardId={String(card.id ?? cardIndex)}
                    frontTitle={card.frontTitle}
                    backTitle={card.backTitle}
                    description={card.description}
                    accent={accentFor(cardIndex)}
                />
            ))}
          </div>
        </div>
    )
  }

  if (tool.type === "content-accordion-block") {
    return (
        <div className="space-y-4">
          <SectionIntro smallHeader={data.smallHeader} description={data.description} accent={accent} />
          <AccordionBlock items={data.items ?? []} />
        </div>
    )
  }

  if (tool.type === "content-tabs-block") {
    return (
        <div className="space-y-4">
          <SectionIntro smallHeader={data.smallHeader} description={data.description} accent={accent} />
          <TabsBlock items={data.items ?? []} />
        </div>
    )
  }

  if (tool.type === "media-text-block") {
    const mediaOnRight = data.layout === "image-right"
    const media =
        data.mediaType === "video" ? (
            data.videoKey ? (
                <VideoBlock
                    videoKey={data.videoKey}
                    className="aspect-video w-full rounded-2xl border border-[var(--tg-line)] bg-foreground"
                />
            ) : (
                <div className="flex h-full min-h-72 items-center justify-center rounded-2xl border-2 border-dashed border-[var(--tg-line)] bg-[var(--tg-softer)] text-muted-foreground">
                  No video
                </div>
            )
        ) : data.imageKey ? (
            <LessonImage
                imageKey={data.imageKey}
                alt={data.supportingTitle ?? ""}
                className="mx-auto block h-auto max-h-[560px] w-auto max-w-full rounded-2xl object-contain"
                sourceUrl={data.imageSourceUrl}
                sourceName={data.imageSourceName}
            />
        ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-2xl border-2 border-dashed border-[var(--tg-line)] bg-[var(--tg-softer)] text-muted-foreground">
              No media
            </div>
        )

    const text = (
        <div className="min-w-0">
          {data.supportingTitle ? (
              <h3 className="text-lg font-semibold text-foreground sm:text-xl">
                {data.supportingTitle}
              </h3>
          ) : null}
          {data.supportingDescription ? (
              <p className="mt-3 text-[17px] leading-8 text-foreground/85">
                {data.supportingDescription}
              </p>
          ) : null}
        </div>
    )

    return (
        <div className="space-y-4">
          <SectionIntro smallHeader={data.smallHeader} description={data.description} accent={accent} />
          <div className="grid gap-6 md:grid-cols-2 md:items-center md:gap-8">
            {mediaOnRight ? text : media}
            {mediaOnRight ? media : text}
          </div>
        </div>
    )
  }

  return (
      <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        Unsupported lesson block: {tool.type}
      </div>
  )
}

export { LessonTool }

export function LessonContent({ structure, className = "space-y-8" }) {
  const items = parseLessonStructure(structure)
  if (items.length === 0) {
    return null
  }
  const isSections = items.some((item) => Array.isArray(item?.content) && !item?.type)
  if (!isSections) {
    return (
      <div className={className}>
        {items.map((tool, index) => (
          <LessonTool key={tool.id ?? index} tool={tool} index={index} />
        ))}
      </div>
    )
  }
  let blockIndex = 0
  return (
    <div className={className}>
      {items.map((section, sectionIndex) => (
        <section key={section.id ?? sectionIndex} className="space-y-6">
          {section.sectionName || section.name ? (
            <h2 className="font-rb-display text-xl font-extrabold text-foreground">
              {section.sectionName ?? section.name}
            </h2>
          ) : null}
          {(Array.isArray(section.content) ? section.content : []).map((tool, index) => (
            <LessonTool key={tool.id ?? `${sectionIndex}-${index}`} tool={tool} index={blockIndex++} />
          ))}
        </section>
      ))}
    </div>
  )
}
