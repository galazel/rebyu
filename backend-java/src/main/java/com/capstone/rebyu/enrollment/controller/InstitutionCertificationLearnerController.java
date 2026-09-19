package com.capstone.rebyu.enrollment.controller;


import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.enrollment.dto.InstitutionCertificationLearnerDto;
import com.capstone.rebyu.enrollment.service.InstitutionCertificationLearnerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/institution-certification-learners")
@RequiredArgsConstructor
public class InstitutionCertificationLearnerController {
    private final InstitutionCertificationLearnerService institutionCertificationLearnerService;
    private final CognitoAuthService auth;

    // Cross-tenant learner-allocation data: the unfiltered list exposes which learners
    // hold which certifications across every institution, so it's admin-only.
    @GetMapping
    public List<InstitutionCertificationLearnerDto> getAll(@AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return institutionCertificationLearnerService.getAll();
    }

    @GetMapping("/{id}")
    public InstitutionCertificationLearnerDto getById(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return institutionCertificationLearnerService.getById(id);
    }

    private void requireAdmin(Jwt jwt) {
        if (jwt == null) throw new IllegalArgumentException("Authentication is required");
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (!"ADMIN".equalsIgnoreCase(user.role())) throw new IllegalArgumentException("Admin access is required");
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InstitutionCertificationLearnerDto create(@Valid @RequestBody InstitutionCertificationLearnerDto dto,
                                                        @AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return institutionCertificationLearnerService.create(dto);
    }

    @PutMapping("/{id}")
    public InstitutionCertificationLearnerDto update(@PathVariable Long id,
                                                        @Valid @RequestBody InstitutionCertificationLearnerDto dto,
                                                        @AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return institutionCertificationLearnerService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        institutionCertificationLearnerService.delete(id);
    }
}
