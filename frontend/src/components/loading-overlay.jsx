import { createContext, useCallback, useContext, useId, useLayoutEffect, useMemo, useRef, useState } from "react"

import { LoadingScreen, messagesForUser } from "@/components/loading-screen.jsx"
import { useAuth } from "@/context/auth-context.jsx"

const MIN_VISIBLE_MS = 1200


const LoadingContext = createContext(null)

export function LoadingOverlayProvider({ children }) {
  const [signals, setSignals] = useState([])
  const [phase, setPhase] = useState("hidden")
  const [messages, setMessages] = useState(undefined)
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

export function LoadingSignal({ messages }) {
  const context = useContext(LoadingContext)
  const id = useId()

  useLayoutEffect(() => {
    if (!context) return undefined
    context.register(id, messages)
    return () => context.unregister(id)
  }, [context, id, messages])

  return context ? null : <LoadingScreen messages={messages} />
}
