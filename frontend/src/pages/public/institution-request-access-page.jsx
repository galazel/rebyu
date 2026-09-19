import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  Building2,
  Check,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Loader2,
  Mail,
} from "@/components/icons"
import { toast } from "sonner"

import { BrandLogo } from "@/components/brand-logo"
import {
  BackButton,
  Chip,
  RebyuCard,
  TactileButton,
} from "@/components/rebyu/rebyu-ui.jsx"
import { Skeleton } from "@/components/ui/skeleton"
import { getAllCertifications } from "@/services/certificationService.js"
import { submitPublicPartnershipRequest } from "@/services/partnershipService.js"
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

/* `ShieldCheck` is not in the generated icon map, and the middle step is the
   only place a verification glyph is wanted -- a local mark is cheaper than
   another entry in a generated file. */
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

/* The three things that happen after the button is pressed. This used to be a
   sentence inside the intro paragraph, which is the one place nobody reads it:
   the anxiety of a partnership form is not knowing what you have just started,
   and a three-step strip answers that before the first field. */
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

/** Section frame: icon tile, display heading, body, rule above. Used twice. */
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

/** Label + control pair. The label is the body face at 700, never the display face. */
function Field({ id, label, hint, className = "", children }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={id} className="block text-sm font-bold text-rb-eel">
        {label}
      </label>
      {children}
      {hint ? <p className="rb-caption">{hint}</p> : null}
    </div>
  )
}

export default function InstitutionRequestAccessPage() {
  const [form, setForm] = useState(EMPTY_FORM)
  // certificationId -> requested slots (string while editing)
  const [selected, setSelected] = useState({})
  // certificationId -> { start, end } as yyyy-mm-dd
  const [dates, setDates] = useState({})
  const [error, setError] = useState("")
  const [confirmation, setConfirmation] = useState(null)

  const certificationsQuery = useQuery({
    queryKey: ["certifications"],
    queryFn: () => getAllCertifications(),
    staleTime: 5 * 60 * 1000,
  })

  // Institutions can only inquire about published certifications -- drafts are
  // still being built by the admin (lessons, content, and required assessments)
  // and the submit endpoint rejects them anyway.
  const certifications = (
    Array.isArray(certificationsQuery.data) ? certificationsQuery.data : []
  ).filter((certification) => certification.status === "PUBLISHED")

  const setField = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))

  const toggleCertification = (certificationId) => {
    setSelected((current) => {
      const next = { ...current }
      if (certificationId in next) {
        delete next[certificationId]
      } else {
        next[certificationId] = "10"
      }
      return next
    })
    setDates((current) =>
      certificationId in current
        ? current
        : { ...current, [certificationId]: { start: isoDate(0), end: isoDate(12) } }
    )
  }

  const setDate = (certificationId, key, value) =>
    setDates((current) => ({
      ...current,
      [certificationId]: { ...current[certificationId], [key]: value },
    }))

  const setSlots = (certificationId, value) =>
    setSelected((current) => ({ ...current, [certificationId]: value }))

  /* The stepper works on the number, but the field stays a string while the
     visitor is typing -- nudging an empty or half-typed box starts from 0. */
  const nudgeSlots = (certificationId, delta) =>
    setSelected((current) => {
      const parsed = Number(current[certificationId])
      const base = Number.isFinite(parsed) ? parsed : 0
      return { ...current, [certificationId]: String(Math.max(1, base + delta)) }
    })

  const selectedItems = useMemo(
    () =>
      Object.entries(selected).map(([certificationId, slots]) => ({
        certificationId: Number(certificationId),
        requestedSlots: Number(slots),
        start: dates[certificationId]?.start ?? "",
        end: dates[certificationId]?.end ?? "",
        certification: certifications.find(
          (c) => String(c.certificationId) === String(certificationId)
        ),
      })),
    [selected, dates, certifications]
  )

  const totalSlots = selectedItems.reduce(
    (sum, item) => sum + (Number.isFinite(item.requestedSlots) ? item.requestedSlots : 0),
    0
  )

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

  // --- Confirmation screen ---------------------------------------------------
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

  // --- Request form ----------------------------------------------------------
  return (
    <main className="rebyu-ds rb-light-only min-h-dvh bg-rb-polar text-rb-eel">
      <PublicHeader />

      {/* The classroom, with the invitation chalked on the board and the three
          steps pinned up underneath it as sticky notes. */}
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
        {/* The application itself, written on a sheet of notebook paper. */}
        <div className="rb-graded-sheet space-y-10 p-6 sm:p-10">
          <FormSection
            icon={Building2}
            title="institution details"
            description="We use these to verify your institution and to reach you about the request."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="org-name" label="Institution name" className="sm:col-span-2">
                <input
                  id="org-name"
                  className="rb-input"
                  value={form.institutionName}
                  onChange={setField("institutionName")}
                  placeholder="Cebu Institute of Technology"
                />
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
              <Field id="org-address" label="Institution address">
                <input
                  id="org-address"
                  className="rb-input"
                  value={form.institutionAddress}
                  onChange={setField("institutionAddress")}
                  placeholder="N. Bacalso Ave, Cebu City"
                />
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
            ) : certifications.length === 0 ? (
              <p className="rb-body rounded-rb-card border-2 border-dashed border-rb-swan px-5 py-10 text-center">
                No certifications are open for partnership right now.
              </p>
            ) : (
              <div className="space-y-3">
                {certifications.map((certification) => (
                  <CertificationRow
                    key={certification.certificationId}
                    certification={certification}
                    selected={certification.certificationId in selected}
                    slots={selected[certification.certificationId] ?? ""}
                    start={dates[certification.certificationId]?.start ?? ""}
                    end={dates[certification.certificationId]?.end ?? ""}
                    onDate={(key, value) => setDate(certification.certificationId, key, value)}
                    onToggle={() => toggleCertification(certification.certificationId)}
                    onSlots={(value) => setSlots(certification.certificationId, value)}
                    onNudge={(delta) => nudgeSlots(certification.certificationId, delta)}
                  />
                ))}
              </div>
            )}
          </FormSection>
        </div>

        {/* The summary follows the form down the page: on a long form the
            running total and the submit key are the two things you want within
            reach at every scroll position, not only at the bottom. */}
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
                      <span className="min-w-0 truncate font-bold text-rb-eel">
                        {item.certification?.title ??
                          `Certification #${item.certificationId}`}
                      </span>
                      <span className="rb-numeric shrink-0 text-sm text-rb-wolf">
                        {Number.isFinite(item.requestedSlots) ? item.requestedSlots : 0}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-baseline justify-between gap-3 border-t-2 border-rb-swan pt-4">
                  <span className="text-sm font-bold text-rb-eel">
                    Total learner slots
                  </span>
                  <span className="rb-numeric text-xl">{totalSlots}</span>
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

/* --- pieces ---------------------------------------------------------------- */

function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-rb-swan bg-rb-snow">
      <div className="mx-auto flex h-20 max-w-[1120px] items-center justify-between gap-6 px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <BrandLogo className="size-9" />
          <span className="rb-display text-2xl leading-none">rebyu</span>
        </Link>
        <BackButton asChild size="sm" label="Back to home">
          <Link to="/" />
        </BackButton>
      </div>
    </header>
  )
}

/**
 * One selectable certification. The toggle is a `role="checkbox"` button rather
 * than a label wrapping a control, because the slot stepper sits in the same
 * card -- inside a label, every press of "+" would also toggle the row off.
 */
/** A date `months` from today as yyyy-mm-dd, in local time. */
function isoDate(months) {
  const date = new Date()
  date.setMonth(date.getMonth() + months)
  const pad = (n) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatShortDate(value) {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function CertificationRow({ certification, selected, slots, start, end, onToggle, onSlots, onNudge, onDate }) {
  const id = certification.certificationId

  return (
    <div
      className={`rb-index-card ${selected ? "is-selected" : ""}`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={selected}
        onClick={onToggle}
        className="flex w-full items-start gap-4 p-5 text-left focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-rb-macaw"
      >
        <span
          aria-hidden="true"
          className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-[6px] border-2 transition-colors ${
            selected
              ? "border-rb-feather bg-rb-feather text-rb-snow"
              : "border-rb-hare bg-rb-snow"
          }`}
        >
          {selected ? <Check className="size-4" /> : null}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="rb-display-sm text-rb-eel">{certification.title}</span>
            {certification.industry ? (
              <Chip tone={selected ? "macaw" : "neutral"}>{certification.industry}</Chip>
            ) : null}
          </span>
          {certification.description ? (
            <span className="rb-caption mt-1.5 line-clamp-2 block">
              {certification.description}
            </span>
          ) : null}
        </span>
      </button>

      {selected ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-rb-swan px-5 py-4">
          <label htmlFor={`slots-${id}`} className="text-sm font-bold text-rb-eel">
            Learner slots
          </label>
          <div className="flex items-center gap-2">
            <StepperKey label="Remove one learner slot" onClick={() => onNudge(-1)}>
              &minus;
            </StepperKey>
            <input
              id={`slots-${id}`}
              type="number"
              min={1}
              value={slots}
              onChange={(event) => onSlots(event.target.value)}
              className="rb-input w-24 bg-rb-snow text-center font-bold"
            />
            <StepperKey label="Add one learner slot" onClick={() => onNudge(1)}>
              +
            </StepperKey>
          </div>
        </div>
      ) : null}

    </div>
  )
}

/* 56px square, matching the input beside it and the button ladder. */
function StepperKey({ label, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-14 shrink-0 place-items-center rounded-rb-tile border-2 border-rb-swan bg-rb-snow text-xl font-bold text-rb-wolf transition-colors hover:border-rb-hare hover:text-rb-eel focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-rb-macaw"
    >
      {children}
    </button>
  )
}
