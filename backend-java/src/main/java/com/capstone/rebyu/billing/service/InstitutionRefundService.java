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

@Slf4j
@Service
@RequiredArgsConstructor
public class InstitutionRefundService {

    public static final int REFUND_WINDOW_HOURS = 24;

    private final InstitutionInvoiceRepository invoices;
    private final PayMongoClient payMongoClient;

    public record RefundLine(
            String invoiceNumber,
            BigDecimal amount,
            String refundId,
            String failureReason) {

        public boolean succeeded() {
            return refundId != null;
        }
    }

    public record RefundResult(
            BigDecimal refunded, BigDecimal pending, BigDecimal failed, BigDecimal expired,
            List<RefundLine> lines) {
        public boolean hasFailures() {
            return failed.signum() > 0;
        }

        public boolean hasExpired() {
            return expired.signum() > 0;
        }

        public boolean hasPending() {
            return pending.signum() > 0;
        }
    }

    @Transactional(readOnly = true)
    public BigDecimal quote(Long institutionId, Long certificationId) {
        BigDecimal total = BigDecimal.ZERO;
        for (InstitutionInvoice invoice : invoices.findByInstitution_InstitutionIdOrderByIssuedAtDesc(institutionId)) {
            if (invoice.getStatus() != InstitutionInvoice.Status.paid || !withinWindow(invoice)) continue;
            total = total.add(refundableAmount(invoice, certificationId));
        }
        return total;
    }

    @Transactional
    public void refreshPendingRefunds(Long institutionId) {
        for (InstitutionInvoice invoice : invoices.findByInstitution_InstitutionIdOrderByIssuedAtDesc(institutionId)) {
            if (invoice.getRefundReference() == null) continue;
            if ("succeeded".equalsIgnoreCase(invoice.getRefundStatus())) continue;

            var refund = payMongoClient.refundStatus(invoice.getRefundReference());
            if (refund == null || refund.status().equalsIgnoreCase(invoice.getRefundStatus())) continue;

            log.info("Refund {} on invoice {} moved from {} to {}",
                    refund.id(), invoice.getInvoiceNumber(), invoice.getRefundStatus(), refund.status());
            invoice.setRefundStatus(refund.status());
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

    private static boolean withinWindow(InstitutionInvoice invoice) {
        LocalDateTime paidAt = invoice.getPaidAt();
        return paidAt != null && paidAt.isAfter(LocalDateTime.now().minusHours(REFUND_WINDOW_HOURS));
    }

    @Transactional
    public RefundResult refund(Long institutionId, Long certificationId, String reason) {
        List<RefundLine> lines = new ArrayList<>();
        BigDecimal refunded = BigDecimal.ZERO;
        BigDecimal pending = BigDecimal.ZERO;
        BigDecimal failed = BigDecimal.ZERO;
        BigDecimal expired = BigDecimal.ZERO;

        for (InstitutionInvoice invoice : invoices.findByInstitution_InstitutionIdOrderByIssuedAtDesc(institutionId)) {
            if (invoice.getStatus() != InstitutionInvoice.Status.paid) {
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
                if (refund.succeeded()) refunded = refunded.add(amount);
                else pending = pending.add(amount);

                invoice.setRefundedAmount(nullToZero(invoice.getRefundedAmount()).add(amount));
                invoice.setRefundReference(refund.id());
                invoice.setRefundStatus(refund.status());
                invoice.setRefundedAt(LocalDateTime.now());
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
