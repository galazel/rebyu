package com.capstone.rebyu.partnership.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.partnership.dto.PartnershipTransactionDtos.PartnershipRequestTransactionDto;
import com.capstone.rebyu.partnership.dto.PartnershipTransactionDtos.SubmitPartnershipRequestDto;
import com.capstone.rebyu.partnership.service.PartnershipRequestTransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Transaction Three: partnership request submission and lookup. */
@RestController
@RequestMapping("/api/institution/partnership-requests")
@RequiredArgsConstructor
public class PartnershipTransactionController {

    private final PartnershipRequestTransactionService transactionService;
    private final CognitoAuthService auth;

    @PostMapping
    public PartnershipRequestTransactionDto submit(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody SubmitPartnershipRequestDto request) {
        Long institutionId = myInstitutionId(jwt);
        SubmitPartnershipRequestDto trusted = new SubmitPartnershipRequestDto(
                institutionId, request.items(), request.idempotencyKey(), request.requestType());
        return transactionService.submit(trusted);
    }

    /**
     * Asks to end the partnership. An admin reviews it; approving revokes
     * access and refunds what was paid.
     */
    @PostMapping("/cancellation")
    public PartnershipRequestTransactionDto cancel(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody(required = false) CancellationRequest body) {
        return transactionService.submitCancellation(
                myInstitutionId(jwt), body == null ? null : body.reason());
    }

    /** Why they are leaving -- optional, and shown to the reviewing admin. */
    public record CancellationRequest(String reason) {}

    @GetMapping
    public List<PartnershipRequestTransactionDto> list(@AuthenticationPrincipal Jwt jwt) {
        return transactionService.listForInstitution(myInstitutionId(jwt));
    }

    private Long myInstitutionId(Jwt jwt) {
        if (jwt == null) {
            throw new IllegalArgumentException("Authentication is required");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (user.institutionId() == null) {
            throw new IllegalArgumentException("An institution account is required");
        }
        return user.institutionId();
    }
}
