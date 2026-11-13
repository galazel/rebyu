import { memo, useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

import {
    AlertTriangle,
    CheckCircle2,
    Eye,
    KeyRound,
    Loader2,
    MoreVertical,
    Pencil,
    Plus,
    Save,
    Search,
    Sparkles,
    Trash2,
    UploadIcon,
    X
} from "@/components/icons"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { clearDraft, clearJobFiles, loadDraft, loadJobFile, saveDraft, saveJobFile } from "@/utils/pdf-import-draft.js"
import { getAllCertifications } from "@/services/certificationService.js"
import { uploadQuestionImage } from "@/services/fileService.js"
import {
    asPdf,
    cancelImportJob,
    cancelTagJob,
    checkQuestions,
    createImportJob,
    discardImportJob,
    findDuplicates,
    getImportJob,
    getImportJobResult,
    getTagJob,
    latestImportJob,
    readDocumentLayout,
    readDocumentPage,
    startImportJob,
    startTagJob,
    uploadImportPage,
} from "@/services/pdfImportService.js"
import {
    activeJobFor,
    addActiveJob,
    appliedPapers,
    askForNotifications,
    forgetJob,
    markApplied,
    notify,
} from "@/utils/tag-job-registry.js"
import { saveChoices, saveQuestion, saveTextQuestion } from "@/services/questionService.js"
import {
    canvasToFile,
    citationFor,
    describeExam,
    countPages,
    matchScore,
    readExamPdf,
    renderPagePayloads,
    serverReads,
    stackCanvases,
} from "@/utils/pdf-question-extractor.js"

const LETTER_KEYS = ["a", "b", "c", "d", "e", "f", "g", "h"]
const NUM_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8"]
const KEYS = LETTER_KEYS.slice(0, 4)
const DIFFICULTIES = ["easy", "average", "hard"]


const QUESTION_TYPES = [
    { id: "MCQ", label: "Multiple choice" },
    { id: "SHORT_ANSWER", label: "Short answer" },
    { id: "DESCRIPTIVE", label: "Descriptive" },
    { id: "PROGRAMMING", label: "Programming", disabled: "needs an expected output" },
    { id: "DIAGRAM", label: "Diagram", disabled: "needs a reference diagram" },
]

const imageUrls = new WeakMap()
function srcOf(canvas) {
    if (!imageUrls.has(canvas)) {
        imageUrls.set(canvas, canvas.height > 2500 ? canvas.toDataURL("image/jpeg", 0.85) : canvas.toDataURL("image/png"))
    }
    return imageUrls.get(canvas)
}

function forDisplay(question) {
    const { figures, snaps, ...rest } = question
    return {
        ...rest,
        figureSrcs: figures.map(srcOf),
        snapSrcs: snaps.map(srcOf),
        options: question.options.map(({ image, ...option }) => ({
            ...option,
            imageSrc: image ? srcOf(image) : null,
        })),
    }
}

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

function questionPrint(question) {
    const stem = fingerprint(question.stem)
    if (stem.length < 40) return null
    return `${stem}|${question.options.map((option) => fingerprint(option.text)).join("|")}`
}

function duplicateText(question) {
    return [question.stem, ...question.options.map((option) => option.text || "")].join("\u0001")
}

const prints = new Map()
function fingerprint(text) {
    let print = prints.get(text)
    if (print === undefined) {
        print = (text || "").toLowerCase().replace(/[^0-9a-z]+/g, "")
        prints.set(text, print)
    }
    return print
}

// The AI decides what kind of answer each question needs.
const TYPE_FROM_AI = { mcq: "MCQ", short_answer: "SHORT_ANSWER", descriptive: "DESCRIPTIVE", programming: "DESCRIPTIVE", diagram: "DESCRIPTIVE" }
const AI_TYPE_LABEL = { mcq: "Multiple choice", short_answer: "Short answer", descriptive: "Descriptive", programming: "Programming", diagram: "Diagram" }

// Letters for chosen options, model-answer text for written questions.
function answersOf(read) {
    if (read.kind === "key") return { ...(read.answerTexts || {}), ...(read.answers || {}) }
    return Object.fromEntries(
        (read.questions ?? []).filter((q) => q.answer || q.answerText).map((q) => [q.num, q.answer || q.answerText]),
    )
}

// A read paper turned into the page's paper object.
function buildPaper(result, answers, keyName, id) {
    const displayed = result.questions.map(forDisplay)
    for (const question of displayed) {
        const ans = answers[question.num]
        if (question.options.length < 2 && ans && (question.type ?? "mcq") === "mcq" && /^[a-z0-9]$/i.test(ans)) {
            let keys
            if (/^\d$/.test(ans)) {
                keys = Array.from({ length: Math.max(Number(ans), 4) }, (_, i) => String(i + 1))
            } else {
                const maxKey = ans > "d" ? ans : "d"
                keys = []
                for (let ch = "a"; ch <= maxKey; ch = String.fromCharCode(ch.charCodeAt(0) + 1)) keys.push(ch)
            }
            question.options = keys.map((key) => question.options.find((o) => o.key === key) ?? { key, text: key, imageSrc: null, fromTable: false })
        }
    }
    return {
        id,
        fileId: id.replace(/:\d+$/, ""),
        name: result.name,
        info: result.info,
        questions: displayed,
        readBy: result.readBy,
        profile: result.profile,
        partial: Boolean(result.partial),
        recoveryWarning: result.recoveryWarning || null,
        answers,
        keyName,
        tags: {},
        types: Object.fromEntries(displayed.map((q) => [q.num, TYPE_FROM_AI[q.type] ?? "MCQ"])),
        include: {},
        saved: {},
        duplicates: {},
        checks: {},
    }
}

// The server's answer check laid onto a paper: wording repairs applied (the
// original kept for undo), disagreements recorded for the reviewer.
function applyCheckResults(paper, results) {
    const byNum = new Map(results.map((r) => [String(r.id), r]))
    const checks = { ...(paper.checks || {}) }
    const questions = paper.questions.map((q) => {
        const r = byNum.get(String(q.num))
        if (!r) return q
        const fixed = Boolean(r.stem || Object.keys(r.options || {}).length)
        checks[q.num] = {
            answer: r.answer,
            confidence: r.confidence,
            reason: r.reason,
            fixes: fixed ? r.fixes : [],
            before: fixed ? { stem: q.stem, texts: Object.fromEntries(q.options.map((o) => [o.key, o.text])) } : null,
            resolved: false,
        }
        if (!fixed) return q
        return { ...q, stem: r.stem || q.stem, options: q.options.map((o) => (r.options?.[o.key] ? { ...o, text: r.options[o.key] } : o)) }
    })
    return { questions, checks }
}

const STAGE_LABEL = {
    waiting: "Waiting",
    reading: "Reading pages",
    key: "Reading the answer key",
    checking: "Checking answers",
    tagging: "Tagging lessons & difficulty",
    done: "Ready",
    failed: "Failed",
    stopped: "Stopped",
}

function jobProgress(job) {
    let total = 0
    let done = 0
    for (const entry of job.papers) {
        // Each page is one unit; checking and tagging a paper count as two more each.
        const pages = entry.pages.paper + entry.pages.key
        total += pages + 4
        if (entry.stage === "done" || entry.stage === "failed") done += pages + 4
        else done += entry.read.paper + entry.read.key + (entry.stage === "tagging" ? 2 : 0)
    }
    return total ? Math.round((done / total) * 100) : 0
}

function ImportJobPanel({ job, upload, building, stopping, onStop, onResume }) {
    const active = upload || ["uploading", "running"].includes(job?.status)
    const percent = upload ? (upload.total ? Math.round((upload.done / upload.total) * 100) : 2) : job ? jobProgress(job) : 0
    return (
        <div className="mb-4 rounded-2xl border border-primary/30 bg-background p-4 shadow-sm" aria-live="polite">
            <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-bold">
                        {active ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <AlertTriangle className="h-4 w-4 text-amber-600" />}
                        {upload
                            ? "Uploading pages"
                            : job?.status === "interrupted"
                              ? "Import interrupted"
                              : "Scanning & tagging on the server"}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {upload
                            ? `${upload.label}${upload.total ? ` -- ${upload.done} of ${upload.total} pages` : ""}. Keep this tab open until the upload finishes; nothing is charged yet.`
                            : job?.status === "interrupted"
                              ? job.error
                              : "Every page is read, the answers are checked and each question gets its lesson and difficulty, in one pass. You can leave this page, log out or close the tab -- it keeps going and you will be told when it is done."}
                    </p>
                </div>
                {job?.status === "interrupted" ? (
                    <Button type="button" size="sm" onClick={onResume}>Resume</Button>
                ) : null}
                {active || job?.status === "interrupted" ? (
                    <Button type="button" size="sm" variant="destructive" disabled={stopping} onClick={onStop}>
                        {stopping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                        {stopping ? "Stopping…" : "Stop import"}
                    </Button>
                ) : null}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-[width] duration-500" style={{ width: `${percent}%` }} />
            </div>
            {job && !upload ? (
                <ul className="mt-3 divide-y rounded-xl border text-sm">
                    {job.papers.map((entry) => {
                        const detail =
                            entry.stage === "reading"
                                ? `page ${Math.min(entry.read.paper + 1, entry.pages.paper)} of ${entry.pages.paper}`
                                : entry.stage === "key"
                                  ? `page ${Math.min(entry.read.key + 1, entry.pages.key)} of ${entry.pages.key}`
                                  : entry.stage === "done"
                                    ? building === entry.name
                                        ? "building the questions…"
                                        : `${entry.questions} questions, ${entry.tagged} tagged`
                                    : entry.stage === "failed"
                                      ? entry.error
                                      : `${entry.pages.paper} pages${entry.pages.key ? ` + ${entry.pages.key}-page key` : ""}`
                        return (
                            <li key={entry.paperId} className="flex items-center gap-3 px-3 py-2">
                                {entry.stage === "done" ? (
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                                ) : entry.stage === "failed" ? (
                                    <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                                ) : ["reading", "key", "checking", "tagging"].includes(entry.stage) && job.status === "running" ? (
                                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                                ) : (
                                    <span className="h-4 w-4 shrink-0 rounded-full border-2 border-muted-foreground/30" />
                                )}
                                <span className="min-w-0 flex-1 truncate font-medium">{entry.name.replace(/\.pdf$/i, "")}</span>
                                <span className={cn("shrink-0 text-xs", entry.stage === "failed" ? "text-destructive" : "text-muted-foreground")}>
                                    {STAGE_LABEL[entry.stage] ?? entry.stage} · {detail}
                                </span>
                            </li>
                        )
                    })}
                </ul>
            ) : null}
        </div>
    )
}

function isWritten(question, paper) {
    return (paper.types[question.num] ?? "MCQ") !== "MCQ" && question.options.length < 2
}

function unanswered(paper) {
    return paper.questions.filter((question) => !paper.answers[question.num])
}

function answered(paper) {
    return paper.questions.filter((question) => paper.answers[question.num])
}

function listNumbers(questions, limit = 12) {
    const shown = questions.slice(0, limit).map((q) => `Q${q.num}`).join(", ")
    return questions.length > limit ? `${shown} and ${questions.length - limit} more` : shown
}

function needsTag(paper, question) {
    const tag = paper.tags[question.num]
    return !tag || !tag.lessonId || !tag.difficulty
}

function dropReason(tag) {
    if (!tag) return null
    if (tag.duplicate === "bank") return "it is already in the question bank"
    if (tag.duplicate === "paper") return "it repeats an earlier question in the same paper"
    if (tag.duplicate === "upload") return `it repeats ${tag.duplicateOf ?? "a question in another uploaded paper"}`
    return null
}

// The AI check disagrees with the keyed answer and the admin has not decided.
function aiFlag(paper, num) {
    const check = paper.checks?.[num]
    if (!check || check.resolved || !check.answer) return null
    return check.answer !== paper.answers[num] ? check : null
}

function problemWith(question, paper) {
    const tag = paper.tags[question.num]
    const type = paper.types[question.num] ?? "MCQ"
    const answer = paper.answers[question.num]
    if (dropReason(tag)) return `dropped: ${dropReason(tag)}`
    if (!tag?.lessonId) return "no lesson"
    if (!tag?.difficulty) return "no difficulty"
    if (!answer) return "no correct answer"
    if (aiFlag(paper, question.num)) return `the AI thinks the answer is ${paper.checks[question.num].answer}, not ${answer} -- confirm one`
    if (isWritten(question, paper)) return null
    if (question.options.length < 2) return "choices were not read"
    if (!question.options.some((option) => option.key === answer)) {
        return `the answer key says ${answer}, but choice ${answer} was not read -- check the choices against the original`
    }
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
    const context = question.context ? `${question.context}\n\n` : ""
    return `${context}${question.stem}${source}`
}

async function saveOne(question, paper, certificationId, ownerDepartmentId) {
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
    }, ownerDepartmentId ?? undefined)

    if (type === "MCQ") {
        await Promise.all(question.options.map(async (option) => {
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
        }))
    } else {
        const correct = question.options.find((option) => option.key === answer)
        await saveTextQuestion({
            questionId: saved.questionId,
            correctAnswer: correct ? correct.text : answer,
            checkingMethod: type === "SHORT_ANSWER" ? "EXACT_MATCH" : "AI_SEMANTIC",
            ...(type === "SHORT_ANSWER" ? { acceptedVariations: null } : {}),
        })
    }
}

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

const SheetPaper = memo(function SheetPaper({ paper, showName, onJump }) {
    return (
        <div className="mb-4">
            {showName ? (
                <p className="mb-2 truncate text-xs font-semibold text-foreground">{paper.name.replace(/\.pdf$/i, "")}</p>
            ) : null}
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5 lg:grid-cols-4">
                {answered(paper).map((question) => {
                    const answer = paper.answers[question.num]
                    const flagged = aiFlag(paper, question.num)
                    return (
                        <button
                            key={question.num}
                            type="button"
                            onClick={() => onJump(paper.id, question.num)}
                            className={cn(
                                "group relative flex aspect-square flex-col items-center justify-center rounded-lg border bg-background text-primary transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                flagged && "border-amber-400 bg-amber-50 text-amber-800",
                            )}
                            title={flagged ? `Question ${question.num}: key says ${answer}, AI says ${flagged.answer}` : `Question ${question.num}: ${answer}`}
                        >
                            <b className="text-xs leading-none">{question.num}</b>
                            <span className={cn("mt-1 grid size-4 place-items-center rounded-full text-[9px] font-bold leading-none text-white", flagged ? "bg-amber-500" : "bg-emerald-600")}>
                                {answer?.length > 1 ? "✓" : answer}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
})

function ImportGuide({ step = 0 }) {
    const [showNaming, setShowNaming] = useState(false)
    return (
        <section className="mb-4 overflow-hidden rounded-2xl border border-border/80 bg-background shadow-sm">
            <div className="flex flex-col gap-4 px-5 py-5 sm:px-6 lg:flex-row lg:items-center">
                <div>
                    <h1 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">Import questions</h1>
                    <p className="mt-1 max-w-xl text-sm leading-5 text-muted-foreground">Add papers and their answer keys. One pass on the server scans every page, checks the answers and tags each question -- you can leave while it runs, and stop it any time.</p>
                </div>
                <ol className="flex shrink-0 overflow-hidden rounded-lg border bg-muted/20 lg:ml-auto" aria-label="Import steps">
                    {[["1", "Upload"], ["2", "Scan & tag"], ["3", "Review & save"]].map(([number, label], index) => (
                        <li key={number} className={cn("flex items-center gap-2 px-3 py-2 text-xs font-medium", index && "border-l")}>
                            <span className={cn("grid size-5 place-items-center rounded-full text-[10px] font-bold", index <= step ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground")}>{number}</span>
                            {label}
                        </li>
                    ))}
                </ol>
            </div>
            <div className="border-t bg-muted/10 px-5 py-2.5 sm:px-6">
                <button type="button" onClick={() => setShowNaming((o) => !o)} className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
                    {showNaming ? "Hide file requirements" : "File requirements"}
                </button>
            </div>
            {showNaming ? (
                <div className="border-t bg-muted/10 px-5 py-4 sm:px-6">
                    <div className="rounded-xl border bg-background p-3">
                    <p className="text-xs text-muted-foreground">
                        <span className="font-mono">&lt;Title&gt; Questions.pdf</span> and <span className="font-mono">&lt;Title&gt; Answer Key.pdf</span>. Spaces, _ or - work; capitals don&apos;t matter. AM/PM, morning and afternoon are optional labels, not required parts of the title.
                    </p>
                    <div className="mt-1.5 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="text-muted-foreground"><tr><th className="py-0.5 pr-4 font-semibold">Questions</th><th className="py-0.5 font-semibold">Answer key</th></tr></thead>
                            <tbody className="font-mono">
                                {[["Midterm Exam Questions.pdf", "Midterm Exam Answer Key.pdf"], ["2021S_IP_Question.pdf", "2021S_IP_Answer.pdf"], ["October FE Questions.pdf", "October FE PM Answer Key.pdf"]].map(([p, k]) => (
                                    <tr key={p} className="border-t"><td className="py-0.5 pr-4">{p}</td><td className="py-0.5">{k}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">PDF and Word files are accepted. A file with no key is allowed when answers are printed inside it.</p>
                    </div>
                </div>
            ) : null}
        </section>
    )
}

function ExtractionProgress({ progress }) {
    const stage = progress?.stage ?? "preparing"
    const steps = [
        ["preparing", "Prepare file", "Open the PDF and read its text"],
        ["pages", "Read pages", "Collect page text and images"],
        ["layout", "Analyze layout", "Find questions, choices, answers and figures locally"],
        ["organizing", "Build review", "Organize the extracted items for review"],
    ]
    const index = Math.max(0, steps.findIndex(([id]) => id === stage))

    return (
        <section className="overflow-hidden rounded-2xl border border-border/80 bg-background shadow-sm" aria-live="polite">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                <div className="flex items-center gap-2.5"><span className="rb-document-scan" aria-hidden="true"><span /></span><p className="text-sm font-semibold text-foreground">Import activity</p></div>
                <span className="flex items-center gap-1.5 text-xs font-medium text-primary"><Loader2 className="size-3.5 animate-spin" /> Working</span>
            </div>
            <div className="h-1 overflow-hidden bg-muted">
                <div className="h-full bg-primary transition-[width]" style={{ width: `${progress.percent}%` }} />
            </div>
            <div className="p-4">
            <ol className="grid gap-2 sm:grid-cols-2">
                {steps.map(([id, title, detail], stepIndex) => {
                    const complete = stepIndex < index
                    const active = stepIndex === index
                    return (
                        <li key={id} className={cn("flex items-start gap-2 text-xs", complete ? "text-emerald-700" : active ? "text-foreground" : "text-muted-foreground")}>
                            {complete ? <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" /> : active ? <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin text-primary" /> : <span className="mt-0.5 grid size-3.5 shrink-0 place-items-center rounded-full border text-[8px]">{stepIndex + 1}</span>}
                            <span><b>{title}</b><span className="block text-muted-foreground">{detail}</span></span>
                        </li>
                    )
                })}
            </ol>
            <p className="mt-4 text-sm font-medium text-foreground">{progress.label}</p>
            {progress?.page ? (
                <div className="mt-2 rounded-lg border bg-muted/20 px-3 py-2 font-mono text-xs">
                    <p className="text-foreground">page {progress.page} of {progress.total} · {progress.lines ?? 0} lines read</p>
                    {progress.preview ? <p className="mt-1 line-clamp-2 leading-5 text-muted-foreground">{progress.preview}</p> : null}
                </div>
            ) : null}
            {stage === "layout" ? <p className="mt-1 text-xs text-muted-foreground">Large or scanned papers can take a few minutes on the first local run. Keep this tab open; no hosted AI request is being used.</p> : null}
            </div>
        </section>
    )
}

function CropableImage({ src, alt, questionNum, choiceKeys, onCrop }) {
    const containerRef = useRef(null)
    const imgRef = useRef(null)
    const [drag, setDrag] = useState(null)
    const [sel, setSel] = useState(null)

    function rel(e) {
        const r = containerRef.current.getBoundingClientRect()
        return {
            x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
            y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
        }
    }
    function onDown(e) {
        if (e.button !== 0) return
        setSel(null)
        const p = rel(e)
        setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y })
        containerRef.current.setPointerCapture(e.pointerId)
    }
    function onMove(e) {
        if (!drag) return
        const p = rel(e)
        setDrag((d) => ({ ...d, x1: p.x, y1: p.y }))
    }
    function onUp() {
        if (!drag) return
        const w = Math.abs(drag.x1 - drag.x0)
        const h = Math.abs(drag.y1 - drag.y0)
        if (w > 0.02 && h > 0.02) setSel({ x: Math.min(drag.x0, drag.x1), y: Math.min(drag.y0, drag.y1), w, h })
        setDrag(null)
    }
    function assign(target) {
        if (!sel || !imgRef.current) return
        const img = imgRef.current
        const canvas = document.createElement("canvas")
        canvas.width = Math.round(sel.w * img.naturalWidth)
        canvas.height = Math.round(sel.h * img.naturalHeight)
        const ctx = canvas.getContext("2d")
        ctx.fillStyle = "#fff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(
            img,
            Math.round(sel.x * img.naturalWidth), Math.round(sel.y * img.naturalHeight),
            canvas.width, canvas.height,
            0, 0, canvas.width, canvas.height,
        )
        onCrop(target, canvas)
        setSel(null)
    }

    const box = drag ?? (sel && { x0: sel.x, y0: sel.y, x1: sel.x + sel.w, y1: sel.y + sel.h })
    return (
        <figure className="my-2 rounded-lg border bg-white p-2 text-center">
            <div
                ref={containerRef}
                className="relative inline-block cursor-crosshair select-none"
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
            >
                <img ref={imgRef} src={src} alt={alt} className="block h-auto max-w-full" draggable={false} />
                {box ? (
                    <div
                        className="pointer-events-none absolute border-2 border-primary bg-primary/15"
                        style={{
                            left: `${Math.min(box.x0, box.x1) * 100}%`,
                            top: `${Math.min(box.y0, box.y1) * 100}%`,
                            width: `${Math.abs(box.x1 - box.x0) * 100}%`,
                            height: `${Math.abs(box.y1 - box.y0) * 100}%`,
                        }}
                    />
                ) : null}
                {sel ? (
                    <div
                        className="absolute z-10 flex flex-wrap items-center gap-1 rounded-lg border bg-background px-2 py-1.5 shadow-lg"
                        style={{ left: `${sel.x * 100}%`, top: `${(sel.y + sel.h) * 100}%`, marginTop: 4 }}
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <span className="text-xs font-semibold text-muted-foreground">Assign to</span>
                        {choiceKeys.map((key) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => assign(key)}
                                className="grid size-7 place-items-center rounded-full border-2 border-primary/60 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                            >
                                {key}
                            </button>
                        ))}
                        <button type="button" onClick={() => assign("figure")} className="rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors hover:bg-muted">
                            Figure
                        </button>
                        <button type="button" onClick={() => setSel(null)} aria-label="Cancel crop" className="grid size-6 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ) : null}
            </div>
            {!sel && !drag ? (
                <p className="mt-1 text-center text-[11px] text-muted-foreground">Drag to crop a region, then assign it to a choice or figure</p>
            ) : null}
        </figure>
    )
}

const QuestionCard = memo(function QuestionCard({ question, paper, lessons, duplicate, actions, cardRefs }) {
    const onPick = (num, key) => actions.pick(paper.id, num, key)
    const onTag = (num, change) => actions.tag(paper.id, num, change)
    const onType = (num, value) => actions.type(paper.id, num, value)
    const onInclude = (num, value) => actions.include(paper.id, num, value)
    const onFigures = (num, figureSrcs) => actions.figures(paper.id, num, figureSrcs)
    const onOptionImage = (num, key, canvas) => actions.optionImage(paper.id, num, key, canvas)
    const onImageError = actions.imageError
    const onDelete = (num) => actions.remove(paper.id, num)
    const [draft, setDraft] = useState(null)
    const startEdit = () =>
        setDraft({ stem: question.stem, texts: Object.fromEntries(question.options.map((o) => [o.key, o.text || ""])) })
    const saveEdit = () => {
        actions.edit(paper.id, question.num, draft.stem.trim(), draft.texts)
        setDraft(null)
    }
    const cardRef = (node) => { cardRefs.current[`${paper.id}-${question.num}`] = node }
    const [showOriginal, setShowOriginal] = useState(true)
    const check = paper.checks?.[question.num]
    const flagged = aiFlag(paper, question.num)
    const written = isWritten(question, paper)
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
                "rounded-2xl border border-border/80 bg-background p-4 shadow-sm [contain-intrinsic-size:auto_480px] [content-visibility:auto] sm:p-5",
                !included && "opacity-60",
            )}
        >
            <div className="mb-4 flex flex-col gap-3 border-b border-border/70 pb-3 sm:flex-row sm:items-start">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">{question.num}</span>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold">Question {question.num}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Page {question.pages.join("–")}
                            {question.figureSrcs.length ? ` · ${question.figureSrcs.length} figure${question.figureSrcs.length > 1 ? "s" : ""}` : ""}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                            {question.type ? (
                                <Badge variant="outline" className="gap-1 border-primary/30 text-[10px] text-primary" title="Question type decided by AI from the page">
                                    <Sparkles className="h-3 w-3" /> AI: {AI_TYPE_LABEL[question.type] ?? question.type}
                                    {["programming", "diagram"].includes(question.type) ? " (saved as descriptive)" : ""}
                                </Badge>
                            ) : null}
                            {question.parent ? (
                                <Badge variant="outline" className="text-[10px]">Sub-question of {question.parent}</Badge>
                            ) : null}
                            {question.hasImage ? (
                                <Badge variant="outline" className="border-sky-300 text-[10px] text-sky-700">Needs its image</Badge>
                            ) : null}
                            {check && !flagged && check.answer && check.answer === answer ? (
                                <Badge variant="outline" className="gap-1 border-emerald-300 text-[10px] text-emerald-700">
                                    <CheckCircle2 className="h-3 w-3" /> AI agrees
                                </Badge>
                            ) : null}
                        </div>
                    </div>
                    {saved ? (
                        <Badge variant="secondary" className="mt-0.5 gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Saved
                        </Badge>
                    ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <TypeToggle value={type} onChange={(value) => onType(question.num, value)} />
                    {draft ? null : (
                        <Button type="button" size="xs" variant="outline" onClick={startEdit} aria-label={`Edit question ${question.num}`}>
                            <Pencil className="h-3 w-3" /> Edit
                        </Button>
                    )}
                    <button
                        type="button"
                        className="text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
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
            </div>

            <div className={cn(showOriginal && question.snapSrcs.length && "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-5")}>
            <div className="min-w-0">
            {flagged ? (
                <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                    <p className="flex items-start gap-2">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                            {answer ? (
                                <>The key says <b>{answer}</b>, but the AI thinks it is <b>{flagged.answer}</b></>
                            ) : (
                                <>No answer in the key. The AI suggests <b>{flagged.answer}</b></>
                            )}
                            {" "}({flagged.confidence} confidence). {flagged.reason}
                        </span>
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 pl-6">
                        <Button type="button" size="xs" onClick={() => actions.acceptAi(paper.id, question.num)}>
                            Use {flagged.answer}
                        </Button>
                        {answer ? (
                            <Button type="button" size="xs" variant="outline" onClick={() => actions.keepKey(paper.id, question.num)}>
                                Keep {answer}
                            </Button>
                        ) : null}
                    </div>
                </div>
            ) : null}
            {question.missingImage && !question.figureSrcs.length ? (
                <p className="mb-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                        This question refers to a picture or table that was not cut out. Drag over it on the original page to add it as a figure.
                    </span>
                </p>
            ) : null}
            {check?.before ? (
                <div className="mb-3 flex flex-wrap items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-2 text-xs text-sky-900">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1">AI fixed the wording: {check.fixes?.length ? check.fixes.join("; ") : "misread text repaired"}.</span>
                    <Button type="button" size="xs" variant="outline" onClick={() => actions.undoFix(paper.id, question.num)}>
                        Undo
                    </Button>
                </div>
            ) : null}
            {answer && question.options.length && !question.options.some((option) => option.key === answer) ? (
                <p className="mb-3 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-2 text-sm text-destructive">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                        The answer key says <b>{answer}</b>, but only choices {question.options.map((option) => option.key).join(", ")} were
                        read. Compare with Show original, then use Edit → Add choice for the missing one, or click the right choice.
                    </span>
                </p>
            ) : null}

            {duplicate ? (
                <p className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span className="flex-1">Duplicate: {duplicate}.</span>
                    <Button type="button" size="xs" variant="outline" onClick={() => onDelete(question.num)}>
                        <Trash2 className="h-3 w-3" /> Delete
                    </Button>
                </p>
            ) : null}

            {draft ? (
                <div className="mb-3 space-y-3 rounded-xl border-2 border-primary/40 bg-primary/5 p-3">
                    <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-muted-foreground">Question</span>
                        <Textarea
                            value={draft.stem}
                            rows={Math.min(12, Math.max(3, Math.ceil(draft.stem.length / 90)))}
                            onChange={(event) => setDraft((d) => ({ ...d, stem: event.target.value }))}
                            className="bg-background font-serif"
                        />
                    </label>
                    {[
                        ...question.options,
                        ...Object.keys(draft.texts)
                            .filter((key) => !question.options.some((option) => option.key === key))
                            .sort()
                            .map((key) => ({ key, text: draft.texts[key], imageSrc: null })),
                    ].map((option) => (
                        <label key={option.key} className="flex items-center gap-2">
                            <span className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-primary/60 text-xs font-bold text-primary">
                                {option.key}
                            </span>
                            {option.imageSrc ? (
                                <span className="text-xs text-muted-foreground">Picture choice -- change it with Replace below.</span>
                            ) : (
                                <Input
                                    value={draft.texts[option.key] ?? ""}
                                    aria-label={`Choice ${option.key}`}
                                    onChange={(event) =>
                                        setDraft((d) => ({ ...d, texts: { ...d.texts, [option.key]: event.target.value } }))
                                    }
                                    className="bg-background"
                                />
                            )}
                        </label>
                    ))}
                    <div className="flex justify-end gap-2">
                        {Object.keys(draft.texts).length < 8 ? (
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="mr-auto"
                                onClick={() =>
                                    setDraft((d) => {
                                        const keys = [...new Set([...question.options.map((o) => o.key), ...Object.keys(d.texts)])].sort()
                                        const last = keys.at(-1) ?? ""
                                        const nextKey = /^\d+$/.test(last) ? String(Number(last) + 1) : String.fromCharCode((last || "`").charCodeAt(0) + 1)
                                        return { ...d, texts: { ...d.texts, [nextKey]: "" } }
                                    })
                                }
                            >
                                <Plus className="h-3 w-3" /> Add choice
                            </Button>
                        ) : null}
                        <Button type="button" size="sm" variant="ghost" onClick={() => setDraft(null)}>
                            Cancel
                        </Button>
                        <Button type="button" size="sm" disabled={!draft.stem.trim()} onClick={saveEdit}>
                            Save changes
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    {question.context ? (
                        <div className="mb-3 max-w-[72ch] rounded-lg border-l-4 border-primary/30 bg-muted/40 px-3 py-2 text-sm leading-relaxed">
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                Shared scenario{question.parent ? ` · question ${question.parent}` : ""}
                            </p>
                            <p className="whitespace-pre-line font-serif">{question.context}</p>
                        </div>
                    ) : null}
                    <p className="mb-3 max-w-[72ch] whitespace-pre-line font-serif text-[1.05rem] leading-relaxed">
                        {question.stem}
                    </p>
                </>
            )}

            {question.figureSrcs.map((src, index) => (
                <div key={`${index}-${src.length}`} className="group relative my-3">
                    <div className="absolute right-2 top-2 z-20">
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
                    <CropableImage
                        src={src}
                        alt={`Figure ${index + 1} for question ${question.num}`}
                        questionNum={question.num}
                        choiceKeys={question.options.map((o) => o.key)}
                        onCrop={(target, canvas) => {
                            if (target === "figure") {
                                onFigures(question.num, [...question.figureSrcs, srcOf(canvas)])
                            } else {
                                onOptionImage(question.num, target, canvas)
                            }
                        }}
                    />
                </div>
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

            {type !== "MCQ" ? (
                <div className="mt-3 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        {type === "SHORT_ANSWER" ? "Learner types a short answer" : "Learner writes an answer"}
                    </p>
                    <div className="mt-2 rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground">Their answer…</div>
                    {written ? (
                        <label className="mt-2 block text-sm">
                            {type === "SHORT_ANSWER" ? "Marked correct when it matches:" : "Model answer (AI marks against it):"}
                            <Textarea
                                value={answer ?? ""}
                                rows={type === "SHORT_ANSWER" ? 1 : 4}
                                placeholder={type === "SHORT_ANSWER" ? "The expected answer" : "The model answer from the key"}
                                onChange={(event) => actions.answerText(paper.id, question.num, event.target.value)}
                                className="mt-1 bg-background"
                            />
                        </label>
                    ) : (
                    <p className="mt-2 text-sm">
                        {type === "SHORT_ANSWER" ? "Marked correct when it matches: " : "Marked by AI against: "}
                        {(() => {
                            const correct = question.options.find((option) => option.key === answer)
                            if (!correct) return <em className="text-destructive">no answer chosen yet -- pick one of the choices below</em>
                            if (!correct.text) return <em className="text-destructive">the correct choice is a picture, so there is no text to match -- keep this one as Multiple choice</em>
                            return <strong>{correct.text}</strong>
                        })()}
                    </p>
                    )}
                </div>
            ) : null}
            {type !== "MCQ" && question.options.length ? (
                <p className="mt-3 text-xs font-semibold text-muted-foreground">
                    Choices from the paper -- not shown to learners. Click one to make it the answer.
                </p>
            ) : null}

            <ul
                className={cn(
                    "mt-3 gap-2",
                    pictures || question.options.every((option) => (option.text || "").length <= 40)
                        ? "grid grid-cols-1 sm:grid-cols-2"
                        : "grid",
                    type !== "MCQ" && "mt-1 text-sm opacity-80",
                    draft && "hidden",
                )}
            >
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

            </div>
            {showOriginal && question.snapSrcs.length ? (
                <aside className="mt-4 max-h-[80vh] self-start overflow-auto rounded-xl border bg-muted/20 p-2 lg:sticky lg:top-4 lg:mt-0">
                    <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Original page</p>
                    {question.snapSrcs.map((src, index) => (
                        <CropableImage
                            key={index}
                            src={src}
                            alt={`Question ${question.num} as printed`}
                            questionNum={question.num}
                            choiceKeys={question.options.map((o) => o.key)}
                            onCrop={(target, canvas) => {
                                if (target === "figure") {
                                    onFigures(question.num, [...question.figureSrcs, srcOf(canvas)])
                                } else {
                                    onOptionImage(question.num, target, canvas)
                                }
                            }}
                        />
                    ))}
                </aside>
            ) : null}
            </div>

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
})

/**
 * Imports questions from exam papers and answer keys (PDF or Word) into a certification's
 * question bank. Shared by the admin and by departments: with {@code ownerDepartmentId}
 * every saved question belongs to that department, and the draft and tagging job are kept
 * apart from the admin's and other departments' imports of the same certification.
 */
export default function QuestionImportWorkspace({ certificationId, ownerDepartmentId = null, exitPath }) {
    const navigate = useNavigate()
    const location = useLocation()
    const draftKey = ownerDepartmentId != null
        ? `${certificationId}:dept:${ownerDepartmentId}`
        : String(certificationId)
    const keyInputRef = useRef(null)
    const keyTargetRef = useRef(null)
    const cardRefs = useRef({})

    const [papers, setPapers] = useState([])
    const [keys, setKeys] = useState([])
    const [failures, setFailures] = useState([])
    const [progress, setProgress] = useState(null)
    const [filter, setFilter] = useState("all")
    const [currentPaperId, setCurrentPaperId] = useState(null)
    const [term, setTerm] = useState("")
    const [keyBoxFor, setKeyBoxFor] = useState(null)
    const [keyText, setKeyText] = useState("")
    const [uploadOpen, setUploadOpen] = useState(false)
    const [startOverOpen, setStartOverOpen] = useState(false)
    const [lessons, setLessons] = useState([])
    const [tagJob, setTagJob] = useState(null)
    const [starting, setStarting] = useState(false)
    const tagging = starting || tagJob?.status === "running"
    const [notice, setNotice] = useState(null)
    const [previewOpen, setPreviewOpen] = useState(false)
    const [duplicatesOpen, setDuplicatesOpen] = useState(false)
    const [saving, setSaving] = useState(null)
    const [importJob, setImportJob] = useState(null)
    const [upload, setUpload] = useState(null)
    const [building, setBuilding] = useState(null)
    const [stopping, setStopping] = useState(false)
    const uploadAbort = useRef(null)
    const assembling = useRef(new Set())
    const importing = Boolean(upload) || ["uploading", "running"].includes(importJob?.status)

    const { data: certifications = [] } = useQuery({
        queryKey: ["admin-certifications", "question-bank-page"],
        queryFn: () => getAllCertifications(undefined, { summary: true }),
        staleTime: 5 * 60 * 1000,
    })
    const certification = certifications.find(
        (item) => String(item.certificationId ?? item.id) === String(certificationId),
    )

    const busy = progress !== null || importing

    const [restored, setRestored] = useState(false)
    const written = useRef(new Map())
    useEffect(() => {
        let cancelled = false
        setRestored(false)
        loadDraft(draftKey).then((draft) => {
            if (cancelled) return
            if (draft?.papers.length && !latest.current.papers.length) {
                latest.current = { papers: draft.papers, keys: draft.keys }
                setPapers(draft.papers)
                setKeys(draft.keys)
                setLessons(draft.lessons)
                written.current = new Map(draft.papers.map((paper) => [paper.id, paper]))
                const count = draft.papers.reduce((sum, paper) => sum + paper.questions.length, 0)
                setNotice({
                    kind: "ok",
                    text: `Restored your import: ${count} questions in ${draft.papers.length} paper${draft.papers.length === 1 ? "" : "s"}, as you left them.`,
                })
            }
            setRestored(true)
        })
        return () => {
            cancelled = true
        }
    }, [draftKey])
    useEffect(() => {
        if (!restored) return undefined
        const timer = setTimeout(() => {
            const changed = papers.filter((paper) => written.current.get(paper.id) !== paper)
            const ids = new Set(papers.map((paper) => paper.id))
            const removed = [...written.current.keys()].filter((id) => !ids.has(id))
            saveDraft(draftKey, { changed, removed, order: [...ids], keys, lessons }).then((ok) => {
                if (!ok) return
                for (const paper of changed) written.current.set(paper.id, paper)
                for (const id of removed) written.current.delete(id)
            })
        }, 800)
        return () => clearTimeout(timer)
    }, [draftKey, papers, keys, lessons, restored])

    function startOver() {
        setStartOverOpen(false)
        latest.current = { papers: [], keys: [] }
        setPapers([])
        setKeys([])
        setFailures([])
        setNotice(null)
        written.current = new Map()
        clearDraft(draftKey)
        if (importJob) {
            uploadAbort.current?.abort()
            discardImportJob(importJob.id).catch(() => {})
            forgetJob(importJob.id)
            clearJobFiles(importJob.id)
            setImportJob(null)
        }
    }

    const latest = useRef({ papers, keys })
    latest.current = { papers, keys }

    function updatePaper(id, change) {
        setPapers((current) => current.map((p) => (p.id === id ? { ...p, ...change(p) } : p)))
    }

    function updateQuestion(paperId, num, change) {
        updatePaper(paperId, (p) => ({
            questions: p.questions.map((q) => (q.num === num ? { ...q, ...change(q) } : q)),
        }))
    }

    // Second AI pass: judge every answer and repair misread wording. Repairs are
    // applied with the original kept for undo; disagreements block saving
    // until the admin picks an answer.
    async function runAiCheck(paperId) {
        const paper = latest.current.papers.find((p) => p.id === paperId)
        if (!paper?.questions.length) return
        updatePaper(paperId, () => ({ checking: true }))
        try {
            const payload = paper.questions
                .filter((q) => q.options.length >= 2)
                .map((q) => ({
                    id: String(q.num),
                    stem: q.stem,
                    context: q.context || null,
                    options: q.options.map((o) => ({ key: o.key, text: o.text || "" })),
                    answer: paper.answers[q.num] || null,
                }))
            const { results = [], failedBatches = 0 } = await checkQuestions(payload)
            const byNum = new Map(results.map((r) => [r.id, r]))
            updatePaper(paperId, (p) => {
                const checks = { ...(p.checks || {}) }
                const questions = p.questions.map((q) => {
                    const r = byNum.get(String(q.num))
                    if (!r) return q
                    const fixed = Boolean(r.stem || Object.keys(r.options || {}).length)
                    checks[q.num] = {
                        answer: r.answer,
                        confidence: r.confidence,
                        reason: r.reason,
                        fixes: fixed ? r.fixes : [],
                        before: fixed ? { stem: q.stem, texts: Object.fromEntries(q.options.map((o) => [o.key, o.text])) } : null,
                        resolved: false,
                    }
                    if (!fixed) return q
                    return {
                        ...q,
                        stem: r.stem || q.stem,
                        options: q.options.map((o) => (r.options?.[o.key] ? { ...o, text: r.options[o.key] } : o)),
                    }
                })
                return { questions, checks, checking: false }
            })
            const flagged = results.filter((r) => r.answer && r.answer !== paper.answers[r.id]).length
            const fixed = results.filter((r) => r.stem || Object.keys(r.options || {}).length).length
            setNotice({
                kind: flagged || failedBatches ? "warn" : "ok",
                text: `${paper.name}: AI checked ${results.length} questions -- ${flagged} answer${flagged === 1 ? "" : "s"} to confirm, ${fixed} wording fix${fixed === 1 ? "" : "es"} applied (each can be undone).${failedBatches ? ` ${failedBatches} batch(es) could not be checked; run the check again.` : ""}`,
            })
        } catch (error) {
            updatePaper(paperId, () => ({ checking: false }))
            setNotice({ kind: "warn", text: `${paper.name}: the AI answer check failed (${error?.response?.data?.message || error?.message || error}). Run it again with "Check with AI".` })
        }
    }

    async function addKeyForPaper(file, target) {
        setProgress({ label: `Reading answer key ${file.name}`, percent: 30, stage: "pages", startedAt: Date.now() })
        try {
            const read = await readExamPdf(await asPdf(file), null, readDocumentLayout, readDocumentPage)
            const answers = answersOf(read)
            if (!Object.keys(answers).length) {
                setNotice({ kind: "error", text: `No answers could be read from ${file.name}. Is it the answer key? You can also paste the key instead.` })
                return
            }
            const result = { name: read.name, info: read.info, answers, count: Object.keys(answers).length }
            const fileId = `${file.name}:${file.size}`
            const key = { id: `${fileId}:${Date.now()}`, fileId, name: result.name, info: result.info, answers: result.answers, count: result.count, paperId: target.id }
            setKeys((current) => [
                ...current.map((k) => (k.paperId === target.id ? { ...k, paperId: null } : k)).filter((k) => k.fileId !== fileId),
                key,
            ])
            updatePaper(target.id, () => ({ answers: { ...result.answers }, keyName: result.name }))
            runAiCheck(target.id)

            const fits = target.questions.filter((q) => result.answers[q.num]).length
            const warnings = []
            if (matchScore(result.info, target.info) === 0) {
                warnings.push(`its exam date (${describeExam(result.info) || "unknown"}) is not the paper's (${describeExam(target.info) || "unknown"})`)
            }
            if (fits < target.questions.length) {
                warnings.push(`it gives answers for ${fits} of the paper's ${target.questions.length} questions`)
            }
            setKeyBoxFor(null)
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

    // ---- One server job: read pages -> read answer key -> check -> tag ----
    //
    // The browser only renders the pages (free) and uploads them. Every paid
    // step runs on the server, so closing the tab, logging out or refreshing
    // does not stop it, and "Stop" cancels all of it at once.

    async function addFiles(pairList) {
        const loaded = new Set(latest.current.papers.map((p) => p.fileId))
        const pairs = pairList.filter((pair) => !loaded.has(`${pair.paper.name}:${pair.paper.size}`))
        if (!pairs.length) {
            setNotice({ kind: "warn", text: "Those papers are already in this import." })
            return
        }
        setFailures([])
        setNotice(null)
        askForNotifications()
        const controller = new AbortController()
        uploadAbort.current = controller
        setUpload({ label: "Preparing the files", done: 0, total: 0 })
        let job = null
        try {
            const prepared = []
            for (const pair of pairs) {
                if (controller.signal.aborted) throw new DOMException("Stopped", "AbortError")
                setUpload({ label: `Preparing ${pair.paper.name}`, done: 0, total: 0 })
                try {
                    const paperPdf = await asPdf(pair.paper)
                    const keyPdf = pair.key ? await asPdf(pair.key) : null
                    prepared.push({
                        id: `${pair.paper.name}:${pair.paper.size}:${Date.now()}`,
                        paperPdf,
                        keyPdf,
                        pages: await countPages(paperPdf),
                        keyPages: keyPdf ? await countPages(keyPdf) : 0,
                        keyName: pair.key?.name ?? null,
                    })
                } catch (error) {
                    setFailures((current) => [...current, { name: pair.paper.name, error: error?.message || String(error) }])
                }
            }
            if (!prepared.length) return

            job = await createImportJob(
                certificationId,
                draftKey,
                prepared.map((item) => ({
                    paperId: item.id,
                    name: item.paperPdf.name,
                    keyName: item.keyName,
                    pages: item.pages,
                    keyPages: item.keyPages,
                })),
            )
            addActiveJob({ id: job.id, kind: "import", certificationId: draftKey, title: certification?.title ?? "", page: location.pathname })
            setImportJob(job)

            const total = prepared.reduce((sum, item) => sum + item.pages + item.keyPages, 0)
            let done = 0
            for (const [index, item] of prepared.entries()) {
                await saveJobFile(job.id, index, "paper", item.paperPdf)
                if (item.keyPdf) await saveJobFile(job.id, index, "key", item.keyPdf)
                for (const [role, file] of [["paper", item.paperPdf], ["key", item.keyPdf]]) {
                    if (!file) continue
                    await renderPagePayloads(
                        file,
                        async (payload) => {
                            await uploadImportPage(job.id, { paper: index, role, ...payload }, controller.signal)
                            done += 1
                            setUpload({ label: `Uploading ${file.name}`, done, total })
                        },
                        controller.signal,
                    )
                }
            }
            if (controller.signal.aborted) throw new DOMException("Stopped", "AbortError")
            setImportJob(await startImportJob(job.id))
        } catch (error) {
            const stopped = controller.signal.aborted || error?.name === "AbortError" || error?.name === "CanceledError"
            if (job) {
                cancelImportJob(job.id).then(setImportJob).catch(() => {})
            }
            setNotice(
                stopped
                    ? { kind: "warn", text: "Import stopped. Nothing was read, so no AI credits were used." }
                    : { kind: "error", text: `The import could not be started: ${error?.response?.data?.message || error?.message || error}` },
            )
        } finally {
            uploadAbort.current = null
            setUpload(null)
        }
    }

    async function stopEverything() {
        setStopping(true)
        try {
            uploadAbort.current?.abort()
            const jobs = []
            if (importJob && ["uploading", "running"].includes(importJob.status)) {
                jobs.push(cancelImportJob(importJob.id).then(setImportJob))
            }
            if (tagJob?.status === "running") {
                jobs.push(cancelTagJob(tagJob.id).then(setTagJob))
            }
            await Promise.allSettled(jobs)
        } finally {
            setStopping(false)
        }
    }

    async function resumeImport() {
        if (!importJob) return
        try {
            setImportJob(await startImportJob(importJob.id))
            addActiveJob({ id: importJob.id, kind: "import", certificationId: draftKey, title: certification?.title ?? "", page: location.pathname })
            setNotice(null)
        } catch (error) {
            setNotice({ kind: "error", text: error?.response?.data?.message || error?.message || "The import could not be resumed." })
        }
    }

    // A paper the server has finished: replay its page reads over the local
    // PDF (to cut the figures), then lay on the answer key, check and tags.
    async function assemblePaper(job, index) {
        const entry = job.papers[index]
        const result = await getImportJobResult(job.id, index)
        const paperFile = await loadJobFile(job.id, index, "paper")
        if (!paperFile) {
            throw new Error("its PDF is not stored in this browser (it was uploaded from another device). Add the file again here")
        }
        const read = await readExamPdf(paperFile, null, readDocumentLayout, serverReads(result.paper))
        if (read.kind === "key") {
            throw new Error("it is named as questions, but it reads as an answer key -- rename it to end in \"Answer Key\"")
        }
        let answers = answersOf(read)
        let keyEntry = null
        if (entry.pages.key) {
            const keyFile = await loadJobFile(job.id, index, "key")
            if (keyFile) {
                try {
                    const key = await readExamPdf(keyFile, null, readDocumentLayout, serverReads(result.key))
                    const keyAnswers = answersOf(key)
                    answers = { ...answers, ...keyAnswers }
                    keyEntry = {
                        id: `${keyFile.name}:${keyFile.size}:${Date.now()}`,
                        fileId: `${keyFile.name}:${keyFile.size}`,
                        name: entry.keyName || keyFile.name,
                        info: key.info,
                        answers: keyAnswers,
                        count: Object.keys(keyAnswers).length,
                        paperId: entry.paperId,
                    }
                } catch (error) {
                    setFailures((current) => [...current, { name: entry.keyName || "answer key", error: error?.message || String(error) }])
                }
            }
        }
        const paper = buildPaper(read, answers, keyEntry ? keyEntry.name : null, entry.paperId)
        const checks = applyCheckResults(paper, result.checks?.results ?? [])
        Object.assign(paper, checks)

        const seen = new Map()
        for (const other of latest.current.papers) {
            for (const question of other.questions) {
                const print = questionPrint(question)
                if (print && !seen.has(print)) seen.set(print, `${other.name} Q${question.num}`)
            }
        }
        const byNum = new Map(paper.questions.map((q) => [String(q.num), q]))
        ;(result.tags?.nums ?? []).forEach((num, position) => {
            const question = byNum.get(String(num))
            if (!question) return
            const tag = { ...(result.tags.tags[position] ?? {}) }
            const print = questionPrint(question)
            if (!tag.duplicate && print && seen.has(print)) {
                tag.duplicate = "upload"
                tag.duplicateOf = seen.get(print)
            }
            if (print && !seen.has(print)) seen.set(print, `${paper.name} Q${question.num}`)
            paper.tags[question.num] = tag
            paper.include[question.num] = !dropReason(tag)
            if (tag.duplicate === "bank" || tag.duplicate === "paper") paper.duplicates[question.num] = tag.duplicate
        })
        return { paper, keyEntry, failedChecks: result.checks?.failedBatches ?? 0 }
    }

    async function applyImportJob(job) {
        if (job.lessons?.length) setLessons(job.lessons)
        const applied = appliedPapers(job.id)
        for (const [index, entry] of job.papers.entries()) {
            if (entry.stage !== "done" || applied.has(entry.paperId) || assembling.current.has(entry.paperId)) continue
            assembling.current.add(entry.paperId)
            setBuilding(entry.name)
            try {
                const { paper, keyEntry, failedChecks } = await assemblePaper(job, index)
                if (!latest.current.papers.some((p) => p.id === paper.id)) {
                    latest.current = {
                        papers: [...latest.current.papers, paper],
                        keys: keyEntry ? [...latest.current.keys, keyEntry] : latest.current.keys,
                    }
                    setPapers(latest.current.papers)
                    setKeys(latest.current.keys)
                }
                if (failedChecks) {
                    setNotice({ kind: "warn", text: `${paper.name}: part of the AI answer check failed. Run "Check with AI" to finish it.` })
                }
            } catch (error) {
                setFailures((current) => [...current, { name: entry.name, error: error?.message || String(error) }])
            } finally {
                markApplied(job.id, [entry.paperId])
                assembling.current.delete(entry.paperId)
                setBuilding(null)
            }
        }
    }

    useEffect(() => {
        if (!importJob || !restored) return undefined
        let stopped = false
        const finished = !["uploading", "running"].includes(importJob.status)
        applyImportJob(importJob).then(async () => {
            if (stopped || !finished) return
            while (assembling.current.size) await new Promise((resolve) => setTimeout(resolve, 500))
            const ready = importJob.papers.filter((entry) => entry.stage === "done").length
            const questions = importJob.papers.reduce((sum, entry) => sum + (entry.stage === "done" ? entry.questions : 0), 0)
            if (importJob.status === "done") {
                const failedPapers = importJob.papers.filter((entry) => entry.stage === "failed").length
                const text = `Import finished: ${questions} questions from ${ready} paper${ready === 1 ? "" : "s"}, read, checked and tagged.${failedPapers ? ` ${failedPapers} paper${failedPapers === 1 ? "" : "s"} could not be read.` : ""}`
                setNotice({ kind: failedPapers ? "warn" : "ok", text })
                notify("REBYU import finished", text)
            } else if (importJob.status === "cancelled") {
                setNotice({ kind: "warn", text: `Import stopped. No more AI credits are being used.${ready ? ` The ${ready} paper${ready === 1 ? "" : "s"} finished before that ${ready === 1 ? "is" : "are"} kept below.` : ""}` })
            } else if (importJob.status !== "interrupted") {
                setNotice({ kind: "error", text: importJob.error || "The import stopped." })
            }
            if (importJob.status !== "interrupted") {
                forgetJob(importJob.id)
                clearJobFiles(importJob.id)
            }
        })
        if (finished) return () => { stopped = true }
        const timer = setInterval(async () => {
            try {
                setImportJob(await getImportJob(importJob.id))
            } catch (error) {
                if (error?.response?.status === 404) {
                    forgetJob(importJob.id)
                    setImportJob(null)
                }
            }
        }, 4000)
        return () => {
            stopped = true
            clearInterval(timer)
        }
    }, [importJob, restored])

    // Back on the page (after leaving, a refresh or a new login): pick the job up.
    useEffect(() => {
        if (!restored) return
        const active = activeJobFor(draftKey, "import")
        const pick = (job) => job && setImportJob(job)
        if (active) {
            getImportJob(active.id).then(pick).catch(() => forgetJob(active.id))
            return
        }
        latestImportJob(draftKey)
            .then(({ job }) => {
                if (job && ["uploading", "running", "interrupted"].includes(job.status)) {
                    addActiveJob({ id: job.id, kind: "import", certificationId: draftKey, title: certification?.title ?? "", page: location.pathname })
                    pick(job)
                }
            })
            .catch(() => {})
    }, [restored, draftKey])

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

    async function tagWithAi(onlyMissing = false) {
        const targets = latest.current.papers
            .map((p) => ({ ...p, questions: answered(p).filter((q) => !onlyMissing || needsTag(p, q)) }))
            .filter((p) => p.questions.length)
        if (!targets.length) {
            setNotice({ kind: "error", text: "No question has its answer yet. Add the answer keys first." })
            return
        }
        askForNotifications()
        setStarting(true)
        setNotice(null)
        try {
            const job = await startTagJob(
                certificationId,
                targets.map((target) => ({
                    paperId: target.id,
                    name: target.name,
                    nums: target.questions.map((q) => q.num),
                    questions: target.questions.map(
                        (q) => `${q.stem}\n${q.options.map((o) => `${o.key}) ${o.text || "[picture]"}`).join("\n")}`,
                    ),
                    stems: target.questions.map(duplicateText),
                })),
            )
            addActiveJob({
                id: job.id,
                certificationId: draftKey,
                title: certification?.title ?? "",
                page: location.pathname,
            })
            setTagJob(job)
        } catch (error) {
            setNotice({ kind: "error", text: error?.response?.data?.message || error?.message || "Tagging could not be started." })
        } finally {
            setStarting(false)
        }
    }

    function applyJob(job) {
        if (job.lessons?.length) setLessons(job.lessons)
        const done = appliedPapers(job.id)
        const seen = new Map()
        const fresh = []
        for (const entry of job.papers) {
            if (entry.status !== "done" || !entry.tags) continue
            const target = latest.current.papers.find((p) => p.id === entry.paperId)
            if (!target) continue
            const byNum = new Map(target.questions.map((q) => [String(q.num), q]))
            const isNew = !done.has(entry.paperId)
            const tags = {}
            const include = {}
            entry.nums.forEach((num, position) => {
                const question = byNum.get(String(num))
                if (!question) return
                const tag = { ...(entry.tags[position] ?? {}) }
                const print = questionPrint(question)
                if (!tag.duplicate && print && seen.has(print)) {
                    tag.duplicate = "upload"
                    tag.duplicateOf = seen.get(print)
                }
                if (print && !seen.has(print)) seen.set(print, `${target.name} Q${question.num}`)
                tags[question.num] = tag
                include[question.num] = !dropReason(tag)
            })
            if (isNew) {
                fresh.push(entry.paperId)
                updatePaper(target.id, (p) => ({ tags: { ...p.tags, ...tags }, include: { ...p.include, ...include } }))
            }
        }
        if (fresh.length) markApplied(job.id, fresh)
    }

    function jobSummary(job) {
        const tags = job.papers.flatMap((entry) => entry.tags ?? [])
        const duplicates = tags.filter((tag) => tag.duplicate).length
        const fallback = tags.filter((tag) => tag.source && tag.source !== "ai").length
        const failed = job.papers.filter((entry) => entry.status === "failed").length
        const parts = [`${tags.length} questions tagged.`]
        if (duplicates) parts.push(`${duplicates} dropped as duplicates.`)
        if (fallback) parts.push(`${fallback} could not be tagged by the AI and were matched without it -- set their difficulty.`)
        if (failed) parts.push(`${failed} paper${failed === 1 ? "" : "s"} could not be tagged -- tag again to retry.`)
        return { text: parts.join(" "), warn: Boolean(fallback || failed) }
    }

    useEffect(() => {
        if (!tagJob) return undefined
        if (tagJob.status !== "running") {
            applyJob(tagJob)
            forgetJob(tagJob.id)
            if (tagJob.status === "done") {
                const summary = jobSummary(tagJob)
                setNotice({ kind: summary.warn ? "warn" : "ok", text: summary.text })
                notify("REBYU import: tagging finished", summary.text)
            } else {
                const why = tagJob.status === "cancelled" ? "Tagging was stopped." : tagJob.error || "Tagging stopped."
                setNotice({ kind: "warn", text: `${why} Papers finished before that keep their tags; tag again for the rest.` })
                notify("REBYU import: tagging stopped", why)
            }
            return undefined
        }
        applyJob(tagJob)
        const timer = setInterval(async () => {
            try {
                const job = await getTagJob(tagJob.id)
                if (job.status === "running") applyJob(job)
                setTagJob(job)
            } catch (error) {
                if (error?.response?.status === 404) {
                    forgetJob(tagJob.id)
                    setTagJob(null)
                }
            }
        }, 5000)
        return () => clearInterval(timer)
    }, [tagJob?.id, tagJob?.status])

    useEffect(() => {
        if (!restored) return
        const active = activeJobFor(draftKey)
        if (!active) return
        getTagJob(active.id)
            .then((job) => setTagJob(job))
            .catch(() => forgetJob(active.id))
    }, [restored, draftKey])

    const duplicateReasons = {}
    {
        const firstSeen = new Map()
        for (const item of papers) {
            for (const question of item.questions) {
                const id = `${item.id}-${question.num}`
                const server = item.duplicates?.[question.num]
                if (server === "bank") duplicateReasons[id] = "it is already in this certification's question bank"
                else if (server === "paper") duplicateReasons[id] = "it repeats an earlier question in the same paper"
                const print = questionPrint(question)
                if (!print) continue
                const earlier = firstSeen.get(print)
                if (earlier && !duplicateReasons[id]) {
                    duplicateReasons[id] = `it repeats ${earlier} in this upload`
                } else if (!earlier) {
                    firstSeen.set(print, `${item.name.replace(/\.pdf$/i, "")} Q${question.num}`)
                }
            }
        }
    }

    const duplicateList = papers.flatMap((item) =>
        item.questions
            .filter((question) => duplicateReasons[`${item.id}-${question.num}`])
            .map((question) => ({ paper: item, question, reason: duplicateReasons[`${item.id}-${question.num}`] })),
    )

    function deleteAllDuplicates() {
        const byPaper = new Map()
        for (const { paper: item, question } of duplicateList) {
            byPaper.set(item.id, [...(byPaper.get(item.id) ?? []), question.num])
        }
        for (const [paperId, nums] of byPaper) deleteQuestions(paperId, nums)
        setDuplicatesOpen(false)
        setNotice({ kind: "ok", text: `${duplicateList.length} duplicate${duplicateList.length === 1 ? "" : "s"} deleted. The first copy of each question is kept.` })
    }

    const handlers = useRef(null)
    handlers.current = { updatePaper, updateQuestion, deleteQuestions, setNotice, setFilter, setTerm, setCurrentPaperId, runAiCheck }
    const cardActions = useMemo(
        () => ({
            pick: (paperId, num, key) => handlers.current.updatePaper(paperId, (p) => ({ answers: { ...p.answers, [num]: key } })),
            tag: (paperId, num, change) =>
                handlers.current.updatePaper(paperId, (p) => ({ tags: { ...p.tags, [num]: { ...p.tags[num], ...change } } })),
            type: (paperId, num, value) => handlers.current.updatePaper(paperId, (p) => ({ types: { ...p.types, [num]: value } })),
            include: (paperId, num, value) => handlers.current.updatePaper(paperId, (p) => ({ include: { ...p.include, [num]: value } })),
            figures: (paperId, num, figureSrcs) => handlers.current.updateQuestion(paperId, num, () => ({ figureSrcs })),
            optionImage: (paperId, num, key, canvas) =>
                handlers.current.updateQuestion(paperId, num, (q) => ({
                    options: q.options.map((o) => (o.key === key ? { ...o, imageSrc: canvas ? srcOf(canvas) : null } : o)),
                })),
            answerText: (paperId, num, text) =>
                handlers.current.updatePaper(paperId, (p) => ({ answers: { ...p.answers, [num]: text } })),
            acceptAi: (paperId, num) =>
                handlers.current.updatePaper(paperId, (p) => ({
                    answers: { ...p.answers, [num]: p.checks[num].answer },
                    checks: { ...p.checks, [num]: { ...p.checks[num], resolved: true } },
                })),
            keepKey: (paperId, num) =>
                handlers.current.updatePaper(paperId, (p) => ({ checks: { ...p.checks, [num]: { ...p.checks[num], resolved: true } } })),
            undoFix: (paperId, num) =>
                handlers.current.updatePaper(paperId, (p) => {
                    const before = p.checks?.[num]?.before
                    if (!before) return {}
                    return {
                        questions: p.questions.map((q) =>
                            q.num === num
                                ? { ...q, stem: before.stem, options: q.options.map((o) => (o.key in before.texts ? { ...o, text: before.texts[o.key] } : o)) }
                                : q,
                        ),
                        checks: { ...p.checks, [num]: { ...p.checks[num], before: null, fixes: [] } },
                    }
                }),
            imageError: (error) => handlers.current.setNotice({ kind: "error", text: error?.message || "That image could not be used." }),
            remove: (paperId, num) => handlers.current.deleteQuestions(paperId, [num]),
            edit: (paperId, num, stem, texts) =>
                handlers.current.updateQuestion(paperId, num, (q) => ({
                    stem,
                    options: [
                        ...q.options.map((o) => (o.key in texts ? { ...o, text: texts[o.key] } : o)),
                        ...Object.keys(texts)
                            .filter((key) => !q.options.some((o) => o.key === key) && texts[key].trim())
                            .sort()
                            .map((key) => ({ key, text: texts[key].trim(), image: null, imageSrc: null })),
                    ],
                })),
            jump: (paperId, num) => {
                handlers.current.setFilter("all")
                handlers.current.setTerm("")
                handlers.current.setCurrentPaperId(paperId)
                requestAnimationFrame(() =>
                    requestAnimationFrame(() =>
                        cardRefs.current[`${paperId}-${num}`]?.scrollIntoView({ behavior: "smooth", block: "start" }),
                    ),
                )
            },
        }),
        [],
    )

    function deleteQuestions(paperId, nums) {
        const gone = new Set(nums.map(String))
        updatePaper(paperId, (p) => ({ questions: p.questions.filter((q) => !gone.has(String(q.num))) }))
    }

    const pending = papers.flatMap((p) =>
        answered(p)
            .filter((q) => p.include[q.num] !== false && !p.saved[q.num] && p.tags[q.num])
            .map((question) => ({ question, paper: p })),
    )
    const ready = pending.filter(({ question, paper: p }) => !problemWith(question, p))
    const blocked = pending.filter(({ question, paper: p }) => problemWith(question, p))
    const lessonName = (id) => lessons.find((l) => l.lessonId === id)?.name ?? `Lesson ${id}`

    // Saving finishes the import: everything is cleared, draft included, and
    // the page returns to the empty upload step for the next papers.
    function clearSavedFromImport() {
        latest.current = { papers: [], keys: [] }
        written.current = new Map()
        setPapers([])
        setKeys([])
        setFailures([])
        setNotice(null)
        setCurrentPaperId(null)
        setTerm("")
        clearDraft(draftKey)
    }

    async function saveReady() {
        const errors = []
        let done = 0
        let saved = 0
        setSaving({ done: 0, total: ready.length, errors, checking: true })

        const inBank = new Set()
        const byPaper = new Map()
        for (const item of ready) byPaper.set(item.paper.id, [...(byPaper.get(item.paper.id) ?? []), item])
        for (const [paperId, items] of byPaper) {
            try {
                const found = await findDuplicates(certificationId, items.map(({ question }) => duplicateText(question)))
                const nums = items.filter((_, index) => found.duplicates?.[index] === "bank").map(({ question }) => question.num)
                if (!nums.length) continue
                for (const num of nums) inBank.add(`${paperId}-${num}`)
                updatePaper(paperId, (p) => ({
                    tags: Object.fromEntries(Object.entries(p.tags).map(([num, tag]) => [num, nums.map(String).includes(String(num)) ? { ...tag, duplicate: "bank" } : tag])),
                    include: { ...p.include, ...Object.fromEntries(nums.map((num) => [num, false])) },
                }))
            } catch {
                errors.push(`${items[0].paper.name}: the question bank could not be checked for duplicates, so this paper was not saved. Try again.`)
                for (const { question } of items) inBank.add(`${paperId}-${question.num}`)
            }
        }
        const queue = ready.filter(({ question, paper: target }) => !inBank.has(`${target.id}-${question.num}`))
        const skipped = ready.length - queue.length
        setSaving({ done, total: queue.length, errors: [...errors], skipped })

        const BATCH = 3
        for (let i = 0; i < queue.length; i += BATCH) {
            const batch = queue.slice(i, i + BATCH)
            const results = await Promise.allSettled(
                batch.map(({ question, paper: target }) =>
                    saveOne(question, target, certificationId, ownerDepartmentId).then(
                        () => ({ ok: true, question, paper: target }),
                        (error) => ({ ok: false, question, paper: target, error }),
                    ),
                ),
            )
            for (const { value } of results) {
                if (value.ok) {
                    saved += 1
                    updatePaper(value.paper.id, (p) => ({ saved: { ...p.saved, [value.question.num]: true } }))
                } else {
                    const e = value.error
                    const raw = e?.response?.data?.message || e?.message || "failed"
                    const dup = raw.match(/^(This lesson already asks this \(question \d+\))/)
                    const short = dup ? dup[1] : raw.length > 150 ? raw.slice(0, 150) + "…" : raw
                    errors.push(`${value.paper.name} Q${value.question.num}: ${short}`)
                }
                done += 1
            }
            setSaving({ done, saved, total: queue.length, errors: [...errors], skipped })
        }
        setSaving({ done, saved, total: queue.length, errors, skipped, finished: true })
        clearSavedFromImport()
    }

    const totalQuestions = papers.reduce((sum, p) => sum + p.questions.length, 0)
    const answeredCount = papers.reduce((sum, p) => sum + answered(p).length, 0)
    const taggedCount = papers.reduce((sum, p) => sum + Object.keys(p.tags).length, 0)
    const currentPaper = papers.find((p) => p.id === currentPaperId) ?? papers[0] ?? null
    const currentIndex = currentPaper ? papers.indexOf(currentPaper) : -1
    const searching = term.trim() !== ""
    const flaggedCount = papers.reduce((sum, p) => sum + p.questions.filter((q) => aiFlag(p, q.num)).length, 0)
    const checkingAny = papers.some((p) => p.checking)
    const missingTagCount = papers.reduce((sum, p) => sum + answered(p).filter((q) => needsTag(p, q)).length, 0)

    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-gradient-to-b from-primary/[0.035] via-muted/20 to-muted/30">
            <header className="flex shrink-0 items-center gap-3 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground">Question bank</p>
                    <p className="truncate text-sm font-semibold text-foreground sm:text-base">{certification?.title ?? "Certification"}</p>
                </div>
                {papers.length ? (
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <Button type="button" size="sm" variant="ghost" className="hidden text-destructive sm:inline-flex" disabled={busy || tagging} onClick={() => setStartOverOpen(true)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Start over
                        </Button>
                        <Button type="button" size="sm" disabled={busy} onClick={() => setUploadOpen(true)}>
                            <UploadIcon className="mr-2 h-4 w-4" /> Add files
                        </Button>
                    </div>
                ) : null}
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto">
                {!papers.length && !restored ? (
                    <p className="mt-[20vh] flex items-center justify-center gap-2 text-sm text-muted-foreground" aria-live="polite">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading your import…
                    </p>
                ) : !papers.length ? (
                    <section className="mx-auto w-full max-w-4xl px-5 py-5 sm:py-7">
                        <ImportGuide step={importing || importJob?.status === "interrupted" ? 1 : 0} />
                        {importing || importJob?.status === "interrupted" ? (
                            <ImportJobPanel job={importJob} upload={upload} building={building} stopping={stopping} onStop={stopEverything} onResume={resumeImport} />
                        ) : (
                            <div className="rounded-2xl border bg-background p-4 shadow-sm sm:p-5">
                                <PdfUploadStep onNext={addFiles} disabled={busy} nextLabel="Scan & tag questions" />
                            </div>
                        )}
                        {notice ? (
                            <p className={cn("mt-3 rounded-xl border p-3 text-sm", notice.kind === "error" ? "border-destructive/40 bg-destructive/5 text-destructive" : notice.kind === "ok" ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-amber-300 bg-amber-50 text-amber-800")}>
                                {notice.text}
                            </p>
                        ) : null}
                        {failures.map((failure, index) => (
                            <p key={index} className="mt-2 flex items-start gap-2 text-sm text-destructive">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Could not read {failure.name}: {failure.error}.
                            </p>
                        ))}
                    </section>
                ) : (
                    <div className="mx-auto grid w-full max-w-[1800px] gap-5 px-4 py-5 xl:grid-cols-[18rem_minmax(0,1fr)] xl:px-6">
                        <aside className="hidden max-h-[calc(100dvh-10.75rem)] self-start overflow-y-auto rounded-2xl border border-border/80 bg-background p-4 shadow-sm xl:sticky xl:top-0 xl:block">
                            <div className="mb-4 border-b border-border pb-3">
                                <h2 className="text-base font-bold">Answer map</h2>
                                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Select a question to review its saved answer.</p>
                            </div>
                            <div className="mb-4 grid grid-cols-2 divide-x rounded-xl border bg-muted/30 py-2.5 text-center">
                                <div>
                                    <p className="text-lg font-bold text-foreground">{answeredCount}</p>
                                    <p className="text-[10px] font-medium text-muted-foreground">answered</p>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-foreground">{totalQuestions - answeredCount + flaggedCount}</p>
                                    <p className="text-[10px] font-medium text-muted-foreground">to check</p>
                                </div>
                            </div>
                            {currentPaper && answered(currentPaper).length ? (
                                <SheetPaper paper={currentPaper} showName={papers.length > 1} onJump={cardActions.jump} />
                            ) : <p className="text-xs text-muted-foreground">Add or mark an answer key to populate the map.</p>}
                        </aside>

                        <main className="min-w-0">
                            <div className="mb-4 rounded-2xl border border-border/80 bg-background p-4 shadow-sm sm:p-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                                    <div className="min-w-0 flex-1">
                                        <h1 className="text-lg font-bold tracking-tight sm:text-xl">Review imported questions</h1>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {papers.length} paper{papers.length === 1 ? "" : "s"} · {totalQuestions} questions · {answeredCount} answered · {taggedCount} ready to save
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {duplicateList.length ? (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="border-amber-400 text-amber-800 hover:bg-amber-50"
                                                disabled={busy}
                                                onClick={() => setDuplicatesOpen(true)}
                                            >
                                                <AlertTriangle className="mr-2 h-4 w-4" /> {duplicateList.length} duplicate{duplicateList.length === 1 ? "" : "s"}
                                            </Button>
                                        ) : null}
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            disabled={checkingAny || busy}
                                            title="AI re-checks every answer and repairs misread wording"
                                            onClick={() => latest.current.papers.forEach((p) => runAiCheck(p.id))}
                                        >
                                            {checkingAny ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                            {checkingAny ? "AI is checking answers…" : flaggedCount ? `Check with AI · ${flaggedCount} to confirm` : "Check with AI"}
                                        </Button>
                                        {tagging ? (
                                            <Button type="button" size="sm" variant="outline" disabled>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                {tagJob ? `Tagging ${tagJob.tagged} of ${tagJob.total}…` : "Starting…"}
                                            </Button>
                                        ) : null}
                                        {!tagging && !importing && missingTagCount ? (
                                            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => tagWithAi(true)}>
                                                <Sparkles className="mr-2 h-4 w-4" /> Tag {missingTagCount} missing a lesson or difficulty
                                            </Button>
                                        ) : null}
                                        {tagJob?.status === "running" ? (
                                            <Button type="button" size="sm" variant="ghost" className="text-destructive" disabled={stopping} onClick={stopEverything}>
                                                {stopping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                {stopping ? "Stopping…" : "Stop"}
                                            </Button>
                                        ) : null}
                                        <Button type="button" size="sm" disabled={!taggedCount || tagging || importing} onClick={() => { setSaving(null); setPreviewOpen(true) }}>
                                            <Eye className="mr-2 h-4 w-4" /> Preview & save
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="sticky top-0 z-20 mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border/80 bg-background/95 p-2.5 shadow-sm backdrop-blur">
                                <div className="relative min-w-[220px] flex-1">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Search questions, concepts, or wording" className="border-transparent bg-muted/60 pl-9 shadow-none focus-visible:bg-background" />
                                </div>
                                <div className="inline-flex overflow-hidden rounded-lg border bg-background" role="group" aria-label="Filter">
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
                            </div>

                            {tagJob?.status === "running" ? (
                                <div className="mb-3 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm" aria-live="polite">
                                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full bg-primary transition-[width]"
                                            style={{ width: `${tagJob.total ? Math.round((tagJob.tagged / tagJob.total) * 100) : 0}%` }}
                                        />
                                    </div>
                                    <p className="mt-2">
                                        <b>Tagging in the background</b>: {tagJob.tagged} of {tagJob.total} questions,{" "}
                                        {tagJob.papers.filter((entry) => entry.status === "done").length} of {tagJob.papers.length} papers done.
                                        Tags appear here paper by paper. You can leave or refresh this page -- tagging keeps going on
                                        the server, and you will be told when it is finished.
                                    </p>
                                </div>
                            ) : null}
                            {importing || importJob?.status === "interrupted" ? <ImportJobPanel job={importJob} upload={upload} building={building} stopping={stopping} onStop={stopEverything} onResume={resumeImport} /> : null}
                            {progress ? (
                                <div className="mb-3"><ExtractionProgress progress={progress} /></div>
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

                            {!busy && papers.some((p) => unanswered(p).length) ? (
                                <div className="mb-3 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                                    <p className="mb-1 flex items-center gap-2 font-semibold">
                                        <AlertTriangle className="h-4 w-4 shrink-0" /> Answers are missing
                                    </p>
                                    <ul className="space-y-1 text-xs leading-5">
                                        {papers.map((p) => {
                                            const missing = unanswered(p)
                                            if (!missing.length) return null
                                            return (
                                                <li key={p.id} className="flex gap-1.5">
                                                    <span aria-hidden="true">•</span>
                                                    <span><b>{p.name.replace(/\.pdf$/i, "")}</b> — {missing.length} unanswered question{missing.length === 1 ? "" : "s"}. Add or change the answer key to include them.</span>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </div>
                            ) : null}

                            {!busy && failures.map((failure, index) => (
                                <p key={`f${index}`} className="mb-2 flex items-start gap-2 rounded-xl border border-dashed bg-background p-3 text-sm text-destructive">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Could not read {failure.name}: {failure.error}.
                                </p>
                            ))}

                            <input
                                ref={keyInputRef}
                                type="file"
                                accept="application/pdf,.pdf,.docx,.doc,.odt,.rtf"
                                hidden
                                onChange={(event) => {
                                    const file = event.target.files?.[0]
                                    const target = latest.current.papers.find((p) => p.id === keyTargetRef.current)
                                    if (file && target) addKeyForPaper(file, target)
                                    event.target.value = ""
                                }}
                            />

                            {papers.length > 1 ? (
                                <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border bg-background p-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        disabled={currentIndex <= 0}
                                        onClick={() => setCurrentPaperId(papers[currentIndex - 1].id)}
                                        aria-label="Previous paper"
                                    >
                                        ‹
                                    </Button>
                                    <select
                                        value={currentPaper?.id ?? ""}
                                        onChange={(event) => setCurrentPaperId(event.target.value)}
                                        aria-label="Paper to show"
                                        className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm"
                                    >
                                        {papers.map((item, index) => {
                                            const tagged = answered(item).filter((q) => item.tags[q.num]?.lessonId && item.tags[q.num]?.difficulty).length
                                            return (
                                                <option key={item.id} value={item.id}>
                                                    {`Paper ${index + 1} of ${papers.length}: ${item.name.replace(/\.pdf$/i, "")} -- ${item.questions.length} questions, ${tagged} tagged`}
                                                </option>
                                            )
                                        })}
                                    </select>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        disabled={currentIndex >= papers.length - 1}
                                        onClick={() => setCurrentPaperId(papers[currentIndex + 1].id)}
                                        aria-label="Next paper"
                                    >
                                        ›
                                    </Button>
                                    {searching ? <span className="text-xs text-muted-foreground">Searching every paper</span> : null}
                                </div>
                            ) : null}
                            {(searching ? papers : currentPaper ? [currentPaper] : []).map((item) => {
                                const shown = item.questions.filter((question) => matches(question))
                                if (searching && !shown.length) return null
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
                                                            item.readBy === "rules" && "local text and image extraction",
                                                            item.readBy === "layout" && `local layout: ${item.profile ?? "detected"}`,
                                                            item.readBy === "ai" && "AI vision extraction from the original page image",
                                                            item.readBy === "ai-fallback" && "AI recovery from the original page image",
                                                            item.partial && "review incomplete items before saving",
                                                            item.recoveryWarning && "AI recovery was unavailable; local review retained",
                                                            `${marked} answers marked${item.keyName ? ` from ${item.keyName}` : ""}`,
                                                        ].filter(Boolean).join(" · ")}
                                                    </p>
                                                </div>
                                                <select
                                                    value=""
                                                    aria-label="Save all questions in this paper as"
                                                    className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                                                    onChange={(event) => {
                                                        const value = event.target.value
                                                        if (!value) return
                                                        updatePaper(item.id, (p) => ({
                                                            types: Object.fromEntries(p.questions.map((q) => [q.num, value])),
                                                        }))
                                                    }}
                                                >
                                                    <option value="">Save this paper's questions as…</option>
                                                    {SAVE_TYPES.map((type) => (
                                                        <option key={type.id} value={type.id}>{type.label}</option>
                                                    ))}
                                                </select>
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
                                                if (busy || !missing.length) return null
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
                                                            onClick={() => {
                                                                const answers = parseKeyText(keyText, item.questions)
                                                                const count = Object.keys(answers).length
                                                                if (!count) {
                                                                    setNotice({ kind: "error", text: "No answers could be read from the pasted key. Use a form like 1 c, 2 d, 3 a." })
                                                                    return
                                                                }
                                                                updatePaper(item.id, () => ({ answers, keyName: "pasted key" }))
                                                                setKeyBoxFor(null)
                                                                setKeyText("")
                                                                setNotice({ kind: "ok", text: `Pasted key applied to ${item.name}: ${count} answer${count === 1 ? "" : "s"}.` })
                                                            }}
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
                                                        cardRefs={cardRefs}
                                                        question={question}
                                                        paper={item}
                                                        lessons={lessons}
                                                        actions={cardActions}
                                                        duplicate={duplicateReasons[`${item.id}-${question.num}`]}
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

            <AlertDialog open={startOverOpen} onOpenChange={setStartOverOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Start over?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Every paper is removed from this import. Questions already saved to the question bank stay there.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={startOver}>
                            Remove every paper
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                <DialogContent className="max-h-[calc(100dvh-3rem)] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add files</DialogTitle>
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

            <Dialog open={duplicatesOpen} onOpenChange={setDuplicatesOpen}>
                <DialogContent className="max-h-[calc(100dvh-3rem)] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Duplicate questions</DialogTitle>
                        <DialogDescription>
                            {duplicateList.length} question{duplicateList.length === 1 ? " repeats" : "s repeat"} one already in the question bank
                            or earlier in this upload. Deleting keeps the first copy.
                        </DialogDescription>
                    </DialogHeader>
                    {duplicateList.length ? (
                        <div className="sticky -top-6 z-10 -mx-6 flex items-center justify-between gap-3 border-b bg-background px-6 py-3">
                            <p className="text-sm text-muted-foreground">Delete every duplicate below in one go.</p>
                            <Button type="button" variant="destructive" onClick={deleteAllDuplicates}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete all {duplicateList.length} duplicates
                            </Button>
                        </div>
                    ) : null}
                    <ul className="divide-y rounded-xl border">
                        {duplicateList.map(({ paper: item, question, reason }) => (
                            <li key={`${item.id}-${question.num}`} className="flex items-start gap-3 p-3">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold">
                                        {item.name.replace(/\.pdf$/i, "")} · Q{question.num}
                                    </p>
                                    <p className="text-xs text-amber-800">Duplicate: {reason}.</p>
                                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{question.stem}</p>
                                </div>
                                <div className="flex shrink-0 gap-1.5">
                                    <Button
                                        type="button"
                                        size="xs"
                                        variant="ghost"
                                        onClick={() => {
                                            setDuplicatesOpen(false)
                                            cardActions.jump(item.id, question.num)
                                        }}
                                    >
                                        View
                                    </Button>
                                    <Button
                                        type="button"
                                        size="xs"
                                        variant="outline"
                                        className="text-destructive"
                                        onClick={() => deleteQuestions(item.id, [question.num])}
                                    >
                                        <Trash2 className="h-3 w-3" /> Delete
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    {duplicateList.length ? null : (
                        <p className="py-4 text-center text-sm text-muted-foreground">No duplicates left.</p>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={previewOpen} onOpenChange={(open) => !(saving && !saving.finished) && setPreviewOpen(open)}>
                <DialogContent className="max-h-[calc(100dvh-3rem)] overflow-y-auto sm:max-w-3xl">
                    {!saving?.finished ? (
                        <>
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
                        </>
                    ) : null}

                    <div className={cn("space-y-3", saving?.finished && "hidden")}>
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
                                                <li key={option.key} className={cn("flex items-start gap-2 rounded px-1 py-0.5", option.key === answer && "bg-emerald-50 font-semibold text-emerald-800")}>
                                                    <span className="shrink-0 whitespace-nowrap">{option.key})</span>
                                                    {option.imageSrc ? <img src={option.imageSrc} alt="" className="max-h-14 rounded bg-white" /> : <span className="line-clamp-2 min-w-0">{option.text}</span>}
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

                    {saving && !saving.finished ? (
                        <div className="rounded-xl border bg-muted/40 p-3 text-sm" aria-live="polite">
                            <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
                                <div className="h-full bg-primary transition-[width]" style={{ width: `${saving.total ? (saving.done / saving.total) * 100 : 100}%` }} />
                            </div>
                            {saving.checking
                                ? <p className="text-muted-foreground">Checking the question bank for questions it already holds…</p>
                                : <p>Saving {saving.done} of {saving.total}…</p>}
                        </div>
                    ) : null}

                    {saving?.finished ? (
                        <div className="flex flex-col items-center gap-4 py-4" aria-live="polite">
                            <div className={cn(
                                "grid size-16 place-items-center rounded-full",
                                (saving.saved ?? 0) > 0 ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600",
                            )}>
                                {(saving.saved ?? 0) > 0
                                    ? <CheckCircle2 className="h-8 w-8" />
                                    : <AlertTriangle className="h-8 w-8" />}
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold">
                                    {(saving.saved ?? 0) > 0
                                        ? `${saving.saved} question${saving.saved === 1 ? "" : "s"} saved`
                                        : "No questions were saved"}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {(saving.saved ?? 0) > 0 ? `Added to ${certification?.title ?? "the question bank"}.` : "All questions were already in the bank or had errors."}
                                </p>
                            </div>
                            {(saving.skipped || saving.errors.length) ? (
                                <div className="w-full space-y-2 rounded-xl border bg-muted/30 p-3 text-sm">
                                    {saving.skipped ? (
                                        <p className="flex items-center gap-2 text-amber-700">
                                            <AlertTriangle className="h-4 w-4 shrink-0" />
                                            {saving.skipped} skipped — already in the question bank.
                                        </p>
                                    ) : null}
                                    {saving.errors.length ? (
                                        <ul className="space-y-1">
                                            {saving.errors.map((error, i) => (
                                                <li key={i} className="flex items-start gap-2 text-destructive">
                                                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                                    <span>{error}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : null}
                                </div>
                            ) : null}
                            <div className="mt-2 flex flex-wrap justify-center gap-2">
                                <Button
                                    type="button"
                                    onClick={() => {
                                        setPreviewOpen(false)
                                        setSaving(null)
                                    }}
                                >
                                    <UploadIcon className="mr-2 h-4 w-4" /> Import more papers
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setPreviewOpen(false)
                                        navigate(exitPath)
                                    }}
                                >
                                    Go to question bank
                                </Button>
                            </div>
                        </div>
                    ) : null}

                    {!saving?.finished ? (
                        <DialogFooter>
                            <Button type="button" variant="outline" disabled={Boolean(saving)} onClick={() => setPreviewOpen(false)}>
                                Back to review
                            </Button>
                            <Button type="button" disabled={!ready.length || Boolean(saving)} onClick={saveReady}>
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save {ready.length} to question bank
                            </Button>
                        </DialogFooter>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    )
}
