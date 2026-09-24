import { useMemo, useRef, useState } from "react"
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
    Save,
    Search,
    Sparkles,
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
import { getAllCertifications } from "@/services/certificationService.js"
import { uploadQuestionImage } from "@/services/fileService.js"
import { tagQuestions } from "@/services/pdfImportService.js"
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

/** Canvases become data URLs once, when a paper is read, not on every render. */
function forDisplay(question) {
    return {
        ...question,
        figureSrcs: question.figures.map((canvas) => canvas.toDataURL("image/png")),
        snapSrcs: question.snaps.map((canvas) => canvas.toDataURL("image/png")),
        options: question.options.map((option) => ({
            ...option,
            imageSrc: option.image ? option.image.toDataURL("image/png") : null,
        })),
    }
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

/** Why a question cannot be saved as configured, or null when it can. */
function problemWith(question, paper) {
    const tag = paper.tags[question.num]
    const type = paper.types[question.num] ?? "MCQ"
    const answer = paper.answers[question.num]
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
    if (question.figures.length) {
        const file = await canvasToFile(stackCanvases(question.figures), `q${question.num}.png`)
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
            if (option.image) {
                const file = await canvasToFile(option.image, `q${question.num}${option.key}.png`)
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

function QuestionCard({ question, paper, lessons, onPick, onTag, onType, onInclude, cardRef }) {
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
                <span className="flex-1" />
                <button
                    type="button"
                    className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    aria-expanded={showOriginal}
                    onClick={() => setShowOriginal((open) => !open)}
                >
                    {showOriginal ? "Hide original" : "Show original"}
                </button>
            </div>

            <p className="mb-3 max-w-[72ch] whitespace-pre-line font-serif text-[1.05rem] leading-relaxed">
                {question.stem}
            </p>

            {question.figureSrcs.map((src, index) => (
                <figure key={index} className="my-3 overflow-x-auto rounded-lg border bg-white p-2">
                    <img src={src} alt={`Figure ${index + 1} for question ${question.num}`} className="mx-auto block h-auto max-w-full" />
                </figure>
            ))}

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
                <div className="mt-4 grid gap-3 rounded-xl border bg-muted/30 p-3 sm:grid-cols-[auto_1fr_10rem_11rem] sm:items-end">
                    <label className="flex items-center gap-2 text-sm font-medium sm:pb-2">
                        <Checkbox
                            checked={included}
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
                    <div>
                        <p className="mb-1 text-xs font-semibold text-muted-foreground">Question type</p>
                        <Select value={type} onValueChange={(value) => onType(question.num, value)}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {QUESTION_TYPES.map((item) => (
                                    <SelectItem key={item.id} value={item.id} disabled={Boolean(item.disabled)}>
                                        {item.label}
                                        {item.disabled ? <span className="ml-2 text-xs text-muted-foreground">{item.disabled}</span> : null}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {included && problem ? (
                        <p className="flex items-center gap-2 text-sm text-amber-700 sm:col-span-4">
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
    const inputRef = useRef(null)
    const cardRefs = useRef({})

    const [papers, setPapers] = useState([])
    const [keys, setKeys] = useState([])
    const [failures, setFailures] = useState([])
    const [active, setActive] = useState(0)
    const [progress, setProgress] = useState(null)
    const [filter, setFilter] = useState("all")
    const [term, setTerm] = useState("")
    const [showKeyBox, setShowKeyBox] = useState(false)
    const [keyText, setKeyText] = useState("")
    const [dragging, setDragging] = useState(false)
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

    const paper = papers[active] ?? null
    const busy = progress !== null

    function updatePaper(id, change) {
        setPapers((current) => current.map((p) => (p.id === id ? { ...p, ...change(p) } : p)))
    }

    function attachKey(key, paperId) {
        setKeys((current) => current.map((k) => (k.id === key.id ? { ...k, paperId } : k.paperId === paperId ? { ...k, paperId: null } : k)))
        updatePaper(paperId, () => ({ answers: { ...key.answers }, keyName: key.name }))
    }

    async function addFiles(fileList) {
        const files = [...fileList]
        const pdfs = files.filter(isPdf)
        const rejected = files.filter((file) => !isPdf(file))
        if (rejected.length) {
            setFailures((current) => [...current, ...rejected.map((file) => ({ name: file.name, error: "not a PDF" }))])
        }

        const readPapers = []
        const readKeys = []
        for (const [index, file] of pdfs.entries()) {
            const label = pdfs.length > 1 ? ` (${index + 1} of ${pdfs.length})` : ""
            setProgress({ label: `Opening ${file.name}${label}`, percent: 2 })
            try {
                const result = await readExamPdf(file, async (page, total) => {
                    setProgress({ label: `Reading ${file.name}${label}, page ${page} of ${total}`, percent: Math.round((page / total) * 100) })
                    await new Promise((resolve) => setTimeout(resolve, 0))
                })
                const id = `${file.name}:${file.size}:${Date.now()}:${index}`
                if (result.kind === "key") {
                    readKeys.push({ id, name: result.name, info: result.info, answers: result.answers, count: result.count, paperId: null })
                } else {
                    readPapers.push({
                        id,
                        name: result.name,
                        info: result.info,
                        questions: result.questions.map(forDisplay),
                        answers: {},
                        keyName: null,
                        tags: {},
                        types: {},
                        include: {},
                        saved: {},
                    })
                }
            } catch (error) {
                setFailures((current) => [...current, { name: file.name, error: error?.message || String(error) }])
            }
        }
        setProgress(null)

        // Pair keys with papers whose exam date agrees -- the ones just read
        // and any already open. A key only "not conflicting" is not enough.
        const allPapers = [...papers, ...readPapers]
        const allKeys = [...keys, ...readKeys]
        for (const key of allKeys) {
            if (key.paperId) continue
            let best = null
            let bestScore = 0
            for (const candidate of allPapers) {
                if (candidate.keyName) continue
                const score = matchScore(key.info, candidate.info)
                if (score > bestScore) {
                    best = candidate
                    bestScore = score
                }
            }
            if (best && bestScore >= 4) {
                key.paperId = best.id
                best.answers = { ...key.answers }
                best.keyName = key.name
            }
        }
        setPapers(allPapers)
        setKeys(allKeys)
        if (!papers.length && readPapers.length) setActive(0)
    }

    const visible = useMemo(() => {
        if (!paper) return []
        const needle = term.trim().toLowerCase()
        return paper.questions.filter(
            (question) =>
                (filter === "all" || question.figureSrcs.length) &&
                (!needle ||
                    `q${question.num} ${question.stem} ${question.options.map((o) => o.text).join(" ")}`
                        .toLowerCase()
                        .includes(needle)),
        )
    }, [paper, filter, term])

    async function tagWithAi() {
        if (!paper) return
        setTagging(true)
        setNotice(null)
        try {
            const texts = paper.questions.map(
                (q) => `${q.stem}\n${q.options.map((o) => `${o.key}) ${o.text || "[picture]"}`).join("\n")}`,
            )
            const result = await tagQuestions(certificationId, texts)
            setLessons(result.lessons ?? [])
            const tags = {}
            paper.questions.forEach((question, index) => {
                const tag = result.tags?.[index]
                if (tag) tags[question.num] = tag
            })
            updatePaper(paper.id, () => ({ tags }))
            const fallback = Object.values(tags).filter((t) => t.source !== "ai").length
            setNotice(
                fallback
                    ? { kind: "warn", text: `${fallback} question${fallback === 1 ? "" : "s"} could not be tagged by the AI and were matched to a lesson without it. Their difficulty is not set -- check them before saving.` }
                    : { kind: "ok", text: `All ${paper.questions.length} questions tagged. Check the lessons, then preview and save.` },
            )
        } catch (error) {
            setNotice({ kind: "error", text: error?.response?.data?.message || error?.message || "Tagging failed." })
        } finally {
            setTagging(false)
        }
    }

    const toSave = paper
        ? paper.questions.filter((q) => paper.include[q.num] !== false && !paper.saved[q.num] && paper.tags[q.num])
        : []
    const ready = paper ? toSave.filter((q) => !problemWith(q, paper)) : []
    const blocked = paper ? toSave.filter((q) => problemWith(q, paper)) : []
    const lessonName = (id) => lessons.find((l) => l.lessonId === id)?.name ?? `Lesson ${id}`

    async function saveReady() {
        if (!paper) return
        const target = paper
        const queue = [...ready]
        const errors = []
        let done = 0
        setSaving({ done, total: queue.length, errors })
        for (const question of queue) {
            try {
                await saveOne(question, target, certificationId)
                updatePaper(target.id, (p) => ({ saved: { ...p.saved, [question.num]: true } }))
            } catch (error) {
                errors.push(`Q${question.num}: ${error?.response?.data?.message || error?.message || "failed"}`)
            }
            done += 1
            setSaving({ done, total: queue.length, errors: [...errors] })
        }
        setSaving({ done, total: queue.length, errors, finished: true })
    }

    const looseKeys = keys.filter((key) => !key.paperId)
    const answeredCount = paper ? Object.keys(paper.answers).length : 0
    const taggedCount = paper ? Object.keys(paper.tags).length : 0

    return (
        <div
            className="flex h-dvh w-full flex-col overflow-hidden bg-muted/20"
            onDragOver={(event) => {
                event.preventDefault()
                setDragging(true)
            }}
            onDragLeave={(event) => {
                if (event.currentTarget === event.target) setDragging(false)
            }}
            onDrop={(event) => {
                event.preventDefault()
                setDragging(false)
                if (event.dataTransfer?.files?.length && !busy) addFiles(event.dataTransfer.files)
            }}
        >
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
                <Button type="button" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
                    <UploadIcon className="mr-2 h-4 w-4" /> Add PDFs
                </Button>
                <input
                    ref={inputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    multiple
                    hidden
                    onChange={(event) => {
                        if (event.target.files?.length) addFiles(event.target.files)
                        event.target.value = ""
                    }}
                />
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto">
                {!papers.length ? (
                    <section className="mx-auto mt-[8vh] max-w-3xl px-5">
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={() => !busy && inputRef.current?.click()}
                            onKeyDown={(event) => {
                                if ((event.key === "Enter" || event.key === " ") && !busy) {
                                    event.preventDefault()
                                    inputRef.current?.click()
                                }
                            }}
                            className={cn(
                                "cursor-pointer rounded-3xl border-2 border-dashed border-primary/50 bg-background px-7 py-12 text-center transition",
                                dragging && "bg-primary/5",
                            )}
                        >
                            <div className="inline-flex gap-2.5" aria-hidden="true">
                                {KEYS.map((key) => (
                                    <span
                                        key={key}
                                        className={cn(
                                            "grid size-7 place-items-center rounded-full border-2 border-primary text-xs font-bold text-primary",
                                            key === "c" && "border-foreground bg-foreground text-transparent",
                                        )}
                                    >
                                        {key}
                                    </span>
                                ))}
                            </div>
                            <h1 className="mt-5 font-serif text-3xl font-semibold">Drop exam papers and answer keys here</h1>
                            <p className="mx-auto mt-2 max-w-[48ch] text-muted-foreground">
                                Add question papers and their answer keys together, as many as you like. Keys are
                                matched to papers by exam date. Every question is pulled out with its answer choices,
                                and diagrams, tables and circuit figures are captured as images.
                            </p>
                            {busy ? (
                                <div className="mx-auto mt-6 max-w-xl" aria-live="polite">
                                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                        <div className="h-full bg-primary transition-[width]" style={{ width: `${progress.percent}%` }} />
                                    </div>
                                    <p className="mt-2 text-sm text-muted-foreground">{progress.label}</p>
                                </div>
                            ) : null}
                        </div>
                        <p className="mt-4 text-center text-sm text-muted-foreground">
                            Works with multiple-choice papers numbered Q1, Q2 … with choices a) to d). Files are read in
                            this browser; only the questions you save are uploaded.
                        </p>
                        {failures.map((failure, index) => (
                            <p key={index} className="mt-2 flex items-start gap-2 text-sm text-destructive">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Could not read {failure.name}: {failure.error}.
                            </p>
                        ))}
                    </section>
                ) : (
                    <div className="mx-auto grid max-w-[1400px] gap-6 px-4 py-5 lg:grid-cols-[250px_minmax(0,1fr)]">
                        <aside className="hidden max-h-[calc(100dvh-7rem)] self-start overflow-y-auto rounded-2xl border bg-background p-3 lg:sticky lg:top-0 lg:block">
                            <h2 className="text-sm font-bold text-primary">Answer sheet</h2>
                            <p className="mb-2 text-xs text-muted-foreground">
                                {paper?.keyName ? "Green marks the key" : "Click a choice to mark the answer"}
                            </p>
                            {paper?.questions.map((question) => {
                                const answer = paper.answers[question.num]
                                return (
                                    <button
                                        key={question.num}
                                        type="button"
                                        onClick={() => {
                                            setFilter("all")
                                            setTerm("")
                                            requestAnimationFrame(() =>
                                                cardRefs.current[question.num]?.scrollIntoView({ behavior: "smooth", block: "start" }),
                                            )
                                        }}
                                        className="grid w-full grid-cols-[34px_repeat(4,22px)] items-center gap-1.5 rounded-md px-1 py-0.5 hover:bg-muted"
                                    >
                                        <b className="pr-1 text-right text-xs text-primary">{question.num}</b>
                                        {KEYS.map((key) => (
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
                        </aside>

                        <main className="min-w-0">
                            <div className="mb-3 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Papers">
                                {papers.map((item, index) => (
                                    <div
                                        key={item.id}
                                        role="tab"
                                        aria-selected={index === active}
                                        className={cn(
                                            "flex max-w-[300px] flex-none items-center rounded-xl border bg-background",
                                            index === active && "border-primary shadow-[inset_0_-3px_0] shadow-primary",
                                        )}
                                    >
                                        <button type="button" className="min-w-0 px-3 py-2 text-left" onClick={() => setActive(index)}>
                                            <b className="block truncate text-sm">{item.name.replace(/\.pdf$/i, "")}</b>
                                            <small className="text-xs text-muted-foreground">
                                                {[describeExam(item.info), `${item.questions.length} questions`, item.keyName && "key added"].filter(Boolean).join(", ")}
                                            </small>
                                        </button>
                                        <button
                                            type="button"
                                            aria-label={`Remove ${item.name}`}
                                            className="mr-1 grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-muted"
                                            onClick={() => {
                                                setPapers((current) => current.filter((p) => p.id !== item.id))
                                                setKeys((current) => current.map((k) => (k.paperId === item.id ? { ...k, paperId: null } : k)))
                                                setActive(0)
                                            }}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                                {failures.map((failure, index) => (
                                    <div key={`f${index}`} title={failure.error} className="flex max-w-[300px] flex-none flex-col rounded-xl border border-dashed bg-background px-3 py-2">
                                        <b className="truncate text-sm">{failure.name.replace(/\.pdf$/i, "")}</b>
                                        <small className="text-xs text-destructive">Could not read</small>
                                    </div>
                                ))}
                            </div>

                            {busy ? (
                                <div className="mb-3 rounded-xl border bg-background p-3 text-sm text-muted-foreground" aria-live="polite">
                                    <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
                                        <div className="h-full bg-primary transition-[width]" style={{ width: `${progress.percent}%` }} />
                                    </div>
                                    {progress.label}
                                </div>
                            ) : null}

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

                            {paper ? (
                                <>
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
                                        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setShowKeyBox((open) => !open)}>
                                            <KeyRound className="mr-2 h-4 w-4" /> Add answer key
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="rounded-full"
                                            onClick={async () => {
                                                await navigator.clipboard.writeText(asText(paper))
                                                setCopied(true)
                                                setTimeout(() => setCopied(false), 1600)
                                            }}
                                        >
                                            <Copy className="mr-2 h-4 w-4" /> {copied ? "Copied" : "Copy as text"}
                                        </Button>
                                    </div>

                                    {showKeyBox ? (
                                        <div className="mb-3 rounded-xl border bg-background p-3">
                                            <p className="mb-2 text-sm text-muted-foreground">
                                                Paste the answer key, or add the answer key PDF. Formats like <em>1 c, 2 d, 3 a</em> or one letter per question in order (<em>cdab…</em>) both work.
                                            </p>
                                            <Textarea value={keyText} onChange={(event) => setKeyText(event.target.value)} className="min-h-20" />
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => updatePaper(paper.id, (p) => ({ answers: parseKeyText(keyText, p.questions), keyName: "pasted key" }))}
                                                >
                                                    Apply key
                                                </Button>
                                                <Button type="button" size="sm" variant="outline" onClick={() => updatePaper(paper.id, () => ({ answers: {}, keyName: null }))}>
                                                    Clear answers
                                                </Button>
                                            </div>
                                        </div>
                                    ) : null}

                                    <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border bg-background p-3">
                                        <p className="flex-1 text-sm text-muted-foreground">
                                            <strong className="text-foreground">{paper.questions.length} questions</strong> from {paper.name},{" "}
                                            {paper.questions.filter((q) => q.figureSrcs.length).length} with figures. {answeredCount} answers marked
                                            {paper.keyName ? ` (from ${paper.keyName})` : ""}. {taggedCount ? `${taggedCount} tagged.` : ""}
                                        </p>
                                        <Button type="button" size="sm" variant={taggedCount ? "outline" : "default"} disabled={tagging || busy} onClick={tagWithAi}>
                                            {tagging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                            {tagging ? "Tagging…" : taggedCount ? "Tag again with AI" : "Tag lessons & difficulty with AI"}
                                        </Button>
                                        <Button type="button" size="sm" disabled={!taggedCount || tagging} onClick={() => { setSaving(null); setPreviewOpen(true) }}>
                                            <Eye className="mr-2 h-4 w-4" /> Preview & save
                                        </Button>
                                    </div>

                                    {notice ? (
                                        <p
                                            className={cn(
                                                "mb-3 flex items-start gap-2 rounded-xl border p-3 text-sm",
                                                notice.kind === "ok" && "border-emerald-300 bg-emerald-50 text-emerald-800",
                                                notice.kind === "warn" && "border-amber-300 bg-amber-50 text-amber-800",
                                                notice.kind === "error" && "border-destructive/40 bg-destructive/5 text-destructive",
                                            )}
                                        >
                                            {notice.kind === "ok" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
                                            {notice.text}
                                        </p>
                                    ) : null}

                                    <div className="space-y-4">
                                        {visible.length ? (
                                            visible.map((question) => (
                                                <QuestionCard
                                                    key={`${paper.id}-${question.num}`}
                                                    cardRef={(node) => { cardRefs.current[question.num] = node }}
                                                    question={question}
                                                    paper={paper}
                                                    lessons={lessons}
                                                    onPick={(num, key) => updatePaper(paper.id, (p) => ({ answers: { ...p.answers, [num]: key } }))}
                                                    onTag={(num, change) => updatePaper(paper.id, (p) => ({ tags: { ...p.tags, [num]: { ...p.tags[num], ...change } } }))}
                                                    onType={(num, value) => updatePaper(paper.id, (p) => ({ types: { ...p.types, [num]: value } }))}
                                                    onInclude={(num, value) => updatePaper(paper.id, (p) => ({ include: { ...p.include, [num]: value } }))}
                                                />
                                            ))
                                        ) : (
                                            <p className="py-10 text-center text-muted-foreground">No questions match. Clear the search or switch the filter to All.</p>
                                        )}
                                    </div>
                                </>
                            ) : null}
                        </main>
                    </div>
                )}
            </div>

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
                            {blocked.map((q) => (
                                <p key={q.num}>Q{q.num}: {problemWith(q, paper)}</p>
                            ))}
                        </div>
                    ) : null}

                    <div className="space-y-3">
                        {ready.map((question) => {
                            const tag = paper.tags[question.num]
                            const type = paper.types[question.num] ?? "MCQ"
                            const answer = paper.answers[question.num]
                            const correct = question.options.find((o) => o.key === answer)
                            return (
                                <div key={question.num} className="rounded-xl border p-3">
                                    <div className="mb-1 flex flex-wrap items-center gap-2">
                                        <b className="text-primary">Q{question.num}</b>
                                        <Badge variant="secondary">{QUESTION_TYPES.find((t) => t.id === type)?.label}</Badge>
                                        <Badge variant="outline">{lessonName(tag.lessonId)}</Badge>
                                        <Badge variant="outline" className="capitalize">{tag.difficulty}</Badge>
                                    </div>
                                    <p className="line-clamp-3 whitespace-pre-line text-sm">{questionText(question, paper)}</p>
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
