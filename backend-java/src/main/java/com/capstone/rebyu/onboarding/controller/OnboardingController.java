package com.capstone.rebyu.onboarding.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.onboarding.service.OnboardingService;
import com.capstone.rebyu.onboarding.service.OnboardingService.ClaimResult;
import com.capstone.rebyu.onboarding.service.OnboardingService.InvitationView;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/onboarding")
@RequiredArgsConstructor
public class OnboardingController {

    public record CodeRequest(@NotBlank @Size(max = 40) String code) {
    }

    public record InviteRequest(@NotNull Long departmentId, @NotBlank @Email @Size(max = 254) String email) {
    }

    private final OnboardingService onboardingService;
    private final CognitoAuthService auth;

    @PostMapping("/institution")
    public ClaimResult registerInstitution(@AuthenticationPrincipal Jwt jwt,
                                           @Valid @RequestBody CodeRequest request) {
        return onboardingService.registerInstitution(currentUser(jwt), declaredAccountType(jwt), request.code());
    }

    @PostMapping("/department-head/redeem")
    public ClaimResult redeem(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CodeRequest request) {
        return onboardingService.redeemDepartmentHeadCode(currentUser(jwt), declaredAccountType(jwt), request.code());
    }

    @PostMapping("/department-head/invitations")
    public InvitationView invite(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody InviteRequest request) {
        return onboardingService.inviteDepartmentHead(currentUser(jwt), request.departmentId(), request.email());
    }

    @GetMapping("/department-head/invitations")
    public List<InvitationView> list(@AuthenticationPrincipal Jwt jwt, @RequestParam Long departmentId) {
        return onboardingService.listInvitations(currentUser(jwt), departmentId);
    }

    @PutMapping("/department-head/invitations/{invitationId}/cancel")
    public InvitationView cancel(@AuthenticationPrincipal Jwt jwt, @PathVariable Long invitationId) {
        return onboardingService.cancelInvitation(currentUser(jwt), invitationId);
    }

    /** The account type the person chose when signing up (Supabase user_metadata.account_type). */
    private static String declaredAccountType(Jwt jwt) {
        if (jwt != null && jwt.getClaims().get("user_metadata") instanceof java.util.Map<?, ?> metadata) {
            Object type = metadata.get("account_type");
            return type == null ? null : type.toString();
        }
        return null;
    }

    private CurrentUserDto currentUser(Jwt jwt) {
        if (jwt == null) {
            throw new IllegalArgumentException("Authentication is required");
        }
        return auth.syncCurrentUser(jwt, jwt.getTokenValue());
    }
}
