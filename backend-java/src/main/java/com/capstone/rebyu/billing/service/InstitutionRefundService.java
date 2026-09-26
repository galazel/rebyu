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

    public record RefundResult(BigDecimal refunded, BigDecimal failed, List<RefundLine> lines) {
        public boolean hasFailures() {
            return failed.signum() > 0;
        }
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
        BigDecimal failed = BigDecimal.ZERO;

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

            long cents = amount.movePointRight(2).setScale(0, RoundingMode.HALF_UP).longValueExact();
            String refundId = payMongoClient.refundPayment(invoice.getProviderPaymentId(), cents, reason);

            if (refundId != null) {
                refunded = refunded.add(amount);
                invoice.setRefundedAmount(nullToZero(invoice.getRefundedAmount()).add(amount));
                invoice.setRefundReference(refundId);
                invoice.setRefundedAt(LocalDateTime.now());
                /* Fully refunded reads as cancelled; a partial refund leaves it
                   paid, because it was -- and the refunded amount beside it
                   says how much came back. */
                if (invoice.getRefundedAmount().compareTo(invoice.getTotalAmount()) >= 0) {
                    invoice.setStatus(InstitutionInvoice.Status.cancelled);
                }
                invoices.save(invoice);
                lines.add(new RefundLine(invoice.getInvoiceNumber(), amount, refundId, null));
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

        log.info("Institution {} refund ({}): {} returned, {} failed across {} invoice(s)",
                institutionId, certificationId == null ? "whole partnership" : "certification " + certificationId,
                refunded, failed, lines.size());
        return new RefundResult(refunded, failed, lines);
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
