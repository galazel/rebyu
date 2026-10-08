import { useEffect, useState } from "react"

import { getFileViewLink } from "@/services/fileService"

const linkCache = new Map()

function resolve(key) {
  if (!linkCache.has(key)) {
    linkCache.set(
      key,
      getFileViewLink(key).then(
        ({ url }) => url,
        () => {
          linkCache.delete(key)
          return null
        }
      )
    )
  }
  return linkCache.get(key)
}

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
