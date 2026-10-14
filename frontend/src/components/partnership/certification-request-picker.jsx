import { useEffect, useMemo, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Check, ChevronDown, GraduationCap } from "@/components/icons"

import { Skeleton } from "@/components/ui/skeleton"
import { CATALOG_CERTIFICATIONS } from "@/constants/certifications-catalog.js"
import { getAllCertifications } from "@/services/certificationService.js"
import { REFERENCE_PROGRAM, useReferenceDetails } from "@/services/referenceService.js"

const OTHER_PROGRAM = "other"

function normalizeTitle(title) {
  return String(title ?? "").toLowerCase().replace(/[^a-z0-9]/g, "")
}

/**
 * Requestable certifications grouped by the admin-managed programs (Reference lists > Programs).
 * A certification can sit under several programs; one under none is listed under "Other".
 */
export function useRequestCatalog() {
  const certificationsQuery = useQuery({
    queryKey: ["certifications", "request-access"],
    queryFn: () => getAllCertifications(undefined, { includeComingSoon: true, summary: true }),
    staleTime: 5 * 60 * 1000,
  })
  const programsQuery = useReferenceDetails(REFERENCE_PROGRAM)

  return useMemo(() => {
    const programs = programsQuery.options.map((option) => ({
      id: String(option.id),
      code: option.code || option.label.slice(0, 4).toUpperCase(),
      name: option.label,
      description: option.description ?? "",
      certificationIds: (option.certificationIds ?? []).map(Number),
    }))
    const listed = (Array.isArray(certificationsQuery.data) ? certificationsQuery.data : []).filter(
      (c) => c.status === "PUBLISHED" || c.status === "COMING_SOON"
    )
    const certifications = listed.map((c) => {
      const owners = programs.filter((program) => program.certificationIds.includes(c.certificationId))
      const enrichment = CATALOG_CERTIFICATIONS.find((item) => normalizeTitle(item.title) === normalizeTitle(c.title))
      return {
        certificationId: c.certificationId,
        title: c.title,
        description: enrichment?.description || c.description || "",
        status: c.status,
        available: c.status === "PUBLISHED",
        programIds: owners.length > 0 ? owners.map((program) => program.id) : [OTHER_PROGRAM],
        programs: owners.map((program) => program.description || program.name),
      }
    })
    const hasOther = certifications.some((c) => c.programIds.includes(OTHER_PROGRAM))
    return {
      programs: hasOther
        ? [...programs, { id: OTHER_PROGRAM, code: "OTH", name: "Other certifications", description: "Not assigned to a program yet", certificationIds: [] }]
        : programs,
      certifications,
      loading: certificationsQuery.isLoading || programsQuery.isLoading,
    }
  }, [certificationsQuery.data, certificationsQuery.isLoading, programsQuery.options, programsQuery.isLoading])
}

export const CURRENT_YEAR = new Date().getFullYear()
export const DEFAULT_SCHOOL_YEAR = `${CURRENT_YEAR}-${CURRENT_YEAR + 1}`

export const SCHOOL_YEAR_OPTIONS = Array.from({ length: 5 }, (_, index) => {
  const start = CURRENT_YEAR + index
  return { value: `${start}-${start + 1}`, label: `S.Y. ${start}–${start + 1}` }
})

export function isoDate(months = 0) {
  const date = new Date()
  date.setMonth(date.getMonth() + months)
  const pad = (n) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function getDatesFromSchoolYear(startSY, endSY) {
  const [startYear] = (startSY || DEFAULT_SCHOOL_YEAR).split("-").map(Number)
  const [, endYear] = (endSY || startSY || DEFAULT_SCHOOL_YEAR).split("-").map(Number)
  const start = startYear === CURRENT_YEAR ? isoDate(0) : `${startYear}-08-01`
  return { start, end: `${endYear}-07-31` }
}

export function formatSchoolYearRange(startSY, endSY) {
  if (!startSY && !endSY) return ""
  if (!endSY || startSY === endSY) return `S.Y. ${startSY}`
  const [startFirst] = (startSY || "").split("-")
  const [, endSecond] = (endSY || "").split("-")
  return startFirst && endSecond ? `S.Y. ${startFirst}–${endSecond}` : `S.Y. ${startSY}–${endSY}`
}

function schoolYearOf(isoValue, fallback) {
  const date = isoValue ? new Date(`${String(isoValue).slice(0, 10)}T00:00:00`) : null
  if (!date || Number.isNaN(date.getTime())) return fallback
  const startYear = date.getMonth() >= 7 ? date.getFullYear() : date.getFullYear() - 1
  const clamped = Math.min(Math.max(startYear, CURRENT_YEAR), CURRENT_YEAR + 4)
  return `${clamped}-${clamped + 1}`
}

/**
 * Selection state for the certification picker. `seed` pre-selects rows as
 * [{ certificationId, slots, startDate, endDate }].
 */
export function useCertificationSelection(certifications, { seed = null, defaultSlots = "10" } = {}) {
  const [selected, setSelected] = useState(() => {
    const initial = {}
    for (const item of seed ?? []) initial[String(item.certificationId)] = String(item.slots ?? "")
    return initial
  })
  const [dates, setDates] = useState(() => {
    const initial = {}
    for (const item of seed ?? []) {
      const startSY = schoolYearOf(item.startDate, DEFAULT_SCHOOL_YEAR)
      const endSY = schoolYearOf(item.endDate, startSY)
      initial[String(item.certificationId)] = { startSY, endSY, ...getDatesFromSchoolYear(startSY, endSY) }
    }
    return initial
  })

  const toggle = (certificationId) => {
    const key = String(certificationId)
    const certification = certifications.find((c) => String(c.certificationId) === key)
    if (certification && certification.available === false) return
    setSelected((current) => {
      const next = { ...current }
      if (key in next) delete next[key]
      else next[key] = defaultSlots
      return next
    })
    setDates((current) =>
      key in current
        ? current
        : {
            ...current,
            [key]: {
              startSY: DEFAULT_SCHOOL_YEAR,
              endSY: DEFAULT_SCHOOL_YEAR,
              ...getDatesFromSchoolYear(DEFAULT_SCHOOL_YEAR, DEFAULT_SCHOOL_YEAR),
            },
          }
    )
  }

  const setSchoolYear = (certificationId, type, value) => {
    const key = String(certificationId)
    setDates((current) => {
      const existing = current[key] || {}
      let startSY = existing.startSY || DEFAULT_SCHOOL_YEAR
      let endSY = existing.endSY || startSY
      if (type === "start") startSY = value
      else endSY = value
      const startNum = Number(startSY.split("-")[0])
      const endNum = Number(endSY.split("-")[0])
      if (startNum > endNum) {
        if (type === "start") endSY = startSY
        else startSY = endSY
      }
      return { ...current, [key]: { startSY, endSY, ...getDatesFromSchoolYear(startSY, endSY) } }
    })
  }

  const setSlots = (certificationId, value) =>
    setSelected((current) => ({ ...current, [String(certificationId)]: value }))

  const nudgeSlots = (certificationId, delta) =>
    setSelected((current) => {
      const parsed = Number(current[String(certificationId)])
      const base = Number.isFinite(parsed) ? parsed : 0
      return { ...current, [String(certificationId)]: String(Math.max(1, base + delta)) }
    })

  const reset = () => {
    setSelected({})
    setDates({})
  }

  const items = useMemo(
    () =>
      Object.entries(selected).map(([certificationId, slots]) => {
        const info = dates[certificationId] || {}
        const startSY = info.startSY || DEFAULT_SCHOOL_YEAR
        const endSY = info.endSY || startSY
        const computed = getDatesFromSchoolYear(startSY, endSY)
        return {
          certificationId: Number(certificationId),
          requestedSlots: Number(slots),
          startSY,
          endSY,
          start: info.start || computed.start,
          end: info.end || computed.end,
          certification: certifications.find((c) => String(c.certificationId) === certificationId),
        }
      }),
    [selected, dates, certifications]
  )

  const totalSlots = items.reduce(
    (sum, item) => sum + (Number.isFinite(item.requestedSlots) ? item.requestedSlots : 0),
    0
  )

  const validate = () => {
    if (items.length === 0) return "Select at least one certification."
    if (items.some((item) => !Number.isFinite(item.requestedSlots) || item.requestedSlots < 1))
      return "Each selected certification needs at least 1 learner slot."
    if (items.some((item) => !item.start || !item.end))
      return "Pick an access school year for each selected certification."
    if (items.some((item) => item.start < isoDate(0))) return "An access start date cannot be in the past."
    if (items.some((item) => item.end <= item.start)) return "Each access end date must be after its start date."
    return ""
  }

  return { selected, dates, toggle, setSchoolYear, setSlots, nudgeSlots, reset, items, totalSlots, validate }
}

function DepartmentSelect({ programs, certifications, value, onChange, count }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const active = value ? programs.find((d) => d.id === value) || null : null

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const option = (id, code, name, description, total) => {
    const isSelected = id === value
    return (
      <button
        key={id}
        type="button"
        onClick={() => {
          onChange(id)
          setOpen(false)
        }}
        className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left transition ${
          isSelected ? "bg-rb-macaw-wash font-bold text-rb-macaw-lip" : "text-rb-eel hover:bg-black/5"
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-black/5 px-1 py-0.5 text-[10px] font-bold">{code}</span>
            <span className="truncate text-xs font-semibold">{name}</span>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-rb-wolf">{description}</p>
        </div>
        <span className="ml-2 shrink-0 rounded-full border border-rb-swan bg-rb-paper px-1.5 py-0.5 text-[10px] font-semibold text-rb-wolf">
          {total}
        </span>
      </button>
    )
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor="department-select" className="block text-xs font-bold uppercase tracking-wider text-rb-wolf">
        Select department
      </label>
      <div className="relative z-30 w-full sm:max-w-sm" ref={ref}>
        <button
          id="department-select"
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-10 w-full items-center justify-between gap-2.5 rounded-xl border-2 border-rb-swan bg-white px-3 shadow-xs transition hover:border-rb-macaw-lip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rb-macaw-lip"
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <div className="flex min-w-0 items-center gap-2 text-left">
            {value ? (
              <>
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-rb-macaw-wash text-[11px] font-bold text-rb-macaw-lip">
                  {active?.code ?? "ALL"}
                </span>
                <span className="truncate text-xs font-bold text-rb-eel">{active?.name ?? "All Departments"}</span>
                <span className="shrink-0 text-[11px] font-medium text-rb-wolf">
                  · {count} {count === 1 ? "cert" : "certs"}
                </span>
              </>
            ) : (
              <>
                <GraduationCap className="size-4 shrink-0 text-rb-wolf" />
                <span className="truncate text-xs font-semibold text-rb-wolf">Choose course or program...</span>
              </>
            )}
          </div>
          <ChevronDown
            className={`size-3.5 shrink-0 text-rb-wolf transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open ? (
          <div className="absolute left-0 top-full z-50 mt-1.5 max-h-80 w-full overflow-y-auto rounded-xl border-2 border-rb-swan bg-white p-1.5 shadow-xl">
            {programs.map((dept) =>
              option(
                dept.id,
                dept.code,
                dept.name,
                dept.description,
                certifications.filter((c) => c.programIds.includes(dept.id)).length
              )
            )}
            <div className="my-1 border-t border-rb-swan" />
            {option("all", "ALL", "All Departments", "Browse certifications across all programs", certifications.length)}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function CertificationRow({ certification, selected, slots, startSY, endSY, slotsLabel = "Learner slots", onToggle, onSlots, onNudge, onSYChange }) {
  const id = certification.certificationId
  const comingSoon = certification.available === false

  return (
    <div className={`rb-index-card ${selected ? "is-selected" : ""} ${comingSoon ? "opacity-60" : ""}`}>
      <button
        type="button"
        role="checkbox"
        aria-checked={selected}
        aria-disabled={comingSoon}
        disabled={comingSoon}
        onClick={comingSoon ? undefined : onToggle}
        title={comingSoon ? "Coming soon: not available to request yet." : undefined}
        className={`flex w-full items-start gap-4 p-5 text-left focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-rb-macaw ${
          comingSoon ? "cursor-not-allowed" : ""
        }`}
      >
        <span
          aria-hidden="true"
          className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-[6px] border-2 transition-colors ${
            selected
              ? "border-rb-feather bg-rb-feather text-rb-snow"
              : comingSoon
                ? "border-dashed border-rb-hare bg-rb-polar"
                : "border-rb-hare bg-rb-snow"
          }`}
        >
          {selected ? <Check className="size-4" /> : null}
        </span>

        <span className="min-w-0 flex-1">
          <div className="flex flex-col gap-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="rb-display-sm text-rb-eel">{certification.title}</span>
              {comingSoon ? (
                <span className="rounded-full border border-rb-fox bg-rb-fox-wash px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-rb-fox-lip">
                  Coming soon
                </span>
              ) : null}
            </span>
            {Array.isArray(certification.programs) && certification.programs.length > 0 ? (
              <p className="text-xs font-medium text-rb-wolf">
                <span>Covered programs:</span>{" "}
                <span className={`font-bold transition-colors ${selected ? "text-rb-macaw-lip" : "text-rb-eel"}`}>
                  {certification.programs.join(", ")}
                </span>
              </p>
            ) : null}
          </div>
          {certification.description ? (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-rb-wolf">{certification.description}</p>
          ) : null}
        </span>
      </button>

      {selected ? (
        <div className="border-t border-rb-swan/80 bg-rb-snow/60 px-5 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <div className="flex items-center gap-3">
              <label htmlFor={`slots-${id}`} className="text-xs font-bold text-rb-eel">
                {slotsLabel}
              </label>
              <div className="flex items-center rounded-lg border-2 border-rb-swan bg-white">
                <button
                  type="button"
                  aria-label="Remove one learner slot"
                  onClick={() => onNudge(-1)}
                  className="grid size-8 place-items-center rounded-l-md text-sm font-bold text-rb-wolf transition-colors hover:bg-black/5 hover:text-rb-eel"
                >
                  &minus;
                </button>
                <input
                  id={`slots-${id}`}
                  type="number"
                  min={1}
                  value={slots}
                  onChange={(event) => onSlots(event.target.value)}
                  className="w-14 border-x-2 border-rb-swan py-1 text-center text-xs font-bold text-rb-eel focus:bg-rb-macaw-wash/20 focus:outline-none"
                />
                <button
                  type="button"
                  aria-label="Add one learner slot"
                  onClick={() => onNudge(1)}
                  className="grid size-8 place-items-center rounded-r-md text-sm font-bold text-rb-wolf transition-colors hover:bg-black/5 hover:text-rb-eel"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-rb-eel">School year</span>
              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <select
                    id={`startSY-${id}`}
                    aria-label="Access starts in school year"
                    value={startSY}
                    onChange={(e) => onSYChange("start", e.target.value)}
                    className="h-8 cursor-pointer appearance-none rounded-lg border-2 border-rb-swan bg-white pl-2.5 pr-7 text-xs font-bold text-rb-eel focus:border-rb-macaw focus:outline-none"
                  >
                    {SCHOOL_YEAR_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-rb-wolf" />
                </div>
                <span className="text-xs font-semibold text-rb-wolf">to</span>
                <div className="relative">
                  <select
                    id={`endSY-${id}`}
                    aria-label="Access ends in school year"
                    value={endSY}
                    onChange={(e) => onSYChange("end", e.target.value)}
                    className="h-8 cursor-pointer appearance-none rounded-lg border-2 border-rb-swan bg-white pl-2.5 pr-7 text-xs font-bold text-rb-eel focus:border-rb-macaw focus:outline-none"
                  >
                    {SCHOOL_YEAR_OPTIONS.filter((opt) => {
                      const [startNum] = (startSY || "").split("-").map(Number)
                      const [optNum] = opt.value.split("-").map(Number)
                      return !startNum || optNum >= startNum
                    }).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-rb-wolf" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/** Program dropdown + selectable certification cards, as on the public request page. */
export function CertificationPicker({ programs, certifications, loading, selection, initialDepartment = "", slotsLabel }) {
  const [department, setDepartment] = useState(initialDepartment)

  const shown = useMemo(() => {
    if (!department) return []
    return department === "all" ? certifications : certifications.filter((c) => c.programIds.includes(department))
  }, [certifications, department])

  const groups = useMemo(() => {
    if (department !== "all") return []
    return programs
      .map((program) => ({
        department: program,
        certifications: certifications.filter((c) => c.programIds.includes(program.id)),
      }))
      .filter((group) => group.certifications.length > 0)
  }, [programs, certifications, department])

  const row = (certification, groupId = "") => {
    const key = String(certification.certificationId)
    return (
      <CertificationRow
        key={`${groupId}-${key}`}
        certification={certification}
        selected={key in selection.selected}
        slots={selection.selected[key] ?? ""}
        startSY={selection.dates[key]?.startSY ?? DEFAULT_SCHOOL_YEAR}
        endSY={selection.dates[key]?.endSY ?? DEFAULT_SCHOOL_YEAR}
        slotsLabel={slotsLabel}
        onToggle={() => selection.toggle(certification.certificationId)}
        onSlots={(value) => selection.setSlots(certification.certificationId, value)}
        onNudge={(delta) => selection.nudgeSlots(certification.certificationId, delta)}
        onSYChange={(type, value) => selection.setSchoolYear(certification.certificationId, type, value)}
      />
    )
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-rb-card" />
        ))}
      </div>
    )
  }

  const active = programs.find((d) => d.id === department)

  return (
    <div className="space-y-6">
      <DepartmentSelect
        programs={programs}
        certifications={certifications}
        value={department}
        onChange={setDepartment}
        count={shown.length}
      />

      {!department ? (
        <div className="rounded-2xl border-2 border-dashed border-rb-swan bg-rb-paper/40 px-6 py-12 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-rb-macaw-wash text-rb-macaw-lip">
            <GraduationCap className="size-6" />
          </div>
          <p className="mt-3 text-base font-bold text-rb-eel">Select course or program</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-rb-wolf">
            Choose a department from the drop box above to view and select the industry certifications your learners
            need.
          </p>
        </div>
      ) : shown.length === 0 ? (
        <p className="rb-body rounded-rb-card border-2 border-dashed border-rb-swan px-5 py-10 text-center">
          No certifications found for {active?.name || "this program"}.
        </p>
      ) : department === "all" ? (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.department.id} className="space-y-3">
              <div className="flex items-center gap-2.5 pt-2 first:pt-0">
                <span className="rounded-md bg-rb-macaw-wash px-2 py-0.5 text-xs font-bold text-rb-macaw-lip">
                  {group.department.code}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-rb-eel">{group.department.name}</span>
                <div className="h-px flex-1 bg-rb-swan" />
                <span className="text-xs font-semibold text-rb-wolf">
                  {group.certifications.length} {group.certifications.length === 1 ? "cert" : "certs"}
                </span>
              </div>
              <div className="space-y-3">{group.certifications.map((certification) => row(certification, group.department.id))}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">{shown.map((certification) => row(certification))}</div>
      )}
    </div>
  )
}

export function formatMoney(value, currency = "PHP") {
  return Number(value ?? 0).toLocaleString("en-PH", { style: "currency", currency, maximumFractionDigits: 0 })
}

/** Selected certifications, slot totals and price, as on the public request page. */
export function RequestSummary({ selection, pricePerSlot, currency = "PHP", emptyText }) {
  if (selection.items.length === 0) {
    return (
      <p className="rb-body mt-4 text-sm">
        {emptyText ?? "Nothing selected yet. Choose at least one certification to send a request."}
      </p>
    )
  }
  return (
    <>
      <ul className="mt-4 space-y-3">
        {selection.items.map((item) => {
          const slots = Number.isFinite(item.requestedSlots) ? item.requestedSlots : 0
          return (
            <li key={item.certificationId} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm">
              <div className="min-w-0 flex-1 truncate">
                <span className="truncate font-bold text-rb-eel">
                  {item.certification?.title ?? `Certification #${item.certificationId}`}
                </span>
              </div>
              <span className="rb-numeric shrink-0 text-sm text-rb-eel">{formatMoney(slots * pricePerSlot, currency)}</span>
              <span className="rb-caption w-full text-xs text-rb-wolf">
                {slots} slot(s) × {formatMoney(pricePerSlot, currency)} · {formatSchoolYearRange(item.startSY, item.endSY)}
              </span>
            </li>
          )
        })}
      </ul>
      <div className="mt-4 space-y-1.5 border-t-2 border-rb-swan pt-4">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-rb-wolf">Learner slots</span>
          <span className="rb-numeric text-rb-eel">{selection.totalSlots}</span>
        </div>
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-rb-wolf">Price per slot</span>
          <span className="rb-numeric text-rb-eel">{formatMoney(pricePerSlot, currency)}</span>
        </div>
        <div className="flex items-baseline justify-between gap-3 pt-1">
          <span className="text-sm font-bold text-rb-eel">Total amount</span>
          <span className="rb-numeric text-xl text-rb-eel">
            {formatMoney(selection.totalSlots * pricePerSlot, currency)}
          </span>
        </div>
        <p className="rb-caption text-xs text-rb-wolf">
          Billed on approval. You receive an invoice by email; access aligns with the requested school year.
        </p>
      </div>
    </>
  )
}
