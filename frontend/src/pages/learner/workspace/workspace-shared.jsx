import { useCallback, useEffect, useRef, useState } from "react"

import { Upload } from "@/components/icons"
import { TactileButton } from "@/components/rebyu/rebyu-ui.jsx"


export const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt"]
export const ACCEPT_ATTRIBUTE = ACCEPTED_EXTENSIONS.join(",")
export const MAX_FILE_BYTES = 25 * 1024 * 1024

export function fileExtension(name) {
  const dot = name.lastIndexOf(".")
  return dot === -1 ? "" : name.slice(dot).toLowerCase()
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function useUploadedFile() {
  const [file, setFile] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const url = file?.previewUrl
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [file])

  const accept = useCallback((chosen) => {
    if (!chosen) return
    if (!ACCEPTED_EXTENSIONS.includes(fileExtension(chosen.name))) {
      setError("That file type is not supported. Use a PDF, Word document or TXT file.")
      return
    }
    if (chosen.size > MAX_FILE_BYTES) {
      setError(
        `That file is ${formatBytes(chosen.size)}. The limit is ${formatBytes(MAX_FILE_BYTES)}.`
      )
      return
    }
    setError(null)
    setFile(Object.assign(chosen, { previewUrl: URL.createObjectURL(chosen) }))
  }, [])

  const clear = useCallback(() => {
    setFile(null)
    setError(null)
  }, [])

  return { file, error, accept, clear }
}

export function UploadDropzone({ onFile, error, icon: Icon = Upload, title, subtitle }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  return (
    <div className="flex h-full min-h-0 items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            const dropped = event.dataTransfer?.files?.[0]
            if (dropped) onFile(dropped)
          }}
          className={`rounded-rb-card border-2 border-dashed px-6 py-12 text-center transition-colors ${
            dragging ? "border-rb-beetle bg-rb-beetle-wash" : "border-border bg-card"
          }`}
        >
          <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-rb-beetle text-white shadow-[var(--comic-shadow-sm)] ring-2 ring-white">
            <Icon className="size-7" aria-hidden="true" />
          </span>

          <p className="mt-6 font-rb-display text-xl font-extrabold text-rb-eel">{title}</p>
          <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-6 text-rb-wolf">
            {subtitle}
          </p>

          <TactileButton className="mt-7" onClick={() => inputRef.current?.click()}>
            <Upload className="size-4" aria-hidden="true" />
            Choose a file
          </TactileButton>

          <p className="mt-4 text-xs font-bold text-rb-hare">
            PDF, Word or TXT · up to {formatBytes(MAX_FILE_BYTES)}
          </p>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_ATTRIBUTE}
            className="hidden"
            onChange={(event) => {
              const chosen = event.target.files?.[0]
              if (chosen) onFile(chosen)
              event.target.value = ""
            }}
          />
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-3 rounded-rb-tile border-2 border-rb-cardinal/40 bg-rb-cardinal-wash px-4 py-3 text-sm font-bold text-rb-cardinal-lip"
          >
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function FeatureHeader({ title, subtitle, backTo = "/learner/workspace", children }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="min-w-0">
          <h1 className="rb-display rb-display-sm truncate">{title}</h1>
          <p className="text-sm font-medium text-rb-wolf">{subtitle}</p>
        </div>
      </div>
      {children}
    </header>
  )
}

export function NotConnectedNote({ children }) {
  return (
    <p className="mx-4 mb-6 rounded-rb-card border-2 border-border bg-card p-4 text-sm font-medium leading-6 text-rb-wolf lg:mx-6">
      <span className="font-extrabold text-rb-eel">Not connected yet.</span> {children}
    </p>
  )
}
