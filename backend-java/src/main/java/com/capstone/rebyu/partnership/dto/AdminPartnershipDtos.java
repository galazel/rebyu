package com.capstone.rebyu.partnership.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

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
            BigDecimal lineTotal,
            Integer existingSlots
    ) {
    }

    public record PartnershipRequestSummaryDto(
            Long requestId,
            String referenceNumber,
            String requestType,
            String institutionName,
            String institutionEmail,
            String status,
            LocalDateTime submittedAt,
            Integer certificationCount,
            Integer totalRequestedSlots
    ) {
    }

    public record PartnershipRequestDetailDto(
            Long requestId,
            String referenceNumber,
            String requestType,
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
            Boolean institutionAccountEmailed,
            String institutionAccountNote,
            BigDecimal pricePerSlot,
            String currency,
            BigDecimal totalAmount,
            Long invoiceId,
            String invoiceNumber,
            String invoiceStatus
    ) {
    }

    public record ReviewPartnershipRequest(
            String remarks
    ) {
    }
}
