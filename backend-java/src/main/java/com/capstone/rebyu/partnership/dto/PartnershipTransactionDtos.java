package com.capstone.rebyu.partnership.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class PartnershipTransactionDtos {

    private PartnershipTransactionDtos() {
    }

    public record PartnershipItemRequestDto(
            @NotNull Long certificationId,
            @NotNull @Min(1) Integer slots,
            @NotNull LocalDate requestedAccessStartDate,
            @NotNull LocalDate requestedAccessEndDate
    ) {
    }

    public record SubmitPartnershipRequestDto(
            Long institutionId,
            @NotEmpty List<PartnershipItemRequestDto> items,
            String idempotencyKey,
            String requestType
    ) {
    }

    public record PartnershipItemDto(
            Long partnershipRequestItemId,
            Long certificationId,
            String certificationTitle,
            Integer slots,
            LocalDate requestedAccessStartDate,
            LocalDate requestedAccessEndDate
    ) {
    }

    public record PartnershipRequestTransactionDto(
            Long requestId,
            Long institutionId,
            String institutionName,
            String status,
            LocalDateTime submittedAt,
            Integer totalSlots,
            List<PartnershipItemDto> items
    ) {
    }
}
