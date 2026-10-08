import { useCallback, useEffect, useState } from "react"
import { CircleAlert, Sparkles, X } from "@/components/icons"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { cn } from "@/lib/utils"

import { addCertificationWithAi } from "@/services/certificationService"
import { formatLocalDateTime, validateCertificationDetails } from "@/utils/certification-edit"

import CertificationDetails from "@/components/certifications/certification-details"
import { DocumentUploadStep } from "@/components/certifications/document-upload-step.jsx"
import { BadgeUploadStep } from "@/components/certifications/badge-upload-step.jsx"
import { QuestionTypeChoice } from "@/components/certifications/question-type-choice.jsx"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"





const REVIEW_MODES = [
    {
        value: "auto",
        title: "Generate everything",
        description:
            "Builds the whole certification without stopping — curriculum, lessons, quizzes, exams, and the question bank. Everything is saved as drafts for you to edit afterwards.",
    },
    {
        value: "guided",
        title: "Review each step",
        description:
            "Pauses after each part and waits for you to approve, edit, or regenerate it. The run holds until you come back to it.",
    },
]

function ReviewModeChoice({ value, onChange, disabled }) {
    return (
        <fieldset disabled={disabled} className="space-y-3">
            <legend className="text-sm font-medium text-foreground">
                How should this run?
            </legend>

            <p className="text-sm text-muted-foreground">
                Either way the work happens on the server and keeps going if you
                close this.
            </p>

            <RadioGroup
                value={value}
                onValueChange={onChange}
                className="gap-3 pt-1"
            >
                {REVIEW_MODES.map((mode) => (
                    <label
                        key={mode.value}
                        htmlFor={`review-mode-${mode.value}`}
                        className={cn(
                            "flex cursor-pointer gap-3 rounded-lg border p-4 transition",
                            value === mode.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:bg-muted/50"
                        )}
                    >
                        <RadioGroupItem
                            id={`review-mode-${mode.value}`}
                            value={mode.value}
                            className="mt-0.5"
                        />

                        <span className="space-y-1">
                            <span className="block text-sm font-medium text-foreground">
                                {mode.title}
                            </span>

                            <span className="block text-sm text-muted-foreground">
                                {mode.description}
                            </span>
                        </span>
                    </label>
                ))}
            </RadioGroup>
        </fieldset>
    )
}

function formatElapsed(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${String(seconds).padStart(2, "0")}`
}

function getEmptyDetails() {
    return {
        title: "",
        industry: "",
        description: "",
    }
}

function getErrorMessage(error) {
    const responseData = error?.response?.data

    return (
        (typeof responseData === "string" && responseData) ||
        responseData?.message ||
        responseData?.error ||
        error?.message ||
        "Unable to save the certification. Please try again."
    )
}

export default function CertificationFormDrawer({
                                                    open,
                                                    onOpenChange,
                                                    onSaved,
                                                    trigger,
                                                }) {
    const [certificationDetails, setCertificationDetails] = useState(
        getEmptyDetails()
    )

    const [detailsErrors, setDetailsErrors] = useState({})
    const [submissionError, setSubmissionError] = useState("")

    const [sourceDocuments, setSourceDocuments] = useState([])
    const [badgeImage, setBadgeImage] = useState(null)
    const [uploadPercent, setUploadPercent] = useState(0)
    const [processingSeconds, setProcessingSeconds] = useState(0)
    const [reviewMode, setReviewMode] = useState("auto")
    const [questionTypes, setQuestionTypes] = useState([])
    const [questionBankSize, setQuestionBankSize] = useState("300")
    const [lessonCount, setLessonCount] = useState("40")

    const {
        mutateAsync: createWithAi,
        isPending: isBusy,
    } = useMutation({
        mutationFn: ({ payload, documents, mode, questionTypes: chosenTypes, badge, bankSize, lessons }) =>
            addCertificationWithAi(
                payload,
                documents,
                (event) =>
                    setUploadPercent(
                        event.total
                            ? Math.round((event.loaded / event.total) * 100)
                            : 0
                    ),
                mode,
                chosenTypes,
                badge,
                bankSize,
                lessons
            ),
    })

    const isProcessing = isBusy && uploadPercent >= 100
    useEffect(() => {
        if (!isProcessing) {
            setProcessingSeconds(0)
            return
        }
        const startedAt = Date.now()
        const timer = setInterval(
            () => setProcessingSeconds(Math.floor((Date.now() - startedAt) / 1000)),
            1000
        )
        return () => clearInterval(timer)
    }, [isProcessing])

    function resetForm() {
        setCertificationDetails(getEmptyDetails())
        setSourceDocuments([])
        setBadgeImage(null)
        setUploadPercent(0)
        setReviewMode("auto")
        setDetailsErrors({})
        setSubmissionError("")
    }

    useEffect(() => {
        if (open) {
            resetForm()
        }
    }, [open])

    function handleModalChange(nextOpen) {
        if (!nextOpen && isBusy) {
            return
        }

        onOpenChange(nextOpen)

        if (!nextOpen) {
            resetForm()
        }
    }

    function handleDetailsChange(nextDetails) {
        setCertificationDetails(nextDetails)
        setDetailsErrors({})
        setSubmissionError("")
    }

    const handleDocumentsChange = useCallback((documents) => {
        setSourceDocuments(documents)
        setSubmissionError((current) =>
            documents.length > 0 ? "" : current
        )
    }, [])

    async function handleGenerate() {
        const detailsValidationErrors =
            validateCertificationDetails(certificationDetails)

        if (Object.keys(detailsValidationErrors).length > 0) {
            setDetailsErrors(detailsValidationErrors)
            return
        }

        if (sourceDocuments.length === 0) {
            setSubmissionError(
                "Upload at least one document for the AI to build the certification from."
            )
            return
        }

        const bank = Number(questionBankSize)
        if (!questionBankSize || !Number.isFinite(bank) || bank < 10 || bank > 5000) {
            setSubmissionError("Enter a question bank size between 10 and 5000.")
            return
        }
        const lessons = Number(lessonCount)
        if (!lessonCount || !Number.isFinite(lessons) || lessons < 1 || lessons > 300) {
            setSubmissionError("Enter how many lessons to create, between 1 and 300.")
            return
        }

        try {
            setSubmissionError("")

            const payload = {
                title: certificationDetails.title.trim(),
                description: certificationDetails.description.trim(),
                industry: certificationDetails.industry.trim(),
                dateCreated: formatLocalDateTime(),
            }

            const savedCertification = await createWithAi({
                payload,
                documents: sourceDocuments,
                mode: reviewMode,
                questionTypes,
                badge: badgeImage,
                bankSize: bank,
                lessons,
            })

            await onSaved?.(savedCertification)



            onOpenChange(false)
            resetForm()

            toast.info("Generating the certification", {
                description:
                    reviewMode === "auto"
                        ? "It will build the whole thing without stopping. Open it from the list to watch its progress."
                        : "It will pause at each step for your approval. Open it from the list to review.",
            })
        } catch (error) {
            const message = getErrorMessage(error)

            setSubmissionError(message)

            toast.error("Could not start generation", { description: message })
        } finally {
            setUploadPercent(0)
        }
    }

    return (
        <Drawer
            open={open}
            onOpenChange={handleModalChange}
            direction="right"
        >
            {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}


            <DrawerContent
                className={cn(
                    "flex flex-col gap-0 overflow-hidden p-0",
                    "data-[vaul-drawer-direction=right]:sm:max-w-none",
                    "data-[vaul-drawer-direction=right]:w-[96vw]",
                    "data-[vaul-drawer-direction=right]:sm:w-[92vw]",
                    "data-[vaul-drawer-direction=right]:lg:w-[50vw]",
                )}
            >

                <DrawerHeader className="relative gap-1 border-b border-border px-5 py-4 pr-14 text-left sm:px-6">
                    <DrawerTitle className="text-lg">
                        Create Certification
                    </DrawerTitle>

                    <DrawerDescription className="sr-only">
                        Certification details and source documents.
                    </DrawerDescription>

                    <DrawerClose asChild>
                        <button
                            type="button"
                            aria-label="Close"
                            className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                            <X className="size-4" aria-hidden="true" />
                        </button>
                    </DrawerClose>
                </DrawerHeader>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-6">
                    <div className="space-y-8">
                        <CertificationDetails
                            value={certificationDetails}
                            onChange={handleDetailsChange}
                            errors={detailsErrors}
                            disabled={isBusy}
                        />

                        <div className="border-t border-border pt-8">
                            <BadgeUploadStep
                                value={badgeImage}
                                onChange={setBadgeImage}
                                disabled={isBusy}
                            />
                        </div>

                        <div className="border-t border-border pt-8">
                            <DocumentUploadStep
                                disabled={isBusy}
                                onFilesChange={handleDocumentsChange}
                            />
                        </div>

                        <div className="border-t border-border pt-8">
                            <QuestionTypeChoice
                                value={questionTypes}
                                onChange={setQuestionTypes}
                                disabled={isBusy}
                            />
                        </div>

                        <div className="border-t border-border pt-8">
                            <p className="text-sm font-semibold text-foreground">How big should it be?</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Both are required. They decide how long the run takes and what it
                                costs, so the form asks for them rather than reading them from a
                                config file you cannot see from here.
                            </p>

                            <div className="mt-4 grid gap-5 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="lesson-count"
                                        className="text-sm font-semibold text-foreground"
                                    >
                                        Lessons
                                    </label>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        How many lessons the whole curriculum should contain. They
                                        are spread across the categories by how much material each
                                        area holds, not divided evenly.
                                    </p>
                                    <Input
                                        id="lesson-count"
                                        type="number"
                                        min={1}
                                        max={300}
                                        step={1}
                                        inputMode="numeric"
                                        value={lessonCount}
                                        onChange={(event) => setLessonCount(event.target.value)}
                                        disabled={isBusy}
                                        className="mt-3 max-w-[220px]"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="question-bank-size"
                                        className="text-sm font-semibold text-foreground"
                                    >
                                        Question bank size
                                    </label>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        The pool every quiz, retake and practice session draws from.
                                        Each difficulty level gets an equal share, and every lesson
                                        gets at least one question however small the number.
                                    </p>
                                    <Input
                                        id="question-bank-size"
                                        type="number"
                                        min={10}
                                        max={5000}
                                        step={10}
                                        inputMode="numeric"
                                        value={questionBankSize}
                                        onChange={(event) => setQuestionBankSize(event.target.value)}
                                        disabled={isBusy}
                                        className="mt-3 max-w-[220px]"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-border pt-8">
                            <ReviewModeChoice
                                value={reviewMode}
                                onChange={setReviewMode}
                                disabled={isBusy}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-border bg-background px-5 py-4 sm:px-6">
                    {submissionError && (
                        <Alert variant="destructive" className="relative pr-12">
                            <CircleAlert className="h-4 w-4" />

                            <AlertTitle>Cannot create certification</AlertTitle>

                            <AlertDescription>
                                {submissionError}
                            </AlertDescription>

                            <button
                                type="button"
                                onClick={() => setSubmissionError("")}
                                aria-label="Dismiss error"
                                className="absolute top-3 right-3 rounded-md p-1 text-destructive transition hover:bg-destructive/10"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </Alert>
                    )}



                    {isBusy && (
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                                <span>
                                    {uploadPercent < 100
                                        ? `Uploading ${sourceDocuments.length} document${sourceDocuments.length === 1 ? "" : "s"}…`
                                        : `Reading ${sourceDocuments.length} document${sourceDocuments.length === 1 ? "" : "s"} and extracting figures…`}
                                </span>
                                <span className="font-mono tabular-nums">
                                    {uploadPercent < 100
                                        ? `${uploadPercent}%`
                                        : formatElapsed(processingSeconds)}
                                </span>
                            </div>

                            {uploadPercent < 100 ? (
                                <Progress value={uploadPercent} className="h-1.5" />
                            ) : (
                                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                                    <div className="h-full w-1/3 animate-[loading-sweep_1.4s_ease-in-out_infinite] rounded-full bg-primary" />
                                </div>
                            )}

                            {uploadPercent >= 100 && (
                                <p className="text-xs leading-5 text-muted-foreground">
                                    Large PDFs take a few minutes — every page is
                                    read and its diagrams pulled out. This keeps
                                    going even if you close this.
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-end">
                        <Button
                            type="button"
                            onClick={handleGenerate}
                            disabled={isBusy}
                            className="min-w-[185px] gap-2"
                        >
                            {isBusy ? (
                                "Starting..."
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4" />
                                    Generate Certification
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
