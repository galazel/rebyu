package com.capstone.rebyu.partnership.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** DTOs for Transaction Two: admin review (approve / reject) of requests. */
public final class AdminPartnershipDtos {

    private AdminPartnershipDtos() {
    }

    public record PartnershipItemDetailDto(
            Long partnershipRequestItemId,
            Long certificationId,
            String certificationTitle,
            Integer requestedSlots,
            LocalDate requestedAccessStartDate,
            LocalDate requestedAccessEndDate,
            BigDecimal unitPrice,
            BigDecimal lineTotal
    ) {
    }

    /** Row shown in the admin list. */
    public record PartnershipRequestSummaryDto(
            Long requestId,
            String referenceNumber,
            String institutionName,
            String institutionEmail,
            String status,
            LocalDateTime submittedAt,
            Integer certificationCount,
            Integer totalRequestedSlots
    ) {
    }

    /** Full detail shown in the admin review dialog. */
    public record PartnershipRequestDetailDto(
            Long requestId,
            String referenceNumber,
            String institutionName,
            String institutionEmail,
            String contactPersonName,
            String contactNumber,
            String institutionAddress,
            String businessDescription,
            String status,
            LocalDateTime submittedAt,
            LocalDateTime reviewedAt,
            String reviewedBy,
            String adminRemarks,
            Long institutionId,
            List<PartnershipItemDetailDto> items,
            // Populated on the approve response so the admin sees whether the
            // institution's login credentials were emailed. Null on list/detail.
            Boolean institutionAccountEmailed,
            String institutionAccountNote,
            // Pricing: flat per-slot rate and the request's total, so the admin
            // sees what approving will bill before approving it.
            BigDecimal pricePerSlot,
            String currency,
            BigDecimal totalAmount,
            // The invoice, once approved.
            Long invoiceId,
            String invoiceNumber,
            String invoiceStatus
    ) {
    }

    /** Optional remarks supplied by the admin on approve or reject. */
    public record ReviewPartnershipRequest(
            String remarks
    ) {
    }
}
