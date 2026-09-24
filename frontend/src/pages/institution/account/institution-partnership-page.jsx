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
import { Input } from "@/components/ui/input"
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
  startInvoiceCheckout,
  submitPartnershipRequestTransaction,
} from "@/services/institutionService.js"

/**
 * The institution's partnership: every request it has made, as one table --
 * what was asked for, what it costs, where it stands, and when access runs
 * out. The two things an institution does from here are renew a request whose
 * access window is ending, and pay the invoice that approval raises; renewing
 * reopens the request form with the same certifications and slots, and paying
 * hands off to PayMongo's hosted checkout.
 */

const DEFAULT_ITEM = { certificationId: "", slots: 10, months: 12 }

function toLocalDate(date) {
  return date.toISOString().slice(0, 10)
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

/** Whole months between two ISO dates, at least 1 -- what the form asks for. */
function monthsBetween(startDate, endDate) {
  if (!startDate || !endDate) return 12
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 12
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  return months > 0 ? months : 12
}

/** The latest access end date across a request's items. */
function accessEndsOn(request) {
  const ends = (request.items ?? [])
    .map((item) => item.requestedAccessEndDate)
    .filter(Boolean)
    .sort()
  return ends.length > 0 ? ends[ends.length - 1] : null
}

function RequestPartnershipDialog({ open, onOpenChange, data, seed }) {
  const queryClient = useQueryClient()
  const [items, setItems] = useState([{ ...DEFAULT_ITEM }])
  const [error, setError] = useState("")

  // One idempotency key per open dialog: a double-click cannot create two
  // requests, and the whole request+items submission is atomic on the server.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID())

  // The dialog is remounted per opening (`key` on the caller), so seeding from
  // props at first render is enough -- no effect that races the user's typing.
  const [seeded, setSeeded] = useState(false)
  if (!seeded) {
    setSeeded(true)
    if (seed && seed.length > 0) setItems(seed)
  }

  const submitMutation = useMutation({
    mutationFn: () => {
      const start = new Date()
      return submitPartnershipRequestTransaction({
        idempotencyKey,
        items: items.map((item) => {
          const end = new Date(start)
          end.setMonth(end.getMonth() + Number(item.months))
          return {
            certificationId: Number(item.certificationId),
            slots: Number(item.slots),
            requestedAccessStartDate: toLocalDate(start),
            requestedAccessEndDate: toLocalDate(end),
          }
        }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["partnership-request-transactions"],
      })
      toast.success("Partnership request submitted.")
      setItems([{ ...DEFAULT_ITEM }])
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
    setError("")
    submitMutation.mutate()
  }

  // Only published certifications can be requested -- the submit endpoint
  // rejects drafts, so don't offer them here either.
  const certifications = [...data.certificationById.values()].filter(
    (certification) => certification.status === "PUBLISHED"
  )
  const renewing = Boolean(seed && seed.length > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {renewing ? "Renew partnership" : "Request partnership"}
          </DialogTitle>
          <DialogDescription>
            {renewing
              ? "The same certifications and slots, for a fresh access window. The REBYU team reviews the renewal and raises an invoice you can pay online."
              : "Request certification access and learner slots for your institution. The REBYU team will review your request."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="max-h-[45vh] space-y-3 overflow-y-auto pr-1">
            {items.map((item, index) => (
              <div
                key={index}
                /* Four fixed tracks only once there is room for them. Inside a
                   dialog on a 375px phone this row has about 270px to spend;
                   Slots and Months take 168 of it and the remove button another
                   40, which left the certification select roughly 40px wide --
                   a control whose value is a certification title, rendered
                   narrower than the word "Select". Below `sm` the select takes
                   a row of its own and the two numbers sit beside each other. */
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_84px_84px_auto]"
              >
                <div className="col-span-3 space-y-1.5 sm:col-span-1">
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
                <div className="space-y-1.5">
                  <Label htmlFor={`pr-slots-${index}`}>Slots</Label>
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
                  <Label htmlFor={`pr-months-${index}`}>Months</Label>
                  <Input
                    id={`pr-months-${index}`}
                    type="number"
                    min={1}
                    value={item.months}
                    onChange={(event) =>
                      updateItem(index, { months: event.target.value })
                    }
                  />
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
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setItems((current) => [...current, { ...DEFAULT_ITEM }])}
          >
            <PlusIcon aria-hidden="true" />
            Add certification
          </Button>

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
              {submitMutation.isPending
                ? "Submitting..."
                : renewing
                  ? "Submit renewal"
                  : "Submit Partnership Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** The certifications and slots of one request, stacked inside its cell. */
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
  // Remounts the dialog per opening, so each renewal seeds cleanly and gets a
  // fresh idempotency key.
  const [dialogKey, setDialogKey] = useState(0)

  // Institution-scoped endpoint (institutionId derived server-side from the JWT) --
  // NOT the unfiltered generic CRUD list, which would leak every tenant's requests.
  const requestsQuery = useQuery({
    queryKey: ["partnership-request-transactions"],
    queryFn: getPartnershipRequestTransactions,
    enabled: institution != null,
    retry: 1,
  })

  // The invoice a request's approval raised, so the row can price it and offer
  // the payment. Its absence is normal (nothing approved yet), so a failure
  // here only costs the amount column, never the table.
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
      // Newest invoice wins: a renewal of the same request is what to pay.
      if (!held || new Date(invoice.issuedAt) > new Date(held.issuedAt)) {
        map.set(invoice.partnershipRequestId, invoice)
      }
    }
    return map
  }, [invoicesQuery.data])

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

  const openRequest = (seedItems) => {
    setSeed(seedItems ?? null)
    setDialogKey((key) => key + 1)
    setRequestOpen(true)
  }

  const renew = (request) => {
    openRequest(
      (request.items ?? []).map((item) => ({
        certificationId: String(item.certificationId),
        slots: item.slots ?? 1,
        months: monthsBetween(
          item.requestedAccessStartDate,
          item.requestedAccessEndDate
        ),
      }))
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
          <Button onClick={() => openRequest(null)}>
            <HandshakeIcon aria-hidden="true" />
            Request Partnership
          </Button>
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
            <Button size="sm" onClick={() => openRequest(null)}>
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => renew(request)}
                          >
                            <RefreshCwIcon className="size-4" aria-hidden="true" />
                            Renew
                          </Button>
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

      <RequestPartnershipDialog
        key={dialogKey}
        open={requestOpen}
        onOpenChange={setRequestOpen}
        data={data}
        seed={seed}
      />
    </div>
  )
}
