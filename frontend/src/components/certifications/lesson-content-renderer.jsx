import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { fetchFileBlob, getFileViewLink } from "@/services/fileService.js"
import { parseLessonStructure } from "@/services/learnerService.js"
import { Check, Copy, Maximize, RotateCcw, X } from "@/components/icons"
import { Light as SyntaxHighlighter } from "react-syntax-highlighter"
import { CODE_LANGUAGES, registerCodeLanguages } from "./code-languages.js"
import { Card } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"


const EASE = [0.22, 1, 0.36, 1]

const ACCENTS = [
  { text: "!text-chart-1", marker: "marker:!text-chart-1", border: "!border-chart-1", bgSolid: "!bg-chart-1", bgSoft: "!bg-chart-1/10" },
  { text: "!text-chart-5", marker: "marker:!text-chart-5", border: "!border-chart-5", bgSolid: "!bg-chart-5", bgSoft: "!bg-chart-5/10" },
  { text: "!text-chart-2", marker: "marker:!text-chart-2", border: "!border-chart-2", bgSolid: "!bg-chart-2", bgSoft: "!bg-chart-2/10" },
  { text: "!text-chart-4", marker: "marker:!text-chart-4", border: "!border-chart-4", bgSolid: "!bg-chart-4", bgSoft: "!bg-chart-4/10" },
  { text: "!text-chart-3", marker: "marker:!text-chart-3", border: "!border-chart-3", bgSolid: "!bg-chart-3", bgSoft: "!bg-chart-3/10" },
]

function accentFor(index) {
  return ACCENTS[((index % ACCENTS.length) + ACCENTS.length) % ACCENTS.length]
}

const RB_ACCENTS = [
  { chip: "bg-rb-macaw-wash text-rb-macaw-lip", wash: "bg-rb-macaw-wash" },
  { chip: "bg-rb-fox-wash text-rb-fox-lip", wash: "bg-rb-fox-wash" },
  { chip: "bg-rb-bee-wash text-rb-bee-ink", wash: "bg-rb-bee-wash" },
  { chip: "bg-rb-beetle-wash text-rb-beetle-lip", wash: "bg-rb-beetle-wash" },
  { chip: "bg-rb-feather-wash text-rb-feather-ink", wash: "bg-rb-feather-wash" },
]

const RB_PILL_ACTIVE =
  "data-active:border-rb-feather data-active:bg-rb-feather data-active:text-white"

function rbAccentFor(index) {
  return RB_ACCENTS[((index % RB_ACCENTS.length) + RB_ACCENTS.length) % RB_ACCENTS.length]
}

const RB_CARD = "overflow-hidden rounded-rb-card border-2 border-rb-swan bg-rb-snow"


const RB_INDEX_CHIP =
  "grid size-9 shrink-0 place-items-center rounded-xl font-rb-display text-sm font-extrabold"

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

const LIGHTBOX_PANEL =
    "!max-w-none w-[92vw] sm:w-[64vw] lg:w-[52vw] max-h-[82dvh] " +
    "grid place-items-center gap-0 overflow-hidden rounded-2xl border border-border " +
    "bg-background p-3 shadow-2xl"

const LIGHTBOX_MEDIA =
    "max-h-[74dvh] w-full rounded-lg bg-white object-contain"

const LIGHTBOX_SCRIM =
    "bg-slate-950/45 supports-backdrop-filter:backdrop-blur-sm"

function LightboxClose() {
  return (
      <DialogClose asChild>
        <button
            type="button"
            aria-label="Close"
            className="absolute right-2 top-2 z-10 grid size-9 place-items-center rounded-full bg-slate-950/50 text-white backdrop-blur-sm transition-colors hover:bg-slate-950/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </DialogClose>
  )
}

function LessonImage({ imageKey, alt = "", className, sourceUrl, sourceName }) {
  const [open, setOpen] = useState(false)

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

  return (
      <div>
        <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={alt ? `View "${alt}" full size` : "View image full size"}
            className="group relative mx-auto block w-fit max-w-full cursor-zoom-in rounded-[var(--radius-rb-tile)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <img src={src} alt={alt} className={className} />
          <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-[var(--radius-rb-tile)] bg-foreground/0 transition-colors group-hover:bg-foreground/5"
          />
        </button>

        <ImageAttribution sourceUrl={sourceUrl} sourceName={sourceName} />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent
              className={LIGHTBOX_PANEL}
              overlayClassName={LIGHTBOX_SCRIM}
              showCloseButton={false}
          >
            <DialogTitle className="sr-only">{alt || "Lesson image"}</DialogTitle>
            <img src={src} alt={alt} className={LIGHTBOX_MEDIA} />
            <LightboxClose />
          </DialogContent>
        </Dialog>
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
            aria-label="View video full size"
            className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full border-2 border-border/70 bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Maximize className="size-4" />
        </button>

        <Dialog open={expanded} onOpenChange={setExpanded}>
          <DialogContent
              className={LIGHTBOX_PANEL}
              overlayClassName={LIGHTBOX_SCRIM}
              showCloseButton={false}
          >
            <DialogTitle className="sr-only">Lesson video</DialogTitle>
            {player(`${LIGHTBOX_MEDIA} aspect-video h-auto w-full`)}
            <LightboxClose />
          </DialogContent>
        </Dialog>
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
            className="overflow-x-auto rounded-[var(--radius-rb-tile)] border-2 border-border/70"
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
              <tr className="bg-muted/60">
                {columns.map((column, columnIndex) => (
                    <th
                        key={column.id ?? column.label ?? columnIndex}
                        scope="col"
                        className="border-b-2 border-border/70 px-4 py-3 font-heading text-[13px] font-bold uppercase tracking-wide text-foreground"
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
                        className={rowIndex % 2 ? "bg-muted/25" : undefined}
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

        <figure className="overflow-hidden rounded-[var(--radius-rb-tile)] border-2 border-border/70 bg-card">
          <div className="flex items-center justify-between gap-3 border-b-2 border-border/70 bg-muted/60 px-4 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className={`rounded-md px-2 py-0.5 font-heading text-[12px] font-bold uppercase tracking-wide ${accent.bgSoft} ${accent.text}`}>
                {label}
              </span>
              {data.title ? (
                  <span className="truncate font-mono text-[13px] text-muted-foreground">{data.title}</span>
              ) : null}
            </div>
            <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
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
              <figcaption className="border-t-2 border-border/70 px-4 py-2.5 text-sm text-muted-foreground">
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
            <p className={`text-sm font-semibold uppercase tracking-wide ${accent.text}`}>
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
          const rb = rbAccentFor(index)

          return (
              <AccordionItem key={id} value={id} className={`${RB_CARD} not-last:border-b-2`}>
                <AccordionTrigger className="items-center gap-3 p-4 hover:no-underline">
                  <span className={`${RB_INDEX_CHIP} ${rb.chip}`} aria-hidden="true">
                    {index + 1}
                  </span>

                  <span className="min-w-0 flex-1 font-rb-display text-base font-extrabold text-rb-eel">
                    {item.title}
                  </span>
                </AccordionTrigger>

                <AccordionContent
                    className={`border-t-2 border-rb-swan px-4 py-3 text-[15px] leading-7 text-rb-wolf ${rb.wash}`}
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
                    key={item.id ?? item.label ?? index}
                    value={String(index)}
                    className={`h-auto flex-1 rounded-rb-pill border-2 border-rb-swan bg-rb-snow px-3.5 py-2 text-sm font-bold text-rb-wolf after:hidden ${RB_PILL_ACTIVE}`}
                >
                  {item.label ?? item.title ?? `Tab ${index + 1}`}
                </TabsTrigger>
            )
          })}
        </TabsList>

        {items.map((item, index) => {
          const rb = rbAccentFor(index)

          return (
              <TabsContent
                  key={item.id ?? item.label ?? index}
                  value={String(index)}
                  className={`mt-3 ${RB_CARD}`}
              >
                <div className="flex items-center gap-3 p-4">
                  <span className={`${RB_INDEX_CHIP} ${rb.chip}`} aria-hidden="true">
                    {index + 1}
                  </span>

                  <span className="min-w-0 flex-1 font-rb-display text-base font-extrabold text-rb-eel">
                    {item.title ?? item.label}
                  </span>
                </div>

                <div
                    className={`border-t-2 border-rb-swan px-4 py-3 text-[15px] leading-7 text-rb-wolf ${rb.wash}`}
                >
                  {item.description}
                </div>
              </TabsContent>
          )
        })}
      </Tabs>
  )
}

function FlipCard({ frontTitle, backTitle, description, accent = ACCENTS[0] }) {
  const [flipped, setFlipped] = useState(false)

  return (
      <button
          type="button"
          onClick={() => setFlipped((value) => !value)}
          aria-label={`${frontTitle}. Press to ${flipped ? "show front" : "reveal detail"}.`}
          className="group block h-48 w-full text-left [perspective:1200px]"
      >
        <motion.div
            className="relative h-full w-full [transform-style:preserve-3d]"
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.5, ease: EASE }}
        >
          <Card className={`absolute inset-0 h-full justify-between !border-t-4 p-5 [backface-visibility:hidden] ${accent.border}`}>
            <p className="font-heading font-semibold text-foreground">{frontTitle}</p>
            <span className={`inline-flex size-7 items-center justify-center self-start rounded-full transition group-hover:opacity-80 ${accent.bgSoft} ${accent.text}`}>
              <RotateCcw className="size-3.5" aria-hidden="true" />
            </span>
          </Card>

          <Card
              className={`absolute inset-0 h-full justify-center p-5 shadow-[0_2px_0_currentColor] [backface-visibility:hidden] ${accent.border} ${accent.bgSoft} ${accent.text}`}
              style={{ transform: "rotateY(180deg)" }}
          >
            <p className={`font-heading font-semibold ${accent.text}`}>
              {frontTitle ?? backTitle}
            </p>
            <p className="mt-2 text-[15px] leading-6 text-foreground/85">{description}</p>
          </Card>
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
  const openIndex = hotspots.findIndex((hotspot) => hotspot.id === openId)
  const openHotspot = openIndex === -1 ? null : hotspots[openIndex]

  if (!data.imageKey) {
    return null
  }

  return (
      <div className="space-y-4">
        <SectionIntro smallHeader={data.smallHeader} description={data.description} accent={accent} />

        <div className="flex justify-center rounded-[var(--radius-rb-tile)] border-2 border-border/70 bg-muted p-2">
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
              const isOpen = hotspot.id === openId
              const isVisited = visitedIds.has(hotspot.id)

              return (
                  <button
                      key={hotspot.id ?? hotspotIndex}
                      type="button"
                      onClick={() => toggleHotspot(hotspot.id, isOpen)}
                      data-hotspot-pin=""
                      style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                      aria-label={`Point ${hotspotIndex + 1}: ${hotspot.title}`}
                      aria-pressed={isOpen}
                      className={`absolute isolate grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-sm font-bold shadow-md ring-2 ring-background transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                          isOpen
                              ? `scale-110 text-white ${accent.bgSolid}`
                              : "bg-foreground text-background"
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
                    className={`absolute z-20 w-64 max-w-[calc(100%-1rem)] overflow-hidden rounded-[var(--radius-rb-tile)] border-2 bg-popover p-4 shadow-lg sm:w-72 ${accent.border}`}
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
  const data = tool?.data ?? {}
  const accent = accentFor(index)

  if (tool.type === "heading") {
    return (
        <h2 className={`rounded-r-[var(--radius-rb-tile)] border-l-4 py-2 pl-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl ${accent.border} ${accent.bgSoft}`}>
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
              className="mx-auto block h-auto max-h-[560px] w-auto max-w-full rounded-[var(--radius-rb-tile)] object-contain"
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
            className="aspect-video w-full rounded-[var(--radius-rb-tile)] border-2 border-border/70 bg-foreground"
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
            className="mx-auto block h-auto max-h-[560px] w-auto max-w-full rounded-[var(--radius-rb-tile)] object-contain"
            sourceUrl={data.imageSourceUrl}
            sourceName={data.imageSourceName}
        />
    ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-[var(--radius-rb-tile)] border-2 border-dashed border-border bg-muted text-muted-foreground">
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
                    className="mx-auto block h-auto max-h-[560px] w-auto max-w-full rounded-[var(--radius-rb-tile)] object-contain"
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
                    className="mx-auto block h-auto max-h-[560px] w-auto max-w-full rounded-[var(--radius-rb-tile)] object-contain"
                    sourceUrl={data.imageSourceUrl}
                    sourceName={data.imageSourceName}
                />
              </div>
          ) : null}


          <div className="grid auto-rows-fr gap-4 sm:grid-cols-2">
            {(data.gridItems ?? []).map((item, itemIndex) => {
              const itemAccent = accentFor(itemIndex)
              return (
                  <Card
                      key={item.id ?? itemIndex}
                      size="sm"
                      className={`!border-t-4 p-4 transition ${itemAccent.border} ${itemAccent.bgSoft}`}
                  >
                    <h4 className="font-heading font-semibold text-foreground">{item.title}</h4>
                    <p className="mt-2 text-[15px] leading-6 text-foreground/85">
                      {item.description}
                    </p>
                  </Card>
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
                    className="aspect-video w-full rounded-[var(--radius-rb-tile)] border-2 border-border/70 bg-foreground"
                />
            ) : (
                <div className="flex h-full min-h-72 items-center justify-center rounded-[var(--radius-rb-tile)] border-2 border-dashed border-border bg-muted text-muted-foreground">
                  No video
                </div>
            )
        ) : data.imageKey ? (
            <LessonImage
                imageKey={data.imageKey}
                alt={data.supportingTitle ?? ""}
                className="mx-auto block h-auto max-h-[560px] w-auto max-w-full rounded-[var(--radius-rb-tile)] object-contain"
                sourceUrl={data.imageSourceUrl}
                sourceName={data.imageSourceName}
            />
        ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-[var(--radius-rb-tile)] border-2 border-dashed border-border bg-muted text-muted-foreground">
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
