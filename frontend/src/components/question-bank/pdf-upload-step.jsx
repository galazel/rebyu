import { AlertCircleIcon, AlertTriangle, ArrowRight, CheckCircle2, FileText, KeyRound, UploadIcon, XIcon } from "@/components/icons"

import { formatBytes, useFileUpload } from "@/hooks/use-file-upload"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Picking the exam papers and answer keys to import, then "Next".
 *
 * The same drop zone and file list as the certification drawer's
 * `DocumentUploadStep`. What differs is that files are paired here, by name,
 * before anything is read: every file is named after its exam, ending in
 * "Questions" or "Answer Key", and a paper and a key with the same title are
 * one pair. Nothing about the documents' layout or dates is assumed -- any
 * school's reviewer pairs the same way.
 *
 * A name that does not follow the format, a key with no paper, or two files
 * claiming the same place is an error, and Next waits until it is fixed. A
 * paper with no key is only a warning: its answers may be printed inside it.
 */

/* A whole folder of past papers and keys at once -- 156 PDFs for FE. Files
   are read one after another, and each keeps only compressed images, so the
   count is bounded by patience rather than memory. */
const MAX_FILES = 300
const MAX_SIZE_MB = 50

/** The word a file name ends with, and what it makes the file. Longest first. */
const ROLE_RE = /(?:^|[\s_\-.]+)(answer[\s_\-]*keys?|answers?|ans|keys?|question[\s_\-]*paper|questions?)$/i

/**
 * `{ title, role }` from a file name, or `{ error }` when it does not follow
 * "<Exam title> Questions.pdf" / "<Exam title> Answer Key.pdf".
 */
export function parseFileName(name) {
    const base = name.replace(/\.pdf$/i, "").trim()
    const match = base.match(ROLE_RE)
    if (!match) {
        return { error: 'The name must end with "Questions" or "Answer Key".' }
    }
    const title = base
        .slice(0, match.index)
        .replace(/[\s_\-.]+/g, " ")
        .trim()
    if (!title) {
        return { error: "The name needs the exam's title before \"Questions\" or \"Answer Key\"." }
    }
    return {
        title,
        // Compared ignoring case, spacing and separators: "Midterm_Exam" and
        // "midterm exam" are one title.
        titleKey: title.toLowerCase(),
        role: /^q/i.test(match[1]) ? "paper" : "key",
    }
}

/**
 * The selected files, paired: `{ pairs, errors }`. Each pair is
 * `{ title, paper, key }` (key may be null); each error is `{ id, name, message }`.
 */
export function pairFiles(items) {
    const byTitle = new Map()
    const errors = []
    for (const item of items) {
        const parsed = parseFileName(item.file.name)
        if (parsed.error) {
            errors.push({ id: item.id, name: item.file.name, message: parsed.error })
            continue
        }
        const group = byTitle.get(parsed.titleKey) ?? { title: parsed.title, papers: [], keys: [] }
        group[parsed.role === "paper" ? "papers" : "keys"].push(item)
        byTitle.set(parsed.titleKey, group)
    }

    // A key whose title differs from one paper's only by a session word
    // ("2017A IP AM Answer" for "2017A IP Question") is that paper's key,
    // when exactly one paper without a key matches that way.
    const loose = (titleKey) => titleKey.replace(/\b(am|pm|morning|afternoon)\b/g, " ").replace(/\s+/g, " ").trim()
    const session = (titleKey) =>
        /\b(am|morning)\b/.test(titleKey) ? "am" : /\b(pm|afternoon)\b/.test(titleKey) ? "pm" : null
    for (const [titleKey, group] of byTitle) {
        if (group.papers.length || !group.keys.length) continue
        const matches = [...byTitle.values()].filter(
            (other) =>
                other !== group &&
                other.papers.length &&
                !other.keys.length &&
                loose(other.title.toLowerCase()) === loose(titleKey) &&
                // A paper named for the other session is not this key's paper.
                (!session(other.title.toLowerCase()) || session(other.title.toLowerCase()) === session(titleKey)),
        )
        if (matches.length === 1) {
            matches[0].keys.push(...group.keys)
            matches[0].looseKey = true
            byTitle.delete(titleKey)
        }
    }

    const pairs = []
    for (const group of byTitle.values()) {
        for (const extra of group.papers.slice(1)) {
            errors.push({ id: extra.id, name: extra.file.name, message: `Another question file is already named "${group.title} Questions". Remove one, or rename it.` })
        }
        for (const extra of group.keys.slice(1)) {
            errors.push({ id: extra.id, name: extra.file.name, message: `Another answer key is already named "${group.title} Answer Key". Remove one, or rename it.` })
        }
        if (!group.papers.length) {
            for (const key of group.keys.slice(0, 1)) {
                errors.push({ id: key.id, name: key.file.name, message: `No question file named "${group.title} Questions" for this answer key. Add it, or rename one so the titles match.` })
            }
            continue
        }
        pairs.push({ title: group.title, paper: group.papers[0], key: group.keys[0] ?? null, looseKey: Boolean(group.looseKey) })
    }
    pairs.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }))
    return { pairs, errors }
}

function FileLine({ item, kind, disabled, onRemove }) {
    const isKey = kind === "key"
    return (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 px-3 py-2">
            <div className="flex min-w-0 items-center gap-2.5">
                <div
                    className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-md",
                        isKey ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : "bg-primary/10 text-primary",
                    )}
                >
                    {isKey ? <KeyRound className="size-4" /> : <FileText className="size-4" />}
                </div>
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{item.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                        {isKey ? "Answer key" : "Questions"} · {formatBytes(item.file.size)}
                    </p>
                </div>
            </div>
            <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={`Remove ${item.file.name}`}
                disabled={disabled}
                className="size-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onRemove(item.id)}
            >
                <XIcon aria-hidden="true" className="size-4" />
            </Button>
        </div>
    )
}

export function PdfUploadStep({ onNext, disabled, nextLabel = "Next" }) {
    const [
        { files, isDragging, errors: uploadErrors },
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

    const problem = uploadErrors[0]
    const { pairs, errors } = pairFiles(files)
    const withoutKey = pairs.filter((pair) => !pair.key).length

    return (
        <section className="space-y-4">
            <div>
                <h3 className="text-sm font-semibold text-foreground">Exam papers and answer keys</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Name each file after its exam, ending in <b>Questions</b> or <b>Answer Key</b> --{" "}
                    <span className="font-mono">Midterm Exam Questions.pdf</span> and{" "}
                    <span className="font-mono">Midterm Exam Answer Key.pdf</span>. Files with the same title are paired; you
                    check the pairs before anything is read. Any layout works.
                </p>
            </div>

            <div
                className={cn(
                    "relative flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed p-4 transition-colors has-[input:focus]:ring-2",
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
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-medium text-foreground">
                            {pairs.length} exam{pairs.length === 1 ? "" : "s"} from {files.length} file{files.length === 1 ? "" : "s"}
                        </p>
                        <div className="flex items-center gap-3">
                            <p className="text-xs text-muted-foreground">
                                {errors.length ? <span className="font-semibold text-destructive">{errors.length} to fix</span> : "Ready"}
                                {withoutKey ? ` · ${withoutKey} without an answer key` : ""}
                            </p>
                            {files.length > 1 ? (
                                <Button type="button" size="sm" variant="ghost" disabled={disabled} onClick={clearFiles}>
                                    Remove all
                                </Button>
                            ) : null}
                        </div>
                    </div>

                    {errors.length ? (
                        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3" role="alert">
                            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-destructive">
                                <AlertCircleIcon className="size-4" /> Fix these file names before continuing
                            </p>
                            <ul className="space-y-2">
                                {errors.map((error) => (
                                    <li key={error.id} className="flex items-start justify-between gap-3 rounded-lg bg-background p-2">
                                        <div className="min-w-0">
                                            <p className="truncate font-mono text-xs font-semibold">{error.name}</p>
                                            <p className="text-xs text-destructive">{error.message}</p>
                                        </div>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            aria-label={`Remove ${error.name}`}
                                            disabled={disabled}
                                            className="size-7 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => removeFile(error.id)}
                                        >
                                            <XIcon aria-hidden="true" className="size-4" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Rename the files on your computer, then select them again.
                            </p>
                        </div>
                    ) : null}

                    <ul className="space-y-2">
                        {pairs.map((pair) => (
                            <li key={pair.paper.id} className="rounded-xl border border-border p-3">
                                <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                                    {pair.key ? (
                                        <CheckCircle2 className="size-4 text-emerald-600" />
                                    ) : (
                                        <AlertTriangle className="size-4 text-amber-600" />
                                    )}
                                    {pair.title}
                                    {pair.looseKey ? (
                                        <span className="text-xs font-normal text-muted-foreground">
                                            -- paired although only the key's name says AM/PM
                                        </span>
                                    ) : null}
                                </p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <FileLine item={pair.paper} kind="paper" disabled={disabled} onRemove={removeFile} />
                                    {pair.key ? (
                                        <FileLine item={pair.key} kind="key" disabled={disabled} onRemove={removeFile} />
                                    ) : (
                                        <p className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                            No file named <span className="font-mono">{pair.title} Answer Key.pdf</span>. Only
                                            answers printed in the paper itself will be used.
                                        </p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}

            <div className="flex justify-end">
                <Button
                    type="button"
                    disabled={disabled || pairs.length === 0 || errors.length > 0}
                    onClick={() => {
                        onNext(pairs.map((pair) => ({ title: pair.title, paper: pair.paper.file, key: pair.key?.file ?? null })))
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
