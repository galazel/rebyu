package com.capstone.rebyu.institution.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.institution.dto.DepartmentHeadDto;
import com.capstone.rebyu.institution.service.DepartmentHeadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/department-heads")
@RequiredArgsConstructor
public class DepartmentHeadController {
    private final DepartmentHeadService departmentHeadService;
    private final CognitoAuthService auth;

    // institutionId in getByInstitutionId is a client-supplied path value with no
    // ownership check possible here yet, so this whole controller is admin-only
    // until a JWT-derived, self-service institution-manager view exists.
    @GetMapping
    public List<DepartmentHeadDto> getAll(@AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return departmentHeadService.getAll();
    }

    @GetMapping("/institution/{institutionId}")
    public List<DepartmentHeadDto> getByInstitutionId(@PathVariable Long institutionId, @AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return departmentHeadService.getByInstitutionId(institutionId);
    }

    @GetMapping("/{id}")
    public DepartmentHeadDto getById(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return departmentHeadService.getById(id);
    }

    private void requireAdmin(Jwt jwt) {
        if (jwt == null) throw new IllegalArgumentException("Authentication is required");
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (!"ADMIN".equalsIgnoreCase(user.role())) throw new IllegalArgumentException("Admin access is required");
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DepartmentHeadDto create(@Valid @RequestBody DepartmentHeadDto dto, @AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return departmentHeadService.create(dto);
    }

    @PutMapping("/{id}")
    public DepartmentHeadDto update(@PathVariable Long id, @Valid @RequestBody DepartmentHeadDto dto, @AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return departmentHeadService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        departmentHeadService.delete(id);
    }
}
