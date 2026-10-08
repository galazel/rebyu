import { useMemo, useState } from "react"
import { Link, useOutletContext } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  CreditCard,
  HandshakeIcon,
  Loader2,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
} from "@/components/icons"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

function defaultItem() {
  return {
    certificationId: "",
    slots: 10,
    startDate: TODAY(),
    endDate: monthsFromToday(12),
  }
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

function accessEndsOn(request) {
  const ends = (request.items ?? [])
    .map((item) => item.requestedAccessEndDate)
    .filter(Boolean)
    .sort()
  return ends.length > 0 ? ends[ends.length - 1] : null
}

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

function RequestPartnershipDialog({ open, onOpenChange, data, seed, intent = "new" }) {
  const queryClient = useQueryClient()
  const [items, setItems] = useState(() => [defaultItem()])
  const [error, setError] = useState("")

  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID())

  const [seeded, setSeeded] = useState(false)
  if (!seeded) {
    setSeeded(true)
    if (seed && seed.length > 0) setItems(seed)
  }

  const submitMutation = useMutation({
    mutationFn: () =>
      submitPartnershipRequestTransaction({
        idempotencyKey,
        requestType: REQUEST_TYPE[intent] ?? "NEW",
        items: items.map((item) => ({
          certificationId: Number(item.certificationId),
          slots: Number(item.slots),
          requestedAccessStartDate: item.startDate,
          requestedAccessEndDate: item.endDate,
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["partnership-request-transactions"],
      })
      toast.success("Partnership request submitted.")
      setItems([defaultItem()])
      setIdempotencyKey(crypto.randomUUID())
      setError("")
      onOpenChange(false)
    },
    onError: (mutationError) => {
      toast.error(
        apiMessage(
          mutationError,
          "Unable to submit the partnership request. Please try again."
        )
      )
    },
  })

  const updateItem = (index, patch) => {
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item))
    )
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (items.some((item) => !item.certificationId)) {
      setError("Select a certification for every line item.")
      return
    }
    if (items.some((item) => Number(item.slots) < 1)) {
      setError("Each line item needs at least 1 learner slot.")
      return
    }
    if (items.some((item) => !item.startDate || !item.endDate)) {
      setError("Give every line item a start and end date.")
      return
    }
    if (items.some((item) => item.endDate < item.startDate)) {
      setError("An access end date cannot be before its start date.")
      return
    }
    setError("")
    submitMutation.mutate()
  }

  const certifications = [...data.certificationById.values()].filter(
    (certification) => certification.status === "PUBLISHED"
  )

  const pricingQuery = useQuery({
    queryKey: ["partnership-pricing"],
    queryFn: getPartnershipPricing,
    staleTime: 60 * 60 * 1000,
  })
  const pricePerSlot = Number(pricingQuery.data?.pricePerSlot ?? 149)
  const currency = pricingQuery.data?.currency ?? "PHP"
  const requestedSlots = items.reduce((sum, item) => sum + (Number(item.slots) || 0), 0)

  const copy = INTENT_COPY[intent] ?? INTENT_COPY.new

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="max-h-[45vh] space-y-3 overflow-y-auto pr-1">
            {items.map((item, index) => (
              <div key={index} className="space-y-3 rounded-lg border p-3">
                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Label htmlFor={`pr-cert-${index}`}>Certification</Label>
                    <Select
                      value={item.certificationId}
                      onValueChange={(value) =>
                        updateItem(index, { certificationId: value })
                      }
                    >
                      <SelectTrigger id={`pr-cert-${index}`} className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {certifications.map((certification) => (
                          <SelectItem
                            key={certification.certificationId}
                            value={String(certification.certificationId)}
                          >
                            {certification.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove line item"
                    disabled={items.length === 1}
                    onClick={() =>
                      setItems((current) => current.filter((_, i) => i !== index))
                    }
                  >
                    <Trash2Icon />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-[88px_1fr_1fr]">
                  <div className="space-y-1.5">
                    <Label htmlFor={`pr-slots-${index}`}>{copy.slotsLabel}</Label>
                    <Input
                      id={`pr-slots-${index}`}
                      type="number"
                      min={1}
                      value={item.slots}
                      onChange={(event) =>
                        updateItem(index, { slots: event.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`pr-start-${index}`}>Access from</Label>
                    <Input
                      id={`pr-start-${index}`}
                      type="date"
                      value={item.startDate ?? ""}
                      onChange={(event) =>
                        updateItem(index, { startDate: event.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`pr-end-${index}`}>Access until</Label>
                    <Input
                      id={`pr-end-${index}`}
                      type="date"
                      min={item.startDate || undefined}
                      value={item.endDate ?? ""}
                      onChange={(event) =>
                        updateItem(index, { endDate: event.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setItems((current) => [...current, defaultItem()])}
          >
            <PlusIcon aria-hidden="true" />
            Add certification
          </Button>

          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-semibold">
                {intent === "more" ? "Additional cost" : "Estimated cost"}
              </span>
              <span className="font-rb-display text-lg font-bold tabular-nums">
                {requestedSlots > 0 ? money(requestedSlots * pricePerSlot, currency) : "\u2014"}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {requestedSlots > 0
                ? `${requestedSlots} slot(s) \u00d7 ${money(pricePerSlot, currency)} per slot. `
                : ""}
              The REBYU team is notified as soon as you submit. On approval you will get an
              invoice by email
              {intent === "more"
                ? ", and the extra slots are added to your allocation once it is paid."
                : " that you can pay online."}
            </p>
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? "Submitting..." : copy.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RequestItems({ request, certificationById }) {
  const items = Array.isArray(request.items) ? request.items : []
  if (items.length === 0) {
    return <span className="text-sm text-muted-foreground">No line items</span>
  }
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.partnershipRequestItemId} className="text-sm">
          <span className="font-medium">
            {item.certificationTitle ??
              certificationById.get(item.certificationId)?.title ??
              `Certification #${item.certificationId}`}
          </span>
          <span className="text-muted-foreground"> · {item.slots} slot(s)</span>
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

  const openRequest = (seedItems, nextIntent = "new") => {
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
            <div className="flex items-center gap-2">
              <Button onClick={requestMore}>
                <PlusIcon aria-hidden="true" />
                Request more access
              </Button>
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => setCancelOpen(true)}
              >
                End partnership
              </Button>
            </div>
          ) : (
            <Button onClick={() => openRequest(null, "new")}>
              <HandshakeIcon aria-hidden="true" />
              Request Partnership
            </Button>
          )
        }
      />

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
        <Card>
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
                        {request.totalSlots ??
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
                          {request.status === "APPROVED" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => renew(request)}
                            >
                              <RefreshCwIcon className="size-4" aria-hidden="true" />
                              Renew
                            </Button>
                          ) : null}
                        </div>
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
                  <li>Your departments, enrolments and pending invitations are deleted.</li>
                  <li>What you have paid is refunded to the original payment method.</li>
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
