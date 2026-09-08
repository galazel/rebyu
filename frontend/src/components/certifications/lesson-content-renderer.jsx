import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { fetchFileBlob, getFileViewLink } from "@/services/fileService.js"
import { parseLessonStructure } from "@/services/learnerService.js"
import { Maximize, RotateCcw, X } from "@/components/icons"
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

// Shared, presentational lesson-body renderer -- extracted verbatim from
// the learner lesson page so the institution content viewer renders lessons
// identically. Pure: takes a block (tool) or a structure string, no data
// fetching, no progress/completion concerns.
//
// Blocks here use the shadcn semantic tokens (`border-border`,
// `text-foreground`, `bg-card`, `text-primary`, ...) rather than hardcoded
// zinc hex values, on purpose: this renderer runs both inside the learner
// portal's `.rebyu-ds` scope and outside it in the institution content viewer.
//
// The `rb-*` design-system *utilities* are equally safe in both, contrary to
// what this note used to claim: they are declared in an `@theme` block, so
// Tailwind emits their variables on `:root`, and `bg-rb-snow` /
// `border-rb-swan` / `rounded-rb-card` / `font-rb-display` measure identically
// in and out of the scope. What is genuinely scoped is the *component* layer
// -- `.rb-chip`, `.rb-btn`, `.rb-card`, `.rb-display` -- which goes inert
// outside `.rebyu-ds` (transparent, `display: block`). Never reach for those
// here; the utilities are fine, and the accordion and tabs blocks use them to
// borrow the certification surfaces' card language.

const EASE = [0.22, 1, 0.36, 1]

// Chart tokens rather than the `.rebyu-ds` palette: they're plain `:root`
// variables (see index.css), so they resolve identically in the institution
// content viewer, which renders this file outside the `.rebyu-ds` scope.
// Order alternates warm/cool so consecutive blocks never land on adjacent hues.
// `!`-important: these get merged onto shadcn `Card`/list/heading base classes
// that already set a border/text/bg color (e.g. `border-border/70`), and
// `twMerge` doesn't know our custom `chart-*` theme colors well enough to drop
// the base class for us -- without `!` the two land in the cascade and the
// base one (registered later in Tailwind's generated stylesheet) wins.
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

/**
 * The certification surfaces' accent pairs, for the blocks that borrow their
 * card language (accordion, tabs) rather than the chart palette above.
 *
 * Safe outside `.rebyu-ds` despite the note at the top of this file: the
 * `rb-*` *utilities* come from an `@theme` block, so Tailwind emits their
 * variables on `:root` and they resolve identically in the institution viewer
 * (verified: same 24px radius, same #e5e5e5 border in and out of scope). It is
 * the `.rb-chip` / `.rb-btn` *component classes* that are scoped and go inert
 * outside it -- those are still off limits here.
 *
 * `data-active:` variants are spelled out in full rather than composed at the
 * call site, because Tailwind scans source text: a class assembled as
 * `data-active:${x}` is invisible to it and never gets generated.
 *
 * Ink shades on bee and feather are the AA-tuned `-ink` values, not the `-lip`
 * button-shadow ones, since this text sits on a wash.
 */
const RB_ACCENTS = [
  { chip: "bg-rb-macaw-wash text-rb-macaw-lip", wash: "bg-rb-macaw-wash" },
  { chip: "bg-rb-fox-wash text-rb-fox-lip", wash: "bg-rb-fox-wash" },
  { chip: "bg-rb-bee-wash text-rb-bee-ink", wash: "bg-rb-bee-wash" },
  { chip: "bg-rb-beetle-wash text-rb-beetle-lip", wash: "bg-rb-beetle-wash" },
  { chip: "bg-rb-feather-wash text-rb-feather-ink", wash: "bg-rb-feather-wash" },
]

/**
 * The selected tab: one solid Feather pill, not a per-accent tint.
 *
 * The accent washes this used to reach for measure 1.10-1.14:1 against the
 * Snow pill they sit on -- a difference you cannot see, which is why every tab
 * looked white whichever was open. Filling solid instead of tinting is the
 * only way the state reads at a glance.
 *
 * Feather rather than the tab's own accent because white on solid clears AA
 * (4.5:1) for almost none of them -- Macaw 2.44, Fox 2.18, Bee 2.38, Beetle
 * 2.54, Cardinal 3.30. Feather is 4.59 and is already this system's primary
 * action colour, so selection looks like every other chosen thing in the
 * product. The per-accent identity is not lost, it just lives where it can be
 * seen: the panel's number tile and washed body still cycle.
 */
const RB_PILL_ACTIVE =
  "data-active:border-rb-feather data-active:bg-rb-feather data-active:text-white"

function rbAccentFor(index) {
  return RB_ACCENTS[((index % RB_ACCENTS.length) + RB_ACCENTS.length) % RB_ACCENTS.length]
}

/* The certification card, as one string: a Snow panel with the system's
   2px Swan border and 24px corner. Shared by both blocks below so an
   accordion row and a tab panel are visibly the same object. */
const RB_CARD = "overflow-hidden rounded-rb-card border-2 border-rb-swan bg-rb-snow"

/* The numbered tile that opens an accordion item or a tab panel.

   36px, not the curriculum row's 44px. The row it borrows from is a whole
   topic's entry point with two lines of text beside it; here the same tile sat
   against a single line of title inside a lesson, where it was the largest
   thing in the block and read as the point of it. Same shape and colour, one
   step down, so the two still rhyme without this one shouting. */
const RB_INDEX_CHIP =
  "grid size-9 shrink-0 place-items-center rounded-xl font-rb-display text-sm font-extrabold"

/**
 * Whether a stored media reference is already a URL a browser can load.
 *
 * AI-generated lessons store three different things in the same
 * `imageKey`/`videoKey` field: an absolute URL (a search result, or a YouTube
 * link), a root-relative path (the diagrams we draw ourselves and ship in
 * `public/`), or an internal storage key. Only the third needs resolving; the
 * first two are already loadable and must not be signed or fetched.
 */
function isDirectMediaSrc(key) {
  return Boolean(key) && (/^https?:\/\//.test(key) || key.startsWith("/"))
}

/**
 * Credits the page an AI-sourced image came from. Absent for admin-uploaded
 * images (no `imageSourceUrl` in that case) since there's nothing external to
 * credit -- the file is the admin's own upload, not something pulled off the
 * web that needs attribution.
 */
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
      <p className="mt-1.5 text-xs text-muted-foreground">
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

/**
 * One fixed box for every lightbox, image and video alike.
 *
 * The first version sized the panel to the picture (`w-auto` up to 95vw/90vh),
 * which meant the viewer's size was decided by whatever the AI happened to
 * source: a wide org chart took the entire screen while a smaller one opened
 * barely larger than it had been in the lesson. Opening two diagrams in a row
 * looked like two different features.
 *
 * A fixed panel with `object-contain` inside makes every image land in the same
 * place at the same size, letterboxing where the aspect does not match -- the
 * same reasoning the lesson body already applies to its inline media box, just
 * at viewer scale. Capped at 1000px rather than the viewport so it reads as a
 * focused viewer rather than a full-screen takeover.
 */
//: `p-6` is the gap between the picture and the panel edge. It has to be
//: explicit and generous because the media is `h-full w-full`: it fills the
//: content box exactly, so the padding is the *only* thing separating it from
//: the frame. At `p-4` against an image with a pale background of its own the
//: two read as one edge-to-edge block with no frame at all.
//:
//: The panel keeps DialogContent's own surface -- `bg-popover`, border, rounded
//: corners, shadow. An earlier version stripped all three to `bg-transparent`,
//: which looked right only for an image that happened to fill the box exactly:
//: `object-contain` letterboxes everything else, and with no background those
//: bands showed the dimmed lesson page straight through. An image with its own
//: alpha channel washed out against it too. A viewer needs a surface to sit on.
//:
//: `place-items-center` because DialogContent is a grid: its only in-flow child
//: is the media (the title and close control are `sr-only`, so absolutely
//: positioned and out of flow), and centring it explicitly avoids depending on
//: how a stretched item resolves `h-full` inside an auto-sized row.
//: `!max-w-none` is important-flagged to beat the base `sm:max-w-lg` -- that is
//: a different variant group, so tailwind-merge does not treat it as a conflict
//: and would otherwise leave it applied above 640px.
//:
//: Every one of the panel's own decorations is turned off. A diagram opened to
//: be read does not want a card around it: the border, the popover fill, the
//: padding, the rounding and the drop shadow all drew a second frame inside the
//: viewport and shrank the picture to make room for it. What is left is the
//: media, centred on the scrim.
const LIGHTBOX_PANEL =
    "!max-w-none fixed inset-0 top-0 left-0 h-dvh w-screen translate-x-0 translate-y-0 " +
    "grid place-items-center gap-0 overflow-hidden rounded-none border-0 bg-transparent p-0 shadow-none"

//: The media is capped in the SAME units as the panel, minus its `p-6` on both
//: sides (1.5rem x 2 = 3rem) -- not in percentages of it.
//:
//: `h-full w-full` was the obvious spelling and it silently failed. The panel's
//: single grid row is auto-sized, so the browser sizes the row from its content
//: while the content asks for 100% of the row: a cycle. The percentage resolves
//: to `auto`, the row grows to the image's intrinsic height -- 1200px for a
//: lesson diagram -- and the picture spills straight out of a panel fixed at
//: 660px, uncropped, over the page behind it. It only looked correct for images
//: that happened to be smaller than the panel already.
//:
//: Absolute caps have no such cycle: the image is never asked how big it is in
//: terms of a box whose size depends on the answer. `overflow-hidden` on the
//: panel above is the backstop -- if any future image escapes its cap, it is
//: clipped to the frame instead of covering the lesson.
//: The media fills the viewport short of a margin, rather than a fixed box.
//: The absolute caps the previous panel needed are gone with it: `dvh`/`vw` are
//: resolved against the viewport, never against a parent whose size depends on
//: the answer, so there is no cycle to avoid here.
const LIGHTBOX_MEDIA = "max-h-[92dvh] max-w-[94vw] object-contain"

//: Nothing in this view is rounded. A radius is a card's edge treatment, and
//: opened media is not on a card -- a rounded corner over a square diagram
//: reads as a clipping mistake rather than as styling, so the close key is
//: square too and the picture keeps its own edges.
//:
//: A scrim, not a blackout. Dark enough to lift a diagram off the lesson and
//: to make plain that the page is out of reach, sheer enough that the page is
//: still visibly behind it -- which is what tells a learner they are looking at
//: an overlay rather than having navigated somewhere.
const LIGHTBOX_SCRIM =
    "bg-slate-950/45 supports-backdrop-filter:backdrop-blur-sm"

/**
 * The one way out of a full-screen media view.
 *
 * The shared dialog's own close key is an arrow anchored to the corner of a
 * panel, and here there is no panel for it to hold on to -- so this replaces
 * it: a plain X, pinned to the top right of the viewport, which is what a
 * picture opened full-screen is expected to have and the only control the view
 * needs. Unlike the shared key this one is inside the content, so it sits in
 * the focus trap and can be tabbed to; Esc still dismisses.
 */
function LightboxClose() {
  return (
      <DialogClose asChild>
        <button
            type="button"
            aria-label="Close"
            className="fixed right-4 top-4 z-51 grid size-11 place-items-center bg-slate-950/40 text-white backdrop-blur-sm transition-colors hover:bg-slate-950/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </DialogClose>
  )
}

/**
 * A lesson image, openable full-screen.
 *
 * Every image block sizes its picture to a fixed box (`aspect-video` and
 * `object-contain`) so a run of them reads as one column rather than a ragged
 * stack. That is right for the page and wrong for the picture: lesson images
 * are mostly diagrams, and a diagram letterboxed into a 16:9 slot on a laptop
 * renders its labels too small to read. This is the way out -- the layout keeps
 * its uniform box, and the learner can open the image at its own size.
 *
 * The lightbox is per-image local state rather than one shared viewer. The
 * renderer has two entry points -- `LessonContent` for a whole lesson and
 * `LessonTool` for a single block (the topic page and the admin preview both
 * use the latter) -- so a viewer hoisted to the top would exist for one and not
 * the other. A closed Dialog renders nothing, so the cost of one per image is
 * a boolean.
 */
function LessonImage({ imageKey, alt = "", className, sourceUrl, sourceName }) {
  const [open, setOpen] = useState(false)

  /* A YouTube video that arrived filed as an image.
   *
   * The lesson generator searches for a picture and sometimes the best match
   * it finds is the thumbnail off the front of a video -- so the block was
   * stored with `imageKey` pointing at `i.ytimg.com` and `imageSourceUrl` at
   * the watch page, and the lesson rendered a still frame, play button burned
   * into it, that did nothing when clicked. It looked exactly like a broken
   * video player because it is a picture of one.
   *
   * Either field identifies the video, so either is enough to play it. The
   * attribution stays: it is still someone else's video, and the credit is the
   * same credit the still was carrying.
   */
  const youTubeEmbed = getYouTubeEmbedUrl(sourceUrl) ?? getYouTubeEmbedUrl(imageKey)
  if (youTubeEmbed) {
    return (
        <div>
          <VideoBlock videoKey={sourceUrl || imageKey} className={className} />
          <ImageAttribution sourceUrl={sourceUrl} sourceName={sourceName} />
        </div>
    )
  }

  // Not `resolveMediaSrc`: an admin-uploaded key points at the authenticated
  // `/files/view`, which an <img> cannot load on its own. See
  // {@link useAuthedMediaSrc}.
  const src = useAuthedMediaSrc(imageKey)

  // The image box is held at its final size while the fetch is in flight, so
  // the surrounding copy does not reflow when it lands. `className` carries the
  // block's own sizing (`aspect-video w-full`, `min-h-72`, ...), so reusing it
  // here keeps the placeholder exactly the shape of what replaces it.
  if (imageKey && !src) {
    return (
        <div
            className={`${className} !border-dashed motion-safe:animate-pulse`}
            aria-label={alt ? `Loading ${alt}` : "Loading image"}
            role="img"
        />
    )
  }

  return (
      <div>
        {/* A button, not an `onClick` on the img: this has to be reachable by
            keyboard and announce itself to a screen reader, and only a real
            control does both for free. `cursor-zoom-in` is the affordance --
            without it nothing on the page suggests the image opens. */}
        <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={alt ? `View "${alt}" full size` : "View image full size"}
            className="group relative block w-full cursor-zoom-in rounded-[var(--radius-rb-tile)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
    /* A thumbnail, which is what the lesson generator actually stored.
       `i.ytimg.com/vi/<id>/hqdefault.jpg` is the picture off the front of a
       video, and the id in that path is the video's own -- so a block holding
       one is a block about a video, however it was filed. */
    if (parsed.hostname.endsWith("ytimg.com")) {
      const [, vi, videoId] = parsed.pathname.split("/")
      if (vi === "vi" && videoId) return `https://www.youtube.com/embed/${videoId}`
    }
  } catch {
    return null
  }
  return null
}

/** Renders a video key as a native player, or an iframe embed for YouTube links. */
/**
 * A lesson video, openable full-screen -- the same affordance as
 * {@link LessonImage}, reached a different way.
 *
 * A video cannot use the image's click-anywhere gesture: both players own
 * their surface. A click on the YouTube iframe belongs to YouTube, and a click
 * on `<video controls>` is play/pause. So the way in is an explicit control in
 * the corner instead, which is also why it carries an icon and a label where
 * the image needs neither.
 *
 * The inline player is UNMOUNTED while the lightbox is open. Leaving it
 * mounted means two copies of the same video exist at once, and if the learner
 * had it playing when they expanded, its audio keeps going behind the overlay
 * with no visible way to stop it. The cost is that playback restarts from the
 * beginning in the lightbox -- the right trade against two soundtracks at once.
 */
function VideoBlock({ videoKey, className }) {
  const [expanded, setExpanded] = useState(false)
  const src = useStreamedMediaSrc(videoKey)

  if (!videoKey) return null

  // The box is held at its final size while the URL is signed, so the copy
  // around it does not reflow when the player lands -- the same placeholder
  // treatment an image block gets.
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
            {/* Sized in viewport units like the image, but `h-` as well as
                `max-h-`: a <video> with no loaded frame has no intrinsic size,
                so a max-height alone collapses the player to nothing until the
                first frame arrives. */}
            {player(`${LIGHTBOX_MEDIA} h-[92dvh] w-[94vw]`)}
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

/**
 * A real data table.
 *
 * Added because a large part of what a certification teaches is genuinely
 * tabular -- character encodings against their widths, RAID levels against
 * what each survives, normal forms against what each removes, error-detection
 * schemes against what each catches. Before this block the only way to show
 * one was to draw a picture of a table, and a picture is not text: it cannot
 * be selected or copied, it does not respond to the reader's font size, it is
 * invisible to search and to a screen reader, and on a phone it is a wide
 * image scaled down until the type is unreadable.
 *
 * `<table>` with real `<th>` elements, so assistive technology announces which
 * column a cell belongs to. `scope` is set on both axes when the caller marks
 * a row-header column, which is what makes a grid of comparisons navigable
 * rather than a flat run of cells.
 *
 * The horizontal overflow lives on a wrapper rather than on the page, per the
 * rule the rest of this renderer follows: wide content scrolls inside its own
 * box and the body never scrolls sideways. The wrapper is focusable and
 * labelled so a keyboard user can actually reach that scroll region -- a
 * scrollable div with no tab stop is unreachable without a mouse.
 */
function TableBlock({ data, accent = ACCENTS[0] }) {
  const columns = Array.isArray(data.columns) ? data.columns : []
  const rows = Array.isArray(data.rows) ? data.rows : []
  if (columns.length === 0 || rows.length === 0) return null

  // The first column holds row headers when the caller says so. It is opt-in
  // rather than assumed: a table whose first column is ordinary data would
  // otherwise announce every value as a heading.
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
          {/* `min-w-[34rem]` is what makes the wrapper's scroll worth having.
              Without a floor, a four-column table on a phone does not scroll
              -- it fits, by crushing every column to about sixty pixels and
              wrapping each cell over four lines, which is unreadable in a
              different way from being cut off. With the floor, narrow screens
              scroll the table sideways inside its own box and each column
              keeps a usable measure, while `w-full` still lets it fill a wide
              container. */}
          <table className="w-full min-w-[34rem] border-collapse text-left text-[15px]">
            {/* A caption, not a paragraph above the table: it is the table's
                own accessible name, and it stays attached to it when the
                table is reached directly by a screen reader's table
                navigation. */}
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
                        /* Zebra striping on the odd rows only, in the same
                           wash the header uses at half strength. A border on
                           every row plus a fill on every other one is two
                           separators doing one job. */
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

function SectionIntro({ smallHeader, description, accent = ACCENTS[0] }) {
  if (!smallHeader && !description) return null

  return (
      <div>
        {smallHeader ? (
            <p className={`text-sm font-semibold uppercase tracking-wide ${accent.text}`}>
              {smallHeader}
            </p>
        ) : null}
        {/* The lesson's own body size and colour. This was 16px in
            muted-foreground while the description block beside it was 17px in
            foreground/85 -- the same prose, set two ways, so a section's
            opening paragraph read as a caption for the section rather than as
            the start of it. */}
        {renderText(description, "mt-2 text-[17px] leading-8 text-foreground/85")}
      </div>
  )
}

/**
 * Accordion body, wearing the certification curriculum's middle-category row:
 * a Snow card per item, numbered accent tile, display-face title, and a washed
 * body behind a 2px rule. A learner meets that row when they pick a topic, so
 * a collapsible inside the lesson that opens the same way is one pattern
 * learned once rather than two that merely resemble each other.
 *
 * Still the Radix primitive underneath, restyled rather than hand-rolled --
 * the curriculum's own row hand-rolls its toggle and gets no `aria-controls`
 * or managed region for it. Borrowing the look should not cost the semantics.
 */
function AccordionBlock({ items = [] }) {
  if (items.length === 0) return null

  return (
      // gap-3, not a divider: each item is its own card now, the way the
      // curriculum stacks its topic rows.
      <Accordion type="single" collapsible defaultValue={String(items[0]?.id ?? 0)} className="gap-3">
        {items.map((item, index) => {
          const id = String(item.id ?? index)
          const rb = rbAccentFor(index)

          return (
              // `not-last:border-b-2` restates the base's `not-last:border-b`
              // at this card's weight -- left alone it would thin every
              // non-final card's bottom edge to 1px against its other three.
              <AccordionItem key={id} value={id} className={`${RB_CARD} not-last:border-b-2`}>
                <AccordionTrigger className="items-center gap-3 p-4 hover:no-underline">
                  <span className={`${RB_INDEX_CHIP} ${rb.chip}`} aria-hidden="true">
                    {index + 1}
                  </span>

                  <span className="min-w-0 flex-1 font-rb-display text-base font-extrabold text-rb-eel">
                    {item.title}
                  </span>
                </AccordionTrigger>

                {/* `content` or `description`: the admin builder writes an
                    accordion item's body to `content`, but the generator has
                    been writing it to `description`, so every AI-authored
                    accordion rendered as a stack of titles with nothing under
                    them. The generator is fixed to emit `content` too, but
                    every lesson already sitting in the database still carries
                    `description` -- reading both is what makes those render
                    without a migration. */}
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

/**
 * Tabs in the same language: the triggers are the rounded topic pills a unit
 * card lists its middle categories with, and the panel below is the same
 * card the accordion above uses -- numbered tile, display-face title, washed
 * body. Picking a tab should feel like picking a topic.
 */
function TabsBlock({ items = [] }) {
  if (items.length === 0) return null

  return (
      <Tabs defaultValue="0" className="gap-0">
        {/* `group-data-horizontal/tabs:h-auto`, not a bare `h-auto`: the list's
            fixed 12rem-tall rule is set behind that same variant, and a
            different variant chain is a separate utility to tailwind-merge --
            an unprefixed height simply loses to it. The underline border goes
            for the same reason the pills arrived: this is a row of chips, not
            a tab strip. */}
        <TabsList className="w-full flex-wrap gap-2 border-b-0 bg-transparent p-0 group-data-horizontal/tabs:h-auto">
          {items.map((item, index) => {
            return (
                <TabsTrigger
                    key={item.id ?? item.label ?? index}
                    value={String(index)}
                    // `flex-1` is the primitive's own behaviour, kept: the
                    // triggers share the list's full width, so the strip ends
                    // flush with the panel below it. Overriding it to
                    // `flex-none` left the pills sized to their labels and a
                    // gap of dead space after the last one.
                    //
                    // `after:hidden` kills the primitive's active-underline
                    // outright -- it is driven by opacity, so dimming it would
                    // leave the bar in the layout under a pill that already
                    // shows its state by filling.
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

                  {/* Title only. A topic row carries a summary under its name,
                      but the only thing this block has to put there is the
                      label -- which is the pill you just pressed, sitting a few
                      pixels above. Restating it read as a stutter ("Use Cases /
                      Use Case Specifications / Use Cases"), so the row is one
                      line here. Falls back to the label when an item has no
                      title of its own, rather than rendering an empty heading. */}
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

/** A card that flips on click to reveal its back face. Fixed height so every
 * card in a grid lines up regardless of which side (front/back) is showing. */
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
          {/* Front */}
          <Card className={`absolute inset-0 h-full justify-between !border-t-4 p-5 [backface-visibility:hidden] ${accent.border}`}>
            <p className="font-heading font-semibold text-foreground">{frontTitle}</p>
            <span className={`inline-flex size-7 items-center justify-center self-start rounded-full transition group-hover:opacity-80 ${accent.bgSoft} ${accent.text}`}>
              <RotateCcw className="size-3.5" aria-hidden="true" />
            </span>
          </Card>

          {/* Back */}
          <Card
              className={`absolute inset-0 h-full justify-center p-5 shadow-[0_2px_0_currentColor] [backface-visibility:hidden] ${accent.border} ${accent.bgSoft} ${accent.text}`}
              style={{ transform: "rotateY(180deg)" }}
          >
            {/* The front's title, not `backTitle`. The generator tends to fill
                backTitle with a generic label ("The Problem"), so flipping a
                card replaced the one thing identifying it with a word shared
                by every other card in the grid -- turn two over and you could
                no longer tell which was which. The card keeps its name; only
                the face changes. `backTitle` stays as the fallback for cards
                that carry no front title. */}
            <p className={`font-heading font-semibold ${accent.text}`}>
              {frontTitle ?? backTitle}
            </p>
            {/* Not muted-foreground: on the tinted back face that is grey on
                a wash, the weakest contrast in the lesson, and it is the only
                text the card exists to show. */}
            <p className="mt-2 text-[15px] leading-6 text-foreground/85">{description}</p>
          </Card>
        </motion.div>
      </button>
  )
}

/**
 * An image the learner explores by opening labelled points on it.
 *
 * The detail sits in a panel *below* the image rather than in a popover
 * anchored to the pin. A popover over a diagram covers the very thing the pin
 * is pointing at, and on a phone it either overflows the viewport or shrinks
 * to a few words -- both of which defeat the block. Below, the image stays
 * whole and the text has the full column width at any size.
 *
 * Pins are positioned in percentages (written by the authoring tool), so they
 * track their feature as the image box resizes. That only holds while the
 * rendered box has the image's own aspect ratio, which is why this block uses
 * `object-contain` on an `inline-block` wrapper that the image sizes itself --
 * not the fixed `aspect-video` box the plain image block uses. A letterboxed
 * image would leave the pins floating over the backing instead of the picture.
 */
/**
 * A media key as something an `<img>` can actually load.
 *
 * `resolveMediaSrc` is not enough on its own for an admin-uploaded file. It
 * points at `/files/view`, which calls `requireAuth`, and a browser attaches
 * no Authorization header to an `<img src>` -- so the request arrives
 * unauthenticated and comes back `400 Authentication is required`, rendering
 * as a broken image however correct the URL looks. The file has to be fetched
 * through `base()` (which does send the bearer token) and handed to the tag as
 * an object URL instead.
 *
 * AI-sourced images are stored as absolute URLs rather than storage keys, and
 * those are public, so they skip the fetch and are used as-is.
 */
function useAuthedMediaSrc(key) {
  /* Root-relative paths were being treated as storage keys and fetched, which
     is a request for the object `/diagrams/whatever.svg` in the bucket -- so
     every figure we draw ourselves and ship in `public/` came back empty. The
     absolute-URL test alone was too narrow; the question is whether the browser
     can already load it, and it can load both. */
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
      // Revoked on unmount and on every key change -- an object URL held for
      // the life of the tab is a leaked copy of the whole file.
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [key, isDirect])

  return isDirect ? key : blobSrc
}

/**
 * A media key as something a `<video>` can actually play.
 *
 * <p>Video cannot use {@link useAuthedMediaSrc}. That fetches the whole file
 * and hands it over as one blob, which for video means nothing plays until the
 * last byte lands, nothing can be seeked, and a lecture recording is held in
 * memory in its entirety -- and `/files/view` now refuses anything over 12 MB
 * outright, which is most videos.
 *
 * <p>It cannot use the plain endpoint URL either, which is what it was doing:
 * `/files/view` calls `requireAuth`, a browser attaches no Authorization header
 * to a `<video src>`, and the request came back 400. The player had a valid
 * source that never returned a frame, so the block rendered as its own dark
 * backing with a control bar over it -- a picture of a video.
 *
 * <p>A presigned URL is both fixes at once: the signature travels in the URL,
 * so no header is needed, and it is served by storage directly with range
 * support, so playback starts on the first chunk and the learner can scrub.
 */
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
  // Every pin the learner has opened at least once. The pulse is a "there is
  // something here" cue, so it has done its job the moment a pin is opened and
  // keeping it going afterwards is just motion nagging about content already
  // read. Tracked separately from `openId` because closing a pin must not make
  // it start pulsing again -- once all of them are opened, the image goes
  // still for good.
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

  /* An open point closes the way anything that opens over a picture closes:
     Escape, or a press anywhere that is not the card itself. Pins are excluded
     from the outside test so pressing a second point moves straight to it
     rather than needing one press to dismiss and another to open. */
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

  // Keyed on the stored value, not on `src`: `src` is empty for the moment the
  // authenticated fetch is in flight, and returning null on that would blank a
  // block that is about to have an image.
  if (!data.imageKey) {
    return null
  }

  return (
      <div className="space-y-4">
        <SectionIntro smallHeader={data.smallHeader} description={data.description} accent={accent} />

        <div className="flex justify-center rounded-[var(--radius-rb-tile)] border-2 border-border/70 bg-muted p-2">
          {/* The pins are placed in percentages of this box, so they are only
              correct once the image has laid out. Held back until then rather
              than drawn over an empty box, where they would cluster in the
              corner and then jump. */}
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
                      // `isolate` so the halo's negative z-index is contained
                      // by the pin and lands behind its own opaque background
                      // rather than behind the image.
                      className={`absolute isolate grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-sm font-bold shadow-md ring-2 ring-background transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                          isOpen
                              ? `scale-110 text-white ${accent.bgSolid}`
                              : "bg-foreground text-background"
                      }`}
                  >
                    {hotspotIndex + 1}

                    {/* An echo on the unopened pins. Without it they read as
                        numbers printed on the diagram and learners never
                        discover there is anything to open.

                        Two layers, not one. The static halo is the part that
                        always draws: it carries the affordance on its own, so
                        the block still works for a reader who has asked their
                        OS for less motion. The ping rides on top under
                        `motion-safe:`, which compiles to a
                        `prefers-reduced-motion: no-preference` query -- that
                        respondent gets the pulse, everyone else gets a pin
                        that is just as legible and holds still. Indefinite
                        auto-starting motion with no pause control is what
                        WCAG 2.2.2 is about, and a lesson can stack several of
                        these blocks on one page. */}
                    {isOpen ? null : (
                        <span
                            aria-hidden="true"
                            className={`absolute -inset-1 -z-10 rounded-full opacity-25 ${accent.bgSolid}`}
                        />
                    )}

                    {/* The pulse, only while this pin is still unread. It stops
                        for good once opened -- see `visitedIds` above. */}
                    {isOpen || isVisited ? null : (
                        <span
                            aria-hidden="true"
                            className={`absolute -inset-1 -z-10 rounded-full opacity-40 motion-safe:animate-ping ${accent.bgSolid}`}
                        />
                    )}
                  </button>
              )
            })}

            {/* The point's text, over the point.

                It used to render in a panel under the picture, which is the
                one place a reader is not looking when they press something on
                the picture: the diagram stayed where it was, a card appeared
                somewhere below it, and the two had to be connected by eye. The
                card now opens at the pin and covers it, so the answer arrives
                where the question was asked.

                Anchored by a corner rather than centred, and which corner
                depends on where the pin sits: a point on the right half opens
                leftwards, one on the bottom half opens upwards. That is what
                keeps a card belonging to a pin near an edge inside the
                picture instead of hanging off it. */}
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
                    /* `bg-popover` under the accent wash, not the wash alone.
                       `bgSoft` is a 10% tint -- opaque enough on the page's own
                       background, where every other accented card sits, and
                       nowhere near it here: this card is the only one that
                       floats ON the picture, so at 90% transparent the diagram
                       read straight through its own description and the text
                       was unreadable. The tint moves to a layer above the
                       opaque surface, which keeps the colour and gets the
                       contrast back. */
                    className={`absolute z-20 w-64 max-w-[calc(100%-1rem)] overflow-hidden rounded-[var(--radius-rb-tile)] border-2 bg-popover p-4 shadow-lg sm:w-72 ${accent.border}`}
                >
                  {/* The wash, as a layer rather than the card's own fill.
                      `-z-1` keeps it behind the content; the padding above is
                      on the card, so this spans the full tile. */}
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
                      /* Scrolls rather than grows. A long point on a short
                         diagram would otherwise make a card taller than the
                         picture it is drawn on. */
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
    // No leading dot. It read as a bullet, which made a heading look like the
    // first item of a list that never followed -- and where a real list did
    // follow, like a stray extra bullet above it.
    return (
        <h3 className="text-lg font-semibold text-foreground sm:text-xl">
          {data.text}
        </h3>
    )
  }

  if (tool.type === "description") {
    return (
        <div className="space-y-3">
          {/* Body copy is the thing a learner is here to read -- it gets the
              larger size, and `leading-8` on a 17px body is the tighter of the
              two ratios, not the looser. */}
          {renderText(data.text, "text-[17px] leading-8 text-foreground/85")}
        </div>
    )
  }

  if (tool.type === "unordered-list" || tool.type === "ordered-list") {
    const ordered = tool.type === "ordered-list"
    const Tag = ordered ? "ol" : "ul"

    /* Markers drawn as elements rather than left to `list-disc` /
       `list-decimal`. A native marker cannot be sized, filled or aligned
       independently of its line box, so an accent colour was the only thing
       these lists could express -- and learning objectives, which is what most
       of them are, ended up looking like a default browser list in the middle
       of an otherwise designed page.

       `data-marker` is the hook the topic page's dark section tone uses to
       re-ink these; the accent shades are tuned for a light card. */
    /* Sized so a list reads as part of the prose around it.

       It was 17px on `leading-7` with 12px between items and a 28px filled
       chip per number: a list of four short objectives ran 160px down the page
       and the markers, not the words, were the first thing the eye landed on.
       The type stays at the body's own size -- these ARE body copy -- and
       everything around it tightens: 6px between items, a 22px numeral, a 6px
       dot. A marker's job is to say where an item starts, which needs to be
       legible, not loud. */
    return (
        <Tag className="space-y-1.5">
          {(data.items ?? []).map((item, itemIndex) => (
              <li
                  key={item.id ?? item.text}
                  className="flex gap-2.5 text-[17px] leading-7 text-foreground"
              >
                {ordered ? (
                    /* `mt-[0.15em]` rather than a fixed offset, for the same
                       reason the dot below uses an em: the numeral sits on the
                       first line's cap height, which moves with the type. */
                    <span
                        data-marker
                        className={`mt-[0.15em] grid size-[1.375rem] shrink-0 place-items-center rounded-md text-xs font-bold tabular-nums ${accent.bgSoft} ${accent.text}`}
                    >
                      {itemIndex + 1}
                    </span>
                ) : (
                    /* `mt-[0.6em]`, not a fixed pixel offset: the dot has to sit
                       on the first line's optical centre, and that moves with
                       the body size this block inherits. */
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

  if (tool.type === "table") {
    return <TableBlock data={data} accent={accent} />
  }

  if (tool.type === "image") {
    return data.imageKey ? (
        <div>
          {/* `aspect-video w-full`, the same box the video block below uses, so
              every piece of media in a lesson is one width and one height
              instead of each image sizing itself to whatever it happens to be.
              The old `max-h-[520px]` let a tall image dictate its own height
              and a short one collapse, which is what made a run of them look
              ragged.

              `object-contain`, not cover: these are mostly diagrams, and
              cropping one to fill the box cuts off the labels around its
              edges -- exactly the part a learner needs. Contain fits the whole
              image and lets the Muted backing show where the aspect does not
              match. */}
          <LessonImage
              imageKey={data.imageKey}
              className="aspect-video w-full rounded-[var(--radius-rb-tile)] border-2 border-border/70 bg-muted object-contain"
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
    /* The same box every other picture in a lesson gets, so a run of media
       down a page is one width and one height rather than each block sizing
       itself to its own contents. */
    const image = data.imageKey ? (
        <LessonImage
            imageKey={data.imageKey}
            alt={data.title ?? ""}
            className="aspect-video w-full rounded-[var(--radius-rb-tile)] border-2 border-border/70 bg-muted object-contain"
            sourceUrl={data.imageSourceUrl}
            sourceName={data.imageSourceName}
        />
    ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-[var(--radius-rb-tile)] border-2 border-dashed border-border bg-muted text-muted-foreground">
          No image
        </div>
    )

    /* Prose, not a panel.

       The explanation beside a figure was wrapped in a tinted card with a 4px
       accent edge, which made the two halves of one thought look like a
       picture and a separate announcement about it -- and it was the only body
       copy in a lesson that did not look like body copy. A caption does not
       need a frame to be understood as belonging to the image next to it;
       being next to it is the whole device. Set at the lesson's own body size
       and colour so it reads continuously with the sections above and below. */
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

    /* Centred, not stretched. With the card gone there is no panel to match
       heights with, and a short paragraph pinned to the top of a 16:9 figure
       leaves a hole under it. */
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
    /* No card. An intro and a figure are the opening of a section, not an
       aside about one -- boxing them in a tinted panel with an accent edge
       made the lesson's own introduction look like a callout inside itself. */
    return (
        <div className="space-y-4">
          <SectionIntro smallHeader={data.smallHeader} description={data.description} accent={accent} />
          {data.imageKey ? (
              <div>
                {/* Same media box as the standalone image and video blocks --
                    an image inside a card is still an image, and sizing it by
                    a different rule is what made two of them next to each
                    other look mismatched. */}
                <LessonImage
                    imageKey={data.imageKey}
                    className="aspect-video w-full rounded-[var(--radius-rb-tile)] border-2 border-border/70 bg-muted object-contain"
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
                {/* The same 16:9 box as every other figure in a lesson. A
                    `max-h` let this one size itself to whatever it happened to
                    be, which is what made two images in a row look mismatched. */}
                <LessonImage
                    imageKey={data.imageKey}
                    className="aspect-video w-full rounded-[var(--radius-rb-tile)] border-2 border-border/70 bg-muted object-contain"
                    sourceUrl={data.imageSourceUrl}
                    sourceName={data.imageSourceName}
                />
              </div>
          ) : null}

          {/* A grid keeps its cards.

              This is the one block where the box is the point: these are
              parallel items in a set, read by comparison with each other rather
              than in sequence, and the card is what makes them countable at a
              glance and holds each one's text to its own item. `auto-rows-fr`
              stays with it -- boxes in a grid want a common baseline, and
              ragged bottoms on a row of cards read as a mistake rather than as
              economy. It is the prose blocks beside a figure that had no
              business in a frame, not this. */}
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
                    {/* Not muted-foreground: this sits on the card's own tint,
                        where grey on a wash is the weakest contrast in the
                        block, and it is the item's actual content. */}
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
                className="aspect-video w-full rounded-[var(--radius-rb-tile)] border-2 border-border/70 bg-muted object-contain"
                sourceUrl={data.imageSourceUrl}
                sourceName={data.imageSourceName}
            />
        ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-[var(--radius-rb-tile)] border-2 border-dashed border-border bg-muted text-muted-foreground">
              No media
            </div>
        )

    /* Prose beside the media, for the same reason the image-left/right blocks
       carry theirs that way: a caption does not need a frame to be read as
       belonging to the thing next to it. */
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

/** Parses a lesson_component_structure string and renders its blocks. */
export function LessonContent({ structure, className = "space-y-8" }) {
  const blocks = parseLessonStructure(structure)
  if (blocks.length === 0) {
    return null
  }
  return (
    <div className={className}>
      {blocks.map((tool, index) => (
        <LessonTool key={tool.id ?? index} tool={tool} index={index} />
      ))}
    </div>
  )
}
