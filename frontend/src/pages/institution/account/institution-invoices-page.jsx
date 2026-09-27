import { useEffect, useRef, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { CreditCard, Download, Loader2 } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  InstitutionEmptyState,
  InstitutionErrorState,
  InstitutionLoadingSkeleton,
  InstitutionPageHeader,
  InstitutionStatusBadge,
  formatDate,
  formatDateTime,
} from "@/components/institution/institution-ui.jsx"
import InvoiceDocument from "@/components/billing/invoice-document.jsx"
import {
  getMyInstitutionInvoice,
  getMyInstitutionInvoices,
  startInvoiceCheckout,
  verifyInvoicePayment,
} from "@/services/institutionService.js"

/**
 * The institution's invoices: the list at /institution/invoices and one
 * invoice at /institution/invoices/:invoiceId (the link the welcome email
 * carries). Amounts are what the partnership request quoted -- a flat rate
 * per learner slot per certification.
 */

function money(value, currency = "PHP") {
  if (value == null) return "—"
  return Number(value).toLocaleString("en-PH", { style: "currency", currency, maximumFractionDigits: 2 })
}

function apiMessage(error, fallback) {
  return error?.response?.data?.message ?? error?.message ?? fallback
}

function InvoiceDetail({ invoiceId }) {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [verifying, setVerifying] = useState(searchParams.get("payment") === "success")
  const query = useQuery({
    queryKey: ["institution-invoice", invoiceId],
    queryFn: () => getMyInstitutionInvoice(invoiceId),
  })

  /* Back from PayMongo. The redirect carries no proof of payment, so the
     server is asked to check the session; the URL flag is cleared either way
     so a refresh does not re-run it. */
  useEffect(() => {
    const outcome = searchParams.get("payment")
    if (!outcome) return
    if (outcome === "success") {
      verifyInvoicePayment(invoiceId)
        .then((invoice) => {
          queryClient.setQueryData(["institution-invoice", invoiceId], invoice)
          queryClient.invalidateQueries({ queryKey: ["institution-invoices"] })
          if (invoice.status === "paid") toast.success("Payment received. Thank you!")
          else toast.info("Payment not confirmed yet. If you completed it, refresh in a moment.")
        })
        .catch(() => toast.error("Could not confirm the payment. Please refresh."))
        .finally(() => setVerifying(false))
    } else if (outcome === "cancelled") {
      toast.info("Payment cancelled. You can pay whenever you are ready.")
    }
    const next = new URLSearchParams(searchParams)
    next.delete("payment")
    setSearchParams(next, { replace: true })
  }, [])

  /* And again whenever an unpaid invoice is opened at all, not only on the
     redirect back.
     
     The `?payment=success` flag is the only proof we get that someone paid,
     and it survives exactly one page load -- the effect above strips it. Lose
     that load (the tab is closed at PayMongo, the redirect is interrupted, the
     link is opened again from the email later, or verification answers "not
     yet" because the provider has not settled) and nothing ever asks again.
     The invoice then sits unpaid forever while the money is gone, which is
     what happened to REBYU-INV-202609-000001. Asking on open costs one request
     on an unpaid invoice and is idempotent server-side: without a checkout
     session it is a no-op, and an already-paid invoice is left alone. */
  const invoiceStatus = query.data?.status
  const verifiedOnOpen = useRef(false)
  useEffect(() => {
    if (verifiedOnOpen.current) return
    if (!invoiceStatus || invoiceStatus === "paid") return
    if (searchParams.get("payment")) return // the effect above owns this load
    verifiedOnOpen.current = true
    verifyInvoicePayment(invoiceId)
      .then((invoice) => {
        if (invoice.status !== "paid") return
        queryClient.setQueryData(["institution-invoice", invoiceId], invoice)
        queryClient.invalidateQueries({ queryKey: ["institution-invoices"] })
        toast.success("Payment received. Thank you!")
      })
      // Silent: nobody asked for this check, so a failure is not theirs to act
      // on. The Pay button is still there if it really is unpaid.
      .catch(() => {})
  }, [invoiceStatus])

  const checkout = useMutation({
    mutationFn: () => startInvoiceCheckout(invoiceId),
    onSuccess: ({ checkoutUrl }) => {
      window.location.assign(checkoutUrl)
    },
    onError: (error) => toast.error(apiMessage(error, "Could not open PayMongo checkout.")),
  })

  if (query.isLoading) return <InstitutionLoadingSkeleton />
  if (query.isError) {
    return (
      <InstitutionErrorState
        title="Invoice could not be loaded"
        description={apiMessage(query.error, "It may belong to another institution, or the link is out of date.")}
        onRetry={() => query.refetch()}
      />
    )
  }
  const invoice = query.data
  const slots = (invoice.items ?? []).reduce((sum, item) => sum + Number(item.learnerSlots ?? 0), 0)

  return (
    <div className="space-y-6 print:space-y-4">

      <InstitutionPageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        subtitle={`Issued ${formatDateTime(invoice.issuedAt)}${invoice.dueAt ? ` · due ${formatDate(invoice.dueAt)}` : ""}${
          invoice.partnershipReference ? ` · partnership request ${invoice.partnershipReference}` : ""
        }`}
        actions={
          <div className="flex items-center gap-2">
            <InstitutionStatusBadge status={invoice.status} />
            <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
              <Download className="size-4" aria-hidden="true" />
              Save as PDF
            </Button>
          </div>
        }
      />

      {/* The invoice itself, one template shared by every invoice REBYU
          issues, and the only thing that reaches paper -- see
          styles/rebyu-print.css. */}
      <InvoiceDocument invoice={invoice} />

      {/* Paying is an action on the page, not part of the document: it means
          nothing once printed, and it disappears the moment the invoice is
          settled. */}
      {invoice.status !== "paid" ? (
        <div className="print:hidden mx-auto w-full max-w-[52rem] space-y-2">
          <Button
            onClick={() => checkout.mutate()}
            disabled={!invoice.payable || checkout.isPending || verifying}
            className="w-full sm:w-auto"
          >
            {checkout.isPending || verifying ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <CreditCard className="size-4" aria-hidden="true" />
            )}
            {verifying
              ? "Confirming payment…"
              : `Pay ${money(invoice.totalAmount, invoice.currency)} with PayMongo`}
          </Button>
          <p className="text-xs text-muted-foreground">
            {invoice.payable
              ? "Card or GCash, on PayMongo's secure checkout (test mode). Certification access activates the moment payment is confirmed."
              : invoice.paymentUnavailableReason ?? "Online payment is not available for this invoice."}
          </p>
        </div>
      ) : null}
    </div>
  )
}

function InvoiceList() {
  const query = useQuery({ queryKey: ["institution-invoices"], queryFn: getMyInstitutionInvoices })

  if (query.isLoading) return <InstitutionLoadingSkeleton />
  if (query.isError) {
    return (
      <InstitutionErrorState
        title="Invoices could not be loaded"
        description={apiMessage(query.error, "Check that the API is running.")}
        onRetry={() => query.refetch()}
      />
    )
  }
  const invoices = Array.isArray(query.data) ? query.data : []

  return (
    <div className="space-y-6">
      <InstitutionPageHeader title="Invoices" subtitle="What your institution has been billed for certification access." />
      {invoices.length === 0 ? (
        <InstitutionEmptyState
          icon={CreditCard}
          title="No invoices yet"
          description="An invoice is issued when a partnership request is approved."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.institutionInvoiceId}>
                    <TableCell>
                      <Link
                        to={`/institution/invoices/${invoice.institutionInvoiceId}`}
                        className="font-mono text-sm font-semibold text-primary underline-offset-2 hover:underline"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                      {invoice.partnershipReference ? (
                        <p className="text-xs text-muted-foreground">Request {invoice.partnershipReference}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(invoice.issuedAt)}</TableCell>
                    <TableCell className="text-sm">{formatDate(invoice.dueAt)}</TableCell>
                    <TableCell>
                      <InstitutionStatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {money(invoice.totalAmount, invoice.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function InstitutionInvoicesPage() {
  const { invoiceId } = useParams()
  return invoiceId ? <InvoiceDetail invoiceId={invoiceId} /> : <InvoiceList />
}
