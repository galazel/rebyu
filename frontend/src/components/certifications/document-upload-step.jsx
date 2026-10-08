import { useEffect } from "react"
import { AlertCircleIcon, FileSpreadsheet, FileText, UploadIcon, XIcon } from "@/components/icons"

import { formatBytes, useFileUpload } from "@/hooks/use-file-upload"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"


const MAX_FILES = 10

const MAX_SIZE_MB = 50

const ACCEPTED = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv",
  ".pdf",
  ".doc",
  ".docx",
  ".csv",
].join(",")

export function DocumentUploadStep({ onFilesChange, error, disabled }) {
  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      clearFiles,
      getInputProps,
    },
  ] = useFileUpload({
    accept: ACCEPTED,
    initialFiles: [],
    maxFiles: MAX_FILES,
    maxSize: MAX_SIZE_MB * 1024 * 1024,
    multiple: true,
  })

  useEffect(() => {
    onFilesChange?.(
      files.map((item) => item.file),
      errors,
    )
  }, [files, errors, onFilesChange])

  const problem = error || errors[0]

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Reference documents <span className="font-normal text-muted-foreground">(optional)</span>
        </h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          The syllabus, exam guide, past papers or notes this certification should be built from.
          Everything generated — the curriculum, lessons, questions and exams — is drawn from what
          you upload here; leave it empty and the planner researches the certification itself.
        </p>
      </div>

      <div
        className={cn(
          "relative flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed p-4 transition-colors has-[input:focus]:ring-2",
          problem
            ? "border-destructive bg-destructive/5 has-[input:focus]:ring-destructive/30"
            : "border-border has-[input:focus]:border-primary has-[input:focus]:ring-ring/30",
          isDragging && "border-primary bg-primary/5",
        )}
        data-dragging={isDragging || undefined}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input {...getInputProps()} aria-label="Upload certification documents" className="sr-only" />

        <div className="flex flex-col items-center px-4 py-3 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
            <FileText className="size-5" />
          </div>

          <p className="text-sm font-medium text-foreground">Drop your documents here</p>

          <p className="mt-1.5 max-w-sm text-xs leading-5 text-muted-foreground">
            PDF, DOC, DOCX, or CSV. Up to {MAX_FILES} files, {MAX_SIZE_MB} MB each.
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-4"
            disabled={disabled}
            onClick={openFileDialog}
          >
            <UploadIcon aria-hidden="true" className="-ms-1 size-4 opacity-60" />
            Select documents
          </Button>
        </div>
      </div>

      {problem ? (
        <p className="flex items-start gap-1.5 text-xs leading-5 text-destructive" role="alert">
          <AlertCircleIcon className="mt-0.5 size-3.5 shrink-0" />
          <span>{problem}</span>
        </p>
      ) : null}

      {files.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-foreground">Uploaded documents</p>

            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground">
                {files.length} of {MAX_FILES} selected
              </p>

              {files.length > 1 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={disabled}
                  onClick={clearFiles}
                >
                  Remove all
                </Button>
              ) : null}
            </div>
          </div>

          <ul className="space-y-2">
            {files.map((file) => (
              <li
                key={file.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <DocumentIcon fileName={file.file.name} />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{file.file.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {getDocumentLabel(file.file.name)} · {formatBytes(file.file.size)}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`Remove ${file.file.name}`}
                  disabled={disabled}
                  className="size-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => removeFile(file.id)}
                >
                  <XIcon aria-hidden="true" className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}

function getFileExtension(fileName = "") {
  return fileName.split(".").pop()?.toLowerCase() ?? ""
}

function getDocumentLabel(fileName) {
  const extension = getFileExtension(fileName)
  if (extension === "pdf") return "PDF document"
  if (extension === "doc" || extension === "docx") return "Word document"
  if (extension === "csv") return "CSV spreadsheet"
  return "Document"
}

function DocumentIcon({ fileName }) {
  const extension = getFileExtension(fileName)

  if (extension === "csv") {
    return (
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <FileSpreadsheet className="size-[19px]" />
      </div>
    )
  }

  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <FileText className="size-[19px]" />
    </div>
  )
}
