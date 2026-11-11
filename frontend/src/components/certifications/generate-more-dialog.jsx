import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { CircleAlert, Layers, Sparkles, X } from "@/components/icons"
import { cn } from "@/lib/utils"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { DocumentUploadStep } from "@/components/certifications/document-upload-step.jsx"
import { QuestionTypeChoice } from "@/components/certifications/question-type-choice.jsx"
import { ReviewModeChoice, SectionHeading } from "@/components/certifications/certification-form-drawer.jsx"
import {
  GenerationEstimate,
  estimateGeneration,
  generationEstimateLevel,
  hasEnoughCredit,
} from "@/components/certifications/generation-estimate.jsx"
import { markGenerationQueued } from "@/hooks/use-active-generations.js"
import { getAiCredits } from "@/services/aiWorkflowService"
import { appendToCertificationWithAi } from "@/services/certificationService.js"

const MAX_INSTRUCTIONS = 2000
const DEFAULT_LESSONS = "10"
const DEFAULT_BANK_SIZE = "100"

const KEPT = [
  "Majors, modules, lessons, quizzes and the question bank you already have stay exactly as they are.",
  "Lessons that already exist are not written again — the planner sees the current outline and adds only what is new.",
  "The diagnostic and mock exam are rebuilt over old and new material together. The previous ones are archived, and learners keep their past attempts.",
]

function errorMessage(error) {
  return (
    error?.response?.data?.message ??
    error?.message ??
    "Could not start the generation. Please try again."
  )
}

/**
 * "Add with AI" on an existing certification: generates further majors, modules and lessons
 * (with their quizzes, exams and question-bank items) and appends them. Same side drawer as
 * Create Certification. `onStarted` lets the page open its live progress view.
 */
export default function GenerateMoreDialog({ open, onOpenChange, certification, onStarted }) {
  const queryClient = useQueryClient()
  const [files, setFiles] = useState([])
  const [instructions, setInstructions] = useState("")
  const [questionTypes, setQuestionTypes] = useState([])
  const [reviewMode, setReviewMode] = useState("auto")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadPercent, setUploadPercent] = useState(0)
  const [submissionError, setSubmissionError] = useState("")
  const [formKey, setFormKey] = useState(0)
  const [lessonCount, setLessonCount] = useState(DEFAULT_LESSONS)
  const [questionBankSize, setQuestionBankSize] = useState(DEFAULT_BANK_SIZE)
  // A large run asks once before starting; changing either size asks again.
  const [confirmedLarge, setConfirmedLarge] = useState(false)

  const credits = useQuery({
    queryKey: ["ai-credits"],
    queryFn: getAiCredits,
    enabled: Boolean(open),
    staleTime: 0,
    // Fresh on every open (staleTime 0), retried through a brief AI-service restart, so the balance is rarely "unknown".
    retry: 2,
  })
  const estimate = estimateGeneration(lessonCount, questionBankSize, credits.data?.rates, reviewMode)
  const isLargeRun = generationEstimateLevel(estimate.tokens) === "high"
  const notEnoughCredit = hasEnoughCredit(credits.data, estimate.cost) === false

  const certificationId = certification?.certificationId ?? certification?.id
  const majorCount = certification?.majorCategory?.length ?? 0
  const existingLessons = (certification?.majorCategory ?? []).reduce(
    (total, major) =>
      total + (major?.middleCategory ?? []).reduce((sum, middle) => sum + (middle?.lessons?.length ?? 0), 0),
    0
  )
  const hasInput = files.length > 0 || instructions.trim().length > 0

  function reset() {
    setFiles([])
    setInstructions("")
    setQuestionTypes([])
    setReviewMode("auto")
    setLessonCount(DEFAULT_LESSONS)
    setQuestionBankSize(DEFAULT_BANK_SIZE)
    setConfirmedLarge(false)
    setIsSubmitting(false)
    setUploadPercent(0)
    setSubmissionError("")
    setFormKey((key) => key + 1)
  }

  function handleOpenChange(next) {
    if (!next && isSubmitting) return
    if (!next) reset()
    onOpenChange(next)
  }

  async function handleSubmit() {
    if (!hasInput) {
      setSubmissionError("Upload documents, or say what to add — for example, which domain or topics.")
      return
    }

    const lessons = Number(lessonCount)
    if (!lessonCount || !Number.isInteger(lessons) || lessons < 1 || lessons > 300) {
      setSubmissionError("Enter how many new lessons to add, between 1 and 300.")
      return
    }
    const bank = Number(questionBankSize)
    if (!questionBankSize || !Number.isInteger(bank) || bank < 10 || bank > 5000) {
      setSubmissionError("Enter how many new questions to add, between 10 and 5000.")
      return
    }
    if (notEnoughCredit) {
      setSubmissionError(
        "Your OpenRouter balance is below this run's estimated cost. Top up, or lower the lessons or question count."
      )
      return
    }
    if (isLargeRun && !confirmedLarge) {
      setConfirmedLarge(true)
      return
    }

    setSubmissionError("")
    setIsSubmitting(true)
    setUploadPercent(files.length ? 0 : 100)
    try {
      await appendToCertificationWithAi(certificationId, files, {
        additionalInstructions: instructions,
        questionTypes,
        reviewMode,
        lessonCount: lessons,
        questionBankSize: bank,
        onUploadProgress: (event) => {
          if (event?.total) setUploadPercent(Math.min(100, Math.round((event.loaded / event.total) * 100)))
        },
      })

      // Show the run as started straight away; the active-runs poll takes over once it appears.
      markGenerationQueued(certificationId)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-certifications"] }),
        queryClient.invalidateQueries({ queryKey: ["workflow-runs"] }),
      ])

      toast.success("Adding to the certification", {
        description:
          reviewMode === "auto"
            ? "It builds the new material without stopping and appends it as each part is written."
            : "It pauses after each step for your approval — open the progress view to review it.",
      })
      onOpenChange(false)
      reset()
      onStarted?.()
    } catch (error) {
      const message = errorMessage(error)
      setSubmissionError(message)
      toast.error("Could not start the generation", { description: message })
      setIsSubmitting(false)
      setUploadPercent(0)
    }
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction="right">
      <DrawerContent
        className={cn(
          "flex flex-col gap-0 overflow-hidden p-0",
          "data-[vaul-drawer-direction=right]:sm:max-w-none",
          "data-[vaul-drawer-direction=right]:w-[96vw]",
          "data-[vaul-drawer-direction=right]:sm:w-[92vw]",
          "data-[vaul-drawer-direction=right]:lg:w-[50vw]"
        )}
      >
        <DrawerHeader className="relative gap-1 border-b border-border px-5 py-4 pr-14 text-left sm:px-6">
          <DrawerTitle className="text-lg">Add to {certification?.title ?? "this certification"}</DrawerTitle>
          <p className="text-sm text-muted-foreground">
            Generate another domain, new modules or further lessons — with their quizzes, unit exams and
            question-bank items — and append them to what is already here.
          </p>
          <DrawerDescription className="sr-only">Generate new material and append it to this certification.</DrawerDescription>
          <DrawerClose asChild>
            <button
              type="button"
              aria-label="Close"
              disabled={isSubmitting}
              className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-6">
          <div className="space-y-8">
            <section className="space-y-4">
              <SectionHeading title="What stays the same">
                {majorCount > 0
                  ? `This certification has ${majorCount} major ${majorCount === 1 ? "category" : "categories"} and ${existingLessons} ${existingLessons === 1 ? "lesson" : "lessons"} today.`
                  : "This certification has no content yet — the run builds it from scratch."}
              </SectionHeading>
              <ul className="space-y-2 rounded-lg border border-border bg-muted/40 p-4">
                {KEPT.map((line) => (
                  <li key={line} className="flex gap-2.5 text-sm leading-6 text-muted-foreground">
                    <Layers className="mt-1 size-3.5 shrink-0 text-primary" aria-hidden="true" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-3 border-t border-border pt-8">
              <SectionHeading title="What should be added?">
                Name the domain, modules or topics to add. Required when you upload no documents; with documents it
                narrows what is taken from them.
              </SectionHeading>
              <Textarea
                id="append-instructions"
                value={instructions}
                maxLength={MAX_INSTRUCTIONS}
                disabled={isSubmitting}
                onChange={(event) => {
                  setInstructions(event.target.value)
                  if (submissionError) setSubmissionError("")
                }}
                placeholder="e.g. Add the Business and Ethics domain only; the other four are already covered."
                rows={4}
              />
              <p className="text-right text-xs tabular-nums text-muted-foreground">
                {instructions.length}/{MAX_INSTRUCTIONS}
              </p>
            </section>

            <div className="border-t border-border pt-8">
              <DocumentUploadStep
                key={formKey}
                optional
                onFilesChange={setFiles}
                disabled={isSubmitting}
                description="The syllabus section, exam guide or notes for the new material. The new lessons and questions are drawn from these; leave it empty to build from your instructions alone."
              />
            </div>

            <div className="border-t border-border pt-8">
              <QuestionTypeChoice value={questionTypes} onChange={setQuestionTypes} disabled={isSubmitting} />
            </div>

            <section className="space-y-4 border-t border-border pt-8">
              <SectionHeading title="How big should it be?">
                Both count only the new material, not the lessons and questions you already have. They decide how long
                the run takes and what it costs.
              </SectionHeading>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="append-lesson-count">New lessons</FieldLabel>
                  <Input
                    id="append-lesson-count"
                    type="number"
                    min={1}
                    max={300}
                    step={1}
                    inputMode="numeric"
                    value={lessonCount}
                    onChange={(event) => {
                      setLessonCount(event.target.value)
                      setConfirmedLarge(false)
                    }}
                    disabled={isSubmitting}
                    aria-describedby="append-lesson-count-description"
                  />
                  <FieldDescription id="append-lesson-count-description">
                    Spread across the new or existing categories by how much new material each holds.
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="append-bank-size">New question bank items</FieldLabel>
                  <Input
                    id="append-bank-size"
                    type="number"
                    min={10}
                    max={5000}
                    step={10}
                    inputMode="numeric"
                    value={questionBankSize}
                    onChange={(event) => {
                      setQuestionBankSize(event.target.value)
                      setConfirmedLarge(false)
                    }}
                    disabled={isSubmitting}
                    aria-describedby="append-bank-size-description"
                  />
                  <FieldDescription id="append-bank-size-description">
                    Added to the existing pool. Every new lesson gets at least one question.
                  </FieldDescription>
                </Field>
              </div>

              <GenerationEstimate
                lessons={lessonCount}
                bankSize={questionBankSize}
                credits={credits.data}
                creditsLoading={credits.isLoading}
                reviewMode={reviewMode}
              />
            </section>

            <div className="border-t border-border pt-8">
              <ReviewModeChoice value={reviewMode} onChange={setReviewMode} disabled={isSubmitting} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border bg-background px-5 py-4 sm:px-6">
          {submissionError ? (
            <Alert variant="destructive" className="relative pr-12">
              <CircleAlert className="h-4 w-4" />
              <AlertTitle>Cannot add to this certification</AlertTitle>
              <AlertDescription>{submissionError}</AlertDescription>
              <button
                type="button"
                onClick={() => setSubmissionError("")}
                aria-label="Dismiss error"
                className="absolute top-3 right-3 rounded-md p-1 text-destructive transition hover:bg-destructive/10"
              >
                <X className="h-4 w-4" />
              </button>
            </Alert>
          ) : null}

          {isSubmitting ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>
                  {uploadPercent < 100
                    ? `Uploading ${files.length} document${files.length === 1 ? "" : "s"}…`
                    : files.length
                      ? `Reading ${files.length} document${files.length === 1 ? "" : "s"}…`
                      : "Starting the run…"}
                </span>
                {uploadPercent < 100 ? <span className="font-mono tabular-nums">{uploadPercent}%</span> : null}
              </div>
              {uploadPercent < 100 ? (
                <Progress value={uploadPercent} className="h-1.5" />
              ) : (
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full w-1/3 animate-[loading-sweep_1.4s_ease-in-out_infinite] rounded-full bg-primary" />
                </div>
              )}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-3">
            {isLargeRun && confirmedLarge && !isSubmitting ? (
              <p className="mr-auto text-sm text-destructive">This is a large run. Click again to start it anyway.</p>
            ) : !hasInput && !isSubmitting ? (
              <p className="mr-auto text-xs text-muted-foreground">Say what to add or upload a document to continue.</p>
            ) : null}
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !hasInput || notEnoughCredit}
              title={notEnoughCredit ? "Not enough OpenRouter credit for this run" : undefined}
              className="min-w-[170px] gap-2"
            >
              {isSubmitting ? (
                "Starting…"
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {isLargeRun && confirmedLarge ? "Add anyway" : "Generate and add"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
