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

/** DTOs for Transaction One: the PUBLIC partnership request (no account). */
public final class PublicPartnershipDtos {

    private PublicPartnershipDtos() {
    }

    public record PublicPartnershipItemRequest(
            @NotNull Long certificationId,
            @NotNull @Min(1) Integer requestedSlots,
            /* The access window the organization wants for this certification. */
            @NotNull LocalDate requestedAccessStartDate,
            @NotNull LocalDate requestedAccessEndDate
    ) {
    }

    public record SubmitPublicPartnershipRequest(
            @NotBlank @Size(max = 150) String organizationName,
            @NotBlank @Email @Size(max = 254) String organizationEmail,
            @NotBlank @Size(max = 150) String contactPersonName,
            @NotBlank @Size(max = 40) String contactNumber,
            @NotBlank String organizationAddress,
            @NotBlank String businessDescription,
            @NotEmpty List<@Valid PublicPartnershipItemRequest> items
    ) {
    }

    /** Returned to the requester after a successful submission. */
    public record PublicPartnershipRequestResponse(
            String referenceNumber,
            String organizationName,
            LocalDateTime submittedAt,
            String status,
            Integer certificationCount,
            Integer totalRequestedSlots
    ) {
    }

    /** Public status lookup input: reference number + organization email. */
    public record PublicPartnershipStatusRequest(
            @NotBlank String referenceNumber,
            @NotBlank @Email String organizationEmail
    ) {
    }

    /** Limited public status view — no admin internals or slot allocations. */
    public record PublicPartnershipStatusResponse(
            String referenceNumber,
            String organizationName,
            LocalDateTime submittedAt,
            String status,
            String remarks
    ) {
    }
}
