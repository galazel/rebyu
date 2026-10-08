import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"
import { fetchFileBlob } from "@/services/fileService.js"


export function isDirectMediaSrc(key) {
  return Boolean(key) && (/^https?:\/\//.test(key) || key.startsWith("/"))
}

const MEDIA_CACHE_LIMIT = 48
const mediaCache = new Map()

function rememberMedia(key, entry) {
  mediaCache.delete(key)
  mediaCache.set(key, entry)
  while (mediaCache.size > MEDIA_CACHE_LIMIT) {
    const oldest = mediaCache.keys().next().value
    const evicted = mediaCache.get(oldest)
    mediaCache.delete(oldest)
    if (evicted?.url) URL.revokeObjectURL(evicted.url)
  }
}

function loadAuthedMedia(key) {
  const cached = mediaCache.get(key)
  if (cached) {
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
      mediaCache.delete(key)
      return ""
    })
  rememberMedia(key, entry)
  return entry.promise
}

export function prefetchAuthedMedia(keys) {
  for (const key of keys ?? []) {
    if (!key || isDirectMediaSrc(key)) continue
    loadAuthedMedia(key)
  }
}

export function questionMediaKeys(question) {
  if (!question) return []
  return [
    question.questionImageKey,
    ...(question.choices ?? []).map((choice) => choice?.imageKey),
  ].filter(Boolean)
}

export function useAuthedMediaSrc(key) {
  return useAuthedMedia(key).src
}

export function useAuthedMedia(key) {
  const isDirect = isDirectMediaSrc(key)
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

    return () => {
      cancelled = true
    }
  }, [key, isDirect])

  return { src: isDirect ? key : blobSrc, loading: isDirect ? false : loading }
}

export function AuthedImage({
  imageKey,
  alt = "",
  className = "",
  zoomable = false,
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
