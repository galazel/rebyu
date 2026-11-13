import { useCallback, useEffect, useRef } from "react"

/**
 * Keeps an active learning run from being left by a browser Back action.
 * The caller still owns its explicit Exit control, which always routes to a
 * known safe destination instead of whichever page happens to be in history.
 */
export function useSessionHistoryGuard({ enabled, onBack }) {
  const restoringRef = useRef(false)
  const exitingRef = useRef(false)

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return undefined

    if (!window.history.state?.rebyuSessionGuard) {
      window.history.pushState(
        { ...(window.history.state ?? {}), rebyuSessionGuard: true },
        "",
        window.location.href,
      )
    }

    const onPopState = () => {
      if (exitingRef.current) return
      if (restoringRef.current) {
        restoringRef.current = false
        return
      }
      restoringRef.current = true
      window.history.go(1)
      onBack?.()
    }

    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [enabled, onBack])

  const exitTo = useCallback((navigate, to) => {
    exitingRef.current = true

    // Replace the original session entry after stepping past the duplicate
    // guard. Back from the destination therefore never reopens the run.
    if (window.history.state?.rebyuSessionGuard) {
      const replaceAfterBack = () => navigate(to, { replace: true })
      window.addEventListener("popstate", replaceAfterBack, { once: true })
      window.history.back()
      return
    }

    navigate(to, { replace: true })
  }, [])

  return { exitTo }
}

export default useSessionHistoryGuard
