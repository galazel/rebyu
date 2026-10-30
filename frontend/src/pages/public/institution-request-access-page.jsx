import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  GraduationCap,
  Loader2,
  Mail,
} from "@/components/icons"
import { toast } from "sonner"
import {
  CertificationPicker,
  RequestSummary,
  isoDate,
  useCertificationSelection,
  useRequestCatalog,
} from "@/components/partnership/certification-request-picker.jsx"
import { REFERENCE_INSTITUTION, useReferenceDetails } from "@/services/referenceService.js"

import { BrandLogo } from "@/components/brand-logo"
import {
  Chip,
  RebyuCard,
  TactileButton,
} from "@/components/rebyu/rebyu-ui.jsx"
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
    title: "You submit",
    body: "Institution details and the certifications your learners need. No account is created yet.",
  },
  {
    icon: ShieldCheckMark,
    title: "We review",
    body: "Our team verifies your institution and the learner slots you asked for.",
  },
  {
    icon: Mail,
    title: "You hear back",
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
          <h2 className="rb-display rb-display-md !normal-case">{title.charAt(0).toUpperCase() + title.slice(1)}</h2>
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
  const [error, setError] = useState("")
  const [confirmation, setConfirmation] = useState(null)

  const pricingQuery = useQuery({
    queryKey: ["partnership-pricing"],
    queryFn: getPartnershipPricing,
    staleTime: 60 * 60 * 1000,
  })
  const pricePerSlot = Number(pricingQuery.data?.pricePerSlot ?? 149)
  const currency = pricingQuery.data?.currency ?? "PHP"

  const [institutionDropdownOpen, setInstitutionDropdownOpen] = useState(false)
  const institutionDropdownRef = useRef(null)

  const [addressPopoverOpen, setAddressPopoverOpen] = useState(false)
  const addressPopoverRef = useRef(null)
  const addressTextareaRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
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

  const institutionOptions = useReferenceDetails(REFERENCE_INSTITUTION).options
  const universities = useMemo(
    () =>
      institutionOptions.map((option) => ({
        name: option.label,
        shortName: option.code ?? "",
        system: option.category ?? "",
        category: option.category ?? "",
        address: option.description ?? "",
      })),
    [institutionOptions]
  )

  const filteredUniversities = useMemo(() => {
    const q = (form.institutionName || "").toLowerCase().trim()
    if (!q) return universities
    return universities.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.shortName.toLowerCase().includes(q) ||
        u.system.toLowerCase().includes(q) ||
        u.address.toLowerCase().includes(q)
    )
  }, [form.institutionName, universities])

  const handleSelectUniversity = (uni) => {
    setForm((current) => ({
      ...current,
      institutionName: uni.name,
      institutionAddress: uni.address,
    }))
    setInstitutionDropdownOpen(false)
  }

  const catalog = useRequestCatalog()
  const selection = useCertificationSelection(catalog.certifications)
  const selectedItems = selection.items

  const setField = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))

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
      selection.reset()
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
    return selection.validate()
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
            <h1 className="rb-display rb-display-md mt-5 !normal-case">Request submitted</h1>
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
              <Link to="/">Back to home</Link>
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
              Bring your school onto REBYU.
            </h1>
            <p className="rb-chalk-body mx-auto mt-4 max-w-2xl text-lg">
              Tell us about your institution and the certifications your learners
              need. Nothing is charged, and no account is created by this form.
            </p>
            <TraySupplies />
          </div>

          <ol className="mt-16 grid items-stretch gap-8 sm:grid-cols-3">
            {PROCESS.map((step, index) => (
              <li
                key={step.title}
                className={`rb-sticky flex h-full flex-col ${["rb-sticky-yellow", "rb-sticky-mint", "rb-sticky-pink"][index]}`}
                style={{ "--tilt": index % 2 ? "1.2deg" : "-1.2deg" }}
              >
                <span className="rb-pushpin" aria-hidden="true" />
                <div className="flex items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/70 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]">
                    <step.icon className="size-5 text-[#4a3a12]" aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-black/[0.07] px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#5b4a1e]">
                    Step {index + 1}
                  </span>
                </div>
                <p className="rb-sticky-title mt-4 !text-[1.8rem] leading-tight">{step.title}</p>
                <p className="rb-sticky-body mt-2 text-[0.95rem] leading-6">{step.body}</p>
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
            <CertificationPicker
              programs={catalog.programs}
              certifications={catalog.certifications}
              loading={catalog.loading}
              selection={selection}
            />
          </FormSection>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rb-sticky rb-sticky-yellow !p-6 sm:!p-7">
            <span className="rb-pushpin" aria-hidden="true" />
            <p className="rb-sticky-title !text-[1.6rem]">Request summary</p>

            <RequestSummary selection={selection} pricePerSlot={pricePerSlot} currency={currency} />

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
                  Submitting…
                </>
              ) : (
                "Submit request"
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
    <header className="sticky top-0 z-50 w-full border-b border-rb-swan bg-rb-snow/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-[1120px] items-center justify-between gap-6 px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <BrandLogo className="size-9" />
          <span className="rb-wordmark text-2xl leading-none text-rb-eel">REBYU</span>
        </Link>
      </div>
    </header>
  )
}
