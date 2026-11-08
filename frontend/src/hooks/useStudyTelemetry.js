import { useEffect, useRef } from "react"
import { recordStudyTelemetry } from "@/services/studyTelemetryService.js"

const ACTIVE_WINDOW_MS = 60_000
const HEARTBEAT_MS = 30_000

export function useStudyTelemetry({ lessonId, enabled = true }) {
  const activeAt = useRef(Date.now())
  const pendingSeconds = useRef(0)
  const lessonRef = useRef(lessonId)
  lessonRef.current = lessonId
  const send = (payload) => {
    if (!lessonRef.current) return
    recordStudyTelemetry({ lessonId: Number(lessonRef.current), ...payload }).catch(() => {})
  }
  useEffect(() => {
    if (!enabled || !lessonId) return undefined
    let lastTick = Date.now()
    const markActive = () => { activeAt.current = Date.now() }
    const flush = () => { if (pendingSeconds.current) { send({ eventType: "STUDY_TIME", durationSeconds: pendingSeconds.current }); pendingSeconds.current = 0 } }
    const tick = () => { const now = Date.now(); const elapsed = Math.min(HEARTBEAT_MS, Math.max(0, now - lastTick)); lastTick = now; if (document.visibilityState === "visible" && now - activeAt.current < ACTIVE_WINDOW_MS) pendingSeconds.current += Math.floor(elapsed / 1000); flush() }
    const onVisibility = () => { if (document.visibilityState === "hidden") flush(); else { activeAt.current = Date.now(); lastTick = Date.now() } }
    for (const event of ["pointerdown", "keydown", "wheel", "touchstart", "scroll"]) window.addEventListener(event, markActive, { passive: true })
    document.addEventListener("visibilitychange", onVisibility)
    const timer = window.setInterval(tick, HEARTBEAT_MS)
    return () => { window.clearInterval(timer); flush(); document.removeEventListener("visibilitychange", onVisibility); for (const event of ["pointerdown", "keydown", "wheel", "touchstart", "scroll"]) window.removeEventListener(event, markActive) }
  }, [lessonId, enabled])
  return { recordRush: (velocity = null) => send({ eventType: "RUSH", scrollVelocity: velocity }), recordChallengeCompleted: (result) => send({ eventType: "CHALLENGE_COMPLETED", correctCount: result?.correctCount ?? 0, questionCount: result?.totalQuestions ?? result?.answers?.length ?? 0 }) }
}
