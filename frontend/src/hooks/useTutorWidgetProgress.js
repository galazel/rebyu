import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { readWidgetField, writeWidgetField } from "@/lib/tutor-widget-progress.js"

export const TutorWidgetProgressContext = createContext(null)

export function useTutorWidgetProgress(field, initial) {
  const key = useContext(TutorWidgetProgressContext)
  const [value, setValue] = useState(() => readWidgetField(key, field, typeof initial === "function" ? initial() : initial))
  const current = useRef(value)
  // Preserve randomized initial layouts too, even before the first answer/move.
  useEffect(() => { writeWidgetField(key, field, current.current) }, [key, field])
  const update = useCallback((next) => {
    const resolved = typeof next === "function" ? next(current.current) : next
    current.current = resolved
    // Save on interaction, not unmount, so an immediate refresh cannot lose the answer.
    writeWidgetField(key, field, resolved)
    setValue(resolved)
  }, [key, field])
  return [value, update]
}
