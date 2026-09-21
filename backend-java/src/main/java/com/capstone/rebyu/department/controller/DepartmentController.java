package com.capstone.rebyu.department.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.department.dto.DepartmentDto;
import com.capstone.rebyu.department.service.DepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;
    private final CognitoAuthService auth;

    @GetMapping
    public List<DepartmentDto> getAll(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Long institutionCertId) {
        CurrentUserDto user = institutionUser(jwt);
        return departmentService.getAccessible(
                user.institutionId(), user.userId(), isOwner(user), institutionCertId);
    }

    @GetMapping("/{id}")
    public DepartmentDto getById(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        CurrentUserDto user = institutionUser(jwt);
        return departmentService.getAccessibleById(id, user.institutionId(), user.userId(), isOwner(user));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DepartmentDto create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody DepartmentDto dto) {
        // Never trust institutionId/createdBy from the client body -- a caller
        // could otherwise spoof another tenant or impersonate another user
        // when creating a group. Resolve both from the authenticated caller
        // and overwrite whatever was supplied in the request.
        CurrentUserDto user = institutionUser(jwt);
        requireOwner(user);
        Long institutionId = user.institutionId();
        dto.setInstitutionId(institutionId);
        dto.setCreatedBy(user.userId());
        return departmentService.create(dto);
    }

    @PutMapping("/{id}")
    public DepartmentDto update(
            @AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @Valid @RequestBody DepartmentDto dto) {
        CurrentUserDto user = institutionUser(jwt);
        requireOwner(user);
        return departmentService.update(id, dto, user.institutionId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        CurrentUserDto user = institutionUser(jwt);
        requireOwner(user);
        departmentService.delete(id, user.institutionId());
    }

    private Long myInstitutionId(Jwt jwt) {
        return institutionUser(jwt).institutionId();
    }

    private CurrentUserDto institutionUser(Jwt jwt) {
        if (jwt == null) {
            throw new IllegalArgumentException("Authentication is required");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (user.institutionId() == null) {
            throw new IllegalArgumentException("An institution account is required");
        }
        return user;
    }

    private boolean isOwner(CurrentUserDto user) {
        return "owner".equalsIgnoreCase(user.departmentHeadRole());
    }

    private void requireOwner(CurrentUserDto user) {
        if (!isOwner(user)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Only Institution Administrators can manage groups.");
        }
    }
}
