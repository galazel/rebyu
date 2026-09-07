import { useEffect, useRef, useState } from "react"
import { AlertTriangle, Download, Loader2, Maximize } from "@/components/icons"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { fetchFileBlob } from "@/services/fileService"
import { apiMessage } from "@/services/base"

/**
 * Reads a shared file in place instead of downloading it.
 *
 * Everything stored behind `/api/files/view` needs the learner's bearer token,
 * which a browser attaches to no `<iframe src>`, so the bytes are fetched here
 * and handed to the viewer as a blob URL (see {@link fetchFileBlob}).
 *
 * What can be shown depends on the format:
 *  - PDF renders in the browser's own viewer, in an iframe.
 *  - Word (.docx) has no native viewer anywhere, so it is converted to HTML by
 *    mammoth -- which reads paragraphs, headings, lists, tables and bold/italic
 *    runs, and drops the page furniture (headers, footers, exact pagination)
 *    that only means anything in Word. A reviewer reads correctly; a
 *    pixel-faithful copy of the .docx it is not.
 *  - Images and plain text render directly.
 *  - Anything else keeps the download button and says so plainly, rather than
 *    showing an empty frame.
 *
 * mammoth is loaded on demand: it is only needed by the Word branch, and it is
 * far larger than this dialog.
 */

const DOCX_TYPES = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
]

/** What the fetched bytes can be rendered as. */
function viewerKindOf(blob, name) {
    const type = (blob?.type ?? "").toLowerCase()
    const extension = String(name ?? "").toLowerCase().split(".").pop()

    if (type === "application/pdf" || extension === "pdf") return "pdf"
    if (DOCX_TYPES.includes(type) || extension === "docx" || extension === "doc") return "docx"
    if (type.startsWith("image/")) return "image"
    if (type.startsWith("text/") || ["txt", "md", "csv"].includes(extension)) return "text"
    return "unsupported"
}

export default function FileViewerDialog({ open, onOpenChange, fileKey, name, meta }) {
    const [state, setState] = useState({ status: "idle" })
    const objectUrlRef = useRef(null)

    useEffect(() => {
        if (!open || !fileKey) return undefined

        let cancelled = false
        setState({ status: "loading" })

        async function load() {
            try {
                const blob = await fetchFileBlob(fileKey)
                if (cancelled) return

                const url = URL.createObjectURL(blob)
                objectUrlRef.current = url
                const kind = viewerKindOf(blob, name)

                if (kind === "docx") {
                    // Dynamic: the Word branch is the only one that needs it.
                    const mammoth = await import("mammoth/mammoth.browser")
                    const buffer = await blob.arrayBuffer()
                    const { value } = await mammoth.convertToHtml({ arrayBuffer: buffer })
                    if (cancelled) return
                    setState({ status: "ready", kind, url, html: value })
                    return
                }

                if (kind === "text") {
                    const text = await blob.text()
                    if (cancelled) return
                    setState({ status: "ready", kind, url, text })
                    return
                }

                setState({ status: "ready", kind, url })
            } catch (error) {
                if (!cancelled) {
                    setState({ status: "error", message: apiMessage(error, "This file could not be opened.") })
                }
            }
        }

        load()

        return () => {
            cancelled = true
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current)
                objectUrlRef.current = null
            }
        }
    }, [open, fileKey, name])

    /* Both of these need the blob rather than the API URL: /files/view and
       /files/download alike reject a request with no Authorization header, so a
       plain link to either loads nothing. */
    function openInTab() {
        if (state.url) window.open(state.url, "_blank", "noopener")
    }

    function download() {
        if (!state.url) return
        const link = document.createElement("a")
        link.href = state.url
        link.download = name || "file"
        link.click()
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[85vh] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
                <DialogHeader className="shrink-0 border-b-2 border-border p-4 pr-12 text-left">
                    <DialogTitle className="truncate font-rb-display text-base font-extrabold lowercase">
                        {name || "Shared file"}
                    </DialogTitle>
                    <DialogDescription className="truncate text-xs font-semibold">
                        {meta || "Shared in the community"}
                    </DialogDescription>

                    <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={openInTab}
                            disabled={!state.url}
                        >
                            <Maximize className="mr-2 size-4" />
                            Open in new tab
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={download}
                            disabled={!state.url}
                        >
                            <Download className="mr-2 size-4" />
                            Download
                        </Button>
                    </div>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-auto bg-muted/30">
                    {state.status === "loading" || state.status === "idle" ? (
                        <div className="flex h-full items-center justify-center gap-2 text-sm font-semibold text-muted-foreground">
                            <Loader2 className="size-4 animate-spin" />
                            Opening the file…
                        </div>
                    ) : null}

                    {state.status === "error" ? (
                        <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
                            <AlertTriangle className="size-6 text-rb-fox-lip" />
                            <p className="text-sm font-bold text-foreground">{state.message}</p>
                        </div>
                    ) : null}

                    {state.status === "ready" && state.kind === "pdf" ? (
                        <iframe
                            src={state.url}
                            title={name || "Shared PDF"}
                            className="h-full w-full border-0 bg-white"
                        />
                    ) : null}

                    {state.status === "ready" && state.kind === "image" ? (
                        <div className="flex h-full items-center justify-center p-4">
                            <img src={state.url} alt={name || "Shared image"} className="max-h-full rounded-rb-tile" />
                        </div>
                    ) : null}

                    {state.status === "ready" && state.kind === "docx" ? (
                        <div className="mx-auto max-w-3xl bg-card p-6 sm:p-10">
                            <div
                                className="rb-docx text-[0.9375rem] leading-7 text-foreground"
                                // The HTML here is mammoth's own output, built from the
                                // .docx's structure -- it emits a fixed set of semantic
                                // tags and carries no scripts or attributes across.
                                dangerouslySetInnerHTML={{ __html: state.html }}
                            />
                        </div>
                    ) : null}

                    {state.status === "ready" && state.kind === "text" ? (
                        <pre className="whitespace-pre-wrap break-words p-6 font-mono text-[0.8125rem] leading-6 text-foreground">
                            {state.text}
                        </pre>
                    ) : null}

                    {state.status === "ready" && state.kind === "unsupported" ? (
                        <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
                            <AlertTriangle className="size-6 text-rb-fox-lip" />
                            <p className="text-sm font-bold text-foreground">
                                This file type cannot be previewed here.
                            </p>
                            <p className="max-w-sm text-sm text-muted-foreground">
                                Download it to open it in the app it belongs to.
                            </p>
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    )
}
