import { createContext, useCallback, useContext, useId, useLayoutEffect, useMemo, useRef, useState } from "react"

import { LoadingScreen, messagesForUser } from "@/components/loading-screen.jsx"
import { useAuth } from "@/context/auth-context.jsx"

const MIN_VISIBLE_MS = 1200

/**
 * One loading screen for the whole app, that finishes instead of vanishing.
 *
 * Anything that is waiting (the auth check, a lazily-loaded route's Suspense
 * fallback, an assessment being graded) renders `<LoadingSignal />`. While at
 * least one signal is mounted the overlay shows and its chalk bar creeps toward
 * 90%. When the last signal unmounts the bar fills to 100%, holds a beat, and
 * only then fades out -- so a fast load still reads as a load that completed.
 *
 * Because the overlay lives above the routes rather than inside them, handing
 * off from one wait to the next (grading -> result page loading) keeps the same
 * screen up rather than flashing between two.
 */

const LoadingContext = createContext(null)

export function LoadingOverlayProvider({ children }) {
  const [signals, setSignals] = useState([])
  const [phase, setPhase] = useState("hidden") // hidden | loading | finishing
  const [messages, setMessages] = useState(undefined)
  // A wait with no copy of its own (a route loading, the auth check) speaks
  // for the portal it is in: a learner, an institution, a department head or an
  // admin each see their own lines.
  const { user } = useAuth()
  const roleMessages = messagesForUser(user)

  const register = useCallback((id, next) => {
    setSignals((list) => [...list.filter((s) => s.id !== id), { id, messages: next }])
  }, [])
  const unregister = useCallback((id) => {
    setSignals((list) => list.filter((s) => s.id !== id))
  }, [])

  const active = signals.length > 0
  const latest = signals.at(-1)?.messages

  // When the overlay went up, so a quick load still shows the bar climbing
  // for a moment before it fills.
  const shownAt = useRef(0)

  useLayoutEffect(() => {
    if (active) {
      setPhase((current) => {
        if (current === "hidden") shownAt.current = Date.now()
        return "loading"
      })
      setMessages(latest)
      return undefined
    }
    const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt.current))
    const finish = setTimeout(() => {
      setPhase((current) => (current === "loading" ? "finishing" : current))
    }, wait)
    return () => clearTimeout(finish)
  }, [active, latest])

  const value = useMemo(() => ({ register, unregister }), [register, unregister])

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {phase !== "hidden" ? (
        <LoadingScreen
          overlay
          messages={messages ?? roleMessages}
          finishing={phase === "finishing"}
          onFinished={() => setPhase((current) => (current === "finishing" ? "hidden" : current))}
        />
      ) : null}
    </LoadingContext.Provider>
  )
}

/** Mount while something is loading; the shared overlay stays up until every signal is gone. */
export function LoadingSignal({ messages }) {
  const context = useContext(LoadingContext)
  const id = useId()

  useLayoutEffect(() => {
    if (!context) return undefined
    context.register(id, messages)
    return () => context.unregister(id)
  }, [context, id, messages])

  // Outside the provider (tests, isolated previews) fall back to the screen itself.
  return context ? null : <LoadingScreen messages={messages} />
}
