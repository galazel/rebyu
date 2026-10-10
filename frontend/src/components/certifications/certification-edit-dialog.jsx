import { useEffect, useState } from "react"
import { ChevronDown, ChevronRight, X } from "@/components/icons"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import CertificationDetails from "@/components/certifications/certification-details"
import { BadgeUploadStep } from "@/components/certifications/badge-upload-step.jsx"
import {
  certificationBadgeUrl,
  removeCertificationBadge,
  setCertificationBadge,
} from "@/services/certificationService.js"
import {
  validateCertificationDetails,
  validateStructureName,
} from "@/utils/certification-edit.js"

function lessonName(lesson) {
  return lesson?.name ?? lesson?.title ?? ""
}

function curriculumDraftOf(certification) {
  return (certification?.majorCategory ?? []).map((major) => ({
    title: major.title ?? "",
    middles: (major.middleCategory ?? []).map((middle) => ({
      title: middle.title ?? "",
      lessons: (middle.lessons ?? []).map(lessonName),
    })),
  }))
}

function detailsOf(certification) {
  return {
    title: certification?.title ?? "",
    industry: certification?.industry ?? "",
    description: certification?.description ?? "",
  }
}

/** Validation errors in the curriculum names, keyed `m{major}`, `m{major}.{module}`, `m{major}.{module}.{lesson}`. */
function validateCurriculum(majors) {
  const errors = {}
  const put = (key, message) => {
    if (message) errors[key] = message
  }
  majors.forEach((major, m) => {
    put(`m${m}`, validateStructureName(major.title, "Major category title"))
    major.middles.forEach((middle, i) => {
      put(`m${m}.${i}`, validateStructureName(middle.title, "Module title"))
      middle.lessons.forEach((name, l) =>
        put(`m${m}.${i}.${l}`, validateStructureName(name, "Lesson name")),
      )
    })
  })
  return errors
}

/** The edits written back onto the certification, keeping every id and field. */
function applyDraft(certification, details, majors) {
  return {
    ...certification,
    title: details.title.trim(),
    industry: details.industry,
    description: details.description.trim(),
    majorCategory: (certification.majorCategory ?? []).map((major, m) => ({
      ...major,
      title: majors[m].title.trim(),
      middleCategory: (major.middleCategory ?? []).map((middle, i) => ({
        ...middle,
        title: majors[m].middles[i].title.trim(),
        lessons: (middle.lessons ?? []).map((lesson, l) => ({
          ...lesson,
          name: majors[m].middles[i].lessons[l].trim(),
        })),
      })),
    })),
  }
}

function FieldError({ message }) {
  return message ? <p className="text-xs font-medium text-destructive">{message}</p> : null
}

/**
 * Edits a certification in the same drawer as Create Certification -- its details
 * and badge -- plus the name of every category, module and lesson. One save.
 */
export default function CertificationEditDialog({
  open,
  onOpenChange,
  certification,
  onSave,
  onBadgeChange,
}) {
  const certificationId = certification?.certificationId ?? certification?.id
  const [details, setDetails] = useState(() => detailsOf(certification))
  const [detailsErrors, setDetailsErrors] = useState({})
  const [majors, setMajors] = useState(() => curriculumDraftOf(certification))
  const [curriculumErrors, setCurriculumErrors] = useState({})
  const [expanded, setExpanded] = useState(() => new Set())
  const [badge, setBadge] = useState(null)
  const [removeBadge, setRemoveBadge] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setDetails(detailsOf(certification))
    setDetailsErrors({})
    setMajors(curriculumDraftOf(certification))
    setCurriculumErrors({})
    setExpanded(new Set())
    setBadge(null)
    setRemoveBadge(false)
  }, [open])

  const existingBadgeSrc =
    certification?.badgeImageKey && !removeBadge
      ? `${certificationBadgeUrl(certificationId)}?v=${encodeURIComponent(certification.badgeImageKey)}`
      : null

  function updateMajors(produce) {
    setMajors((current) => produce(current.map((major) => ({
      ...major,
      middles: major.middles.map((middle) => ({ ...middle, lessons: [...middle.lessons] })),
    }))))
  }

  function toggle(key) {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function handleSave() {
    const foundDetails = validateCertificationDetails(details)
    const foundCurriculum = validateCurriculum(majors)
    setDetailsErrors(foundDetails)
    setCurriculumErrors(foundCurriculum)
    if (Object.keys(foundDetails).length || Object.keys(foundCurriculum).length) {
      setExpanded((current) => {
        const next = new Set(current)
        Object.keys(foundCurriculum).forEach((key) => {
          const parts = key.match(/^m(\d+)\.(\d+)\.\d+$/)
          if (parts) next.add(`${parts[1]}.${parts[2]}`)
        })
        return next
      })
      return
    }

    setIsSaving(true)
    try {
      await onSave(applyDraft(certification, details, majors))
      if (badge) {
        const saved = await setCertificationBadge(certificationId, badge)
        onBadgeChange?.(saved?.badgeImageKey ?? null)
      } else if (removeBadge && certification?.badgeImageKey) {
        await removeCertificationBadge(certificationId)
        onBadgeChange?.(null)
      }
      onOpenChange(false)
    } catch (error) {
      if (badge || removeBadge) {
        toast.error("The badge could not be saved", {
          description: error?.response?.data?.message ?? error?.message ?? "Please try again.",
        })
      }
    } finally {
      setIsSaving(false)
    }
  }

  const errorCount = Object.keys(detailsErrors).length + Object.keys(curriculumErrors).length

  return (
    <Drawer open={open} onOpenChange={(next) => !isSaving && onOpenChange(next)} direction="right">
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
          <DrawerTitle className="text-lg">Edit Certification</DrawerTitle>
          <DrawerDescription className="text-sm text-muted-foreground">
            Its details, badge, and the name of every category, module and lesson. Everything is
            saved together.
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
              value={details}
              onChange={(next) => {
                setDetails(next)
                setDetailsErrors({})
              }}
              errors={detailsErrors}
              disabled={isSaving}
            />

            <div className="border-t border-border pt-8">
              <BadgeUploadStep
                value={badge}
                onChange={(file) => {
                  setBadge(file)
                  if (file) setRemoveBadge(false)
                }}
                disabled={isSaving}
                existingSrc={existingBadgeSrc}
                onRemoveExisting={() => setRemoveBadge(true)}
              />
            </div>

            {majors.length ? (
              <div className="space-y-3 border-t border-border pt-8">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Categories</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Rename a major category, a module, or open a module to rename its lessons.
                  </p>
                </div>

                {majors.map((major, m) => (
                  <div key={m} className="space-y-2 rounded-xl border p-3">
                    <div className="space-y-1">
                      <label htmlFor={`edit-m${m}`} className="text-xs font-semibold text-primary">
                        Major category {m + 1}
                      </label>
                      <Input
                        id={`edit-m${m}`}
                        value={major.title}
                        disabled={isSaving}
                        aria-invalid={Boolean(curriculumErrors[`m${m}`])}
                        onChange={(e) => updateMajors((all) => {
                          all[m].title = e.target.value
                          return all
                        })}
                        className="font-semibold"
                      />
                      <FieldError message={curriculumErrors[`m${m}`]} />
                    </div>

                    {major.middles.map((middle, i) => {
                      const key = `${m}.${i}`
                      const isOpen = expanded.has(key)
                      return (
                        <div key={key} className="ml-4 space-y-1 border-l pl-3">
                          <div className="flex items-center gap-2">
                            <Input
                              aria-label={`Module ${i + 1} of major category ${m + 1}`}
                              value={middle.title}
                              disabled={isSaving}
                              aria-invalid={Boolean(curriculumErrors[`m${key}`])}
                              onChange={(e) => updateMajors((all) => {
                                all[m].middles[i].title = e.target.value
                                return all
                              })}
                              className="h-8"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="shrink-0 text-xs"
                              aria-expanded={isOpen}
                              onClick={() => toggle(key)}
                            >
                              {isOpen ? <ChevronDown aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
                              {middle.lessons.length} lesson{middle.lessons.length === 1 ? "" : "s"}
                            </Button>
                          </div>
                          <FieldError message={curriculumErrors[`m${key}`]} />

                          {isOpen ? (
                            <div className="ml-4 space-y-1.5 pt-1">
                              {middle.lessons.map((name, l) => (
                                <div key={l}>
                                  <Input
                                    aria-label={`Lesson ${l + 1} of ${middle.title}`}
                                    value={name}
                                    disabled={isSaving}
                                    aria-invalid={Boolean(curriculumErrors[`m${key}.${l}`])}
                                    onChange={(e) => updateMajors((all) => {
                                      all[m].middles[i].lessons[l] = e.target.value
                                      return all
                                    })}
                                    className="h-8 text-sm"
                                  />
                                  <FieldError message={curriculumErrors[`m${key}.${l}`]} />
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border bg-background px-5 py-4 sm:px-6">
          {errorCount ? (
            <p className="mr-auto text-sm text-destructive">
              Fix {errorCount} field{errorCount === 1 ? "" : "s"} before saving.
            </p>
          ) : null}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving} className="min-w-[150px]">
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
