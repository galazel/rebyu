import { useEffect, useState } from "react"
import { ImagePlus, Plus, Trash2, Video as VideoIcon } from "@/components/icons"
import { useDropzone } from "react-dropzone"

import {
    Card,
    CardDescription,
    CardHeader,
} from "@/components/ui/card"

import {
    Tabs as ShadcnTabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"

import {
    Accordion as ShadcnAccordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchFileBlob, getFileViewLink } from "@/services/fileService.js"

function createId(prefix) {
    return `${prefix}-${crypto.randomUUID()}`
}

function useObjectUrl(file) {
    const [url, setUrl] = useState("")

    useEffect(() => {
        if (!file) {
            setUrl("")
            return
        }

        const objectUrl = URL.createObjectURL(file)
        setUrl(objectUrl)

        return () => URL.revokeObjectURL(objectUrl)
    }, [file])

    return url
}

/**
 * An already-uploaded file as a URL an `<img>` can load.
 *
 * `getDownloadUrl` alone is not enough: `/files/download` calls `requireAuth`,
 * and a browser sends no Authorization header on an `<img src>`, so the
 * request comes back `400 Authentication is required` and renders broken. The
 * bytes have to come through `base()` -- which does attach the bearer token --
 * and reach the tag as an object URL.
 *
 * AI-sourced media is stored as a public absolute URL rather than a storage
 * key, so those pass through without a fetch.
 */
function useStoredFileUrl(key) {
    const isAbsolute = Boolean(key) && /^https?:\/\//.test(key)
    const [url, setUrl] = useState("")

    useEffect(() => {
        if (!key || isAbsolute) {
            setUrl("")
            return
        }

        let cancelled = false
        let objectUrl = ""

        fetchFileBlob(key)
            .then((blob) => {
                if (cancelled) return
                objectUrl = URL.createObjectURL(blob)
                setUrl(objectUrl)
            })
            .catch(() => {
                if (!cancelled) setUrl("")
            })

        return () => {
            cancelled = true
            if (objectUrl) URL.revokeObjectURL(objectUrl)
        }
    }, [key, isAbsolute])

    return isAbsolute ? key : url
}

/**
 * An already-uploaded video as a URL a `<video>` can play.
 *
 * Same problem {@link useStoredFileUrl} solves, and a different answer. The
 * preview was pointed straight at `/files/download`, which needs an
 * Authorization header a `<video src>` never sends, so an admin reopening a
 * lesson they had already saved a video into got the player's dark backing and
 * no frames -- a picture of a video. Fetching it whole like an image is no fix
 * either: playback would wait for the last byte, seeking would not work at all,
 * and the endpoint refuses anything over 12 MB.
 *
 * A presigned URL carries its own signature and is served with range support,
 * so the preview behaves like a video player rather than a download.
 */
function useStoredVideoUrl(key) {
    const isAbsolute = Boolean(key) && /^https?:\/\//.test(key)
    const [url, setUrl] = useState("")

    useEffect(() => {
        if (!key || isAbsolute) {
            setUrl("")
            return undefined
        }

        let cancelled = false
        getFileViewLink(key)
            .then(({ url: signed }) => {
                if (!cancelled) setUrl(signed)
            })
            .catch(() => {
                if (!cancelled) setUrl("")
            })

        return () => {
            cancelled = true
        }
    }, [key, isAbsolute])

    return isAbsolute ? key : url
}

function FloatingDeleteButton({ onClick }) {
    return (
        <button
            type="button"
            title="Delete tool"
            aria-label="Delete tool"
            className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-muted/80 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover/tool:opacity-100"
            onClick={(event) => {
                event.stopPropagation()
                onClick()
            }}
        >
            <Trash2 size={16} />
        </button>
    )
}

function AddButton({ children, onClick, className = "" }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 ${className}`}
        >
            <Plus className="h-4 w-4" />
            {children}
        </button>
    )
}

function RemoveButton({ children = "Remove", onClick, disabled = false }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="rounded-full px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:pointer-events-none disabled:opacity-35"
        >
            {children}
        </button>
    )
}

/**
 * Wrapper around one placed tool in the lesson canvas.
 *
 * The tool's name and blurb are not drawn on the block: you can see what an
 * image card or a tab set is by looking at it, and a grey "Intro image card /
 * A smaller heading, description, and image in one combined block." bar on top
 * of every block buried the actual lesson content. The title is kept as the
 * section's accessible name so the block is still identifiable non-visually.
 *
 * A single hairline ring is the only edge drawn here. Everything nested inside
 * uses tint and spacing instead of more outlines -- borders inside borders
 * inside borders were what made this editor feel like a stack of boxes rather
 * than a page.
 */
function ToolShell({ title, description, onDelete, children, className = "" }) {
    return (
        <section
            aria-label={title || undefined}
            className={`group/tool relative rounded-xl bg-card px-5 py-4 ring-1 ring-border/60 transition hover:ring-border ${className}`}
        >
            <FloatingDeleteButton onClick={onDelete} />

            <div className="space-y-4 pr-10">{children}</div>
        </section>
    )
}

/**
 * Label for a repeatable group (list items, tabs, cards), paired with its Add
 * button. The label stays because it names what the button adds; the blurb
 * underneath ("New items start blank so you can type directly.") is dropped --
 * it restated what is obvious the moment you click Add.
 */
function SectionHeading({ title, action }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <h3 className="min-w-0 truncate text-sm font-semibold text-foreground">{title}</h3>
            {action}
        </div>
    )
}

function InlineField({ value, onChange, placeholder, className = "" }) {
    return (
        <input
            type="text"
            value={value ?? ""}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className={`w-full border-0 bg-transparent outline-none placeholder:text-muted-foreground/50 ${className}`}
        />
    )
}

function TextAreaField({ value, onChange, placeholder, rows = 4, className = "" }) {
    return (
        <textarea
            value={value ?? ""}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            rows={rows}
            className={`w-full resize-none rounded-lg bg-muted/40 p-4 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted-foreground/50 focus:bg-muted/60 focus:ring-2 focus:ring-ring/25 ${className}`}
        />
    )
}

function ImageUploadArea({ data, onDataChange, title = "Upload an image" }) {
    const selectedImage = data?.file ?? null
    // Same split as the video area: a freshly dropped file plays from its own
    // object URL, a saved key has to come through the token. This was calling
    // getDownloadUrl, which `useStoredFileUrl` exists precisely to replace --
    // so an admin reopening a lesson saw a broken image where their upload was.
    const uploadedImagePreview = useObjectUrl(selectedImage)
    const storedImageUrl = useStoredFileUrl(selectedImage ? "" : data?.imageKey)
    const previewUrl = uploadedImagePreview || storedImageUrl

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            "image/jpeg": [".jpeg", ".jpg", ".jfif"],
            "image/png": [".png"],
            "image/webp": [".webp"],
            "image/gif": [".gif"],
        },
        multiple: false,
        onDrop: (acceptedFiles) => {
            const imageFile = acceptedFiles[0]
            if (!imageFile) return

            onDataChange({
                ...data,
                file: imageFile,
                imageKey: "",
            })
        },
    })

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-7 text-center transition ${
                    isDragActive
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/40 hover:border-primary/40 hover:bg-muted/60"
                }`}
            >
                <input {...getInputProps()} />
                <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <ImagePlus className="h-5 w-5" />
                </div>
                <p className="font-medium text-foreground">
                    {isDragActive ? "Drop the image here" : title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">JPG, PNG, WebP, GIF, or JFIF.</p>
            </div>

            {previewUrl && (
                <div className="overflow-hidden rounded-xl bg-muted/40">
                    <img
                        src={previewUrl}
                        alt={data?.smallHeader || data?.title || "Lesson upload preview"}
                        className="max-h-[420px] w-full object-cover"
                    />
                </div>
            )}
        </div>
    )
}

function VideoUploadArea({ data, onDataChange, title = "Upload a video" }) {
    const selectedVideo = data?.file ?? null
    // A file just dropped is already in the browser and plays from its own
    // object URL; one that was saved earlier has to be signed first.
    const uploadedVideoPreview = useObjectUrl(selectedVideo)
    const storedVideoUrl = useStoredVideoUrl(selectedVideo ? "" : data?.videoKey)
    const previewUrl = uploadedVideoPreview || storedVideoUrl

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            "video/mp4": [".mp4"],
            "video/webm": [".webm"],
            "video/ogg": [".ogg"],
        },
        multiple: false,
        onDrop: (acceptedFiles) => {
            const videoFile = acceptedFiles[0]
            if (!videoFile) return

            onDataChange({
                ...data,
                file: videoFile,
                videoKey: "",
            })
        },
    })

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-7 text-center transition ${
                    isDragActive
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/40 hover:border-primary/40 hover:bg-muted/60"
                }`}
            >
                <input {...getInputProps()} />
                <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <VideoIcon className="h-5 w-5" />
                </div>
                <p className="font-medium text-foreground">
                    {isDragActive ? "Drop the video here" : title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">MP4, WebM, or OGG.</p>
            </div>

            {previewUrl && (
                <video
                    src={previewUrl}
                    controls
                    className="w-full rounded-xl bg-foreground"
                />
            )}
        </div>
    )
}

export function HeadingTool({ data, onDataChange, onDelete }) {
    return (
        <div className="relative rounded-lg px-1 py-2 transition hover:bg-muted/40">
            <FloatingDeleteButton onClick={onDelete} />

            <InlineField
                value={data?.text}
                onChange={(value) => onDataChange({ ...data, text: value })}
                placeholder="Write a heading..."
                className="pr-12 text-3xl font-bold text-foreground"
            />
        </div>
    )
}

export function SubheadingTool({ data, onDataChange, onDelete }) {
    return (
        <div className="relative rounded-lg px-1 py-2 transition hover:bg-muted/40">
            <FloatingDeleteButton onClick={onDelete} />

            <InlineField
                value={data?.text}
                onChange={(value) => onDataChange({ ...data, text: value })}
                placeholder="Write a smaller heading..."
                className="pr-12 text-xl font-semibold text-foreground"
            />
        </div>
    )
}

export function DescriptionTool({ data, onDataChange, onDelete }) {
    return (
        <div className="relative">
            <FloatingDeleteButton onClick={onDelete} />

            <TextAreaField
                value={data?.text}
                onChange={(value) => onDataChange({ ...data, text: value })}
                placeholder="Write a description..."
                rows={4}
                className="pr-12"
            />
        </div>
    )
}

function ListEditorTool({ data, onDataChange, onDelete, ordered = false }) {
    const items = data?.items ?? []

    function updateItem(itemId, value) {
        onDataChange({
            ...data,
            items: items.map((item) =>
                item.id === itemId ? { ...item, text: value } : item
            ),
        })
    }

    function addItem() {
        onDataChange({
            ...data,
            items: [...items, { id: createId("list"), text: "" }],
        })
    }

    function removeItem(itemId) {
        if (items.length <= 1) return
        onDataChange({ ...data, items: items.filter((item) => item.id !== itemId) })
    }

    const ListTag = ordered ? "ol" : "ul"

    return (
        <ToolShell
            title={ordered ? "Numbered list" : "Bullet list"}
            description="Add important lesson points or instructions."
            onDelete={onDelete}
        >
            <SectionHeading
                title="List items"
                description="New items start blank so you can type directly."
                action={<AddButton onClick={addItem}>Add item</AddButton>}
            />

            <ListTag className={ordered ? "list-decimal space-y-3 pl-6" : "list-disc space-y-3 pl-6"}>
                {items.map((item, index) => (
                    <li key={item.id} className="pl-1 marker:text-muted-foreground">
                        <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-2 transition focus-within:bg-muted/60 focus-within:ring-2 focus-within:ring-ring/25">
                            <input
                                type="text"
                                value={item.text ?? ""}
                                onChange={(event) => updateItem(item.id, event.target.value)}
                                placeholder={`List item ${index + 1}`}
                                className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                            />
                            <RemoveButton onClick={() => removeItem(item.id)} disabled={items.length <= 1} />
                        </div>
                    </li>
                ))}
            </ListTag>
        </ToolShell>
    )
}

export function UnorderedListTool(props) {
    return <ListEditorTool {...props} ordered={false} />
}

export function OrderedListTool(props) {
    return <ListEditorTool {...props} ordered />
}

function ImageTextTool({ data, onDataChange, onDelete, imagePosition = "left" }) {
    const toolData = data ?? {}
    const imageIsOnRight = imagePosition === "right"

    return (
        <ToolShell
            title={imageIsOnRight ? "Text with image on the right" : "Image with text on the right"}
            description="Combine an image with an explanation or lesson content."
            onDelete={onDelete}
        >
            <div className="grid gap-6 md:grid-cols-2 md:items-start">
                <div className={imageIsOnRight ? "md:order-2" : "md:order-1"}>
                    <ImageUploadArea data={toolData} onDataChange={onDataChange} />
                </div>

                <div className={imageIsOnRight ? "md:order-1" : "md:order-2"}>
                    <InlineField
                        value={toolData.title}
                        onChange={(value) => onDataChange({ ...toolData, title: value })}
                        placeholder="Write a title..."
                        className="text-2xl font-bold text-foreground"
                    />

                    <TextAreaField
                        value={toolData.description}
                        onChange={(value) => onDataChange({ ...toolData, description: value })}
                        placeholder="Write the explanation..."
                        rows={8}
                        className="mt-4"
                    />
                </div>
            </div>
        </ToolShell>
    )
}

export function ImageLeftTextTool(props) {
    return <ImageTextTool {...props} imagePosition="left" />
}

export function ImageRightTextTool(props) {
    return <ImageTextTool {...props} imagePosition="right" />
}

function TabsEditor({ items, onItemsChange, intro }) {
    const tabItems = items ?? []
    const [activeTab, setActiveTab] = useState(tabItems[0]?.id ?? "")

    useEffect(() => {
        const activeTabStillExists = tabItems.some((tab) => tab.id === activeTab)
        if (!activeTabStillExists) setActiveTab(tabItems[0]?.id ?? "")
    }, [tabItems, activeTab])

    function updateTab(tabId, field, value) {
        onItemsChange(
            tabItems.map((tab) => (tab.id === tabId ? { ...tab, [field]: value } : tab))
        )
    }

    function addTab() {
        const newTab = { id: createId("tab"), label: "", title: "", description: "" }
        onItemsChange([...tabItems, newTab])
        setActiveTab(newTab.id)
    }

    function removeTab(tabId) {
        if (tabItems.length <= 1) return

        const updatedTabs = tabItems.filter((tab) => tab.id !== tabId)
        onItemsChange(updatedTabs)
        if (activeTab === tabId) setActiveTab(updatedTabs[0]?.id ?? "")
    }

    return (
        <div className="space-y-4">
            <SectionHeading
                title="Tabs"
                description={intro ?? "New tabs start blank and stay inside this block."}
                action={<AddButton onClick={addTab}>Add tab</AddButton>}
            />

            <ShadcnTabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="flex h-auto w-full flex-nowrap justify-start overflow-x-auto rounded-lg bg-muted p-1">
                    {tabItems.map((tab, index) => (
                        <TabsTrigger key={tab.id} value={tab.id} className="shrink-0 rounded-xl">
                            {tab.label || `Tab ${index + 1}`}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {tabItems.map((tab, index) => (
                    <TabsContent key={tab.id} value={tab.id}>
                        <Card className="rounded-xl border-border shadow-none">
                            <CardHeader>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="w-full space-y-3">
                                        <input
                                            type="text"
                                            value={tab.label ?? ""}
                                            onChange={(event) => updateTab(tab.id, "label", event.target.value)}
                                            placeholder={`Tab ${index + 1} label`}
                                            className="w-full rounded-lg bg-muted/40 px-3 py-2 text-sm font-medium outline-none placeholder:text-muted-foreground focus:bg-muted/60 focus:ring-2 focus:ring-ring/25"
                                        />

                                        <input
                                            type="text"
                                            value={tab.title ?? ""}
                                            onChange={(event) => updateTab(tab.id, "title", event.target.value)}
                                            placeholder={`Tab ${index + 1} title`}
                                            className="w-full bg-transparent text-xl font-semibold text-foreground outline-none placeholder:text-muted-foreground/50"
                                        />
                                    </div>

                                    <RemoveButton onClick={() => removeTab(tab.id)} disabled={tabItems.length <= 1} />
                                </div>

                                <CardDescription>
                                    <TextAreaField
                                        value={tab.description}
                                        onChange={(value) => updateTab(tab.id, "description", value)}
                                        placeholder={`Write content for Tab ${index + 1}...`}
                                        rows={4}
                                        className="mt-3"
                                    />
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </TabsContent>
                ))}
            </ShadcnTabs>
        </div>
    )
}

export function TabsTool({ data, onDataChange, onDelete }) {
    return (
        <ToolShell
            title="Tabs block"
            description="Add content that learners can open by tab."
            onDelete={onDelete}
        >
            <TabsEditor
                items={data?.items ?? []}
                onItemsChange={(items) => onDataChange({ ...data, items })}
            />
        </ToolShell>
    )
}

function AccordionEditor({ items, onItemsChange, intro }) {
    const accordionItems = items ?? []

    function updateItem(itemId, field, value) {
        onItemsChange(
            accordionItems.map((item) =>
                item.id === itemId ? { ...item, [field]: value } : item
            )
        )
    }

    function addItem() {
        onItemsChange([
            ...accordionItems,
            { id: createId("accordion"), title: "", content: "" },
        ])
    }

    function removeItem(itemId) {
        if (accordionItems.length <= 1) return
        onItemsChange(accordionItems.filter((item) => item.id !== itemId))
    }

    return (
        <div className="space-y-4">
            <SectionHeading
                title="Accordion items"
                description={intro ?? "New items start blank so you can type directly."}
                action={<AddButton onClick={addItem}>Add item</AddButton>}
            />

            <ShadcnAccordion type="single" collapsible className="w-full space-y-3">
                {accordionItems.map((item, index) => (
                    <AccordionItem
                        key={item.id}
                        value={item.id}
                        className="rounded-lg bg-muted/40 px-4"
                    >
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={item.title ?? ""}
                                onChange={(event) => updateItem(item.id, "title", event.target.value)}
                                placeholder={`Accordion item ${index + 1} title`}
                                className="w-full bg-transparent py-4 font-medium outline-none placeholder:text-muted-foreground"
                            />

                            <AccordionTrigger className="w-auto shrink-0 px-2">
                                <span className="sr-only">Toggle content</span>
                            </AccordionTrigger>
                        </div>

                        <AccordionContent>
                            <div className="space-y-3 pt-2">
                                <TextAreaField
                                    value={item.content}
                                    onChange={(value) => updateItem(item.id, "content", value)}
                                    rows={4}
                                    placeholder={`Write content for item ${index + 1}...`}
                                />

                                <RemoveButton onClick={() => removeItem(item.id)} disabled={accordionItems.length <= 1}>
                                    Remove item
                                </RemoveButton>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </ShadcnAccordion>
        </div>
    )
}

export function AccordionTool({ data, onDataChange, onDelete }) {
    return (
        <ToolShell
            title="Accordion block"
            description="Create expandable questions, notes, or explanations."
            onDelete={onDelete}
        >
            <AccordionEditor
                items={data?.items ?? []}
                onItemsChange={(items) => onDataChange({ ...data, items })}
            />
        </ToolShell>
    )
}

function FlipCardsEditor({ cards, onCardsChange, intro }) {
    const cardItems = cards ?? []
    const [flippedCardId, setFlippedCardId] = useState(null)

    function updateCard(cardId, field, value) {
        onCardsChange(
            cardItems.map((card) =>
                card.id === cardId ? { ...card, [field]: value } : card
            )
        )
    }

    function addCard() {
        onCardsChange([
            ...cardItems,
            { id: createId("flip-card"), frontTitle: "", backTitle: "", description: "" },
        ])
    }

    function removeCard(cardId) {
        if (cardItems.length <= 1) return

        onCardsChange(cardItems.filter((card) => card.id !== cardId))
        if (flippedCardId === cardId) setFlippedCardId(null)
    }

    function toggleCard(cardId) {
        setFlippedCardId((currentId) => (currentId === cardId ? null : cardId))
    }

    return (
        <div className="space-y-4">
            <SectionHeading
                title="Review cards"
                description={intro ?? "New cards start blank and use placeholders only."}
                action={<AddButton onClick={addCard}>Add card</AddButton>}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {cardItems.map((card, index) => {
                    const isFlipped = flippedCardId === card.id

                    return (
                        <div key={card.id} className="h-64 w-full [perspective:1000px]">
                            <div
                                className={`relative h-full w-full rounded-xl transition-transform duration-700 [transform-style:preserve-3d] ${
                                    isFlipped ? "[transform:rotateY(180deg)]" : ""
                                }`}
                            >
                                <div className="absolute inset-0 flex flex-col justify-between rounded-xl bg-foreground p-5 text-background shadow-sm [backface-visibility:hidden]">
                                    <div>
                                        <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                            Front {index + 1}
                                        </p>

                                        <input
                                            type="text"
                                            value={card.frontTitle ?? ""}
                                            onChange={(event) => updateCard(card.id, "frontTitle", event.target.value)}
                                            placeholder="Question or term"
                                            className="w-full bg-transparent text-2xl font-semibold text-background outline-none placeholder:text-background/50"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => toggleCard(card.id)}
                                        className="self-start rounded-full border border-white/20 px-3 py-2 text-sm font-medium transition hover:bg-card hover:text-black"
                                    >
                                        Flip card
                                    </button>
                                </div>

                                <div className="absolute inset-0 flex [transform:rotateY(180deg)] flex-col justify-between rounded-xl bg-muted p-5 text-foreground shadow-sm [backface-visibility:hidden]">
                                    <div>
                                        <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                            Back {index + 1}
                                        </p>

                                        <input
                                            type="text"
                                            value={card.backTitle ?? ""}
                                            onChange={(event) => updateCard(card.id, "backTitle", event.target.value)}
                                            placeholder="Answer"
                                            className="w-full bg-transparent text-xl font-semibold text-foreground outline-none placeholder:text-muted-foreground"
                                        />

                                        <textarea
                                            value={card.description ?? ""}
                                            onChange={(event) => updateCard(card.id, "description", event.target.value)}
                                            rows={3}
                                            placeholder="Explanation..."
                                            className="mt-3 w-full resize-none bg-transparent text-sm text-muted-foreground outline-none placeholder:text-muted-foreground"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => toggleCard(card.id)}
                                            className="rounded-full bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                                        >
                                            Flip back
                                        </button>

                                        <RemoveButton onClick={() => removeCard(card.id)} disabled={cardItems.length <= 1} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export function FlipGridTool({ data, onDataChange, onDelete }) {
    return (
        <ToolShell
            title="Flip card grid"
            description="Great for flashcards, terms, questions, and answers."
            onDelete={onDelete}
        >
            <FlipCardsEditor
                cards={data?.cards ?? []}
                onCardsChange={(cards) => onDataChange({ ...data, cards })}
            />
        </ToolShell>
    )
}

export function ImageTool({ data, onDataChange, onDelete }) {
    return (
        <ToolShell
            title="Image block"
            description="Upload an image for your lesson."
            onDelete={onDelete}
        >
            <ImageUploadArea data={data ?? {}} onDataChange={onDataChange} />
        </ToolShell>
    )
}

export function VideoTool({ data, onDataChange, onDelete }) {
    return (
        <ToolShell
            title="Video block"
            description="Upload a video lesson or explanation."
            onDelete={onDelete}
        >
            <VideoUploadArea data={data ?? {}} onDataChange={onDataChange} />
        </ToolShell>
    )
}

/**
 * The heading + description pair the compound tools share. Its own label and
 * blurb are dropped for the same reason as ToolShell's: the field placeholders
 * already say what goes where, so the explanation was pure repetition.
 */
function CombinedHeaderFields({ data, onDataChange, title }) {
    return (
        <div className="space-y-1" aria-label={title || undefined}>
            <div className="space-y-3">
                <InlineField
                    value={data?.smallHeader}
                    onChange={(value) => onDataChange({ ...data, smallHeader: value })}
                    placeholder="Write a smaller heading..."
                    className="text-xl font-semibold text-foreground"
                />

                <TextAreaField
                    value={data?.description}
                    onChange={(value) => onDataChange({ ...data, description: value })}
                    placeholder="Write a description..."
                    rows={4}
                />
            </div>
        </div>
    )
}

function GridItemsEditor({ data, onDataChange }) {
    const items = data?.gridItems ?? []

    function updateItem(itemId, field, value) {
        onDataChange({
            ...data,
            gridItems: items.map((item) =>
                item.id === itemId ? { ...item, [field]: value } : item
            ),
        })
    }

    function addItem() {
        onDataChange({
            ...data,
            gridItems: [...items, { id: createId("grid"), title: "", description: "" }],
        })
    }

    function removeItem(itemId) {
        if (items.length <= 1) return
        onDataChange({ ...data, gridItems: items.filter((item) => item.id !== itemId) })
    }

    return (
        <div className="space-y-4">
            <SectionHeading
                title="Grid cards"
                description="New cards start blank and use placeholders only."
                action={<AddButton onClick={addItem}>Add card</AddButton>}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((item, index) => (
                    <div
                        key={item.id}
                        className="space-y-3 rounded-xl bg-muted/40 p-4 transition hover:bg-muted/60"
                    >
                        <input
                            type="text"
                            value={item.title ?? ""}
                            onChange={(event) => updateItem(item.id, "title", event.target.value)}
                            placeholder={`Card ${index + 1} title`}
                            className="w-full bg-transparent text-lg font-semibold text-foreground outline-none placeholder:text-muted-foreground/50"
                        />

                        <TextAreaField
                            value={item.description}
                            onChange={(value) => updateItem(item.id, "description", value)}
                            placeholder={`Card ${index + 1} description...`}
                            rows={4}
                        />

                        <RemoveButton onClick={() => removeItem(item.id)} disabled={items.length <= 1}>
                            Remove card
                        </RemoveButton>
                    </div>
                ))}
            </div>
        </div>
    )
}

export function IntroImageCardTool({ data, onDataChange, onDelete }) {
    const toolData = data ?? {}

    return (
        <ToolShell
            title="Intro image card"
            description="A smaller heading, description, and image in one combined block."
            onDelete={onDelete}
        >
            <CombinedHeaderFields
                data={toolData}
                onDataChange={onDataChange}
                title="Intro content"
                description="This uses the same heading and description behavior as your individual tools."
            />

            <ImageUploadArea data={toolData} onDataChange={onDataChange} title="Upload intro image" />
        </ToolShell>
    )
}

/**
 * Editor for the table block.
 *
 * The grid of inputs mirrors the table it produces, so what an author edits
 * looks like what a learner reads. Rows and columns are added and removed at
 * the ends rather than by dragging: a certification table is written once from
 * source material, not rearranged, and a drag handle per cell would cost far
 * more than it earns here.
 *
 * The two structures are kept in step by `columns` being the single authority
 * on width -- every row's `cells` array is resized to match whenever a column
 * is added or removed, so a malformed row can never reach the renderer.
 */
function TableEditor({ data, onDataChange }) {
    const columns = data?.columns ?? []
    const rows = data?.rows ?? []

    function updateColumn(columnIndex, label) {
        onDataChange({
            ...data,
            columns: columns.map((column, index) =>
                index === columnIndex ? { ...column, label } : column
            ),
        })
    }

    function updateCell(rowIndex, cellIndex, value) {
        onDataChange({
            ...data,
            rows: rows.map((row, index) =>
                index === rowIndex
                    ? {
                        ...row,
                        cells: (row.cells ?? []).map((cell, position) =>
                            position === cellIndex ? value : cell
                        ),
                    }
                    : row
            ),
        })
    }

    function addColumn() {
        onDataChange({
            ...data,
            columns: [...columns, { id: createId("column"), label: "" }],
            // Every row grows with the header, so the two never disagree.
            rows: rows.map((row) => ({ ...row, cells: [...(row.cells ?? []), ""] })),
        })
    }

    function removeColumn(columnIndex) {
        if (columns.length <= 1) return
        onDataChange({
            ...data,
            columns: columns.filter((_column, index) => index !== columnIndex),
            rows: rows.map((row) => ({
                ...row,
                cells: (row.cells ?? []).filter((_cell, index) => index !== columnIndex),
            })),
        })
    }

    function addRow() {
        onDataChange({
            ...data,
            rows: [...rows, { id: createId("row"), cells: columns.map(() => "") }],
        })
    }

    function removeRow(rowIndex) {
        if (rows.length <= 1) return
        onDataChange({ ...data, rows: rows.filter((_row, index) => index !== rowIndex) })
    }

    const gridTemplate = {
        gridTemplateColumns: `repeat(${Math.max(columns.length, 1)}, minmax(9rem, 1fr)) 2.5rem`,
    }

    return (
        <div className="space-y-4">
            <SectionHeading
                title="Table"
                action={
                    <div className="flex gap-2">
                        <AddButton onClick={addColumn}>Add column</AddButton>
                        <AddButton onClick={addRow}>Add row</AddButton>
                    </div>
                }
            />

            {/* The editor scrolls sideways for the same reason the rendered
                table does: a wide table must not push the page out. */}
            <div className="overflow-x-auto pb-1">
                <div className="min-w-max space-y-2">
                    <div className="grid gap-2" style={gridTemplate}>
                        {columns.map((column, columnIndex) => (
                            <div key={column.id ?? columnIndex} className="space-y-1">
                                <input
                                    type="text"
                                    value={column.label ?? ""}
                                    onChange={(event) => updateColumn(columnIndex, event.target.value)}
                                    placeholder={`Column ${columnIndex + 1}`}
                                    aria-label={`Column ${columnIndex + 1} heading`}
                                    className="w-full rounded-lg bg-muted/60 px-3 py-2 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground/50"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeColumn(columnIndex)}
                                    disabled={columns.length <= 1}
                                    className="text-xs text-muted-foreground transition hover:text-destructive disabled:opacity-40"
                                >
                                    Remove column
                                </button>
                            </div>
                        ))}
                        <div aria-hidden="true" />
                    </div>

                    {rows.map((row, rowIndex) => (
                        <div key={row.id ?? rowIndex} className="grid gap-2" style={gridTemplate}>
                            {columns.map((column, cellIndex) => (
                                <input
                                    key={column.id ?? cellIndex}
                                    type="text"
                                    value={(row.cells ?? [])[cellIndex] ?? ""}
                                    onChange={(event) => updateCell(rowIndex, cellIndex, event.target.value)}
                                    placeholder={cellIndex === 0 ? `Row ${rowIndex + 1}` : ""}
                                    aria-label={`Row ${rowIndex + 1}, ${column.label || `column ${cellIndex + 1}`}`}
                                    className="w-full rounded-lg bg-muted/40 px-3 py-2 text-sm text-foreground outline-none transition hover:bg-muted/60 placeholder:text-muted-foreground/50"
                                />
                            ))}
                            <button
                                type="button"
                                onClick={() => removeRow(rowIndex)}
                                disabled={rows.length <= 1}
                                aria-label={`Remove row ${rowIndex + 1}`}
                                className="grid place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                            >
                                &times;
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                    type="checkbox"
                    checked={data?.rowHeaders !== false}
                    onChange={(event) => onDataChange({ ...data, rowHeaders: event.target.checked })}
                />
                First column labels its row
            </label>
        </div>
    )
}

export function TableTool({ data, onDataChange, onDelete }) {
    const toolData = data ?? {}

    return (
        <ToolShell
            title="Table"
            description="Rows and columns of real text, for material that is genuinely tabular."
            onDelete={onDelete}
        >
            <CombinedHeaderFields
                data={toolData}
                onDataChange={onDataChange}
                title="Table intro"
                description="Add a heading and a lead-in, then build the table below."
            />

            <TableEditor data={toolData} onDataChange={onDataChange} />

            <TextAreaField
                value={toolData.caption}
                onChange={(value) => onDataChange({ ...toolData, caption: value })}
                placeholder="Caption, shown above the table and used as its accessible name..."
                rows={2}
            />

            <TextAreaField
                value={toolData.footer}
                onChange={(value) => onDataChange({ ...toolData, footer: value })}
                placeholder="Optional note below the table..."
                rows={2}
            />
        </ToolShell>
    )
}

export function HeaderDescriptionGridTool({ data, onDataChange, onDelete }) {
    const toolData = data ?? {}

    return (
        <ToolShell
            title="Header description grid"
            description="A smaller heading, description, and grid cards in one block."
            onDelete={onDelete}
        >
            <CombinedHeaderFields
                data={toolData}
                onDataChange={onDataChange}
                title="Header content"
                description="Start with a heading and description, then add grid cards below."
            />

            <GridItemsEditor data={toolData} onDataChange={onDataChange} />
        </ToolShell>
    )
}

export function ImageFeatureGridTool({ data, onDataChange, onDelete }) {
    const toolData = data ?? {}

    return (
        <ToolShell
            title="Image feature grid"
            description="A smaller heading, description, image, and grid cards in one block."
            onDelete={onDelete}
        >
            <CombinedHeaderFields
                data={toolData}
                onDataChange={onDataChange}
                title="Feature content"
                description="Add the intro text, upload an image, then list the features."
            />

            <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
                <ImageUploadArea data={toolData} onDataChange={onDataChange} title="Upload feature image" />
                <GridItemsEditor data={toolData} onDataChange={onDataChange} />
            </div>
        </ToolShell>
    )
}

export function ReviewCardGridTool({ data, onDataChange, onDelete }) {
    const toolData = data ?? {}

    return (
        <ToolShell
            title="Review card grid"
            description="A smaller heading, description, and flip card grid in one block."
            onDelete={onDelete}
        >
            <CombinedHeaderFields
                data={toolData}
                onDataChange={onDataChange}
                title="Review intro"
                description="Add context before the cards. The cards use the same behavior as your individual flip cards."
            />

            <FlipCardsEditor
                cards={toolData.cards ?? []}
                onCardsChange={(cards) => onDataChange({ ...toolData, cards })}
            />
        </ToolShell>
    )
}

export function ContentAccordionBlockTool({ data, onDataChange, onDelete }) {
    const toolData = data ?? {}

    return (
        <ToolShell
            title="Accordion content block"
            description="A smaller heading, description, and accordion in one block."
            onDelete={onDelete}
        >
            <CombinedHeaderFields
                data={toolData}
                onDataChange={onDataChange}
                title="Accordion intro"
                description="Add context before the accordion items."
            />

            <AccordionEditor
                items={toolData.items ?? []}
                onItemsChange={(items) => onDataChange({ ...toolData, items })}
            />
        </ToolShell>
    )
}

export function ContentTabsBlockTool({ data, onDataChange, onDelete }) {
    const toolData = data ?? {}

    return (
        <ToolShell
            title="Tabs content block"
            description="A smaller heading, description, and tabs in one block."
            onDelete={onDelete}
        >
            <CombinedHeaderFields
                data={toolData}
                onDataChange={onDataChange}
                title="Tabs intro"
                description="Add context before the tabs. New tabs stay inside this block."
            />

            <TabsEditor
                items={toolData.items ?? []}
                onItemsChange={(items) => onDataChange({ ...toolData, items })}
            />
        </ToolShell>
    )
}

export function MediaTextBlockTool({ data, onDataChange, onDelete }) {
    const toolData = data ?? {}
    const mediaType = toolData.mediaType === "video" ? "video" : "image"
    const mediaIsOnRight = toolData.layout === "image-right"

    function updateField(field, value) {
        const nextData = { ...toolData, [field]: value }

        if (field === "mediaType") {
            nextData.mediaType = value === "video" ? "video" : "image"
            nextData.file = null

            if (nextData.mediaType === "video") {
                nextData.imageKey = ""
            } else {
                nextData.videoKey = ""
            }
        }

        onDataChange(nextData)
    }

    return (
        <ToolShell
            title="Media text block"
            description="A smaller heading, description, media, and supporting text in one block."
            onDelete={onDelete}
        >
            <CombinedHeaderFields
                data={toolData}
                onDataChange={onDataChange}
                title="Media intro"
                description="Add context before the image or video layout."
            />

            <div className="grid gap-3 rounded-xl bg-muted/40 p-4 sm:grid-cols-2">
                <div className="space-y-1.5 text-sm font-medium text-foreground">
                    <span>Media type</span>
                    <Select value={mediaType} onValueChange={(value) => updateField("mediaType", value)}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="image">Image</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5 text-sm font-medium text-foreground">
                    <span>Layout</span>
                    <Select value={toolData.layout === "image-right" ? "image-right" : "image-left"} onValueChange={(value) => updateField("layout", value)}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="image-left">Media left</SelectItem>
                            <SelectItem value="image-right">Media right</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 md:items-start">
                <div className={mediaIsOnRight ? "md:order-2" : "md:order-1"}>
                    {mediaType === "video" ? (
                        <VideoUploadArea data={toolData} onDataChange={onDataChange} title="Upload media video" />
                    ) : (
                        <ImageUploadArea data={toolData} onDataChange={onDataChange} title="Upload media image" />
                    )}
                </div>

                <div className={mediaIsOnRight ? "md:order-1" : "md:order-2"}>
                    <InlineField
                        value={toolData.supportingTitle}
                        onChange={(value) => updateField("supportingTitle", value)}
                        placeholder="Write a title..."
                        className="text-2xl font-bold text-foreground"
                    />

                    <TextAreaField
                        value={toolData.supportingDescription}
                        onChange={(value) => updateField("supportingDescription", value)}
                        placeholder="Write the explanation..."
                        rows={8}
                        className="mt-4"
                    />
                </div>
            </div>
        </ToolShell>
    )
}

/**
 * Image with hotspots -- an admin-only tool.
 *
 * Deliberately absent from the AI lesson catalogue in
 * `python-backend/app/agents/certification/lesson_agent.py`: placing a pin
 * means knowing where a thing sits in a specific picture, and the generator
 * only ever supplies an image *query*, never the pixels. A model can invent
 * plausible coordinates for an image it has never seen, which is the one
 * failure mode this tool cannot survive -- a mislabelled diagram teaches the
 * wrong thing with full confidence. So it is authored by hand or not at all.
 *
 * Coordinates are percentages of the image box, not pixels, so a pin stays on
 * its feature at every rendered width.
 */
function HotspotEditor({ data, onDataChange }) {
    const hotspots = data?.hotspots ?? []
    const selectedFile = data?.file ?? null
    const uploadedPreview = useObjectUrl(selectedFile)
    const storedPreview = useStoredFileUrl(data?.imageKey)
    const previewUrl = uploadedPreview || storedPreview

    const [selectedId, setSelectedId] = useState(null)
    // Set while a pin is being dragged, so the image's own click handler knows
    // not to read the drag's mouseup as "place a new pin here".
    const [draggingId, setDraggingId] = useState(null)

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            "image/jpeg": [".jpeg", ".jpg", ".jfif"],
            "image/png": [".png"],
            "image/webp": [".webp"],
            "image/gif": [".gif"],
        },
        multiple: false,
        onDrop: (acceptedFiles) => {
            const imageFile = acceptedFiles[0]
            if (!imageFile) return

            // Pins survive a re-upload: the usual reason to replace an image is
            // a better version of the same diagram, and silently discarding the
            // labels would punish that.
            onDataChange({ ...data, file: imageFile, imageKey: "" })
        },
    })

    function updateHotspots(nextHotspots) {
        onDataChange({ ...data, hotspots: nextHotspots })
    }

    function updateHotspot(hotspotId, field, value) {
        updateHotspots(
            hotspots.map((hotspot) =>
                hotspot.id === hotspotId ? { ...hotspot, [field]: value } : hotspot
            )
        )
    }

    function removeHotspot(hotspotId) {
        updateHotspots(hotspots.filter((hotspot) => hotspot.id !== hotspotId))
        if (selectedId === hotspotId) setSelectedId(null)
    }

    /** Pointer position as a percentage of the image box, clamped to it. */
    function toPercentage(event, element) {
        const bounds = element.getBoundingClientRect()
        const x = ((event.clientX - bounds.left) / bounds.width) * 100
        const y = ((event.clientY - bounds.top) / bounds.height) * 100

        return {
            x: Math.min(100, Math.max(0, Number(x.toFixed(2)))),
            y: Math.min(100, Math.max(0, Number(y.toFixed(2)))),
        }
    }

    function handleSurfaceClick(event) {
        if (draggingId) return

        const { x, y } = toPercentage(event, event.currentTarget)
        const hotspotId = createId("hotspot")

        updateHotspots([...hotspots, { id: hotspotId, x, y, title: "", description: "" }])
        setSelectedId(hotspotId)
    }

    function handlePinPointerDown(event, hotspotId) {
        event.stopPropagation()
        setSelectedId(hotspotId)

        const surface = event.currentTarget.parentElement
        if (!surface) return

        // Pointer capture on the surface, not the pin: the cursor routinely
        // outruns a 28px target mid-drag, and without capture the pin is
        // dropped the moment that happens.
        surface.setPointerCapture(event.pointerId)
        setDraggingId(hotspotId)

        function handleMove(moveEvent) {
            const { x, y } = toPercentage(moveEvent, surface)

            onDataChange({
                ...data,
                hotspots: hotspots.map((hotspot) =>
                    hotspot.id === hotspotId ? { ...hotspot, x, y } : hotspot
                ),
            })
        }

        function handleUp() {
            surface.releasePointerCapture(event.pointerId)
            surface.removeEventListener("pointermove", handleMove)
            surface.removeEventListener("pointerup", handleUp)
            // Cleared after the event loop settles, so the click this pointerup
            // synthesises still sees `draggingId` set and is ignored.
            setTimeout(() => setDraggingId(null), 0)
        }

        surface.addEventListener("pointermove", handleMove)
        surface.addEventListener("pointerup", handleUp)
    }

    if (!previewUrl) {
        return (
            <div
                {...getRootProps()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-7 text-center transition ${
                    isDragActive
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/40 hover:border-primary/40 hover:bg-muted/60"
                }`}
            >
                <input {...getInputProps()} />
                <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <ImagePlus className="h-5 w-5" />
                </div>
                <p className="font-medium text-foreground">
                    {isDragActive ? "Drop the image here" : "Upload the image to annotate"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                    JPG, PNG, WebP, GIF, or JFIF. You place the pins next.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 text-sm text-muted-foreground">
                    Click the image to place a pin. Drag a pin to move it.
                </p>

                <div {...getRootProps()} className="shrink-0">
                    <input {...getInputProps()} />
                    <button
                        type="button"
                        className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted/70"
                    >
                        Replace image
                    </button>
                </div>
            </div>

            {/* `touch-none` so a drag on a touch device moves the pin instead of
                scrolling the page out from under it. */}
            <div
                onClick={handleSurfaceClick}
                className="relative w-full cursor-crosshair touch-none select-none overflow-hidden rounded-xl bg-muted/40"
            >
                <img
                    src={previewUrl}
                    alt="Hotspot image"
                    draggable={false}
                    className="pointer-events-none max-h-[520px] w-full object-contain"
                />

                {hotspots.map((hotspot, index) => (
                    <button
                        key={hotspot.id}
                        type="button"
                        onPointerDown={(event) => handlePinPointerDown(event, hotspot.id)}
                        onClick={(event) => event.stopPropagation()}
                        style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                        title={hotspot.title || `Pin ${index + 1}`}
                        className={`absolute z-10 grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 cursor-grab place-items-center rounded-full text-xs font-bold shadow-md ring-2 ring-background transition active:cursor-grabbing ${
                            selectedId === hotspot.id
                                ? "scale-110 bg-primary text-primary-foreground"
                                : "bg-foreground text-background"
                        }`}
                    >
                        {index + 1}
                    </button>
                ))}
            </div>

            {hotspots.length === 0 ? (
                <p className="rounded-lg bg-muted/40 p-4 text-center text-sm text-muted-foreground">
                    No pins yet. Click anywhere on the image above to add the first one.
                </p>
            ) : (
                <div className="space-y-3">
                    {hotspots.map((hotspot, index) => (
                        <div
                            key={hotspot.id}
                            onClick={() => setSelectedId(hotspot.id)}
                            className={`rounded-xl p-4 transition ${
                                selectedId === hotspot.id ? "bg-primary/10" : "bg-muted/40"
                            }`}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-foreground text-xs font-bold text-background">
                                        {index + 1}
                                    </span>

                                    <InlineField
                                        value={hotspot.title}
                                        onChange={(value) => updateHotspot(hotspot.id, "title", value)}
                                        placeholder="What is at this point?"
                                        className="text-base font-semibold text-foreground"
                                    />
                                </div>

                                <RemoveButton onClick={() => removeHotspot(hotspot.id)} />
                            </div>

                            <TextAreaField
                                value={hotspot.description}
                                onChange={(value) => updateHotspot(hotspot.id, "description", value)}
                                placeholder="Explain it..."
                                rows={3}
                                className="mt-3"
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export function ImageHotspotTool({ data, onDataChange, onDelete }) {
    return (
        <ToolShell
            title="Image with hotspots"
            description="An image the learner explores by opening labelled points on it."
            onDelete={onDelete}
        >
            <HotspotEditor data={data ?? {}} onDataChange={onDataChange} />
        </ToolShell>
    )
}
