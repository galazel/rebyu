import { useMemo, useState } from "react"
import { Link, useOutletContext } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  CreditCard,
  HandshakeIcon,
  Loader2,
  PlusIcon,
  RefreshCwIcon,
} from "@/components/icons"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  InstitutionEmptyState,
  InstitutionErrorState,
  InstitutionLoadingSkeleton,
  InstitutionPageHeader,
  InstitutionStatusBadge,
  formatDate,
  formatDateTime,
} from "@/components/institution/institution-ui.jsx"
import { useInstitutionData } from "@/hooks/use-institution-data.js"
import {
  getMyInstitutionInvoices,
  getPartnershipRequestTransactions,
  requestPartnershipCancellation,
  startInvoiceCheckout,
  submitPartnershipRequestTransaction,
} from "@/services/institutionService.js"
import { getPartnershipPricing } from "@/services/partnershipService.js"
import {
  CertificationPicker,
  RequestSummary,
  formatMoney,
  formatSchoolYearRange,
  useCertificationSelection,
  useRequestCatalog,
} from "@/components/partnership/certification-request-picker.jsx"


function toLocalDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

const TODAY = () => toLocalDate(new Date())

function monthsFromToday(months) {
  const date = new Date()
  date.setMonth(date.getMonth() + Number(months))
  return toLocalDate(date)
}

function money(value, currency = "PHP") {
  if (value == null) return "—"
  return Number(value).toLocaleString("en-PH", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  })
}

function apiMessage(error, fallback) {
  return error?.response?.data?.message ?? error?.message ?? fallback
}

function monthsBetween(startDate, endDate) {
  if (!startDate || !endDate) return 12
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 12
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  return months > 0 ? months : 12
}

const RENEWAL_WINDOW_DAYS = 30

/** Renewal opens this many days before the first of the request's certifications ends. */
function renewalOpensOn(request) {
  const ends = (request.items ?? [])
    .map((item) => item.requestedAccessEndDate)
    .filter(Boolean)
    .sort()
  if (ends.length === 0) return null
  const date = new Date(`${String(ends[0]).slice(0, 10)}T00:00:00`)
  date.setDate(date.getDate() - RENEWAL_WINDOW_DAYS)
  return date
}

function accessEndsOn(request) {
  const ends = (request.items ?? [])
    .map((item) => item.requestedAccessEndDate)
    .filter(Boolean)
    .sort()
  return ends.length > 0 ? ends[ends.length - 1] : null
}

const OPEN_REQUEST_STATUSES = ["PENDING", "UNDER_REVIEW", "MEETING_SCHEDULED"]

const REQUEST_TYPE = { new: "NEW", more: "ADDITIONAL", renew: "RENEWAL" }

const INTENT_COPY = {
  new: {
    title: "Request partnership",
    description:
      "Request certification access and learner slots for your institution. The REBYU team will review your request.",
    submit: "Submit Partnership Request",
    slotsLabel: "Slots",
  },
  renew: {
    title: "Renew partnership",
    description:
      "The same certifications and slots, for a fresh access window. The REBYU team reviews the renewal and raises an invoice you can pay online.",
    submit: "Submit renewal",
    slotsLabel: "Slots",
  },
  more: {
    title: "Request more access",
    description:
      "Add learner slots to a certification you already have, or add one you do not. Remove any line you are not asking for.",
    submit: "Submit request",
    slotsLabel: "Add slots",
  },
}

function RequestPartnershipDialog({ open, onOpenChange, seed, intent = "new" }) {
  const queryClient = useQueryClient()
  const [error, setError] = useState("")
  const [showFullCatalog, setShowFullCatalog] = useState(false)
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID())

  const catalog = useRequestCatalog()
  const selection = useCertificationSelection(catalog.certifications, {
    seed,
    defaultSlots: intent === "more" ? "" : "10",
  })

  const pricingQuery = useQuery({
    queryKey: ["partnership-pricing"],
    queryFn: getPartnershipPricing,
    staleTime: 60 * 60 * 1000,
  })
  const pricePerSlot = Number(pricingQuery.data?.pricePerSlot ?? 149)
  const currency = pricingQuery.data?.currency ?? "PHP"

  const submitMutation = useMutation({
    mutationFn: () =>
      submitPartnershipRequestTransaction({
        idempotencyKey,
        requestType: REQUEST_TYPE[intent] ?? "NEW",
        items: selection.items.map((item) => ({
          certificationId: item.certificationId,
          slots: item.requestedSlots,
          requestedAccessStartDate: item.start,
          requestedAccessEndDate: item.end,
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partnership-request-transactions"] })
      toast.success("Partnership request submitted.")
      selection.reset()
      setIdempotencyKey(crypto.randomUUID())
      setError("")
      setShowFullCatalog(false)
      onOpenChange(false)
    },
    onError: (mutationError) => {
      setError(apiMessage(mutationError, "Unable to submit the partnership request. Please try again."))
    },
  })

  const handleSubmit = (event) => {
    event.preventDefault()
    const problem = selection.validate()
    if (problem) {
      setError(problem)
      return
    }
    setError("")
    submitMutation.mutate()
  }

  const copy = INTENT_COPY[intent] ?? INTENT_COPY.new

  if (intent === "renew" && !showFullCatalog) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl p-0 gap-0 border border-border bg-card shadow-2xl dark:border-border dark:bg-card">
          <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <RefreshCwIcon className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-lg font-bold text-foreground">
                  Confirm partnership renewal
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Renew access and slots for a fresh access window.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Renewing certifications</span>
                <span className="font-mono text-foreground font-semibold">
                  {selection.items.length} {selection.items.length === 1 ? "cert" : "certs"}
                </span>
              </div>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {selection.items.map((item) => {
                  const cert =
                    item.certification ??
                    catalog.certifications.find((c) => c.certificationId === item.certificationId)
                  const title = cert?.title ?? `Certification #${item.certificationId}`
                  const slots = Number.isFinite(item.requestedSlots) ? item.requestedSlots : 0

                  return (
                    <div
                      key={item.certificationId}
                      className="rounded-xl border border-border/70 bg-muted/20 p-3 space-y-2.5 text-xs dark:border-border/60 dark:bg-muted/15"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-foreground leading-snug">
                          {title}
                        </span>
                        <span className="font-mono font-bold text-foreground shrink-0">
                          {formatMoney(slots * pricePerSlot, currency)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground font-medium">Slots:</span>
                          <div className="flex items-center rounded-lg border border-input bg-background shadow-xs dark:border-border dark:bg-card">
                            <button
                              type="button"
                              aria-label="Remove slot"
                              onClick={() => selection.nudgeSlots(item.certificationId, -1)}
                              className="grid size-6 place-items-center rounded-l-md text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-colors"
                            >
                              &minus;
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={item.requestedSlots || ""}
                              onChange={(e) => selection.setSlots(item.certificationId, e.target.value)}
                              className="w-10 border-x border-input bg-transparent py-0.5 text-center text-xs font-bold text-foreground focus:outline-none dark:border-border"
                            />
                            <button
                              type="button"
                              aria-label="Add slot"
                              onClick={() => selection.nudgeSlots(item.certificationId, 1)}
                              className="grid size-6 place-items-center rounded-r-md text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span className="font-medium">Window:</span>
                          <span className="font-medium text-foreground">
                            {formatSchoolYearRange(item.startSY, item.endSY)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-2 text-xs dark:border-border/70 dark:bg-muted/20">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total learner slots</span>
                <span className="font-mono font-semibold text-foreground">{selection.totalSlots}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Price per slot</span>
                <span className="font-mono font-semibold text-foreground">{formatMoney(pricePerSlot, currency)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <span className="font-bold text-sm text-foreground">Total renewal cost</span>
                <span className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {formatMoney(selection.totalSlots * pricePerSlot, currency)}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed pt-0.5">
                The REBYU team reviews your renewal and raises an invoice. Access continues seamlessly once approved.
              </p>
            </div>

            {error ? (
              <p
                role="alert"
                className="rounded-xl border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs font-semibold text-destructive dark:bg-destructive/15 dark:text-red-400"
              >
                {error}
              </p>
            ) : null}

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowFullCatalog(true)}
                className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors underline-offset-2 hover:underline cursor-pointer"
              >
                Browse & add more certifications
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button type="submit" disabled={submitMutation.isPending} className="flex-1 w-full">
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Submitting renewal...
                  </>
                ) : (
                  "Confirm and submit renewal"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <CertificationPicker
            programs={catalog.programs}
            certifications={catalog.certifications}
            loading={catalog.loading}
            selection={selection}
            initialDepartment={seed && seed.length > 0 ? "all" : ""}
            slotsLabel={copy.slotsLabel}
          />

          <aside className="lg:sticky lg:top-0 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs dark:border-border dark:bg-card">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Request summary</p>
              <RequestSummary selection={selection} pricePerSlot={pricePerSlot} currency={currency} />

              {error ? (
                <p
                  role="alert"
                  className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive dark:bg-destructive/15 dark:text-red-400"
                >
                  {error}
                </p>
              ) : null}

              <div className="mt-5 flex flex-col gap-2">
                <Button type="submit" disabled={submitMutation.isPending} className="w-full">
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      Submitting...
                    </>
                  ) : (
                    copy.submit
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full">
                  Cancel
                </Button>
              </div>
            </div>
          </aside>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RequestItems({ request, certificationById }) {
  if (request.requestType === "CANCELLATION") {
    return (
      <div className="space-y-0.5">
        <p className="text-xs font-semibold text-destructive">End partnership</p>
        <p className="text-[11px] text-muted-foreground">
          {request.note ? `Reason: ${request.note}` : "No reason given"}
        </p>
      </div>
    )
  }
  const items = Array.isArray(request.items) ? request.items : []
  if (items.length === 0) {
    return <span className="text-xs text-muted-foreground">No line items</span>
  }
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item.partnershipRequestItemId} className="flex items-center justify-between gap-2 text-xs">
          <span className="font-medium text-foreground truncate">
            {item.certificationTitle ??
              certificationById.get(item.certificationId)?.title ??
              `Certification #${item.certificationId}`}
          </span>
          <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {item.slots} slot(s)
          </span>
        </li>
      ))}
    </ul>
  )
}

export default function InstitutionPartnershipPage() {
  const { institution, institutionLoading, institutionError, refetchInstitution } =
    useOutletContext()
  const data = useInstitutionData(institution?.institutionId)
  const [requestOpen, setRequestOpen] = useState(false)
  const [seed, setSeed] = useState(null)
  const [intent, setIntent] = useState("new")
  const queryClient = useQueryClient()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [dialogKey, setDialogKey] = useState(0)

  const requestsQuery = useQuery({
    queryKey: ["partnership-request-transactions"],
    queryFn: getPartnershipRequestTransactions,
    enabled: institution != null,
    retry: 1,
  })

  const invoicesQuery = useQuery({
    queryKey: ["institution-invoices"],
    queryFn: getMyInstitutionInvoices,
    enabled: institution != null,
    retry: 1,
  })

  const invoiceByRequestId = useMemo(() => {
    const map = new Map()
    const list = Array.isArray(invoicesQuery.data) ? invoicesQuery.data : []
    for (const invoice of list) {
      if (invoice.partnershipRequestId == null) continue
      const held = map.get(invoice.partnershipRequestId)
      if (!held || new Date(invoice.issuedAt) > new Date(held.issuedAt)) {
        map.set(invoice.partnershipRequestId, invoice)
      }
    }
    return map
  }, [invoicesQuery.data])

  const cancelPartnership = useMutation({
    mutationFn: () => requestPartnershipCancellation(cancelReason.trim() || null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partnership-request-transactions"] })
      setCancelOpen(false)
      setCancelReason("")
      toast.success("Cancellation requested", {
        description: "The REBYU team will review it. Your access continues until they do.",
      })
    },
    onError: (error) =>
      toast.error(apiMessage(error, "Could not submit the cancellation request.")),
  })

  const checkout = useMutation({
    mutationFn: (invoiceId) => startInvoiceCheckout(invoiceId),
    onSuccess: ({ checkoutUrl }) => window.location.assign(checkoutUrl),
    onError: (error) =>
      toast.error(apiMessage(error, "Could not open PayMongo checkout.")),
  })

  const requests = useMemo(() => {
    const list = Array.isArray(requestsQuery.data) ? requestsQuery.data : []
    return [...list].sort(
      (a, b) => new Date(b.submittedAt ?? 0) - new Date(a.submittedAt ?? 0)
    )
  }, [requestsQuery.data])

  const openReview = requests.find((request) =>
    OPEN_REQUEST_STATUSES.includes(String(request.status ?? "").toUpperCase())
  )

  const latestEnding = requests.find(
    (request) => request.requestType === "CANCELLATION" && request.status === "APPROVED"
  )
  const isCurrent = (request) =>
    !latestEnding || new Date(request.submittedAt ?? 0) > new Date(latestEnding.submittedAt ?? 0)

  const unpaidInvoice = (Array.isArray(invoicesQuery.data) ? invoicesQuery.data : []).find((invoice) =>
    ["issued", "payment_submitted"].includes(String(invoice.status ?? "").toLowerCase())
  )

  const endBlockedByInvoice =
    unpaidInvoice != null &&
    Date.now() - new Date(unpaidInvoice.issuedAt ?? 0).getTime() > 24 * 60 * 60 * 1000

  const openRequest = (seedItems, nextIntent = "new") => {
    if (openReview || (unpaidInvoice && nextIntent !== "new")) return
    setSeed(seedItems ?? null)
    setIntent(nextIntent)
    setDialogKey((key) => key + 1)
    setRequestOpen(true)
  }

  const renew = (request) => {
    openRequest(
      (request.items ?? []).map((item) => ({
        certificationId: String(item.certificationId),
        slots: item.slots ?? 1,
        startDate: TODAY(),
        endDate: monthsFromToday(
          monthsBetween(item.requestedAccessStartDate, item.requestedAccessEndDate)
        ),
      })),
      "renew"
    )
  }

  const holdings = useMemo(
    () =>
      data.institutionCerts.filter((cert) =>
        ["active", "pending"].includes(String(cert.status ?? "active").toLowerCase())
      ),
    [data.institutionCerts]
  )

  const requestMore = () => {
    if (holdings.length === 0) {
      openRequest(null, "new")
      return
    }
    openRequest(
      holdings.map((cert) => ({
        certificationId: String(cert.certificationId),
        slots: "",
        startDate: TODAY(),
        endDate: cert.accessExpiryDate || monthsFromToday(12),
      })),
      "more"
    )
  }

  if (institutionLoading) return <InstitutionLoadingSkeleton />
  if (institutionError) {
    return <InstitutionErrorState onRetry={refetchInstitution} />
  }
  if (!institution) {
    return (
      <InstitutionEmptyState
        title="No institution found"
        description="Partnership requests appear here once your institution is registered."
      />
    )
  }

  return (
    <div className="space-y-6">
      <InstitutionPageHeader
        title="Partnership"
        subtitle="Every request your institution has made: what it covers, what it costs, and when access ends."
        actions={
          holdings.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={requestMore} disabled={Boolean(openReview || unpaidInvoice)} className="w-full sm:w-auto">
                <PlusIcon aria-hidden="true" />
                Request more access
              </Button>
              <Button
                variant="ghost"
                className="w-full sm:w-auto text-muted-foreground hover:text-destructive"
                disabled={Boolean(openReview || endBlockedByInvoice)}
                title={
                  endBlockedByInvoice
                    ? "Your invoice was issued more than 24 hours ago. Pay it before ending the partnership."
                    : undefined
                }
                onClick={() => setCancelOpen(true)}
              >
                End partnership
              </Button>
            </div>
          ) : (
            <Button onClick={() => openRequest(null, "new")} disabled={Boolean(openReview)} className="w-full sm:w-auto">
              <HandshakeIcon aria-hidden="true" />
              Request Partnership
            </Button>
          )
        }
      />

      {openReview ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-amber-300/80 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 sm:p-4 sm:text-sm"
        >
          <HandshakeIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <p className="leading-relaxed">
            <span className="font-semibold text-foreground">
              {openReview.requestType === "CANCELLATION"
                ? `Your request to end the partnership (#${openReview.requestId}) is being reviewed.`
                : `Request #${openReview.requestId} is still being reviewed.`}
            </span>{" "}
            {openReview.requestType === "CANCELLATION"
              ? "Your access continues until the REBYU team approves it. You will get a notification when they do."
              : "You can request a partnership, more access, a renewal, or end the partnership once the REBYU team approves or rejects it. You will get a notification when they do."}
          </p>
        </div>
      ) : unpaidInvoice ? (
        <div
          role="status"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-300/80 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 sm:p-4 sm:text-sm"
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <CreditCard className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <p className="leading-relaxed">
              <span className="font-semibold text-foreground">Invoice {unpaidInvoice.invoiceNumber} is unpaid.</span> Pay it to
              activate your access. You can request more access or renew after that.{" "}
              {endBlockedByInvoice
                ? "Ending the partnership is only possible within 24 hours of the invoice being issued."
                : "You can still end the partnership within 24 hours of the invoice being issued."}
            </p>
          </div>
          <Button asChild size="sm" className="w-full sm:w-auto shrink-0">
            <Link to={`/institution/invoices/${unpaidInvoice.institutionInvoiceId}`}>Open invoice</Link>
          </Button>
        </div>
      ) : null}

      {requestsQuery.isLoading ? (
        <InstitutionLoadingSkeleton rows={3} />
      ) : requestsQuery.isError ? (
        <InstitutionErrorState onRetry={requestsQuery.refetch} />
      ) : requests.length === 0 ? (
        <InstitutionEmptyState
          icon={HandshakeIcon}
          title="No partnership requests yet"
          description="Submit a request to allocate certifications and learner slots for your institution."
          action={
            <Button size="sm" onClick={() => openRequest(null, "new")}>
              Request Partnership
            </Button>
          }
        />
      ) : (
        <div>
          <div className="md:hidden space-y-3">
            {requests.map((request) => {
              const invoice = invoiceByRequestId.get(request.requestId)
              const payable = invoice?.payable
              const paying =
                checkout.isPending &&
                checkout.variables === invoice?.institutionInvoiceId

              const totalSlots =
                request.requestType === "CANCELLATION"
                  ? null
                  : request.totalSlots ??
                    (request.items ?? []).reduce(
                      (sum, item) => sum + Number(item.slots ?? 0),
                      0
                    )

              return (
                <div
                  key={request.requestId}
                  className="rounded-xl border border-border/80 bg-card p-3.5 shadow-xs space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono text-sm font-bold text-foreground">
                        #{request.requestId}
                      </span>
                      {request.requestType && request.requestType !== "NEW" ? (
                        <span className="rounded-md border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {request.requestType === "ADDITIONAL" ? "Add slots" : request.requestType}
                        </span>
                      ) : null}
                    </div>
                    <InstitutionStatusBadge status={request.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-y border-border/50 py-2 text-muted-foreground">
                    <div>
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">Submitted</span>
                      <span className="font-medium text-foreground">{formatDate(request.submittedAt)}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">Access until</span>
                      <span className="font-medium text-foreground">{formatDate(accessEndsOn(request))}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <span>Certifications</span>
                      {totalSlots != null ? (
                        <span className="font-mono text-foreground font-semibold">
                          {totalSlots} {totalSlots === 1 ? "slot" : "slots"}
                        </span>
                      ) : null}
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
                      <RequestItems
                        request={request}
                        certificationById={data.certificationById}
                      />
                    </div>
                  </div>

                  {invoice ? (
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
                      <div className="min-w-0">
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Invoice</span>
                        <Link
                          to={`/institution/invoices/${invoice.institutionInvoiceId}`}
                          className="font-mono font-semibold text-primary underline-offset-2 hover:underline truncate block"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-foreground block">
                          {money(invoice.totalAmount, invoice.currency)}
                        </span>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-muted-foreground px-1">
                      <span>Invoice</span>
                      <span>Not billed yet</span>
                    </div>
                  )}

                  {(payable ||
                    (request.status === "APPROVED" &&
                      holdings.length > 0 &&
                      request.requestType !== "CANCELLATION" &&
                      isCurrent(request))) ? (
                    <div className="pt-1 flex flex-col gap-2">
                      {payable ? (
                        <Button
                          size="sm"
                          className="w-full"
                          disabled={checkout.isPending}
                          onClick={() =>
                            checkout.mutate(invoice.institutionInvoiceId)
                          }
                        >
                          {paying ? (
                            <Loader2
                              className="size-4 animate-spin"
                              aria-hidden="true"
                            />
                          ) : (
                            <CreditCard className="size-4" aria-hidden="true" />
                          )}
                          Pay now {money(invoice.totalAmount, invoice.currency)}
                        </Button>
                      ) : null}
                      {request.status === "APPROVED" &&
                      holdings.length > 0 &&
                      request.requestType !== "CANCELLATION" &&
                      isCurrent(request) ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          disabled={Boolean(
                            openReview ||
                              unpaidInvoice ||
                              (renewalOpensOn(request) && renewalOpensOn(request) > new Date())
                          )}
                          onClick={() => renew(request)}
                        >
                          <RefreshCwIcon className="size-4" aria-hidden="true" />
                          Renew
                        </Button>
                      ) : null}
                    </div>
                  ) : null}

                  {request.status === "APPROVED" &&
                  request.requestType !== "CANCELLATION" &&
                  holdings.length > 0 &&
                  isCurrent(request) &&
                  renewalOpensOn(request) &&
                  renewalOpensOn(request) > new Date() ? (
                    <p className="text-center text-[11px] text-muted-foreground">
                      Renewal opens {formatDate(renewalOpensOn(request).toISOString())}
                    </p>
                  ) : null}
                  {invoice && !payable && invoice.paymentUnavailableReason ? (
                    <p className="text-center text-[11px] text-muted-foreground">
                      {invoice.paymentUnavailableReason}
                    </p>
                  ) : null}
                </div>
              )
            })}
          </div>

          <Card className="hidden md:block">
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request</TableHead>
                    <TableHead>Certifications</TableHead>
                    <TableHead className="text-right">Slots</TableHead>
                    <TableHead>Access until</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => {
                    const invoice = invoiceByRequestId.get(request.requestId)
                    const payable = invoice?.payable
                    const paying =
                      checkout.isPending &&
                      checkout.variables === invoice?.institutionInvoiceId
                    return (
                      <TableRow key={request.requestId} className="align-top">
                        <TableCell>
                          <p className="font-semibold">#{request.requestId}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(request.submittedAt)}
                          </p>
                        </TableCell>
                        <TableCell className="min-w-[14rem]">
                          <RequestItems
                            request={request}
                            certificationById={data.certificationById}
                          />
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {request.requestType === "CANCELLATION"
                            ? "—"
                            : request.totalSlots ??
                              (request.items ?? []).reduce(
                                (sum, item) => sum + Number(item.slots ?? 0),
                                0
                              )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(accessEndsOn(request))}
                        </TableCell>
                        <TableCell>
                          <InstitutionStatusBadge status={request.status} />
                        </TableCell>
                        <TableCell>
                          {invoice ? (
                            <>
                              <Link
                                to={`/institution/invoices/${invoice.institutionInvoiceId}`}
                                className="font-mono text-sm font-semibold text-primary underline-offset-2 hover:underline"
                              >
                                {invoice.invoiceNumber}
                              </Link>
                              <p className="text-xs tabular-nums text-muted-foreground">
                                {money(invoice.totalAmount, invoice.currency)} ·{" "}
                                {invoice.status}
                              </p>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Not billed yet
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            {payable ? (
                              <Button
                                size="sm"
                                disabled={checkout.isPending}
                                onClick={() =>
                                  checkout.mutate(invoice.institutionInvoiceId)
                                }
                              >
                                {paying ? (
                                  <Loader2
                                    className="size-4 animate-spin"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <CreditCard className="size-4" aria-hidden="true" />
                                )}
                                Pay now
                              </Button>
                            ) : null}
                            {request.status === "APPROVED" &&
                            holdings.length > 0 &&
                            request.requestType !== "CANCELLATION" &&
                            isCurrent(request) ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={Boolean(
                                  openReview ||
                                    unpaidInvoice ||
                                    (renewalOpensOn(request) && renewalOpensOn(request) > new Date())
                                )}
                                title={
                                  openReview
                                    ? "Wait for your open request to be decided."
                                    : unpaidInvoice
                                      ? "Pay your open invoice first."
                                      : renewalOpensOn(request) && renewalOpensOn(request) > new Date()
                                        ? `Renewal opens ${formatDate(renewalOpensOn(request).toISOString())}, ${RENEWAL_WINDOW_DAYS} days before access ends.`
                                        : undefined
                                }
                                onClick={() => renew(request)}
                              >
                                <RefreshCwIcon className="size-4" aria-hidden="true" />
                                Renew
                              </Button>
                            ) : null}
                          </div>
                          {request.status === "APPROVED" &&
                          request.requestType !== "CANCELLATION" &&
                          holdings.length > 0 &&
                          isCurrent(request) &&
                          renewalOpensOn(request) &&
                          renewalOpensOn(request) > new Date() ? (
                            <p className="mt-1 text-right text-xs text-muted-foreground">
                              Renewal opens {formatDate(renewalOpensOn(request).toISOString())}
                            </p>
                          ) : null}
                          {invoice && !payable && invoice.paymentUnavailableReason ? (
                            <p className="mt-1 text-right text-xs text-muted-foreground">
                              {invoice.paymentUnavailableReason}
                            </p>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End your REBYU partnership?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  This asks the REBYU team to end the partnership. Nothing changes until
                  they approve it — your learners keep working in the meantime.
                </p>
                <p>On approval, and not before:</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    Every learner loses access to{" "}
                    <strong>
                      {holdings.length} certification{holdings.length === 1 ? "" : "s"}
                    </strong>{" "}
                    immediately.
                  </li>
                  <li>
                    All your departments are deleted, with everything in them: sections, learners,
                    announcements, department heads, invitations, and the exams, questions and lessons
                    your departments created (including learners' attempts on them).
                  </li>
                  <li>Your shared files are deleted.</li>
                  <li>
                    Anything you paid in the 24 hours before sending this request is refunded to the
                    original payment method, and we email you the details. Older payments are not refunded.
                  </li>
                  <li>Unpaid invoices are cancelled, so you owe nothing on them.</li>
                </ul>
                <p>Your invoices stay available for your accounting. This cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason">Reason (shared with the REBYU team)</Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="Optional — helps us understand what went wrong."
              rows={3}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelPartnership.isPending}>
              Keep my partnership
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                cancelPartnership.mutate()
              }}
              disabled={cancelPartnership.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {cancelPartnership.isPending ? "Submitting…" : "Request cancellation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RequestPartnershipDialog
        key={dialogKey}
        open={requestOpen}
        onOpenChange={setRequestOpen}
        data={data}
        seed={seed}
        intent={intent}
      />
    </div>
  )
}
