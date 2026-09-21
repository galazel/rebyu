package com.capstone.rebyu.billing.service;

import com.capstone.rebyu.billing.entity.InstitutionInvoice;
import com.capstone.rebyu.billing.entity.InstitutionInvoiceItem;
import com.capstone.rebyu.billing.repository.InstitutionInvoiceRepository;
import com.capstone.rebyu.institution.entity.Institution;
import com.capstone.rebyu.partnership.entity.PartnershipRequest;
import com.capstone.rebyu.partnership.entity.PartnershipRequestItem;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Institution invoices: raised when a partnership request is approved.
 *
 * Pricing is flat -- {@link #PRICE_PER_SLOT} pesos per learner slot per
 * certification -- and lives here so the public request form, the admin
 * review and the invoice itself all quote the same figure.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InstitutionInvoiceService {

    public static final BigDecimal PRICE_PER_SLOT = new BigDecimal("149.00");
    public static final String CURRENCY = "PHP";
    private static final int DUE_DAYS = 30;

    private final InstitutionInvoiceRepository invoices;

    public record InvoiceItemDto(
            Long institutionInvoiceItemId,
            Long certificationId,
            String certificationTitle,
            Integer learnerSlots,
            BigDecimal unitPrice,
            BigDecimal lineTotal,
            LocalDate accessStartDate,
            LocalDate accessEndDate) {}

    public record InvoiceDto(
            Long institutionInvoiceId,
            Long institutionId,
            String institutionName,
            String invoiceNumber,
            String invoiceType,
            Long partnershipRequestId,
            String partnershipReference,
            String billToName,
            String billToEmail,
            String currency,
            BigDecimal subtotal,
            BigDecimal discountAmount,
            BigDecimal taxRate,
            BigDecimal taxAmount,
            BigDecimal totalAmount,
            LocalDateTime issuedAt,
            LocalDateTime dueAt,
            LocalDateTime paidAt,
            String paymentReference,
            String status,
            List<InvoiceItemDto> items) {}

    /** What one request would cost, before or after approval. */
    public static BigDecimal quote(List<PartnershipRequestItem> items) {
        return items.stream()
                .map(item -> lineTotal(item.getSlots()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public static BigDecimal lineTotal(Integer slots) {
        return PRICE_PER_SLOT.multiply(BigDecimal.valueOf(slots == null ? 0 : slots));
    }

    /**
     * Issues the invoice for an approved request. Idempotent per request: a
     * second approval attempt (or a retry after a crash) returns the one
     * already issued rather than billing twice.
     */
    @Transactional
    public InstitutionInvoice issueForApprovedRequest(
            PartnershipRequest request, Institution institution, List<PartnershipRequestItem> items) {
        var existing = invoices.findFirstByPartnershipRequest_RequestIdOrderByIssuedAtDesc(request.getRequestId());
        if (existing.isPresent()) {
            return existing.get();
        }

        LocalDateTime now = LocalDateTime.now();
        InstitutionInvoice invoice = InstitutionInvoice.builder()
                .institution(institution)
                .invoiceNumber(nextInvoiceNumber(now))
                .invoiceType("initial_access")
                .partnershipRequest(request)
                .billToName(request.getContactPersonName() == null || request.getContactPersonName().isBlank()
                        ? request.getInstitutionName() : request.getContactPersonName())
                .billToEmail(request.getInstitutionEmail())
                .currency(CURRENCY)
                .issuedAt(now)
                .dueAt(now.plusDays(DUE_DAYS))
                .status(InstitutionInvoice.Status.issued)
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;
        for (PartnershipRequestItem item : items) {
            BigDecimal line = lineTotal(item.getSlots());
            subtotal = subtotal.add(line);
            invoice.getItems().add(InstitutionInvoiceItem.builder()
                    .invoice(invoice)
                    .certificationId(item.getCertification().getCertificationId())
                    .certificationTitle(item.getCertification().getTitle())
                    .learnerSlots(item.getSlots() == null ? 0 : item.getSlots())
                    .unitPrice(PRICE_PER_SLOT)
                    .lineTotal(line)
                    .accessStartDate(item.getRequestedAccessStartDate())
                    .accessEndDate(item.getRequestedAccessEndDate())
                    .build());
        }
        invoice.setSubtotal(subtotal);
        invoice.setTotalAmount(subtotal); // no discount or tax yet

        InstitutionInvoice saved = invoices.save(invoice);
        log.info("Invoice {} issued for request {} ({} {})", saved.getInvoiceNumber(),
                request.getReferenceNumber(), CURRENCY, saved.getTotalAmount());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<InvoiceDto> listForInstitution(Long institutionId) {
        return invoices.findByInstitution_InstitutionIdOrderByIssuedAtDesc(institutionId).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public InvoiceDto getForInstitution(Long institutionId, Long invoiceId) {
        return invoices.findByInstitutionInvoiceIdAndInstitution_InstitutionId(invoiceId, institutionId)
                .map(this::toDto)
                .orElseThrow(() -> new EntityNotFoundException("Invoice not found"));
    }

    @Transactional(readOnly = true)
    public InvoiceDto getAny(Long invoiceId) {
        return invoices.findById(invoiceId).map(this::toDto)
                .orElseThrow(() -> new EntityNotFoundException("Invoice not found"));
    }

    @Transactional(readOnly = true)
    public InvoiceDto findForRequest(Long requestId) {
        return invoices.findFirstByPartnershipRequest_RequestIdOrderByIssuedAtDesc(requestId).map(this::toDto).orElse(null);
    }

    public InvoiceDto toDto(InstitutionInvoice i) {
        return new InvoiceDto(
                i.getInstitutionInvoiceId(),
                i.getInstitution().getInstitutionId(),
                i.getInstitution().getInstitutionName(),
                i.getInvoiceNumber(),
                i.getInvoiceType(),
                i.getPartnershipRequest() != null ? i.getPartnershipRequest().getRequestId() : null,
                i.getPartnershipRequest() != null ? i.getPartnershipRequest().getReferenceNumber() : null,
                i.getBillToName(),
                i.getBillToEmail(),
                i.getCurrency(),
                i.getSubtotal(),
                i.getDiscountAmount(),
                i.getTaxRate(),
                i.getTaxAmount(),
                i.getTotalAmount(),
                i.getIssuedAt(),
                i.getDueAt(),
                i.getPaidAt(),
                i.getPaymentReference(),
                i.getStatus().name(),
                i.getItems().stream().map(item -> new InvoiceItemDto(
                        item.getInstitutionInvoiceItemId(),
                        item.getCertificationId(),
                        item.getCertificationTitle(),
                        item.getLearnerSlots(),
                        item.getUnitPrice(),
                        item.getLineTotal(),
                        item.getAccessStartDate(),
                        item.getAccessEndDate())).toList());
    }

    /** REBYU-INV-202609-000042: sortable, and says what it is. */
    private String nextInvoiceNumber(LocalDateTime now) {
        long seq = invoices.count() + 1;
        String candidate;
        do {
            candidate = "REBYU-INV-%s-%06d".formatted(now.format(DateTimeFormatter.ofPattern("yyyyMM")), seq++);
        } while (invoices.existsByInvoiceNumber(candidate) && seq < 1_000_000);
        return candidate;
    }
}
