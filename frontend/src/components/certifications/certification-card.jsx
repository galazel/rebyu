import { useState } from "react"
import {
  ActivityIcon,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MoreVertical,
  SendIcon,
  Trash2Icon,
  TrashIcon,
  UploadCloudIcon
} from "@/components/icons"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNavigate } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { generationErrorOf, generationStatusOf } from "@/hooks/use-active-generations"
import { retryWorkflowRun } from "@/services/aiWorkflowService"
import CertificationCover from "@/components/certifications/certification-cover.jsx"
import {
  certificationBadgeUrl,
  deleteCertification,
  publishCertification,
} from "@/services/certificationService.js"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { InlineGenerationMonitor } from "@/components/certifications/inline-generation-monitor.jsx"
import { Button } from "@/components/ui/button"

function getErrorMessage(error, fallback = "Something went wrong.") {
  const responseData = error?.response?.data

  return (
      (typeof responseData === "string" && responseData) ||
      responseData?.message ||
      responseData?.error ||
      error?.message ||
      fallback
  )
}

function stageLabel(stage) {
  if (!stage) return null
  const labels = {
    validate_documents: "Checking documents",
    ingest_documents: "Reading documents",
    plan_curriculum: "Planning the curriculum",
    lesson_content: "Writing a lesson",
    lesson_quiz_generate: "Building a lesson quiz",
    lesson_validate: "Checking a lesson",
    middle_generate: "Building a category quiz",
    major_generate: "Building a major exam",
    generate_mock_exam: "Building the mock exam",
    generate_diagnostic_exam: "Building the diagnostic exam",
    generate_question_bank: "Building the question bank",
    audit_questions: "Checking every question for duplicates",
  }
  return labels[stage] ?? null
}

function CertificationCard({ item, certification, generationRun = null }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showGeneration, setShowGeneration] = useState(false)
  const [finishedStatus, setFinishedStatus] = useState(null)

  const generationStatus = generationStatusOf(generationRun)
  const isFailed = generationStatus === "FAILED"
  const isStopped = generationStatus === "STOPPED"
  const isQueued = Boolean(generationRun?.queued)
  const isGenerating = generationStatus === "GENERATING" || generationStatus === "AWAITING_REVIEW"
  const awaitingReview = generationStatus === "AWAITING_REVIEW"
  const generationError = generationErrorOf(generationRun)

  const generationLabel = awaitingReview
      ? "Needs your review"
      : stageLabel(generationRun?.current_stage) ?? "Generating…"

  const resumeGeneration = useMutation({
    mutationFn: () => retryWorkflowRun(generationRun?.run_id),
    onSuccess: () => {
      toast.success("Generation resumed", {
        description: "It continues from where it stopped. Nothing is regenerated.",
      })
      queryClient.invalidateQueries({ queryKey: ["workflow-runs", "active"] })
      setShowGeneration(true)
    },
    onError: (error) =>
      toast.error("Could not resume generation", {
        description:
          error?.response?.data?.detail ??
          error?.message ??
          "Please try again.",
      }),
  })

  const currentCertification = certification ?? item

  const certificationId =
      currentCertification?.certificationId ??
      currentCertification?.id ??
      item?.certificationId ??
      item?.id

  const certificationTitle =
      currentCertification?.title ?? item?.title ?? "Untitled Certification"

  const badgeImageKey = currentCertification?.badgeImageKey ?? item?.badgeImageKey ?? null

  const certificationDescription =
      currentCertification?.description ??
      item?.description ??
      "No description available."

  const majorCategories =
      currentCertification?.majorCategory ?? item?.majorCategory ?? null
  const isEmpty =
      !isGenerating && Array.isArray(majorCategories) && majorCategories.length === 0

  const certificationIndustry =
      currentCertification?.industry ?? item?.industry ?? "Certification"

  const certificationStatus =
      currentCertification?.status ??
      currentCertification?.publicationStatus ??
      currentCertification?.certificationStatus ??
      item?.status ??
      item?.publicationStatus ??
      item?.certificationStatus

  const isPublished =
      currentCertification?.published === true ||
      currentCertification?.isPublished === true ||
      String(certificationStatus ?? "").toUpperCase() === "PUBLISHED" ||
      String(certificationStatus ?? "").toUpperCase() === "ACTIVE"

  const { mutate: removeCertification, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      if (!certificationId) {
        throw new Error("Certification ID is missing.")
      }

      const result = await deleteCertification(certificationId)

      if (result === false || result?.success === false) {
        throw new Error(
            result?.message || "The certification could not be deleted."
        )
      }

      return result
    },

    onSuccess: async () => {
      setShowDeleteDialog(false)

      await queryClient.invalidateQueries({
        queryKey: ["admin-certifications"],
      })

      toast.success("Certification deleted", {
        description: `"${certificationTitle}" has been removed.`,
      })
    },

    onError: (error) => {
      toast.error("Could not delete certification", {
        description: getErrorMessage(
            error,
            "Something went wrong while deleting the certification."
        ),
      })
    },
  })

  const { mutate: publishSelectedCertification, isPending: isPublishing } =
      useMutation({
        mutationFn: async () => {
          if (!certificationId) {
            throw new Error("Certification ID is missing.")
          }

          const result = await publishCertification(certificationId)

          if (result === false || result?.success === false) {
            throw new Error(
                result?.message || "The certification could not be published."
            )
          }

          return result
        },

        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: ["admin-certifications"],
          })

          await queryClient.invalidateQueries({
            queryKey: ["certification", certificationId],
          })

          toast.success("Certification published", {
            description: `"${certificationTitle}" is now published.`,
          })
        },

        onError: (error) => {
          toast.error("Could not publish certification", {
            description: getErrorMessage(
                error,
                "Something went wrong while publishing the certification."
            ),
          })
        },
      })

  function handleOpenGeneration(event) {
    event?.preventDefault()
    event?.stopPropagation()

    if (!generationRun?.run_id) {
      toast.error("Cannot open the generation", {
        description: "This run is no longer available.",
      })
      return
    }

    setShowGeneration(true)
  }

  function handleOpenCertification() {
    if (isGenerating) {
      toast.info("Still generating", {
        description: `"${certificationTitle}" is being built. Open the progress view to watch it.`,
      })

      return
    }

    if (isEmpty && !generationError) {
      toast.error("Nothing to open", {
        description:
            `"${certificationTitle}" has no content — generation did not finish. Delete it and generate again.`,
      })

      return
    }

    if (!certificationId) {
      toast.error("Cannot open certification", {
        description: "Certification ID is missing.",
      })

      return
    }

    navigate(`certification/${certificationId}`, {
      state: {
        certification: currentCertification,
      },
    })
  }

  function handleOpenDeleteDialog(event) {
    event.preventDefault()
    event.stopPropagation()
    setShowDeleteDialog(true)
  }

  function handlePublishCertification(event) {
    event.preventDefault()
    event.stopPropagation()

    if (isGenerating) {
      toast.info("Still generating", {
        description: "Wait for generation to finish before publishing.",
      })
      return
    }

    if (isEmpty) {
      toast.error("Nothing to publish", {
        description:
            generationError
              ? `Generation failed: ${generationError}`
              : `"${certificationTitle}" has no categories or lessons. Generation did not finish — delete it and try again.`,
        duration: isFailed ? 12_000 : undefined,
      })
      return
    }

    if (isPublished) {
      toast.info("Already published", {
        description: `"${certificationTitle}" is already published.`,
      })
      return
    }

    publishSelectedCertification()
  }

  function handleDeleteDialogChange(nextOpen) {
    if (isDeleting) return
    setShowDeleteDialog(nextOpen)
  }

  function handleConfirmDelete() {
    removeCertification()
  }

  return (
      <>
        <div
            role={isGenerating ? undefined : "button"}
            tabIndex={isGenerating ? undefined : 0}
            aria-busy={isGenerating || undefined}
            onClick={isGenerating ? undefined : handleOpenCertification}
            onKeyDown={(event) => {
              if (isGenerating) return
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                handleOpenCertification()
              }
            }}
            className={cn(
                "group flex h-[380px] w-full flex-col overflow-hidden rounded-[32px] border border-border bg-card shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                isGenerating
                    ? "cursor-default border-dashed"
                    : "cursor-pointer hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-md",
                isEmpty && !isGenerating && "cursor-default bg-muted/40 grayscale hover:translate-y-0 hover:border-border hover:shadow-sm",
            )}
        >
          <figure className="relative h-48 shrink-0 overflow-hidden border-b border-border">
            <CertificationCover
                title={certificationTitle}
                badgeSrc={
                    badgeImageKey
                        ? `${certificationBadgeUrl(certificationId)}?v=${encodeURIComponent(badgeImageKey)}`
                        : undefined
                }
                className="h-full w-full"
            />

            {isEmpty && !isGenerating ? (
                <span
                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                    aria-hidden="true"
                >
                  <span
                      className="rounded-md border-[3px] border-white/80 px-4 py-1.5 text-lg font-black uppercase tracking-[0.2em] text-white"
                      style={{ transform: "rotate(160deg)" }}
                  >
                    Empty
                  </span>
                </span>
            ) : null}

            {isGenerating ? (
                <span
                  className={cn(
                    "absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium shadow-sm",
                    awaitingReview
                      ? "bg-amber-100 text-amber-900 ring-1 ring-amber-400/60 dark:bg-amber-950 dark:text-amber-100"
                      : "bg-background/95 text-foreground",
                  )}
                >
                  {awaitingReview ? (
                    <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  )}
                  {generationLabel}
                </span>
            ) : null}
          </figure>

          <div className="flex min-h-0 flex-1 flex-col p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex max-w-full truncate rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                    {certificationIndustry}
                  </span>

                  {isGenerating ? null : isPublished ? (
                      <span className="inline-flex rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600">
                        Published
                      </span>
                  ) : String(certificationStatus ?? "").toUpperCase() === "COMING_SOON" ? (
                      <span
                          className="inline-flex rounded-full bg-sky-500/10 px-2.5 py-1 text-[11px] font-medium text-sky-700"
                          title="Listed on the institution request page as coming soon; hidden from learners until published."
                      >
                        Coming soon
                      </span>
                  ) : (
                      <span className="inline-flex rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-600">
                        Draft
                      </span>
                  )}
                </div>

                <h2 className="font-heading mt-2.5 line-clamp-2 text-base leading-6 font-semibold text-foreground">
                  {certificationTitle}
                </h2>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                      type="button"
                      onClick={(event) => event.stopPropagation()}
                      className="-mt-1 -mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label="Certification options"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    align="end"
                    onClick={(event) => event.stopPropagation()}
                >
                  <DropdownMenuGroup>
                    {isGenerating ? (
                        <DropdownMenuItem onSelect={handleOpenGeneration}>
                          <ActivityIcon className="mr-2 h-4 w-4" />
                          {generationStatus === "AWAITING_REVIEW"
                              ? "Review now"
                              : "View progress"}
                        </DropdownMenuItem>
                    ) : null}

                    <DropdownMenuItem
                        disabled={
                          isPublishing || isDeleting || isPublished || isGenerating || isEmpty
                        }
                        onSelect={handlePublishCertification}
                    >
                      <SendIcon className="mr-2 h-4 w-4" />
                      {isGenerating
                          ? "Generating…"
                          : isEmpty
                              ? "Nothing to publish"
                              : isPublishing
                                  ? "Publishing..."
                                  : isPublished
                                      ? "Published"
                                      : "Publish"}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        variant="destructive"
                        disabled={isDeleting || isPublishing}
                        onSelect={handleOpenDeleteDialog}
                    >
                      <TrashIcon className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {isFailed && generationError ? (
                <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 p-2.5 text-sm leading-6 text-destructive">
                  {generationError}
                </p>
            ) : (
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {isGenerating
                      ? generationStatus === "AWAITING_REVIEW"
                          ? "Paused for your review in the generation workspace."
                          : isQueued
                              ? "Queued. It starts in a moment and then builds categories, lessons, and assessments."
                              : "Building categories, lessons, and assessments. This can take several minutes."
                      : isStopped
                          ? "Generation was stopped. What it had planned is kept — resuming continues from where it left off rather than starting again."
                          : certificationDescription}
                </p>
            )}

            <div className="mt-auto pt-5">
              {isGenerating ? (
                  <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full"
                      disabled={isQueued}
                      onClick={handleOpenGeneration}
                  >
                    <ActivityIcon className="mr-2 h-4 w-4" />
                    {isQueued
                        ? "Starting…"
                        : generationStatus === "AWAITING_REVIEW"
                            ? "Review now"
                            : "View progress"}
                  </Button>
              ) : isStopped ? (
                  <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full"
                      disabled={resumeGeneration.isPending || !generationRun?.run_id}
                      onClick={(event) => {
                        event.stopPropagation()
                        resumeGeneration.mutate()
                      }}
                  >
                    <ActivityIcon className="mr-2 h-4 w-4" />
                    {resumeGeneration.isPending ? "Resuming…" : "Resume generation"}
                  </Button>
              ) : (
                  <div className="h-1 w-10 shrink-0 rounded-full bg-primary" />
              )}
            </div>
          </div>
        </div>

        <AlertDialog open={finishedStatus != null} onOpenChange={(open) => !open && setFinishedStatus(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia
                  className={finishedStatus === "COMPLETED"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"}
              >
                {finishedStatus === "COMPLETED"
                    ? <CheckCircle2 aria-hidden="true" />
                    : <AlertTriangle aria-hidden="true" />}
              </AlertDialogMedia>

              <AlertDialogTitle>
                {finishedStatus === "COMPLETED"
                    ? "Generation finished"
                    : finishedStatus === "CANCELLED"
                        ? "Generation stopped"
                        : "Generation did not finish"}
              </AlertDialogTitle>

              <AlertDialogDescription>
                {finishedStatus === "COMPLETED"
                    ? `"${certificationTitle}" is built. Its categories, lessons, quizzes and question bank are saved as drafts, ready for you to review and publish.`
                    : finishedStatus === "CANCELLED"
                        ? "Everything it had built is kept. You can resume it from where it stopped."
                        : "What it managed to build is kept as drafts. You can retry it from the step that failed."}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setFinishedStatus(null)}>
                Close
              </Button>
              <Button
                  onClick={() => {
                    setFinishedStatus(null)
                    navigate(`/admin/certification/${certificationId}`)
                  }}
              >
                Open certification
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={showGeneration} onOpenChange={setShowGeneration}>
          <DialogContent
              className="flex h-[82vh] w-[96vw] max-w-none flex-col gap-0 overflow-hidden p-0 sm:w-[92vw] sm:max-w-none lg:w-[80vw] xl:w-[70vw]"
              onClick={(event) => event.stopPropagation()}
          >
            <DialogHeader className="px-4 pt-4 pb-3 sm:px-6">
              <DialogTitle>Generating {certificationTitle}</DialogTitle>
              <DialogDescription className="sr-only">
                Live progress for this certification's generation.
              </DialogDescription>
            </DialogHeader>

            {showGeneration ? (
                <InlineGenerationMonitor
                    certificationId={certificationId}
                    onClose={() => setShowGeneration(false)}
                    onFinished={(status) => {
                      setShowGeneration(false)
                      setFinishedStatus(status)
                      queryClient.invalidateQueries({ queryKey: ["admin-certifications"] })
                      queryClient.invalidateQueries({ queryKey: ["workflow-runs", "active"] })
                    }}
                />
            ) : null}
          </DialogContent>
        </Dialog>

        <AlertDialog open={showDeleteDialog} onOpenChange={handleDeleteDialogChange}>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20">
                <Trash2Icon />
              </AlertDialogMedia>

              <AlertDialogTitle>Delete certification?</AlertDialogTitle>

              <AlertDialogDescription>
                Are you sure you want to delete "{certificationTitle}"? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel variant="outline" disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>

              <Button
                  type="button"
                  variant="destructive"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
  )
}

export default CertificationCard
