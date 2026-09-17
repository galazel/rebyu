import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"

import { Loader2 } from "@/components/icons"
import { BackButton } from "@/components/rebyu/rebyu-ui.jsx"
import { DocumentReader } from "@/pages/learner/workspace/document-reader.jsx"
import { apiMessage } from "@/services/base"
import { fetchFileBlob, getFileViewLink } from "@/services/fileService"
import { ProLockCard } from "@/components/learner/pro-gate.jsx"
import { useLearnerEntitlements } from "@/hooks/use-learner-entitlements.js"

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
function readerDocument({ name, title, size, previewUrl, images, blob, fileKey, uploader, circle }) {
    return {
        name,
        title,
        size,
        previewUrl,
        images,
        uploader,
        circle,
        text: () => (blob ? blob.text() : Promise.resolve("")),
        // A PDF streams from its presigned URL; its bytes are only fetched if
        // the reader cannot load that URL itself.
        arrayBuffer: () =>
            blob ? blob.arrayBuffer() : fetchFileBlob(fileKey).then((fetched) => fetched.arrayBuffer()),
    }
}

/**
 * PDFs and images are read straight from storage by a presigned URL: pdf.js
 * streams a PDF in ranges, and an image needs nothing but an <img src>. Word and
 * text files have to be parsed in the browser, so they still come back as bytes.
 */
function isStreamable(name) {
    const extension = String(name ?? "").toLowerCase().split(".").pop()
    return ["pdf", "png", "jpg", "jpeg", "gif", "webp"].includes(extension)
}

/** Pages of a shared file a Free learner can read before the preview stops. */
const FREE_PREVIEW_PAGES = 2

export default function CommunityReviewerPage() {
    const plan = useLearnerEntitlements()
    const { postId } = useParams()
    const [params] = useSearchParams()
    const navigate = useNavigate()

    // A post sharing several images repeats key and name once per image.
    const keys = params.getAll("key").filter(Boolean)
    const names = params.getAll("name")
    const keysSignature = keys.join("\n")
    const isImageSet = keys.length > 1
    const fileKey = keys[0] ?? null
    const name = names[0] || "Shared reviewer"
    const size = Number(params.get("size")) || 0
    const uploader = params.get("by") || null
    const circle = params.get("circle") || null

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
                if (isImageSet) {
                    const links = await Promise.all(keys.map((key, index) => getFileViewLink(key, names[index])))
                    if (!cancelled) {
                        setState({
                            status: "ready",
                            previewUrl: links[0].url,
                            images: links.map((link, index) => ({
                                name: names[index] || `Image ${index + 1}`,
                                url: link.url,
                            })),
                        })
                    }
                    return
                }

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
        // keysSignature stands in for keys/names, which are new arrays every render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [keysSignature, name])

    const document = useMemo(
        () =>
            state.status === "ready"
                ? readerDocument({
                      name,
                      title: isImageSet ? `${keys.length} images` : undefined,
                      size,
                      previewUrl: state.previewUrl,
                      images: state.images,
                      blob: state.blob,
                      fileKey,
                      uploader,
                      circle,
                  })
                : null,
        [state, name, size, fileKey, uploader, circle, isImageSet, keys.length]
    )

    function back() {
        // Back to the feed the reviewer was opened from, keeping the post in
        // view rather than dropping the reader at the top of the feed.
        navigate(postId ? `/learner/community?post=${postId}` : "/learner/community")
    }

    const backControl = (
        <BackButton label="Back to community" onClick={back} className="shrink-0" />
    )

    return (
        <div className="flex h-dvh min-h-0 flex-col bg-rb-snow">
            <div className="min-h-0 flex-1">
                {state.status === "loading" ? (
                    <div className="flex h-full flex-col">
                        <div className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-3">
                            {backControl}
                            <p className="min-w-0 truncate text-sm font-extrabold text-rb-eel">{name}</p>
                        </div>
                        <div className="flex flex-1 items-center justify-center gap-2 text-sm font-bold text-rb-hare">
                            <Loader2 className="size-4 animate-spin" />
                            Opening this file…
                        </div>
                    </div>
                ) : null}

                {state.status === "error" ? (
                    <div className="flex h-full flex-col">
                        <div className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-3">
                            {backControl}
                            <p className="min-w-0 truncate text-sm font-extrabold text-rb-eel">{name}</p>
                        </div>
                        <div className="grid flex-1 place-items-center p-6 text-center">
                            <p className="font-rb-display text-lg font-extrabold text-rb-eel">
                                {state.message}
                            </p>
                        </div>
                    </div>
                ) : null}

                {state.status === "ready" && document ? (
                    <DocumentReader
                        file={document}
                        back={backControl}
                        previewPages={plan.isFree && params.get("mine") !== "1" ? FREE_PREVIEW_PAGES : null}
                        lockedNotice={
                            <ProLockCard
                                compact
                                title="Keep reading with Pro"
                                description={`Free shows the first ${FREE_PREVIEW_PAGES} pages of a shared file. Upgrade to REBYU Pro to read and download all of it.`}
                            />
                        }
                    />
                ) : null}
            </div>
        </div>
    )
}
