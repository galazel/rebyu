import { useEffect } from "react"
import { toast } from "sonner"
import { Mic, MicOff } from "@/components/icons"
import { useSpeechInput } from "@/hooks/useSpeechInput.js"

/**
 * Speak instead of type: dictates into a text box. Words appear live and stay
 * editable; nothing is sent until the learner presses send. Hidden in browsers
 * without speech recognition (e.g. Firefox).
 */
export function MicButton({ value, onChange, disabled = false, className = "" }) {
  const speech = useSpeechInput({ onText: onChange })

  useEffect(() => {
    if (disabled && speech.listening) speech.stop()
  }, [disabled, speech])

  useEffect(() => {
    if (speech.error) toast.error(speech.error)
  }, [speech.error])

  if (!speech.supported) return null

  return (
    <button
      type="button"
      onClick={() => speech.toggle(value)}
      disabled={disabled}
      aria-pressed={speech.listening}
      aria-label={speech.listening ? "Stop voice input" : "Speak your message"}
      title={speech.listening ? "Stop listening" : "Speak instead of typing"}
      className={`relative grid size-9 shrink-0 place-items-center rounded-full transition-colors disabled:opacity-50 ${
        speech.listening ? "bg-rb-cardinal text-white" : "text-rb-wolf hover:bg-rb-polar hover:text-rb-eel"
      } ${className}`}
    >
      {speech.listening ? (
        <>
          <span className="absolute inset-0 animate-ping rounded-full bg-rb-cardinal/40" aria-hidden="true" />
          <MicOff className="relative size-4" aria-hidden="true" />
        </>
      ) : (
        <Mic className="size-4" aria-hidden="true" />
      )}
    </button>
  )
}
