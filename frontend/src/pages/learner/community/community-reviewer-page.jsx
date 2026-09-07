import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"

import { ArrowLeft, Loader2 } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { DocumentReader } from "@/pages/learner/workspace/document-reader.jsx"
import { apiMessage } from "@/services/base"
import { fetchFileBlob, getFileViewLink } from "@/services/fileService"

/**
 * A shared community reviewer, read full-page.
 *
 * <p>The feed used to open a reviewer in a dialog, which is the wrong shape for
 * the thing: a reviewer is a document someone sits and reads, and it was being
 * given a box in the middle of the screen with the feed showing round the edges.
 * This is the same reader the study workspace uses — title bar, control rail,
 * pages in a scroller — so a shared reviewer and an uploaded one are read the
 * same way, in the same place, with the same controls.
 *
 * <p>How the bytes arrive depends on what the reader needs to do with them:
 *
 * <ul>
 *   <li>A <b>PDF</b> is handed to the browser's viewer as a presigned URL, so
 *       storage streams it directly. This is what makes a large file work at
 *       all — an 81 MB reviewer pulled through the API as one buffer is what
 *       exhausted the server and answered 500.</li>
 *   <li><b>Word</b> and <b>text</b> have to be parsed in JavaScript, so those
 *       do come back as bytes, through the authenticated endpoint. Its 12 MB
 *       ceiling is far above anything of that kind.</li>
 * </ul>
 */

/** What the reader needs of a file, for something that is not a File. */
function readerDocument({ name, size, previewUrl, blob }) {
    return {
        name,
        size,
        previewUrl,
        // Only ever called for the branches that parse the bytes themselves,
        // which are the branches this page fetches a blob for.
        text: () => (blob ? blob.text() : Promise.resolve("")),
        arrayBuffer: () => (blob ? blob.arrayBuffer() : Promise.resolve(new ArrayBuffer(0))),
    }
}

function isStreamable(name) {
    const extension = String(name ?? "").toLowerCase().split(".").pop()
    return extension === "pdf"
}

export default function CommunityReviewerPage() {
    const { postId } = useParams()
    const [params] = useSearchParams()
    const navigate = useNavigate()

    const fileKey = params.get("key")
    const name = params.get("name") || "Shared reviewer"
    const size = Number(params.get("size")) || 0

    const [state, setState] = useState({ status: "loading" })
    const objectUrlRef = useRef(null)

    useEffect(() => {
        if (!fileKey) {
            setState({ status: "error", message: "This post has no file attached." })
            return undefined
        }

        let cancelled = false
        setState({ status: "loading" })

        async function load() {
            try {
                if (isStreamable(name)) {
                    const { url } = await getFileViewLink(fileKey, name)
                    if (!cancelled) setState({ status: "ready", previewUrl: url })
                    return
                }

                const blob = await fetchFileBlob(fileKey)
                if (cancelled) return
                const url = URL.createObjectURL(blob)
                objectUrlRef.current = url
                setState({ status: "ready", previewUrl: url, blob })
            } catch (error) {
                if (!cancelled) {
                    setState({
                        status: "error",
                        message: apiMessage(error, "This file could not be opened."),
                    })
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
    }, [fileKey, name])

    const document = useMemo(
        () =>
            state.status === "ready"
                ? readerDocument({ name, size, previewUrl: state.previewUrl, blob: state.blob })
                : null,
        [state, name, size]
    )

    function back() {
        // Back to the feed the reviewer was opened from, keeping the post in
        // view rather than dropping the reader at the top of the feed.
        navigate(postId ? `/learner/community?post=${postId}` : "/learner/community")
    }

    return (
        <div className="flex h-dvh min-h-0 flex-col bg-rb-snow">
            <div className="flex shrink-0 items-center gap-2 border-b-2 border-border bg-card px-3 py-2">
                <Button type="button" variant="ghost" size="sm" onClick={back}>
                    <ArrowLeft className="mr-2 size-4" />
                    Back to community
                </Button>
            </div>

            <div className="min-h-0 flex-1">
                {state.status === "loading" ? (
                    <div className="flex h-full items-center justify-center gap-2 text-sm font-bold text-rb-hare">
                        <Loader2 className="size-4 animate-spin" />
                        Opening {name}…
                    </div>
                ) : null}

                {state.status === "error" ? (
                    <div className="grid h-full place-items-center p-6 text-center">
                        <div>
                            <p className="font-rb-display text-lg font-extrabold text-rb-eel">
                                {state.message}
                            </p>
                            <Button type="button" variant="outline" className="mt-4" onClick={back}>
                                Back to community
                            </Button>
                        </div>
                    </div>
                ) : null}

                {state.status === "ready" && document ? (
                    <DocumentReader file={document} />
                ) : null}
            </div>
        </div>
    )
}
