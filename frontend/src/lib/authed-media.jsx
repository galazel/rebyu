import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"
import { fetchFileBlob } from "@/services/fileService.js"

/**
 * Loading a stored image into an `<img>` that actually renders it.
 *
 * `/api/files/view` calls `requireAuth`, and a browser attaches NO
 * Authorization header to an `<img src>`. So pointing a tag straight at that
 * URL -- which is what `getFileViewUrl` returns -- produces an unauthenticated
 * request, a `400 Authentication is required`, and a broken image, however
 * correct the URL looks. Every question and choice image in every assessment
 * was doing exactly that, so none of the 619 questions that carry a figure
 * ever showed one: past-paper diagrams, tables and code listings all silently
 * missing from the item they belong to.
 *
 * The lesson renderer had already solved this privately. Extracted here so the
 * assessment screens share the fix rather than each rediscovering it.
 */

/**
 * Whether a stored media reference is already a URL a browser can load.
 *
 * Three different things live in the same `imageKey` field: an absolute URL
 * (an AI search result), a root-relative path (a diagram we drew and ship in
 * `public/`), or an internal storage key. Only the third needs fetching; the
 * first two are already loadable and must not be.
 */
export function isDirectMediaSrc(key) {
  return Boolean(key) && (/^https?:\/\//.test(key) || key.startsWith("/"))
}

/**
 * Object URLs by storage key, shared by every component that asks for one.
 *
 * Fetching a figure costs two round trips -- a signed link from the API, then
 * the bytes from storage -- so a question that renders its figure only when it
 * appears shows the stem and the choices first and the figure a second or two
 * later, which on a timed adaptive paper is a question the learner has already
 * started answering without the thing it is about. The cache exists so the
 * bytes can be fetched BEFORE the item is on screen (see
 * {@link prefetchAuthedMedia}) and be there synchronously when it is.
 *
 * Entries are held for the life of the tab because an attempt revisits the
 * same figure (answer, review, result), bounded so a long session cannot
 * accumulate every scan it has seen.
 */
const MEDIA_CACHE_LIMIT = 48
/** key -> { promise, url } -- `url` set once resolved, `null` if it failed. */
const mediaCache = new Map()

function rememberMedia(key, entry) {
  mediaCache.delete(key)
  mediaCache.set(key, entry)
  while (mediaCache.size > MEDIA_CACHE_LIMIT) {
    const oldest = mediaCache.keys().next().value
    const evicted = mediaCache.get(oldest)
    mediaCache.delete(oldest)
    // An object URL is a live copy of the file; dropping the reference alone
    // does not free it.
    if (evicted?.url) URL.revokeObjectURL(evicted.url)
  }
}

/** The object URL for a storage key, fetching it once and reusing it after. */
function loadAuthedMedia(key) {
  const cached = mediaCache.get(key)
  if (cached) {
    // Touch, so what is still in use is not the next thing evicted.
    rememberMedia(key, cached)
    return cached.promise
  }

  const entry = { promise: null, url: null }
  entry.promise = fetchFileBlob(key)
    .then((blob) => {
      entry.url = URL.createObjectURL(blob)
      return entry.url
    })
    .catch(() => {
      // A failure is not cached: the next mount (or a retry after the
      // connection comes back) should try again rather than inherit it.
      mediaCache.delete(key)
      return ""
    })
  rememberMedia(key, entry)
  return entry.promise
}

/**
 * Starts fetching figures that are not on screen yet.
 *
 * Call it with the items the learner will reach next -- the adaptive reserve,
 * the rest of a fixed paper -- while they are answering the current one. By
 * the time the item is shown its figure is in the cache and renders with the
 * stem, in the same frame, instead of arriving after it.
 *
 * Safe to call repeatedly with the same keys; each is fetched once.
 */
export function prefetchAuthedMedia(keys) {
  for (const key of keys ?? []) {
    if (!key || isDirectMediaSrc(key)) continue
    loadAuthedMedia(key)
  }
}

/** Every stored figure an attempt question carries, its own and its choices'. */
export function questionMediaKeys(question) {
  if (!question) return []
  return [
    question.questionImageKey,
    ...(question.choices ?? []).map((choice) => choice?.imageKey),
  ].filter(Boolean)
}

/** A media key as something an `<img>` can load: an object URL, or the key itself. */
export function useAuthedMediaSrc(key) {
  return useAuthedMedia(key).src
}

/**
 * The same, with whether the bytes are still coming.
 *
 * A caller that holds the figure's place needs to tell "not here yet" from
 * "it failed" -- the first is a placeholder, the second is nothing at all.
 */
export function useAuthedMedia(key) {
  const isDirect = isDirectMediaSrc(key)
  /* Seeded from the cache, not empty: a prefetched figure must be in the very
     first render of the question, or the prefetch has bought nothing. */
  const [blobSrc, setBlobSrc] = useState(() =>
    !key || isDirect ? "" : (mediaCache.get(key)?.url ?? ""),
  )
  const [loading, setLoading] = useState(
    () => Boolean(key) && !isDirect && !mediaCache.get(key)?.url,
  )

  useEffect(() => {
    if (!key || isDirect) {
      setBlobSrc("")
      setLoading(false)
      return undefined
    }

    const ready = mediaCache.get(key)?.url ?? ""
    setBlobSrc(ready)
    setLoading(!ready)
    if (ready) return undefined

    let cancelled = false
    loadAuthedMedia(key).then((url) => {
      if (cancelled) return
      setBlobSrc(url)
      setLoading(false)
    })

    /* No revoking here: the URL belongs to the cache and other mounts (and
       later questions) share it. The cache revokes what it evicts. */
    return () => {
      cancelled = true
    }
  }, [key, isDirect])

  return { src: isDirect ? key : blobSrc, loading: isDirect ? false : loading }
}

/**
 * A figure belonging to a question or one of its choices.
 *
 * Never flashes a broken-image glyph: on an exam item a broken figure reads as
 * part of the question, and a learner cannot tell "no picture here" from "the
 * picture failed". While the bytes are still coming it holds a placeholder of
 * its own -- the item says a figure belongs here, so the choices must not sit
 * where it will be and then be shoved down when it lands. If it never arrives,
 * nothing is the honest state.
 */
export function AuthedImage({
  imageKey,
  alt = "",
  className = "",
  zoomable = false,
  /* A choice's thumbnail is not a full-width scan; it says what its own
     placeholder should look like rather than inheriting the stem figure's. */
  placeholderClassName = "mx-auto mt-3 h-28 w-full max-w-md",
}) {
  const { src, loading } = useAuthedMedia(imageKey)
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    if (!zoomed) return undefined
    const onKey = (event) => {
      if (event.key === "Escape") setZoomed(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [zoomed])

  if (!imageKey) return null
  if (!src) {
    if (!loading) return null
    /* Keeps the figure's place. Not `loading="lazy"`-style deferral either:
       the figure IS the question, so it is fetched eagerly and the learner is
       told it is on its way. */
    return (
      <div
        aria-busy="true"
        aria-label="Loading figure"
        className={cn(
          "flex animate-pulse items-center justify-center rounded-xl border-2 border-dashed border-rb-swan bg-rb-polar text-xs font-semibold text-rb-wolf",
          placeholderClassName,
        )}
      >
        loading figure…
      </div>
    )
  }
  const image = <img src={src} alt={alt} className={className} loading="eager" />
  if (!zoomable) return image

  /* These figures are scans of a past paper -- a DFD with a dozen labelled
     nodes, a five-row table -- and the card caps their height so the choices
     stay on screen. Capped, the labels are too small to read, which makes the
     question unanswerable rather than compact. So the cap stands and the
     figure opens full size on click. */
  return (
    <>
      <button
        type="button"
        onClick={() => setZoomed(true)}
        title="Click to enlarge"
        aria-label="Enlarge figure"
        className="group relative mx-auto block cursor-zoom-in rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rb-feather"
      >
        {image}
        <span className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-black/65 px-2 py-0.5 text-[11px] font-bold text-white opacity-0 transition group-hover:opacity-100">
          click to enlarge
        </span>
      </button>

      {zoomed
        ? createPortal(
            /* A portal, because the card that holds the figure clips and
               scrolls its own content -- an overlay rendered inside it would
               be cropped by the very box the learner is trying to escape. */
            <div
              role="dialog"
              aria-modal="true"
              aria-label={alt || "Figure"}
              onClick={() => setZoomed(false)}
              className="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            >
              <img
                src={src}
                alt={alt}
                onClick={(event) => event.stopPropagation()}
                className="max-h-[92vh] max-w-[92vw] cursor-default rounded-lg bg-white object-contain shadow-2xl"
              />
              <button
                type="button"
                onClick={() => setZoomed(false)}
                aria-label="Close figure"
                className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-sm font-bold text-rb-eel shadow-lg"
              >
                close
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
