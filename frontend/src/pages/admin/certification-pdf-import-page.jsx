import { useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"

import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Copy,
    Eye,
    KeyRound,
    Loader2,
    Plus,
    Save,
    Search,
    Sparkles,
    Trash2,
    UploadIcon,
    X,
} from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { PdfUploadStep } from "@/components/question-bank/pdf-upload-step.jsx"
import { getAllCertifications } from "@/services/certificationService.js"
import { uploadQuestionImage } from "@/services/fileService.js"
import { findDuplicates, readDocumentLayout, readDocumentPage, tagQuestions } from "@/services/pdfImportService.js"
import { saveChoices, saveQuestion, saveTextQuestion } from "@/services/questionService.js"
import {
    canvasToFile,
    citationFor,
    describeExam,
    matchScore,
    readExamPdf,
    stackCanvases,
} from "@/utils/pdf-question-extractor.js"

const KEYS = ["a", "b", "c", "d"]
const DIFFICULTIES = ["easy", "average", "hard"]
const isPdf = (file) => /pdf$/i.test(file.type) || /\.pdf$/i.test(file.name)

/**
 * What an imported question can be saved as. An exam question arrives as
 * multiple choice; as short answer or descriptive, the correct option's text
 * becomes the expected answer. Programming and diagram questions need test
 * cases or a reference diagram a past paper does not contain, so they are
 * listed but cannot be picked.
 */
const QUESTION_TYPES = [
    { id: "MCQ", label: "Multiple choice" },
    { id: "SHORT_ANSWER", label: "Short answer" },
    { id: "DESCRIPTIVE", label: "Descriptive" },
    { id: "PROGRAMMING", label: "Programming", disabled: "needs test cases" },
    { id: "DIAGRAM", label: "Diagram", disabled: "needs a reference diagram" },
]

/**
 * Canvases become data URLs once, when a paper is read, not on every render
 * -- and once per canvas: the questions of one page, or the blanks of one
 * passage, share the same page images.
 */
const imageUrls = new WeakMap()
function srcOf(canvas) {
    if (!imageUrls.has(canvas)) {
        imageUrls.set(canvas, canvas.height > 2500 ? canvas.toDataURL("image/jpeg", 0.85) : canvas.toDataURL("image/png"))
    }
    return imageUrls.get(canvas)
}

/**
 * A read question as the page keeps it: every image as a compressed data URL,
 * and no canvases. A canvas holds its page area uncompressed -- a hundred
 * papers of them ran to gigabytes and took the tab down -- so the canvases
 * are dropped here and rebuilt from the data URL only when a question is
 * saved.
 */
function forDisplay(question) {
    const { figures, snaps, ...rest } = question
    return {
        ...rest,
        figureSrcs: figures.map(srcOf),
        // "Show original" is only ever looked at: JPEG keeps it small.
        snapSrcs: snaps.map((canvas) => canvas.toDataURL("image/jpeg", 0.8)),
        options: question.options.map(({ image, ...option }) => ({
            ...option,
            imageSrc: image ? srcOf(image) : null,
        })),
    }
}

/** A data URL drawn back onto a canvas, for stacking and saving. */
function srcToCanvas(src) {
    return new Promise((resolve, reject) => {
        const image = new Image()
        image.onload = () => {
            const canvas = document.createElement("canvas")
            canvas.width = image.naturalWidth
            canvas.height = image.naturalHeight
            canvas.getContext("2d").drawImage(image, 0, 0)
            resolve(canvas)
        }
        image.onerror = () => reject(new Error("An image could not be prepared for saving."))
        image.src = src
    })
}

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"]

/** A picked image file drawn onto a canvas -- the form every crop takes here. */
function fileToCanvas(file) {
    return new Promise((resolve, reject) => {
        if (!IMAGE_TYPES.includes(file.type)) {
            reject(new Error("Choose a PNG, JPEG, WebP or GIF image."))
            return
        }
        const url = URL.createObjectURL(file)
        const image = new Image()
        image.onload = () => {
            const canvas = document.createElement("canvas")
            canvas.width = image.naturalWidth
            canvas.height = image.naturalHeight
            const context = canvas.getContext("2d")
            context.fillStyle = "#fff"
            context.fillRect(0, 0, canvas.width, canvas.height)
            context.drawImage(image, 0, 0)
            URL.revokeObjectURL(url)
            resolve(canvas)
        }
        image.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error("That image could not be opened."))
        }
        image.src = url
    })
}

/**
 * Asks for one image file and resolves to it as a canvas, or to null when the
 * picker is closed without one.
 */
function pickImage() {
    return new Promise((resolve, reject) => {
        const input = document.createElement("input")
        input.type = "file"
        input.accept = IMAGE_TYPES.join(",")
        input.onchange = () => {
            const file = input.files?.[0]
            if (!file) resolve(null)
            else fileToCanvas(file).then(resolve, reject)
        }
        input.click()
    })
}

/** A pasted key: "1 c, 2 d, 3 a", or one letter per question in order. */
function parseKeyText(text, questions) {
    const key = {}
    const re = /(\d{1,3})\s*[.):=-]?\s*\(?([a-dA-D])\b/g
    let match
    while ((match = re.exec(text))) key[Number(match[1])] = match[2].toLowerCase()
    if (!Object.keys(key).length) {
        const letters = (text.match(/[a-dA-D]/g) || []).map((c) => c.toLowerCase())
        questions.forEach((question, index) => {
            if (letters[index]) key[question.num] = letters[index]
        })
    }
    return key
}

/**
 * A question's text with case, spacing and punctuation taken away -- what two
 * copies of one question have in common. The server compares the same way
 * against the question bank.
 */
function fingerprint(text) {
    return (text || "").toLowerCase().replace(/[^0-9a-z]+/g, "")
}

/** The questions of a paper that have no correct answer yet. */
function unanswered(paper) {
    return paper.questions.filter((question) => !paper.answers[question.num])
}

/** "Q5, Q12, Q31" -- the first few, then how many more. */
function listNumbers(questions, limit = 12) {
    const shown = questions.slice(0, limit).map((q) => `Q${q.num}`).join(", ")
    return questions.length > limit ? `${shown} and ${questions.length - limit} more` : shown
}

/** Why the tagging dropped a question, or null when it did not. */
function dropReason(tag) {
    if (!tag) return null
    if (tag.noLesson) return "no lesson in this certification fits it"
    if (tag.duplicate === "bank") return "it is already in the question bank"
    if (tag.duplicate === "paper") return "it repeats an earlier question in the same paper"
    if (tag.duplicate === "upload") return `it repeats ${tag.duplicateOf ?? "a question in another uploaded paper"}`
    return null
}

/** Why a question cannot be saved as configured, or null when it can. */
function problemWith(question, paper) {
    const tag = paper.tags[question.num]
    const type = paper.types[question.num] ?? "MCQ"
    const answer = paper.answers[question.num]
    if (dropReason(tag)) return `dropped: ${dropReason(tag)}`
    if (!tag?.lessonId) return "no lesson"
    if (!tag?.difficulty) return "no difficulty"
    if (!answer) return "no correct answer"
    if (question.options.length < 2) return "choices were not read"
    if (type === "MCQ" && question.options.some((option) => !option.text && !option.imageSrc)) {
        return "a choice is empty"
    }
    if (type !== "MCQ") {
        const correct = question.options.find((option) => option.key === answer)
        if (!correct?.text) return "the correct choice is a picture, so it has no text answer"
    }
    return null
}

function questionText(question, paper) {
    const pictures = question.options.some((option) => option.imageSrc)
    const tables = question.options.some((option) => option.fromTable)
    const citation = citationFor(paper.info, question.num)
    const adapted = [
        pictures && "answer options supplied as images rendered from the original paper",
        question.figureSrcs.length && "figures and tables supplied as an image rendered from the original paper",
        tables && "columns of the original answer table joined with '|'",
    ].filter(Boolean)
    const source = citation
        ? `\n\nSource: ${citation}${adapted.length ? ` -- adapted: ${adapted.join("; ")}.` : ""}`
        : ""
    return `${question.stem}${source}`
}

async function saveOne(question, paper, certificationId) {
    const tag = paper.tags[question.num]
    const type = paper.types[question.num] ?? "MCQ"
    const answer = paper.answers[question.num]

    let imageKey = null
    if (question.figureSrcs.length) {
        const canvases = await Promise.all(question.figureSrcs.map(srcToCanvas))
        const file = await canvasToFile(stackCanvases(canvases), `q${question.num}.png`)
        imageKey = await uploadQuestionImage(file)
    }
    const saved = await saveQuestion({
        questionType: type,
        difficultyLevel: tag.difficulty,
        questionText: questionText(question, paper),
        imageKey,
        lessonId: Number(tag.lessonId),
        certificationId: Number(certificationId),
    })

    if (type === "MCQ") {
        for (const option of question.options) {
            let choiceImageKey = null
            if (option.imageSrc) {
                const file = await canvasToFile(await srcToCanvas(option.imageSrc), `q${question.num}${option.key}.png`)
                choiceImageKey = await uploadQuestionImage(file)
            }
            await saveChoices({
                questionId: saved.questionId,
                choiceText: option.imageSrc ? "" : option.text,
                imageKey: choiceImageKey,
                correct: option.key === answer,
                explanation: "",
            })
        }
    } else {
        const correct = question.options.find((option) => option.key === answer)
        await saveTextQuestion({
            questionId: saved.questionId,
            correctAnswer: correct.text,
            checkingMethod: type === "SHORT_ANSWER" ? "EXACT_MATCH" : "AI_SEMANTIC",
            ...(type === "SHORT_ANSWER" ? { acceptedVariations: null } : {}),
        })
    }
}

function asText(paper) {
    return paper.questions
        .map((question) => {
            const answer = paper.answers[question.num]
            return (
                `Q${question.num}. ${question.stem}${question.figureSrcs.length ? "\n[figure]" : ""}\n` +
                question.options.map((o) => `  ${o.key}) ${o.text || "[see figure]"}`).join("\n") +
                (answer ? `\n  Answer: ${answer}` : "")
            )
        })
        .join("\n\n")
}

/**
 * What the question is saved as. Chosen before or after tagging; programming
 * and diagram are not offered -- a past paper has no test cases or reference
 * diagram to give them.
 */
const SAVE_TYPES = QUESTION_TYPES.filter((item) => !item.disabled)

function TypeToggle({ value, onChange }) {
    return (
        <div className="inline-flex items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground">Save as</span>
        <div className="inline-flex overflow-hidden rounded-full border text-xs" role="group" aria-label="Save as">
            {SAVE_TYPES.map((item) => (
                <button
                    key={item.id}
                    type="button"
                    aria-pressed={value === item.id}
                    onClick={() => onChange(item.id)}
                    className={cn("px-2.5 py-1", value === item.id ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                >
                    {item.label}
                </button>
            ))}
        </div>
        </div>
    )
}

/** Small image controls that sit on a figure or a pictured choice. */
function ImageTools({ onReplace, onRemove, label }) {
    return (
        <span className="flex gap-1.5">
            <Button type="button" size="xs" variant="outline" onClick={onReplace} aria-label={`Replace ${label}`}>
                <UploadIcon className="h-3 w-3" /> Replace
            </Button>
            <Button type="button" size="xs" variant="outline" onClick={onRemove} aria-label={`Remove ${label}`} className="text-destructive">
                <Trash2 className="h-3 w-3" /> Remove
            </Button>
        </span>
    )
}

function QuestionCard({ question, paper, lessons, duplicate, onPick, onTag, onType, onInclude, onFigures, onOptionImage, onImageError, onDelete, cardRef }) {
    const [showOriginal, setShowOriginal] = useState(false)
    const answer = paper.answers[question.num]
    const tag = paper.tags[question.num]
    const type = paper.types[question.num] ?? "MCQ"
    const included = paper.include[question.num] !== false
    const saved = paper.saved[question.num]
    const problem = problemWith(question, paper)
    const tagged = Boolean(tag)
    const pictures = question.options.some((option) => option.imageSrc)

    return (
        <article
            ref={cardRef}
            className={cn(
                "rounded-2xl border bg-background p-5 shadow-sm",
                !included && "opacity-60",
            )}
        >
            <div className="mb-2 flex flex-wrap items-baseline gap-3">
                <span className="text-2xl font-bold text-primary">Q{question.num}</span>
                <span className="text-xs text-muted-foreground">
                    page {question.pages.join("–")}
                    {question.figureSrcs.length ? `, ${question.figureSrcs.length} figure${question.figureSrcs.length > 1 ? "s" : ""}` : ""}
                </span>
                {saved ? (
                    <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Saved
                    </Badge>
                ) : null}
                <TypeToggle value={type} onChange={(value) => onType(question.num, value)} />
                <span className="flex-1" />
                <button
                    type="button"
                    className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    aria-expanded={showOriginal}
                    onClick={() => setShowOriginal((open) => !open)}
                >
                    {showOriginal ? "Hide original" : "Show original"}
                </button>
                <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="text-destructive"
                    aria-label={`Delete question ${question.num}`}
                    title="Delete this question from the import"
                    onClick={() => onDelete(question.num)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            {duplicate ? (
                <p className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span className="flex-1">Duplicate: {duplicate}.</span>
                    <Button type="button" size="xs" variant="outline" onClick={() => onDelete(question.num)}>
                        <Trash2 className="h-3 w-3" /> Delete
                    </Button>
                </p>
            ) : null}

            <p className="mb-3 max-w-[72ch] whitespace-pre-line font-serif text-[1.05rem] leading-relaxed">
                {question.stem}
            </p>

            {question.figureSrcs.map((src, index) => (
                <figure key={`${index}-${src.length}`} className="group relative my-3 overflow-x-auto rounded-lg border bg-white p-2">
                    <img src={src} alt={`Figure ${index + 1} for question ${question.num}`} className="mx-auto block h-auto max-w-full" />
                    <div className="absolute right-2 top-2">
                        <ImageTools
                            label={`figure ${index + 1}`}
                            onReplace={() =>
                                pickImage()
                                    .then((canvas) => {
                                        if (!canvas) return
                                        onFigures(question.num, question.figureSrcs.map((f, i) => (i === index ? srcOf(canvas) : f)))
                                    })
                                    .catch(onImageError)
                            }
                            onRemove={() => onFigures(question.num, question.figureSrcs.filter((_, i) => i !== index))}
                        />
                    </div>
                </figure>
            ))}
            <div className="mb-2">
                <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() =>
                        pickImage()
                            .then((canvas) => canvas && onFigures(question.num, [...question.figureSrcs, srcOf(canvas)]))
                            .catch(onImageError)
                    }
                >
                    <Plus className="h-3 w-3" /> Add image
                </Button>
            </div>

            <ul className={cn("mt-3 gap-2", pictures ? "grid grid-cols-1 sm:grid-cols-2" : "grid")}>
                {question.options.map((option) => {
                    const correct = answer === option.key
                    return (
                        <li key={option.key}>
                            <button
                                type="button"
                                onClick={() => onPick(question.num, option.key)}
                                aria-pressed={correct}
                                className={cn(
                                    "flex w-full items-start gap-3 rounded-xl border-2 border-transparent px-2 py-1.5 text-left font-serif transition hover:border-border",
                                    correct && "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40",
                                )}
                            >
                                <span
                                    className={cn(
                                        "grid size-7 shrink-0 place-items-center rounded-full border-2 text-xs font-bold",
                                        correct ? "border-emerald-600 text-emerald-700" : "border-primary/60 text-primary",
                                    )}
                                >
                                    {option.key}
                                </span>
                                {option.imageSrc ? (
                                    <img src={option.imageSrc} alt={`Choice ${option.key}`} className="max-h-40 w-auto rounded bg-white" />
                                ) : (
                                    <span className="pt-0.5">{option.text || <em className="text-muted-foreground">empty</em>}</span>
                                )}
                            </button>
                            {/* Outside the choice button: a control inside it would
                                also mark the answer. */}
                            {option.imageSrc ? (
                                <div className="ml-12 mt-1">
                                    <ImageTools
                                        label={`choice ${option.key} image`}
                                        onReplace={() =>
                                            pickImage()
                                                .then((canvas) => canvas && onOptionImage(question.num, option.key, canvas))
                                                .catch(onImageError)
                                        }
                                        onRemove={() => onOptionImage(question.num, option.key, null)}
                                    />
                                </div>
                            ) : !option.text ? (
                                <div className="ml-12 mt-1">
                                    <Button
                                        type="button"
                                        size="xs"
                                        variant="outline"
                                        onClick={() =>
                                            pickImage()
                                                .then((canvas) => canvas && onOptionImage(question.num, option.key, canvas))
                                                .catch(onImageError)
                                        }
                                    >
                                        <Plus className="h-3 w-3" /> Add image
                                    </Button>
                                </div>
                            ) : null}
                        </li>
                    )
                })}
            </ul>
            {!question.options.length ? (
                <p className="mt-2 text-sm text-amber-700">The choices could not be read. Check the original.</p>
            ) : null}

            {showOriginal ? (
                <div className="mt-4 border-t border-dashed pt-3">
                    {question.snapSrcs.map((src, index) => (
                        <figure key={index} className="my-2 overflow-x-auto rounded-lg border bg-white p-2">
                            <img src={src} alt={`Question ${question.num} as printed`} className="mx-auto block h-auto max-w-full" />
                        </figure>
                    ))}
                </div>
            ) : null}

            {tagged ? (
                <div className="mt-4 grid gap-3 rounded-xl border bg-muted/30 p-3 sm:grid-cols-[auto_1fr_10rem] sm:items-end">
                    <label className="flex items-center gap-2 text-sm font-medium sm:pb-2">
                        <Checkbox
                            checked={included && !dropReason(tag)}
                            disabled={Boolean(dropReason(tag))}
                            onCheckedChange={(value) => onInclude(question.num, Boolean(value))}
                        />
                        Save
                    </label>
                    <div className="min-w-0">
                        <p className="mb-1 text-xs font-semibold text-muted-foreground">
                            Lesson
                            {tag.source === "embedding" ? (
                                <span className="ml-2 font-normal text-amber-700">matched without AI -- check it</span>
                            ) : null}
                        </p>
                        <Select
                            value={tag.lessonId ? String(tag.lessonId) : undefined}
                            onValueChange={(value) => onTag(question.num, { lessonId: Number(value) })}
                        >
                            <SelectTrigger className="w-full"><SelectValue placeholder="Choose a lesson" /></SelectTrigger>
                            <SelectContent className="max-h-80">
                                {lessons.map((lesson) => (
                                    <SelectItem key={lesson.lessonId} value={String(lesson.lessonId)}>
                                        {lesson.name}
                                        <span className="ml-2 text-xs text-muted-foreground">{lesson.category}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-semibold text-muted-foreground">Difficulty</p>
                        <Select
                            value={tag.difficulty ?? undefined}
                            onValueChange={(value) => onTag(question.num, { difficulty: value })}
                        >
                            <SelectTrigger className="w-full"><SelectValue placeholder="Choose" /></SelectTrigger>
                            <SelectContent>
                                {DIFFICULTIES.map((level) => (
                                    <SelectItem key={level} value={level} className="capitalize">{level}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {dropReason(tag) ? (
                        <p className="flex items-center gap-2 text-sm text-destructive sm:col-span-3">
                            <AlertTriangle className="h-4 w-4 shrink-0" /> Dropped, not saved: {dropReason(tag)}.
                        </p>
                    ) : included && problem ? (
                        <p className="flex items-center gap-2 text-sm text-amber-700 sm:col-span-3">
                            <AlertTriangle className="h-4 w-4 shrink-0" /> Cannot be saved yet: {problem}.
                        </p>
                    ) : null}
                </div>
            ) : null}
        </article>
    )
}

/**
 * Importing exam papers as questions: upload papers and answer keys, review
 * what was read, tag lessons and difficulty with AI, preview, save.
 */
export default function CertificationPdfImportPage() {
    const { id: certificationId } = useParams()
    const keyInputRef = useRef(null)
    const keyTargetRef = useRef(null)
    const cardRefs = useRef({})

    const [papers, setPapers] = useState([])
    const [keys, setKeys] = useState([])
    const [failures, setFailures] = useState([])
    const [progress, setProgress] = useState(null)
    const [filter, setFilter] = useState("all")
    const [term, setTerm] = useState("")
    // Which paper's answer-key panel is open, if any.
    const [keyBoxFor, setKeyBoxFor] = useState(null)
    const [keyText, setKeyText] = useState("")
    const [uploadOpen, setUploadOpen] = useState(false)
    const [lessons, setLessons] = useState([])
    const [tagging, setTagging] = useState(false)
    const [notice, setNotice] = useState(null)
    const [previewOpen, setPreviewOpen] = useState(false)
    const [saving, setSaving] = useState(null)
    const [copied, setCopied] = useState(false)

    const { data: certifications = [] } = useQuery({
        queryKey: ["admin-certifications", "question-bank-page"],
        queryFn: () => getAllCertifications(),
        staleTime: 5 * 60 * 1000,
    })
    const certification = certifications.find(
        (item) => String(item.certificationId ?? item.id) === String(certificationId),
    )

    const busy = progress !== null

    // The latest papers and keys, for handlers that run across awaits: a
    // closure over `papers` from the render that started a long read would
    // write back a stale list and drop whatever was added meanwhile.
    const latest = useRef({ papers, keys })
    latest.current = { papers, keys }

    function updatePaper(id, change) {
        setPapers((current) => current.map((p) => (p.id === id ? { ...p, ...change(p) } : p)))
    }

    /** Changes one question of one paper -- its figures or its choices' images. */
    function updateQuestion(paperId, num, change) {
        updatePaper(paperId, (p) => ({
            questions: p.questions.map((q) => (q.num === num ? { ...q, ...change(q) } : q)),
        }))
    }

    function attachKey(key, paperId) {
        setKeys((current) => current.map((k) => (k.id === key.id ? { ...k, paperId } : k.paperId === paperId ? { ...k, paperId: null } : k)))
        updatePaper(paperId, () => ({ answers: { ...key.answers }, keyName: key.name }))
    }

    /** Pairs every unattached key with the paper whose exam date agrees. */
    function matchKeys(allPapers, allKeys) {
        const papersOut = allPapers.map((p) => ({ ...p }))
        const keysOut = allKeys.map((k) => ({ ...k }))
        for (const key of keysOut) {
            if (key.paperId) continue
            let best = null
            let bestScore = 0
            for (const candidate of papersOut) {
                if (candidate.keyName) continue
                const score = matchScore(key.info, candidate.info)
                if (score > bestScore) {
                    best = candidate
                    bestScore = score
                }
            }
            // 4 = at least the year agrees; merely "not conflicting" is not
            // evidence the key belongs to the paper.
            if (best && bestScore >= 4) {
                key.paperId = best.id
                best.answers = { ...best.answers, ...key.answers }
                best.keyName = key.name
            }
        }
        return { papersOut, keysOut }
    }

    /**
     * An answer key PDF for the paper in the open tab: attached to it directly,
     * whatever its date says -- the admin chose the paper. A date that
     * disagrees, or a key whose question numbers do not fit the paper, is
     * said out loud rather than silently applied.
     */
    async function addKeyForPaper(file, target) {
        setProgress({ label: `Reading answer key ${file.name}`, percent: 30 })
        try {
            const result = await readExamPdf(file, null, readDocumentPage)
            if (result.kind !== "key") {
                setNotice({ kind: "error", text: `${file.name} is a question paper, not an answer key. Add it with Add PDFs instead.` })
                return
            }
            const fileId = `${file.name}:${file.size}`
            const key = { id: `${fileId}:${Date.now()}`, fileId, name: result.name, info: result.info, answers: result.answers, count: result.count, paperId: target.id }
            setKeys((current) => [
                ...current.map((k) => (k.paperId === target.id ? { ...k, paperId: null } : k)).filter((k) => k.fileId !== fileId),
                key,
            ])
            updatePaper(target.id, () => ({ answers: { ...result.answers }, keyName: result.name }))

            const fits = target.questions.filter((q) => result.answers[q.num]).length
            const warnings = []
            if (matchScore(result.info, target.info) === 0) {
                warnings.push(`its exam date (${describeExam(result.info) || "unknown"}) is not the paper's (${describeExam(target.info) || "unknown"})`)
            }
            if (fits < target.questions.length) {
                warnings.push(`it gives answers for ${fits} of the paper's ${target.questions.length} questions`)
            }
            setNotice(
                warnings.length
                    ? { kind: "warn", text: `${result.name} attached to ${target.name}, but ${warnings.join(", and ")}. Check it is the right key.` }
                    : { kind: "ok", text: `${result.name} attached to ${target.name}: all ${fits} questions have their answer.` },
            )
        } catch (error) {
            setNotice({ kind: "error", text: `Could not read ${file.name}: ${error?.message || error}.` })
        } finally {
            setProgress(null)
        }
    }

    async function addFiles(fileList) {
        const files = [...fileList]
        const loaded = new Set([
            ...latest.current.papers.map((p) => p.fileId),
            ...latest.current.keys.map((k) => k.fileId),
        ])
        const pdfs = files.filter(isPdf).filter((file) => !loaded.has(`${file.name}:${file.size}`))
        const rejected = files.filter((file) => !isPdf(file))
        setFailures((current) => [
            // A file added again is tried again; its old failure goes.
            ...current.filter((f) => !pdfs.some((file) => file.name === f.name)),
            ...rejected.map((file) => ({ name: file.name, error: "not a PDF" })),
        ])

        for (const [index, file] of pdfs.entries()) {
            const label = pdfs.length > 1 ? ` (${index + 1} of ${pdfs.length})` : ""
            setProgress({ label: `Opening ${file.name}${label}`, percent: 2 })
            try {
                const result = await readExamPdf(
                    file,
                    async (page, total, phase) => {
                        setProgress({
                            label: phase === "ai"
                                ? `Reading ${file.name}${label} with AI, page ${page} of ${total}`
                                : phase === "layout"
                                  ? `Reading the layout of ${file.name}${label} (${total} pages, about ${Math.max(10, total * 2)} seconds)`
                                  : `Opening ${file.name}${label}, page ${page} of ${total}`,
                            percent: phase === "layout" ? 60 : Math.round((page / total) * 100),
                        })
                        await new Promise((resolve) => setTimeout(resolve, 0))
                    },
                    readDocumentPage,
                    readDocumentLayout,
                )
                const fileId = `${file.name}:${file.size}`
                const id = `${fileId}:${Date.now()}`
                const { papers: currentPapers, keys: currentKeys } = latest.current
                let nextPapers = currentPapers
                let nextKeys = currentKeys
                if (result.kind === "key") {
                    nextKeys = [...currentKeys, { id, fileId, name: result.name, info: result.info, answers: result.answers, count: result.count, paperId: null }]
                } else {
                    nextPapers = [...currentPapers, {
                        id,
                        fileId,
                        name: result.name,
                        info: result.info,
                        questions: result.questions.map(forDisplay),
                        readBy: result.readBy,
                        profile: result.profile,
                        // Answers printed on the paper itself, when the AI read one.
                        answers: Object.fromEntries(
                            result.questions.filter((q) => q.answer).map((q) => [q.num, q.answer]),
                        ),
                        keyName: null,
                        tags: {},
                        types: {},
                        include: {},
                        saved: {},
                        duplicates: {},
                    }]
                }
                const { papersOut, keysOut } = matchKeys(nextPapers, nextKeys)
                latest.current = { papers: papersOut, keys: keysOut }
                setPapers(papersOut)
                setKeys(keysOut)
                if (result.kind !== "key") {
                    const questions = result.questions
                    findDuplicates(certificationId, questions.map((q) => q.stem))
                        .then((found) => {
                            const bank = {}
                            questions.forEach((q, index) => {
                                if (found.duplicates?.[index]) bank[q.num] = found.duplicates[index]
                            })
                            updatePaper(id, () => ({ duplicates: bank }))
                        })
                        .catch(() => {
                            // The upload still works; only the question-bank check is missing.
                            setNotice({ kind: "warn", text: `${result.name}: could not check the question bank for duplicates.` })
                        })
                }
            } catch (error) {
                setFailures((current) => [...current, { name: file.name, error: error?.message || String(error) }])
            }
        }
        setProgress(null)
    }

    /** Whether a question passes the search box and the figures filter. */
    function matches(question) {
        const needle = term.trim().toLowerCase()
        return (
            (filter === "all" || question.figureSrcs.length > 0) &&
            (!needle ||
                `q${question.num} ${question.stem} ${question.options.map((o) => o.text).join(" ")}`
                    .toLowerCase()
                    .includes(needle))
        )
    }

    /**
     * Tags every paper's questions, paper by paper. A question no lesson fits,
     * or one already in the bank or earlier in this upload, is dropped:
     * left unticked, with the reason on its card.
     */
    async function tagWithAi() {
        const targets = latest.current.papers
        if (!targets.length) return
        setTagging(true)
        setNotice(null)
        const seen = new Map()
        let tagged = 0
        let noLesson = 0
        let duplicates = 0
        let fallback = 0
        try {
            for (const [index, target] of targets.entries()) {
                setNotice({ kind: "info", text: `Tagging ${target.name} (${index + 1} of ${targets.length})…` })
                const texts = target.questions.map(
                    (q) => `${q.stem}\n${q.options.map((o) => `${o.key}) ${o.text || "[picture]"}`).join("\n")}`,
                )
                const result = await tagQuestions(certificationId, texts, target.questions.map((q) => q.stem))
                setLessons(result.lessons ?? [])
                const tags = {}
                const include = {}
                target.questions.forEach((question, position) => {
                    const tag = { ...(result.tags?.[position] ?? {}) }
                    // Across papers too: the same question in two uploads.
                    const print = fingerprint(question.stem)
                    if (!tag.duplicate && print.length >= 40 && seen.has(print)) {
                        tag.duplicate = "upload"
                        tag.duplicateOf = seen.get(print)
                    }
                    if (print.length >= 40 && !seen.has(print)) seen.set(print, `${target.name} Q${question.num}`)
                    if (tag.noLesson) noLesson += 1
                    else if (tag.duplicate) duplicates += 1
                    if (tag.source && tag.source !== "ai") fallback += 1
                    tags[question.num] = tag
                    include[question.num] = !dropReason(tag)
                    tagged += 1
                })
                updatePaper(target.id, () => ({ tags, include }))
            }
            const parts = [`${tagged} questions tagged.`]
            if (noLesson) parts.push(`${noLesson} dropped: no lesson in this certification fits them.`)
            if (duplicates) parts.push(`${duplicates} dropped as duplicates.`)
            if (fallback) parts.push(`${fallback} could not be tagged by the AI and were matched without it -- set their difficulty.`)
            setNotice({ kind: fallback ? "warn" : "ok", text: parts.join(" ") })
        } catch (error) {
            setNotice({ kind: "error", text: error?.response?.data?.message || error?.message || "Tagging failed." })
        } finally {
            setTagging(false)
        }
    }

    /**
     * {"<paper id>-<num>": why it is a duplicate}. The question bank's answer
     * comes from the server; repeats across the uploaded papers are found
     * here, first copy kept.
     */
    const duplicateReasons = {}
    {
        const firstSeen = new Map()
        for (const item of papers) {
            for (const question of item.questions) {
                const id = `${item.id}-${question.num}`
                const server = item.duplicates?.[question.num]
                if (server === "bank") duplicateReasons[id] = "it is already in this certification's question bank"
                else if (server === "paper") duplicateReasons[id] = "it repeats an earlier question in the same paper"
                const print = fingerprint(question.stem)
                if (print.length < 40) continue
                const earlier = firstSeen.get(print)
                if (earlier && !duplicateReasons[id]) {
                    duplicateReasons[id] = `it repeats ${earlier} in this upload`
                } else if (!earlier) {
                    firstSeen.set(print, `${item.name.replace(/\.pdf$/i, "")} Q${question.num}`)
                }
            }
        }
    }

    function deleteQuestions(paperId, nums) {
        const gone = new Set(nums.map(String))
        updatePaper(paperId, (p) => ({ questions: p.questions.filter((q) => !gone.has(String(q.num))) }))
    }

    // What Save would write, across every paper.
    const pending = papers.flatMap((p) =>
        p.questions
            .filter((q) => p.include[q.num] !== false && !p.saved[q.num] && p.tags[q.num])
            .map((question) => ({ question, paper: p })),
    )
    const ready = pending.filter(({ question, paper: p }) => !problemWith(question, p))
    const blocked = pending.filter(({ question, paper: p }) => problemWith(question, p))
    const lessonName = (id) => lessons.find((l) => l.lessonId === id)?.name ?? `Lesson ${id}`

    async function saveReady() {
        const queue = [...ready]
        const errors = []
        let done = 0
        setSaving({ done, total: queue.length, errors })
        for (const { question, paper: target } of queue) {
            try {
                await saveOne(question, target, certificationId)
                updatePaper(target.id, (p) => ({ saved: { ...p.saved, [question.num]: true } }))
            } catch (error) {
                errors.push(`${target.name} Q${question.num}: ${error?.response?.data?.message || error?.message || "failed"}`)
            }
            done += 1
            setSaving({ done, total: queue.length, errors: [...errors] })
        }
        setSaving({ done, total: queue.length, errors, finished: true })
    }

    // A key already feeding a paper is not "unmatched", whichever copy it is.
    const looseKeys = keys.filter((key) => !key.paperId && !papers.some((p) => p.keyName === key.name))
    const totalQuestions = papers.reduce((sum, p) => sum + p.questions.length, 0)
    const taggedCount = papers.reduce((sum, p) => sum + Object.keys(p.tags).length, 0)

    return (
        <div className="flex h-dvh w-full flex-col overflow-hidden bg-muted/20">
            <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-2.5">
                <Button asChild variant="ghost" size="icon-sm" aria-label="Back to question bank">
                    <Link to={`/admin/certification/${certificationId}/question-bank`}>
                        <ArrowLeft className="size-4" />
                    </Link>
                </Button>
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Import from PDF</p>
                    <p className="truncate text-sm font-semibold">{certification?.title ?? "Question bank"}</p>
                </div>
                {papers.length ? (
                    <Button type="button" size="sm" disabled={busy} onClick={() => setUploadOpen(true)}>
                        <UploadIcon className="mr-2 h-4 w-4" /> Add PDFs
                    </Button>
                ) : null}
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto">
                {!papers.length ? (
                    <section className="mx-auto mt-[6vh] max-w-3xl px-5">
                        <div className="rounded-2xl border bg-background p-5 shadow-sm">
                            <PdfUploadStep onNext={addFiles} disabled={busy} nextLabel="Next: read the files" />
                        </div>
                        {busy ? (
                            <div className="mt-4 rounded-xl border bg-background p-3" aria-live="polite">
                                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                    <div className="h-full bg-primary transition-[width]" style={{ width: `${progress.percent}%` }} />
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">{progress.label}</p>
                            </div>
                        ) : null}
                        {failures.map((failure, index) => (
                            <p key={index} className="mt-2 flex items-start gap-2 text-sm text-destructive">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Could not read {failure.name}: {failure.error}.
                            </p>
                        ))}
                    </section>
                ) : (
                    <div className="grid w-full gap-6 px-4 py-5 lg:px-6 lg:grid-cols-[250px_minmax(0,1fr)]">
                        <aside className="hidden max-h-[calc(100dvh-7rem)] self-start overflow-y-auto rounded-2xl border bg-background p-3 lg:sticky lg:top-0 lg:block">
                            <h2 className="text-sm font-bold text-primary">Answer sheet</h2>
                            <p className="mb-2 text-xs text-muted-foreground">Green marks the answer. Click a number to jump to it.</p>
                            {papers.map((item) => (
                                <div key={item.id} className="mb-3">
                                    {papers.length > 1 ? (
                                        <p className="sticky top-0 mb-1 truncate bg-background py-1 text-xs font-semibold">{item.name.replace(/\.pdf$/i, "")}</p>
                                    ) : null}
                                    {item.questions.map((question) => {
                                        const answer = item.answers[question.num]
                                        return (
                                            <button
                                                key={question.num}
                                                type="button"
                                                onClick={() => {
                                                    setFilter("all")
                                                    setTerm("")
                                                    requestAnimationFrame(() =>
                                                        cardRefs.current[`${item.id}-${question.num}`]?.scrollIntoView({ behavior: "smooth", block: "start" }),
                                                    )
                                                }}
                                                className="flex w-full flex-wrap items-center gap-1.5 rounded-md px-1 py-0.5 hover:bg-muted"
                                            >
                                                <b className="w-12 shrink-0 pr-1 text-right text-xs text-primary">{question.num}</b>
                                                {(question.options.length > 4 ? question.options.map((o) => o.key) : KEYS).map((key) => (
                                                    <span
                                                        key={key}
                                                        className={cn(
                                                            "grid size-5 place-items-center rounded-full border text-[10px]",
                                                            answer === key ? "border-emerald-600 bg-emerald-600 text-white" : "border-primary/50 text-primary",
                                                        )}
                                                    >
                                                        {key}
                                                    </span>
                                                ))}
                                            </button>
                                        )
                                    })}
                                </div>
                            ))}
                        </aside>

                        <main className="min-w-0">
                            {/* Everything that acts on all papers at once. */}
                            <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border bg-background p-3">
                                <p className="flex-1 text-sm text-muted-foreground">
                                    <strong className="text-foreground">
                                        {totalQuestions} questions{papers.length > 1 ? ` in ${papers.length} papers` : ""}
                                    </strong>
                                    {taggedCount ? `, ${taggedCount} tagged` : ""}.
                                </p>
                                <Button type="button" size="sm" variant={taggedCount ? "outline" : "default"} disabled={tagging || busy} onClick={tagWithAi}>
                                    {tagging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                    {tagging ? "Tagging…" : taggedCount ? "Tag all again with AI" : `Tag all ${totalQuestions} with AI`}
                                </Button>
                                <Button type="button" size="sm" disabled={!taggedCount || tagging} onClick={() => { setSaving(null); setPreviewOpen(true) }}>
                                    <Eye className="mr-2 h-4 w-4" /> Preview & save
                                </Button>
                            </div>

                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                <div className="relative min-w-[220px] flex-1">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Search question text" className="rounded-full pl-9" />
                                </div>
                                <div className="inline-flex overflow-hidden rounded-full border bg-background" role="group" aria-label="Filter">
                                    {[["all", "All"], ["fig", "With figures"]].map(([value, label]) => (
                                        <button
                                            key={value}
                                            type="button"
                                            aria-pressed={filter === value}
                                            onClick={() => setFilter(value)}
                                            className={cn("px-3.5 py-1.5 text-sm", filter === value && "bg-foreground text-background")}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full"
                                    onClick={async () => {
                                        await navigator.clipboard.writeText(papers.map((p) => `===== ${p.name} =====\n\n${asText(p)}`).join("\n\n\n"))
                                        setCopied(true)
                                        setTimeout(() => setCopied(false), 1600)
                                    }}
                                >
                                    <Copy className="mr-2 h-4 w-4" /> {copied ? "Copied" : "Copy as text"}
                                </Button>
                            </div>

                            {busy ? (
                                <div className="mb-3 rounded-xl border bg-background p-3 text-sm text-muted-foreground" aria-live="polite">
                                    <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
                                        <div className="h-full bg-primary transition-[width]" style={{ width: `${progress.percent}%` }} />
                                    </div>
                                    {progress.label}
                                </div>
                            ) : null}

                            {notice ? (
                                <p
                                    className={cn(
                                        "mb-3 flex items-start gap-2 rounded-xl border p-3 text-sm",
                                        notice.kind === "ok" && "border-emerald-300 bg-emerald-50 text-emerald-800",
                                        notice.kind === "warn" && "border-amber-300 bg-amber-50 text-amber-800",
                                        notice.kind === "error" && "border-destructive/40 bg-destructive/5 text-destructive",
                                        notice.kind === "info" && "bg-background text-muted-foreground",
                                    )}
                                >
                                    {notice.kind === "ok" ? (
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                                    ) : notice.kind === "info" ? (
                                        <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
                                    ) : (
                                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                    )}
                                    {notice.text}
                                </p>
                            ) : null}

                            {/* Every paper needs its answers before anything can be saved:
                                what is missing is said here, not discovered in the preview. */}
                            {papers.some((p) => unanswered(p).length) ? (
                                <div className="mb-3 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                                    <p className="mb-1 flex items-center gap-2 font-semibold">
                                        <AlertTriangle className="h-4 w-4 shrink-0" /> Answers are missing
                                    </p>
                                    <ul className="list-disc space-y-0.5 pl-6">
                                        {papers.map((p) => {
                                            const missing = unanswered(p)
                                            if (!missing.length) return null
                                            return (
                                                <li key={p.id}>
                                                    <b>{p.name.replace(/\.pdf$/i, "")}</b>:{" "}
                                                    {missing.length === p.questions.length
                                                        ? `no answer key -- none of its ${p.questions.length} questions has an answer. Add its answer key PDF, or paste the key.`
                                                        : `${missing.length} of ${p.questions.length} questions have no answer (${listNumbers(missing)}). Mark them, or add the full key.`}
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </div>
                            ) : null}

                            {failures.map((failure, index) => (
                                <p key={`f${index}`} className="mb-2 flex items-start gap-2 rounded-xl border border-dashed bg-background p-3 text-sm text-destructive">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Could not read {failure.name}: {failure.error}.
                                </p>
                            ))}

                            {looseKeys.map((key) => (
                                <div key={key.id} className="mb-3 rounded-xl border border-primary/50 bg-background p-3 text-sm">
                                    <p className="mb-2">
                                        <KeyRound className="mr-1 inline h-4 w-4" />
                                        Answer key <b>{key.name}</b> ({key.count} answers{describeExam(key.info) ? `, ${describeExam(key.info)}` : ""}) was not matched to a paper.
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {papers.map((item) => (
                                            <Button key={item.id} type="button" size="sm" variant="outline" onClick={() => attachKey(key, item.id)}>
                                                Use for {item.name.replace(/\.pdf$/i, "")}
                                            </Button>
                                        ))}
                                    </div>
                                    {papers.some((item) => matchScore(key.info, item.info) === 0) ? (
                                        <p className="mt-2 text-xs text-destructive">
                                            Its exam date differs from {papers.filter((item) => matchScore(key.info, item.info) === 0).map((item) => item.name).join(", ")} -- only attach it if you are sure.
                                        </p>
                                    ) : null}
                                </div>
                            ))}

                            <input
                                ref={keyInputRef}
                                type="file"
                                accept="application/pdf,.pdf"
                                hidden
                                onChange={(event) => {
                                    const file = event.target.files?.[0]
                                    const target = latest.current.papers.find((p) => p.id === keyTargetRef.current)
                                    if (file && target) addKeyForPaper(file, target)
                                    event.target.value = ""
                                }}
                            />

                            {/* One section per uploaded paper. */}
                            {papers.map((item) => {
                                const shown = item.questions.filter((question) => matches(question))
                                const marked = Object.keys(item.answers).length
                                const keyBoxOpen = keyBoxFor === item.id
                                return (
                                    <section key={item.id} className="mb-8" aria-label={item.name}>
                                        <div className="sticky top-0 z-10 mb-3 rounded-xl border-2 border-primary/30 bg-background p-3 shadow-sm">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <h2 className="truncate text-base font-bold">{item.name.replace(/\.pdf$/i, "")}</h2>
                                                    <p className="text-xs text-muted-foreground">
                                                        {[
                                                            describeExam(item.info),
                                                            `${item.questions.length} questions`,
                                                            `${item.questions.filter((q) => q.figureSrcs.length).length} with figures`,
                                                            item.readBy === "ai" && "read by AI",
                                                            item.readBy === "layout" && `layout: ${item.profile ?? "detected"}`,
                                                            `${marked} answers marked${item.keyName ? ` from ${item.keyName}` : ""}`,
                                                        ].filter(Boolean).join(" · ")}
                                                    </p>
                                                </div>
                                                <Select
                                                    value=""
                                                    onValueChange={(value) =>
                                                        updatePaper(item.id, (p) => ({
                                                            types: Object.fromEntries(p.questions.map((q) => [q.num, value])),
                                                        }))
                                                    }
                                                >
                                                    <SelectTrigger size="sm" className="w-auto" aria-label="Save all questions in this paper as"><SelectValue placeholder="Save all as…" /></SelectTrigger>
                                                    <SelectContent>
                                                        {SAVE_TYPES.map((type) => (
                                                            <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Button type="button" size="sm" variant={keyBoxOpen ? "default" : "outline"} onClick={() => setKeyBoxFor(keyBoxOpen ? null : item.id)}>
                                                    <KeyRound className="mr-2 h-4 w-4" /> {item.keyName ? "Change answer key" : "Add answer key"}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="icon-sm"
                                                    variant="ghost"
                                                    aria-label={`Remove ${item.name}`}
                                                    onClick={() => {
                                                        setPapers((current) => current.filter((p) => p.id !== item.id))
                                                        setKeys((current) => current.map((k) => (k.paperId === item.id ? { ...k, paperId: null } : k)))
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            {(() => {
                                                const duplicates = item.questions.filter((q) => duplicateReasons[`${item.id}-${q.num}`])
                                                if (!duplicates.length) return null
                                                return (
                                                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800">
                                                        <AlertTriangle className="h-4 w-4 shrink-0" />
                                                        <span className="flex-1">
                                                            {duplicates.length} duplicate{duplicates.length === 1 ? "" : "s"}: {listNumbers(duplicates)}.
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            size="xs"
                                                            variant="outline"
                                                            onClick={() => deleteQuestions(item.id, duplicates.map((q) => q.num))}
                                                        >
                                                            <Trash2 className="h-3 w-3" /> Delete all duplicates
                                                        </Button>
                                                    </div>
                                                )
                                            })()}
                                            {(() => {
                                                const missing = unanswered(item)
                                                if (!missing.length) return null
                                                const none = missing.length === item.questions.length
                                                return (
                                                    <div
                                                        className={cn(
                                                            "mt-3 flex flex-wrap items-center gap-2 rounded-lg border p-2 text-sm",
                                                            none
                                                                ? "border-destructive/40 bg-destructive/5 text-destructive"
                                                                : "border-amber-300 bg-amber-50 text-amber-800",
                                                        )}
                                                    >
                                                        <AlertTriangle className="h-4 w-4 shrink-0" />
                                                        <span className="flex-1">
                                                            {none
                                                                ? `No answer key: none of the ${item.questions.length} questions has an answer.`
                                                                : `Missing answers: ${listNumbers(missing)} (${missing.length} of ${item.questions.length}).`}
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            size="xs"
                                                            variant="outline"
                                                            disabled={busy}
                                                            onClick={() => {
                                                                keyTargetRef.current = item.id
                                                                keyInputRef.current?.click()
                                                            }}
                                                        >
                                                            <UploadIcon className="h-3 w-3" /> Upload key PDF
                                                        </Button>
                                                    </div>
                                                )
                                            })()}
                                            {keyBoxOpen ? (
                                                <div className="mt-3 border-t pt-3">
                                                    <p className="mb-2 text-sm text-muted-foreground">
                                                        Upload this paper&apos;s answer key PDF, or paste the key. Pasted formats like <em>1 c, 2 d, 3 a</em> or one letter per question in order (<em>cdab…</em>) both work.
                                                    </p>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="mb-2"
                                                        disabled={busy}
                                                        onClick={() => {
                                                            keyTargetRef.current = item.id
                                                            keyInputRef.current?.click()
                                                        }}
                                                    >
                                                        <UploadIcon className="mr-2 h-4 w-4" /> Upload key PDF for this paper
                                                    </Button>
                                                    <Textarea value={keyText} onChange={(event) => setKeyText(event.target.value)} className="min-h-20" />
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() => updatePaper(item.id, (p) => ({ answers: parseKeyText(keyText, p.questions), keyName: "pasted key" }))}
                                                        >
                                                            Apply pasted key
                                                        </Button>
                                                        <Button type="button" size="sm" variant="outline" onClick={() => updatePaper(item.id, () => ({ answers: {}, keyName: null }))}>
                                                            Clear answers
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="space-y-4">
                                            {shown.length ? (
                                                shown.map((question) => (
                                                    <QuestionCard
                                                        key={`${item.id}-${question.num}`}
                                                        cardRef={(node) => { cardRefs.current[`${item.id}-${question.num}`] = node }}
                                                        question={question}
                                                        paper={item}
                                                        lessons={lessons}
                                                        onPick={(num, key) => updatePaper(item.id, (p) => ({ answers: { ...p.answers, [num]: key } }))}
                                                        onTag={(num, change) => updatePaper(item.id, (p) => ({ tags: { ...p.tags, [num]: { ...p.tags[num], ...change } } }))}
                                                        onType={(num, value) => updatePaper(item.id, (p) => ({ types: { ...p.types, [num]: value } }))}
                                                        onInclude={(num, value) => updatePaper(item.id, (p) => ({ include: { ...p.include, [num]: value } }))}
                                                        onFigures={(num, figureSrcs) => updateQuestion(item.id, num, () => ({ figureSrcs }))}
                                                        onOptionImage={(num, key, canvas) =>
                                                            updateQuestion(item.id, num, (q) => ({
                                                                options: q.options.map((o) =>
                                                                    o.key === key ? { ...o, imageSrc: canvas ? srcOf(canvas) : null } : o,
                                                                ),
                                                            }))
                                                        }
                                                        onImageError={(error) => setNotice({ kind: "error", text: error?.message || "That image could not be used." })}
                                                        duplicate={duplicateReasons[`${item.id}-${question.num}`]}
                                                        onDelete={(num) => deleteQuestions(item.id, [num])}
                                                    />
                                                ))
                                            ) : (
                                                <p className="py-6 text-center text-sm text-muted-foreground">No questions in this paper match. Clear the search or switch the filter to All.</p>
                                            )}
                                        </div>
                                    </section>
                                )
                            })}
                        </main>
                    </div>
                )}
            </div>

            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                <DialogContent className="max-h-[calc(100dvh-3rem)] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add PDFs</DialogTitle>
                        <DialogDescription>
                            More papers or answer keys. They are added as new sections; papers already here stay as they are.
                        </DialogDescription>
                    </DialogHeader>
                    <PdfUploadStep
                        disabled={busy}
                        nextLabel="Next: read the files"
                        onNext={(files) => {
                            setUploadOpen(false)
                            addFiles(files)
                        }}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={previewOpen} onOpenChange={(open) => !(saving && !saving.finished) && setPreviewOpen(open)}>
                <DialogContent className="max-h-[calc(100dvh-3rem)] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Preview before saving</DialogTitle>
                        <DialogDescription>
                            {ready.length} question{ready.length === 1 ? "" : "s"} will be saved to {certification?.title ?? "this certification"}.
                            {blocked.length ? ` ${blocked.length} cannot be saved yet and will be left out.` : ""}
                        </DialogDescription>
                    </DialogHeader>

                    {blocked.length ? (
                        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                            {blocked.map(({ question, paper: p }) => (
                                <p key={`${p.id}-${question.num}`}>{p.name.replace(/\.pdf$/i, "")} Q{question.num}: {problemWith(question, p)}</p>
                            ))}
                        </div>
                    ) : null}

                    <div className="space-y-3">
                        {ready.map(({ question, paper: p }) => {
                            const tag = p.tags[question.num]
                            const type = p.types[question.num] ?? "MCQ"
                            const answer = p.answers[question.num]
                            const correct = question.options.find((o) => o.key === answer)
                            return (
                                <div key={`${p.id}-${question.num}`} className="rounded-xl border p-3">
                                    <div className="mb-1 flex flex-wrap items-center gap-2">
                                        <b className="text-primary">Q{question.num}</b>
                                        <span className="text-xs text-muted-foreground">{p.name.replace(/\.pdf$/i, "")}</span>
                                        <Badge variant="secondary">{QUESTION_TYPES.find((t) => t.id === type)?.label}</Badge>
                                        <Badge variant="outline">{lessonName(tag.lessonId)}</Badge>
                                        <Badge variant="outline" className="capitalize">{tag.difficulty}</Badge>
                                    </div>
                                    <p className="line-clamp-3 whitespace-pre-line text-sm">{questionText(question, p)}</p>
                                    {question.figureSrcs.length ? (
                                        <img src={question.figureSrcs[0]} alt="" className="mt-2 max-h-28 rounded border bg-white" />
                                    ) : null}
                                    {type === "MCQ" ? (
                                        <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                                            {question.options.map((option) => (
                                                <li key={option.key} className={cn("flex items-center gap-2 rounded px-1", option.key === answer && "bg-emerald-50 font-semibold text-emerald-800")}>
                                                    {option.key})
                                                    {option.imageSrc ? <img src={option.imageSrc} alt="" className="max-h-14 rounded bg-white" /> : <span className="truncate">{option.text}</span>}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="mt-2 text-sm">
                                            <span className="text-muted-foreground">Expected answer:</span> <b>{correct?.text}</b>
                                        </p>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {saving ? (
                        <div className="rounded-xl border bg-muted/40 p-3 text-sm" aria-live="polite">
                            <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
                                <div className="h-full bg-primary transition-[width]" style={{ width: `${saving.total ? (saving.done / saving.total) * 100 : 100}%` }} />
                            </div>
                            {saving.finished
                                ? `Saved ${saving.done - saving.errors.length} of ${saving.total}.`
                                : `Saving ${saving.done} of ${saving.total}…`}
                            {saving.errors.map((error) => (
                                <p key={error} className="text-destructive">{error}</p>
                            ))}
                        </div>
                    ) : null}

                    <DialogFooter>
                        <Button type="button" variant="outline" disabled={Boolean(saving && !saving.finished)} onClick={() => setPreviewOpen(false)}>
                            {saving?.finished ? "Close" : "Back to review"}
                        </Button>
                        {!saving?.finished ? (
                            <Button type="button" disabled={!ready.length || Boolean(saving)} onClick={saveReady}>
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save {ready.length} to question bank
                            </Button>
                        ) : null}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
