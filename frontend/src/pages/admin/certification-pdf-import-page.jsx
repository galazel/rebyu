import { memo, useEffect, useMemo, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"

import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Eye,
    KeyRound,
    Loader2,
    Pencil,
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
import { clearDraft, loadDraft, saveDraft } from "@/utils/pdf-import-draft.js"
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
/**
 * What makes two questions the same question: the stem AND the choices.
 * Papers reuse a stem ("Which of the following is an appropriate description
 * concerning the Java language?") with different choices, and those are
 * different questions. Null for a stem too short to tell questions apart.
 */
function questionPrint(question) {
    const stem = fingerprint(question.stem)
    if (stem.length < 40) return null
    return `${stem}|${question.options.map((option) => fingerprint(option.text)).join("|")}`
}

/** A question as the server's duplicate check compares it: the stem, then its choices after a U+0001 (a stem can hold line breaks). */
function duplicateText(question) {
    return [question.stem, ...question.options.map((option) => option.text || "")].join("\u0001")
}

const prints = new Map()
function fingerprint(text) {
    // Cached: the duplicate check runs on every render, over every question.
    let print = prints.get(text)
    if (print === undefined) {
        print = (text || "").toLowerCase().replace(/[^0-9a-z]+/g, "")
        prints.set(text, print)
    }
    return print
}

/** The questions of a paper that have no correct answer yet. */
function unanswered(paper) {
    return paper.questions.filter((question) => !paper.answers[question.num])
}

/**
 * The questions of a paper that have their correct answer -- the only ones
 * tagged, listed on the answer sheet and saved. One without an answer is
 * left out until its key is added.
 */
function answered(paper) {
    return paper.questions.filter((question) => paper.answers[question.num])
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

/**
 * One paper's rows on the answer sheet. Memoized like the cards: a change to
 * one paper redraws its hundred rows, not every paper's.
 */
const SheetPaper = memo(function SheetPaper({ paper, showName, onJump }) {
    return (
        <div className="mb-3">
            {showName ? (
                <p className="sticky top-0 mb-1 truncate bg-background py-1 text-xs font-semibold">{paper.name.replace(/\.pdf$/i, "")}</p>
            ) : null}
            {answered(paper).map((question) => {
                const answer = paper.answers[question.num]
                return (
                    <button
                        key={question.num}
                        type="button"
                        onClick={() => onJump(paper.id, question.num)}
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
    )
})

/** What to upload and what happens next, shown before the first upload. */
function ImportGuide() {
    const steps = [
        {
            title: "Name the files after their exam",
            body: "The question file ends in \"Questions\" and its key in \"Answer Key\", with the same exam title before it (see below). Any exam or school's reviewer works -- its layout does not matter.",
        },
        {
            title: "Upload them all and check the pairs",
            body: "Select every PDF at once. Files with the same title are paired and listed for you to check. A name that breaks the format, or a key with no question file, is shown as an error and must be fixed before you continue.",
        },
        {
            title: "Wait until every file is read",
            body: "Problems -- questions the key gives no answer for, a file that could not be read -- are listed once the last file is done.",
        },
        {
            title: "Check the questions",
            body: "Each paper is a section with its questions below it. Compare a question with the page it came from with Show original; click a choice to change the answer, and replace, remove or add images. Questions without an answer are skipped.",
        },
        {
            title: "Choose how each question is saved",
            body: "Multiple choice keeps the choices. Short answer and Descriptive make the learner type; the correct choice's text becomes the answer.",
        },
        {
            title: "Tag with AI, then Preview & save",
            body: "The AI sets each question's lesson and difficulty. Questions no lesson fits, and duplicates of the bank or of each other, are dropped. Nothing is saved until you confirm the preview.",
        },
    ]
    return (
        <div className="mb-4 rounded-2xl border bg-background p-5 shadow-sm">
            <h2 className="text-base font-bold">How importing works</h2>
            <ol className="mt-3 space-y-3">
                {steps.map((step, index) => (
                    <li key={step.title} className="flex gap-3">
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {index + 1}
                        </span>
                        <div>
                            <p className="text-sm font-semibold">{step.title}</p>
                            <p className="text-sm text-muted-foreground">{step.body}</p>
                        </div>
                    </li>
                ))}
            </ol>

            <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-3">
                <p className="text-sm font-semibold">File names</p>
                <p className="mt-1 text-sm text-muted-foreground">
                    <span className="font-mono">&lt;Exam title&gt; Questions.pdf</span> and{" "}
                    <span className="font-mono">&lt;Exam title&gt; Answer Key.pdf</span>. Spaces, _ or - may separate the words, and
                    capitals do not matter. "Question", "Answers", "Answer" and "Key" are accepted too.
                </p>
                <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs text-muted-foreground">
                            <tr>
                                <th className="py-1 pr-4 font-semibold">Questions</th>
                                <th className="py-1 font-semibold">Its answer key</th>
                            </tr>
                        </thead>
                        <tbody className="font-mono text-xs">
                            {[
                                ["Midterm Exam Questions.pdf", "Midterm Exam Answer Key.pdf"],
                                ["Networking Reviewer Set 2 Questions.pdf", "Networking Reviewer Set 2 Answer Key.pdf"],
                                ["2021S_IP_Question.pdf", "2021S_IP_Answer.pdf"],
                            ].map(([paper, key]) => (
                                <tr key={paper} className="border-t">
                                    <td className="py-1 pr-4">{paper}</td>
                                    <td className="py-1">{key}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                    A question file with no key is allowed when its answers are printed inside it.
                </p>
            </div>
        </div>
    )
}

/**
 * One question. Memoized, and given only stable props -- the paper it is on,
 * and one `actions` object that never changes -- so a change to one paper
 * re-renders that paper's cards and no others. With thirty papers of a
 * hundred questions each, re-rendering every card on any change is what
 * made every control on the page lag.
 */
const QuestionCard = memo(function QuestionCard({ question, paper, lessons, duplicate, actions, cardRefs }) {
    const onPick = (num, key) => actions.pick(paper.id, num, key)
    const onTag = (num, change) => actions.tag(paper.id, num, change)
    const onType = (num, value) => actions.type(paper.id, num, value)
    const onInclude = (num, value) => actions.include(paper.id, num, value)
    const onFigures = (num, figureSrcs) => actions.figures(paper.id, num, figureSrcs)
    const onOptionImage = (num, key, canvas) => actions.optionImage(paper.id, num, key, canvas)
    const onImageError = actions.imageError
    const onDelete = (num) => actions.remove(paper.id, num)
    // Editing works on a draft; Save writes it back, Cancel drops it.
    const [draft, setDraft] = useState(null)
    const startEdit = () =>
        setDraft({ stem: question.stem, texts: Object.fromEntries(question.options.map((o) => [o.key, o.text || ""])) })
    const saveEdit = () => {
        actions.edit(paper.id, question.num, draft.stem.trim(), draft.texts)
        setDraft(null)
    }
    const cardRef = (node) => { cardRefs.current[`${paper.id}-${question.num}`] = node }
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
                // Off-screen cards are not laid out or painted until scrolled to.
                "rounded-2xl border bg-background p-5 shadow-sm [contain-intrinsic-size:auto_480px] [content-visibility:auto]",
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
                {draft ? null : (
                    <Button type="button" size="xs" variant="outline" onClick={startEdit} aria-label={`Edit question ${question.num}`}>
                        <Pencil className="h-3 w-3" /> Edit
                    </Button>
                )}
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
                    {question.options.map((option) => (
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
                        <Button type="button" size="sm" variant="ghost" onClick={() => setDraft(null)}>
                            Cancel
                        </Button>
                        <Button type="button" size="sm" disabled={!draft.stem.trim()} onClick={saveEdit}>
                            Save changes
                        </Button>
                    </div>
                </div>
            ) : (
                <p className="mb-3 max-w-[72ch] whitespace-pre-line font-serif text-[1.05rem] leading-relaxed">
                    {question.stem}
                </p>
            )}

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

            {/* Saved as text, the learner sees no choices: they type. The card
                shows that, and what their answer is marked against. */}
            {type !== "MCQ" ? (
                <div className="mt-3 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        {type === "SHORT_ANSWER" ? "Learner types a short answer" : "Learner writes an answer"}
                    </p>
                    <div className="mt-2 rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground">Their answer…</div>
                    <p className="mt-2 text-sm">
                        {type === "SHORT_ANSWER" ? "Marked correct when it matches: " : "Marked by AI against: "}
                        {(() => {
                            const correct = question.options.find((option) => option.key === answer)
                            if (!correct) return <em className="text-destructive">no answer chosen yet -- pick one of the choices below</em>
                            if (!correct.text) return <em className="text-destructive">the correct choice is a picture, so there is no text to match -- keep this one as Multiple choice</em>
                            return <strong>{correct.text}</strong>
                        })()}
                    </p>
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
                    pictures ? "grid grid-cols-1 sm:grid-cols-2" : "grid",
                    type !== "MCQ" && "mt-1 text-sm opacity-80",
                    // While editing, the choices are the boxes above.
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
})

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
    const [duplicatesOpen, setDuplicatesOpen] = useState(false)
    const [saving, setSaving] = useState(null)

    const { data: certifications = [] } = useQuery({
        queryKey: ["admin-certifications", "question-bank-page"],
        queryFn: () => getAllCertifications(),
        staleTime: 5 * 60 * 1000,
    })
    const certification = certifications.find(
        (item) => String(item.certificationId ?? item.id) === String(certificationId),
    )

    const busy = progress !== null

    // The import survives a refresh: it is restored from the browser's own
    // storage on load, and each change is written back a moment later --
    // only the papers that changed. Nothing is saved until the restore has
    // run, so an empty first render cannot overwrite what was there.
    const [restored, setRestored] = useState(false)
    const written = useRef(new Map())
    useEffect(() => {
        let cancelled = false
        setRestored(false)
        loadDraft(certificationId).then((draft) => {
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
    }, [certificationId])
    useEffect(() => {
        if (!restored) return undefined
        const timer = setTimeout(() => {
            const changed = papers.filter((paper) => written.current.get(paper.id) !== paper)
            const ids = new Set(papers.map((paper) => paper.id))
            const removed = [...written.current.keys()].filter((id) => !ids.has(id))
            saveDraft(certificationId, { changed, removed, order: [...ids], keys, lessons }).then((ok) => {
                if (!ok) return
                for (const paper of changed) written.current.set(paper.id, paper)
                for (const id of removed) written.current.delete(id)
            })
        }, 800)
        return () => clearTimeout(timer)
    }, [certificationId, papers, keys, lessons, restored])

    function startOver() {
        if (!window.confirm("Remove every paper from this import? Questions already saved to the question bank stay there.")) return
        latest.current = { papers: [], keys: [] }
        setPapers([])
        setKeys([])
        setFailures([])
        setNotice(null)
        written.current = new Map()
        clearDraft(certificationId)
    }
    // A key read before its paper is not "unmatched" yet, and a paper read
    // before its key is not "missing answers": the errors wait for the last file.

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

    /**
     * An answer key PDF for the paper in the open tab: attached to it directly,
     * whatever its date says -- the admin chose the paper. A date that
     * disagrees, or a key whose question numbers do not fit the paper, is
     * said out loud rather than silently applied.
     */
    async function addKeyForPaper(file, target) {
        setProgress({ label: `Reading answer key ${file.name}`, percent: 30 })
        try {
            const read = await readExamPdf(file, null, readDocumentPage, readDocumentLayout)
            // Read the same way as a key uploaded with its paper: a key laid
            // out like a paper -- questions with their answers marked --
            // gives its answers too.
            const answers = read.kind === "key"
                ? read.answers
                : Object.fromEntries((read.questions ?? []).filter((q) => q.answer).map((q) => [q.num, q.answer]))
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

    /**
     * Reads the pairs the upload step made -- each a question file and, when
     * there is one, the answer key with the same title -- and attaches every
     * key to its own paper. The pairing is the file names', checked by the
     * admin before Next; nothing here guesses which key belongs where.
     */
    async function addFiles(pairList) {
        const loaded = new Set(latest.current.papers.map((p) => p.fileId))
        const pairs = pairList.filter((pair) => !loaded.has(`${pair.paper.name}:${pair.paper.size}`))
        setFailures((current) =>
            // A file added again is tried again; its old failure goes.
            current.filter((f) => !pairs.some((pair) => [pair.paper.name, pair.key?.name].includes(f.name))),
        )

        for (const [index, pair] of pairs.entries()) {
            const label = pairs.length > 1 ? ` (${index + 1} of ${pairs.length})` : ""
            const reportProgress = (file) => async (page, total, phase) => {
                setProgress({
                    label: phase === "ai"
                        ? `Reading ${file.name}${label} with AI, page ${page} of ${total}`
                        : phase === "layout"
                          ? `Reading the layout of ${file.name}${label} (${total} pages, about ${Math.max(10, total * 2)} seconds)`
                          : `Opening ${file.name}${label}, page ${page} of ${total}`,
                    percent: phase === "layout" ? 60 : Math.round((page / total) * 100),
                })
                await new Promise((resolve) => setTimeout(resolve, 0))
            }

            let result
            setProgress({ label: `Opening ${pair.paper.name}${label}`, percent: 2 })
            try {
                result = await readExamPdf(pair.paper, reportProgress(pair.paper), readDocumentPage, readDocumentLayout)
                if (result.kind === "key") {
                    throw new Error("it is named as questions, but it reads as an answer key -- rename it to end in \"Answer Key\"")
                }
            } catch (error) {
                setFailures((current) => [...current, { name: pair.paper.name, error: error?.message || String(error) }])
                continue
            }

            // Answers printed in the paper itself, then the key's on top.
            let answers = Object.fromEntries(result.questions.filter((q) => q.answer).map((q) => [q.num, q.answer]))
            let keyName = null
            let keyEntry = null
            const fileId = `${pair.paper.name}:${pair.paper.size}`
            const id = `${fileId}:${Date.now()}`
            if (pair.key) {
                setProgress({ label: `Reading answer key ${pair.key.name}${label}`, percent: 90 })
                try {
                    const key = await readExamPdf(pair.key, reportProgress(pair.key), readDocumentPage, readDocumentLayout)
                    // A key laid out like a paper -- questions with their
                    // answers marked -- gives its answers the same way.
                    const keyAnswers = key.kind === "key"
                        ? key.answers
                        : Object.fromEntries((key.questions ?? []).filter((q) => q.answer).map((q) => [q.num, q.answer]))
                    if (!Object.keys(keyAnswers).length) throw new Error("no answers could be read from it")
                    answers = { ...answers, ...keyAnswers }
                    keyName = pair.key.name
                    keyEntry = {
                        id: `${pair.key.name}:${pair.key.size}:${Date.now()}`,
                        fileId: `${pair.key.name}:${pair.key.size}`,
                        name: pair.key.name,
                        info: key.info,
                        answers: keyAnswers,
                        count: Object.keys(keyAnswers).length,
                        paperId: id,
                    }
                } catch (error) {
                    setFailures((current) => [...current, { name: pair.key.name, error: error?.message || String(error) }])
                }
            }

            const paper = {
                id,
                fileId,
                name: result.name,
                info: result.info,
                questions: result.questions.map(forDisplay),
                readBy: result.readBy,
                profile: result.profile,
                answers,
                keyName,
                tags: {},
                types: {},
                include: {},
                saved: {},
                duplicates: {},
            }
            latest.current = {
                papers: [...latest.current.papers, paper],
                keys: keyEntry ? [...latest.current.keys, keyEntry] : latest.current.keys,
            }
            setPapers(latest.current.papers)
            setKeys(latest.current.keys)

            const questions = result.questions
            // Retried: a backend restarting mid-upload fails one call, and the
            // paper would go unchecked for good.
            const check = (attempt = 0) =>
                findDuplicates(certificationId, questions.map(duplicateText)).catch((error) =>
                    attempt < 3
                        ? new Promise((resolve) => setTimeout(resolve, 5000 * (attempt + 1))).then(() => check(attempt + 1))
                        : Promise.reject(error),
                )
            check()
                .then((found) => {
                    const bank = {}
                    questions.forEach((q, position) => {
                        if (found.duplicates?.[position]) bank[q.num] = found.duplicates[position]
                    })
                    updatePaper(id, () => ({ duplicates: bank }))
                })
                .catch(() => {
                    // The upload still works; only the question-bank check is missing.
                    setNotice({ kind: "warn", text: `${result.name}: could not check the question bank for duplicates.` })
                })
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
     * left unticked, with the reason on its card. Only questions with their
     * answer are tagged; the rest wait for their key.
     */
    async function tagWithAi() {
        const targets = latest.current.papers
            .map((p) => ({ ...p, questions: answered(p) }))
            .filter((p) => p.questions.length)
        const skipped = latest.current.papers.reduce((sum, p) => sum + unanswered(p).length, 0)
        if (!targets.length) {
            setNotice({ kind: "error", text: "No question has its answer yet. Add the answer keys first." })
            return
        }
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
                const result = await tagQuestions(certificationId, texts, target.questions.map(duplicateText))
                setLessons(result.lessons ?? [])
                const tags = {}
                const include = {}
                target.questions.forEach((question, position) => {
                    const tag = { ...(result.tags?.[position] ?? {}) }
                    // Across papers too: the same question in two uploads.
                    const print = questionPrint(question)
                    if (!tag.duplicate && print && seen.has(print)) {
                        tag.duplicate = "upload"
                        tag.duplicateOf = seen.get(print)
                    }
                    if (print && !seen.has(print)) seen.set(print, `${target.name} Q${question.num}`)
                    if (tag.noLesson) noLesson += 1
                    else if (tag.duplicate) duplicates += 1
                    if (tag.source && tag.source !== "ai") fallback += 1
                    tags[question.num] = tag
                    include[question.num] = !dropReason(tag)
                    tagged += 1
                })
                updatePaper(target.id, (p) => ({ tags: { ...p.tags, ...tags }, include: { ...p.include, ...include } }))
            }
            const parts = [`${tagged} questions tagged.`]
            if (noLesson) parts.push(`${noLesson} dropped: no lesson in this certification fits them.`)
            if (duplicates) parts.push(`${duplicates} dropped as duplicates.`)
            if (skipped) parts.push(`${skipped} without an answer were skipped.`)
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

    // Every duplicate across the papers, for the list the top bar opens.
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

    // What a question card can do, as one object that never changes: the
    // cards are memoized, and a fresh function per render would re-render
    // all of them. Each call reaches the current handlers through the ref.
    const handlers = useRef(null)
    handlers.current = { updatePaper, updateQuestion, deleteQuestions, setNotice, setFilter, setTerm }
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
            imageError: (error) => handlers.current.setNotice({ kind: "error", text: error?.message || "That image could not be used." }),
            remove: (paperId, num) => handlers.current.deleteQuestions(paperId, [num]),
            edit: (paperId, num, stem, texts) =>
                handlers.current.updateQuestion(paperId, num, (q) => ({
                    stem,
                    options: q.options.map((o) => (o.key in texts ? { ...o, text: texts[o.key] } : o)),
                })),
            jump: (paperId, num) => {
                handlers.current.setFilter("all")
                handlers.current.setTerm("")
                requestAnimationFrame(() =>
                    cardRefs.current[`${paperId}-${num}`]?.scrollIntoView({ behavior: "smooth", block: "start" }),
                )
            },
        }),
        [],
    )

    function deleteQuestions(paperId, nums) {
        const gone = new Set(nums.map(String))
        updatePaper(paperId, (p) => ({ questions: p.questions.filter((q) => !gone.has(String(q.num))) }))
    }

    // What Save would write, across every paper.
    const pending = papers.flatMap((p) =>
        answered(p)
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

    const totalQuestions = papers.reduce((sum, p) => sum + p.questions.length, 0)
    const answeredCount = papers.reduce((sum, p) => sum + answered(p).length, 0)
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
                    <>
                        <Button type="button" size="sm" variant="ghost" className="text-destructive" disabled={busy || tagging} onClick={startOver}>
                            <Trash2 className="mr-2 h-4 w-4" /> Start over
                        </Button>
                        <Button type="button" size="sm" disabled={busy} onClick={() => setUploadOpen(true)}>
                            <UploadIcon className="mr-2 h-4 w-4" /> Add PDFs
                        </Button>
                    </>
                ) : null}
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto">
                {!papers.length && !restored ? (
                    <p className="mt-[20vh] flex items-center justify-center gap-2 text-sm text-muted-foreground" aria-live="polite">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading your import…
                    </p>
                ) : !papers.length ? (
                    <section className="mx-auto mt-[6vh] max-w-3xl px-5">
                        <ImportGuide />
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
                            <p className="mb-2 text-xs text-muted-foreground">Green marks the answer. Click a number to jump to it. Questions without an answer are left off and will not be saved.</p>
                            {papers.filter((item) => answered(item).length).map((item) => (
                                <SheetPaper key={item.id} paper={item} showName={papers.length > 1} onJump={cardActions.jump} />
                            ))}
                        </aside>

                        <main className="min-w-0">
                            {/* Everything that acts on all papers at once. */}
                            <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border bg-background p-3">
                                <p className="flex-1 text-sm text-muted-foreground">
                                    <strong className="text-foreground">
                                        {totalQuestions} questions{papers.length > 1 ? ` in ${papers.length} papers` : ""}
                                    </strong>
                                    {answeredCount < totalQuestions ? `, ${answeredCount} with their answer` : ""}
                                    {taggedCount ? `, ${taggedCount} tagged` : ""}.
                                </p>
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
                                <Button type="button" size="sm" variant={taggedCount ? "outline" : "default"} disabled={tagging || busy} onClick={tagWithAi}>
                                    {tagging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                    {tagging ? "Tagging…" : taggedCount ? "Tag all again with AI" : `Tag ${answeredCount} with AI`}
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
                            {!busy && papers.some((p) => unanswered(p).length) ? (
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
                                                        ? `no answer key -- none of its ${p.questions.length} questions has an answer, so it is skipped. Add its answer key PDF to include it.`
                                                        : `${missing.length} of ${p.questions.length} questions have no answer (${listNumbers(missing)}) and are skipped. Mark them, or add the full key, to include them.`}
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
                                                {/* A plain select: the styled one froze the page for a moment on
                                                    every open, with three thousand cards below it. */}
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

            <Dialog open={duplicatesOpen} onOpenChange={setDuplicatesOpen}>
                <DialogContent className="max-h-[calc(100dvh-3rem)] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Duplicate questions</DialogTitle>
                        <DialogDescription>
                            {duplicateList.length} question{duplicateList.length === 1 ? " repeats" : "s repeat"} one already in the question bank
                            or earlier in this upload. Deleting keeps the first copy.
                        </DialogDescription>
                    </DialogHeader>
                    {/* At the top, not after hundreds of rows. */}
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
