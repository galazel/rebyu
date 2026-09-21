import { useEffect, useRef, useState } from "react"
import { AlertCircleIcon, Award, UploadIcon, XIcon } from "@/components/icons"

import { formatBytes } from "@/hooks/use-file-upload"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * The certification's badge: the emblem a learner earns, in the manner of a
 * Credly or Cisco digital badge.
 *
 * One square image, previewed in the round the way badge platforms show
 * them, so an admin sees what the artwork looks like cropped before it goes
 * up. Optional -- a certification without one keeps the wordmark cover.
 */

/* Must match CertificationBadgeService on the server. */
const MAX_SIZE_MB = 2
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"]
const ACCEPT = [...ACCEPTED_TYPES, ".png", ".jpg", ".jpeg", ".webp", ".svg"].join(",")

export function BadgeUploadStep({ value, onChange, disabled }) {
  const inputRef = useRef(null)
  const [problem, setProblem] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState("")

  /* An object URL per file, revoked when the file changes or the step unmounts. */
  useEffect(() => {
    if (!value) {
      setPreviewUrl("")
      return
    }
    const url = URL.createObjectURL(value)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  function accept(file) {
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setProblem("A badge must be a PNG, JPG, WebP or SVG image.")
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setProblem(`A badge image must be ${MAX_SIZE_MB} MB or smaller.`)
      return
    }
    setProblem("")
    onChange(file)
  }

  function clear() {
    setProblem("")
    onChange(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Badge image</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          The emblem learners earn when they complete this certification, like a Credly or Cisco badge.
          Optional; square artwork looks best.
        </p>
      </div>

      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border border-dashed p-4 transition-colors has-[input:focus]:ring-2",
          problem
            ? "border-destructive bg-destructive/5 has-[input:focus]:ring-destructive/30"
            : "border-border has-[input:focus]:border-primary has-[input:focus]:ring-ring/30",
          isDragging && "border-primary bg-primary/5",
        )}
        onDragEnter={(event) => {
          event.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault()
          setIsDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          if (!disabled) accept(event.dataTransfer.files?.[0])
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          disabled={disabled}
          aria-label="Upload certification badge image"
          className="sr-only"
          onChange={(event) => accept(event.target.files?.[0])}
        />

        {value && previewUrl ? (
          <div className="flex w-full flex-col items-center gap-4 py-3 text-center sm:flex-row sm:text-left">
            {/* Round crop with a ring, the way badge platforms present them. */}
            <div className="grid size-28 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-primary/20 bg-background shadow-sm">
              <img src={previewUrl} alt="Badge preview" className="size-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{value.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{formatBytes(value.size)}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => inputRef.current?.click()}
                >
                  <UploadIcon aria-hidden="true" className="-ms-1 size-4 opacity-60" />
                  Replace
                </Button>
                <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={clear}>
                  <XIcon aria-hidden="true" className="-ms-1 size-4 opacity-60" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center px-4 py-3 text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
              <Award className="size-5" />
            </div>

            <p className="text-sm font-medium text-foreground">Drop your badge image here</p>

            <p className="mt-1.5 max-w-sm text-xs leading-5 text-muted-foreground">
              PNG, JPG, WebP or SVG. One image, {MAX_SIZE_MB} MB max. Square artwork, 512×512 or larger.
            </p>

            <Button
              type="button"
              variant="outline"
              className="mt-4"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              <UploadIcon aria-hidden="true" className="-ms-1 size-4 opacity-60" />
              Select badge image
            </Button>
          </div>
        )}
      </div>

      {problem ? (
        <p className="flex items-start gap-1.5 text-xs leading-5 text-destructive" role="alert">
          <AlertCircleIcon className="mt-0.5 size-3.5 shrink-0" />
          <span>{problem}</span>
        </p>
      ) : null}
    </section>
  )
}
