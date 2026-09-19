package com.capstone.rebyu.institution.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.institution.dto.InstitutionCertificateDto;
import com.capstone.rebyu.institution.service.InstitutionCertificateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/institution-certificates")
@RequiredArgsConstructor
public class InstitutionCertificateController {
    private final InstitutionCertificateService institutionCertificateService;
    private final CognitoAuthService auth;

    // Cross-tenant allocation data: the unfiltered list exposes every institution's
    // certificate allocations, so it's admin-only. Institutions read their own via
    // /api/institution/me/overview; learners via /api/learners/me/portal.
    @GetMapping
    public List<InstitutionCertificateDto> getAll(@AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return institutionCertificateService.getAll();
    }

    @GetMapping("/{id}")
    public InstitutionCertificateDto getById(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return institutionCertificateService.getById(id);
    }

    private void requireAdmin(Jwt jwt) {
        if (jwt == null) throw new IllegalArgumentException("Authentication is required");
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (!"ADMIN".equalsIgnoreCase(user.role())) throw new IllegalArgumentException("Admin access is required");
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InstitutionCertificateDto create(@Valid @RequestBody InstitutionCertificateDto dto, @AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return institutionCertificateService.create(dto);
    }

    @PutMapping("/{id}")
    public InstitutionCertificateDto update(@PathVariable Long id, @Valid @RequestBody InstitutionCertificateDto dto, @AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return institutionCertificateService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        institutionCertificateService.delete(id);
    }
}
