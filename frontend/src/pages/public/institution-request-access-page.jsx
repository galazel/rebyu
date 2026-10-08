import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  GraduationCap,
  Loader2,
  Mail,
} from "@/components/icons"
import { toast } from "sonner"
import {
  CATALOG_DEPARTMENTS,
  getMergedCertifications,
} from "@/constants/certifications-catalog.js"
import { CEBU_UNIVERSITIES } from "@/constants/cebu-universities.js"

import { BrandLogo } from "@/components/brand-logo"
import {
  Chip,
  RebyuCard,
  TactileButton,
} from "@/components/rebyu/rebyu-ui.jsx"
import { Skeleton } from "@/components/ui/skeleton"
import { getAllCertifications } from "@/services/certificationService.js"
import { getPartnershipPricing, submitPublicPartnershipRequest } from "@/services/partnershipService.js"
import { TraySupplies } from "@/components/classroom/tray-supplies.jsx"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const EMPTY_FORM = {
  institutionName: "",
  institutionEmail: "",
  contactPersonName: "",
  contactNumber: "",
  institutionAddress: "",
  businessDescription: "",
}

function isoDate(months = 0) {
  const date = new Date()
  date.setMonth(date.getMonth() + months)
  const pad = (n) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const CURRENT_YEAR = new Date().getFullYear()

const SCHOOL_YEAR_OPTIONS = [
  { value: `${CURRENT_YEAR}-${CURRENT_YEAR + 1}`, label: `S.Y. ${CURRENT_YEAR}–${CURRENT_YEAR + 1}` },
  { value: `${CURRENT_YEAR + 1}-${CURRENT_YEAR + 2}`, label: `S.Y. ${CURRENT_YEAR + 1}–${CURRENT_YEAR + 2}` },
  { value: `${CURRENT_YEAR + 2}-${CURRENT_YEAR + 3}`, label: `S.Y. ${CURRENT_YEAR + 2}–${CURRENT_YEAR + 3}` },
  { value: `${CURRENT_YEAR + 3}-${CURRENT_YEAR + 4}`, label: `S.Y. ${CURRENT_YEAR + 3}–${CURRENT_YEAR + 4}` },
  { value: `${CURRENT_YEAR + 4}-${CURRENT_YEAR + 5}`, label: `S.Y. ${CURRENT_YEAR + 4}–${CURRENT_YEAR + 5}` },
]

function getDatesFromSchoolYear(startSY, endSY) {
  const [startYear] = (startSY || `${CURRENT_YEAR}-${CURRENT_YEAR + 1}`).split("-").map(Number)
  const [, endYear] = (endSY || startSY || `${CURRENT_YEAR}-${CURRENT_YEAR + 1}`).split("-").map(Number)

  const todayIso = isoDate(0)
  const start = startYear === CURRENT_YEAR ? todayIso : `${startYear}-08-01`
  const end = `${endYear}-07-31`

  return { start, end }
}

function formatSchoolYearRange(startSY, endSY) {
  if (!startSY && !endSY) return ""
  if (!endSY || startSY === endSY) {
    return `S.Y. ${startSY}`
  }
  const [startFirst] = (startSY || "").split("-")
  const [, endSecond] = (endSY || "").split("-")
  if (startFirst && endSecond) {
    return `S.Y. ${startFirst}–${endSecond}`
  }
  return `S.Y. ${startSY}–${endSY}`
}

function ShieldCheckMark(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3l7 3v5.5c0 4.3-2.9 8.3-7 9.5-4.1-1.2-7-5.2-7-9.5V6l7-3z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

const PROCESS = [
  {
    icon: ClipboardCheck,
    title: "you submit",
    body: "Institution details and the certifications your learners need. No account is created yet.",
  },
  {
    icon: ShieldCheckMark,
    title: "we review",
    body: "Our team verifies your institution and the learner slots you asked for.",
  },
  {
    icon: Mail,
    title: "you hear back",
    body: "We email the contact person once the request is approved or rejected.",
  },
]

function FormSection({ icon: Icon, tone = "feather", title, description, children }) {
  const TONES = {
    feather: "bg-rb-feather-wash text-rb-feather-lip",
    macaw: "bg-rb-macaw-wash text-rb-macaw-lip",
  }

  return (
    <section className="border-t-2 border-rb-swan pt-10 first:border-t-0 first:pt-0">
      <div className="flex items-start gap-4">
        <span
          className={`grid size-12 shrink-0 place-items-center rounded-rb-tile ${TONES[tone]}`}
        >
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="rb-display rb-display-md">{title}</h2>
          <p className="rb-body mt-1 text-sm">{description}</p>
        </div>
      </div>
      <div className="mt-7">{children}</div>
    </section>
  )
}

function Field({ id, label, hint, className = "", disableLabelClick = false, children }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label
        htmlFor={disableLabelClick ? undefined : id}
        className="block text-sm font-bold text-rb-eel"
      >
        {label}
      </label>
      {children}
      {hint ? <p className="rb-caption">{hint}</p> : null}
    </div>
  )
}

export default function InstitutionRequestAccessPage() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [selected, setSelected] = useState({})
  const [dates, setDates] = useState({})
  const [error, setError] = useState("")
  const [confirmation, setConfirmation] = useState(null)

  const pricingQuery = useQuery({
    queryKey: ["partnership-pricing"],
    queryFn: getPartnershipPricing,
    staleTime: 60 * 60 * 1000,
  })
  const pricePerSlot = Number(pricingQuery.data?.pricePerSlot ?? 149)
  const currency = pricingQuery.data?.currency ?? "PHP"

  const [selectedDept, setSelectedDept] = useState("")
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false)
  const deptDropdownRef = useRef(null)

  const [institutionDropdownOpen, setInstitutionDropdownOpen] = useState(false)
  const institutionDropdownRef = useRef(null)

  const [addressPopoverOpen, setAddressPopoverOpen] = useState(false)
  const addressPopoverRef = useRef(null)
  const addressTextareaRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(event.target)) {
        setDeptDropdownOpen(false)
      }
      if (
        institutionDropdownRef.current &&
        !institutionDropdownRef.current.contains(event.target)
      ) {
        setInstitutionDropdownOpen(false)
      }
      if (
        addressPopoverRef.current &&
        !addressPopoverRef.current.contains(event.target)
      ) {
        setAddressPopoverOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredUniversities = useMemo(() => {
    const q = (form.institutionName || "").toLowerCase().trim()
    if (!q) return CEBU_UNIVERSITIES
    return CEBU_UNIVERSITIES.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.shortName.toLowerCase().includes(q) ||
        u.system.toLowerCase().includes(q) ||
        u.address.toLowerCase().includes(q)
    )
  }, [form.institutionName])

  const handleSelectUniversity = (uni) => {
    setForm((current) => ({
      ...current,
      institutionName: uni.name,
      institutionAddress: uni.address,
    }))
    setInstitutionDropdownOpen(false)
  }

  const certificationsQuery = useQuery({
    queryKey: ["certifications", "request-access"],
    queryFn: () => getAllCertifications(undefined, { includeComingSoon: true }),
    staleTime: 5 * 60 * 1000,
  })

  const allCertifications = useMemo(
    () => getMergedCertifications(certificationsQuery.data),
    [certificationsQuery.data]
  )

  const activeDept = useMemo(
    () => (selectedDept ? CATALOG_DEPARTMENTS.find((d) => d.id === selectedDept) || null : null),
    [selectedDept]
  )

  const displayedCertifications = useMemo(() => {
    if (!selectedDept) return []
    return selectedDept === "all"
      ? allCertifications
      : allCertifications.filter((c) => c.department === selectedDept)
  }, [allCertifications, selectedDept])

  const groupedCertifications = useMemo(() => {
    if (selectedDept !== "all") return []
    const map = new Map()
    for (const cert of displayedCertifications) {
      if (!map.has(cert.department)) {
        map.set(cert.department, [])
      }
      map.get(cert.department).push(cert)
    }
    return Array.from(map.entries()).map(([deptId, certs]) => {
      const deptInfo = CATALOG_DEPARTMENTS.find((d) => d.id === deptId) || {
        id: deptId,
        name: certs[0]?.departmentName || "Department",
        code: certs[0]?.departmentCode || deptId.toUpperCase(),
      }
      return {
        department: deptInfo,
        certifications: certs,
      }
    })
  }, [displayedCertifications, selectedDept])

  const setField = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))

  const toggleCertification = (certificationId) => {
    const certification = allCertifications.find(
      (c) => String(c.certificationId) === String(certificationId)
    )
    if (certification && !certification.available) return
    setSelected((current) => {
      const next = { ...current }
      if (certificationId in next) {
        delete next[certificationId]
      } else {
        next[certificationId] = "10"
      }
      return next
    })
    setDates((current) => {
      if (certificationId in current) return current
      const defaultSY = `${CURRENT_YEAR}-${CURRENT_YEAR + 1}`
      const { start, end } = getDatesFromSchoolYear(defaultSY, defaultSY)
      return {
        ...current,
        [certificationId]: {
          startSY: defaultSY,
          endSY: defaultSY,
          start,
          end,
        },
      }
    })
  }

  const setSchoolYear = (certificationId, type, syValue) => {
    setDates((current) => {
      const existing = current[certificationId] || {}
      const defaultSY = `${CURRENT_YEAR}-${CURRENT_YEAR + 1}`
      let startSY = existing.startSY || defaultSY
      let endSY = existing.endSY || startSY

      if (type === "start") {
        startSY = syValue
        const startNum = parseInt(startSY.split("-")[0], 10)
        const endNum = parseInt(endSY.split("-")[0], 10)
        if (startNum > endNum) {
          endSY = startSY
        }
      } else if (type === "end") {
        endSY = syValue
        const startNum = parseInt(startSY.split("-")[0], 10)
        const endNum = parseInt(endSY.split("-")[0], 10)
        if (endNum < startNum) {
          startSY = endSY
        }
      }

      const { start, end } = getDatesFromSchoolYear(startSY, endSY)
      return {
        ...current,
        [certificationId]: {
          startSY,
          endSY,
          start,
          end,
        },
      }
    })
  }

  const setSlots = (certificationId, value) =>
    setSelected((current) => ({ ...current, [certificationId]: value }))

  const nudgeSlots = (certificationId, delta) =>
    setSelected((current) => {
      const parsed = Number(current[certificationId])
      const base = Number.isFinite(parsed) ? parsed : 0
      return { ...current, [certificationId]: String(Math.max(1, base + delta)) }
    })

  const selectedItems = useMemo(
    () =>
      Object.entries(selected).map(([certificationId, slots]) => {
        const dateInfo = dates[certificationId] || {}
        const defaultSY = `${CURRENT_YEAR}-${CURRENT_YEAR + 1}`
        const startSY = dateInfo.startSY || defaultSY
        const endSY = dateInfo.endSY || startSY
        const computed = getDatesFromSchoolYear(startSY, endSY)

        return {
          certificationId: Number(certificationId),
          requestedSlots: Number(slots),
          startSY,
          endSY,
          start: dateInfo.start || computed.start,
          end: dateInfo.end || computed.end,
          certification: allCertifications.find(
            (c) => String(c.certificationId) === String(certificationId)
          ),
        }
      }),
    [selected, dates, allCertifications]
  )

  const totalSlots = selectedItems.reduce(
    (sum, item) => sum + (Number.isFinite(item.requestedSlots) ? item.requestedSlots : 0),
    0
  )
  const totalAmount = totalSlots * pricePerSlot

  const submitMutation = useMutation({
    mutationFn: () =>
      submitPublicPartnershipRequest({
        institutionName: form.institutionName.trim(),
        institutionEmail: form.institutionEmail.trim(),
        contactPersonName: form.contactPersonName.trim(),
        contactNumber: form.contactNumber.trim(),
        institutionAddress: form.institutionAddress.trim(),
        businessDescription: form.businessDescription.trim(),
        items: selectedItems.map((item) => ({
          certificationId: item.certificationId,
          requestedSlots: item.requestedSlots,
          requestedAccessStartDate: item.start,
          requestedAccessEndDate: item.end,
        })),
      }),
    onSuccess: (response) => {
      setConfirmation(response)
      setForm(EMPTY_FORM)
      setSelected({})
      setDates({})
      setError("")
      toast.success("Partnership request submitted.")
    },
    onError: (mutationError) => {
      const message =
        mutationError?.response?.data?.message ??
        "Unable to submit your request. Please try again."
      setError(message)
      toast.error(message)
    },
  })

  const validate = () => {
    if (!form.institutionName.trim()) return "Enter your institution name."
    if (!EMAIL_PATTERN.test(form.institutionEmail.trim()))
      return "Enter a valid institution email."
    if (!form.contactPersonName.trim()) return "Enter a contact person name."
    if (!form.contactNumber.trim()) return "Enter a contact number."
    if (!form.institutionAddress.trim()) return "Enter your institution address."
    if (!form.businessDescription.trim())
      return "Add a short description of your institution."
    if (selectedItems.length === 0) return "Select at least one certification."
    if (
      selectedItems.some(
        (item) => !Number.isFinite(item.requestedSlots) || item.requestedSlots < 1
      )
    )
      return "Each selected certification needs at least 1 learner slot."
    if (selectedItems.some((item) => !item.start || !item.end))
      return "Pick an access school year for each selected certification."
    if (selectedItems.some((item) => item.start < isoDate(0)))
      return "An access start date cannot be in the past."
    if (selectedItems.some((item) => item.end <= item.start))
      return "Each access end date must be after its start date."
    return ""
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError("")
    submitMutation.mutate()
  }

  if (confirmation) {
    return (
      <main className="rebyu-ds rb-light-only flex min-h-dvh flex-col bg-rb-polar text-rb-eel">
        <PublicHeader />
        <div className="flex flex-1 items-center justify-center px-5 py-14 sm:px-8">
          <div className="rb-sticky rb-sticky-yellow w-full max-w-xl !p-8 sm:!p-10">
            <span className="rb-pushpin" aria-hidden="true" />
            <span className="grid size-14 place-items-center rounded-rb-tile bg-rb-leaf-wash text-rb-leaf">
              <CheckCircle2 className="size-7" aria-hidden="true" />
            </span>
            <h1 className="rb-display rb-display-md mt-5">request submitted</h1>
            <p className="rb-body mt-3">
              Our team will review your institution details and requested
              certification access. You will receive an email at the address you
              gave once the request is approved or rejected.
            </p>

            <div className="mt-7 rounded-[4px] bg-white/70 p-5 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.06)]">
              <p className="rb-eyebrow">your reference number</p>
              <p className="rb-numeric mt-2 text-2xl">
                {confirmation.referenceNumber}
              </p>
              <p className="rb-caption mt-2">
                Keep this to check your request status later.
              </p>
            </div>

            <TactileButton asChild variant="ghost" className="mt-7 w-full">
              <Link to="/">back to home</Link>
            </TactileButton>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="rebyu-ds rb-light-only min-h-dvh bg-rb-polar text-rb-eel">
      <PublicHeader />

      <section className="rb-classroom-photo px-5 py-14 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-[1120px]">
          <div className="rb-chalkboard px-6 pb-16 pt-10 text-center sm:px-12">
            <p className="rb-chalk-label mx-auto">institution partnerships</p>
            <h1 className="rb-chalk mt-5 text-[clamp(2.2rem,5vw,4rem)] leading-tight">
              bring your school onto rebyu.
            </h1>
            <p className="rb-chalk-body mx-auto mt-4 max-w-2xl text-lg">
              Tell us about your institution and the certifications your learners
              need. Nothing is charged, and no account is created by this form.
            </p>
            <TraySupplies />
          </div>

          <ol className="mt-16 grid gap-8 sm:grid-cols-3">
            {PROCESS.map((step, index) => (
              <li
                key={step.title}
                className={`rb-sticky ${["rb-sticky-yellow", "rb-sticky-mint", "rb-sticky-pink"][index]}`}
              >
                <span className="rb-pushpin" aria-hidden="true" />
                <div className="flex items-center gap-3">
                  <step.icon className="size-6 text-[#4a3a12]" aria-hidden="true" />
                  <span className="font-rb-display text-xl text-[#6b5a2a]">step {index + 1}</span>
                </div>
                <p className="rb-sticky-title mt-2 !text-[1.7rem]">{step.title}</p>
                <p className="rb-sticky-body mt-1.5 text-sm">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="mx-auto grid max-w-[1120px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12 lg:py-16"
      >
        <div className="rb-graded-sheet space-y-10 p-6 sm:p-10">
          <FormSection
            icon={Building2}
            title="institution details"
            description="We use these to verify your institution and to reach you about the request."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="org-name"
                label="Institution name"
                hint="Select your specific campus from the dropdown or type a custom institution"
                className="sm:col-span-2"
              >
                <div className="relative" ref={institutionDropdownRef}>
                  <input
                    id="org-name"
                    className="rb-input pr-10"
                    value={form.institutionName}
                    onChange={(e) => {
                      setField("institutionName")(e)
                      setInstitutionDropdownOpen(true)
                    }}
                    onFocus={() => setInstitutionDropdownOpen(true)}
                    placeholder="e.g. University of Cebu – Lapu-Lapu and Mandaue (UCLM)"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setInstitutionDropdownOpen((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-rb-wolf hover:text-rb-eel transition-colors"
                    aria-label="Toggle university list"
                    tabIndex={-1}
                  >
                    <ChevronDown
                      className={`size-4 transition-transform duration-200 ${
                        institutionDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {institutionDropdownOpen && (
                    <div className="absolute left-0 top-full mt-2 w-full max-h-80 overflow-y-auto rounded-2xl border-2 border-rb-swan bg-white p-2 shadow-xl z-50">
                      {filteredUniversities.length === 0 ? (
                        <div className="px-3 py-3 text-center">
                          <p className="text-xs font-semibold text-rb-wolf">
                            No Cebu universities match "{form.institutionName}"
                          </p>
                          <p className="mt-0.5 text-[11px] text-rb-wolf/70">
                            You can keep typing to use this custom institution name.
                          </p>
                        </div>
                      ) : (
                        filteredUniversities.map((uni) => (
                          <button
                            key={uni.name}
                            type="button"
                            onClick={() => handleSelectUniversity(uni)}
                            className="flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-black/5"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="rounded bg-rb-macaw-wash px-1.5 py-0.5 text-[11px] font-bold text-rb-macaw-lip">
                                  {uni.shortName}
                                </span>
                                <span className="truncate text-sm font-bold text-rb-eel">
                                  {uni.name}
                                </span>
                              </div>
                              <p className="mt-0.5 truncate text-xs text-rb-wolf">
                                {uni.address}
                              </p>
                            </div>
                            <span className="shrink-0 text-[11px] text-rb-wolf/70 font-medium pt-1">
                              {uni.category.split(" ")[0]}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </Field>
              <Field
                id="org-email"
                label="Institution email"
                hint="The approval or rejection email goes here."
              >
                <input
                  id="org-email"
                  type="email"
                  autoComplete="email"
                  className="rb-input"
                  value={form.institutionEmail}
                  onChange={setField("institutionEmail")}
                  placeholder="partnerships@org.edu"
                />
              </Field>
              <Field id="contact-name" label="Contact person">
                <input
                  id="contact-name"
                  className="rb-input"
                  value={form.contactPersonName}
                  onChange={setField("contactPersonName")}
                  placeholder="Maria Santos"
                />
              </Field>
              <Field id="contact-number" label="Contact number">
                <input
                  id="contact-number"
                  type="tel"
                  className="rb-input"
                  value={form.contactNumber}
                  onChange={setField("contactNumber")}
                  placeholder="+63 32 261 7741"
                />
              </Field>
              <Field
                id="org-address"
                label="Institution address"
                hint="Click field to view or edit full address"
                disableLabelClick
              >
                <div className="relative" ref={addressPopoverRef}>
                  <input
                    id="org-address"
                    className="rb-input"
                    value={form.institutionAddress}
                    onChange={setField("institutionAddress")}
                    onClick={() => setAddressPopoverOpen(true)}
                    title={form.institutionAddress || "Institution address"}
                    placeholder="N. Bacalso Ave, Cebu City"
                    autoComplete="off"
                  />

                  {addressPopoverOpen && (
                    <div className="absolute left-0 top-full mt-2 w-full sm:w-[420px] rounded-2xl border-2 border-rb-swan bg-white p-3.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="absolute -top-2 left-6 size-3.5 rotate-45 border-l-2 border-t-2 border-rb-swan bg-white" />

                      <div className="relative flex items-center justify-between pb-2 border-b border-rb-swan">
                        <div className="flex items-center gap-1.5">
                          <span className="flex size-5 items-center justify-center rounded bg-rb-macaw-wash text-rb-macaw-lip">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-3">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                          </span>
                          <span className="text-xs font-bold text-rb-eel">
                            Full Institution Address
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-rb-wolf">
                            {form.institutionAddress.length} chars
                          </span>
                          {form.institutionAddress && (
                            <button
                              type="button"
                              onClick={() => setForm((c) => ({ ...c, institutionAddress: "" }))}
                              className="text-[11px] font-bold text-rb-cardinal hover:underline"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="relative mt-2.5">
                        <textarea
                          ref={addressTextareaRef}
                          rows={3}
                          value={form.institutionAddress}
                          onChange={setField("institutionAddress")}
                          placeholder="Complete campus address, building, street, city..."
                          className="w-full rounded-xl border-2 border-rb-swan bg-rb-paper/40 p-2.5 text-xs font-semibold leading-relaxed text-rb-eel focus:border-rb-macaw focus:bg-white focus:outline-none resize-none"
                        />
                      </div>

                      <div className="relative mt-2 flex items-center justify-between">
                        <span className="text-[11px] text-rb-wolf">
                          Type here or in the field to edit full length
                        </span>
                        <button
                          type="button"
                          onClick={() => setAddressPopoverOpen(false)}
                          className="rounded-lg bg-rb-macaw-wash px-3 py-1 text-xs font-bold text-rb-macaw-lip hover:bg-rb-macaw hover:text-white transition-colors"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Field>
              <Field
                id="org-description"
                label="Institution / business description"
                className="sm:col-span-2"
              >
                <textarea
                  id="org-description"
                  rows={4}
                  className="rb-input py-3 leading-relaxed"
                  value={form.businessDescription}
                  onChange={setField("businessDescription")}
                  placeholder="Briefly describe your institution and why you want to partner with REBYU."
                />
              </Field>
            </div>
          </FormSection>

          <FormSection
            icon={GraduationCap}
            tone="macaw"
            title="certification access"
            description="Pick the certifications your learners will sit, and how many learner slots you need for each."
          >
            {certificationsQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-24 rounded-rb-card" />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label
                    htmlFor="department-select"
                    className="block text-xs font-bold uppercase tracking-wider text-rb-wolf"
                  >
                    Select department
                  </label>
                  <div className="relative z-30 w-full sm:max-w-sm" ref={deptDropdownRef}>
                    <button
                      id="department-select"
                      type="button"
                      onClick={() => setDeptDropdownOpen((prev) => !prev)}
                      className="flex h-10 w-full items-center justify-between gap-2.5 rounded-xl border-2 border-rb-swan bg-white px-3 shadow-xs transition hover:border-rb-macaw-lip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rb-macaw-lip"
                      aria-expanded={deptDropdownOpen}
                      aria-haspopup="listbox"
                    >
                      <div className="flex min-w-0 items-center gap-2 text-left">
                        {activeDept ? (
                          <>
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-rb-macaw-wash text-[11px] font-bold text-rb-macaw-lip">
                              {activeDept.code}
                            </span>
                            <span className="truncate text-xs font-bold text-rb-eel">
                              {activeDept.name}
                            </span>
                            <span className="shrink-0 text-[11px] font-medium text-rb-wolf">
                              · {displayedCertifications.length}{" "}
                              {displayedCertifications.length === 1 ? "cert" : "certs"}
                            </span>
                          </>
                        ) : (
                          <>
                            <GraduationCap className="size-4 shrink-0 text-rb-wolf" />
                            <span className="truncate text-xs font-semibold text-rb-wolf">
                              Choose course or program...
                            </span>
                          </>
                        )}
                      </div>
                      <ChevronDown
                        className={`size-3.5 shrink-0 text-rb-wolf transition-transform duration-200 ${
                          deptDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {deptDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1.5 w-full max-h-80 overflow-y-auto rounded-xl border-2 border-rb-swan bg-white p-1.5 shadow-xl z-50">
                        {CATALOG_DEPARTMENTS.filter((dept) => dept.id !== "all").map((dept) => {
                          const count = allCertifications.filter(
                            (c) => c.department === dept.id
                          ).length
                          const isSelected = dept.id === selectedDept

                          return (
                            <button
                              key={dept.id}
                              type="button"
                              onClick={() => {
                                setSelectedDept(dept.id)
                                setDeptDropdownOpen(false)
                              }}
                              className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left transition ${
                                isSelected
                                  ? "bg-rb-macaw-wash text-rb-macaw-lip font-bold"
                                  : "text-rb-eel hover:bg-black/5"
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="rounded bg-black/5 px-1 py-0.5 text-[10px] font-bold">
                                    {dept.code}
                                  </span>
                                  <span className="truncate text-xs font-semibold">{dept.name}</span>
                                </div>
                                <p className="mt-0.5 truncate text-[11px] text-rb-wolf">
                                  {dept.description}
                                </p>
                              </div>
                              <span className="ml-2 shrink-0 rounded-full border border-rb-swan bg-rb-paper px-1.5 py-0.5 text-[10px] font-semibold text-rb-wolf">
                                {count}
                              </span>
                            </button>
                          )
                        })}

                        <div className="my-1 border-t border-rb-swan" />

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDept("all")
                            setDeptDropdownOpen(false)
                          }}
                          className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left transition ${
                            selectedDept === "all"
                              ? "bg-rb-macaw-wash text-rb-macaw-lip font-bold"
                              : "text-rb-eel hover:bg-black/5"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="rounded bg-black/5 px-1 py-0.5 text-[10px] font-bold">
                                ALL
                              </span>
                              <span className="truncate text-xs font-semibold">
                                All Departments
                              </span>
                            </div>
                            <p className="mt-0.5 truncate text-[11px] text-rb-wolf">
                              Browse certifications across all programs
                            </p>
                          </div>
                          <span className="ml-2 shrink-0 rounded-full border border-rb-swan bg-rb-paper px-1.5 py-0.5 text-[10px] font-semibold text-rb-wolf">
                            {allCertifications.length}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {!selectedDept ? (
                  <div className="rounded-2xl border-2 border-dashed border-rb-swan bg-rb-paper/40 px-6 py-12 text-center">
                    <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-rb-macaw-wash text-rb-macaw-lip">
                      <GraduationCap className="size-6" />
                    </div>
                    <p className="mt-3 text-base font-bold text-rb-eel">
                      Select course or program
                    </p>
                    <p className="mx-auto mt-1 max-w-md text-sm text-rb-wolf">
                      Choose a department from the drop box above to view and select the industry certifications your learners need.
                    </p>
                  </div>
                ) : displayedCertifications.length === 0 ? (
                  <p className="rb-body rounded-rb-card border-2 border-dashed border-rb-swan px-5 py-10 text-center">
                    No certifications found for {activeDept?.name || "this program"}.
                  </p>
                ) : selectedDept === "all" ? (
                  <div className="space-y-6">
                    {groupedCertifications.map((group) => (
                      <div key={group.department.id} className="space-y-3">
                        <div className="flex items-center gap-2.5 pt-2 first:pt-0">
                          <span className="rounded-md bg-rb-macaw-wash px-2 py-0.5 text-xs font-bold text-rb-macaw-lip">
                            {group.department.code}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider text-rb-eel">
                            {group.department.name}
                          </span>
                          <div className="h-px flex-1 bg-rb-swan" />
                          <span className="text-xs font-semibold text-rb-wolf">
                            {group.certifications.length}{" "}
                            {group.certifications.length === 1 ? "cert" : "certs"}
                          </span>
                        </div>
                        <div className="space-y-3">
                          {group.certifications.map((certification) => (
                            <CertificationRow
                              key={certification.certificationId}
                              certification={certification}
                              selected={certification.certificationId in selected}
                              slots={selected[certification.certificationId] ?? ""}
                              startSY={dates[certification.certificationId]?.startSY ?? `${CURRENT_YEAR}-${CURRENT_YEAR + 1}`}
                              endSY={dates[certification.certificationId]?.endSY ?? `${CURRENT_YEAR}-${CURRENT_YEAR + 1}`}
                              onToggle={() =>
                                toggleCertification(certification.certificationId)
                              }
                              onSlots={(value) =>
                                setSlots(certification.certificationId, value)
                              }
                              onNudge={(delta) =>
                                nudgeSlots(certification.certificationId, delta)
                              }
                              onSYChange={(type, val) =>
                                setSchoolYear(certification.certificationId, type, val)
                              }
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayedCertifications.map((certification) => (
                      <CertificationRow
                        key={certification.certificationId}
                        certification={certification}
                        selected={certification.certificationId in selected}
                        slots={selected[certification.certificationId] ?? ""}
                        startSY={dates[certification.certificationId]?.startSY ?? `${CURRENT_YEAR}-${CURRENT_YEAR + 1}`}
                        endSY={dates[certification.certificationId]?.endSY ?? `${CURRENT_YEAR}-${CURRENT_YEAR + 1}`}
                        onToggle={() =>
                          toggleCertification(certification.certificationId)
                        }
                        onSlots={(value) =>
                          setSlots(certification.certificationId, value)
                        }
                        onNudge={(delta) =>
                          nudgeSlots(certification.certificationId, delta)
                        }
                        onSYChange={(type, val) =>
                          setSchoolYear(certification.certificationId, type, val)
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </FormSection>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rb-sticky rb-sticky-yellow !p-6 sm:!p-7">
            <span className="rb-pushpin" aria-hidden="true" />
            <p className="rb-eyebrow">request summary</p>

            {selectedItems.length === 0 ? (
              <p className="rb-body mt-4 text-sm">
                Nothing selected yet. Choose at least one certification to send a
                request.
              </p>
            ) : (
              <>
                <ul className="mt-4 space-y-3">
                  {selectedItems.map((item) => (
                    <li
                      key={item.certificationId}
                      className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm"
                    >
                      <div className="min-w-0 flex-1 truncate">
                        <span className="truncate font-bold text-rb-eel">
                          {item.certification?.title ??
                            `Certification #${item.certificationId}`}
                        </span>
                      </div>
                      <span className="rb-numeric shrink-0 text-sm text-rb-eel">
                        {formatMoney((Number.isFinite(item.requestedSlots) ? item.requestedSlots : 0) * pricePerSlot, currency)}
                      </span>
                      <span className="rb-caption w-full text-xs text-rb-wolf">
                        {Number.isFinite(item.requestedSlots) ? item.requestedSlots : 0} slot(s) ×{" "}
                        {formatMoney(pricePerSlot, currency)}
                        {item.startSY && item.endSY
                          ? ` · ${formatSchoolYearRange(item.startSY, item.endSY)}`
                          : item.start && item.end
                            ? ` · ${formatShortDate(item.start)} – ${formatShortDate(item.end)}`
                            : ""}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 space-y-1.5 border-t-2 border-rb-swan pt-4">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-rb-wolf">Learner slots</span>
                    <span className="rb-numeric text-rb-eel">{totalSlots}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-rb-wolf">Price per slot</span>
                    <span className="rb-numeric text-rb-eel">{formatMoney(pricePerSlot, currency)}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 pt-1">
                    <span className="text-sm font-bold text-rb-eel">Total amount</span>
                    <span className="rb-numeric text-xl text-rb-eel">{formatMoney(totalAmount, currency)}</span>
                  </div>
                  <p className="rb-caption text-xs text-rb-wolf">
                    Billed on approval. You receive an invoice by email; access aligns with the requested school year.
                  </p>
                </div>
              </>
            )}

            {error ? (
              <p
                role="alert"
                className="mt-5 rounded-rb-tile border-2 border-rb-cardinal bg-rb-cardinal-wash px-4 py-3 text-sm font-bold text-rb-cardinal-lip"
              >
                {error}
              </p>
            ) : null}

            <TactileButton
              type="submit"
              className="mt-6 w-full"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                  submitting...
                </>
              ) : (
                "submit request"
              )}
            </TactileButton>

            <p className="rb-caption mt-4">
              You get a reference number as soon as the request is in.
            </p>
          </div>
        </aside>
      </form>
    </main>
  )
}


function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-rb-swan bg-rb-snow">
      <div className="mx-auto flex h-20 max-w-[1120px] items-center justify-between gap-6 px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <BrandLogo className="size-9" />
          <span className="rb-display text-2xl leading-none">rebyu</span>
        </Link>
      </div>
    </header>
  )
}

function formatMoney(value, currency = "PHP") {
  return Number(value ?? 0).toLocaleString("en-PH", { style: "currency", currency, maximumFractionDigits: 0 })
}

function formatShortDate(value) {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function CertificationRow({
  certification,
  selected,
  slots,
  startSY,
  endSY,
  onToggle,
  onSlots,
  onNudge,
  onSYChange,
}) {
  const id = certification.certificationId
  const comingSoon = certification.available === false

  return (
    <div
      className={`rb-index-card ${selected ? "is-selected" : ""} ${comingSoon ? "opacity-60" : ""}`}
    >
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
            <p className="mt-1.5 text-xs leading-relaxed text-rb-wolf line-clamp-2">
              {certification.description}
            </p>
          ) : null}
        </span>
      </button>

      {selected ? (
        <div className="border-t border-rb-swan/80 bg-rb-snow/60 px-5 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <div className="flex items-center gap-3">
              <label
                htmlFor={`slots-${id}`}
                className="text-xs font-bold text-rb-eel"
              >
                Learner slots
              </label>
              <div className="flex items-center rounded-lg border-2 border-rb-swan bg-white">
                <button
                  type="button"
                  aria-label="Remove one learner slot"
                  onClick={() => onNudge(-1)}
                  className="grid size-8 place-items-center text-sm font-bold text-rb-wolf hover:bg-black/5 hover:text-rb-eel transition-colors rounded-l-md"
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
                  className="grid size-8 place-items-center text-sm font-bold text-rb-wolf hover:bg-black/5 hover:text-rb-eel transition-colors rounded-r-md"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-rb-eel">
                School year
              </span>
              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <select
                    id={`startSY-${id}`}
                    value={startSY}
                    onChange={(e) => onSYChange("start", e.target.value)}
                    className="h-8 appearance-none rounded-lg border-2 border-rb-swan bg-white pl-2.5 pr-7 text-xs font-bold text-rb-eel focus:border-rb-macaw focus:outline-none cursor-pointer"
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
                    value={endSY}
                    onChange={(e) => onSYChange("end", e.target.value)}
                    className="h-8 appearance-none rounded-lg border-2 border-rb-swan bg-white pl-2.5 pr-7 text-xs font-bold text-rb-eel focus:border-rb-macaw focus:outline-none cursor-pointer"
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
