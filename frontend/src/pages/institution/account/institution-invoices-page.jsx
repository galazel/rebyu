import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"

import { ArrowLeftIcon, CreditCard, Download } from "@/components/icons"
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
import { getMyInstitutionInvoice, getMyInstitutionInvoices } from "@/services/institutionService.js"

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
  const query = useQuery({
    queryKey: ["institution-invoice", invoiceId],
    queryFn: () => getMyInstitutionInvoice(invoiceId),
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
      <Link
        to="/institution/invoices"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground print:hidden"
      >
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        All invoices
      </Link>

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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Billed to</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="font-semibold">{invoice.institutionName}</p>
            <p>{invoice.billToName}</p>
            <p className="text-muted-foreground">{invoice.billToEmail}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Amount due</CardTitle>
            <CardDescription>
              {slots} learner slot{slots === 1 ? "" : "s"} across {invoice.items?.length ?? 0} certification
              {(invoice.items?.length ?? 0) === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{money(invoice.totalAmount, invoice.currency)}</p>
            {invoice.paidAt ? (
              <p className="mt-1 text-xs text-muted-foreground">Paid {formatDateTime(invoice.paidAt)}</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Payment instructions are sent by the REBYU team. Quote the invoice number when you pay.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Line items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Certification</TableHead>
                <TableHead>Access window</TableHead>
                <TableHead className="text-right">Slots</TableHead>
                <TableHead className="text-right">Per slot</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(invoice.items ?? []).map((item) => (
                <TableRow key={item.institutionInvoiceItemId}>
                  <TableCell className="font-medium">{item.certificationTitle}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.accessStartDate && item.accessEndDate
                      ? `${formatDate(item.accessStartDate)} – ${formatDate(item.accessEndDate)}`
                      : "1 year from approval"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{item.learnerSlots}</TableCell>
                  <TableCell className="text-right tabular-nums">{money(item.unitPrice, invoice.currency)}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {money(item.lineTotal, invoice.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <dl className="ml-auto grid max-w-xs grid-cols-2 gap-y-1 px-4 py-4 text-sm">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="text-right tabular-nums">{money(invoice.subtotal, invoice.currency)}</dd>
            {Number(invoice.discountAmount) > 0 ? (
              <>
                <dt className="text-muted-foreground">Discount</dt>
                <dd className="text-right tabular-nums">− {money(invoice.discountAmount, invoice.currency)}</dd>
              </>
            ) : null}
            {Number(invoice.taxAmount) > 0 ? (
              <>
                <dt className="text-muted-foreground">Tax ({invoice.taxRate}%)</dt>
                <dd className="text-right tabular-nums">{money(invoice.taxAmount, invoice.currency)}</dd>
              </>
            ) : null}
            <dt className="border-t pt-2 font-bold">Total</dt>
            <dd className="border-t pt-2 text-right text-base font-bold tabular-nums">
              {money(invoice.totalAmount, invoice.currency)}
            </dd>
          </dl>
        </CardContent>
      </Card>
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
