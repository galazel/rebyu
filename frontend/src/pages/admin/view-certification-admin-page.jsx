import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import {
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Loader2,
  PencilIcon,
  Sparkles,
  Layers3,
  ListChecks,
  Trash2
} from "@/components/icons"

import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  addLesson,
  addMajorCategory,
  addMiddleCategory,
  deleteLesson,
  deleteMajorCategory,
  deleteMiddleCategory,
  getCertificationById,
  updateCertification,
} from "@/services/certificationService.js"
import { apiMessage } from "@/services/base"
import { InlineAdd } from "@/components/certifications/inline-editable.jsx"
import {
  toCertificationUpdatePayload,
  validateStructureName,
} from "@/utils/certification-edit.js"
import { Button } from "@/components/ui/button"
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
import { prefetchAssessmentData } from "@/components/assessments/admin/assessments-tab.jsx"
import CertificationPublishingChecklist from "@/components/assessments/admin/certification-publishing-checklist.jsx"
import CertificationExamsSection from "@/components/assessments/admin/certification-exams-section.jsx"
import GenerateMoreDialog from "@/components/certifications/generate-more-dialog.jsx"
import CertificationEditDialog from "@/components/certifications/certification-edit-dialog.jsx"
import { InlineGenerationMonitor } from "@/components/certifications/inline-generation-monitor.jsx"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  generationErrorOf,
  useActiveGenerations,
} from "@/hooks/use-active-generations"

function getCertification(location) {
  return (
      location.state?.certification?.certification ??
      location.state?.certification ??
      null
  )
}

const DELETERS = {
  major: deleteMajorCategory,
  middle: deleteMiddleCategory,
  lesson: deleteLesson,
}

function getLessonTitle(lesson) {
  return lesson?.name ?? lesson?.title ?? "Untitled lesson"
}

export default function ViewCertificationAdmin() {
  const location = useLocation()
  const navigate = useNavigate()
  const { id: routeCertificationId } = useParams()
  const pageRef = useRef(null)
  const queryClient = useQueryClient()
  const [certificationOverride, setCertification] = useState(() =>
      getCertification(location)
  )

  // This certification only. The full list carries every lesson of every
  // certification (~7 MB) and was the slowest, most failure-prone request here.
  const { data: fetchedCertification = undefined, isLoading: isLoadingCertifications } = useQuery({
    queryKey: ["admin-certifications", "certification-page", String(routeCertificationId)],
    queryFn: () => getCertificationById(routeCertificationId),
    enabled: routeCertificationId != null,
    staleTime: 5 * 60 * 1000,
  })

  const { byCertificationId: generationRuns } = useActiveGenerations()




  const overrideId =
      certificationOverride?.certificationId ?? certificationOverride?.id

  const certification = useMemo(() => {
    if (
        certificationOverride &&
        (overrideId == null ||
            String(overrideId) === String(routeCertificationId))
    ) {
      return { ...fetchedCertification, ...certificationOverride }
    }

    return fetchedCertification ?? null
  }, [certificationOverride, overrideId, fetchedCertification, routeCertificationId])

  const [isGenerateMoreOpen, setIsGenerateMoreOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isWatchingGeneration, setIsWatchingGeneration] = useState(false)

  const [pendingDelete, setPendingDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)



  useEffect(() => {
    prefetchAssessmentData(queryClient, routeCertificationId)
  }, [queryClient, routeCertificationId])

  useEffect(() => {
    pageRef.current?.scrollIntoView({
      behavior: "auto",
      block: "start",
    })

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    })
  }, [location.key])

  useEffect(() => {
    const fromRouterState = getCertification(location)

    if (fromRouterState) {
      setCertification(fromRouterState)
      return
    }

    setCertification((current) =>
        current &&
        String(current.certificationId ?? current.id) ===
        String(routeCertificationId)
            ? current
            : null
    )
  }, [location.key, routeCertificationId])

  async function saveCertificationEdit(produce, successMessage) {
    const next = produce(certification)
    const payload = toCertificationUpdatePayload(next)

    const saved = await updateCertification(payload.certificationId, payload)

    setCertification((current) => ({
      ...current,
      ...next,
      ...(saved && typeof saved === "object" ? saved : {}),
    }))

    // The response is the saved certification, so this page is current already;
    // the certifications list refreshes in the background rather than holding the
    // save open while it re-downloads.
    if (saved && typeof saved === "object") {
      queryClient.setQueryData(
          ["admin-certifications", "certification-page", String(routeCertificationId)],
          saved,
      )
    }
    void queryClient.invalidateQueries({
      queryKey: ["admin-certifications"],
      refetchType: "none",
    })

    toast.success(successMessage)
  }

  async function saveAllEdits(next) {
    try {
      await saveCertificationEdit(() => next, "Certification updated")
    } catch (error) {
      toast.error("Could not save the changes", {
        description: apiMessage(error, "Please try again."),
      })
      throw error
    }
  }

  async function refreshCertification() {
    await queryClient.invalidateQueries({ queryKey: ["admin-certifications"] })
    setCertification(null)
  }

  async function addMajor(title) {
    await addMajorCategory({
      certificationId: certification.certificationId ?? certification.id,
      title,
    })
    await refreshCertification()
    toast.success("Major category added")
  }

  async function addMiddle(majorCategoryId, title) {
    await addMiddleCategory({ majorCategoryId, title })
    await refreshCertification()
    toast.success("Module added")
  }

  async function addLessonTo(middleCategoryId, name) {
    await addLesson({ middleCategoryId, name })
    await refreshCertification()
    toast.success("Lesson added")
  }

  function requestDelete(pending) {
    setPendingDelete(pending)
  }

  async function confirmDelete() {
    if (!pendingDelete || isDeleting) return

    try {
      setIsDeleting(true)
      await DELETERS[pendingDelete.kind](pendingDelete.id)
      await refreshCertification()
      setPendingDelete(null)
      toast.success(`${pendingDelete.name} deleted`)
    } catch (error) {
      toast.error("Could not delete", {
        description: apiMessage(error, "Something went wrong."),
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const curriculumActions = {
    addMiddle,
    addLesson: addLessonTo,
    requestDelete,
  }

  function handleCreateAssessment(request) {
    navigate(`/admin/certification/${certification.certificationId}/assessments`, {
      state: {
        createAssessment: {
          ...request,
          requestId: `${Date.now()}-${Math.random()}`,
        },
      },
    })
  }



  if (!certification && isLoadingCertifications) {
    return (
        <section
            className="min-h-full overflow-y-auto bg-muted/30 font-sans"
            aria-busy="true"
            aria-live="polite"
        >
          <span className="sr-only">Loading certification</span>

          <header className="relative isolate overflow-hidden border-b border-border bg-rb-feather px-6 py-8 sm:px-10 lg:px-20 lg:py-10">
            <div className="relative z-10 mx-auto max-w-6xl">
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-6 w-48 rounded-full bg-white/25" />
                <Skeleton className="h-4 w-40 rounded bg-white/15" />
              </div>
              <Skeleton className="h-9 w-[min(28rem,80%)] rounded-xl bg-white/30" />
              <div className="mt-3 space-y-1.5">
                <Skeleton className="h-4 w-[min(46rem,95%)] rounded bg-white/20" />
                <Skeleton className="h-4 w-[min(34rem,75%)] rounded bg-white/20" />
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-6xl px-6 py-8 sm:px-10 lg:px-20">
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <Skeleton className="h-5 w-[min(24rem,70%)] rounded" />
                    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                      <Skeleton className="h-5 w-64 rounded" />
                      <Skeleton className="mt-2 h-4 w-40 rounded" />
                    </div>
                  </div>
              ))}
            </div>
          </main>
        </section>
    )
  }

  if (!certification) {
    return (
        <section className="flex min-h-full items-center justify-center bg-muted/40 p-6">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Layers3 className="h-6 w-6" />
            </div>

            <h1 className="mt-5 font-heading text-2xl font-bold text-foreground">
              Certification not found
            </h1>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Go back to the certifications page and select a certification again.
            </p>
          </div>
        </section>
    )
  }

  const majorCategories = certification.majorCategory ?? []

  const certificationKey = String(
      certification.certificationId ?? certification.id ?? ""
  )
  const generationRun = generationRuns.get(certificationKey)
  const generationError = generationErrorOf(generationRun)


  const isGenerating =
      Boolean(generationRun) &&
      !["COMPLETED", "FAILED", "CANCELLED"].includes(generationRun.status)

  const totalMiddleCategories = majorCategories.reduce(
      (total, majorCategory) =>
          total + (majorCategory.middleCategory?.length ?? 0),
      0
  )

  const totalLessons = majorCategories.reduce(
      (total, majorCategory) =>
          total +
          (majorCategory.middleCategory ?? []).reduce(
              (middleTotal, middleCategory) =>
                  middleTotal + (middleCategory.lessons?.length ?? 0),
              0
          ),
      0
  )

  return (
      <section
          ref={pageRef}
          className="min-h-full overflow-y-auto bg-muted/30 font-sans"
      >
        <header className="relative isolate overflow-hidden border-b border-border bg-rb-feather px-6 py-8 sm:px-10 lg:px-20 lg:py-10">
          <div className="relative z-10 mx-auto max-w-6xl">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full border border-black/10 bg-white/85 px-3 py-1 text-xs font-semibold text-black shadow-sm">
                    {certification.industry || "General"}
                  </span>

                  <div className="flex items-center gap-2 text-xs text-white/70">
                    <span>{majorCategories.length} categories</span>
                    <span className="text-white/40">·</span>
                    <span>{totalMiddleCategories} modules</span>
                    <span className="text-white/40">·</span>
                    <span>{totalLessons} lessons</span>
                  </div>
                </div>

                <h1 className="max-w-3xl font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                  {certification.title}
                </h1>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/80">
                  {certification.description || "No description available."}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
                {isGenerating ? (
                    <Button
                        type="button"
                        size="sm"
                        className="gap-2 rounded-lg font-medium shadow-sm"
                        onClick={() => setIsWatchingGeneration(true)}
                    >
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      View progress
                    </Button>
                ) : (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2 rounded-lg border-white/25 bg-white/10 font-medium text-white shadow-sm backdrop-blur-sm hover:bg-white/20 hover:text-white"
                        onClick={() => setIsGenerateMoreOpen(true)}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Add with AI
                    </Button>
                )}

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-lg border-white/25 bg-white/10 font-medium text-white shadow-sm backdrop-blur-sm hover:bg-white/20 hover:text-white"
                    onClick={() => setIsEditOpen(true)}
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                  Edit
                </Button>

                <Button
                    type="button"
                    size="sm"
                    className="gap-2 rounded-lg font-medium shadow-sm"
                    onClick={() =>
                        navigate(
                            `/admin/certification/${certification.certificationId}/question-bank`
                        )
                    }
                >
                  <ListChecks className="h-3.5 w-3.5" />
                  Question Bank
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="px-6 py-8 sm:px-10 lg:px-20">
          <div className="mx-auto max-w-6xl">
            <section className="mb-10">

              {majorCategories.length === 0 && generationError ? (
                  <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 shadow-sm sm:p-10">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                      <Layers3 className="h-7 w-7" />
                    </div>

                    <h4 className="mt-5 font-heading text-lg font-bold text-foreground">
                      Generation was rejected
                    </h4>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                      Nothing was built, so this certification is empty. The
                      generator gave this reason:
                    </p>

                    <p className="mt-4 rounded-xl border border-destructive/25 bg-background p-4 text-sm leading-6 text-foreground">
                      {generationError}
                    </p>

                    <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
                      Upload documents that match the name and description above,
                      then generate again — or delete this certification and start
                      over. You can also build the curriculum by hand.
                    </p>
                  </div>
              ) : majorCategories.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Layers3 className="h-7 w-7" />
                    </div>

                    <h4 className="mt-5 font-heading text-lg font-bold text-foreground">
                      No major categories yet
                    </h4>

                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                      Add a major category to start building this certification
                      curriculum.
                    </p>

                    <div className="mt-6 flex justify-center">
                      <InlineAdd
                          label="Major category"
                          validate={(value) =>
                              validateStructureName(value, "Major category title")
                          }
                          onAdd={addMajor}
                          className="w-full max-w-sm"
                      />
                    </div>
                  </div>
              ) : (
                  <div className="space-y-10">
                    {majorCategories.map((majorCategory, majorIndex) => (
                        <MajorCategorySection
                            key={majorCategory.majorCategoryId ?? majorIndex}
                            certification={certification}
                            majorCategory={majorCategory}
                            majorIndex={majorIndex}
                            actions={curriculumActions}
                        />
                    ))}

                    <InlineAdd
                        label="Major category"
                        validate={(value) =>
                            validateStructureName(value, "Major category title")
                        }
                        onAdd={addMajor}
                        className="w-full"
                    />
                  </div>
              )}
            </section>


            <div className="space-y-8">
              {majorCategories.length > 0 ? (
                  <CertificationExamsSection certification={certification} />
              ) : null}

              <CertificationPublishingChecklist
                  certificationId={certification?.certificationId}
                  isPublished={certification?.status === "PUBLISHED"}
                  onCreateAssessment={handleCreateAssessment}

                  onPublished={() =>
                      setCertification((current) => ({
                        ...(current ?? certification),
                        status: "PUBLISHED",
                      }))
                  }
              />
            </div>
          </div>
        </main>

        <CertificationEditDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            certification={certification}
            onSave={saveAllEdits}
            onBadgeChange={(badgeImageKey) => {
              setCertification((current) => ({ ...(current ?? certification), badgeImageKey }))
              void queryClient.invalidateQueries({
                queryKey: ["admin-certifications"],
                refetchType: "none",
              })
            }}
        />

        <GenerateMoreDialog
            open={isGenerateMoreOpen}
            onOpenChange={setIsGenerateMoreOpen}
            certification={certification}
        />

        <Dialog open={isWatchingGeneration} onOpenChange={setIsWatchingGeneration}>
          <DialogContent className="flex max-h-[calc(100dvh-4rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
            <DialogHeader className="px-4 pt-4 pb-3 sm:px-6">
              <DialogTitle>Generating {certification.title}</DialogTitle>
              <DialogDescription className="sr-only">
                Live progress for this certification's generation.
              </DialogDescription>
            </DialogHeader>

            {isWatchingGeneration ? (
                <InlineGenerationMonitor
                    certificationId={certification.certificationId ?? certification.id}
                    onClose={() => setIsWatchingGeneration(false)}
                    onFinished={() => {
                      setIsWatchingGeneration(false)
                      queryClient.invalidateQueries({ queryKey: ["admin-certifications"] })
                      queryClient.invalidateQueries({ queryKey: ["workflow-runs", "active"] })
                    }}
                />
            ) : null}
          </DialogContent>
        </Dialog>

        <AlertDialog
            open={Boolean(pendingDelete)}
            onOpenChange={(open) => {
              if (!open && !isDeleting) setPendingDelete(null)
            }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete “{pendingDelete?.name}”?
              </AlertDialogTitle>

              <AlertDialogDescription>
                {pendingDelete?.detail
                    ? `This also deletes the ${pendingDelete.detail} under it, along with their quizzes and questions. `
                    : "This also deletes its quiz and questions. "}
                It cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Keep it</AlertDialogCancel>

              <AlertDialogAction
                  disabled={isDeleting}
                  onClick={(event) => {
                    event.preventDefault()
                    void confirmDelete()
                  }}
                  className="bg-destructive text-white hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
  )
}

function MajorCategorySection({
                                certification,
                                majorCategory,
                                majorIndex,
                                actions,
                              }) {
  const middleCategories = majorCategory.middleCategory ?? []
  const lessonCount = middleCategories.reduce(
      (total, middle) => total + (middle.lessons?.length ?? 0),
      0
  )

  return (
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-heading text-lg font-bold text-foreground">
            <span className="text-primary">Major Category {majorIndex + 1}:</span>{" "}
            {majorCategory.title}
          </p>

          {majorCategory.priority && (
              <Badge
                  variant="secondary"
                  className="bg-primary/10 text-[10px] font-bold tracking-wider text-primary uppercase hover:bg-primary/10"
              >
                {majorCategory.priority}
              </Badge>
          )}

          <DeleteNodeButton
              disabled={majorCategory.majorCategoryId == null}
              label={`Delete major category ${majorCategory.title}`}
              onClick={() =>
                  actions.requestDelete({
                    kind: "major",
                    id: majorCategory.majorCategoryId,
                    name: majorCategory.title,
                    detail: describeSubtree(middleCategories.length, lessonCount),
                  })
              }
          />
        </div>

        {middleCategories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
              No middle categories under this major category.
            </div>
        ) : (
            <div className="space-y-3">
              {middleCategories.map((middleCategory, middleIndex) => (
                  <MiddleCategoryCard
                      key={middleCategory.middleCategoryId ?? middleIndex}
                      certification={certification}
                      majorCategory={majorCategory}
                      middleCategory={middleCategory}
                      majorIndex={majorIndex}
                      middleIndex={middleIndex}
                      actions={actions}
                  />
              ))}
            </div>
        )}

        <InlineAdd
            label="Module"
            validate={(value) => validateStructureName(value, "Module title")}
            onAdd={(title) => actions.addMiddle(majorCategory.majorCategoryId, title)}
        />
      </section>
  )
}

function DeleteNodeButton({ onClick, label, disabled = false, className = "" }) {
  return (
      <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          title={label}
          className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-50 transition hover:bg-destructive/10 hover:text-destructive hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-25 ${className}`}
      >
        <Trash2 className="size-3.5" />
      </button>
  )
}

function describeSubtree(middleCount, lessonCount) {
  const parts = []
  if (middleCount > 0) {
    parts.push(`${middleCount} ${middleCount === 1 ? "module" : "modules"}`)
  }
  if (lessonCount > 0) {
    parts.push(`${lessonCount} ${lessonCount === 1 ? "lesson" : "lessons"}`)
  }
  return parts.join(" and ")
}

function MiddleCategoryCard({
                              certification,
                              majorCategory,
                              middleCategory,
                              majorIndex,
                              middleIndex,
                              actions,
                            }) {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const lessons = middleCategory.lessons ?? []

  function handleCreateLesson(event, lesson) {
    event.stopPropagation()
    const lessonName = getLessonTitle(lesson)

    navigate(`/admin/lessons/${encodeURIComponent(lessonName)}/create`, {
      state: {
        lessonId: lesson.lessonId,
        lessonName,
        certification,
        majorCategory,
        middleCategory,
      },
    })
  }

  return (
      <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-4 px-5 py-5">
          <div className="min-w-0">
            <h3 className="font-heading text-base font-bold text-foreground">
              {middleCategory.title}
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Middle Category · {lessons.length}{" "}
              {lessons.length === 1 ? "lesson" : "lessons"}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <DeleteNodeButton
                disabled={middleCategory.middleCategoryId == null}
                label={`Delete module ${middleCategory.title}`}
                onClick={() =>
                    actions.requestDelete({
                      kind: "middle",
                      id: middleCategory.middleCategoryId,
                      name: middleCategory.title,
                      detail: describeSubtree(0, lessons.length),
                    })
                }
            />

            <button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                aria-expanded={isOpen}
                aria-label={`${isOpen ? "Hide" : "Show"} lessons in ${middleCategory.title}`}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                    isOpen
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
            >
              {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
              ) : (
                  <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {isOpen && (
            <div className="border-t border-border bg-muted/20 px-5 py-4">
              {lessons.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-background px-4 py-5 text-sm text-muted-foreground">
                    No lessons have been added yet.
                  </div>
              ) : (
                  <div className="space-y-2">
                    {lessons.map((lesson, lessonIndex) => (
                        <div
                            key={lesson.lessonId ?? lessonIndex}
                            className="group flex items-center justify-between gap-4 rounded-xl border border-transparent bg-background px-4 py-3 transition hover:border-border hover:bg-muted/40"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-bold text-muted-foreground">
                      {lessonIndex + 1}
                    </span>

                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground">
                                {getLessonTitle(lesson)}
                              </p>

                              <p className="mt-0.5 text-xs text-muted-foreground">
                                Lesson {lessonIndex + 1}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
                            <DeleteNodeButton
                                disabled={lesson.lessonId == null}
                                label={`Delete lesson ${getLessonTitle(lesson)}`}
                                onClick={() =>
                                    actions.requestDelete({
                                      kind: "lesson",
                                      id: lesson.lessonId,
                                      name: getLessonTitle(lesson),
                                      detail: "",
                                    })
                                }
                            />

                            <button
                                type="button"
                                onClick={(event) => handleCreateLesson(event, lesson)}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary transition hover:bg-primary hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                title="Create lesson content"
                                aria-label={`Create lesson content for ${getLessonTitle(lesson)}`}
                            >
                              <ArrowUpRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                    ))}
                  </div>
              )}

              <InlineAdd
                  label="Lesson"
                  className="mt-3"
                  validate={(value) => validateStructureName(value, "Lesson name")}
                  onAdd={(name) =>
                      actions.addLesson(middleCategory.middleCategoryId, name)
                  }
              />
            </div>
        )}
      </article>
  )
}
