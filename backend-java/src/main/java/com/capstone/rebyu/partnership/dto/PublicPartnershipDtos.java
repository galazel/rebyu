package com.capstone.rebyu.partnership.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class PublicPartnershipDtos {

    private PublicPartnershipDtos() {
    }

    public record PublicPartnershipItemRequest(
            @NotNull Long certificationId,
            @NotNull @Min(1) Integer requestedSlots,
            LocalDate requestedAccessStartDate,
            LocalDate requestedAccessEndDate
    ) {
    }

    public record SubmitPublicPartnershipRequest(
            @NotBlank @Size(max = 150) String institutionName,
            @NotBlank @Email @Size(max = 254) String institutionEmail,
            @NotBlank @Size(max = 150) String contactPersonName,
            @NotBlank @Size(max = 40) String contactNumber,
            @NotBlank String institutionAddress,
            @NotBlank String businessDescription,
            @NotEmpty List<@Valid PublicPartnershipItemRequest> items
    ) {
    }

    public record PublicPartnershipRequestResponse(
            String referenceNumber,
            String institutionName,
            LocalDateTime submittedAt,
            String status,
            Integer certificationCount,
            Integer totalRequestedSlots
    ) {
    }

    public record PublicPartnershipStatusRequest(
            @NotBlank String referenceNumber,
            @NotBlank @Email String institutionEmail
    ) {
    }

    public record PublicPartnershipStatusResponse(
            String referenceNumber,
            String institutionName,
            LocalDateTime submittedAt,
            String status,
            String remarks
    ) {
    }
}
