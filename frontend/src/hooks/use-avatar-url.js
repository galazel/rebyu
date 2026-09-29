import { useEffect, useState } from "react"

import { getFileViewLink } from "@/services/fileService"

/**
 * Profile pictures are stored as object keys and served through short-lived
 * signed links, so every place that draws a person has to turn a key into a
 * URL before it can show one.
 *
 * <p>Resolved once per key and remembered for the life of the page. A feed is
 * mostly the same few people posting repeatedly, so without this a screen of
 * twenty posts by three authors would ask for twenty links -- and each of
 * those is a round trip that the picture is not worth.
 *
 * <p>The in-flight promise is cached, not just the result, so ten cards
 * mounting together with the same author ask once between them rather than
 * ten times in the same tick.
 */
const linkCache = new Map()

function resolve(key) {
  if (!linkCache.has(key)) {
    linkCache.set(
      key,
      getFileViewLink(key).then(
        ({ url }) => url,
        () => {
          // Forgotten rather than remembered as broken: a link can fail for a
          // reason that has passed (offline for a moment), and a key cached as
          // null would show initials until the tab was reloaded.
          linkCache.delete(key)
          return null
        }
      )
    )
  }
  return linkCache.get(key)
}

/** One picture. Returns null until it resolves, and if it never does. */
export function useAvatarUrl(key) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    if (!key) {
      setUrl(null)
      return undefined
    }
    let cancelled = false
    resolve(key).then((value) => !cancelled && setUrl(value ?? null))
    return () => {
      cancelled = true
    }
  }, [key])

  return url
}

/**
 * Several at once, as a {key: url} map.
 *
 * <p>Keyed on the sorted, de-duplicated list rather than the array itself, so
 * a feed re-rendering with the same authors in a different order does not
 * re-run and re-resolve them.
 */
export function useAvatarUrls(keys) {
  const wanted = [...new Set((keys ?? []).filter(Boolean))].sort()
  const signature = wanted.join("|")
  const [urls, setUrls] = useState({})

  useEffect(() => {
    if (!signature) return undefined
    let cancelled = false
    const list = signature.split("|")

    Promise.all(list.map((key) => resolve(key))).then((resolved) => {
      if (cancelled) return
      const next = {}
      list.forEach((key, index) => {
        if (resolved[index]) next[key] = resolved[index]
      })
      setUrls((current) => ({ ...current, ...next }))
    })

    return () => {
      cancelled = true
    }
  }, [signature])

  return urls
}
