package com.capstone.rebyu.partnership.controller;

import com.capstone.rebyu.partnership.dto.PublicPartnershipDtos.PublicPartnershipRequestResponse;
import com.capstone.rebyu.partnership.dto.PublicPartnershipDtos.PublicPartnershipStatusRequest;
import com.capstone.rebyu.partnership.dto.PublicPartnershipDtos.PublicPartnershipStatusResponse;
import com.capstone.rebyu.partnership.dto.PublicPartnershipDtos.SubmitPublicPartnershipRequest;
import com.capstone.rebyu.partnership.service.PublicPartnershipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Transaction One (public, no authentication): submit a partnership request
 * and check its status. No institution account is created or granted here.
 */
@RestController
@RequestMapping("/api/public/partnership-requests")
@RequiredArgsConstructor
public class PublicPartnershipController {

    private final PublicPartnershipService publicPartnershipService;

    /** The per-slot rate the request form quotes, so the form and the invoice never disagree. */
    @GetMapping("/pricing")
    public java.util.Map<String, Object> pricing() {
        return java.util.Map.of(
                "pricePerSlot", com.capstone.rebyu.billing.service.InstitutionInvoiceService.PRICE_PER_SLOT,
                "currency", com.capstone.rebyu.billing.service.InstitutionInvoiceService.CURRENCY);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PublicPartnershipRequestResponse submit(
            @Valid @RequestBody SubmitPublicPartnershipRequest request) {
        return publicPartnershipService.submit(request);
    }

    @PostMapping("/status")
    public PublicPartnershipStatusResponse status(
            @Valid @RequestBody PublicPartnershipStatusRequest request) {
        return publicPartnershipService.lookupStatus(
                request.referenceNumber(), request.institutionEmail());
    }
}
