import React, { useEffect, useMemo, useState } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowRight, Award, BookOpen, CheckCircle, GraduationCap, Layers3 } from "@/components/icons"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LearnerEmptyState, LearnerPageHeader } from "@/components/learner/learner-ui.jsx"
import { BubbleCard } from "@/components/commons/bubble-card.jsx"
import { getCertificationModules, getMyAwards } from "@/services/learnerService.js"
import EarnedStrip from "@/components/learner/earned-strip.jsx"

const INITIAL_VISIBLE_COUNT = 8
const LOAD_MORE_COUNT = 8

function getCertificationId(certification) {
  return certification?.certificationId ?? certification?.id
}

function getCertificationTitle(certification) {
  return certification?.title ?? "Untitled Certification"
}

function getCertificationCategory(certification) {
  return certification?.department ?? certification?.category ?? "Technology"
}

function getCertificationSize(certification) {
  const majors = getCertificationModules(certification) ?? []
  const modules = majors.reduce(
      (total, major) => total + (major.middleCategory?.length ?? 0),
      0
  )
  const lessons = majors.reduce(
      (total, major) =>
          total +
          (major.middleCategory ?? []).reduce(
              (count, middle) => count + (middle.lessons?.length ?? 0),
              0
          ),
      0
  )
  return { majors: majors.length, modules, lessons }
}

function getCertificationDescription(certification) {
  return (
      certification?.description ??
      "Prepare confidently with structured lessons, quizzes, mock exams, and progress tracking."
  )
}

// The original bubble card (a coloured cap with the certification's name as a
// wordmark), kept in one green and with game-kit buttons.
function CertificationCard({
                             certification,
                             enrolled,
                             award,
                             onOpen,
                             onAction,
                           }) {
  const category = getCertificationCategory(certification)
  const size = getCertificationSize(certification)
  const badgeEarned = Boolean(award?.badgeAwardedAt)
  const ActionIcon = badgeEarned ? CheckCircle : enrolled ? BookOpen : ArrowRight

  return (
      <BubbleCard
          tone="feather"
          cap="flat"
          body="card"
          icon={GraduationCap}
          wordmark={getCertificationTitle(certification)}
          eyebrow={category}
          className="tg-cat-explain h-full"
          title={
            <button
                type="button"
                onClick={onOpen}
                className="rounded-sm text-left hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tg)]"
            >
              {getCertificationTitle(certification)}
            </button>
          }
          chips={[
            { label: enrolled ? "Enrolled" : "Free to study" },
            ...(badgeEarned ? [{ label: "Badge earned", side: "right" }] : []),
          ]}
          footer={
            <div className="w-full">
              {size.lessons > 0 ? (
                  <div className="mb-3 grid grid-cols-2 gap-2">
                    {[
                      [Layers3, size.modules, size.modules === 1 ? "module" : "modules"],
                      [BookOpen, size.lessons, size.lessons === 1 ? "lesson" : "lessons"],
                    ].map(([Icon, count, label]) => (
                        <div key={label} className="flex items-center gap-2 rounded-xl bg-[var(--tg-softer)] px-3 py-2 ring-1 ring-[var(--tg-line)]">
                          <Icon className="size-4 shrink-0 text-[var(--tg)]" aria-hidden="true" />
                          <span className="text-sm text-muted-foreground">
                            <span className="font-black tabular-nums text-foreground">{count}</span> {label}
                          </span>
                        </div>
                    ))}
                  </div>
              ) : null}
              <button
                  type="button"
                  className={`tg-btn w-full !py-2.5 ${badgeEarned ? "" : "tg-btn-primary"}`}
                  onClick={onAction}
              >
                <ActionIcon className="size-4" aria-hidden="true" />
                {badgeEarned ? "Review complete" : enrolled ? "Open lessons" : "View details"}
              </button>
            </div>
          }
      >
        <p className="mt-2 line-clamp-3 min-h-[60px] break-words text-sm leading-6 text-muted-foreground">
          {getCertificationDescription(certification)}
        </p>

        <EarnedStrip certificationId={getCertificationId(certification)} award={award} />
      </BubbleCard>
  )
}

function CategoryFilter({
                          categories,
                          categoryCounts,
                          selectedCategories,
                          onToggleCategory,
                          onClear,
                        }) {
  return (
      <aside className="tg-cat-explain h-fit">
        <section className="tg-frame">
          <header className="tg-head flex items-center gap-2.5 px-4 py-3">
            <span className="tg-badge-icon"><Layers3 className="size-4" aria-hidden="true" /></span>
            <span className="tg-kicker flex-1">Categories</span>
            <button
                type="button"
                onClick={onClear}
                disabled={selectedCategories.size === 0}
                className="tg-btn !px-3 !py-1 !text-xs"
            >
              Clear
            </button>
          </header>

          <div className="space-y-2 p-3">
            {categories.length === 0 ? (
                <p className="px-1 py-2 text-sm text-muted-foreground">
                  No categories available.
                </p>
            ) : (
                categories.map((category) => {
                  const checked = selectedCategories.has(category)

                  return (
                      <button
                          key={category}
                          type="button"
                          aria-pressed={checked}
                          onClick={() => onToggleCategory(category)}
                          className={`tg-btn w-full !justify-between !text-left !text-sm ${checked ? "tg-btn-primary" : ""}`}
                      >
                        <span className="min-w-0 flex-1">{category}</span>
                        <span className="shrink-0 text-xs tabular-nums opacity-80">
                          {categoryCounts.get(category) ?? 0}
                        </span>
                      </button>
                  )
                })
            )}
          </div>
        </section>
      </aside>
  )
}

export default function LearnerCertificationsPage() {
  const navigate = useNavigate()
  const outletContext = useOutletContext()
  const data = outletContext?.data ?? {}
  const searchValue = String(outletContext?.searchValue ?? "")

  const certifications = data.certifications ?? []
  const enrolledCertifications = data.enrolledCertifications ?? []

  const awardsQuery = useQuery({ queryKey: ["learner-awards"], queryFn: getMyAwards, staleTime: 0, retry: 1 })
  const awardByCertification = useMemo(() => {
    const map = new Map()
    for (const award of Array.isArray(awardsQuery.data) ? awardsQuery.data : []) {
      map.set(String(award.certificationId), award)
    }
    return map
  }, [awardsQuery.data])

  const [selectedCategories, setSelectedCategories] = useState(new Set())
  const [sortBy, setSortBy] = useState("popular")
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT)

  const allCertifications = useMemo(() => {
    const combinedCertifications = [
      ...certifications,
      ...enrolledCertifications,
    ]

    const uniqueCertifications = new Map()

    combinedCertifications.forEach((certification) => {
      const certificationId = getCertificationId(certification)

      if (certificationId !== null && certificationId !== undefined) {
        uniqueCertifications.set(
            String(certificationId),
            certification
        )
      }
    })

    return Array.from(uniqueCertifications.values())
  }, [certifications, enrolledCertifications])

  const enrolledCertificationIds = useMemo(() => {
    return new Set(
        enrolledCertifications.map((certification) =>
            String(getCertificationId(certification))
        )
    )
  }, [enrolledCertifications])

  const categories = useMemo(() => {
    return [
      ...new Set(
          allCertifications
              .map((certification) =>
                  getCertificationCategory(certification)
              )
              .filter(Boolean)
      ),
    ].sort((first, second) => first.localeCompare(second))
  }, [allCertifications])

  const categoryCounts = useMemo(() => {
    const counts = new Map()
    allCertifications.forEach((certification) => {
      const category = getCertificationCategory(certification)
      counts.set(category, (counts.get(category) ?? 0) + 1)
    })
    return counts
  }, [allCertifications])

  const filteredCertifications = useMemo(() => {
    const query = searchValue.toLowerCase().trim()

    const matchingCertifications = allCertifications.filter(
        (certification) => {
          const category = getCertificationCategory(certification)

          const matchesCategory =
              selectedCategories.size === 0 ||
              selectedCategories.has(category)

          const matchesSearch =
              !query ||
              getCertificationTitle(certification)
                  .toLowerCase()
                  .includes(query) ||
              getCertificationDescription(certification)
                  .toLowerCase()
                  .includes(query) ||
              category.toLowerCase().includes(query)

          return matchesCategory && matchesSearch
        }
    )

    return [...matchingCertifications].sort((first, second) => {
      if (sortBy === "title-asc") {
        return getCertificationTitle(first).localeCompare(
            getCertificationTitle(second)
        )
      }

      if (sortBy === "title-desc") {
        return getCertificationTitle(second).localeCompare(
            getCertificationTitle(first)
        )
      }

      return 0
    })
  }, [
    allCertifications,
    searchValue,
    selectedCategories,
    sortBy,
  ])

  const visibleCertifications = filteredCertifications.slice(
      0,
      visibleCount
  )

  const hasMoreCertifications =
      visibleCertifications.length < filteredCertifications.length

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT)
  }, [selectedCategories, sortBy, searchValue])

  function toggleCategory(category) {
    setSelectedCategories((currentCategories) => {
      const updatedCategories = new Set(currentCategories)

      if (updatedCategories.has(category)) {
        updatedCategories.delete(category)
      } else {
        updatedCategories.add(category)
      }

      return updatedCategories
    })
  }

  function clearCategories() {
    setSelectedCategories(new Set())
  }

  function openCertification(certification) {
    navigate(
        `/learner/certifications/${getCertificationId(certification)}`
    )
  }

  function handleCertificationAction(certification) {
    const id = getCertificationId(certification)
    const award = awardByCertification.get(String(id))
    if (award?.badgeAwardedAt) {
      navigate(`/learner/certifications/${id}/certificate`)
      return
    }
    navigate(
      enrolledCertificationIds.has(String(id))
        ? `/learner/learning/${id}`
        : `/learner/certifications/${id}`
    )
  }

  const enrolledCount = enrolledCertificationIds.size

  return (
      <div className="rb-hub w-full min-w-0 space-y-7 pb-10">
        <LearnerPageHeader
            title="Certifications"
        />

        <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
          <CategoryFilter
              categories={categories}
              categoryCounts={categoryCounts}
              selectedCategories={selectedCategories}
              onToggleCategory={toggleCategory}
              onClear={clearCategories}
          />

          <main className="min-w-0">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">
                {filteredCertifications.length}
              </span>{" "}
                certification
                {filteredCertifications.length === 1 ? "" : "s"}
              </p>

              <div className="flex items-center">
              <span className="mr-2 whitespace-nowrap text-sm text-muted-foreground">
                Sort by
              </span>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue aria-label="Sort certifications" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="popular">Popular</SelectItem>
                    <SelectItem value="title-asc">Name: A–Z</SelectItem>
                    <SelectItem value="title-desc">Name: Z–A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {awardsQuery.isLoading ? (
                <section className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse overflow-hidden rounded-2xl border-2 border-border">
                      <div className="h-28 bg-muted/40" />
                      <div className="space-y-3 p-5">
                        <div className="h-4 w-3/4 rounded bg-muted/40" />
                        <div className="h-3 w-full rounded bg-muted/30" />
                        <div className="h-3 w-2/3 rounded bg-muted/30" />
                        <div className="mt-2 h-10 w-full rounded-xl bg-muted/40" />
                      </div>
                    </div>
                  ))}
                </section>
            ) : visibleCertifications.length === 0 ? (
                <LearnerEmptyState
                    icon={Award}
                    title="No certifications found"
                    description="Try clearing your selected categories or using a different search term."
                    action={
                      selectedCategories.size > 0 ? (
                          <button type="button" className="tg-btn" onClick={clearCategories}>
                            Clear filters
                          </button>
                      ) : null
                    }
                />
            ) : (
                <>
                  <section className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                    {visibleCertifications.map((certification) => {
                      const certificationId = getCertificationId(certification)

                      const enrolled = enrolledCertificationIds.has(
                          String(certificationId)
                      )

                      return (
                          <CertificationCard
                              key={certificationId}
                              certification={certification}
                              enrolled={enrolled}
                              award={awardByCertification.get(String(certificationId))}
                              onOpen={() => openCertification(certification)}
                              onAction={() => handleCertificationAction(certification)}
                          />
                      )
                    })}
                  </section>

                  {hasMoreCertifications && (
                      <div className="tg-cat-explain mt-10 flex justify-center">
                        <button
                            type="button"
                            onClick={() =>
                                setVisibleCount(
                                    (currentCount) =>
                                        currentCount + LOAD_MORE_COUNT
                                )
                            }
                            className="tg-btn min-w-64 !py-2.5"
                        >
                          Load more certifications
                        </button>
                      </div>
                  )}
                </>
            )}
          </main>
        </div>

      </div>
  )
}
