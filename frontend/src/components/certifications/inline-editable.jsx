import { useEffect, useRef, useState } from "react"

import { Check, Pencil, Plus, X } from "@/components/icons"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function InlineEditable({
  value,
  onSave,
  validate,
  renderValue,
  label,
  placeholder,
  multiline = false,
  tone = "light",
  className = "",
  editClassName = "",
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? "")
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const fieldRef = useRef(null)

  useEffect(() => {
    if (!isEditing) setDraft(value ?? "")
  }, [value, isEditing])

  useEffect(() => {
    if (!isEditing) return
    const field = fieldRef.current
    if (!field) return
    field.focus()
    field.setSelectionRange(field.value.length, field.value.length)
  }, [isEditing])

  const onDark = tone === "dark"

  function open() {
    setDraft(value ?? "")
    setError("")
    setIsEditing(true)
  }

  function cancel() {
    setDraft(value ?? "")
    setError("")
    setIsEditing(false)
  }

  async function commit() {
    if (isSaving) return

    const message = validate ? validate(draft) : ""
    if (message) {
      setError(message)
      return
    }

    const next = draft.trim()
    if (next === String(value ?? "").trim()) {
      setIsEditing(false)
      return
    }

    try {
      setIsSaving(true)
      await onSave(next)
      setIsEditing(false)
      setError("")
    } catch (saveError) {
      setError(
        saveError?.response?.data?.message ??
          saveError?.message ??
          "That change could not be saved."
      )
    } finally {
      setIsSaving(false)
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault()
      cancel()
      return
    }

    if (event.key === "Enter" && !multiline) {
      event.preventDefault()
      void commit()
    }
  }

  if (!isEditing) {
    return (
      <span className={`group/inline relative inline-flex max-w-full items-start gap-2 ${className}`}>
        {renderValue(value)}

        <button
          type="button"
          onClick={open}
          aria-label={`Edit ${label.toLowerCase()}`}
          title={`Edit ${label.toLowerCase()}`}
          className={`mt-1 inline-flex size-7 shrink-0 items-center justify-center rounded-full opacity-50 transition focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 group-hover/inline:opacity-100 ${
            onDark
              ? "text-white/80 hover:bg-white/20 hover:text-white focus-visible:outline-white"
              : "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-ring"
          }`}
        >
          <Pencil className="size-3.5" />
        </button>
      </span>
    )
  }

  const Field = multiline ? Textarea : Input

  return (
    <span className={`flex w-full flex-col gap-2 ${className}`}>
      <span className="flex w-full items-start gap-2">
        <Field
          ref={fieldRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          aria-label={label}
          placeholder={placeholder}
          rows={multiline ? 4 : undefined}
          className={`${
            onDark
              ? "border-white/40 bg-white/15 text-white placeholder:text-white/60"
              : "bg-background"
          } ${editClassName}`}
        />

        <span className="flex shrink-0 gap-1 pt-1">
          <button
            type="button"
            onClick={commit}
            disabled={isSaving}
            aria-label={`Save ${label.toLowerCase()}`}
            className={`inline-flex size-8 items-center justify-center rounded-full transition disabled:opacity-50 ${
              onDark
                ? "bg-white text-rb-feather hover:bg-white/90"
                : "bg-primary text-primary-foreground hover:opacity-90"
            }`}
          >
            <Check className="size-4" />
          </button>

          <button
            type="button"
            onClick={cancel}
            disabled={isSaving}
            aria-label={`Cancel editing ${label.toLowerCase()}`}
            className={`inline-flex size-8 items-center justify-center rounded-full transition disabled:opacity-50 ${
              onDark
                ? "text-white hover:bg-white/20"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <X className="size-4" />
          </button>
        </span>
      </span>

      {error ? (
        <span
          role="alert"
          className={`text-xs font-medium ${onDark ? "text-white" : "text-destructive"}`}
        >
          {error}
        </span>
      ) : null}
    </span>
  )
}

export default InlineEditable


export function InlineAdd({ label, placeholder, validate, onAdd, className = "" }) {
  const [isAdding, setIsAdding] = useState(false)
  const [draft, setDraft] = useState("")
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const fieldRef = useRef(null)

  useEffect(() => {
    if (isAdding) fieldRef.current?.focus()
  }, [isAdding])

  function close() {
    setIsAdding(false)
    setDraft("")
    setError("")
  }

  async function commit() {
    if (isSaving) return

    const message = validate ? validate(draft) : ""
    if (message) {
      setError(message)
      return
    }

    try {
      setIsSaving(true)
      await onAdd(draft.trim())
      close()
    } catch (addError) {
      setError(
        addError?.response?.data?.message ??
          addError?.message ??
          `That ${label.toLowerCase()} could not be added.`
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (!isAdding) {
    return (
      <button
        type="button"
        onClick={() => setIsAdding(true)}
        className={`inline-flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:border-primary hover:bg-primary/5 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${className}`}
      >
        <Plus className="size-4" />
        Add {label.toLowerCase()}
      </button>
    )
  }

  return (
    <div className={`flex w-full flex-col gap-2 ${className}`}>
      <div className="flex w-full items-start gap-2">
        <Input
          ref={fieldRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault()
              close()
            }
            if (event.key === "Enter") {
              event.preventDefault()
              void commit()
            }
          }}
          disabled={isSaving}
          aria-label={`New ${label.toLowerCase()}`}
          placeholder={placeholder ?? `Name the new ${label.toLowerCase()}`}
          className="bg-background"
        />

        <div className="flex shrink-0 gap-1 pt-1">
          <button
            type="button"
            onClick={commit}
            disabled={isSaving}
            aria-label={`Add ${label.toLowerCase()}`}
            className="inline-flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            <Check className="size-4" />
          </button>

          <button
            type="button"
            onClick={close}
            disabled={isSaving}
            aria-label={`Cancel adding ${label.toLowerCase()}`}
            className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {error ? (
        <span role="alert" className="text-xs font-medium text-destructive">
          {error}
        </span>
      ) : null}
    </div>
  )
}
