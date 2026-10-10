import React, { useEffect, useMemo, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import {
    ArrowUp,
    Bookmark,
    Eye,
    BookOpen,
    FileArchive,
    FileText,
    Home,
    Layers,
    Loader2,
    MessageCircle,
    MoreHorizontal,
    Plus,
    Search,
    ChevronLeft,
    ChevronRight,
    Lock,
    Send,
    Share2,
    Sparkles,
    Trash2,
    UsersRound,
    X,
} from "@/components/icons"
import { getFileViewLink } from "@/services/fileService"
import { useAvatarUrls } from "@/hooks/use-avatar-url.js"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { apiMessage } from "@/services/base"
import { getAllCertifications } from "@/services/certificationService"
import { getLibraryItems } from "@/services/learnerToolsService"
import {
    addCommunityComment,
    deleteCommunityComment,
    applyPostCounts,
    createCommunityCircle,
    createCommunityPost,
    deleteCommunityCircle,
    deleteCommunityPost,
    getCommunityCircles,
    getCommunityComments,
    getCommunityPosts,
    toggleCircleMembership,
    toggleCommunityLike,
    toggleCommunitySave,
    uploadCommunityAttachment,
    shareCommunityStudyItem,
    startSharedCommunityPractice,
    recordCommunityPostView,
    reportCommunityPost,
    readCommunityFeedSnapshot,
    writeCommunityFeedSnapshot,
} from "@/services/communityService"
import { useLearnerEntitlements } from "@/hooks/use-learner-entitlements.js"
import { isPremiumError } from "@/services/subscriptionService.js"

const OPEN_FEED = "community"

function circleIdForPost(value) {
    return value && value !== OPEN_FEED ? Number(value) : null
}

const FEED_TABS = [
    { value: "for-you", label: "For you" },
    { value: "discussion", label: "Discussions" },
    { value: "quiz", label: "Quizzes" },
    { value: "flashcard", label: "Flashcards" },
    { value: "reviewer", label: "Reviewers" },
    { value: "circle", label: "Study circles" },
]

const COMMUNITY_FEED_KEY = ["community-feed"]

const REVIEWER_TYPES = ["notes", "docx"]

const POST_TYPE_STYLES = {
    discussion: "bg-rb-macaw-wash text-rb-macaw-lip",
    quiz: "bg-rb-feather-wash text-rb-feather-lip",
    flashcard: "bg-rb-beetle-wash text-rb-beetle-lip",
    circle: "bg-rb-bee-wash text-rb-bee-lip",
    notes: "bg-rb-fox-wash text-rb-fox-lip",
    docx: "bg-rb-fox-wash text-rb-fox-lip",
}

const POST_TYPE_LABELS = {
    discussion: "discussion",
    quiz: "practice set",
    flashcard: "flashcards",
    circle: "study circle",
    notes: "material",
    docx: "material",
}

const AVATAR_TONES = [
    "bg-rb-macaw-wash text-rb-macaw-lip",
    "bg-rb-beetle-wash text-rb-beetle-lip",
    "bg-rb-fox-wash text-rb-fox-lip",
    "bg-rb-bee-wash text-rb-bee-lip",
    "bg-rb-feather-wash text-rb-feather-lip",
]

function avatarTone(seed = "") {
    let total = 0
    for (let index = 0; index < seed.length; index += 1) total += seed.charCodeAt(index)
    return AVATAR_TONES[total % AVATAR_TONES.length]
}

function formatBytes(size) {
    if (!size || size < 0) return null
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function CommunityAvatar({ initials, tone, url, className = "" }) {
    return (
        <div
            className={`relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full font-rb-display text-sm font-extrabold lowercase ${
                tone ?? avatarTone(initials ?? "")
            } ${className}`}
            aria-hidden="true"
        >
            {initials}
            {url ? (
                <img
                    src={url}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover"
                />
            ) : null}
        </div>
    )
}

function attachmentTone(type) {
    if (type === "QUIZ") return "bg-rb-feather-wash text-rb-feather-lip"
    if (type === "DOCX") return "bg-rb-bee-wash text-rb-bee-lip"
    if (type === "IMAGE") return "bg-rb-feather-wash text-rb-feather-lip"
    if (type === "TXT") return "bg-rb-snow text-rb-hare"
    return "bg-rb-cardinal-wash text-rb-cardinal-lip"
}

const REVIEWER_ACCEPT = ".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.webp"

const MAX_REVIEWER_IMAGES = 10

function PostImageCarousel({ files, onOpen }) {
    const [urls, setUrls] = useState(null)
    const [failed, setFailed] = useState(false)
    const [index, setIndex] = useState(0)
    const trackRef = useRef(null)

    useEffect(() => {
        let cancelled = false
        setUrls(null)
        setFailed(false)
        setIndex(0)

        Promise.all(files.map((file) => getFileViewLink(file.key, file.name))).then(
            (links) => !cancelled && setUrls(links.map((link) => link.url)),
            () => !cancelled && setFailed(true)
        )
        return () => {
            cancelled = true
        }
    }, [files])

    function syncIndex(event) {
        const track = event.currentTarget
        const width = track.clientWidth || 1
        setIndex(Math.round(track.scrollLeft / width))
    }

    function step(delta) {
        const track = trackRef.current
        if (!track) return
        const next = Math.min(files.length - 1, Math.max(0, index + delta))
        track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" })
        setIndex(next)
    }

    if (failed) return null

    return (
        <div className="rb-post-gallery">
            <div className="rb-post-gallery-frame" ref={trackRef} onScroll={syncIndex}>
                {files.map((file, position) => (
                    <button
                        key={file.key ?? position}
                        type="button"
                        onClick={onOpen}
                        aria-label={`Open ${file.name ?? `image ${position + 1}`}`}
                    >
                        {urls ? (
                            <img src={urls[position]} alt={file.name ?? ""} loading="lazy" />
                        ) : (
                            <span className="rb-post-gallery-wait" aria-hidden="true" />
                        )}
                    </button>
                ))}
            </div>

            {files.length > 1 ? (
                <>
                    <span className="rb-post-gallery-count">{index + 1}/{files.length}</span>

                    {index > 0 ? (
                        <button
                            type="button"
                            className="rb-post-gallery-step is-prev"
                            onClick={() => step(-1)}
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="size-4" />
                        </button>
                    ) : null}
                    {index < files.length - 1 ? (
                        <button
                            type="button"
                            className="rb-post-gallery-step is-next"
                            onClick={() => step(1)}
                            aria-label="Next image"
                        >
                            <ChevronRight className="size-4" />
                        </button>
                    ) : null}

                    <div className="rb-post-gallery-dots" aria-hidden="true">
                        {files.map((file, position) => (
                            <span key={file.key ?? position} data-on={position === index ? "" : undefined} />
                        ))}
                    </div>
                </>
            ) : null}
        </div>
    )
}

function reviewerAttachmentKind(name) {
    const extension = String(name ?? "").toLowerCase().split(".").pop()
    if (extension === "docx" || extension === "doc") return "DOCX"
    if (extension === "txt") return "TXT"
    if (["png", "jpg", "jpeg", "gif", "webp"].includes(extension)) return "IMAGE"
    return "PDF"
}

function PayloadTile({ icon: Icon, tone, name, meta, views, actionLabel, onAction }) {
    const openedBy = Number(views ?? 0)

    return (
        <div className="mt-4 flex items-center gap-3 rounded-rb-tile border-2 border-border bg-muted/40 p-3">
            <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone}`}>
                <Icon className="size-5" aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">{name}</p>
                <p className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-xs font-semibold text-muted-foreground">
                    <span className="truncate">{meta}</span>
                    {openedBy > 0 ? (
                        <span className="flex shrink-0 items-center gap-1">
                            ·
                            <Eye className="size-3.5" aria-hidden="true" />
                            {openedBy.toLocaleString()}
                            <span className="sr-only"> learners opened this</span>
                            <span aria-hidden="true">opened</span>
                        </span>
                    ) : null}
                </p>
            </div>

            {onAction ? (
                <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={onAction}>
                    {actionLabel}
                </Button>
            ) : null}
        </div>
    )
}

function CountAction({ icon: Icon, count, label, active, activeClassName = "", onClick, className = "" }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors hover:bg-accent hover:text-foreground ${
                active ? activeClassName : ""
            } ${className}`}
        >
            <Icon className={`size-4 ${active ? "fill-current" : ""}`} />
            {Number(count ?? 0).toLocaleString()}
            <span className="sr-only"> {label}</span>
        </button>
    )
}

function PostTypeBadge({ type }) {
    return (
        <span
            className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 font-rb-display text-[0.6875rem] font-extrabold lowercase tracking-wide ${
                POST_TYPE_STYLES[type] ?? POST_TYPE_STYLES.discussion
            }`}
        >
            {POST_TYPE_LABELS[type] ?? "post"}
        </span>
    )
}

function CircleHeader({ circle, onToggleJoin, onDelete, onBack }) {
    return (
        <PanelCard className="overflow-hidden">
            <div className="relative h-24 bg-rb-bee-wash">
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-3 left-3 select-none whitespace-nowrap font-rb-display text-[4rem] font-extrabold lowercase leading-none text-rb-bee-lip opacity-[0.14]"
                >
                    {circle.name}
                </span>

                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="absolute left-3 top-3 rounded-full"
                    onClick={onBack}
                >
                    <X className="mr-2 size-4" />
                    Back to feed
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 p-4">
                <span className="-mt-10 grid size-16 shrink-0 place-items-center rounded-full border-4 border-card bg-rb-bee-wash font-rb-display text-lg font-extrabold lowercase text-rb-bee-lip">
                    {circle.initials}
                </span>

                <div className="min-w-0 flex-1">
                    <h1 className="truncate font-rb-display text-xl font-extrabold lowercase text-foreground">
                        {circle.name}
                    </h1>
                    <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                        {(circle.members ?? 0).toLocaleString()} members · {circle.topic}
                    </p>
                </div>

                {circle.owner ? (
                    <>
                        <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground">
                            owner
                        </span>
                        <Button type="button" variant="outline" size="sm" className="text-destructive" onClick={onDelete}>
                            Delete circle
                        </Button>
                    </>
                ) : (
                    <Button
                        type="button"
                        size="sm"
                        variant={circle.joined ? "outline" : "default"}
                        className="rounded-full"
                        onClick={() => onToggleJoin(circle.circleId)}
                    >
                        {circle.joined ? "Joined" : "Join circle"}
                    </Button>
                )}
            </div>

            <p className="border-t-2 border-border px-4 py-3 text-sm leading-6 text-muted-foreground">
                {circle.description}
            </p>
        </PanelCard>
    )
}

function PanelCard({ className = "", children }) {
    return (
        <section className={`rounded-rb-card border-2 border-border bg-card ${className}`}>
            {children}
        </section>
    )
}

function PanelHeading({ icon: Icon, tone = "bg-rb-macaw-wash text-rb-macaw-lip", title, children }) {
    return (
        <div className="flex items-center gap-2.5">
            <span className={`grid size-8 shrink-0 place-items-center rounded-xl ${tone}`}>
                <Icon className="size-4" aria-hidden="true" />
            </span>
            <h2 className="font-rb-display text-sm font-extrabold lowercase text-foreground">{title}</h2>
            {children}
        </div>
    )
}

function CommunityPost({
                           post,
                           circles,
                           onToggleUpvote,
                           onToggleSave,
                           onToggleComments,
                           onJoinCircle,
                           onDelete,
                           onStartPractice,
                           onReport,
                           onOpenAttachment,
                           onOpenCircle,
                           authorAvatarUrl,
                           threadOpen,
                           threadComments,
                           draft,
                           onDraftChange,
                           onSubmitComment,
                           onDeleteComment,
                       }) {
    const linkedCircle = post.circleId
        ? circles.find((circle) => circle.circleId === post.circleId)
        : null

    const isStudySet = ["quiz", "flashcard"].includes(post.postType)
    const fileSize = formatBytes(post.attachmentSize)
    const cardRef = useRef(null)

    useEffect(() => {
        if (!threadOpen) return undefined
        function handlePointerDown(event) {
            if (!cardRef.current?.contains(event.target)) onToggleComments(post.postId)
        }
        document.addEventListener("mousedown", handlePointerDown)
        return () => document.removeEventListener("mousedown", handlePointerDown)
    }, [threadOpen, onToggleComments, post.postId])

    return (
        <article ref={cardRef} className="overflow-hidden rounded-rb-card border-2 border-border bg-card transition-colors hover:border-rb-macaw/60">
            <div className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                    <CommunityAvatar initials={post.initials} tone={avatarTone(post.authorName ?? "")} url={authorAvatarUrl} />

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-foreground">{post.authorName}</span>

                            {post.ownedByMe ? (
                                <Badge variant="outline" className={`h-5 rounded-full px-1.5 text-[10px] ${post.badgeClass}`}>
                                    You
                                </Badge>
                            ) : null}
                        </div>

                        <p className="mt-0.5 flex min-w-0 items-center gap-1 truncate text-xs font-semibold text-muted-foreground">
                            {linkedCircle ? (
                                <button
                                    type="button"
                                    onClick={() => onOpenCircle(linkedCircle.circleId)}
                                    className="max-w-full truncate rounded-sm hover:text-rb-macaw-lip hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rb-macaw"
                                >
                                    {post.community}
                                </button>
                            ) : (
                                post.community
                            )}
                            {[linkedCircle?.topic, post.createdAt].filter(Boolean).map((part) => (
                                <span key={part} className="shrink-0">· {part}</span>
                            ))}
                        </p>
                    </div>

                    <PostTypeBadge type={post.postType} />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="-mr-1 size-8 shrink-0"
                                aria-label="Post actions"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => onToggleSave(post.postId)}>
                                <Bookmark className="mr-2 h-4 w-4" />
                                {post.saved ? "Remove from saved" : "Save post"}
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onSelect={() => {
                                    navigator.clipboard?.writeText(
                                        `${window.location.origin}/learner/community?post=${post.postId}`
                                    )
                                    toast.success("Post link copied.")
                                }}
                            >
                                <Share2 className="mr-2 h-4 w-4" />
                                Copy link
                            </DropdownMenuItem>

                            {!post.ownedByMe ? <DropdownMenuItem onSelect={() => onReport(post.postId)} className="text-destructive focus:text-destructive">Report post</DropdownMenuItem> : null}

                            {post.ownedByMe ? (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onSelect={() => onDelete(post.postId)}
                                    >
                                        Delete post
                                    </DropdownMenuItem>
                                </>
                            ) : null}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="mt-4">
                    {isStudySet ? null : (
                        <h2 className="font-rb-display text-lg font-extrabold leading-6 text-foreground">
                            {post.title}
                        </h2>
                    )}

                    <p className={`text-[0.9375rem] leading-6 text-muted-foreground ${isStudySet ? "" : "mt-2"}`}>
                        {post.description}
                    </p>
                </div>

                {post.attachment?.type === "IMAGE" && post.attachment.key ? (
                    <PostImageCarousel
                        files={post.attachment.files ?? [{ key: post.attachment.key, name: post.attachment.name }]}
                        onOpen={() => onOpenAttachment(post)}
                    />
                ) : post.attachment ? (
                    <PayloadTile
                        icon={post.attachment.type === "DOCX" ? FileArchive : FileText}
                        tone={attachmentTone(post.attachment.type)}
                        name={post.attachment.files ? `${post.attachment.files.length} images` : post.attachment.name}
                        meta={post.attachment.key
                            ? [post.attachment.type, fileSize, "shared reviewer"].filter(Boolean).join(" · ")
                            : "No file attached"}
                        views={post.views}
                        actionLabel="read"
                        onAction={post.attachment.key ? () => onOpenAttachment(post) : null}
                    />
                ) : null}

                {isStudySet ? (
                    <PayloadTile
                        icon={post.postType === "quiz" ? BookOpen : Layers}
                        tone={post.postType === "quiz" ? "bg-rb-feather-wash text-rb-feather-lip" : "bg-rb-beetle-wash text-rb-beetle-lip"}
                        name={post.title}
                        meta={`${POST_TYPE_LABELS[post.postType]} · generated in REBYU`}
                        views={post.views}
                        actionLabel="attempt"
                        onAction={() => onStartPractice(post.postId)}
                    />
                ) : null}


                {linkedCircle && !linkedCircle.joined && !linkedCircle.owner ? (
                    <div className="mt-4 flex flex-col gap-3 rounded-rb-tile border-2 border-border bg-muted/40 p-3 sm:flex-row sm:items-center">
                        <button
                            type="button"
                            onClick={() => onOpenCircle(linkedCircle.circleId)}
                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-rb-bee-wash font-rb-display text-xs font-extrabold lowercase text-rb-bee-lip">
                                {linkedCircle.initials}
                            </span>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-foreground">
                                    {linkedCircle.name}
                                </p>

                                <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                                    {linkedCircle.members?.toLocaleString?.() ?? 0} members
                                </p>
                            </div>
                        </button>

                        <Button
                            type="button"
                            size="sm"
                            variant={linkedCircle.joined ? "outline" : "default"}
                            className="shrink-0 rounded-full"
                            onClick={() => onJoinCircle(linkedCircle.circleId)}
                        >
                            {linkedCircle.joined ? "Joined" : "Join circle"}
                        </Button>
                    </div>
                ) : null}

            </div>

            <div className="flex items-center gap-1 border-t-2 border-border px-3 py-2 text-sm font-bold text-muted-foreground">
                <CountAction
                    icon={ArrowUp}
                    count={post.reactions}
                    label="upvotes"
                    active={post.liked}
                    activeClassName="text-rb-macaw-lip"
                    onClick={() => onToggleUpvote(post.postId)}
                />

                <CountAction
                    icon={MessageCircle}
                    count={post.comments}
                    label="comments"
                    active={threadOpen}
                    activeClassName="text-rb-macaw-lip"
                    onClick={() => onToggleComments(post.postId)}
                />

                <CountAction
                    icon={Bookmark}
                    count={post.saves}
                    label="saves"
                    active={post.saved}
                    activeClassName="text-rb-macaw-lip"
                    onClick={() => onToggleSave(post.postId)}
                    className="ml-auto"
                />
            </div>

            {threadOpen ? (
                <div className="border-t-2 border-border bg-muted/20 px-3 py-2.5 sm:px-4">
                    {threadComments === undefined ? (
                        <p className="py-2 text-center text-xs font-semibold text-muted-foreground">Loading comments...</p>
                    ) : (
                        <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
                            {threadComments.map((comment) => (
                                <div key={comment.commentId} className="group/comment flex items-start gap-2">
                                    <CommunityAvatar
                                        initials={comment.initials}
                                        tone={avatarTone(comment.authorName ?? "")}
                                        className="!size-7 !text-[0.625rem]"
                                    />
                                    <div className="min-w-0 rounded-2xl bg-muted px-3 py-1.5">
                                        <p className="text-xs font-bold text-foreground">{comment.authorName}</p>
                                        <p className="whitespace-pre-wrap text-[0.8125rem] leading-5 text-muted-foreground">
                                            {comment.body}
                                        </p>
                                    </div>
                                    {comment.ownedByMe || post.ownedByMe ? (
                                        <button
                                            type="button"
                                            onClick={() => onDeleteComment(post.postId, comment.commentId)}
                                            aria-label={`Delete comment by ${comment.authorName}`}
                                            className="mt-1 shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive group-hover/comment:opacity-100"
                                        >
                                            <Trash2 className="size-3.5" aria-hidden="true" />
                                        </button>
                                    ) : null}
                                </div>
                            ))}

                            {threadComments.length === 0 ? (
                                <p className="py-1.5 text-center text-xs font-semibold text-muted-foreground">
                                    No comments yet. Start the conversation.
                                </p>
                            ) : null}
                        </div>
                    )}

                    <div className="mt-2 flex items-center gap-2">
                        <CommunityAvatar initials="GG" className="!size-7 !text-[0.625rem]" />
                        <Input
                            value={draft ?? ""}
                            onChange={(event) => onDraftChange(post.postId, event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" && !event.shiftKey) {
                                    event.preventDefault()
                                    onSubmitComment(post.postId)
                                }
                            }}
                            placeholder="Write a comment..."
                            aria-label={`Comment on ${post.title}`}
                            className="h-8 rounded-full bg-muted text-[0.8125rem]"
                        />
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="size-8 shrink-0 rounded-full"
                            onClick={() => onSubmitComment(post.postId)}
                            disabled={!draft?.trim()}
                            aria-label="Post comment"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ) : null}
        </article>
    )
}

export default function Community() {
    const plan = useLearnerEntitlements()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const cachedFeed = queryClient.getQueryData(COMMUNITY_FEED_KEY) ?? readCommunityFeedSnapshot()

    const [posts, setPosts] = useState(() => cachedFeed?.posts ?? [])
    const [circles, setCircles] = useState(() => cachedFeed?.circles ?? [])
    const [certifications, setCertifications] = useState(() => cachedFeed?.certifications ?? [])
    const [studyItems, setStudyItems] = useState(() => cachedFeed?.studyItems ?? [])
    const [selectedStudyItemId, setSelectedStudyItemId] = useState("")
    const [activeTab, setActiveTab] = useState("for-you")
    const [showSavedOnly, setShowSavedOnly] = useState(false)
    const [searchValue, setSearchValue] = useState("")

    const [composerOpen, setComposerOpen] = useState(false)
    const [shareType, setShareType] = useState("discussion")
    const [shareTitle, setShareTitle] = useState("")
    const [shareDescription, setShareDescription] = useState("")
    const [shareCommunity, setShareCommunity] = useState(OPEN_FEED)
    const [attachedFile, setAttachedFile] = useState(null)
    const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)
    const [isPublishing, setIsPublishing] = useState(false)
    const fileInputRef = useRef(null)

    const [createCircleOpen, setCreateCircleOpen] = useState(false)
    const [isCreatingCircle, setIsCreatingCircle] = useState(false)
    const [activeCircleId, setActiveCircleId] = useState(null)
    const [confirmDeleteCircleId, setConfirmDeleteCircleId] = useState(null)
    const [circleName, setCircleName] = useState("")
    const [circleDescription, setCircleDescription] = useState("")
    const [circleTopic, setCircleTopic] = useState("General Study")
    const [circleVisibility, setCircleVisibility] = useState("PUBLIC")

    const [openThreads, setOpenThreads] = useState([])
    const [commentsByPost, setCommentsByPost] = useState({})
    const [commentDrafts, setCommentDrafts] = useState({})
    const [reportPostId, setReportPostId] = useState(null)
    const [reportReason, setReportReason] = useState("SPAM")
    const [reportDetails, setReportDetails] = useState("")


    const feedQuery = useQuery({
        queryKey: COMMUNITY_FEED_KEY,
        queryFn: async () => {
            const optional = (promise) => promise.catch(() => [])
            const [nextPosts, nextCircles, nextCertifications, nextStudyItems] =
                await Promise.all([
                    getCommunityPosts(),
                    optional(getCommunityCircles()),
                    optional(getAllCertifications(undefined, { summary: true })),
                    optional(getLibraryItems()),
                ])
            return {
                posts: Array.isArray(nextPosts) ? nextPosts : [],
                circles: Array.isArray(nextCircles) ? nextCircles : [],
                certifications: Array.isArray(nextCertifications) ? nextCertifications : [],
                studyItems: (Array.isArray(nextStudyItems) ? nextStudyItems : []).filter(
                    (item) => ["quiz", "flashcard"].includes(item.kind)
                ),
            }
        },
        initialData: () => readCommunityFeedSnapshot() ?? undefined,
        initialDataUpdatedAt: 0,
        staleTime: 60_000,
        retry: 1,
    })

    useEffect(() => {
        if (feedQuery.data) {
            writeCommunityFeedSnapshot(feedQuery.data)
        }
    }, [feedQuery.data])

    useEffect(() => {
        const data = feedQuery.data
        if (!data) return
        setPosts(data.posts)
        setCircles(data.circles)
        setCertifications(data.certifications)
        setStudyItems(data.studyItems)
    }, [feedQuery.dataUpdatedAt])

    useEffect(() => {
        if (feedQuery.isError) {
            toast.error(apiMessage(feedQuery.error, "The community could not be loaded."))
        }
    }, [feedQuery.isError, feedQuery.error])

    const isLoading = feedQuery.isLoading || (feedQuery.isFetching && posts.length === 0)

    const topicOptions = useMemo(() => {
        const titles = certifications
            .map((certification) => certification.title || certification.name)
            .filter(Boolean)
        return [...new Set(["General Study", ...titles])]
    }, [certifications])

    const authorAvatarUrls = useAvatarUrls(posts.map((post) => post.authorAvatarKey))

    const joinedCircles = useMemo(
        () => circles.filter((circle) => circle.joined || circle.owner),
        [circles]
    )

    const activeCircle = useMemo(
        () => circles.find((circle) => circle.circleId === activeCircleId) ?? null,
        [circles, activeCircleId]
    )

    const visiblePosts = useMemo(() => {
        const query = searchValue.trim().toLowerCase()

        const filtered = posts.filter((post) => {
            if (activeCircleId) return post.circleId === activeCircleId
            if (showSavedOnly && !post.saved) return false
            const matchesTab =
                showSavedOnly ||
                activeTab === "for-you" ||
                (activeTab === "circle"
                    ? post.circleId != null
                    : activeTab === "reviewer"
                        ? REVIEWER_TYPES.includes(post.postType)
                        : post.postType === activeTab)

            const matchesSearch =
                !query ||
                (post.title || "").toLowerCase().includes(query) ||
                (post.description || "").toLowerCase().includes(query) ||
                (post.authorName || "").toLowerCase().includes(query) ||
                (post.community || "").toLowerCase().includes(query)

            return matchesTab && matchesSearch
        })

        return filtered
    }, [activeCircleId, activeTab, posts, searchValue, showSavedOnly])

    function openComposer(type) {
        setShareType(type)
        setAttachedFile(null)
        setShareCommunity(activeCircleId ? String(activeCircleId) : OPEN_FEED)
        setSelectedStudyItemId("")
        setComposerOpen(true)
    }

    function selectFeedTab(value) {
        setShowSavedOnly(false)
        setActiveTab(value)
    }

    async function toggleUpvote(postId) {
        try {
            const counts = await toggleCommunityLike(postId)
            setPosts((current) => applyPostCounts(current, postId, counts, "liked"))
        } catch (error) {
            toast.error(apiMessage(error, "Could not update your upvote."))
        }
    }

    function openAttachment(post) {
        const attachment = post?.attachment
        if (!attachment?.key) return
        countView(post.postId)
        const params = new URLSearchParams()
        for (const file of attachment.files ?? [{ key: attachment.key, name: attachment.name }]) {
            params.append("key", file.key)
            params.append("name", file.name ?? "")
        }
        if (post.attachmentSize) params.set("size", String(post.attachmentSize))
        if (post.authorName) params.set("by", post.authorName)
        if (post.community) params.set("circle", post.community)
        if (post.ownedByMe) params.set("mine", "1")
        navigate(`/learner/community/reviewer/${post.postId}?${params.toString()}`)
    }

    function countView(postId) {
        recordCommunityPostView(postId)
            .then(({ views }) => {
                setPosts((current) =>
                    current.map((post) => (post.postId === postId ? { ...post, views } : post))
                )
            })
            .catch(() => {})
    }

    function promptUpgrade(message) {
        toast.info(message, {
            description: "Upgrade to REBYU Pro to take shared quizzes, exams and flashcards.",
            action: { label: "Upgrade", onClick: () => navigate("/learner/subscription") },
        })
    }

    async function startPractice(postId) {
        const ownPost = posts.some((post) => post.postId === postId && post.ownedByMe)
        if (plan.isFree && !ownPost) {
            promptUpgrade("Shared study sets are a Pro feature")
            return
        }
        countView(postId)
        try {
            const attempt = await startSharedCommunityPractice(postId)
            navigate(
                attempt.studyType === "FLASHCARD"
                    ? `/learner/flashcards/${attempt.studySetId}`
                    : `/learner/practice/${attempt.studySetId}`
            )
        } catch (error) {
            if (isPremiumError(error)) {
                promptUpgrade("Shared study sets are a Pro feature")
                return
            }
            toast.error(apiMessage(error, "This shared study item could not be opened."))
        }
    }

    async function submitReport() {
        if (!reportPostId) return
        try {
            await reportCommunityPost(reportPostId, reportReason, reportDetails)
            setReportPostId(null)
            setReportDetails("")
            toast.success("Post reported. Our team can review it.")
        } catch (error) {
            toast.error(apiMessage(error, "This post could not be reported."))
        }
    }

    async function toggleSave(postId) {
        try {
            const counts = await toggleCommunitySave(postId)
            setPosts((current) => applyPostCounts(current, postId, counts, "saved"))
        } catch (error) {
            toast.error(apiMessage(error, "Could not update saved posts."))
        }
    }

    async function toggleJoinCircle(circleId) {
        try {
            const result = await toggleCircleMembership(circleId)
            setCircles((current) =>
                current.map((circle) =>
                    circle.circleId === circleId
                        ? {
                            ...circle,
                            joined: result.joined,
                            members: circle.members + (result.joined ? 1 : -1),
                        }
                        : circle
                )
            )
        } catch (error) {
            toast.error(apiMessage(error, "Could not update circle membership."))
        }
    }

    async function handleAttachmentSelected(event) {
        const chosen = Array.from(event.target.files ?? [])
        if (chosen.length === 0) return
        const clearInput = () => {
            if (fileInputRef.current) fileInputRef.current.value = ""
        }

        const allImages = chosen.every((file) => reviewerAttachmentKind(file.name) === "IMAGE")
        if (chosen.length > 1 && !allImages) {
            toast.error("Choose several images, or a single PDF, Word or text file.")
            clearInput()
            return
        }
        const kept = allImages && reviewerAttachmentKind(attachedFile?.name) === "IMAGE"
            ? attachedFile.files ?? [{ name: attachedFile.name, key: attachedFile.key, size: attachedFile.size }]
            : []
        if (kept.length + chosen.length > MAX_REVIEWER_IMAGES) {
            toast.error(`Share up to ${MAX_REVIEWER_IMAGES} images in one post.`)
            clearInput()
            return
        }

        setIsUploadingAttachment(true)
        try {
            const uploaded = await Promise.all(
                chosen.map(async (file) => {
                    const { attachmentKey, attachmentSize } = await uploadCommunityAttachment(file)
                    return { name: file.name, key: attachmentKey, size: attachmentSize ?? file.size }
                })
            )
            const files = [...kept, ...uploaded]
            setAttachedFile({
                name: files[0].name,
                key: files[0].key,
                size: files.reduce((total, file) => total + (Number(file.size) || 0), 0),
                files,
            })
        } catch (error) {
            toast.error(apiMessage(error, "The file could not be uploaded."))
        } finally {
            setIsUploadingAttachment(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    async function publishPost() {
        if (isPublishing) return
        setIsPublishing(true)
        try {
            await publishPostRequest()
        } finally {
            setIsPublishing(false)
        }
    }

    async function publishPostRequest() {
        if (["quiz", "flashcard"].includes(shareType)) {
            if (!selectedStudyItemId) {
                toast.error("Choose a generated study item to share.")
                return
            }
            try {
                const nextPost = await shareCommunityStudyItem(Number(selectedStudyItemId), circleIdForPost(shareCommunity))
                setPosts((current) => [nextPost, ...current])
                setSelectedStudyItemId("")
                setComposerOpen(false)
                toast.success("Study item shared with the community.")
            } catch (error) {
                toast.error(apiMessage(error, "The study item could not be shared."))
            }
            return
        }
        if (!shareTitle.trim() || !shareDescription.trim()) {
            toast.error("Add a title and description.")
            return
        }
        if (shareType === "reviewer" && !attachedFile) {
            toast.error("Attach the PDF, Word, text or image file you want to share.")
            return
        }

        const attachmentKind = reviewerAttachmentKind(attachedFile?.name)
        const isWordFile = attachmentKind === "DOCX"
        const postType = shareType === "reviewer" ? (isWordFile ? "docx" : "notes") : shareType

        try {
            const nextPost = await createCommunityPost({
                title: shareTitle.trim(),
                description: shareDescription.trim(),
                postType,
                circleId: circleIdForPost(shareCommunity),
                attachmentName: attachedFile?.name ?? null,
                attachmentType: shareType === "reviewer" ? attachmentKind : null,
                attachmentKey: attachedFile?.key ?? null,
                attachmentSize: attachedFile?.size ?? null,
                attachments: attachedFile?.files?.length > 1 ? attachedFile.files : null,
            })

            setPosts((current) => [nextPost, ...current])
            setShareTitle("")
            setShareDescription("")
            setAttachedFile(null)
            setComposerOpen(false)
            toast.success(
                shareType === "discussion" ? "Discussion posted." : "Reviewer shared with the community."
            )
        } catch (error) {
            toast.error(apiMessage(error, "The post could not be published."))
        }
    }

    async function removePost(postId) {
        try {
            await deleteCommunityPost(postId)
            setPosts((current) => current.filter((post) => post.postId !== postId))
            toast.success("Post deleted.")
        } catch (error) {
            toast.error(apiMessage(error, "The post could not be deleted."))
        }
    }

    async function createStudyCircle() {
        if (!circleName.trim() || !circleDescription.trim()) {
            toast.error("Add a circle name and description.")
            return
        }
        if (isCreatingCircle) return
        setIsCreatingCircle(true)

        try {
            const newCircle = await createCommunityCircle({
                name: circleName.trim(),
                description: circleDescription.trim(),
                topic: circleTopic,
                visibility: circleVisibility,
            })

            setCircles((current) => [newCircle, ...current])
            setPosts(await getCommunityPosts())
            setCircleName("")
            setCircleDescription("")
            setCircleVisibility("PUBLIC")
            setCreateCircleOpen(false)
            selectFeedTab("for-you")

            toast.success(
                newCircle?.isPrivate
                    ? "Private study circle created. Only members can read what is posted in it."
                    : "Study circle created."
            )
        } catch (error) {
            toast.error(apiMessage(error, "The study circle could not be created."))
        } finally {
            setIsCreatingCircle(false)
        }
    }

    async function removeCircle(circleId) {
        try {
            await deleteCommunityCircle(circleId)
            setCircles((current) => current.filter((circle) => circle.circleId !== circleId))
            setPosts(await getCommunityPosts())
            setActiveCircleId(null)
            toast.success("Study circle deleted.")
        } catch (error) {
            toast.error(apiMessage(error, "The study circle could not be deleted."))
        }
    }

    async function toggleComments(postId) {
        if (openThreads.includes(postId)) {
            setOpenThreads((current) => current.filter((id) => id !== postId))
            return
        }
        setOpenThreads((current) => [...current, postId])
        if (commentsByPost[postId]) return
        try {
            const loaded = await getCommunityComments(postId)
            setCommentsByPost((current) => ({ ...current, [postId]: loaded }))
        } catch (error) {
            setOpenThreads((current) => current.filter((id) => id !== postId))
            toast.error(apiMessage(error, "Comments could not be loaded."))
        }
    }

    async function removeComment(postId, commentId) {
        const previous = commentsByPost[postId]
        if (!previous) return

        const removed = previous.filter(
            (comment) => comment.commentId === commentId || comment.parentCommentId === commentId
        ).length
        const remaining = previous.filter(
            (comment) => comment.commentId !== commentId && comment.parentCommentId !== commentId
        )

        setCommentsByPost((current) => ({ ...current, [postId]: remaining }))
        setPosts((current) =>
            current.map((post) =>
                post.postId === postId
                    ? { ...post, comments: Math.max(0, post.comments - removed) }
                    : post
            )
        )

        try {
            await deleteCommunityComment(postId, commentId)
        } catch (error) {
            setCommentsByPost((current) => ({ ...current, [postId]: previous }))
            setPosts((current) =>
                current.map((post) =>
                    post.postId === postId
                        ? { ...post, comments: post.comments + removed }
                        : post
                )
            )
            toast.error(apiMessage(error, "The comment could not be deleted."))
        }
    }

    function setDraft(postId, value) {
        setCommentDrafts((current) => ({ ...current, [postId]: value }))
    }

    async function submitComment(postId) {
        const body = (commentDrafts[postId] ?? "").trim()
        if (!body) return
        try {
            const comment = await addCommunityComment(postId, body)
            setCommentsByPost((current) => ({ ...current, [postId]: [...(current[postId] ?? []), comment] }))
            setPosts((current) =>
                current.map((post) => (post.postId === postId ? { ...post, comments: post.comments + 1 } : post))
            )
            setDraft(postId, "")
        } catch (error) {
            toast.error(apiMessage(error, "Your comment could not be posted."))
        }
    }

    const savedCount = posts.filter((post) => post.saved).length

    return (
        <div className="space-y-6">

            <div className="sticky top-16 z-20 -mx-4 border-b-2 border-border bg-background/95 px-4 pb-4 pt-3 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
                <div className="mx-auto flex w-full max-w-[1200px] items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {FEED_TABS.map((tab, index) => {
                                    const Icon = index === 0
                                    ? Home
                                    : tab.value === "circle"
                                        ? UsersRound
                                        : tab.value === "discussion"
                                            ? MessageCircle
                                            : tab.value === "quiz"
                                                ? BookOpen
                                                : FileText

                                return (
                                    <button
                                        key={tab.value}
                                        type="button"
                                        onClick={() => selectFeedTab(tab.value)}
                                        className={`flex shrink-0 items-center gap-2 rounded-full border-2 px-3.5 py-2 font-rb-display text-sm font-extrabold lowercase transition-colors ${
                                            !showSavedOnly && activeTab === tab.value
                                                ? "border-primary bg-primary text-primary-foreground"
                                                : "border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                        }`}
                                    >
                                        <Icon className="size-4" />
                                        {tab.label}
                                    </button>
                                )
                            })}
                        <button
                            type="button"
                            className={`flex shrink-0 items-center gap-2 rounded-full border-2 px-3.5 py-2 font-rb-display text-sm font-extrabold lowercase transition-colors ${
                                showSavedOnly
                                    ? "border-rb-macaw bg-rb-macaw-wash text-rb-macaw-lip"
                                    : "border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            }`}
                            onClick={() => {
                                setShowSavedOnly((current) => !current)
                            }}
                        >
                            <Bookmark className={`size-4 ${showSavedOnly ? "fill-current" : ""}`} />
                            Saved ({savedCount})
                        </button>
                        <Button
                            type="button"
                            size="sm"
                            className="ml-auto shrink-0 rounded-full"
                            onClick={() => setCreateCircleOpen(true)}
                        >
                            <UsersRound className="mr-2 size-4" />
                            Create a circle
                        </Button>
                </div>
            </div>

            <div className="mx-auto grid w-full max-w-[1400px] items-start gap-6 lg:grid-cols-[232px_minmax(0,1fr)] xl:grid-cols-[232px_minmax(0,1fr)_300px]">

                <aside className="sticky top-24 hidden lg:block">
                    <nav className="space-y-1">
                        <p className="px-3 pb-1 font-rb-display text-xs font-extrabold lowercase text-muted-foreground">
                            feed
                        </p>

                        {FEED_TABS.map((tab, index) => {
                            const Icon = index === 0
                                ? Home
                                : tab.value === "circle"
                                    ? UsersRound
                                    : tab.value === "discussion"
                                        ? MessageCircle
                                        : tab.value === "quiz"
                                            ? BookOpen
                                            : FileText
                            const active = !showSavedOnly && activeTab === tab.value

                            return (
                                <button
                                    key={tab.value}
                                    type="button"
                                    onClick={() => selectFeedTab(tab.value)}
                                    className={`flex w-full items-center gap-3 rounded-rb-tile px-3 py-2 text-left text-sm font-bold transition-colors ${
                                        active
                                            ? "bg-rb-macaw-wash text-rb-macaw-lip"
                                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    }`}
                                >
                                    <Icon className="size-4 shrink-0" />
                                    <span className="min-w-0 truncate">{tab.label}</span>
                                </button>
                            )
                        })}

                        <button
                            type="button"
                            onClick={() => setShowSavedOnly((current) => !current)}
                            className={`flex w-full items-center gap-3 rounded-rb-tile px-3 py-2 text-left text-sm font-bold transition-colors ${
                                showSavedOnly
                                    ? "bg-rb-macaw-wash text-rb-macaw-lip"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            }`}
                        >
                            <Bookmark className={`size-4 shrink-0 ${showSavedOnly ? "fill-current" : ""}`} />
                            <span className="min-w-0 flex-1 truncate">Saved</span>
                            {savedCount > 0 ? (
                                <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-extrabold text-muted-foreground">
                                    {savedCount}
                                </span>
                            ) : null}
                        </button>
                    </nav>

                    <div className="mt-5 border-t-2 border-border pt-4">
                        <div className="flex items-center justify-between gap-2 px-3 pb-1">
                            <p className="font-rb-display text-xs font-extrabold lowercase text-muted-foreground">
                                study circles
                            </p>

                            <button
                                type="button"
                                onClick={() => setCreateCircleOpen(true)}
                                aria-label="Create study circle"
                                className="grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                                <Plus className="size-4" />
                            </button>
                        </div>

                        <div className="space-y-0.5">
                            {circles.map((circle) => (
                                <div
                                    key={circle.circleId}
                                    className={`group flex items-center gap-3 rounded-rb-tile px-3 py-2 transition-colors hover:bg-accent ${
                                        circle.circleId === activeCircleId ? "bg-rb-bee-wash" : ""
                                    }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setActiveCircleId(circle.circleId)}
                                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                    >
                                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-rb-bee-wash font-rb-display text-[0.625rem] font-extrabold lowercase text-rb-bee-lip">
                                            {circle.initials}
                                        </span>

                                        <div className="min-w-0 flex-1">
                                            <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                                                <span className="truncate">{circle.name}</span>
                                                {circle.isPrivate ? (
                                                    <Lock
                                                        className="size-3 shrink-0 text-muted-foreground"
                                                        aria-label="Private circle"
                                                    />
                                                ) : null}
                                            </p>
                                            <p className="truncate text-[11px] font-semibold text-muted-foreground">
                                                {circle.members?.toLocaleString?.() ?? 0} members
                                                {circle.isPrivate ? " · private" : ""}
                                            </p>
                                        </div>
                                    </button>

                                    {circle.owner ? (
                                        <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground">
                                            owner
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => toggleJoinCircle(circle.circleId)}
                                            className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide transition-colors ${
                                                circle.joined
                                                    ? "text-muted-foreground hover:text-foreground"
                                                    : "bg-rb-macaw-wash text-rb-macaw-lip hover:bg-rb-macaw hover:text-white"
                                            }`}
                                        >
                                            {circle.joined ? "joined" : "join"}
                                        </button>
                                    )}
                                </div>
                            ))}

                            {circles.length === 0 ? (
                                <p className="px-3 py-2 text-xs text-muted-foreground">
                                    No study circles yet. Create the first one.
                                </p>
                            ) : null}
                        </div>
                    </div>
                </aside>

                <main className="min-w-0 space-y-4">
                    {activeCircle ? (
                        <CircleHeader
                            circle={activeCircle}
                            onToggleJoin={toggleJoinCircle}
                            onDelete={() => setConfirmDeleteCircleId(activeCircle.circleId)}
                            onBack={() => setActiveCircleId(null)}
                        />
                    ) : null}

                    {composerOpen ? null : (
                    <PanelCard className="p-4">
                        <button type="button" className="flex w-full items-center gap-3" onClick={() => openComposer("discussion")}>
                            <CommunityAvatar initials="GG" />
                            <div className="flex h-11 min-w-0 flex-1 items-center rounded-full border-2 border-border bg-muted/40 px-4 text-left text-sm font-semibold text-muted-foreground transition-colors hover:border-rb-macaw/60 hover:bg-muted">
                                Start a discussion or share a review resource...
                            </div>
                        </button>
                        <div className="mt-3 flex items-center gap-2 border-t-2 border-border pt-3">
                            <div className="flex min-w-0 flex-wrap items-center gap-0.5">
                                <Button type="button" variant="ghost" size="sm"  onClick={() => openComposer("discussion")} title="Start a discussion"><MessageCircle className="size-4 text-rb-macaw-lip sm:mr-2" /><span className="hidden sm:inline">Discussion</span></Button>
                                <Button type="button" variant="ghost" size="sm"  onClick={() => openComposer("quiz")} title="Share a quiz"><BookOpen className="size-4 text-rb-feather-lip sm:mr-2" /><span className="hidden sm:inline">Quiz</span></Button>
                                <Button type="button" variant="ghost" size="sm"  onClick={() => openComposer("flashcard")} title="Share flashcards"><Sparkles className="size-4 text-rb-beetle-lip sm:mr-2" /><span className="hidden sm:inline">Flashcards</span></Button>
                                <Button type="button" variant="ghost" size="sm"  onClick={() => openComposer("reviewer")} title="Share a PDF, Word, text or image reviewer"><FileText className="size-4 text-rb-cardinal-lip sm:mr-2" /><span className="hidden sm:inline">Reviewer</span></Button>
                            </div>

                        </div>
                    </PanelCard>
                    )}

                    {composerOpen ? (
                        <section className="rounded-rb-card border-2 border-rb-macaw bg-card p-4 sm:p-5">
                            <div className="flex items-center justify-between gap-3 border-b-2 border-border pb-4">
                                <div>
                                    <h2 className="font-rb-display text-sm font-extrabold lowercase">Create a post</h2>
                                    <p className="mt-0.5 text-xs text-muted-foreground">Ask a question, or share a generated quiz, flashcard set, or PDF/Word reviewer.</p>
                                </div>
                                <Button type="button" variant="ghost" size="icon-sm" onClick={() => { setComposerOpen(false); setAttachedFile(null) }} aria-label="Close post editor"><X /></Button>
                            </div>

                            <div className="mt-4 flex gap-1 overflow-x-auto pb-1">
                                {[
                                    { value: "discussion", label: "Discussion", icon: MessageCircle },
                                    { value: "quiz", label: "Quiz", icon: BookOpen },
                                    { value: "flashcard", label: "Flashcards", icon: Sparkles },
                                    { value: "reviewer", label: "Reviewer", icon: FileText },
                                ].map((type) => {
                                    const Icon = type.icon
                                    return <Button key={type.value} type="button" variant={shareType === type.value ? "secondary" : "ghost"} size="sm" className="shrink-0" onClick={() => { setShareType(type.value); setAttachedFile(null) }}><Icon className="mr-1.5 size-4" />{type.label}</Button>
                                })}
                            </div>

                            <div className="mt-4 grid gap-3">
                                {joinedCircles.length > 0 ? (
                                    <Select value={shareCommunity} onValueChange={setShareCommunity}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={OPEN_FEED}>Community — everyone</SelectItem>
                                            {joinedCircles.map((circle) => (
                                                <SelectItem key={circle.circleId} value={String(circle.circleId)}>
                                                    {circle.name}
                                                    {circle.isPrivate ? " (private)" : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : null}
                                {["quiz", "flashcard"].includes(shareType) ? (
                                    <Select value={selectedStudyItemId} onValueChange={setSelectedStudyItemId}>
                                        <SelectTrigger><SelectValue placeholder={`Choose generated ${shareType === "quiz" ? "quiz" : "flashcards"}`} /></SelectTrigger>
                                        <SelectContent>{studyItems.filter((item) => item.kind === shareType).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.title}</SelectItem>)}</SelectContent>
                                    </Select>
                                ) : <><Input value={shareTitle} onChange={(event) => setShareTitle(event.target.value)} placeholder="An interesting title" /><Textarea value={shareDescription} onChange={(event) => setShareDescription(event.target.value)} placeholder="What do you want to discuss?" className="min-h-32 resize-y" /></>}

                                {shareType === "reviewer" ? (
                                    <div>
                                        <input ref={fileInputRef} type="file" accept={REVIEWER_ACCEPT} multiple className="hidden" onChange={handleAttachmentSelected} />
                                        <button type="button" disabled={isUploadingAttachment} onClick={() => fileInputRef.current?.click()} className="flex w-full items-center gap-3 rounded-rb-tile border-2 border-dashed border-border px-4 py-3 text-left hover:border-rb-macaw disabled:opacity-60">
                                            {isUploadingAttachment ? <Loader2 className="size-5 animate-spin text-muted-foreground" /> : <FileText className="size-5 text-primary" />}
                                            <span className="min-w-0 flex-1 truncate text-sm">
                                                {attachedFile?.files?.length > 1
                                                    ? `${attachedFile.files.length} images — add more, up to ${MAX_REVIEWER_IMAGES}`
                                                    : attachedFile?.name ?? "Add a PDF, Word or text file, or several images"}
                                            </span>
                                            {attachedFile ? <span className="shrink-0 text-xs font-medium text-primary">{formatBytes(attachedFile.size) ?? "Change"}</span> : null}
                                        </button>
                                    </div>
                                ) : null}
                            </div>

                            <div className="mt-4 flex justify-end gap-2 border-t-2 border-border pt-4">
                                <Button type="button" variant="ghost"  onClick={() => { setComposerOpen(false); setAttachedFile(null) }}>Cancel</Button>
                                <Button type="button"  onClick={publishPost} disabled={isPublishing || isUploadingAttachment || (["quiz", "flashcard"].includes(shareType) ? !selectedStudyItemId : !shareTitle.trim() || !shareDescription.trim() || (shareType === "reviewer" && !attachedFile))}><Send className="mr-2 size-4" />Post</Button>
                            </div>
                        </section>
                    ) : null}

                    <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-border pb-3">
                        <h2 className="font-rb-display text-sm font-extrabold lowercase">
                            {activeCircle
                                ? `posts in ${activeCircle.name}`
                                : showSavedOnly
                                    ? "Saved posts"
                                    : activeTab === "for-you"
                                        ? "Community news feed"
                                        : FEED_TABS.find((tab) => tab.value === activeTab)?.label ?? "Community news feed"}
                        </h2>

                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={searchValue}
                                    onChange={(event) => setSearchValue(event.target.value)}
                                    placeholder="Search posts, authors, circles..."
                                    aria-label="Search community posts"
                                    className="h-9 w-full rounded-full pl-9 sm:w-64"
                                />
                            </div>

                            {showSavedOnly ? (
                                <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={() => setShowSavedOnly(false)}>
                                    <X className="mr-2 h-4 w-4" />
                                    Back to feed
                                </Button>
                            ) : null}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center rounded-rb-card border-2 border-dashed border-border py-16 text-center">
                            <span className="grid size-12 place-items-center rounded-2xl bg-rb-macaw-wash text-rb-macaw-lip">
                                <Loader2 className="size-6 animate-spin" aria-hidden="true" />
                            </span>
                            <p className="mt-3 font-rb-display text-sm font-extrabold lowercase">
                                loading the feed
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Fetching posts, circles and your study items.
                            </p>
                        </div>
                    ) : visiblePosts.length > 0 ? (
                        <div className="space-y-3">
                            {visiblePosts.map((post) => (
                                <CommunityPost
                                    key={post.postId}
                                    post={post}
                                    authorAvatarUrl={authorAvatarUrls[post.authorAvatarKey]}
                                    circles={circles}
                                    onToggleUpvote={toggleUpvote}
                                    onToggleSave={toggleSave}
                                    onJoinCircle={toggleJoinCircle}
                                    onToggleComments={toggleComments}
                                    onDelete={removePost}
                                    onStartPractice={startPractice}
                                    onReport={setReportPostId}
                                    onOpenAttachment={openAttachment}
                                    onOpenCircle={setActiveCircleId}
                                    threadOpen={openThreads.includes(post.postId)}
                                    threadComments={commentsByPost[post.postId]}
                                    draft={commentDrafts[post.postId]}
                                    onDraftChange={setDraft}
                                    onSubmitComment={submitComment}
                                    onDeleteComment={removeComment}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-rb-card border-2 border-dashed border-border py-16 text-center">
                            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-rb-macaw-wash text-rb-macaw-lip">
                                <MessageCircle className="size-6" />
                            </span>
                            <p className="mt-3 font-rb-display text-sm font-extrabold lowercase">
                                {showSavedOnly ? "No saved posts yet" : "No community posts found"}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {showSavedOnly
                                    ? "Save a post from the feed to find it here later."
                                    : "Try changing the feed tab or search."}
                            </p>
                        </div>
                    )}
                </main>

                <aside className="sticky top-24 hidden space-y-4 xl:block">

                    <PanelCard className="border-rb-fox/40 bg-rb-fox-wash p-4">
                        <PanelHeading icon={Sparkles} tone="bg-rb-snow text-rb-fox-lip" title="Community reminder" />

                        <p className="mt-2 text-xs leading-5 text-rb-wolf">
                            Be respectful during discussions. Do not share active exam
                            answers, copied reviewer courses, or files you are not allowed to
                            distribute.
                        </p>
                    </PanelCard>
                </aside>
            </div>

            <Dialog open={createCircleOpen} onOpenChange={setCreateCircleOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Create study circle</DialogTitle>
                        <DialogDescription>
                            Create a focused study group. It will be listed for other learners to
                            find and join.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="circle-name">Circle name</Label>
                            <Input
                                id="circle-name"
                                value={circleName}
                                onChange={(event) => setCircleName(event.target.value)}
                                placeholder="Example: IT Passport Security Review"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="circle-topic">Certification or topic</Label>

                            <Select value={circleTopic} onValueChange={setCircleTopic}>
                                <SelectTrigger id="circle-topic">
                                    <SelectValue />
                                </SelectTrigger>

                                <SelectContent>
                                    {topicOptions.map((topic) => (
                                        <SelectItem key={topic} value={topic}>
                                            {topic}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="circle-description">Description</Label>
                            <Textarea
                                id="circle-description"
                                value={circleDescription}
                                onChange={(event) => setCircleDescription(event.target.value)}
                                placeholder="Explain what learners will study and discuss in this circle..."
                                className="min-h-28"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="circle-visibility">Who can read what is posted here</Label>

                            <Select value={circleVisibility} onValueChange={setCircleVisibility}>
                                <SelectTrigger id="circle-visibility">
                                    <SelectValue />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="PUBLIC">Public — anyone on the feed</SelectItem>
                                    <SelectItem value="PRIVATE">Private — members only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs leading-5 text-muted-foreground">
                            {circleVisibility === "PRIVATE"
                                ? "The circle stays listed so learners can find and join it, but posts inside it are hidden from the news feed and readable only by members."
                                : "The circle is listed for anyone to join, and posts inside it appear on the community news feed."}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setCreateCircleOpen(false)}>
                            Cancel
                        </Button>

                        <Button type="button" onClick={createStudyCircle} disabled={isCreatingCircle}>
                            {isCreatingCircle ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <UsersRound className="mr-2 h-4 w-4" />
                            )}
                            {isCreatingCircle ? "Creating..." : "Create study circle"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={confirmDeleteCircleId != null} onOpenChange={(open) => { if (!open) setConfirmDeleteCircleId(null) }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete this study circle?</DialogTitle>
                        <DialogDescription>
                            The circle, its members, and every post written in it are removed. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setConfirmDeleteCircleId(null)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => {
                                const id = confirmDeleteCircleId
                                setConfirmDeleteCircleId(null)
                                removeCircle(id)
                            }}
                        >
                            Delete circle
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={reportPostId != null} onOpenChange={(open) => { if (!open) setReportPostId(null) }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Report post</DialogTitle><DialogDescription>Tell us why this post should be reviewed.</DialogDescription></DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2"><Label>Reason</Label><Select value={reportReason} onValueChange={setReportReason}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SPAM">Spam or misleading</SelectItem><SelectItem value="HARASSMENT">Harassment</SelectItem><SelectItem value="COPYRIGHT">Copyright concern</SelectItem><SelectItem value="EXAM_CONTENT">Active exam content</SelectItem><SelectItem value="OTHER">Other</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label htmlFor="report-details">Details (optional)</Label><Textarea id="report-details" value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} placeholder="Add context that helps an admin review it." /></div>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setReportPostId(null)}>Cancel</Button><Button variant="destructive" onClick={submitReport}>Submit report</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
