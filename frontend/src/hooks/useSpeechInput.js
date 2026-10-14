import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Dictation through the browser's own speech recognition (Chrome, Edge, Safari).
 * Free and keyless; the audio is handled by the browser, nothing is uploaded by us.
 *
 * `onText(text)` receives what was in the box when dictation began plus everything
 * heard so far, interim words included, so the learner watches it appear and can
 * edit before sending.
 */
export function useSpeechInput({ onText, lang = "en-US" } = {}) {
  const Recognition =
    typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : undefined
  const supported = Boolean(Recognition)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)
  const onTextRef = useRef(onText)
  onTextRef.current = onText

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const start = useCallback(
    (initialText = "") => {
      if (!supported || recognitionRef.current) return
      const recognition = new Recognition()
      recognition.lang = lang
      recognition.continuous = true
      recognition.interimResults = true
      const prefix = initialText && !/\s$/.test(initialText) ? `${initialText} ` : initialText
      let finalText = ""

      recognition.onresult = (event) => {
        let interim = ""
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const piece = event.results[i][0].transcript
          if (event.results[i].isFinal) finalText += piece
          else interim += piece
        }
        onTextRef.current?.(`${prefix}${finalText}${interim}`.replace(/\s+/g, " ").trimStart())
      }
      recognition.onerror = (event) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setError("Microphone access is blocked. Allow it in your browser's site settings.")
        } else if (event.error === "no-speech") {
          setError("Didn't catch that — try again a little closer to the mic.")
        } else if (event.error !== "aborted") {
          setError("Voice input stopped unexpectedly. Please try again.")
        }
      }
      recognition.onend = () => {
        recognitionRef.current = null
        setListening(false)
      }

      setError(null)
      recognitionRef.current = recognition
      try {
        recognition.start()
        setListening(true)
      } catch {
        recognitionRef.current = null
        setListening(false)
      }
    },
    [Recognition, supported, lang],
  )

  useEffect(() => () => recognitionRef.current?.abort(), [])

  return { supported, listening, error, start, stop, toggle: (text) => (listening ? stop() : start(text)) }
}
