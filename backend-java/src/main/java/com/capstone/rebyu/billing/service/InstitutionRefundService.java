package com.capstone.rebyu.billing.service;

import com.capstone.rebyu.billing.client.PayMongoClient;
import com.capstone.rebyu.billing.entity.InstitutionInvoice;
import com.capstone.rebyu.billing.entity.InstitutionInvoiceItem;
import com.capstone.rebyu.billing.repository.InstitutionInvoiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Giving money back when access is taken away.
 *
 * Two things end an institution's access early -- dropping one certification
 * from its allocation, and cancelling the partnership outright -- and both
 * refund what was paid for what is being removed. The refunding itself is the
 * same either way, so it lives here rather than being written twice with two
 * different ideas of what "the amount" means.
 *
 * <p>What gets refunded is read off the invoices, not recomputed from the
 * per-slot rate: an invoice is the record of what was actually charged, and
 * the rate can change between the charge and the refund. Only <b>paid</b>
 * invoices are refundable -- an unpaid one is cancelled instead, because there
 * is nothing to give back.
 *
 * <p>Refunds are <b>not</b> pro-rated for time already used. An institution
 * three months into a year keeps the whole amount back. That is a policy
 * choice, stated here so it is visible rather than discovered: pro-rating is a
 * one-line change to {@link #refundableAmount}, but it is a decision about
 * money and not one to make implicitly.
 *
 * <p>Partial failure is expected and survivable. PayMongo can refuse a refund
 * (already refunded, too old, test-mode limits) and that must not roll back
 * the teardown the caller is doing -- access has been revoked and the
 * institution has been told. Every attempt is recorded on the invoice, so a
 * refusal is visible afterwards instead of silent.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InstitutionRefundService {

    /**
     * How long after paying an invoice its money can still come back.
     *
     * The ordinary consumer-refund window, and the same one whether a single
     * certification is dropped or the whole partnership ends. Counted from the
     * payment, not from the request to drop: what matters is how long the
     * institution has had the money's worth, not how quickly it filled in a
     * dialog.
     *
     * <p>Past it, access is still removed -- dropping a certification is not
     * conditional on a refund -- but nothing is returned, and everything that
     * reports on the drop says so rather than quietly returning zero.
     */
    public static final int REFUND_WINDOW_HOURS = 24;

    private final InstitutionInvoiceRepository invoices;
    private final PayMongoClient payMongoClient;

    /** One invoice's outcome, so the caller can report what actually happened. */
    public record RefundLine(
            String invoiceNumber,
            BigDecimal amount,
            String refundId,
            String failureReason) {

        public boolean succeeded() {
            return refundId != null;
        }
    }

    /**
     * @param expired what was not returned because the window had closed --
     *                distinct from {@code failed}, which is money that should
     *                have come back and did not.
     */
    public record RefundResult(
            BigDecimal refunded, BigDecimal pending, BigDecimal failed, BigDecimal expired,
            List<RefundLine> lines) {
        public boolean hasFailures() {
            return failed.signum() > 0;
        }

        public boolean hasExpired() {
            return expired.signum() > 0;
        }

        /** Accepted by PayMongo but not settled yet -- true of card refunds. */
        public boolean hasPending() {
            return pending.signum() > 0;
        }
    }

    /**
     * What dropping this would return, without returning it. Lets the admin
     * screen say "₱447 will be refunded" or "outside the 24-hour window" before
     * anyone commits to a delete that cannot be undone.
     */
    @Transactional(readOnly = true)
    public BigDecimal quote(Long institutionId, Long certificationId) {
        BigDecimal total = BigDecimal.ZERO;
        for (InstitutionInvoice invoice : invoices.findByInstitution_InstitutionIdOrderByIssuedAtDesc(institutionId)) {
            if (invoice.getStatus() != InstitutionInvoice.Status.paid || !withinWindow(invoice)) continue;
            total = total.add(refundableAmount(invoice, certificationId));
        }
        return total;
    }

    /**
     * Re-reads any refund still in flight for this institution and records where
     * it got to.
     *
     * PayMongo does not tell us when a pending refund settles, so something has
     * to ask. Called whenever the institution's invoices are read: cheap when
     * there is nothing pending (no request at all), and it means a refund
     * resolves by someone simply looking at the page rather than needing a job
     * that runs whether or not anyone cares.
     */
    @Transactional
    public void refreshPendingRefunds(Long institutionId) {
        for (InstitutionInvoice invoice : invoices.findByInstitution_InstitutionIdOrderByIssuedAtDesc(institutionId)) {
            if (invoice.getRefundReference() == null) continue;
            /* Only a settled refund is finished. A null status is a refund made
               before we recorded one -- unknown, not done -- so it gets asked
               about too, which backfills it on the first read. */
            if ("succeeded".equalsIgnoreCase(invoice.getRefundStatus())) continue;

            var refund = payMongoClient.refundStatus(invoice.getRefundReference());
            if (refund == null || refund.status().equalsIgnoreCase(invoice.getRefundStatus())) continue;

            log.info("Refund {} on invoice {} moved from {} to {}",
                    refund.id(), invoice.getInvoiceNumber(), invoice.getRefundStatus(), refund.status());
            invoice.setRefundStatus(refund.status());
            /* A refund that failed never happened: the money is the
               institution's to be refunded again, so it stops counting against
               what has already come back. */
            if (!refund.succeeded() && !refund.pending()) {
                invoice.setRefundedAmount(BigDecimal.ZERO);
                invoice.setRefundedAt(null);
                if (invoice.getStatus() == InstitutionInvoice.Status.cancelled) {
                    invoice.setStatus(InstitutionInvoice.Status.paid);
                }
            }
            invoices.save(invoice);
        }
    }

    /** Paid, and paid recently enough. An invoice with no paid_at is not refundable. */
    private static boolean withinWindow(InstitutionInvoice invoice) {
        LocalDateTime paidAt = invoice.getPaidAt();
        return paidAt != null && paidAt.isAfter(LocalDateTime.now().minusHours(REFUND_WINDOW_HOURS));
    }

    /**
     * Refunds everything this institution paid for one certification.
     *
     * @param certificationId null refunds every line on every paid invoice --
     *                        what cancelling the whole partnership means.
     */
    @Transactional
    public RefundResult refund(Long institutionId, Long certificationId, String reason) {
        List<RefundLine> lines = new ArrayList<>();
        BigDecimal refunded = BigDecimal.ZERO;
        BigDecimal pending = BigDecimal.ZERO;
        BigDecimal failed = BigDecimal.ZERO;
        BigDecimal expired = BigDecimal.ZERO;

        for (InstitutionInvoice invoice : invoices.findByInstitution_InstitutionIdOrderByIssuedAtDesc(institutionId)) {
            if (invoice.getStatus() != InstitutionInvoice.Status.paid) {
                /* Nothing was taken, so nothing goes back -- but the bill must
                   not stay outstanding for access that no longer exists. */
                if (invoice.getStatus() == InstitutionInvoice.Status.issued && certificationId == null) {
                    invoice.setStatus(InstitutionInvoice.Status.cancelled);
                    invoices.save(invoice);
                }
                continue;
            }

            BigDecimal amount = refundableAmount(invoice, certificationId);
            if (amount.signum() <= 0) continue;

            if (!withinWindow(invoice)) {
                expired = expired.add(amount);
                lines.add(new RefundLine(invoice.getInvoiceNumber(), amount, null,
                        "outside the " + REFUND_WINDOW_HOURS + "-hour refund window"));
                log.info("Invoice {} is past the {}h refund window ({} not returned)",
                        invoice.getInvoiceNumber(), REFUND_WINDOW_HOURS, amount);
                continue;
            }

            long cents = amount.movePointRight(2).setScale(0, RoundingMode.HALF_UP).longValueExact();
            var refund = payMongoClient.refundPayment(invoice.getProviderPaymentId(), cents, reason);

            if (refund != null) {
                /* Counted against the invoice either way -- the money is
                   committed the moment PayMongo accepts it, and counting only
                   settled refunds would let a second drop refund it again while
                   the first was still in flight. Whether it has *landed* is the
                   status, not the amount. */
                if (refund.succeeded()) refunded = refunded.add(amount);
                else pending = pending.add(amount);

                invoice.setRefundedAmount(nullToZero(invoice.getRefundedAmount()).add(amount));
                invoice.setRefundReference(refund.id());
                invoice.setRefundStatus(refund.status());
                invoice.setRefundedAt(LocalDateTime.now());
                /* Fully refunded reads as cancelled; a partial refund leaves it
                   paid, because it was -- and the refunded amount beside it
                   says how much came back. */
                if (invoice.getRefundedAmount().compareTo(invoice.getTotalAmount()) >= 0) {
                    invoice.setStatus(InstitutionInvoice.Status.cancelled);
                }
                invoices.save(invoice);
                lines.add(new RefundLine(invoice.getInvoiceNumber(), amount, refund.id(),
                        refund.succeeded() ? null : "accepted, settling (" + refund.status() + ")"));
            } else {
                failed = failed.add(amount);
                String why = invoice.getProviderPaymentId() == null
                        ? "no payment reference on this invoice"
                        : "PayMongo refused the refund";
                lines.add(new RefundLine(invoice.getInvoiceNumber(), amount, null, why));
                log.warn("Refund of {} for invoice {} failed: {}",
                        amount, invoice.getInvoiceNumber(), why);
            }
        }

        log.info("Institution {} refund ({}): {} returned, {} settling, {} failed, {} past the window, across {} invoice(s)",
                institutionId, certificationId == null ? "whole partnership" : "certification " + certificationId,
                refunded, pending, failed, expired, lines.size());
        return new RefundResult(refunded, pending, failed, expired, lines);
    }

    /**
     * What is still refundable on this invoice, for this certification or all
     * of it. Never more than what has not already been returned, so calling
     * twice cannot refund the same money twice.
     */
    private BigDecimal refundableAmount(InstitutionInvoice invoice, Long certificationId) {
        BigDecimal gross = certificationId == null
                ? invoice.getTotalAmount()
                : invoice.getItems().stream()
                        .filter(item -> certificationId.equals(item.getCertificationId()))
                        .map(InstitutionInvoiceItem::getLineTotal)
                        .filter(java.util.Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal alreadyBack = nullToZero(invoice.getRefundedAmount());
        BigDecimal remaining = nullToZero(invoice.getTotalAmount()).subtract(alreadyBack);
        return gross.min(remaining).max(BigDecimal.ZERO);
    }

    private static BigDecimal nullToZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
