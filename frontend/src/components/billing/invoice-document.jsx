import {
  formatDate,
  formatDateTime,
} from "@/components/institution/institution-ui.jsx"

/**
 * One invoice, as a document.
 *
 * The same markup on screen and on paper, because "Save as PDF" here is the
 * browser's own print — and a print of a *page* is what it used to produce:
 * two sheets carrying the portal's navigation, a toast, and three rounded
 * cards laid out for a 1337px viewport. A document does not have a navigation
 * bar, so this is not the screen with things hidden; it is an invoice that the
 * screen also happens to show.
 *
 * Kept free of anything interactive. The Pay button, the status of the
 * verification round trip and the retry affordances all live on the page
 * around it -- none of them mean anything once printed, and a document that
 * renders differently depending on what the server last said is not one you
 * can file.
 *
 * Takes any invoice in the shape InstitutionInvoiceService returns, so a
 * second kind of invoice later prints identically without a second template.
 */

function money(value, currency = "PHP") {
  if (value == null) return "—"
  return Number(value).toLocaleString("en-PH", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  })
}

/** A label above its value, the unit this document is built from. */
function Field({ label, children }) {
  if (children == null || children === "") return null
  return (
    <div className="min-w-0">
      <dt className="text-[9px] font-bold uppercase tracking-[0.12em] text-[color:var(--rb-invoice-muted)]">
        {label}
      </dt>
      <dd className="mt-0.5 break-words text-[13px] font-semibold text-[color:var(--rb-invoice-ink)]">
        {children}
      </dd>
    </div>
  )
}

export default function InvoiceDocument({ invoice }) {
  if (!invoice) return null

  const items = invoice.items ?? []
  const slots = items.reduce((sum, item) => sum + Number(item.learnerSlots ?? 0), 0)
  const paid = invoice.status === "paid"
  const discount = Number(invoice.discountAmount) > 0
  const tax = Number(invoice.taxAmount) > 0

  return (
    <article className="rb-invoice-doc" aria-label={`Invoice ${invoice.invoiceNumber}`}>
      {/* Letterhead */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-[color:var(--rb-invoice-rule)] pb-5">
        <div>
          <p className="font-rb-display text-2xl font-black tracking-[0.04em] text-[color:var(--rb-invoice-accent)]">
            REBYU
          </p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--rb-invoice-muted)]">
            Certification Preparation
          </p>
        </div>
        <div className="text-right">
          <p className="font-rb-display text-[13px] font-bold uppercase tracking-[0.22em] text-[color:var(--rb-invoice-muted)]">
            Invoice
          </p>
          <p className="font-mono text-base font-bold text-[color:var(--rb-invoice-ink)]">
            {invoice.invoiceNumber}
          </p>
          {/* The one piece of status worth carrying onto paper: whether this
              has been settled. Everything else about payment is transient. */}
          <p
            className={`mt-1.5 inline-block rounded border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] ${
              paid
                ? "border-[color:var(--rb-invoice-accent)] text-[color:var(--rb-invoice-accent)]"
                : "border-[color:var(--rb-invoice-due)] text-[color:var(--rb-invoice-due)]"
            }`}
          >
            {paid ? "Paid" : "Amount due"}
          </p>
        </div>
      </header>

      {/* Who and when */}
      <section className="grid gap-5 border-b border-[color:var(--rb-invoice-rule)] py-5 sm:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[color:var(--rb-invoice-muted)]">
            Billed to
          </p>
          <p className="mt-1 font-rb-display text-base font-bold text-[color:var(--rb-invoice-ink)]">
            {invoice.institutionName}
          </p>
          {invoice.billToName ? (
            <p className="text-[13px] text-[color:var(--rb-invoice-ink)]">{invoice.billToName}</p>
          ) : null}
          {invoice.billToEmail ? (
            <p className="text-[13px] text-[color:var(--rb-invoice-muted)]">{invoice.billToEmail}</p>
          ) : null}
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Field label="Issued">{formatDate(invoice.issuedAt)}</Field>
          <Field label="Due">{invoice.dueAt ? formatDate(invoice.dueAt) : null}</Field>
          <Field label="Request">{invoice.partnershipReference}</Field>
          <Field label="Payment ref">
            {paid ? invoice.paymentReference : null}
          </Field>
        </dl>
      </section>

      {/* What for */}
      <table className="w-full border-collapse text-[13px]">
        <caption className="pb-2 pt-4 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-[color:var(--rb-invoice-muted)]">
          {slots} learner slot{slots === 1 ? "" : "s"} across {items.length}{" "}
          certification{items.length === 1 ? "" : "s"}
        </caption>
        <thead>
          <tr className="border-b border-[color:var(--rb-invoice-rule)] text-[9px] font-bold uppercase tracking-[0.12em] text-[color:var(--rb-invoice-muted)]">
            <th className="py-2 pr-3 text-left font-bold">Certification</th>
            <th className="py-2 px-3 text-left font-bold">Access window</th>
            <th className="py-2 px-3 text-right font-bold">Slots</th>
            <th className="py-2 px-3 text-right font-bold">Per slot</th>
            <th className="py-2 pl-3 text-right font-bold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.institutionInvoiceItemId}
              className="border-b border-[color:var(--rb-invoice-rule)]"
            >
              <td className="py-2.5 pr-3 font-semibold text-[color:var(--rb-invoice-ink)]">
                {item.certificationTitle}
              </td>
              <td className="py-2.5 px-3 text-[color:var(--rb-invoice-muted)]">
                {item.accessStartDate && item.accessEndDate
                  ? `${formatDate(item.accessStartDate)} – ${formatDate(item.accessEndDate)}`
                  : "1 year from approval"}
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums text-[color:var(--rb-invoice-ink)]">
                {item.learnerSlots}
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums text-[color:var(--rb-invoice-muted)]">
                {money(item.unitPrice, invoice.currency)}
              </td>
              <td className="py-2.5 pl-3 text-right font-semibold tabular-nums text-[color:var(--rb-invoice-ink)]">
                {money(item.lineTotal, invoice.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* What it comes to */}
      <dl className="ml-auto mt-4 grid w-full max-w-[17rem] grid-cols-2 gap-y-1.5 text-[13px]">
        <dt className="text-[color:var(--rb-invoice-muted)]">Subtotal</dt>
        <dd className="text-right tabular-nums text-[color:var(--rb-invoice-ink)]">
          {money(invoice.subtotal, invoice.currency)}
        </dd>
        {discount ? (
          <>
            <dt className="text-[color:var(--rb-invoice-muted)]">Discount</dt>
            <dd className="text-right tabular-nums text-[color:var(--rb-invoice-ink)]">
              − {money(invoice.discountAmount, invoice.currency)}
            </dd>
          </>
        ) : null}
        {tax ? (
          <>
            <dt className="text-[color:var(--rb-invoice-muted)]">Tax ({invoice.taxRate}%)</dt>
            <dd className="text-right tabular-nums text-[color:var(--rb-invoice-ink)]">
              {money(invoice.taxAmount, invoice.currency)}
            </dd>
          </>
        ) : null}
        <dt className="mt-1 border-t-2 border-[color:var(--rb-invoice-rule)] pt-2 font-rb-display text-sm font-black uppercase tracking-wide text-[color:var(--rb-invoice-ink)]">
          Total
        </dt>
        <dd className="mt-1 border-t-2 border-[color:var(--rb-invoice-rule)] pt-2 text-right font-rb-display text-lg font-black tabular-nums text-[color:var(--rb-invoice-ink)]">
          {money(invoice.totalAmount, invoice.currency)}
        </dd>
      </dl>

      <footer className="mt-6 border-t border-[color:var(--rb-invoice-rule)] pt-3 text-[11px] leading-5 text-[color:var(--rb-invoice-muted)]">
        {paid ? (
          <p className="font-semibold text-[color:var(--rb-invoice-accent)]">
            Paid {formatDateTime(invoice.paidAt)}
            {invoice.paymentReference ? ` · ref ${invoice.paymentReference}` : ""}
          </p>
        ) : (
          <p>
            Payable online from the invoice page in your REBYU institution portal.
            Certification access activates once payment is confirmed.
          </p>
        )}
        <p className="mt-1">
          REBYU · Certification preparation for institutions. Questions about this
          invoice? Reply to the email it arrived with.
        </p>
      </footer>
    </article>
  )
}
