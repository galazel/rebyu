import { AlertCircleIcon, ArrowRight, FileText, KeyRound, UploadIcon, XIcon } from "@/components/icons"

import { formatBytes, useFileUpload } from "@/hooks/use-file-upload"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Picking the exam papers and answer keys to import, then "Next".
 *
 * The same drop zone and file list as the certification drawer's
 * `DocumentUploadStep`, so choosing documents looks the same everywhere: the
 * files are listed with their size and a remove button, and nothing is read
 * until Next -- a stray file can be taken off the list first.
 */

/* A whole folder of past papers and keys at once -- 156 PDFs for FE. Files
   are read one after another, and each keeps only compressed images, so the
   count is bounded by patience rather than memory. */
const MAX_FILES = 300
const MAX_SIZE_MB = 50

/** Whether a file name reads as an answer key rather than a question paper. */
function looksLikeKey(name) {
    return /answer|\bans\b|key/i.test(name)
}

export function PdfUploadStep({ onNext, disabled, nextLabel = "Next" }) {
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
        accept: "application/pdf,.pdf",
        initialFiles: [],
        maxFiles: MAX_FILES,
        maxSize: MAX_SIZE_MB * 1024 * 1024,
        multiple: true,
    })

    const problem = errors[0]
    const keys = files.filter((item) => looksLikeKey(item.file.name)).length

    return (
        <section className="space-y-4">
            <div>
                <h3 className="text-sm font-semibold text-foreground">Exam papers and answer keys</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Add question papers and their answer keys together, as many as you like; keys are matched to papers
                    by exam date. Any common layout works -- numbered Q1., 1. or Question 1, choices a) or A., one or two
                    columns, answers inline, in a key section, or in a separate key file.
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
                <input {...getInputProps()} aria-label="Upload exam papers and answer keys" className="sr-only" />

                <div className="flex flex-col items-center px-4 py-3 text-center">
                    <div className="mb-3 flex size-12 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
                        <FileText className="size-5" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Drop your exam papers and answer keys here</p>
                    <p className="mt-1.5 max-w-sm text-xs leading-5 text-muted-foreground">
                        PDF only. Up to {MAX_FILES} files, {MAX_SIZE_MB} MB each.
                    </p>
                    <Button type="button" variant="outline" className="mt-4" disabled={disabled} onClick={openFileDialog}>
                        <UploadIcon aria-hidden="true" className="-ms-1 size-4 opacity-60" />
                        Select PDFs
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
                        <p className="text-sm font-medium text-foreground">Selected files</p>
                        <div className="flex items-center gap-3">
                            <p className="text-xs text-muted-foreground">
                                {files.length} of {MAX_FILES} selected
                                {keys ? ` · ${keys} look${keys === 1 ? "s" : ""} like answer key${keys === 1 ? "" : "s"}` : ""}
                            </p>
                            {files.length > 1 ? (
                                <Button type="button" size="sm" variant="ghost" disabled={disabled} onClick={clearFiles}>
                                    Remove all
                                </Button>
                            ) : null}
                        </div>
                    </div>

                    <ul className="space-y-2">
                        {files.map((file) => {
                            const isKey = looksLikeKey(file.file.name)
                            return (
                                <li
                                    key={file.id}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div
                                            className={cn(
                                                "flex size-10 shrink-0 items-center justify-center rounded-lg",
                                                isKey
                                                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                                    : "bg-primary/10 text-primary",
                                            )}
                                        >
                                            {isKey ? <KeyRound className="size-[19px]" /> : <FileText className="size-[19px]" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-foreground">{file.file.name}</p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {isKey ? "Answer key" : "Question paper"} · {formatBytes(file.file.size)}
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
                            )
                        })}
                    </ul>
                </div>
            ) : null}

            <div className="flex justify-end">
                <Button
                    type="button"
                    disabled={disabled || files.length === 0}
                    onClick={() => {
                        onNext(files.map((item) => item.file))
                        clearFiles()
                    }}
                >
                    {nextLabel}
                    <ArrowRight aria-hidden="true" className="ms-1 size-4" />
                </Button>
            </div>
        </section>
    )
}
