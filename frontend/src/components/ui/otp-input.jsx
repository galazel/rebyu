import { useMemo, useRef } from "react"

import { cn } from "@/lib/utils"

export function OtpInput({
  value = "",
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  invalid = false,
  id = "otp",
  label = "Verification code",
}) {
  const inputsRef = useRef([])

  const digits = useMemo(() => {
    const characters = String(value ?? "").slice(0, length).split("")
    return Array.from({ length }, (_, index) => characters[index] ?? "")
  }, [value, length])

  function focusBox(index) {
    const target = inputsRef.current[index]
    if (target) {
      target.focus()
      target.select()
    }
  }

  function commit(next) {
    const trimmed = next.slice(0, length)
    onChange?.(trimmed)

    if (trimmed.length === length) {
      onComplete?.(trimmed)
    }
  }

  function handleChange(index, raw) {
    const typed = raw.replace(/\D/g, "")
    if (!typed) return

    const next = digits.slice()
    for (let offset = 0; offset < typed.length && index + offset < length; offset += 1) {
      next[index + offset] = typed[offset]
    }

    commit(next.join(""))
    focusBox(Math.min(index + typed.length, length - 1))
  }

  function handleKeyDown(index, event) {
    if (event.key === "Backspace") {
      event.preventDefault()

      const next = digits.slice()
      if (next[index]) {
        next[index] = ""
        commit(next.join(""))
        return
      }

      if (index > 0) {
        next[index - 1] = ""
        commit(next.join(""))
        focusBox(index - 1)
      }
      return
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault()
      focusBox(index - 1)
      return
    }

    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault()
      focusBox(index + 1)
    }
  }

  function handlePaste(index, event) {
    const pasted = event.clipboardData?.getData("text")?.replace(/\D/g, "")
    if (!pasted) return

    event.preventDefault()
    handleChange(index, pasted)
  }

  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center justify-between gap-2 sm:gap-3"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            inputsRef.current[index] = node
          }}
          id={index === 0 ? id : `${id}-${index}`}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={length}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          value={digit}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          onFocus={(event) => event.target.select()}
          className={cn(
            "h-14 w-full min-w-0 rounded-xl border-2 bg-card text-center text-xl font-semibold text-foreground",
            "transition-[border-color,box-shadow] outline-none",
            "focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            invalid
              ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
              : "border-border hover:border-rb-hare"
          )}
        />
      ))}
    </div>
  )
}

export default OtpInput
