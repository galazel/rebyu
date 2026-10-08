import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"

import { Loader2 } from "@/components/icons"
import { DocumentReader } from "@/pages/learner/workspace/document-reader.jsx"
import { apiMessage } from "@/services/base"
import { fetchFileBlob, getFileViewLink } from "@/services/fileService"
import { ProLockCard } from "@/components/learner/pro-gate.jsx"
import { useLearnerEntitlements } from "@/hooks/use-learner-entitlements.js"


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
        arrayBuffer: () =>
            blob ? blob.arrayBuffer() : fetchFileBlob(fileKey).then((fetched) => fetched.arrayBuffer()),
    }
}

function isStreamable(name) {
    const extension = String(name ?? "").toLowerCase().split(".").pop()
    return ["pdf", "png", "jpg", "jpeg", "gif", "webp"].includes(extension)
}

const FREE_PREVIEW_PAGES = 2

export default function CommunityReviewerPage() {
    const plan = useLearnerEntitlements()
    const { postId } = useParams()
    const [params] = useSearchParams()

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

    const backControl = null

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
